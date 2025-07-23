import { AppDataSource } from '../config/database';
import { LedgerEntry } from '../entities/LedgerEntry';
import { LedgerAuditTrailService } from './ledgerAuditTrailService';
import { AuditSource } from '../entities/LedgerAuditTrail';
import { BOEElementAllocationService } from './boeElementAllocationService';

export interface SplitRequest {
  originalLedgerEntryId: string;
  splits: Array<{
    plannedAmount: number;
    plannedDate: string;
    description?: string;
    notes?: string;
  }>;
  splitReason: string;
  userId?: string;
  createNewBOEAllocation?: boolean; // Optional: create new BOE allocation for splits
}

export interface AutomaticSplitRequest {
  originalLedgerEntryId: string;
  actualAmount: number;
  actualDate: string;
  splitReason: string;
  userId?: string;
  createNewBOEAllocation?: boolean;
}

export interface ReForecastRequest {
  ledgerEntryId: string;
  newPlannedAmount: number;
  newPlannedDate: string;
  reForecastReason: string;
  userId?: string;
}

export class LedgerSplittingService {
  private static ledgerRepo = AppDataSource.getRepository(LedgerEntry);

  /**
   * Split a ledger entry into multiple entries
   */
  static async splitLedgerEntry(request: SplitRequest): Promise<LedgerEntry[]> {
    const { originalLedgerEntryId, splits, splitReason, userId } = request;

    // Get the original ledger entry
    const originalEntry = await this.ledgerRepo.findOne({
      where: { id: originalLedgerEntryId },
      relations: ['program', 'wbsElement', 'costCategory', 'vendor']
    });

    if (!originalEntry) {
      throw new Error('Original ledger entry not found');
    }

    // Validate split amounts
    const totalSplitAmount = splits.reduce((sum, split) => sum + split.plannedAmount, 0);
    const originalAmount = originalEntry.planned_amount || 0;
    
    if (Math.abs(totalSplitAmount - originalAmount) > 0.01) {
      throw new Error(`Split amounts (${totalSplitAmount}) must equal original amount (${originalAmount})`);
    }

    // Validate BOE constraints if this is a BOE-created entry
    if (originalEntry.createdFromBOE) {
      await this.validateBOESplitConstraints(originalEntry, splits);
    }

    // Create new ledger entries for each split
    const newEntries: LedgerEntry[] = [];
    for (const split of splits) {
      const newEntry = this.ledgerRepo.create({
        vendor_name: originalEntry.vendor_name,
        expense_description: split.description || originalEntry.expense_description,
        wbsElementId: originalEntry.wbsElementId,
        costCategoryId: originalEntry.costCategoryId,
        vendorId: originalEntry.vendorId,
        baseline_date: originalEntry.baseline_date,
        baseline_amount: originalEntry.baseline_amount,
        planned_date: split.plannedDate,
        planned_amount: split.plannedAmount,
        actual_date: null,
        actual_amount: null,
        notes: split.notes || `Split from ${originalEntry.expense_description}`,
        invoice_link_text: originalEntry.invoice_link_text,
        invoice_link_url: originalEntry.invoice_link_url,
        program: originalEntry.program,
        // Preserve BOE relationship
        createdFromBOE: originalEntry.createdFromBOE,
        boeElementAllocationId: originalEntry.boeElementAllocationId,
        boeVersionId: originalEntry.boeVersionId
      });

      const savedEntry = await this.ledgerRepo.save(newEntry);
      newEntries.push(savedEntry);
    }

    // Mark original entry as split (set planned amount to 0)
    originalEntry.planned_amount = 0;
    originalEntry.notes = `SPLIT: ${splitReason}. Split into ${splits.length} entries.`;
    await this.ledgerRepo.save(originalEntry);

    // Create audit trail entries
    const newEntryIds = newEntries.map(entry => entry.id);
    await LedgerAuditTrailService.auditLedgerEntrySplit(
      originalLedgerEntryId,
      newEntryIds,
      splitReason,
      userId
    );

    return newEntries;
  }

  /**
   * Automatically split a ledger entry based on actual amount
   */
  static async automaticSplitLedgerEntry(request: AutomaticSplitRequest): Promise<LedgerEntry[]> {
    const { originalLedgerEntryId, actualAmount, actualDate, splitReason, userId, createNewBOEAllocation } = request;

    // Get the original ledger entry
    const originalEntry = await this.ledgerRepo.findOne({
      where: { id: originalLedgerEntryId },
      relations: ['program', 'wbsElement', 'costCategory', 'vendor']
    });

    if (!originalEntry) {
      throw new Error('Original ledger entry not found');
    }

    const plannedAmount = originalEntry.planned_amount || 0;
    
    if (actualAmount >= plannedAmount) {
      throw new Error('Automatic split is only available when actual amount is less than planned amount');
    }

    // Create automatic splits
    const splits = [
      {
        plannedAmount: actualAmount,
        plannedDate: actualDate,
        description: `${originalEntry.expense_description} - Matched Amount`,
        notes: `Automatically split: matched to actual invoice of ${actualAmount}`
      },
      {
        plannedAmount: plannedAmount - actualAmount,
        plannedDate: originalEntry.planned_date || actualDate,
        description: `${originalEntry.expense_description} - Remaining Amount`,
        notes: `Automatically split: remaining amount of ${plannedAmount - actualAmount}`
      }
    ];

    // Create new BOE allocation for the remaining amount if requested
    if (createNewBOEAllocation && originalEntry.createdFromBOE && originalEntry.boeElementAllocationId) {
      await this.createNewBOEAllocationForSplit(originalEntry, plannedAmount - actualAmount, userId);
    }

    return await this.splitLedgerEntry({
      originalLedgerEntryId,
      splits,
      splitReason,
      userId
    });
  }

  /**
   * Create a new BOE allocation for split entries
   */
  private static async createNewBOEAllocationForSplit(
    originalEntry: LedgerEntry, 
    remainingAmount: number, 
    userId?: string
  ): Promise<void> {
    if (!originalEntry.boeElementAllocationId) return;

    try {
      // Get the original allocation
      const originalAllocation = await BOEElementAllocationService.getElementAllocation(originalEntry.boeElementAllocationId);
      if (!originalAllocation) return;

      // Create new allocation for the remaining amount
      const newAllocation = {
        boeElementId: originalAllocation.boeElementId,
        name: `${originalAllocation.name} - Split Remaining`,
        description: `Split remaining amount from ${originalAllocation.name}`,
        allocationType: 'Custom',
        totalAmount: remainingAmount,
        totalQuantity: 0,
        startDate: originalEntry.planned_date || new Date().toISOString().split('T')[0],
        endDate: originalAllocation.endDate,
        monthlyBreakdown: {
          [new Date().toISOString().slice(0, 7)]: {
            amount: remainingAmount,
            date: originalEntry.planned_date || new Date().toISOString().split('T')[0]
          }
        }
      };

      await BOEElementAllocationService.createElementAllocation(
        originalAllocation.boeElementId,
        originalAllocation.boeVersionId,
        newAllocation
      );
    } catch (error) {
      console.error('Error creating new BOE allocation for split:', error);
      // Don't throw - this is optional functionality
    }
  }

  /**
   * Re-forecast a ledger entry's planned amount and date
   */
  static async reForecastLedgerEntry(request: ReForecastRequest): Promise<LedgerEntry> {
    const { ledgerEntryId, newPlannedAmount, newPlannedDate, reForecastReason, userId } = request;

    // Get the ledger entry
    const entry = await this.ledgerRepo.findOne({
      where: { id: ledgerEntryId },
      relations: ['program', 'wbsElement', 'costCategory', 'vendor']
    });

    if (!entry) {
      throw new Error('Ledger entry not found');
    }

    // Store previous values for audit trail
    const previousValues = {
      planned_amount: entry.planned_amount,
      planned_date: entry.planned_date
    };

    // Validate BOE constraints if this is a BOE-created entry
    if (entry.createdFromBOE) {
      await this.validateBOEReForecastConstraints(entry, newPlannedAmount, newPlannedDate);
    }

    // Update the entry
    entry.planned_amount = newPlannedAmount;
    entry.planned_date = newPlannedDate;
    entry.notes = entry.notes ? `${entry.notes}\nRE-FORECAST: ${reForecastReason}` : `RE-FORECAST: ${reForecastReason}`;

    const updatedEntry = await this.ledgerRepo.save(entry);

    // Create audit trail entry
    await LedgerAuditTrailService.auditLedgerEntryUpdate(
      ledgerEntryId,
      previousValues,
      { planned_amount: newPlannedAmount, planned_date: newPlannedDate },
      AuditSource.RE_FORECASTED,
      userId
    );

    return updatedEntry;
  }

  /**
   * Validate BOE constraints for splitting
   */
  private static async validateBOESplitConstraints(
    originalEntry: LedgerEntry, 
    splits: Array<{ plannedAmount: number; plannedDate: string }>
  ): Promise<void> {
    if (!originalEntry.boeElementAllocationId) {
      return; // Not a BOE-created entry
    }

    // Get BOE allocation details
    const allocation = await BOEElementAllocationService.getElementAllocation(originalEntry.boeElementAllocationId);
    if (!allocation) {
      throw new Error('BOE allocation not found');
    }

    // Check if any split would exceed the baseline amount
    const baselineAmount = originalEntry.baseline_amount || 0;
    for (const split of splits) {
      if (split.plannedAmount > baselineAmount) {
        throw new Error(`Split amount (${split.plannedAmount}) cannot exceed baseline amount (${baselineAmount}) for BOE-created entries`);
      }
    }

    // Check if splits are within the allocation period
    const allocationStart = new Date(allocation.startDate);
    const allocationEnd = new Date(allocation.endDate);
    
    for (const split of splits) {
      const splitDate = new Date(split.plannedDate);
      if (splitDate < allocationStart || splitDate > allocationEnd) {
        throw new Error(`Split date (${split.plannedDate}) must be within BOE allocation period (${allocation.startDate} to ${allocation.endDate})`);
      }
    }
  }

  /**
   * Validate BOE constraints for re-forecasting
   */
  private static async validateBOEReForecastConstraints(
    entry: LedgerEntry,
    newPlannedAmount: number,
    newPlannedDate: string
  ): Promise<void> {
    if (!entry.boeElementAllocationId) {
      return; // Not a BOE-created entry
    }

    // Get BOE allocation details
    const allocation = await BOEElementAllocationService.getElementAllocation(entry.boeElementAllocationId);
    if (!allocation) {
      throw new Error('BOE allocation not found');
    }

    // Check if new planned amount exceeds baseline
    const baselineAmount = entry.baseline_amount || 0;
    if (newPlannedAmount > baselineAmount) {
      throw new Error(`Re-forecast amount (${newPlannedAmount}) cannot exceed baseline amount (${baselineAmount}) for BOE-created entries`);
    }

    // Check if new date is within allocation period
    const allocationStart = new Date(allocation.startDate);
    const allocationEnd = new Date(allocation.endDate);
    const newDate = new Date(newPlannedDate);
    
    if (newDate < allocationStart || newDate > allocationEnd) {
      throw new Error(`Re-forecast date (${newPlannedDate}) must be within BOE allocation period (${allocation.startDate} to ${allocation.endDate})`);
    }
  }

  /**
   * Get split suggestions based on BOE allocation
   */
  static async getSplitSuggestions(ledgerEntryId: string): Promise<Array<{
    plannedAmount: number;
    plannedDate: string;
    description: string;
    reason: string;
  }>> {
    const entry = await this.ledgerRepo.findOne({
      where: { id: ledgerEntryId },
      relations: ['program', 'wbsElement', 'costCategory', 'vendor']
    });

    if (!entry || !entry.createdFromBOE || !entry.boeElementAllocationId) {
      return []; // No suggestions for non-BOE entries
    }

    // Get BOE allocation details
    const allocation = await BOEElementAllocationService.getElementAllocation(entry.boeElementAllocationId);
    if (!allocation || !allocation.monthlyBreakdown) {
      return [];
    }

    const suggestions: Array<{
      plannedAmount: number;
      plannedDate: string;
      description: string;
      reason: string;
    }> = [];

    // Create suggestions based on monthly breakdown
    for (const [month, data] of Object.entries(allocation.monthlyBreakdown)) {
      if (data.amount && data.amount > 0) {
        suggestions.push({
          plannedAmount: data.amount,
          plannedDate: data.date,
          description: `${allocation.boeElement.name}: ${allocation.name} - ${month}`,
          reason: `Based on BOE allocation for ${month}`
        });
      }
    }

    return suggestions;
  }

  /**
   * Get re-forecast suggestions based on BOE allocation
   */
  static async getReForecastSuggestions(ledgerEntryId: string): Promise<Array<{
    plannedAmount: number;
    plannedDate: string;
    reason: string;
  }>> {
    const entry = await this.ledgerRepo.findOne({
      where: { id: ledgerEntryId },
      relations: ['program', 'wbsElement', 'costCategory', 'vendor']
    });

    if (!entry || !entry.createdFromBOE || !entry.boeElementAllocationId) {
      return []; // No suggestions for non-BOE entries
    }

    // Get BOE allocation details
    const allocation = await BOEElementAllocationService.getElementAllocation(entry.boeElementAllocationId);
    if (!allocation || !allocation.monthlyBreakdown) {
      return [];
    }

    const suggestions: Array<{
      plannedAmount: number;
      plannedDate: string;
      reason: string;
    }> = [];

    // Create suggestions based on monthly breakdown
    for (const [month, data] of Object.entries(allocation.monthlyBreakdown)) {
      if (data.amount && data.amount > 0) {
        suggestions.push({
          plannedAmount: data.amount,
          plannedDate: data.date,
          reason: `BOE allocation for ${month}: ${data.amount}`
        });
      }
    }

    return suggestions;
  }
} 