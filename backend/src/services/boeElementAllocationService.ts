import { AppDataSource } from '../config/database';
import { BOEElementAllocation } from '../entities/BOEElementAllocation';
import { BOEElement } from '../entities/BOEElement';
import { BOEVersion } from '../entities/BOEVersion';
import { LedgerEntry } from '../entities/LedgerEntry';
import { WbsElement } from '../entities/WbsElement';
import { LedgerAuditTrailService } from './ledgerAuditTrailService';
import { AuditSource } from '../entities/LedgerAuditTrail';

const elementAllocationRepository = AppDataSource.getRepository(BOEElementAllocation);
const boeElementRepository = AppDataSource.getRepository(BOEElement);
const boeVersionRepository = AppDataSource.getRepository(BOEVersion);
const ledgerRepository = AppDataSource.getRepository(LedgerEntry);
const wbsElementRepository = AppDataSource.getRepository(WbsElement);

export class BOEElementAllocationService {
  /**
   * Create a new element allocation
   */
  static async createElementAllocation(
    boeElementId: string, 
    boeVersionId: string, 
    allocationData: any
  ): Promise<BOEElementAllocation> {
    // Verify BOE element exists
    const boeElement = await boeElementRepository.findOne({ 
      where: { id: boeElementId },
      relations: ['boeVersion']
    });
    if (!boeElement) {
      throw new Error('BOE element not found');
    }

    // Verify BOE version exists
    const boeVersion = await boeVersionRepository.findOne({ 
      where: { id: boeVersionId } 
    });
    if (!boeVersion) {
      throw new Error('BOE version not found');
    }

    // Check if element already has an active allocation
    const existingAllocation = await elementAllocationRepository.findOne({
      where: { 
        boeElementId, 
        isActive: true 
      }
    });
    if (existingAllocation) {
      throw new Error('BOE element already has an active allocation');
    }

    // Calculate number of months and monthly amounts
    const startDate = new Date(allocationData.startDate);
    const endDate = new Date(allocationData.endDate);
    const numberOfMonths = this.calculateNumberOfMonths(startDate, endDate);
    const monthlyAmount = allocationData.totalAmount / numberOfMonths;
    const monthlyQuantity = allocationData.totalQuantity ? allocationData.totalQuantity / numberOfMonths : null;

    // Generate monthly breakdown
    const monthlyBreakdown = this.generateMonthlyBreakdown(
      allocationData.totalAmount,
      allocationData.totalQuantity,
      startDate,
      endDate,
      allocationData.allocationType
    );

    const elementAllocation = elementAllocationRepository.create({
      ...allocationData,
      boeElement,
      boeVersion,
      numberOfMonths,
      monthlyAmount,
      monthlyQuantity,
      monthlyBreakdown,
      isActive: true
    });

    const savedAllocation = await elementAllocationRepository.save(elementAllocation);
    return Array.isArray(savedAllocation) ? savedAllocation[0] : savedAllocation;
  }

  /**
   * Get element allocations for a BOE version
   */
  static async getElementAllocations(boeVersionId: string) {
    const result = await elementAllocationRepository.find({
      where: { boeVersionId, isActive: true },
      relations: ['boeElement', 'boeElement.costCategory', 'boeElement.vendor', 'vendor']
    });
    return result;
  }

  /**
   * Get element allocation by ID
   */
  static async getElementAllocation(allocationId: string): Promise<BOEElementAllocation | null> {
    return await elementAllocationRepository.findOne({
      where: { id: allocationId },
      relations: ['boeElement', 'boeElement.costCategory', 'boeElement.vendor', 'vendor', 'boeVersion']
    });
  }

  /**
   * Update element allocation
   */
  static async updateElementAllocation(
    allocationId: string, 
    updateData: any
  ): Promise<BOEElementAllocation> {
    const allocation = await elementAllocationRepository.findOne({
      where: { id: allocationId }
    });
    if (!allocation) {
      throw new Error('Element allocation not found');
    }

    if (allocation.isLocked) {
      throw new Error('Cannot update locked allocation');
    }

    // If dates or amounts changed, recalculate monthly breakdown
    if (updateData.startDate || updateData.endDate || updateData.totalAmount || updateData.totalQuantity) {
      const startDate = new Date(updateData.startDate || allocation.startDate);
      const endDate = new Date(updateData.endDate || allocation.endDate);
      const numberOfMonths = this.calculateNumberOfMonths(startDate, endDate);
      const totalAmount = updateData.totalAmount || allocation.totalAmount;
      const totalQuantity = updateData.totalQuantity || allocation.totalQuantity;
      const allocationType = updateData.allocationType || allocation.allocationType;

      const monthlyAmount = totalAmount / numberOfMonths;
      const monthlyQuantity = totalQuantity ? totalQuantity / numberOfMonths : null;

      const monthlyBreakdown = this.generateMonthlyBreakdown(
        totalAmount,
        totalQuantity,
        startDate,
        endDate,
        allocationType
      );

      updateData.numberOfMonths = numberOfMonths;
      updateData.monthlyAmount = monthlyAmount;
      updateData.monthlyQuantity = monthlyQuantity;
      updateData.monthlyBreakdown = monthlyBreakdown;
    }

    await elementAllocationRepository.update(allocationId, updateData);
    
    const updatedAllocation = await elementAllocationRepository.findOne({
      where: { id: allocationId },
      relations: ['boeElement', 'boeElement.costCategory', 'boeElement.vendor', 'vendor', 'boeVersion']
    });
    
    if (!updatedAllocation) {
      throw new Error('Failed to retrieve updated allocation');
    }

    return updatedAllocation;
  }

  /**
   * Delete element allocation
   */
  static async deleteElementAllocation(allocationId: string): Promise<void> {
    const allocation = await elementAllocationRepository.findOne({
      where: { id: allocationId }
    });
    if (!allocation) {
      throw new Error('Element allocation not found');
    }

    if (allocation.isLocked) {
      throw new Error('Cannot delete locked allocation');
    }

    await elementAllocationRepository.delete(allocationId);
  }

  /**
   * Calculate number of months between two dates
   */
  static calculateNumberOfMonths(startDate: Date, endDate: Date): number {
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth());
    return Math.max(1, months + 1); // Ensure at least 1 month
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
    const numberOfMonths = this.calculateNumberOfMonths(startDate, endDate);
    const breakdown: { [month: string]: any } = {};

    let currentDate = new Date(startDate);
    let remainingAmount = totalAmount;
    let remainingQuantity = totalQuantity;

    for (let i = 0; i < numberOfMonths; i++) {
      const monthKey = currentDate.toISOString().slice(0, 7); // YYYY-MM format
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
        date: currentDate.toISOString().slice(0, 10),
        isLocked: false
      };

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return breakdown;
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
   * Push element allocation to ledger as baseline entries
   */
  static async pushToLedger(allocationId: string, userId?: string): Promise<void> {
    const allocation = await elementAllocationRepository.findOne({
      where: { id: allocationId },
      relations: ['boeElement', 'boeElement.costCategory', 'boeElement.vendor', 'vendor', 'boeVersion', 'boeVersion.program']
    });

    if (!allocation) {
      throw new Error('Element allocation not found');
    }

    if (allocation.isLocked) {
      throw new Error('Element allocation is already locked and pushed to ledger');
    }

    const monthlyBreakdown = allocation.monthlyBreakdown;
    if (!monthlyBreakdown) {
      throw new Error('No monthly breakdown found');
    }

    // Create WBS element from BOE element if it doesn't exist
    const wbsElement = await this.createWbsElementFromBoeElement(
      allocation.boeElement, 
      allocation.boeVersion.program
    );

    const createdLedgerEntries: LedgerEntry[] = [];
    const sessionId = `boe-push-${Date.now()}`;

    // Create ledger entries for each month
    for (const [month, data] of Object.entries(monthlyBreakdown)) {
      const ledgerEntry = ledgerRepository.create({
        vendor_name: allocation.vendor?.name || allocation.name,
        expense_description: `${allocation.boeElement.name}: ${allocation.description}`,
        wbsElementId: wbsElement.id, // Use the WBS element ID instead of BOE element ID
        costCategoryId: allocation.boeElement.costCategoryId,
        vendorId: allocation.vendorId || undefined,
        baseline_date: data.date,
        baseline_amount: data.amount,
        planned_date: data.date,
        planned_amount: data.amount,
        program: allocation.boeVersion.program,
        notes: `Element allocation: ${allocation.name} - ${month}`,
        // BOE Integration Fields
        createdFromBOE: true,
        boeElementAllocationId: allocation.id,
        boeVersionId: allocation.boeVersionId
      });

      const savedEntry = await ledgerRepository.save(ledgerEntry);
      createdLedgerEntries.push(savedEntry);

      // Create audit trail entry for each ledger entry
      await LedgerAuditTrailService.auditLedgerEntryCreation(
        savedEntry,
        AuditSource.BOE_ALLOCATION,
        userId,
        sessionId
      );
    }

    // Create audit trail for BOE push operation
    const ledgerEntryIds = createdLedgerEntries.map(entry => entry.id);
    await LedgerAuditTrailService.auditBOEPushToLedger(
      ledgerEntryIds,
      allocation.boeVersionId,
      userId,
      sessionId
    );

    // Lock the allocation
    allocation.isLocked = true;
    await elementAllocationRepository.save(allocation);
  }

  /**
   * Update actual amounts from ledger entries
   */
  static async updateActualsFromLedger(allocationId: string): Promise<void> {
    const allocation = await elementAllocationRepository.findOne({
      where: { id: allocationId },
      relations: ['boeElement', 'boeVersion']
    });

    if (!allocation) {
      throw new Error('Element allocation not found');
    }

    // Get ledger entries for this allocation
    const ledgerEntries = await ledgerRepository.find({
      where: {
        boeElementAllocationId: allocation.id,
        program: { id: allocation.boeVersion.program.id }
      }
    });

    // Update monthly breakdown with actual amounts
    const monthlyBreakdown = { ...allocation.monthlyBreakdown };
    
    for (const entry of ledgerEntries) {
      if (entry.actual_amount && entry.actual_date) {
        const month = entry.actual_date.slice(0, 7);
        if (monthlyBreakdown && monthlyBreakdown[month]) {
          monthlyBreakdown[month].actualAmount = entry.actual_amount;
          monthlyBreakdown[month].actualDate = entry.actual_date;
        }
      }
    }

    allocation.monthlyBreakdown = monthlyBreakdown;
    await elementAllocationRepository.save(allocation);
  }

  /**
   * Get element allocation summary for a BOE version
   */
  static async getElementAllocationSummary(boeVersionId: string): Promise<any> {
    const allocations = await elementAllocationRepository.find({
      where: { boeVersionId, isActive: true },
      relations: ['boeElement', 'boeElement.costCategory']
    });

    const summary = {
      totalAllocations: allocations.length,
      totalAmount: 0,
      allocatedAmount: 0,
      actualAmount: 0,
      variance: 0,
      allocations: allocations.map(allocation => {
        const totalAllocated = allocation.getTotalAllocatedAmount();
        const totalActual = allocation.getTotalActualAmount();

        return {
          id: allocation.id,
          name: allocation.name,
          elementName: allocation.boeElement.name,
          elementCode: allocation.boeElement.code,
          totalAmount: allocation.totalAmount,
          allocatedAmount: totalAllocated,
          actualAmount: totalActual,
          variance: totalActual - totalAllocated,
          isLocked: allocation.isLocked,
          startDate: allocation.startDate,
          endDate: allocation.endDate,
          allocationType: allocation.allocationType,
          costCategory: allocation.boeElement.costCategory?.name || 'Unassigned'
        };
      })
    };

    // Calculate totals
    summary.totalAmount = summary.allocations.reduce((sum, a) => sum + a.totalAmount, 0);
    summary.allocatedAmount = summary.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    summary.actualAmount = summary.allocations.reduce((sum, a) => sum + a.actualAmount, 0);
    summary.variance = summary.actualAmount - summary.allocatedAmount;

    return summary;
  }

  /**
   * Validate element allocation data
   */
  static validateElementAllocation(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!data.totalAmount || data.totalAmount <= 0) {
      errors.push('Total amount must be greater than 0');
    }

    if (!data.startDate) {
      errors.push('Start date is required');
    }

    if (!data.endDate) {
      errors.push('End date is required');
    }

    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      if (startDate >= endDate) {
        errors.push('End date must be after start date');
      }
    }

    if (!data.allocationType || !['Linear', 'Front-Loaded', 'Back-Loaded', 'Custom'].includes(data.allocationType)) {
      errors.push('Valid allocation type is required');
    }

    if (data.totalQuantity && data.totalQuantity <= 0) {
      errors.push('Total quantity must be greater than 0 if provided');
    }

    if (data.totalQuantity && !data.quantityUnit) {
      errors.push('Quantity unit is required when total quantity is provided');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 