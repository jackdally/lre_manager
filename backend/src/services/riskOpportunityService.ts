import { AppDataSource } from '../config/database';
import { Program } from '../entities/Program';
import { Risk } from '../entities/Risk';
import { BOEVersion } from '../entities/BOEVersion';
import { ManagementReserve } from '../entities/ManagementReserve';
import { ProgramSetupService } from './programSetupService';

const programRepository = AppDataSource.getRepository(Program);
const riskRepository = AppDataSource.getRepository(Risk);
const boeVersionRepository = AppDataSource.getRepository(BOEVersion);
const managementReserveRepository = AppDataSource.getRepository(ManagementReserve);

export class RiskOpportunityService {
  /**
   * Initialize Risk & Opportunity register for a program
   * This creates the register structure (marks it as initialized)
   * Actual risks and opportunities will be added later via the R&O tab
   */
  static async initializeRegister(programId: string): Promise<{ success: boolean; message: string }> {
    const program = await programRepository.findOne({ where: { id: programId } });

    if (!program) {
      throw new Error('Program not found');
    }

    // Mark the register as created in setup status
    // This is a simple initialization - full R&O entities will be created later
    await ProgramSetupService.markRiskOpportunityRegisterCreated(programId);

    return {
      success: true,
      message: 'Risk & Opportunity register initialized successfully'
    };
  }

  /**
   * Check if Risk & Opportunity register is initialized for a program
   */
  static async isRegisterInitialized(programId: string): Promise<boolean> {
    try {
      const setupStatus = await ProgramSetupService.getSetupStatus(programId);
      return setupStatus.riskOpportunityRegisterCreated;
    } catch (error) {
      console.error('Error checking register initialization:', error);
      return false;
    }
  }

  /**
   * Get risks for a program that are eligible for MR calculation
   * Filters out closed/mitigated risks and returns only active risks
   */
  static async getRisksForMRCalculation(programId: string): Promise<Risk[]> {
    const risks = await riskRepository.find({
      where: {
        program: { id: programId },
        status: 'Identified', // Only include active/identified risks
      },
      order: {
        createdAt: 'ASC',
      },
    });

    // Filter out risks with zero probability or zero cost impact
    return risks.filter(
      (risk) =>
        Number(risk.probability) > 0 &&
        Number(risk.costImpactMostLikely) > 0
    );
  }

  /**
   * Utilize Management Reserve for a materialized risk
   * Links MR utilization to the specific risk entry
   * 
   * @param riskId - Risk ID
   * @param amount - Amount of MR to utilize
   * @param reason - Reason for utilization
   * @returns Updated risk and MR records
   */
  static async utilizeMRForRisk(
    riskId: string,
    amount: number,
    reason: string
  ): Promise<{ risk: Risk; managementReserve: ManagementReserve }> {
    // Validate inputs
    if (!riskId) {
      throw new Error('Risk ID is required');
    }
    if (!amount || amount <= 0) {
      throw new Error('Invalid utilization amount');
    }
    if (!reason || !reason.trim()) {
      throw new Error('Reason is required');
    }

    // Get risk with program relation
    const risk = await riskRepository.findOne({
      where: { id: riskId },
      relations: ['program'],
    });

    if (!risk) {
      throw new Error('Risk not found');
    }

    if (!risk.program) {
      throw new Error('Risk program not found');
    }

    // Get current BOE version for the program
    const program = await programRepository.findOne({
      where: { id: risk.program.id },
    });

    if (!program || !program.currentBOEVersionId) {
      throw new Error('No current BOE version found for this program');
    }

    const boeVersion = await boeVersionRepository.findOne({
      where: { id: program.currentBOEVersionId },
    });

    if (!boeVersion) {
      throw new Error('Current BOE version not found');
    }

    // Get Management Reserve for this BOE version
    const mr = await managementReserveRepository.findOne({
      where: { boeVersion: { id: boeVersion.id } },
    });

    if (!mr) {
      throw new Error('Management reserve not found for this BOE version');
    }

    // Check if utilization amount exceeds remaining amount
    if (amount > mr.remainingAmount) {
      throw new Error(
        `Utilization amount (${amount}) exceeds remaining management reserve (${mr.remainingAmount})`
      );
    }

    // Update Management Reserve
    mr.utilizedAmount = Number(mr.utilizedAmount) + Number(amount);
    mr.remainingAmount = Math.max(0, Number(mr.adjustedAmount) - Number(mr.utilizedAmount));
    mr.utilizationPercentage =
      Number(mr.adjustedAmount) > 0
        ? (Number(mr.utilizedAmount) / Number(mr.adjustedAmount)) * 100
        : 0;
    mr.updatedAt = new Date();

    // Add utilization note linking to risk
    const utilizationNote = `Utilized $${amount.toFixed(2)} for Risk: "${risk.title}" on ${new Date().toISOString().split('T')[0]}. Reason: ${reason}`;
    mr.notes = mr.notes ? `${mr.notes}\n${utilizationNote}` : utilizationNote;

    // Update Risk with utilization data
    risk.materializedAt = risk.materializedAt || new Date();
    risk.mrUtilizedAmount = Number(risk.mrUtilizedAmount) + Number(amount);
    risk.mrUtilizationDate = new Date();
    risk.mrUtilizationReason = reason;
    risk.updatedAt = new Date();

    // Save both entities
    const updatedMR = await managementReserveRepository.save(mr);
    const updatedRisk = await riskRepository.save(risk);

    return {
      risk: updatedRisk,
      managementReserve: updatedMR,
    };
  }
}

