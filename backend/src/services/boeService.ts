import { AppDataSource } from '../config/database';
import { BOEVersion } from '../entities/BOEVersion';
import { BOEElement } from '../entities/BOEElement';
import { BOETemplate } from '../entities/BOETemplate';
import { BOETemplateElement } from '../entities/BOETemplateElement';
import { ManagementReserve } from '../entities/ManagementReserve';
import { Program } from '../entities/Program';

const boeVersionRepository = AppDataSource.getRepository(BOEVersion);
const boeElementRepository = AppDataSource.getRepository(BOEElement);
const boeTemplateRepository = AppDataSource.getRepository(BOETemplate);
const boeTemplateElementRepository = AppDataSource.getRepository(BOETemplateElement);
const managementReserveRepository = AppDataSource.getRepository(ManagementReserve);
const programRepository = AppDataSource.getRepository(Program);

export class BOEService {
  /**
   * Calculate total estimated cost for a BOE version
   */
  static async calculateTotalEstimatedCost(boeVersionId: string): Promise<number> {
    const elements = await boeElementRepository.find({
      where: { boeVersion: { id: boeVersionId } }
    });

    return elements.reduce((total, element) => total + (element.estimatedCost || 0), 0);
  }

  /**
   * Calculate management reserve based on industry standards
   */
  static calculateManagementReserve(totalCost: number, method: 'Standard' | 'Risk-Based' | 'Custom' = 'Standard', customPercentage?: number): {
    amount: number;
    percentage: number;
  } {
    let percentage: number;

    switch (method) {
      case 'Standard':
        // Industry standard: 5-15% based on project complexity
        percentage = totalCost > 1000000 ? 10 : totalCost > 500000 ? 12 : 15;
        break;
      case 'Risk-Based':
        // Risk-based calculation (simplified)
        percentage = totalCost > 1000000 ? 8 : totalCost > 500000 ? 10 : 12;
        break;
      case 'Custom':
        percentage = customPercentage || 10;
        break;
      default:
        percentage = 10;
    }

    const amount = (totalCost * percentage) / 100;

    return {
      amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      percentage: Math.round(percentage * 100) / 100
    };
  }

  /**
   * Create BOE from template
   */
  static async createBOEFromTemplate(programId: string, templateId: string, versionData: any): Promise<BOEVersion> {
    const program = await programRepository.findOne({ where: { id: programId } });
    if (!program) {
      throw new Error('Program not found');
    }

    const template = await boeTemplateRepository.findOne({
      where: { id: templateId },
      relations: ['elements']
    });
    if (!template) {
      throw new Error('BOE template not found');
    }

    // Create BOE version
    const boeVersion = boeVersionRepository.create({
      ...versionData,
      program,
      templateId,
      status: 'Draft',
      totalEstimatedCost: 0,
      managementReserveAmount: 0,
      managementReservePercentage: 0
    });

    const savedBOE = await boeVersionRepository.save(boeVersion);

    // Create BOE elements from template
    const templateElements = template.elements || [];
    for (const templateElement of templateElements) {
      const boeElement = new BOEElement();
      boeElement.code = templateElement.code;
      boeElement.name = templateElement.name;
      boeElement.description = templateElement.description;
      boeElement.level = templateElement.level;
      boeElement.parentElementId = templateElement.parentElementId;
      boeElement.costCategoryId = templateElement.costCategoryId;
      boeElement.estimatedCost = templateElement.estimatedCost || 0;
      boeElement.managementReservePercentage = templateElement.managementReservePercentage;
      boeElement.isRequired = templateElement.isRequired;
      boeElement.isOptional = templateElement.isOptional;
      boeElement.notes = templateElement.notes;
      boeElement.boeVersion = savedBOE;

      await boeElementRepository.save(boeElement);
    }

    // Calculate totals
    const totalCost = await this.calculateTotalEstimatedCost(savedBOE.id);
    const managementReserve = this.calculateManagementReserve(totalCost);

    // Update BOE version with calculated values
    savedBOE.totalEstimatedCost = totalCost;
    savedBOE.managementReserveAmount = managementReserve.amount;
    savedBOE.managementReservePercentage = managementReserve.percentage;

    const updatedBOE = await boeVersionRepository.save(savedBOE);

    // Create management reserve record
    const mrRecord = new ManagementReserve();
    mrRecord.baselineAmount = managementReserve.amount;
    mrRecord.baselinePercentage = managementReserve.percentage;
    mrRecord.adjustedAmount = managementReserve.amount;
    mrRecord.adjustedPercentage = managementReserve.percentage;
    mrRecord.calculationMethod = 'Standard';
    mrRecord.boeVersion = updatedBOE;

    await managementReserveRepository.save(mrRecord);

    return updatedBOE;
  }

  /**
   * Update BOE calculations when elements change
   */
  static async updateBOECalculations(boeVersionId: string): Promise<void> {
    const boeVersion = await boeVersionRepository.findOne({
      where: { id: boeVersionId }
    });

    if (!boeVersion) {
      throw new Error('BOE version not found');
    }

    // Recalculate total cost
    const totalCost = await this.calculateTotalEstimatedCost(boeVersionId);
    
    // Recalculate management reserve
    const managementReserve = this.calculateManagementReserve(totalCost);

    // Update BOE version
    boeVersion.totalEstimatedCost = totalCost;
    boeVersion.managementReserveAmount = managementReserve.amount;
    boeVersion.managementReservePercentage = managementReserve.percentage;
    boeVersion.updatedAt = new Date();

    await boeVersionRepository.save(boeVersion);

    // Update management reserve record
    const mrRecord = await managementReserveRepository.findOne({
      where: { boeVersion: { id: boeVersionId } }
    });

    if (mrRecord) {
      mrRecord.adjustedAmount = managementReserve.amount;
      mrRecord.adjustedPercentage = managementReserve.percentage;
      mrRecord.remainingAmount = managementReserve.amount - mrRecord.utilizedAmount;
      mrRecord.updatedAt = new Date();
      await managementReserveRepository.save(mrRecord);
    }
  }

  /**
   * Get BOE summary for a program
   */
  static async getBOESummary(programId: string): Promise<any> {
    const program = await programRepository.findOne({
      where: { id: programId },
      relations: ['boeVersions', 'boeVersions.elements']
    });

    if (!program) {
      throw new Error('Program not found');
    }

    const currentBOE = program.boeVersions?.find(v => v.id === program.currentBOEVersionId) ||
                      (program.boeVersions && program.boeVersions.length > 0 ? 
                       program.boeVersions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : 
                       null);

    if (!currentBOE) {
      return {
        hasBOE: false,
        program: {
          id: program.id,
          name: program.name,
          code: program.code
        }
      };
    }

    const elements = currentBOE.elements || [];
    const totalElements = elements.length;
    const requiredElements = elements.filter(e => e.isRequired).length;
    const optionalElements = elements.filter(e => e.isOptional).length;

    return {
      hasBOE: true,
      program: {
        id: program.id,
        name: program.name,
        code: program.code
      },
      currentBOE: {
        id: currentBOE.id,
        versionNumber: currentBOE.versionNumber,
        name: currentBOE.name,
        status: currentBOE.status,
        totalEstimatedCost: currentBOE.totalEstimatedCost,
        managementReserveAmount: currentBOE.managementReserveAmount,
        managementReservePercentage: currentBOE.managementReservePercentage,
        createdAt: currentBOE.createdAt,
        updatedAt: currentBOE.updatedAt
      },
      summary: {
        totalElements,
        requiredElements,
        optionalElements,
        totalCost: currentBOE.totalEstimatedCost,
        managementReserve: currentBOE.managementReserveAmount,
        totalWithMR: currentBOE.totalEstimatedCost + currentBOE.managementReserveAmount
      }
    };
  }

  /**
   * Validate BOE structure
   */
  static async validateBOEStructure(boeVersionId: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const elements = await boeElementRepository.find({
      where: { boeVersion: { id: boeVersionId } },
      relations: ['costCategory']
    });

    // Check for required elements
    const requiredElements = elements.filter(e => e.isRequired);
    for (const element of requiredElements) {
      if (!element.estimatedCost || element.estimatedCost <= 0) {
        errors.push(`Required element "${element.name}" has no estimated cost`);
      }
      if (!element.costCategory) {
        errors.push(`Required element "${element.name}" has no cost category assigned`);
      }
    }

    // Check for hierarchical structure
    const rootElements = elements.filter(e => !e.parentElementId);
    if (rootElements.length === 0) {
      errors.push('BOE must have at least one root element');
    }

    // Check for duplicate codes
    const codes = elements.map(e => e.code);
    const duplicateCodes = codes.filter((code, index) => codes.indexOf(code) !== index);
    if (duplicateCodes.length > 0) {
      errors.push(`Duplicate element codes found: ${duplicateCodes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 