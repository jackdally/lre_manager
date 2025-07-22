import { AppDataSource } from '../config/database';
import { BOEVersion } from '../entities/BOEVersion';
import { BOEElement } from '../entities/BOEElement';
import { BOETemplate } from '../entities/BOETemplate';
import { BOETemplateElement } from '../entities/BOETemplateElement';
import { ManagementReserve } from '../entities/ManagementReserve';
import { Program } from '../entities/Program';
import { LedgerEntry } from '../entities/LedgerEntry';
import { WbsTemplate } from '../entities/WbsTemplate';
import { WbsTemplateElement } from '../entities/WbsTemplateElement';
import { WbsElement } from '../entities/WbsElement';

const boeVersionRepository = AppDataSource.getRepository(BOEVersion);
const boeElementRepository = AppDataSource.getRepository(BOEElement);
const boeTemplateRepository = AppDataSource.getRepository(BOETemplate);
const boeTemplateElementRepository = AppDataSource.getRepository(BOETemplateElement);
const managementReserveRepository = AppDataSource.getRepository(ManagementReserve);
const programRepository = AppDataSource.getRepository(Program);
const ledgerRepository = AppDataSource.getRepository(LedgerEntry);
const wbsTemplateRepository = AppDataSource.getRepository(WbsTemplate);
const wbsTemplateElementRepository = AppDataSource.getRepository(WbsTemplateElement);
const wbsElementRepository = AppDataSource.getRepository(WbsElement);

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

    const amount = totalCost > 0 ? (totalCost * percentage) / 100 : 0;

    return {
      amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      percentage: Math.round(percentage * 100) / 100
    };
  }

  /**
   * Create BOE from template
   */
  static async createBOEFromTemplate(programId: string, templateId: string, versionData: any): Promise<any> {
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
    const boeVersionEntity = Array.isArray(savedBOE) ? savedBOE[0] : savedBOE;

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
      boeElement.boeVersion = boeVersionEntity;

      await boeElementRepository.save(boeElement);
    }

    // Calculate totals
    const totalCost = await this.calculateTotalEstimatedCost(boeVersionEntity.id);
    const managementReserve = this.calculateManagementReserve(totalCost);

    // Update BOE version with calculated values
    boeVersionEntity.totalEstimatedCost = totalCost;
    boeVersionEntity.managementReserveAmount = managementReserve.amount;
    boeVersionEntity.managementReservePercentage = managementReserve.percentage;

    const updatedBOE = await boeVersionRepository.save(boeVersionEntity);
    const updatedBOEEntity = Array.isArray(updatedBOE) ? updatedBOE[0] : updatedBOE;

    // Create management reserve record
    const mrRecord = new ManagementReserve();
    mrRecord.baselineAmount = managementReserve.amount;
    mrRecord.baselinePercentage = managementReserve.percentage;
    mrRecord.adjustedAmount = managementReserve.amount;
    mrRecord.adjustedPercentage = managementReserve.percentage;
    mrRecord.calculationMethod = 'Standard';
    mrRecord.boeVersion = updatedBOEEntity;

    await managementReserveRepository.save(mrRecord);

    return updatedBOEEntity;
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

    // Update BOE version - ensure we have valid numeric values
    boeVersion.totalEstimatedCost = totalCost || 0;
    boeVersion.managementReserveAmount = managementReserve.amount || 0;
    boeVersion.managementReservePercentage = managementReserve.percentage || 0;
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

  /**
   * Push entire BOE to ledger as baseline budget entries
   */
  static async pushBOEToLedger(boeVersionId: string): Promise<{ success: boolean; entriesCreated: number; message: string }> {
    const boeVersion = await boeVersionRepository.findOne({
      where: { id: boeVersionId },
      relations: ['program', 'elements', 'elements.costCategory', 'elements.vendor']
    });

    if (!boeVersion) {
      throw new Error('BOE version not found');
    }

    if (boeVersion.status === 'Approved') {
      throw new Error('Cannot push approved BOE to ledger - create a new version first');
    }

    // Get all BOE elements
    const elements = boeVersion.elements || [];
    let entriesCreated = 0;

    // Create ledger entries for each BOE element
    for (const element of elements) {
      if (element.estimatedCost > 0) {
        const ledgerEntry = ledgerRepository.create({
          vendor_name: element.vendor?.name || 'BOE Element',
          expense_description: `${element.name}: ${element.description}`,
          wbsElementId: element.id,
          costCategoryId: element.costCategoryId,
          baseline_date: boeVersion.program.startDate?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10),
          baseline_amount: element.estimatedCost,
          planned_date: boeVersion.program.startDate?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10),
          planned_amount: element.estimatedCost,
          program: boeVersion.program,
          notes: `BOE Element: ${element.code} - ${element.name}`
        });

        await ledgerRepository.save(ledgerEntry);
        entriesCreated++;
      }
    }

    // Update BOE status to indicate it's been pushed to ledger
    boeVersion.status = 'Baseline';
    boeVersion.updatedAt = new Date();
    await boeVersionRepository.save(boeVersion);

    return {
      success: true,
      entriesCreated,
      message: `Successfully created ${entriesCreated} ledger entries from BOE`
    };
  }

  /**
   * Import WBS template into BOE
   */
  static async importWBSTemplateIntoBOE(boeVersionId: string, wbsTemplateId: string, userId?: string): Promise<{
    success: boolean;
    elementsCreated: number;
    message: string;
    importedElements: BOEElement[];
  }> {
    const boeVersion = await boeVersionRepository.findOne({
      where: { id: boeVersionId },
      relations: ['program']
    });

    if (!boeVersion) {
      throw new Error('BOE version not found');
    }

    // Get the WBS template with all its elements
    const wbsTemplate = await wbsTemplateRepository.findOne({
      where: { id: wbsTemplateId },
      relations: ['elements', 'elements.children']
    });

    if (!wbsTemplate) {
      throw new Error('WBS template not found');
    }

    // Check if BOE already has elements
    const existingElements = await boeElementRepository.find({
      where: { boeVersion: { id: boeVersionId } }
    });

    if (existingElements.length > 0) {
      throw new Error('Cannot import WBS template into BOE that already has elements. Please clear existing elements first.');
    }

    // Import template elements into BOE
    const importedElements: BOEElement[] = [];
    const elementMap = new Map<string, string>(); // template element ID -> new element ID

    // First pass: create all elements without parent relationships
    for (const templateElement of wbsTemplate.elements) {
      const boeElement = new BOEElement();
      boeElement.code = templateElement.code;
      boeElement.name = templateElement.name;
      boeElement.description = templateElement.description;
      boeElement.level = templateElement.level;
      boeElement.estimatedCost = 0; // Start with zero cost
      boeElement.actualCost = 0;
      boeElement.variance = 0;
      boeElement.managementReserveAmount = 0;
      boeElement.isRequired = true; // Default to required
      boeElement.isOptional = false;
      boeElement.notes = `Imported from WBS template: ${wbsTemplate.name}`;
      boeElement.assumptions = null;
      boeElement.risks = null;
      boeElement.boeVersion = boeVersion;

      const savedElement = await boeElementRepository.save(boeElement);
      elementMap.set(templateElement.id, savedElement.id);
      importedElements.push(savedElement);
    }

    // Second pass: establish parent-child relationships
    for (const templateElement of wbsTemplate.elements) {
      if (templateElement.parentId) {
        const newElementId = elementMap.get(templateElement.id);
        const newParentId = elementMap.get(templateElement.parentId);
        
        if (newElementId && newParentId) {
          await boeElementRepository.update(newElementId, {
            parentElementId: newParentId
          });
        }
      }
    }

    // Update BOE version to track the imported template
    boeVersion.templateId = wbsTemplateId;
    boeVersion.updatedAt = new Date();
    await boeVersionRepository.save(boeVersion);

    // Recalculate BOE totals
    await this.updateBOECalculations(boeVersionId);

    return {
      success: true,
      elementsCreated: importedElements.length,
      message: `Successfully imported ${importedElements.length} elements from WBS template "${wbsTemplate.name}"`,
      importedElements
    };
  }

  /**
   * Clear all elements from a BOE version
   */
  static async clearBOEElements(boeVersionId: string): Promise<{
    success: boolean;
    elementsDeleted: number;
    message: string;
  }> {
    const boeVersion = await boeVersionRepository.findOne({
      where: { id: boeVersionId }
    });

    if (!boeVersion) {
      throw new Error('BOE version not found');
    }

    // Delete all BOE elements for this version
    const deleteResult = await boeElementRepository.delete({
      boeVersion: { id: boeVersionId }
    });

    // Update BOE version to reflect the change
    boeVersion.updatedAt = new Date();
    await boeVersionRepository.save(boeVersion);

    // Recalculate totals (should be zero now)
    await this.updateBOECalculations(boeVersionId);

    return {
      success: true,
      elementsDeleted: deleteResult.affected || 0,
      message: `Successfully cleared ${deleteResult.affected || 0} elements from BOE`
    };
  }

  /**
   * Push BOE WBS structure to program WBS
   */
  static async pushBOEWBSToProgram(boeVersionId: string, userId?: string): Promise<{
    success: boolean;
    elementsCreated: number;
    elementsUpdated: number;
    message: string;
  }> {
    const boeVersion = await boeVersionRepository.findOne({
      where: { id: boeVersionId },
      relations: ['program', 'elements', 'elements.costCategory', 'elements.vendor']
    });

    if (!boeVersion) {
      throw new Error('BOE version not found');
    }

    if (boeVersion.status !== 'Approved' && boeVersion.status !== 'Baseline') {
      throw new Error('Can only push approved or baseline BOE to program WBS');
    }

    const program = boeVersion.program;
    const boeElements = boeVersion.elements || [];
    
    // Get existing program WBS elements
    const existingWbsElements = await wbsElementRepository.find({
      where: { program: { id: program.id } }
    });

    let elementsCreated = 0;
    let elementsUpdated = 0;
    const elementMap = new Map<string, string>(); // BOE element ID -> WBS element ID

    // First pass: create or update WBS elements
    for (const boeElement of boeElements) {
      // Check if WBS element already exists with same code
      const existingWbsElement = existingWbsElements.find(e => e.code === boeElement.code);
      
      if (existingWbsElement) {
        // Update existing WBS element with BOE data
        await wbsElementRepository.update(existingWbsElement.id, {
          name: boeElement.name,
          description: boeElement.description,
          level: boeElement.level,
          updatedAt: new Date()
        });
        elementMap.set(boeElement.id, existingWbsElement.id);
        elementsUpdated++;
      } else {
        // Create new WBS element
        const newWbsElement = wbsElementRepository.create({
          code: boeElement.code,
          name: boeElement.name,
          description: boeElement.description,
          level: boeElement.level,
          program: program
        });

        const savedWbsElement = await wbsElementRepository.save(newWbsElement);
        elementMap.set(boeElement.id, savedWbsElement.id);
        elementsCreated++;
      }
    }

    // Second pass: establish parent-child relationships
    for (const boeElement of boeElements) {
      if (boeElement.parentElementId) {
        const wbsElementId = elementMap.get(boeElement.id);
        const wbsParentId = elementMap.get(boeElement.parentElementId);
        
        if (wbsElementId && wbsParentId) {
          await wbsElementRepository.update(wbsElementId, {
            parentId: wbsParentId
          });
        }
      }
    }

    // Update BOE version status to indicate it's been pushed to program
    boeVersion.status = 'PushedToProgram';
    boeVersion.updatedAt = new Date();
    await boeVersionRepository.save(boeVersion);

    return {
      success: true,
      elementsCreated,
      elementsUpdated,
      message: `Successfully pushed BOE WBS to program: ${elementsCreated} new elements created, ${elementsUpdated} elements updated`
    };
  }
} 