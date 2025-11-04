import { AppDataSource } from '../config/database';
import { Program } from '../entities/Program';
import { Risk } from '../entities/Risk';
import { ProgramSetupService } from './programSetupService';

const programRepository = AppDataSource.getRepository(Program);
const riskRepository = AppDataSource.getRepository(Risk);

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
}

