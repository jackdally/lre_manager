import { AppDataSource } from '../config/database';
import { LedgerEntry } from '../entities/LedgerEntry';
import { LedgerSplittingService } from './ledgerSplittingService';
import { LedgerAuditTrailService } from './ledgerAuditTrailService';
import { AuditSource } from '../entities/LedgerAuditTrail';
import { AuditAction } from '../entities/LedgerAuditTrail';

export type AdjustmentScenario = 'partial_delivery' | 'cost_overrun' | 'cost_underspend' | 'schedule_change';

export interface ScenarioOption {
  id: AdjustmentScenario;
  title: string;
  description: string;
  recommended: boolean;
  available: boolean;
}

export interface AvailableScenarios {
  recommended: AdjustmentScenario;
  available: ScenarioOption[];
}

export interface AllocationImpactRequest {
  ledgerEntryId: string;
  scenario: AdjustmentScenario;
  remainingAmount?: number;
  remainingDate?: string;
  splits?: Array<{
    amount: number;
    date: string;
    description?: string;
  }>;
  relevelingScope?: 'single' | 'remaining' | 'entire';
  relevelingAlgorithm?: 'linear' | 'front-loaded' | 'back-loaded' | 'custom';
  weightIntensity?: number;
  customDistribution?: Record<string, number>;
  newPlannedDate?: string;
  actualAmount?: number; // Add actual transaction amount
  actualDate?: string; // Add actual transaction date
}

export interface AllocationImpact {
  totalChange: number;
  entriesAffected: number;
  scenario: AdjustmentScenario;
  futureAllocations: Array<{
    id: string;
    originalPlanned: number;
    newPlanned: number;
    change: number;
    plannedDate: string;
    description: string;
  }>;
  warnings: string[];
  notes: string[];
}

export interface PartialDeliveryRequest {
  ledgerEntryId: string;
  splits: Array<{
    amount: number;
    date: string;
    description?: string;
  }>;
  reason: string;
  userId?: string;
  actualAmount?: number;
  actualDate?: string;
}

export interface ReForecastRequest {
  ledgerEntryId: string;
  scenario: 'cost_overrun' | 'cost_underspend';
  relevelingScope: 'single' | 'remaining' | 'entire';
  relevelingAlgorithm: 'linear' | 'front-loaded' | 'back-loaded' | 'custom';
  weightIntensity?: number;
  customDistribution?: Record<string, number>;
  baselineExceedanceJustification?: string;
  reason: string;
  userId?: string;
  actualAmount?: number;
  actualDate?: string;
}

export interface ScheduleChangeRequest {
  ledgerEntryId: string;
  newPlannedDate: string;
  reason: string;
  userId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class TransactionAdjustmentService {
  private static ledgerRepo = AppDataSource.getRepository(LedgerEntry);

  /**
   * Get available adjustment scenarios for a ledger entry
   */
  static async getAvailableScenarios(
    ledgerEntryId: string,
    actualAmount?: number,
    actualDate?: string
  ): Promise<AvailableScenarios> {
    const entry = await this.ledgerRepo.findOne({
      where: { id: ledgerEntryId },
      relations: ['program', 'wbsElement', 'costCategory', 'vendor']
    });

    if (!entry) {
      throw new Error('Ledger entry not found');
    }

    const plannedAmount = entry.planned_amount || 0;
    const plannedDate = entry.planned_date;

    const scenarios: ScenarioOption[] = [
      {
        id: 'partial_delivery',
        title: 'Partial Delivery',
        description: 'Split the ledger entry to account for partial delivery (when you expect more to come)',
        recommended: false,
        available: actualAmount !== undefined && actualAmount < plannedAmount
      },
      {
        id: 'cost_overrun',
        title: 'Cost Overrun',
        description: 'Re-forecast to cover cost overrun from future months',
        recommended: false,
        available: actualAmount !== undefined && actualAmount > plannedAmount
      },
      {
        id: 'cost_underspend',
        title: 'Cost Underspend',
        description: 'Re-forecast to redistribute underspent amount to future months',
        recommended: false,
        available: actualAmount !== undefined && actualAmount < plannedAmount
      },
      {
        id: 'schedule_change',
        title: 'Schedule Change',
        description: 'Update the planned date for this transaction',
        recommended: false,
        available: actualDate !== undefined && actualDate !== plannedDate
      }
    ];

    // Determine recommended scenario based on uploaded transaction vs planned data
    let recommended: AdjustmentScenario = 'partial_delivery';

    if (actualAmount !== undefined && actualDate !== undefined) {
      // Prioritize amount-based scenarios over date-based ones
      if (actualAmount > plannedAmount) {
        recommended = 'cost_overrun';
      } else if (actualAmount < plannedAmount) {
        recommended = 'cost_underspend';
      } else if (actualDate !== plannedDate) {
        recommended = 'schedule_change';
      }
    } else if (actualAmount !== undefined) {
      if (actualAmount > plannedAmount) {
        recommended = 'cost_overrun';
      } else if (actualAmount < plannedAmount) {
        recommended = 'cost_underspend';
      }
    } else if (actualDate !== undefined && actualDate !== plannedDate) {
      recommended = 'schedule_change';
    }

    // Update recommended flag
    scenarios.forEach(scenario => {
      scenario.recommended = scenario.id === recommended;
    });

    // Filter available scenarios
    const availableScenarios = scenarios.filter(s => s.available);

    // If no scenarios are available based on comparisons, make at least one available for manual adjustment
    if (availableScenarios.length === 0) {
      scenarios[0].available = true; // Make partial delivery available as fallback
      availableScenarios.push(scenarios[0]);
    }

    return {
      recommended,
      available: availableScenarios
    };
  }

  /**
   * Calculate the impact of an adjustment on future allocations
   */
  static async calculateAllocationImpact(request: AllocationImpactRequest): Promise<AllocationImpact> {
    const {
      ledgerEntryId,
      scenario,
      remainingAmount,
      remainingDate,
      splits,
      relevelingScope,
      relevelingAlgorithm,
      weightIntensity = 0.5,
      customDistribution,
      actualAmount,
      actualDate
    } = request;

    const entry = await this.ledgerRepo.findOne({
      where: { id: ledgerEntryId },
      relations: ['program', 'wbsElement', 'costCategory', 'vendor']
    });

    if (!entry) {
      throw new Error('Ledger entry not found');
    }

    const warnings: string[] = [];
    const notes: string[] = [];
    let totalChange = 0;
    let entriesAffected = 0;
    let futureAllocations: AllocationImpact['futureAllocations'] = [];

    switch (scenario) {
      case 'partial_delivery':
        if (splits && splits.length > 0) {
          // For partial delivery with multiple splits, create entries for each split
          const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
          const originalPlannedAmount = entry.planned_amount || 0;
          const newPlannedAmount = originalPlannedAmount - totalSplitAmount;

          totalChange = totalSplitAmount;
          entriesAffected = splits.length + 1; // +1 for the original entry

          // First, add the original entry showing its planned amount will be reduced
          futureAllocations = [{
            id: entry.id,
            originalPlanned: originalPlannedAmount,
            newPlanned: newPlannedAmount,
            change: -totalSplitAmount, // Negative change (reduction)
            plannedDate: entry.planned_date || '',
            description: `${entry.expense_description} (Original - planned amount reduced by splits)`
          }];

          // Then add the new split entries
          futureAllocations.push(...splits.map((split, index) => ({
            id: `new-entry-${index}`,
            originalPlanned: 0,
            newPlanned: split.amount,
            change: split.amount,
            plannedDate: split.date,
            description: split.description || `Split ${index + 1} from ${entry.expense_description}`
          })));

          notes.push(`${splits.length} new ledger entries will be created for the splits`);
          notes.push(`The original entry's planned amount will be reduced by ${this.formatCurrency(totalSplitAmount)}`);
          notes.push('The original entry will also be updated with actual amount and date');
        } else if (remainingAmount && remainingDate) {
          // Fallback to single remaining amount for backward compatibility
          const originalPlannedAmount = entry.planned_amount || 0;
          const newPlannedAmount = originalPlannedAmount - remainingAmount;

          totalChange = remainingAmount;
          entriesAffected = 2; // Original entry + 1 new entry

          futureAllocations = [
            {
              id: entry.id,
              originalPlanned: originalPlannedAmount,
              newPlanned: newPlannedAmount,
              change: -remainingAmount, // Negative change (reduction)
              plannedDate: entry.planned_date || '',
              description: `${entry.expense_description} (Original - planned amount reduced by remaining)`
            },
            {
              id: 'new-entry',
              originalPlanned: 0,
              newPlanned: remainingAmount,
              change: remainingAmount,
              plannedDate: remainingDate,
              description: `Remaining amount from ${entry.expense_description}`
            }
          ];
          notes.push('A new ledger entry will be created for the remaining amount');
          notes.push(`The original entry's planned amount will be reduced by ${this.formatCurrency(remainingAmount)}`);
          notes.push('The original entry will also be updated with actual amount and date');
        }
        break;

      case 'cost_overrun':
      case 'cost_underspend':
        if (relevelingScope && relevelingAlgorithm) {
          // Get future ledger entries for re-leveling
          const futureEntries = await this.getFutureLedgerEntries(entry, relevelingScope);

          if (futureEntries.length > 0) {
            const variance = scenario === 'cost_overrun' ?
              -((actualAmount || 0) - (entry.planned_amount || 0)) : // Negative for cost overrun (reduce future amounts)
              (entry.planned_amount || 0) - (actualAmount || 0);    // Positive for cost underspend (increase future amounts)

            const weights = this.calculateWeights(relevelingAlgorithm, weightIntensity, futureEntries.length);

            // Calculate the original transaction change (opposite of the variance)
            const originalTransactionChange = scenario === 'cost_overrun' ?
              (actualAmount || 0) - (entry.planned_amount || 0) : // Positive for cost overrun (increase original planned amount)
              -((entry.planned_amount || 0) - (actualAmount || 0)); // Negative for cost underspend (decrease original planned amount)

            // Start with the original transaction
            futureAllocations = [{
              id: entry.id,
              originalPlanned: entry.planned_amount || 0,
              newPlanned: (entry.planned_amount || 0) + originalTransactionChange,
              change: originalTransactionChange,
              plannedDate: actualDate || entry.planned_date || '',
              description: entry.expense_description || ''
            }];

            // Add future entries
            const futureAllocationChanges = futureEntries.map((futureEntry, index) => {
              const weight = weights[index] || 0;
              const change = variance * weight;

              return {
                id: futureEntry.id,
                originalPlanned: futureEntry.planned_amount || 0,
                newPlanned: (futureEntry.planned_amount || 0) + change,
                change,
                plannedDate: futureEntry.planned_date || '',
                description: futureEntry.expense_description || ''
              };
            });

            futureAllocations.push(...futureAllocationChanges);

            totalChange = 0; // Net change should be zero (debit = credit)
            entriesAffected = futureEntries.length + 1; // Include original transaction

            if (scenario === 'cost_overrun') {
              warnings.push('This will increase the original planned amount and reduce future planned amounts to cover the overrun');
            } else {
              notes.push('This will decrease the original planned amount and redistribute the underspent amount to future months');
            }
          } else {
            warnings.push('No future ledger entries found for re-leveling');
          }
        }
        break;

      case 'schedule_change':
        // Schedule change only affects the current entry
        totalChange = 0;
        entriesAffected = 1;
        futureAllocations = [{
          id: entry.id,
          originalPlanned: entry.planned_amount || 0,
          newPlanned: entry.planned_amount || 0,
          change: 0,
          plannedDate: actualDate || '',
          description: entry.expense_description || ''
        }];
        notes.push('Only the planned date will be updated');
        break;
    }

    return {
      totalChange,
      entriesAffected,
      scenario,
      futureAllocations,
      warnings,
      notes
    };
  }

  /**
   * Apply a partial delivery adjustment
   */
  static async applyPartialDelivery(request: PartialDeliveryRequest): Promise<{ originalEntry: LedgerEntry; newEntries: LedgerEntry[] }> {
    const { ledgerEntryId, splits, reason, userId, actualAmount, actualDate } = request;

    // Get the original ledger entry
    const originalEntry = await this.ledgerRepo.findOne({
      where: { id: ledgerEntryId },
      relations: ['program', 'wbsElement', 'costCategory', 'vendor']
    });

    if (!originalEntry) {
      throw new Error('Original ledger entry not found');
    }

    // Calculate total split amount
    const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
    const originalPlannedAmount = originalEntry.planned_amount || 0;
    const newPlannedAmount = originalPlannedAmount - totalSplitAmount;

    // Update the original entry with actuals and reduced planned amount
    originalEntry.actual_amount = actualAmount || originalEntry.actual_amount;
    originalEntry.actual_date = actualDate || originalEntry.actual_date;
    originalEntry.planned_amount = newPlannedAmount;
    originalEntry.notes = originalEntry.notes ?
      `${originalEntry.notes}\nPartial delivery applied: planned amount reduced by ${this.formatCurrency(totalSplitAmount)}` :
      `Partial delivery applied: planned amount reduced by ${this.formatCurrency(totalSplitAmount)}`;

    const updatedOriginalEntry = await this.ledgerRepo.save(originalEntry);

    // Create new ledger entries for each split
    const newEntries: LedgerEntry[] = [];
    for (const split of splits) {
      const newEntry = this.ledgerRepo.create({
        vendor_name: originalEntry.vendor_name,
        expense_description: split.description || `Split from ${originalEntry.expense_description}`,
        wbsElementId: originalEntry.wbsElementId,
        costCategoryId: originalEntry.costCategoryId,
        vendorId: originalEntry.vendorId,
        baseline_date: originalEntry.baseline_date,
        baseline_amount: originalEntry.baseline_amount,
        planned_date: split.date,
        planned_amount: split.amount,
        actual_date: null,
        actual_amount: null,
        notes: `Partial delivery split: ${split.description || 'No description'}`,
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

    // Log audit trail for original entry update
    await LedgerAuditTrailService.logAction({
      ledgerEntryId,
      action: AuditAction.UPDATED,
      description: `Partial delivery: planned amount reduced by ${this.formatCurrency(totalSplitAmount)}`,
      userId,
      source: AuditSource.TRANSACTION_ADJUSTMENT
    });

    // Log audit trail for each new split entry
    for (const newEntry of newEntries) {
      await LedgerAuditTrailService.logAction({
        ledgerEntryId: newEntry.id,
        action: AuditAction.CREATED,
        description: `Created from partial delivery split: ${reason}`,
        userId,
        source: AuditSource.TRANSACTION_ADJUSTMENT
      });
    }

    return {
      originalEntry: updatedOriginalEntry,
      newEntries
    };
  }

  /**
   * Apply a re-forecast adjustment
   */
  static async applyReForecast(request: ReForecastRequest): Promise<{ updatedEntry: LedgerEntry; affectedEntries: LedgerEntry[] }> {
    const {
      ledgerEntryId,
      scenario,
      relevelingScope,
      relevelingAlgorithm,
      weightIntensity = 0.5,
      customDistribution,
      baselineExceedanceJustification,
      reason,
      userId,
      actualAmount,
      actualDate
    } = request;

    // Get the original ledger entry
    const entry = await this.ledgerRepo.findOne({
      where: { id: ledgerEntryId },
      relations: ['program', 'wbsElement', 'costCategory', 'vendor']
    });

    if (!entry) {
      throw new Error('Ledger entry not found');
    }

    // Step 1: Confirm the match by updating the original ledger entry with actual transaction data
    if (actualAmount !== undefined) {
      entry.actual_amount = actualAmount;
      entry.actual_date = actualDate || entry.actual_date;
      // Note: Invoice link and invoice number would be updated here if provided
      // entry.invoice_link_text = invoiceLinkText;
      // entry.invoice_link_url = invoiceLinkUrl;
    }

    // Add a note about the re-forecast
    entry.notes = entry.notes ? `${entry.notes}\nRE-FORECAST: ${reason}` : `RE-FORECAST: ${reason}`;

    // Save the updated original entry
    const updatedEntry = await this.ledgerRepo.save(entry);

    // Step 2: Handle re-forecasting of future ledger entries (update their planned amounts/dates)
    let affectedEntries: LedgerEntry[] = [];

    if (relevelingScope !== 'single') {
      // Get future ledger entries for re-leveling
      const futureEntries = await this.getFutureLedgerEntries(updatedEntry, relevelingScope);

      if (futureEntries.length > 0) {
        // Calculate the variance based on the scenario
        const originalPlannedAmount = updatedEntry.planned_amount || 0;
        const actualAmountValue = actualAmount || 0;

        let variance = 0;
        if (scenario === 'cost_overrun') {
          // For cost overrun, we need to cover the overrun from future months
          variance = actualAmountValue - originalPlannedAmount;
        } else if (scenario === 'cost_underspend') {
          // For cost underspend, we need to redistribute the underspent amount to future months
          variance = originalPlannedAmount - actualAmountValue;
        }

        if (variance !== 0) {
          // Calculate redistribution weights
          const weights = this.calculateWeights(relevelingAlgorithm, weightIntensity, futureEntries.length);

          // Update each future entry's planned amount
          for (let i = 0; i < futureEntries.length; i++) {
            const futureEntry = futureEntries[i];
            const weight = weights[i] || 0;
            const adjustment = variance * weight;

            // Update planned amount (not actual amount)
            futureEntry.planned_amount = (futureEntry.planned_amount || 0) + adjustment;

            // Add note about the re-forecast adjustment
            futureEntry.notes = futureEntry.notes
              ? `${futureEntry.notes}\nRE-FORECAST ADJUSTMENT: ${this.formatCurrency(adjustment)} from ${scenario}`
              : `RE-FORECAST ADJUSTMENT: ${this.formatCurrency(adjustment)} from ${scenario}`;

            // Save the updated future entry
            const savedFutureEntry = await this.ledgerRepo.save(futureEntry);
            affectedEntries.push(savedFutureEntry);
          }
        }
      }
    }

    // Log audit trail for the original entry
    await LedgerAuditTrailService.logAction({
      ledgerEntryId,
      action: AuditAction.RE_FORECASTED,
      description: `Re-forecast for ${scenario}: ${reason}`,
      userId,
      source: AuditSource.TRANSACTION_ADJUSTMENT
    });

    return {
      updatedEntry,
      affectedEntries
    };
  }

  /**
   * Apply a schedule change adjustment
   */
  static async applyScheduleChange(request: ScheduleChangeRequest): Promise<{ updatedEntry: LedgerEntry }> {
    const { ledgerEntryId, newPlannedDate, reason, userId } = request;

    const entry = await this.ledgerRepo.findOne({ where: { id: ledgerEntryId } });
    if (!entry) {
      throw new Error('Ledger entry not found');
    }

    // Update the planned date
    entry.planned_date = newPlannedDate;
    entry.notes = entry.notes ? `${entry.notes}\nSchedule change: ${reason}` : `Schedule change: ${reason}`;

    const updatedEntry = await this.ledgerRepo.save(entry);

    // Log audit trail
    await LedgerAuditTrailService.logAction({
      ledgerEntryId,
      action: AuditAction.SCHEDULE_CHANGE,
      description: `Schedule change: ${reason}`,
      userId,
      source: AuditSource.TRANSACTION_ADJUSTMENT
    });

    return { updatedEntry };
  }

  /**
   * Validate an adjustment configuration
   */
  static async validateAdjustment(request: AllocationImpactRequest): Promise<ValidationResult> {
    const {
      ledgerEntryId,
      scenario,
      remainingAmount,
      remainingDate,
      relevelingScope,
      relevelingAlgorithm,
      weightIntensity,
      customDistribution,
      actualAmount,
      actualDate
    } = request;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate ledger entry exists
    const entry = await this.ledgerRepo.findOne({ where: { id: ledgerEntryId } });
    if (!entry) {
      errors.push('Ledger entry not found');
      return { isValid: false, errors, warnings };
    }

    // Scenario-specific validation
    switch (scenario) {
      case 'partial_delivery':
        if (!remainingAmount || remainingAmount <= 0) {
          errors.push('Remaining amount must be greater than 0');
        }
        if (!remainingDate) {
          errors.push('Remaining date is required');
        }
        if (remainingAmount && entry.planned_amount && remainingAmount >= entry.planned_amount) {
          errors.push('Remaining amount must be less than the original planned amount');
        }
        break;

      case 'cost_overrun':
      case 'cost_underspend':
        if (!relevelingScope) {
          errors.push('Re-leveling scope is required');
        }
        if (!relevelingAlgorithm) {
          errors.push('Re-leveling algorithm is required');
        }
        if (relevelingAlgorithm === 'custom' && (!customDistribution || Object.keys(customDistribution).length === 0)) {
          errors.push('Custom distribution is required for custom algorithm');
        }
        if (weightIntensity !== undefined && (weightIntensity < 0 || weightIntensity > 1)) {
          errors.push('Weight intensity must be between 0 and 1');
        }
        break;

      case 'schedule_change':
        if (!request.newPlannedDate) {
          errors.push('New planned date is required');
        }
        break;
    }

    // BOE-specific validation
    if (entry.createdFromBOE) {
      warnings.push('This entry was created from a BOE allocation - changes will not affect the baseline');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get future ledger entries for re-leveling
   */
  private static async getFutureLedgerEntries(
    entry: LedgerEntry,
    scope: 'single' | 'remaining' | 'entire'
  ): Promise<LedgerEntry[]> {
    const queryBuilder = this.ledgerRepo.createQueryBuilder('ledger')
      .leftJoinAndSelect('ledger.program', 'program')
      .where('program.id = :programId', { programId: entry.program.id })
      .andWhere('ledger.planned_date > :currentDate', { currentDate: entry.planned_date || new Date() })
      .orderBy('ledger.planned_date', 'ASC');

    if (scope === 'remaining' && entry.boeElementAllocationId) {
      // Only entries from the same BOE allocation
      queryBuilder.andWhere('ledger.boeElementAllocationId = :allocationId', {
        allocationId: entry.boeElementAllocationId
      });
    } else if (scope === 'entire' && entry.wbsElementId) {
      // All entries from the same WBS element
      queryBuilder.andWhere('ledger.wbsElementId = :wbsElementId', {
        wbsElementId: entry.wbsElementId
      });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Calculate weights for re-leveling algorithms
   */
  private static calculateWeights(
    algorithm: 'linear' | 'front-loaded' | 'back-loaded' | 'custom',
    intensity: number,
    count: number
  ): number[] {
    const weights: number[] = [];

    if (algorithm === 'linear') {
      for (let i = 0; i < count; i++) {
        weights.push(1 / count);
      }
    } else if (algorithm === 'front-loaded') {
      const weightSets = [
        [1.0, 0.0, 0.0, 0.0],     // Strong: 100%, 0%, 0%, 0%
        [0.75, 0.25, 0.0, 0.0],   // 75%, 25%, 0%, 0%
        [0.5, 0.5, 0.0, 0.0],     // 50%, 50%, 0%, 0%
        [0.5, 0.3, 0.2, 0.0],     // 50%, 30%, 20%, 0%
        [0.4, 0.3, 0.2, 0.1],     // Moderate: 40%, 30%, 20%, 10%
        [0.375, 0.275, 0.225, 0.125], // 37.5%, 27.5%, 22.5%, 12.5%
        [0.325, 0.275, 0.225, 0.175], // 32.5%, 27.5%, 22.5%, 17.5%
        [0.3, 0.25, 0.25, 0.2],   // 30%, 25%, 25%, 20%
        [0.25, 0.25, 0.25, 0.25]  // Linear: 25%, 25%, 25%, 25%
      ];
      const setIndex = Math.round((1 - intensity) * (weightSets.length - 1));
      const selectedWeights = weightSets[setIndex] || weightSets[0];

      for (let i = 0; i < count; i++) {
        weights.push(selectedWeights[i] || 0);
      }
    } else if (algorithm === 'back-loaded') {
      const weightSets = [
        [0.0, 0.0, 0.0, 1.0],     // Strong: 0%, 0%, 0%, 100%
        [0.0, 0.0, 0.25, 0.75],   // 0%, 0%, 25%, 75%
        [0.0, 0.0, 0.5, 0.5],     // 0%, 0%, 50%, 50%
        [0.0, 0.2, 0.3, 0.5],     // 0%, 20%, 30%, 50%
        [0.1, 0.2, 0.3, 0.4],     // Moderate: 10%, 20%, 30%, 40%
        [0.125, 0.225, 0.275, 0.375], // 12.5%, 22.5%, 27.5%, 37.5%
        [0.175, 0.225, 0.275, 0.325], // 17.5%, 22.5%, 27.5%, 32.5%
        [0.2, 0.25, 0.25, 0.3],   // 20%, 25%, 25%, 30%
        [0.25, 0.25, 0.25, 0.25]  // Linear: 25%, 25%, 25%, 25%
      ];
      const setIndex = Math.round((1 - intensity) * (weightSets.length - 1));
      const selectedWeights = weightSets[setIndex] || weightSets[0];

      for (let i = 0; i < count; i++) {
        weights.push(selectedWeights[i] || 0);
      }
    } else if (algorithm === 'custom') {
      // For custom, we'll use equal distribution as default
      for (let i = 0; i < count; i++) {
        weights.push(1 / count);
      }
    }

    return weights;
  }

  // Helper function to format currency
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}