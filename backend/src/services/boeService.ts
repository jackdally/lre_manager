import { AppDataSource } from '../config/database';
import { BOEVersion } from '../entities/BOEVersion';
import { BOEElement } from '../entities/BOEElement';
import { BOETemplate } from '../entities/BOETemplate';
import { BOETemplateElement } from '../entities/BOETemplateElement';
import { BOEApproval } from '../entities/BOEApproval';
import { ManagementReserve } from '../entities/ManagementReserve';
import { Program } from '../entities/Program';
import { LedgerEntry } from '../entities/LedgerEntry';
import { WbsTemplate } from '../entities/WbsTemplate';
import { WbsTemplateElement } from '../entities/WbsTemplateElement';
import { WbsElement } from '../entities/WbsElement';
import { BOEElementAllocation } from '../entities/BOEElementAllocation';
import { LedgerAuditTrailService } from './ledgerAuditTrailService';
import { AuditSource } from '../entities/LedgerAuditTrail';
import { BOEElementAllocationService } from './boeElementAllocationService';
import { BOEValidationService } from './boeValidationService';
import { ProgramSetupService } from './programSetupService';

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
const elementAllocationRepository = AppDataSource.getRepository(BOEElementAllocation);
const boeApprovalRepository = AppDataSource.getRepository(BOEApproval);

export class BOEService {
  /**
   * Calculate total estimated cost for a BOE version
   */
  static async calculateTotalEstimatedCost(boeVersionId: string): Promise<number> {
    const elements = await boeElementRepository.find({
      where: { boeVersion: { id: boeVersionId } }
    });

    return elements.reduce((total, element) => total + (Number(element.estimatedCost) || 0), 0);
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
      amount: Math.round(Number(amount) * 100) / 100, // Round to 2 decimal places
      percentage: Math.round(Number(percentage) * 100) / 100
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
   * Create BOE from template with allocations
   */
  static async createBOEFromTemplateWithAllocations(
    programId: string, 
    templateId: string, 
    versionData: any,
    allocations: any[]
  ): Promise<any> {
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
    const createdElements: BOEElement[] = [];
    
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

      const savedElement = await boeElementRepository.save(boeElement);
      createdElements.push(savedElement);
    }

    // Create allocations for elements
    if (allocations && allocations.length > 0) {
      for (const allocationData of allocations) {
        // Find the corresponding BOE element
        const boeElement = createdElements.find(element => element.name === allocationData.elementName);
        
        if (boeElement) {
          // Calculate monthly breakdown
          const startDate = new Date(allocationData.startDate);
          const endDate = new Date(allocationData.endDate);
          const numberOfMonths = this.calculateNumberOfMonths(startDate, endDate);
          const monthlyAmount = allocationData.totalAmount / numberOfMonths;

          const monthlyBreakdown = this.generateMonthlyBreakdown(
            allocationData.totalAmount,
            null, // no quantity for now
            startDate,
            endDate,
            allocationData.allocationType
          );

          const elementAllocation = elementAllocationRepository.create({
            name: allocationData.name || `${boeElement.name} Allocation`,
            description: allocationData.description || `Monthly allocation for ${boeElement.name}`,
            totalAmount: allocationData.totalAmount,
            allocationType: allocationData.allocationType,
            startDate: allocationData.startDate,
            endDate: allocationData.endDate,
            numberOfMonths,
            monthlyAmount,
            isActive: true,
            isLocked: false,
            notes: allocationData.notes || '',
            assumptions: '',
            risks: '',
            boeElement,
            boeVersion: boeVersionEntity,
            monthlyBreakdown
          });

          await elementAllocationRepository.save(elementAllocation);
        }
      }
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
   * Calculate number of months between two dates
   */
  static calculateNumberOfMonths(startDate: Date, endDate: Date): number {
    // Calculate inclusive months from start to end
    // For Jan 1 to Dec 31, we want 12 months (Jan through Dec)
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();
    
    // Calculate the difference in months
    const months = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    return Math.max(1, months); // Ensure at least 1 month
  }

  /**
   * Generate monthly breakdown based on allocation type
   */
  static generateMonthlyBreakdown(
    totalAmount: number,
    totalQuantity: number | null,
    startDate: Date,
    endDate: Date,
    allocationType: 'Linear' | 'Front-Loaded' | 'Back-Loaded' | 'Custom'
  ): { [month: string]: any } {
    const breakdown: { [month: string]: any } = {};

    // First, build the list of month keys we'll actually process
    const monthKeys: string[] = [];
    const endMonthKey = endDate.toISOString().slice(0, 7); // YYYY-MM format
    let currentDate = new Date(startDate);
    
    // Build complete list of months first
    while (true) {
      const monthKey = currentDate.toISOString().slice(0, 7);
      if (monthKey > endMonthKey) {
        break;
      }
      monthKeys.push(monthKey);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    const numberOfMonths = monthKeys.length;
    if (numberOfMonths === 0) {
      return breakdown;
    }

    let remainingAmount = totalAmount;
    let remainingQuantity = totalQuantity;

    // Now iterate through the month keys
    for (let i = 0; i < monthKeys.length; i++) {
      const monthKey = monthKeys[i];
      const monthDate = new Date(monthKey + '-01'); // First day of month
      
      let monthlyAmount: number;
      let monthlyQuantity: number | null = null;

      switch (allocationType) {
        case 'Linear':
          monthlyAmount = totalAmount / numberOfMonths;
          monthlyQuantity = totalQuantity ? totalQuantity / numberOfMonths : null;
          break;
        case 'Front-Loaded':
          // 60% in first 30% of months, 30% in middle 40%, 10% in last 30%
          if (i < Math.ceil(numberOfMonths * 0.3)) {
            monthlyAmount = (totalAmount * 0.6) / Math.ceil(numberOfMonths * 0.3);
            monthlyQuantity = totalQuantity ? (totalQuantity * 0.6) / Math.ceil(numberOfMonths * 0.3) : null;
          } else if (i < Math.ceil(numberOfMonths * 0.7)) {
            monthlyAmount = (totalAmount * 0.3) / (Math.ceil(numberOfMonths * 0.7) - Math.ceil(numberOfMonths * 0.3));
            monthlyQuantity = totalQuantity ? (totalQuantity * 0.3) / (Math.ceil(numberOfMonths * 0.7) - Math.ceil(numberOfMonths * 0.3)) : null;
          } else {
            monthlyAmount = (totalAmount * 0.1) / (numberOfMonths - Math.ceil(numberOfMonths * 0.7));
            monthlyQuantity = totalQuantity ? (totalQuantity * 0.1) / (numberOfMonths - Math.ceil(numberOfMonths * 0.7)) : null;
          }
          break;
        case 'Back-Loaded':
          // 10% in first 30% of months, 30% in middle 40%, 60% in last 30%
          if (i < Math.ceil(numberOfMonths * 0.3)) {
            monthlyAmount = (totalAmount * 0.1) / Math.ceil(numberOfMonths * 0.3);
            monthlyQuantity = totalQuantity ? (totalQuantity * 0.1) / Math.ceil(numberOfMonths * 0.3) : null;
          } else if (i < Math.ceil(numberOfMonths * 0.7)) {
            monthlyAmount = (totalAmount * 0.3) / (Math.ceil(numberOfMonths * 0.7) - Math.ceil(numberOfMonths * 0.3));
            monthlyQuantity = totalQuantity ? (totalQuantity * 0.3) / (Math.ceil(numberOfMonths * 0.7) - Math.ceil(numberOfMonths * 0.3)) : null;
          } else {
            monthlyAmount = (totalAmount * 0.6) / (numberOfMonths - Math.ceil(numberOfMonths * 0.7));
            monthlyQuantity = totalQuantity ? (totalQuantity * 0.6) / (numberOfMonths - Math.ceil(numberOfMonths * 0.7)) : null;
          }
          break;
        case 'Custom':
          // For custom, we'll use linear as default and allow manual adjustment
          monthlyAmount = totalAmount / numberOfMonths;
          monthlyQuantity = totalQuantity ? totalQuantity / numberOfMonths : null;
          break;
        default:
          monthlyAmount = totalAmount / numberOfMonths;
          monthlyQuantity = totalQuantity ? totalQuantity / numberOfMonths : null;
      }

      // Ensure we don't exceed remaining amounts
      monthlyAmount = Math.min(monthlyAmount, remainingAmount);
      remainingAmount -= monthlyAmount;

      if (monthlyQuantity && remainingQuantity) {
        monthlyQuantity = Math.min(monthlyQuantity, remainingQuantity);
        remainingQuantity -= monthlyQuantity;
      }

      breakdown[monthKey] = {
        amount: Math.round(monthlyAmount * 100) / 100, // Round to 2 decimal places
        quantity: monthlyQuantity ? Math.round(monthlyQuantity * 100) / 100 : null,
        date: monthDate.toISOString().slice(0, 10),
        isLocked: false
      };
    }

    return breakdown;
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
    boeVersion.totalEstimatedCost = Number(totalCost) || 0;
    boeVersion.managementReserveAmount = Number(managementReserve.amount) || 0;
    boeVersion.managementReservePercentage = Number(managementReserve.percentage) || 0;
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
      relations: ['boeVersions', 'boeVersions.elements', 'boeVersions.elements.costCategory', 'boeVersions.elements.vendor']
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

    // Build hierarchical structure for cost calculation
    const elementMap = new Map<string, any>();
    const rootElements: any[] = [];
    
    elements.forEach(element => {
      elementMap.set(element.id, { ...element, childElements: [] });
    });
    
    elements.forEach(element => {
      const mappedElement = elementMap.get(element.id)!;
      if (element.parentElementId) {
        const parent = elementMap.get(element.parentElementId);
        if (parent) {
          parent.childElements = parent.childElements || [];
          parent.childElements.push(mappedElement);
        }
      } else {
        rootElements.push(mappedElement);
      }
    });

    // Helper to calculate aggregated cost from children (sum of all leaf descendants)
    const calculateAggregatedCost = (element: any): number => {
      const hasChildren = element.childElements && element.childElements.length > 0;
      
      if (!hasChildren) {
        // Leaf element: return its own cost
        return Number(element.estimatedCost) || 0;
      }
      
      // Parent element: sum all leaf descendants
      let total = 0;
      const sumLeafCosts = (children: any[]) => {
        children.forEach((el: any) => {
          const isLeaf = !el.childElements || el.childElements.length === 0;
          if (isLeaf) {
            total += Number(el.estimatedCost) || 0;
          } else {
            // Recursively process children
            sumLeafCosts(el.childElements);
          }
        });
      };
      
      sumLeafCosts(element.childElements);
      return total;
    };

    // Build a set of parent element IDs (elements that have children)
    const parentElementIds = new Set<string>();
    elements.forEach(element => {
      if (element.parentElementId) {
        parentElementIds.add(element.parentElementId);
      }
    });

    // Helper to check if an element is a leaf (has no children)
    const isLeafElement = (element: any): boolean => {
      return !parentElementIds.has(element.id);
    };

    // Check for required elements - only validate leaf elements for cost categories
    const requiredElements = elements.filter(e => e.isRequired);
    for (const element of requiredElements) {
      const isLeaf = isLeafElement(element);
      
      // Cost validation: only check leaf elements
      if (isLeaf) {
        if (!element.estimatedCost || element.estimatedCost <= 0) {
          errors.push(`Required element "${element.code} ${element.name}" has no estimated cost`);
        }
        if (!element.costCategory) {
          errors.push(`Required element "${element.code} ${element.name}" has no cost category assigned`);
        }
      } else {
        // For parent elements, calculate aggregated cost from children and validate that
        const hierarchicalElement = elementMap.get(element.id);
        if (hierarchicalElement) {
          const aggregatedCost = calculateAggregatedCost(hierarchicalElement);
          if (aggregatedCost <= 0) {
            errors.push(`Required element "${element.code} ${element.name}" has no estimated cost`);
          }
        }
        // Don't require cost category on parents
      }
    }

    // Check for hierarchical structure
    const rootElementsList = elements.filter(e => !e.parentElementId);
    if (rootElementsList.length === 0) {
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
   * Create BOE with manual elements and allocations
   */
  static async createBOEWithElements(
    programId: string,
    versionData: any,
    elements: any[],
    allocations: any[]
  ): Promise<any> {
    const program = await programRepository.findOne({ where: { id: programId } });
    if (!program) {
      throw new Error('Program not found');
    }

    // Create BOE version
    const boeVersion = boeVersionRepository.create({
      ...versionData,
      program,
      status: 'Draft',
      totalEstimatedCost: 0,
      managementReserveAmount: 0,
      managementReservePercentage: 0
    });

    const savedBOE = await boeVersionRepository.save(boeVersion);
    const boeVersionEntity = Array.isArray(savedBOE) ? savedBOE[0] : savedBOE;

    // Create BOE elements
    const createdElements: BOEElement[] = [];
    const elementIdMapping: { [tempId: string]: string } = {}; // Map temp IDs to database IDs
    
    for (const elementData of elements) {
      const boeElement = new BOEElement();
      boeElement.code = elementData.code;
      boeElement.name = elementData.name;
      boeElement.description = elementData.description;
      boeElement.level = elementData.level || 1;
      // Defer setting parentElementId until all elements are created
      boeElement.parentElementId = undefined;
      boeElement.costCategoryId = elementData.costCategoryId || null;
      boeElement.vendorId = elementData.vendorId || null;
      boeElement.estimatedCost = elementData.estimatedCost || 0;
      boeElement.isRequired = elementData.isRequired !== undefined ? elementData.isRequired : true;
      boeElement.isOptional = elementData.isOptional !== undefined ? elementData.isOptional : false;
      boeElement.notes = elementData.notes || '';
      boeElement.boeVersion = boeVersionEntity;

      const savedElement = await boeElementRepository.save(boeElement);
      createdElements.push(savedElement);
      
      // Store mapping from temp ID to database ID
      if (elementData.id) {
        elementIdMapping[elementData.id] = savedElement.id;
      }
    }

    // Second pass: update parent relationships using the mapping
    for (const elementData of elements) {
      if (elementData.id && elementData.parentElementId) {
        const childDbId = elementIdMapping[elementData.id];
        const parentDbId = elementIdMapping[elementData.parentElementId];
        if (childDbId && parentDbId) {
          await boeElementRepository.update(childDbId, {
            parentElementId: parentDbId
          });
        }
      }
    }

    // Create allocations for elements
    if (allocations && allocations.length > 0) {
      for (const allocationData of allocations) {
        // Find the corresponding BOE element using the ID mapping
        const databaseElementId = elementIdMapping[allocationData.elementId];
        const boeElement = createdElements.find(element => element.id === databaseElementId);
        
        if (boeElement) {
          // Calculate monthly breakdown
          const startDate = new Date(allocationData.startDate);
          const endDate = new Date(allocationData.endDate);
          const numberOfMonths = this.calculateNumberOfMonths(startDate, endDate);
          const monthlyAmount = allocationData.totalAmount / numberOfMonths;

          const monthlyBreakdown = this.generateMonthlyBreakdown(
            allocationData.totalAmount,
            null, // no quantity for now
            startDate,
            endDate,
            allocationData.allocationType
          );

          const elementAllocation = elementAllocationRepository.create({
            name: allocationData.name || `${boeElement.name} Allocation`,
            description: allocationData.description || `Monthly allocation for ${boeElement.name}`,
            totalAmount: allocationData.totalAmount,
            allocationType: allocationData.allocationType,
            startDate: allocationData.startDate,
            endDate: allocationData.endDate,
            numberOfMonths,
            monthlyAmount,
            isActive: true,
            isLocked: false,
            notes: allocationData.notes || '',
            assumptions: '',
            risks: '',
            boeElement,
            boeVersion: boeVersionEntity,
            monthlyBreakdown
          });

          await elementAllocationRepository.save(elementAllocation);
        }
      }
    }

    // Calculate totals
    const totalCost = await this.calculateTotalEstimatedCost(boeVersionEntity.id);
    boeVersionEntity.totalEstimatedCost = totalCost;
    await boeVersionRepository.save(boeVersionEntity);

    return boeVersionEntity;
  }

  /**
   * Create WBS element from BOE element if it doesn't exist
   */
  static async createWbsElementFromBoeElement(boeElement: BOEElement, program: any): Promise<WbsElement> {
    // Check if WBS element already exists for this BOE element
    const existingWbsElement = await wbsElementRepository.findOne({
      where: {
        code: boeElement.code,
        program: { id: program.id }
      }
    });

    if (existingWbsElement) {
      return existingWbsElement;
    }

    // Handle parent-child relationship
    let parentWbsElementId: string | undefined;
    if (boeElement.parentElementId) {
      // Find the parent BOE element
      const parentBoeElement = await boeElementRepository.findOne({
        where: { id: boeElement.parentElementId }
      });
      
      if (parentBoeElement) {
        // Recursively create parent WBS element if it doesn't exist
        const parentWbsElement = await this.createWbsElementFromBoeElement(parentBoeElement, program);
        parentWbsElementId = parentWbsElement.id;
      }
    }

    // Create new WBS element from BOE element
    const wbsElement = wbsElementRepository.create({
      code: boeElement.code,
      name: boeElement.name,
      description: boeElement.description,
      level: boeElement.level,
      parentId: parentWbsElementId,
      program: program
    });

    return await wbsElementRepository.save(wbsElement);
  }

  /**
   * Push entire BOE to ledger as baseline budget entries (using allocations)
   */
  static async pushBOEToLedger(boeVersionId: string, userId?: string): Promise<{ success: boolean; entriesCreated: number; message: string }> {
    // Validate BOE before pushing to ledger
    const validationResult = await BOEValidationService.validateBOEForLedgerPush(boeVersionId);
    if (!validationResult.isValid) {
      throw new Error(`BOE validation failed: ${validationResult.errors.join(', ')}`);
    }

    const boeVersion = await boeVersionRepository.findOne({
      where: { id: boeVersionId },
      relations: ['program']
    });

    if (!boeVersion) {
      throw new Error('BOE version not found');
    }

    // Get all element allocations for this BOE version
    const allocations = await elementAllocationRepository.find({
      where: { boeVersionId },
      relations: ['boeElement', 'boeElement.costCategory', 'boeElement.vendor', 'vendor']
    });

    let totalEntriesCreated = 0;
    const sessionId = `boe-push-${Date.now()}`;

    // Push each allocation to ledger
    for (const allocation of allocations) {
      if (!allocation.isLocked) {
        await BOEElementAllocationService.pushToLedger(allocation.id, userId);
        
        // Count the entries created for this allocation
        const monthlyBreakdown = allocation.monthlyBreakdown;
        if (monthlyBreakdown) {
          totalEntriesCreated += Object.keys(monthlyBreakdown).length;
        }
      }
    }

    // Update BOE status to indicate it's been pushed to ledger
    boeVersion.status = 'Baseline';
    boeVersion.updatedAt = new Date();
    await boeVersionRepository.save(boeVersion);

    // Update setup status to mark BOE as baselined
    try {
      if (boeVersion.program) {
        await ProgramSetupService.markBOEBaselined(boeVersion.program.id);
      }
    } catch (error) {
      console.error('Error updating setup status after BOE baseline:', error);
      // Don't fail the baseline operation if setup status update fails
    }

    return {
      success: true,
      entriesCreated: totalEntriesCreated,
      message: `Successfully created ${totalEntriesCreated} ledger entries from BOE allocations`
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

  /**
   * Delete BOE version (draft only)
   */
  static async deleteBOEVersion(boeVersionId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const boeVersion = await boeVersionRepository.findOne({
        where: { id: boeVersionId },
        relations: ['program', 'elements', 'approvals']
      });

      if (!boeVersion) {
        throw new Error('BOE version not found');
      }

      // Only allow deletion of draft BOEs
      if (boeVersion.status !== 'Draft') {
        throw new Error(`Cannot delete BOE with status '${boeVersion.status}'. Only draft BOEs can be deleted.`);
      }

      // Check if this is the current BOE for the program
      const isCurrentBOE = boeVersion.program?.currentBOEVersionId === boeVersionId;

      // Delete related data in the correct order
      // 1. Delete element allocations
      await elementAllocationRepository.delete({ boeVersion: { id: boeVersionId } });

      // 2. Delete BOE elements
      await boeElementRepository.delete({ boeVersion: { id: boeVersionId } });

      // 3. Delete approvals
      await boeApprovalRepository.delete({ boeVersion: { id: boeVersionId } });

      // 4. Delete management reserve
      await managementReserveRepository.delete({ boeVersion: { id: boeVersionId } });

      // 5. Delete the BOE version itself
      await boeVersionRepository.delete(boeVersionId);

      // 6. Update program if this was the current BOE
      if (isCurrentBOE && boeVersion.program) {
        await programRepository.update(boeVersion.program.id, {
          currentBOEVersionId: undefined as any
        });
      }

      return {
        success: true,
        message: 'BOE version deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting BOE version:', error);
      throw error;
    }
  }
} 