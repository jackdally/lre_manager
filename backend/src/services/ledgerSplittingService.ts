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
  // Re-leveling options
  relevelingScope?: 'single' | 'remaining' | 'entire';
  relevelingAlgorithm?: 'linear' | 'front-loaded' | 'back-loaded' | 'custom';
  baselineExceedanceJustification?: string;
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
    const { 
      ledgerEntryId, 
      newPlannedAmount, 
      newPlannedDate, 
      reForecastReason, 
      userId,
      relevelingScope = 'single',
      relevelingAlgorithm = 'linear',
      baselineExceedanceJustification
    } = request;

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

    // Handle re-leveling if scope is not single
    if (relevelingScope !== 'single' && entry.createdFromBOE && entry.boeElementAllocationId) {
      await this.handleReleveling(
        entry,
        newPlannedAmount,
        newPlannedDate,
        relevelingScope,
        relevelingAlgorithm,
        baselineExceedanceJustification,
        userId
      );
    } else {
      // Standard single entry update
      entry.planned_amount = newPlannedAmount;
      entry.planned_date = newPlannedDate;
      entry.notes = entry.notes ? `${entry.notes}\nRE-FORECAST: ${reForecastReason}` : `RE-FORECAST: ${reForecastReason}`;

      await this.ledgerRepo.save(entry);
    }

    // Create audit trail entry
    await LedgerAuditTrailService.auditLedgerEntryUpdate(
      ledgerEntryId,
      previousValues,
      { planned_amount: newPlannedAmount, planned_date: newPlannedDate },
      AuditSource.RE_FORECASTED,
      userId
    );

    // Return the updated entry
    return await this.ledgerRepo.findOne({
      where: { id: ledgerEntryId },
      relations: ['program', 'wbsElement', 'costCategory', 'vendor']
    }) as LedgerEntry;
  }

  /**
   * Handle re-leveling across multiple ledger entries
   */
  private static async handleReleveling(
    originalEntry: LedgerEntry,
    newPlannedAmount: number,
    newPlannedDate: string,
    scope: 'remaining' | 'entire',
    algorithm: 'linear' | 'front-loaded' | 'back-loaded' | 'custom',
    justification?: string,
    userId?: string
  ): Promise<void> {
    if (!originalEntry.boeElementAllocationId) {
      throw new Error('Cannot re-level: entry is not associated with a BOE allocation');
    }

    // Get all ledger entries for this BOE allocation
    const relatedEntries = await this.ledgerRepo.find({
      where: { boeElementAllocationId: originalEntry.boeElementAllocationId },
      order: { planned_date: 'ASC' }
    });

    if (relatedEntries.length === 0) {
      throw new Error('No related ledger entries found for re-leveling');
    }

    // Calculate the variance (difference between new and original planned amount)
    const variance = newPlannedAmount - (originalEntry.planned_amount || 0);

    // Determine which entries to re-level based on scope
    let entriesToRelevel: LedgerEntry[];
    if (scope === 'remaining') {
      // Only future entries (after the current entry's date)
      const currentDate = new Date(originalEntry.planned_date || '');
      entriesToRelevel = relatedEntries.filter(entry => 
        new Date(entry.planned_date || '') > currentDate
      );
    } else {
      // All entries except the current one
      entriesToRelevel = relatedEntries.filter(entry => entry.id !== originalEntry.id);
    }

    if (entriesToRelevel.length === 0) {
      throw new Error('No entries available for re-leveling with the selected scope');
    }

    // Calculate redistribution based on algorithm
    const redistribution = this.calculateRedistribution(
      entriesToRelevel,
      variance,
      algorithm
    );

    // Update the original entry
    originalEntry.planned_amount = newPlannedAmount;
    originalEntry.planned_date = newPlannedDate;
    await this.ledgerRepo.save(originalEntry);

    // Update related entries with redistributed amounts
    for (const entry of entriesToRelevel) {
      const redistributionAmount = redistribution.get(entry.id) || 0;
      const newAmount = (entry.planned_amount || 0) + redistributionAmount;
      
      // Ensure amount doesn't go below 0
      entry.planned_amount = Math.max(0, newAmount);
      
      // Add re-leveling note
      const relevelingNote = `RE-LEVELED: ${redistributionAmount >= 0 ? '+' : ''}${redistributionAmount.toFixed(2)}`;
      entry.notes = entry.notes ? `${entry.notes}\n${relevelingNote}` : relevelingNote;
      
      await this.ledgerRepo.save(entry);
    }

    // Create audit trail for all changes
    for (const entry of [originalEntry, ...entriesToRelevel]) {
      await LedgerAuditTrailService.auditLedgerEntryUpdate(
        entry.id,
        { planned_amount: entry.planned_amount, planned_date: entry.planned_date },
        { planned_amount: entry.planned_amount, planned_date: entry.planned_date },
        AuditSource.RE_FORECASTED,
        userId
      );
    }
  }

  /**
   * Calculate redistribution amounts based on algorithm
   */
  private static calculateRedistribution(
    entries: LedgerEntry[],
    totalVariance: number,
    algorithm: 'linear' | 'front-loaded' | 'back-loaded' | 'custom'
  ): Map<string, number> {
    const redistribution = new Map<string, number>();
    
    if (entries.length === 0) return redistribution;

    switch (algorithm) {
      case 'linear':
        // Evenly distribute across all entries
        const linearAmount = totalVariance / entries.length;
        for (const entry of entries) {
          redistribution.set(entry.id, linearAmount);
        }
        break;

      case 'front-loaded':
        // Distribute more to earlier entries
        const frontLoadedWeights = entries.map((_, index) => 
          entries.length - index // Higher weight for earlier entries
        );
        const frontLoadedTotalWeight = frontLoadedWeights.reduce((sum, weight) => sum + weight, 0);
        
        for (let i = 0; i < entries.length; i++) {
          const weight = frontLoadedWeights[i];
          const amount = (totalVariance * weight) / frontLoadedTotalWeight;
          redistribution.set(entries[i].id, amount);
        }
        break;

      case 'back-loaded':
        // Distribute more to later entries
        const backLoadedWeights = entries.map((_, index) => 
          index + 1 // Higher weight for later entries
        );
        const backLoadedTotalWeight = backLoadedWeights.reduce((sum, weight) => sum + weight, 0);
        
        for (let i = 0; i < entries.length; i++) {
          const weight = backLoadedWeights[i];
          const amount = (totalVariance * weight) / backLoadedTotalWeight;
          redistribution.set(entries[i].id, amount);
        }
        break;

      case 'custom':
        // For now, use linear as default for custom
        // TODO: Implement custom redistribution logic
        const customAmount = totalVariance / entries.length;
        for (const entry of entries) {
          redistribution.set(entry.id, customAmount);
        }
        break;

      default:
        throw new Error(`Unsupported re-leveling algorithm: ${algorithm}`);
    }

    return redistribution;
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
   * Get re-forecast suggestions based on BOE allocation and actual vs planned amounts
   */
  static async getReForecastSuggestions(
    ledgerEntryId: string, 
    actualAmount?: number, 
    actualDate?: string
  ): Promise<Array<{
    plannedAmount: number;
    plannedDate: string;
    reason: string;
    type: 'overrun' | 'underspend' | 'schedule_change' | 'boe_allocation';
  }>> {
    const entry = await this.ledgerRepo.findOne({
      where: { id: ledgerEntryId },
      relations: ['program', 'wbsElement', 'costCategory', 'vendor']
    });

    if (!entry) {
      return [];
    }

    const suggestions: Array<{
      plannedAmount: number;
      plannedDate: string;
      reason: string;
      type: 'overrun' | 'underspend' | 'schedule_change' | 'boe_allocation';
    }> = [];

    const plannedAmount = entry.planned_amount || 0;
    const plannedDate = entry.planned_date;

    // If we have actual data, provide smart suggestions
    if (actualAmount !== undefined && actualDate) {
      const actualNum = Number(actualAmount);
      const plannedNum = Number(plannedAmount);

      // Overrun scenario: actual > planned
      if (actualNum > plannedNum) {
        const overrun = actualNum - plannedNum;
        suggestions.push({
          plannedAmount: actualNum,
          plannedDate: actualDate,
          reason: `Cover overrun: Increase planned amount to ${actualNum} to match actual invoice`,
          type: 'overrun'
        });

        // If this is a BOE-created entry, suggest pulling from future months
        if (entry.createdFromBOE && entry.boeElementAllocationId) {
          const allocation = await BOEElementAllocationService.getElementAllocation(entry.boeElementAllocationId);
          if (allocation && allocation.monthlyBreakdown) {
            const futureMonths = this.getFutureMonthsWithAllocation(allocation, actualDate);
            if (futureMonths.length > 0) {
              const pullAmount = Math.min(overrun, this.getTotalFutureAllocation(futureMonths));
              suggestions.push({
                plannedAmount: plannedNum + pullAmount,
                plannedDate: actualDate,
                reason: `Pull ${pullAmount} from future months to cover overrun`,
                type: 'overrun'
              });
            }
          }
        }
      }
      // Underspend scenario: actual < planned
      else if (actualNum < plannedNum) {
        const remaining = plannedNum - actualNum;
        
        // Option 1: Keep current planned amount (for partial delivery)
        suggestions.push({
          plannedAmount: plannedNum,
          plannedDate: plannedDate || actualDate,
          reason: `Keep current planned amount: ${plannedNum} (partial delivery scenario)`,
          type: 'underspend'
        });

        // Option 2: Adjust to actual amount
        suggestions.push({
          plannedAmount: actualNum,
          plannedDate: actualDate,
          reason: `Adjust to actual amount: ${actualNum} (re-forecast remaining ${remaining} to future)`,
          type: 'underspend'
        });

        // Option 3: Spread remaining to future months
        if (entry.createdFromBOE && entry.boeElementAllocationId) {
          const allocation = await BOEElementAllocationService.getElementAllocation(entry.boeElementAllocationId);
          if (allocation && allocation.monthlyBreakdown) {
            const futureMonths = this.getFutureMonthsWithAllocation(allocation, actualDate);
            if (futureMonths.length > 0) {
              const spreadAmount = Math.min(remaining, this.getTotalFutureAllocation(futureMonths));
              suggestions.push({
                plannedAmount: actualNum + spreadAmount,
                plannedDate: actualDate,
                reason: `Spread remaining ${spreadAmount} to future months`,
                type: 'underspend'
              });
            }
          }
        }
      }
      // Schedule change scenario: same amount, different date
      else if (actualDate !== plannedDate) {
        suggestions.push({
          plannedAmount: plannedNum,
          plannedDate: actualDate,
          reason: `Schedule change: Move planned amount to actual date`,
          type: 'schedule_change'
        });
      }
    }

    // If this is a BOE-created entry, also provide BOE allocation suggestions
    if (entry.createdFromBOE && entry.boeElementAllocationId) {
      const allocation = await BOEElementAllocationService.getElementAllocation(entry.boeElementAllocationId);
      if (allocation && allocation.monthlyBreakdown) {
        // Add BOE allocation suggestions
        for (const [month, data] of Object.entries(allocation.monthlyBreakdown)) {
          if (data.amount && data.amount > 0) {
            suggestions.push({
              plannedAmount: data.amount,
              plannedDate: data.date,
              reason: `BOE allocation for ${month}: ${data.amount}`,
              type: 'boe_allocation'
            });
          }
        }
      }
    }

    // If no smart suggestions were generated, provide basic suggestions
    if (suggestions.length === 0) {
      if (actualAmount !== undefined) {
        suggestions.push({
          plannedAmount: Number(actualAmount),
          plannedDate: actualDate || plannedDate || new Date().toISOString().split('T')[0],
          reason: `Match actual amount: ${actualAmount}`,
          type: 'underspend'
        });
      }
    }

    return suggestions;
  }

  /**
   * Get future months with allocation from a given date
   */
  private static getFutureMonthsWithAllocation(allocation: any, fromDate: string): Array<{ month: string; amount: number; date: string }> {
    const futureMonths: Array<{ month: string; amount: number; date: string }> = [];
    const fromDateObj = new Date(fromDate);

    for (const [month, data] of Object.entries(allocation.monthlyBreakdown)) {
      const monthData = data as any;
      if (monthData.amount && monthData.amount > 0 && monthData.date) {
        const monthDate = new Date(monthData.date);
        if (monthDate > fromDateObj) {
          futureMonths.push({
            month,
            amount: monthData.amount,
            date: monthData.date
          });
        }
      }
    }

    return futureMonths.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Get total allocation amount from future months
   */
  private static getTotalFutureAllocation(futureMonths: Array<{ month: string; amount: number; date: string }>): number {
    return futureMonths.reduce((total, month) => total + month.amount, 0);
  }
} 