import { AppDataSource } from '../config/database';
import { Program } from '../entities/Program';
import { Risk } from '../entities/Risk';
import { Opportunity } from '../entities/Opportunity';
import { RiskNote } from '../entities/RiskNote';
import { OpportunityNote } from '../entities/OpportunityNote';
import { BOEVersion } from '../entities/BOEVersion';
import { ManagementReserve } from '../entities/ManagementReserve';
import { ProgramSetupService } from './programSetupService';
import { RiskCategory } from '../entities/RiskCategory';

const programRepository = AppDataSource.getRepository(Program);
const riskRepository = AppDataSource.getRepository(Risk);
const opportunityRepository = AppDataSource.getRepository(Opportunity);
const riskNoteRepository = AppDataSource.getRepository(RiskNote);
const opportunityNoteRepository = AppDataSource.getRepository(OpportunityNote);
const boeVersionRepository = AppDataSource.getRepository(BOEVersion);
const managementReserveRepository = AppDataSource.getRepository(ManagementReserve);
const riskCategoryRepository = AppDataSource.getRepository(RiskCategory);

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
   * Check if a risk is realized (risk occurred - hit to the program)
   */
  static isRiskRealized(disposition: string): boolean {
    return disposition === 'Realized';
  }

  /**
   * Check if an opportunity is realized (opportunity captured - benefit obtained)
   */
  static isOpportunityRealized(disposition: string): boolean {
    return disposition === 'Realized';
  }

  /**
   * Check if a risk is closed (avoided/neutralized - not a hit)
   * Closed states for risks: Retired, Mitigated, Transferred, Accepted
   * Note: Realized is NOT included here - it's a different category (risk occurred)
   */
  static isRiskClosed(disposition: string): boolean {
    const closedStates = ['Retired', 'Mitigated', 'Transferred', 'Accepted'];
    return closedStates.includes(disposition);
  }

  /**
   * Check if an opportunity is closed (no longer relevant)
   * Closed states for opportunities: Retired, Lost
   * Note: Realized is NOT included here - it's a positive outcome
   */
  static isOpportunityClosed(disposition: string): boolean {
    const closedStates = ['Retired', 'Lost'];
    return closedStates.includes(disposition);
  }

  /**
   * Check if a risk is active (not closed and not realized)
   */
  static isRiskActive(disposition: string): boolean {
    return !this.isRiskClosed(disposition) && !this.isRiskRealized(disposition);
  }

  /**
   * Check if an opportunity is active (not closed and not realized)
   */
  static isOpportunityActive(disposition: string): boolean {
    return !this.isOpportunityClosed(disposition) && !this.isOpportunityRealized(disposition);
  }

  /**
   * Get risks for a program that are eligible for MR calculation
   * Filters out closed risks and returns only active risks
   */
  static async getRisksForMRCalculation(programId: string): Promise<Risk[]> {
    const risks = await riskRepository.find({
      where: {
        program: { id: programId },
      },
      order: {
        createdAt: 'ASC',
      },
    });

    // Filter out closed risks and risks with zero probability or zero cost impact
    return risks.filter(
      (risk) =>
        this.isRiskActive(risk.disposition) &&
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
    
    // When MR is used, the risk has materialized - transition to "Realized" disposition
    // This is a terminal state indicating the risk has occurred
    risk.disposition = 'Realized';
    risk.dispositionDate = new Date();
    risk.dispositionReason = `Risk materialized - MR utilized: ${reason}`;
    risk.status = 'Closed'; // Realized is a terminal/closed state
    risk.updatedAt = new Date();

    // Save both entities
    const updatedMR = await managementReserveRepository.save(mr);
    const updatedRisk = await riskRepository.save(risk);

    return {
      risk: updatedRisk,
      managementReserve: updatedMR,
    };
  }

  /**
   * Calculate expected value using PERT formula
   * Expected Value = (Min + 4×MostLikely + Max) / 6
   */
  static calculateExpectedValue(min: number, mostLikely: number, max: number): number {
    if (min > mostLikely || mostLikely > max) {
      throw new Error('Invalid range: min must be <= mostLikely <= max');
    }
    return (min + 4 * mostLikely + max) / 6;
  }

  /**
   * Calculate risk score
   * Risk Score = SeverityWeight × Probability × ExpectedValue
   * Severity weights: Low=1, Medium=2, High=3, Critical=4
   * Probability is converted from 0-100% to 0-1 range
   */
  static calculateRiskScore(risk: Risk): number {
    const severityWeights: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Critical: 4,
    };

    const expectedValue = this.calculateExpectedValue(
      Number(risk.costImpactMin),
      Number(risk.costImpactMostLikely),
      Number(risk.costImpactMax)
    );

    const severityWeight = severityWeights[risk.severity] || 1;
    const probability = Number(risk.probability) / 100; // Convert to 0-1 range

    return severityWeight * probability * expectedValue;
  }

  /**
   * Calculate opportunity score
   * Opportunity Score = BenefitSeverityWeight × Probability × ExpectedBenefit
   * Probability is converted from 0-100% to 0-1 range
   */
  static calculateOpportunityScore(opportunity: Opportunity): number {
    const severityWeights: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Critical: 4,
    };

    const expectedBenefit = this.calculateExpectedValue(
      Number(opportunity.benefitMin),
      Number(opportunity.benefitMostLikely),
      Number(opportunity.benefitMax)
    );

    const severityWeight = severityWeights[opportunity.benefitSeverity] || 1;
    const probability = Number(opportunity.probability) / 100; // Convert to 0-1 range

    return severityWeight * probability * expectedBenefit;
  }

  /**
   * Get risk matrix data for visualization (5x5 grid)
   * Returns count of risks in each severity/probability range cell
   * Uses probability ranges (0-20%, 21-40%, etc.) instead of discrete likelihood categories
   */
  static async getRiskMatrix(programId: string): Promise<any> {
    const risks = await riskRepository.find({
      where: {
        program: { id: programId },
        // Include all active risks (not retired)
      },
    });

    // Filter out closed and realized risks - only show active risks in matrix
    const activeRisks = risks.filter(r => this.isRiskActive(r.disposition));

    const severityLevels = ['Low', 'Medium', 'High', 'Critical'];
    // Use probability ranges instead of likelihood categories
    const probabilityRanges = [
      { label: '0-20%', min: 0, max: 20 },
      { label: '21-40%', min: 21, max: 40 },
      { label: '41-60%', min: 41, max: 60 },
      { label: '61-80%', min: 61, max: 80 },
      { label: '81-100%', min: 81, max: 100 },
    ];
    
    // Map probability to probability range
    const getProbabilityRange = (probability: number): string => {
      const prob = Number(probability) || 0;
      if (prob <= 20) return '0-20%';
      if (prob <= 40) return '21-40%';
      if (prob <= 60) return '41-60%';
      if (prob <= 80) return '61-80%';
      return '81-100%';
    };

    const matrix: any = {};
    severityLevels.forEach(severity => {
      matrix[severity] = {};
      probabilityRanges.forEach(range => {
        matrix[severity][range.label] = 0;
      });
    });

    activeRisks.forEach(risk => {
      const probabilityRange = getProbabilityRange(Number(risk.probability));
      matrix[risk.severity][probabilityRange]++;
    });

    return {
      matrix,
      totalRisks: activeRisks.length,
      risks: activeRisks.map(r => ({
        id: r.id,
        title: r.title,
        severity: r.severity,
        probability: Number(r.probability),
        probabilityRange: getProbabilityRange(Number(r.probability)),
        expectedValue: this.calculateExpectedValue(
          Number(r.costImpactMin),
          Number(r.costImpactMostLikely),
          Number(r.costImpactMax)
        ),
        riskScore: this.calculateRiskScore(r),
      })),
    };
  }

  /**
   * Get opportunity matrix data for visualization (5x5 grid)
   */
  static async getOpportunityMatrix(programId: string): Promise<any> {
    const opportunities = await opportunityRepository.find({
      where: {
        program: { id: programId },
        // Include all active opportunities (not retired, not lost)
      },
    });

    // Filter out closed and realized opportunities - only show active opportunities in matrix
    const activeOpportunities = opportunities.filter(o => this.isOpportunityActive(o.disposition));

    const severityLevels = ['Low', 'Medium', 'High', 'Critical'];
    // Use probability ranges instead of likelihood categories
    const probabilityRanges = [
      { label: '0-20%', min: 0, max: 20 },
      { label: '21-40%', min: 21, max: 40 },
      { label: '41-60%', min: 41, max: 60 },
      { label: '61-80%', min: 61, max: 80 },
      { label: '81-100%', min: 81, max: 100 },
    ];
    
    // Map probability to probability range
    const getProbabilityRange = (probability: number): string => {
      const prob = Number(probability) || 0;
      if (prob <= 20) return '0-20%';
      if (prob <= 40) return '21-40%';
      if (prob <= 60) return '41-60%';
      if (prob <= 80) return '61-80%';
      return '81-100%';
    };

    const matrix: any = {};
    severityLevels.forEach(severity => {
      matrix[severity] = {};
      probabilityRanges.forEach(range => {
        matrix[severity][range.label] = 0;
      });
    });

    activeOpportunities.forEach(opportunity => {
      const probabilityRange = getProbabilityRange(Number(opportunity.probability));
      matrix[opportunity.benefitSeverity][probabilityRange]++;
    });

    return {
      matrix,
      totalOpportunities: activeOpportunities.length,
      opportunities: activeOpportunities.map(o => ({
        id: o.id,
        title: o.title,
        severity: o.benefitSeverity,
        probability: Number(o.probability),
        probabilityRange: getProbabilityRange(Number(o.probability)),
        expectedBenefit: this.calculateExpectedValue(
          Number(o.benefitMin),
          Number(o.benefitMostLikely),
          Number(o.benefitMax)
        ),
        opportunityScore: this.calculateOpportunityScore(o),
      })),
    };
  }

  /**
   * Validate disposition transition
   * Returns true if transition is valid, false otherwise
   */
  static isValidDispositionTransition(
    currentDisposition: string,
    newDisposition: string
  ): boolean {
    // Define valid transitions for risks (allows reversals)
    const riskTransitions: Record<string, string[]> = {
      Identified: ['In Progress', 'Mitigated', 'Retired', 'Transferred', 'Accepted'],
      'In Progress': ['Mitigated', 'Realized', 'Retired', 'Transferred', 'Accepted', 'Identified'],
      Mitigated: ['Retired', 'In Progress'],
      Realized: ['Retired', 'In Progress'],
      Retired: ['In Progress', 'Mitigated', 'Realized', 'Transferred', 'Accepted'],
      Transferred: ['Retired', 'In Progress'],
      Accepted: ['Retired', 'In Progress'],
    };

    // Define valid transitions for opportunities (allows reversals)
    const opportunityTransitions: Record<string, string[]> = {
      Identified: ['In Progress', 'Realized', 'Retired', 'Deferred'],
      'In Progress': ['Realized', 'Retired', 'Deferred', 'Lost', 'Identified'],
      Realized: ['Retired', 'In Progress'],
      Retired: ['In Progress', 'Realized', 'Deferred'],
      Deferred: ['Identified', 'In Progress', 'Retired', 'Lost'],
      Lost: ['Retired', 'In Progress'],
    };

    // Check both risk and opportunity transitions (some dispositions exist in both)
    const riskAllowed = riskTransitions[currentDisposition] || [];
    const opportunityAllowed = opportunityTransitions[currentDisposition] || [];
    const allowed = [...new Set([...riskAllowed, ...opportunityAllowed])];
    
    return allowed.includes(newDisposition);
  }

  /**
   * Get valid risk transitions for a given disposition
   * Allows reversals to enable correction of mistakes
   */
  static getValidRiskTransitions(currentDisposition: string): string[] {
    const riskTransitions: Record<string, string[]> = {
      Identified: ['In Progress', 'Mitigated', 'Realized', 'Retired', 'Transferred', 'Accepted'], // Allow Realized for materialization
      'In Progress': ['Mitigated', 'Realized', 'Retired', 'Transferred', 'Accepted', 'Identified'],
      Mitigated: ['Retired', 'In Progress'], // Can go back to In Progress if mistake
      Realized: ['In Progress'], // Terminal state - can only be reversed to In Progress (requires MR reversal)
      Retired: ['In Progress', 'Mitigated', 'Realized', 'Transferred', 'Accepted'], // Can reopen from retired
      Transferred: ['Retired', 'In Progress'], // Can go back to In Progress if mistake
      Accepted: ['Retired', 'In Progress'], // Can go back to In Progress if mistake
    };
    return riskTransitions[currentDisposition] || [];
  }

  /**
   * Get valid opportunity transitions for a given disposition
   * Allows reversals to enable correction of mistakes
   */
  static getValidOpportunityTransitions(currentDisposition: string): string[] {
    const opportunityTransitions: Record<string, string[]> = {
      Identified: ['In Progress', 'Realized', 'Retired', 'Deferred'],
      'In Progress': ['Realized', 'Retired', 'Deferred', 'Lost', 'Identified'],
      Realized: ['In Progress'], // Terminal state - can only be reversed to In Progress
      Retired: ['In Progress', 'Realized', 'Deferred'], // Can reopen from retired
      Deferred: ['Identified', 'In Progress', 'Retired', 'Lost'],
      Lost: ['Retired', 'In Progress'], // Can go back to In Progress if mistake
    };
    return opportunityTransitions[currentDisposition] || [];
  }

  /**
   * Update risk disposition with validation
   */
  static async updateRiskDisposition(
    riskId: string,
    disposition: string,
    reason: string,
    dispositionDate?: Date
  ): Promise<Risk> {
    const risk = await riskRepository.findOne({ 
      where: { id: riskId },
      relations: ['program']
    });
    if (!risk) {
      throw new Error('Risk not found');
    }

    if (!this.isValidDispositionTransition(risk.disposition, disposition)) {
      const validTransitions = this.getValidRiskTransitions(risk.disposition);
      const validList = validTransitions.length > 0 
        ? `Valid next states are: ${validTransitions.join(', ')}.`
        : 'This is a terminal state and no further transitions are allowed.';
      throw new Error(
        `Invalid disposition transition from "${risk.disposition}" to "${disposition}". ${validList}`
      );
    }

    // Check if transitioning from "Realized" to "In Progress" - need to reverse MR utilization
    const isReversingRealization = risk.disposition === 'Realized' && disposition === 'In Progress';
    
    if (isReversingRealization && risk.mrUtilizedAmount && Number(risk.mrUtilizedAmount) > 0) {
      // Reverse MR utilization
      if (!risk.program) {
        throw new Error('Risk program not found - cannot reverse MR utilization');
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

      const utilizedAmount = Number(risk.mrUtilizedAmount);
      
      // Reverse MR utilization - subtract from utilized, add back to remaining
      mr.utilizedAmount = Math.max(0, Number(mr.utilizedAmount) - utilizedAmount);
      mr.remainingAmount = Math.max(0, Number(mr.adjustedAmount) - Number(mr.utilizedAmount));
      mr.utilizationPercentage =
        Number(mr.adjustedAmount) > 0
          ? (Number(mr.utilizedAmount) / Number(mr.adjustedAmount)) * 100
          : 0;
      mr.updatedAt = new Date();

      // Add reversal note
      const reversalNote = `Reversed $${utilizedAmount.toFixed(2)} MR utilization for Risk: "${risk.title}" on ${new Date().toISOString().split('T')[0]}. Reason: ${reason}`;
      mr.notes = mr.notes ? `${mr.notes}\n${reversalNote}` : reversalNote;

      // Clear MR utilization fields on risk
      risk.mrUtilizedAmount = 0;
      risk.mrUtilizationDate = null;
      risk.mrUtilizationReason = null;
      risk.materializedAt = null;

      // Save MR
      await managementReserveRepository.save(mr);
    }

    risk.disposition = disposition as any;
    risk.dispositionReason = reason;
    risk.dispositionDate = dispositionDate || new Date();
    risk.updatedAt = new Date();

    // Update status based on disposition
    // Realized is a terminal state (risk has occurred) - should be closed
    if (['Mitigated', 'Realized', 'Retired', 'Transferred', 'Accepted'].includes(disposition)) {
      risk.status = 'Closed';
    } else if (disposition === 'In Progress') {
      risk.status = 'In Progress';
    } else {
      risk.status = 'Identified';
    }

    return await riskRepository.save(risk);
  }

  /**
   * Update opportunity disposition with validation
   */
  static async updateOpportunityDisposition(
    opportunityId: string,
    disposition: string,
    reason: string,
    dispositionDate?: Date
  ): Promise<Opportunity> {
    const opportunity = await opportunityRepository.findOne({
      where: { id: opportunityId },
    });
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    if (!this.isValidDispositionTransition(opportunity.disposition, disposition)) {
      const validTransitions = this.getValidOpportunityTransitions(opportunity.disposition);
      const validList = validTransitions.length > 0 
        ? `Valid next states are: ${validTransitions.join(', ')}.`
        : 'This is a terminal state and no further transitions are allowed.';
      throw new Error(
        `Invalid disposition transition from "${opportunity.disposition}" to "${disposition}". ${validList}`
      );
    }

    opportunity.disposition = disposition as any;
    opportunity.dispositionReason = reason;
    opportunity.dispositionDate = dispositionDate || new Date();
    opportunity.updatedAt = new Date();

    // Update status based on disposition
    if (['Realized', 'Retired', 'Lost'].includes(disposition)) {
      opportunity.status = 'Closed';
    } else if (disposition === 'In Progress') {
      opportunity.status = 'In Progress';
    } else {
      opportunity.status = 'Identified';
    }

    return await opportunityRepository.save(opportunity);
  }

  /**
   * Add note to risk
   */
  static async addRiskNote(
    riskId: string,
    note: string,
    createdBy?: string
  ): Promise<RiskNote> {
    const risk = await riskRepository.findOne({ where: { id: riskId } });
    if (!risk) {
      throw new Error('Risk not found');
    }

    const riskNote = riskNoteRepository.create({
      risk,
      note,
      createdBy: createdBy || null,
    });

    return await riskNoteRepository.save(riskNote);
  }

  /**
   * Get all notes for a risk
   */
  static async getRiskNotes(riskId: string): Promise<RiskNote[]> {
    return await riskNoteRepository.find({
      where: { risk: { id: riskId } },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Add note to opportunity
   */
  static async addOpportunityNote(
    opportunityId: string,
    note: string,
    createdBy?: string
  ): Promise<OpportunityNote> {
    const opportunity = await opportunityRepository.findOne({
      where: { id: opportunityId },
    });
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    const opportunityNote = opportunityNoteRepository.create({
      opportunity,
      note,
      createdBy: createdBy || null,
    });

    return await opportunityNoteRepository.save(opportunityNote);
  }

  /**
   * Get all notes for an opportunity
   */
  static async getOpportunityNotes(opportunityId: string): Promise<OpportunityNote[]> {
    return await opportunityNoteRepository.find({
      where: { opportunity: { id: opportunityId } },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Ensure standard risk categories exist in the database
   * This should be called on application startup to ensure all standard categories are available
   */
  static async ensureStandardCategories(): Promise<void> {
    const standardCategories = [
      {
        code: 'TECHNICAL',
        name: 'Technical',
        description: 'Technical risks related to design, development, or implementation',
        isActive: true,
        isSystem: true,
      },
      {
        code: 'FINANCIAL',
        name: 'Financial',
        description: 'Financial risks including budget overruns, cost increases',
        isActive: true,
        isSystem: true,
      },
      {
        code: 'SCHEDULE',
        name: 'Schedule',
        description: 'Schedule risks including delays, timeline issues',
        isActive: true,
        isSystem: true,
      },
      {
        code: 'REGULATORY',
        name: 'Regulatory',
        description: 'Regulatory and compliance risks',
        isActive: true,
        isSystem: true,
      },
      {
        code: 'VENDOR',
        name: 'Vendor',
        description: 'Vendor and supplier risks',
        isActive: true,
        isSystem: true,
      },
      {
        code: 'OPERATIONAL',
        name: 'Operational',
        description: 'Operational and process risks',
        isActive: true,
        isSystem: true,
      },
      {
        code: 'OTHER',
        name: 'Other',
        description: 'Other miscellaneous risks',
        isActive: true,
        isSystem: true,
      },
    ];

    for (const categoryData of standardCategories) {
      // Check if category already exists by code
      let category = await riskCategoryRepository.findOne({ where: { code: categoryData.code } });

      if (!category) {
        // Create new category
        category = riskCategoryRepository.create(categoryData);
        await riskCategoryRepository.save(category);
        console.log(`[Risk Categories] Created category: ${category.code} - ${category.name}`);
      } else {
        // Update existing category to ensure it's marked as system category
        if (!category.isSystem) {
          category.isSystem = true;
          category.isActive = true;
          await riskCategoryRepository.save(category);
          console.log(`[Risk Categories] Updated category to system category: ${category.code} - ${category.name}`);
        }
      }
    }
  }
}

