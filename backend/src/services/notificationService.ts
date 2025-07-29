import { BOEVersion } from '../entities/BOEVersion';
import { BOEApproval } from '../entities/BOEApproval';

export interface NotificationConfig {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  escalationEnabled: boolean;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

export interface NotificationEvent {
  type: 'approval_requested' | 'approval_approved' | 'approval_rejected' | 'approval_escalated';
  boeVersionId: string;
  boeVersionName: string;
  programName: string;
  approverName: string;
  approverEmail: string;
  approvalLevel: number;
  comments?: string;
  rejectionReason?: string;
  escalationReason?: string;
}

export class NotificationService {
  private static readonly DEFAULT_CONFIG: NotificationConfig = {
    emailEnabled: false, // Disabled by default - requires SMTP setup
    inAppEnabled: true,
    escalationEnabled: true
  };

  private static config: NotificationConfig = { ...this.DEFAULT_CONFIG };

  /**
   * Send notification for approval event
   */
  static async sendNotification(event: NotificationEvent): Promise<void> {
    try {
      if (this.config.emailEnabled) {
        await this.sendEmailNotification(event);
      }

      if (this.config.inAppEnabled) {
        await this.sendInAppNotification(event);
      }

      console.log(`Notification sent for ${event.type}: ${event.boeVersionName}`);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw - notifications should not break the main workflow
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(event: NotificationEvent): Promise<void> {
    // TODO: Implement actual email sending with SMTP
    // For now, just log the email that would be sent
    
    const subject = this.getEmailSubject(event);
    const body = this.getEmailBody(event);
    
    console.log('=== EMAIL NOTIFICATION ===');
    console.log(`To: ${event.approverEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log('==========================');
  }

  /**
   * Send in-app notification
   */
  private static async sendInAppNotification(event: NotificationEvent): Promise<void> {
    // TODO: Implement in-app notification system
    // This could store notifications in a database table for the UI to display
    
    console.log('=== IN-APP NOTIFICATION ===');
    console.log(`Type: ${event.type}`);
    console.log(`BOE: ${event.boeVersionName}`);
    console.log(`Program: ${event.programName}`);
    console.log(`Approver: ${event.approverName}`);
    console.log('===========================');
  }

  /**
   * Get email subject based on event type
   */
  private static getEmailSubject(event: NotificationEvent): string {
    switch (event.type) {
      case 'approval_requested':
        return `BOE Approval Required: ${event.boeVersionName}`;
      case 'approval_approved':
        return `BOE Approved: ${event.boeVersionName}`;
      case 'approval_rejected':
        return `BOE Rejected: ${event.boeVersionName}`;
      case 'approval_escalated':
        return `BOE Approval Escalated: ${event.boeVersionName}`;
      default:
        return `BOE Notification: ${event.boeVersionName}`;
    }
  }

  /**
   * Get email body based on event type
   */
  private static getEmailBody(event: NotificationEvent): string {
    const baseInfo = `
Program: ${event.programName}
BOE Version: ${event.boeVersionName}
Approval Level: ${event.approvalLevel}
    `.trim();

    switch (event.type) {
      case 'approval_requested':
        return `
Dear ${event.approverName},

A BOE approval has been requested for your review.

${baseInfo}

Please review and approve or reject this BOE within the required timeframe.

You can access the BOE system to review the details and take action.

Best regards,
BOE System
        `.trim();

      case 'approval_approved':
        return `
Dear ${event.approverName},

A BOE has been approved.

${baseInfo}

Comments: ${event.comments || 'No comments provided'}

The BOE will now proceed to the next approval level or be finalized.

Best regards,
BOE System
        `.trim();

      case 'approval_rejected':
        return `
Dear ${event.approverName},

A BOE has been rejected.

${baseInfo}

Rejection Reason: ${event.rejectionReason || 'No reason provided'}
Comments: ${event.comments || 'No comments provided'}

The BOE has been returned to draft status for revision.

Best regards,
BOE System
        `.trim();

      case 'approval_escalated':
        return `
Dear ${event.approverName},

A BOE approval has been escalated due to overdue response.

${baseInfo}

Escalation Reason: ${event.escalationReason || 'Approval overdue'}

Please review and take action on this BOE as soon as possible.

Best regards,
BOE System
        `.trim();

      default:
        return `
Dear ${event.approverName},

A BOE notification has been generated.

${baseInfo}

Please check the BOE system for more details.

Best regards,
BOE System
        `.trim();
    }
  }

  /**
   * Send approval requested notification
   */
  static async sendApprovalRequestedNotification(
    boeVersion: BOEVersion,
    approval: BOEApproval,
    programName: string
  ): Promise<void> {
    const event: NotificationEvent = {
      type: 'approval_requested',
      boeVersionId: boeVersion.id,
      boeVersionName: boeVersion.name,
      programName,
      approverName: approval.approverName || 'Unknown',
      approverEmail: approval.approverEmail || '',
      approvalLevel: approval.approvalLevel
    };

    await this.sendNotification(event);
  }

  /**
   * Send approval completed notification
   */
  static async sendApprovalCompletedNotification(
    boeVersion: BOEVersion,
    approval: BOEApproval,
    programName: string,
    action: 'approved' | 'rejected'
  ): Promise<void> {
    const event: NotificationEvent = {
      type: action === 'approved' ? 'approval_approved' : 'approval_rejected',
      boeVersionId: boeVersion.id,
      boeVersionName: boeVersion.name,
      programName,
      approverName: approval.approverName || 'Unknown',
      approverEmail: approval.approverEmail || '',
      approvalLevel: approval.approvalLevel,
      comments: approval.comments,
      rejectionReason: action === 'rejected' ? approval.rejectionReason : undefined
    };

    await this.sendNotification(event);
  }

  /**
   * Send escalation notification
   */
  static async sendEscalationNotification(
    boeVersion: BOEVersion,
    approval: BOEApproval,
    programName: string,
    escalationReason: string
  ): Promise<void> {
    const event: NotificationEvent = {
      type: 'approval_escalated',
      boeVersionId: boeVersion.id,
      boeVersionName: boeVersion.name,
      programName,
      approverName: approval.approverName || 'Unknown',
      approverEmail: approval.approverEmail || '',
      approvalLevel: approval.approvalLevel,
      escalationReason
    };

    await this.sendNotification(event);
  }

  /**
   * Get notification configuration
   */
  static getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Update notification configuration
   */
  static updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Test notification system
   */
  static async testNotification(email: string): Promise<void> {
    const testEvent: NotificationEvent = {
      type: 'approval_requested',
      boeVersionId: 'test-id',
      boeVersionName: 'Test BOE',
      programName: 'Test Program',
      approverName: 'Test Approver',
      approverEmail: email,
      approvalLevel: 1
    };

    await this.sendNotification(testEvent);
  }
} 