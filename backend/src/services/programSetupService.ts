import { AppDataSource } from '../config/database';
import { ProgramSetupStatus } from '../entities/ProgramSetupStatus';
import { Program } from '../entities/Program';

const programSetupStatusRepository = AppDataSource.getRepository(ProgramSetupStatus);
const programRepository = AppDataSource.getRepository(Program);

export interface SetupStatusResponse {
  programId: string;
  boeCreated: boolean;
  boeApproved: boolean;
  boeBaselined: boolean;
  riskOpportunityRegisterCreated: boolean;
  setupComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProgramSetupService {
  /**
   * Get or create setup status for a program
   */
  static async getSetupStatus(programId: string): Promise<SetupStatusResponse> {
    let setupStatus = await programSetupStatusRepository.findOne({
      where: { programId },
      relations: ['program']
    });

    // If no setup status exists, create one
    if (!setupStatus) {
      const program = await programRepository.findOne({ where: { id: programId } });
      if (!program) {
        throw new Error('Program not found');
      }

      setupStatus = programSetupStatusRepository.create({
        programId,
        program,
        boeCreated: false,
        boeApproved: false,
        boeBaselined: false,
        riskOpportunityRegisterCreated: false
      });

      await programSetupStatusRepository.save(setupStatus);
    }

    return this.formatSetupStatusResponse(setupStatus);
  }

  /**
   * Update setup status for a program
   */
  static async updateSetupStatus(
    programId: string,
    updates: {
      boeCreated?: boolean;
      boeApproved?: boolean;
      boeBaselined?: boolean;
      riskOpportunityRegisterCreated?: boolean;
    }
  ): Promise<SetupStatusResponse> {
    let setupStatus = await programSetupStatusRepository.findOne({
      where: { programId },
      relations: ['program']
    });

    if (!setupStatus) {
      // Create if doesn't exist
      const program = await programRepository.findOne({ where: { id: programId } });
      if (!program) {
        throw new Error('Program not found');
      }

      setupStatus = programSetupStatusRepository.create({
        programId,
        program,
        boeCreated: false,
        boeApproved: false,
        boeBaselined: false,
        riskOpportunityRegisterCreated: false
      });
    }

    // Update fields
    if (updates.boeCreated !== undefined) {
      setupStatus.boeCreated = updates.boeCreated;
    }
    if (updates.boeApproved !== undefined) {
      setupStatus.boeApproved = updates.boeApproved;
    }
    if (updates.boeBaselined !== undefined) {
      setupStatus.boeBaselined = updates.boeBaselined;
    }
    if (updates.riskOpportunityRegisterCreated !== undefined) {
      setupStatus.riskOpportunityRegisterCreated = updates.riskOpportunityRegisterCreated;
    }

    await programSetupStatusRepository.save(setupStatus);

    return this.formatSetupStatusResponse(setupStatus);
  }

  /**
   * Mark BOE as created
   */
  static async markBOECreated(programId: string): Promise<SetupStatusResponse> {
    return this.updateSetupStatus(programId, { boeCreated: true });
  }

  /**
   * Mark BOE as approved
   */
  static async markBOEApproved(programId: string): Promise<SetupStatusResponse> {
    return this.updateSetupStatus(programId, { boeApproved: true });
  }

  /**
   * Mark BOE as baselined (pushed to ledger)
   */
  static async markBOEBaselined(programId: string): Promise<SetupStatusResponse> {
    return this.updateSetupStatus(programId, { boeBaselined: true });
  }

  /**
   * Mark Risk & Opportunity register as created
   */
  static async markRiskOpportunityRegisterCreated(programId: string): Promise<SetupStatusResponse> {
    return this.updateSetupStatus(programId, { riskOpportunityRegisterCreated: true });
  }

  /**
   * Check if setup is complete
   */
  static isSetupComplete(setupStatus: ProgramSetupStatus): boolean {
    return (
      setupStatus.boeCreated &&
      setupStatus.boeApproved &&
      setupStatus.boeBaselined &&
      setupStatus.riskOpportunityRegisterCreated
    );
  }

  /**
   * Format setup status response with computed setupComplete field
   */
  private static formatSetupStatusResponse(setupStatus: ProgramSetupStatus): SetupStatusResponse {
    return {
      programId: setupStatus.programId,
      boeCreated: setupStatus.boeCreated,
      boeApproved: setupStatus.boeApproved,
      boeBaselined: setupStatus.boeBaselined,
      riskOpportunityRegisterCreated: setupStatus.riskOpportunityRegisterCreated,
      setupComplete: this.isSetupComplete(setupStatus),
      createdAt: setupStatus.createdAt,
      updatedAt: setupStatus.updatedAt
    };
  }

  /**
   * Initialize setup status for a new program
   * Called when a program is created
   */
  static async initializeSetupStatus(programId: string): Promise<ProgramSetupStatus> {
    const program = await programRepository.findOne({ where: { id: programId } });
    if (!program) {
      throw new Error('Program not found');
    }

    // Check if setup status already exists
    const existing = await programSetupStatusRepository.findOne({
      where: { programId }
    });

    if (existing) {
      return existing;
    }

    const setupStatus = programSetupStatusRepository.create({
      programId,
      program,
      boeCreated: false,
      boeApproved: false,
      boeBaselined: false,
      riskOpportunityRegisterCreated: false
    });

    return await programSetupStatusRepository.save(setupStatus);
  }
}

