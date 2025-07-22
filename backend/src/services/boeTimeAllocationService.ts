import { AppDataSource } from '../config/database';
import { BOETimeAllocation } from '../entities/BOETimeAllocation';
import { Program } from '../entities/Program';
import { BOEElement } from '../entities/BOEElement';
import { LedgerEntry } from '../entities/LedgerEntry';

const timeAllocationRepository = AppDataSource.getRepository(BOETimeAllocation);
const programRepository = AppDataSource.getRepository(Program);
const boeElementRepository = AppDataSource.getRepository(BOEElement);
const ledgerRepository = AppDataSource.getRepository(LedgerEntry);

export class BOETimeAllocationService {
  /**
   * Create a new time allocation
   */
  static async createTimeAllocation(programId: string, allocationData: any): Promise<any> {
    const program = await programRepository.findOne({ where: { id: programId } });
    if (!program) {
      throw new Error('Program not found');
    }

    // Calculate number of months and monthly amount
    const startDate = new Date(allocationData.startDate);
    const endDate = new Date(allocationData.endDate);
    const numberOfMonths = this.calculateNumberOfMonths(startDate, endDate);
    const monthlyAmount = allocationData.totalAmount / numberOfMonths;

    // Generate monthly breakdown
    const monthlyBreakdown = this.generateMonthlyBreakdown(
      allocationData.totalAmount,
      startDate,
      endDate,
      allocationData.allocationType
    );

    const timeAllocation = timeAllocationRepository.create({
      ...allocationData,
      program,
      numberOfMonths,
      monthlyAmount,
      monthlyBreakdown,
      isActive: true
    });

    const savedTimeAllocation = await timeAllocationRepository.save(timeAllocation);
    return savedTimeAllocation;
  }

  /**
   * Calculate number of months between two dates
   */
  static calculateNumberOfMonths(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    return yearDiff * 12 + monthDiff + 1; // +1 to include both start and end months
  }

  /**
   * Generate monthly breakdown based on allocation type
   */
  static generateMonthlyBreakdown(
    totalAmount: number,
    startDate: Date,
    endDate: Date,
    allocationType: 'Linear' | 'Front-Loaded' | 'Back-Loaded' | 'Custom'
  ): { [month: string]: any } {
    const numberOfMonths = this.calculateNumberOfMonths(startDate, endDate);
    const breakdown: { [month: string]: any } = {};

    let currentDate = new Date(startDate);
    let remainingAmount = totalAmount;

    for (let i = 0; i < numberOfMonths; i++) {
      const monthKey = currentDate.toISOString().slice(0, 7); // YYYY-MM format
      let monthlyAmount: number;

      switch (allocationType) {
        case 'Linear':
          monthlyAmount = totalAmount / numberOfMonths;
          break;
        case 'Front-Loaded':
          // 60% in first 30% of months, 30% in middle 40%, 10% in last 30%
          if (i < Math.ceil(numberOfMonths * 0.3)) {
            monthlyAmount = (totalAmount * 0.6) / Math.ceil(numberOfMonths * 0.3);
          } else if (i < Math.ceil(numberOfMonths * 0.7)) {
            monthlyAmount = (totalAmount * 0.3) / (Math.ceil(numberOfMonths * 0.7) - Math.ceil(numberOfMonths * 0.3));
          } else {
            monthlyAmount = (totalAmount * 0.1) / (numberOfMonths - Math.ceil(numberOfMonths * 0.7));
          }
          break;
        case 'Back-Loaded':
          // 10% in first 30% of months, 30% in middle 40%, 60% in last 30%
          if (i < Math.ceil(numberOfMonths * 0.3)) {
            monthlyAmount = (totalAmount * 0.1) / Math.ceil(numberOfMonths * 0.3);
          } else if (i < Math.ceil(numberOfMonths * 0.7)) {
            monthlyAmount = (totalAmount * 0.3) / (Math.ceil(numberOfMonths * 0.7) - Math.ceil(numberOfMonths * 0.3));
          } else {
            monthlyAmount = (totalAmount * 0.6) / (numberOfMonths - Math.ceil(numberOfMonths * 0.7));
          }
          break;
        case 'Custom':
          // For custom, we'll use linear as default and allow manual adjustment
          monthlyAmount = totalAmount / numberOfMonths;
          break;
        default:
          monthlyAmount = totalAmount / numberOfMonths;
      }

      // Ensure we don't exceed remaining amount
      monthlyAmount = Math.min(monthlyAmount, remainingAmount);
      remainingAmount -= monthlyAmount;

      breakdown[monthKey] = {
        amount: Math.round(monthlyAmount * 100) / 100, // Round to 2 decimal places
        date: currentDate.toISOString().slice(0, 10),
        isLocked: false
      };

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return breakdown;
  }

  /**
   * Push time allocation to ledger as baseline entries
   */
  static async pushToLedger(timeAllocationId: string): Promise<void> {
    const timeAllocation = await timeAllocationRepository.findOne({
      where: { id: timeAllocationId },
      relations: ['program', 'boeElement']
    });

    if (!timeAllocation) {
      throw new Error('Time allocation not found');
    }

    if (timeAllocation.isLocked) {
      throw new Error('Time allocation is already locked and pushed to ledger');
    }

    const monthlyBreakdown = timeAllocation.monthlyBreakdown;
    if (!monthlyBreakdown) {
      throw new Error('No monthly breakdown found');
    }

    // Create ledger entries for each month
    for (const [month, data] of Object.entries(monthlyBreakdown)) {
      const ledgerEntry = ledgerRepository.create({
        vendor_name: timeAllocation.name,
        expense_description: timeAllocation.description,
        wbsElementId: timeAllocation.boeElementId,
        baseline_date: data.date,
        baseline_amount: data.amount,
        planned_date: data.date,
        planned_amount: data.amount,
        program: timeAllocation.program,
        notes: `Time allocation: ${timeAllocation.name} - ${month}`
      });

      await ledgerRepository.save(ledgerEntry);
    }

    // Lock the time allocation
    timeAllocation.isLocked = true;
    await timeAllocationRepository.save(timeAllocation);
  }

  /**
   * Update actual amounts from ledger entries
   */
  static async updateActualsFromLedger(timeAllocationId: string): Promise<void> {
    const timeAllocation = await timeAllocationRepository.findOne({
      where: { id: timeAllocationId }
    });

    if (!timeAllocation) {
      throw new Error('Time allocation not found');
    }

    // Get ledger entries for this time allocation
    const ledgerEntries = await ledgerRepository.find({
      where: {
        program: { id: timeAllocation.programId },
        vendor_name: timeAllocation.name,
        expense_description: timeAllocation.description
      }
    });

    // Update monthly breakdown with actual amounts
    const monthlyBreakdown = { ...timeAllocation.monthlyBreakdown };
    
    for (const entry of ledgerEntries) {
      if (entry.actual_amount && entry.actual_date) {
        const month = entry.actual_date.slice(0, 7);
        if (monthlyBreakdown && monthlyBreakdown[month]) {
          monthlyBreakdown[month].actualAmount = entry.actual_amount;
          monthlyBreakdown[month].actualDate = entry.actual_date;
        }
      }
    }

    timeAllocation.monthlyBreakdown = monthlyBreakdown;
    await timeAllocationRepository.save(timeAllocation);
  }

  /**
   * Get time allocation summary for a program
   */
  static async getTimeAllocationSummary(programId: string): Promise<any> {
    const timeAllocations = await timeAllocationRepository.find({
      where: { program: { id: programId } },
      relations: ['boeElement']
    });

    const summary = {
      totalAllocations: timeAllocations.length,
      totalAmount: 0,
      allocatedAmount: 0,
      actualAmount: 0,
      variance: 0,
      allocations: timeAllocations.map(allocation => {
        const totalAllocated = Object.values(allocation.monthlyBreakdown || {}).reduce(
          (sum: number, month: any) => sum + (month.amount || 0), 0
        );
        const totalActual = Object.values(allocation.monthlyBreakdown || {}).reduce(
          (sum: number, month: any) => sum + (month.actualAmount || 0), 0
        );

        return {
          id: allocation.id,
          name: allocation.name,
          totalAmount: allocation.totalAmount,
          allocatedAmount: totalAllocated,
          actualAmount: totalActual,
          variance: totalActual - totalAllocated,
          isLocked: allocation.isLocked,
          startDate: allocation.startDate,
          endDate: allocation.endDate
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
   * Validate time allocation data
   */
  static validateTimeAllocation(data: any): { isValid: boolean; errors: string[] } {
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

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 