import { AppDataSource } from '../config/database';
import { BOEVersion } from '../entities/BOEVersion';
import { BOEApproval } from '../entities/BOEApproval';
import { Program } from '../entities/Program';
import { NotificationService } from './notificationService';

const boeVersionRepository = AppDataSource.getRepository(BOEVersion);
const boeApprovalRepository = AppDataSource.getRepository(BOEApproval);
const programRepository = AppDataSource.getRepository(Program);

export interface ApprovalLevel {
  level: number;
  role: string;
  name: string;
  email: string;
  isRequired: boolean;
  sequenceOrder: number;
  amountThreshold?: number; // Minimum BOE amount for this level
}

export interface ApprovalWorkflowConfig {
  levels: ApprovalLevel[];
  escalationDays: number; // Days before escalation
  autoEscalate: boolean;
}

export class ApprovalWorkflowService {
  private static readonly DEFAULT_CONFIG: ApprovalWorkflowConfig = {
    levels: [
      {
        level: 1,
        role: 'Program Manager',
        name: 'Program Manager',
        email: 'program.manager@company.com',
        isRequired: true,
        sequenceOrder: 1,
        amountThreshold: 0
      },
      {
        level: 2,
        role: 'Finance Director',
        name: 'Finance Director',
        email: 'finance.director@company.com',
        isRequired: true,
        sequenceOrder: 2,
        amountThreshold: 100000 // $100K threshold
      },
      {
        level: 3,
        role: 'Executive',
        name: 'Executive',
        email: 'executive@company.com',
        isRequired: true,
        sequenceOrder: 3,
        amountThreshold: 500000 // $500K threshold
      }
    ],
    escalationDays: 3,
    autoEscalate: true
  };

  /**
   * Submit BOE for approval and create approval workflow
   */
  static async submitForApproval(boeVersionId: string): Promise<BOEVersion> {
    const boeVersion = await boeVersionRepository.findOne({
      where: { id: boeVersionId },
      relations: ['program']
    });

    if (!boeVersion) {
      throw new Error('BOE version not found');
    }

    if (boeVersion.status !== 'Draft') {
      throw new Error('Only draft BOEs can be submitted for approval');
    }

    // Update BOE status to Under Review
    boeVersion.status = 'Under Review';
    boeVersion.updatedAt = new Date();
    await boeVersionRepository.save(boeVersion);

    // Create approval workflow
    await this.createApprovalWorkflow(boeVersion);

    // Send notifications to approvers
    await this.sendApprovalNotifications(boeVersion);

    return boeVersion;
  }

  /**
   * Create approval workflow with appropriate levels based on BOE amount
   */
  static async createApprovalWorkflow(boeVersion: BOEVersion): Promise<void> {
    const config = this.DEFAULT_CONFIG;
    const applicableLevels = this.getApplicableApprovalLevels(boeVersion.totalEstimatedCost, config);

    // Clear any existing approvals
    await boeApprovalRepository.delete({ boeVersion: { id: boeVersion.id } });

    // Create approval records for applicable levels
    const approvalPromises = applicableLevels.map(level => {
      const approval = boeApprovalRepository.create({
        approvalLevel: level.level,
        approverRole: level.role,
        approverName: level.name,
        approverEmail: level.email,
        status: 'Pending',
        submittedAt: new Date(),
        isRequired: level.isRequired,
        isOptional: !level.isRequired,
        sequenceOrder: level.sequenceOrder,
        boeVersion: boeVersion
      });
      return boeApprovalRepository.save(approval);
    });

    await Promise.all(approvalPromises);
  }

  /**
   * Send notifications to approvers
   */
  static async sendApprovalNotifications(boeVersion: BOEVersion): Promise<void> {
    const program = await programRepository.findOne({
      where: { id: boeVersion.program.id }
    });

    const programName = program?.name || 'Unknown Program';

    const approvals = await boeApprovalRepository.find({
      where: { boeVersion: { id: boeVersion.id } },
      order: { sequenceOrder: 'ASC' }
    });

    // Send notifications to all pending approvers
    for (const approval of approvals) {
      if (approval.status === 'Pending') {
        await NotificationService.sendApprovalRequestedNotification(
          boeVersion,
          approval,
          programName
        );
      }
    }
  }

  /**
   * Send notification for approval action
   */
  static async sendApprovalActionNotification(
    boeVersion: BOEVersion,
    approval: BOEApproval,
    action: 'approve' | 'reject'
  ): Promise<void> {
    const program = await programRepository.findOne({
      where: { id: boeVersion.program.id }
    });

    const programName = program?.name || 'Unknown Program';

    await NotificationService.sendApprovalCompletedNotification(
      boeVersion,
      approval,
      programName,
      action === 'approve' ? 'approved' : 'rejected'
    );
  }

  /**
   * Get applicable approval levels based on BOE amount
   */
  static getApplicableApprovalLevels(boeAmount: number, config: ApprovalWorkflowConfig): ApprovalLevel[] {
    return config.levels.filter(level => {
      if (!level.amountThreshold) return true;
      return boeAmount >= level.amountThreshold;
    });
  }

  /**
   * Process approval action (approve/reject)
   */
  static async processApprovalAction(
    boeVersionId: string,
    approvalLevel: number,
    action: 'approve' | 'reject',
    approverName: string,
    comments?: string,
    rejectionReason?: string
  ): Promise<BOEVersion> {
    const boeVersion = await boeVersionRepository.findOne({
      where: { id: boeVersionId },
      relations: ['approvals']
    });

    if (!boeVersion) {
      throw new Error('BOE version not found');
    }

    // Find the specific approval level
    const approval = boeVersion.approvals.find(a => a.approvalLevel === approvalLevel);
    if (!approval) {
      throw new Error(`Approval level ${approvalLevel} not found`);
    }

    if (approval.status !== 'Pending') {
      throw new Error(`Approval level ${approvalLevel} is not pending`);
    }

    // Update approval record
    if (action === 'approve') {
      approval.status = 'Approved';
      approval.approvedAt = new Date();
      approval.comments = comments;
    } else {
      approval.status = 'Rejected';
      approval.rejectedAt = new Date();
      approval.comments = comments;
      approval.rejectionReason = rejectionReason;
    }

    await boeApprovalRepository.save(approval);

    // Send notification for approval action
    await this.sendApprovalActionNotification(boeVersion, approval, action);

    // Check if all required approvals are complete
    const allApprovals = await boeApprovalRepository.find({
      where: { boeVersion: { id: boeVersionId } },
      order: { sequenceOrder: 'ASC' }
    });

    const requiredApprovals = allApprovals.filter((a: BOEApproval) => a.isRequired);
    const approvedRequired = requiredApprovals.filter((a: BOEApproval) => a.status === 'Approved');
    const rejectedAny = allApprovals.some((a: BOEApproval) => a.status === 'Rejected');

    // Update BOE status based on approval results
    if (rejectedAny) {
      boeVersion.status = 'Rejected';
      boeVersion.rejectedBy = approverName;
      boeVersion.rejectedAt = new Date();
      boeVersion.rejectionReason = rejectionReason;
    } else if (approvedRequired.length === requiredApprovals.length) {
      boeVersion.status = 'Approved';
      boeVersion.approvedBy = approverName;
      boeVersion.approvedAt = new Date();
    }

    boeVersion.updatedAt = new Date();
    return await boeVersionRepository.save(boeVersion);
  }

  /**
   * Get current approval status for BOE version
   */
  static async getApprovalStatus(boeVersionId: string): Promise<{
    boeVersion: BOEVersion;
    approvals: BOEApproval[];
    currentLevel: number;
    nextApprover: string | null;
    canApprove: boolean;
    isComplete: boolean;
  }> {
    const boeVersion = await boeVersionRepository.findOne({
      where: { id: boeVersionId },
      relations: ['approvals']
    });

    if (!boeVersion) {
      throw new Error('BOE version not found');
    }

    const approvals = boeVersion.approvals.sort((a: BOEApproval, b: BOEApproval) => a.sequenceOrder - b.sequenceOrder);
    const pendingApprovals = approvals.filter((a: BOEApproval) => a.status === 'Pending');
    const currentLevel = pendingApprovals.length > 0 ? pendingApprovals[0].approvalLevel : 0;
    const nextApprover = pendingApprovals.length > 0 ? pendingApprovals[0].approverName || null : null;
    
    const requiredApprovals = approvals.filter((a: BOEApproval) => a.isRequired);
    const approvedRequired = requiredApprovals.filter((a: BOEApproval) => a.status === 'Approved');
    const isComplete = approvedRequired.length === requiredApprovals.length;

    return {
      boeVersion,
      approvals,
      currentLevel,
      nextApprover,
      canApprove: boeVersion.status === 'Under Review',
      isComplete
    };
  }

  /**
   * Check for escalations and process them
   */
  static async checkEscalations(): Promise<void> {
    const config = this.DEFAULT_CONFIG;
    const escalationDate = new Date();
    escalationDate.setDate(escalationDate.getDate() - config.escalationDays);

    const overdueApprovals = await boeApprovalRepository.find({
      where: {
        status: 'Pending',
        submittedAt: { $lt: escalationDate } as any
      },
      relations: ['boeVersion']
    });

    for (const approval of overdueApprovals) {
      await this.escalateApproval(approval);
    }
  }

  /**
   * Escalate a specific approval
   */
  static async escalateApproval(approval: BOEApproval): Promise<void> {
    // Update approval with escalation note
    approval.comments = (approval.comments || '') + '\n[ESCALATED] Approval overdue';
    await boeApprovalRepository.save(approval);

    // Send escalation notification
    const boeVersion = await boeVersionRepository.findOne({
      where: { id: approval.boeVersion.id },
      relations: ['program']
    });

    if (boeVersion) {
      const programName = boeVersion.program.name || 'Unknown Program';
      await NotificationService.sendEscalationNotification(
        boeVersion,
        approval,
        programName,
        'Approval overdue - escalated'
      );
    }
  }

  /**
   * Get approval workflow configuration
   */
  static getWorkflowConfig(): ApprovalWorkflowConfig {
    return this.DEFAULT_CONFIG;
  }

  /**
   * Update approval workflow configuration
   */
  static updateWorkflowConfig(config: Partial<ApprovalWorkflowConfig>): void {
    Object.assign(this.DEFAULT_CONFIG, config);
  }
} 