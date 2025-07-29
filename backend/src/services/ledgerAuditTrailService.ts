import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { LedgerAuditTrail, AuditAction, AuditSource } from '../entities/LedgerAuditTrail';
import { LedgerEntry } from '../entities/LedgerEntry';

export class LedgerAuditTrailService {
  private static auditTrailRepository: Repository<LedgerAuditTrail> = AppDataSource.getRepository(LedgerAuditTrail);
  private static ledgerEntryRepository: Repository<LedgerEntry> = AppDataSource.getRepository(LedgerEntry);

  /**
   * Create an audit trail entry
   */
  static async createAuditEntry(
    ledgerEntryId: string,
    action: AuditAction,
    source: AuditSource,
    options: {
      userId?: string;
      description?: string;
      previousValues?: Record<string, any>;
      newValues?: Record<string, any>;
      metadata?: Record<string, any>;
      boeElementAllocationId?: string;
      boeVersionId?: string;
      relatedLedgerEntryId?: string;
      sessionId?: string;
    } = {}
  ): Promise<LedgerAuditTrail> {
    const auditEntry = this.auditTrailRepository.create({
      ledgerEntryId,
      action,
      source,
      userId: options.userId,
      description: options.description,
      previousValues: options.previousValues,
      newValues: options.newValues,
      metadata: options.metadata,
      boeElementAllocationId: options.boeElementAllocationId,
      boeVersionId: options.boeVersionId,
      relatedLedgerEntryId: options.relatedLedgerEntryId,
      sessionId: options.sessionId
    });

    return await this.auditTrailRepository.save(auditEntry);
  }

  /**
   * Get audit trail for a specific ledger entry
   */
  static async getAuditTrailForLedgerEntry(ledgerEntryId: string): Promise<LedgerAuditTrail[]> {
    return await this.auditTrailRepository.find({
      where: { ledgerEntryId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get audit trail for BOE-related operations
   */
  static async getBOEAuditTrail(boeVersionId: string): Promise<LedgerAuditTrail[]> {
    return await this.auditTrailRepository.find({
      where: { boeVersionId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get audit trail for a specific session
   */
  static async getSessionAuditTrail(sessionId: string): Promise<LedgerAuditTrail[]> {
    return await this.auditTrailRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Audit ledger entry creation
   */
  static async auditLedgerEntryCreation(
    ledgerEntry: LedgerEntry,
    source: AuditSource = AuditSource.MANUAL,
    userId?: string,
    sessionId?: string
  ): Promise<LedgerAuditTrail> {
    const description = source === AuditSource.BOE_PUSH
      ? 'Ledger entry created from BOE allocation'
      : source === AuditSource.BOE_ALLOCATION
        ? 'Ledger entry created from BOE element allocation'
        : 'Ledger entry created manually';

    return await this.createAuditEntry(
      ledgerEntry.id,
      AuditAction.CREATED,
      source,
      {
        userId,
        description,
        newValues: {
          vendor_name: ledgerEntry.vendor_name,
          expense_description: ledgerEntry.expense_description,
          baseline_amount: ledgerEntry.baseline_amount,
          planned_amount: ledgerEntry.planned_amount,
          wbsElementId: ledgerEntry.wbsElementId,
          costCategoryId: ledgerEntry.costCategoryId,
          createdFromBOE: ledgerEntry.createdFromBOE,
          boeElementAllocationId: ledgerEntry.boeElementAllocationId,
          boeVersionId: ledgerEntry.boeVersionId
        },
        boeElementAllocationId: ledgerEntry.boeElementAllocationId,
        boeVersionId: ledgerEntry.boeVersionId,
        sessionId
      }
    );
  }

  /**
   * Audit ledger entry update
   */
  static async auditLedgerEntryUpdate(
    ledgerEntryId: string,
    previousValues: Record<string, any>,
    newValues: Record<string, any>,
    source: AuditSource = AuditSource.MANUAL,
    userId?: string,
    sessionId?: string
  ): Promise<LedgerAuditTrail> {
    const description = source === AuditSource.RE_FORECASTED
      ? 'Ledger entry re-forecasted'
      : 'Ledger entry updated';

    return await this.createAuditEntry(
      ledgerEntryId,
      AuditAction.UPDATED,
      source,
      {
        userId,
        description,
        previousValues,
        newValues,
        sessionId
      }
    );
  }

  /**
   * Audit BOE push to ledger
   */
  static async auditBOEPushToLedger(
    ledgerEntryIds: string[],
    boeVersionId: string,
    userId?: string,
    sessionId?: string
  ): Promise<LedgerAuditTrail[]> {
    const auditEntries: LedgerAuditTrail[] = [];

    for (const ledgerEntryId of ledgerEntryIds) {
      const auditEntry = await this.createAuditEntry(
        ledgerEntryId,
        AuditAction.PUSHED_FROM_BOE,
        AuditSource.BOE_PUSH,
        {
          userId,
          description: 'Ledger entry created from BOE push to ledger',
          metadata: {
            boeVersionId,
            totalEntriesCreated: ledgerEntryIds.length
          },
          boeVersionId,
          sessionId
        }
      );
      auditEntries.push(auditEntry);
    }

    return auditEntries;
  }

  /**
   * Audit ledger entry splitting
   */
  static async auditLedgerEntrySplit(
    originalLedgerEntryId: string,
    newLedgerEntryIds: string[],
    splitReason: string,
    userId?: string,
    sessionId?: string
  ): Promise<LedgerAuditTrail[]> {
    const auditEntries: LedgerAuditTrail[] = [];

    // Audit the original entry
    const originalAudit = await this.createAuditEntry(
      originalLedgerEntryId,
      AuditAction.SPLIT,
      AuditSource.MANUAL,
      {
        userId,
        description: `Ledger entry split: ${splitReason}`,
        metadata: {
          splitReason,
          newEntryIds: newLedgerEntryIds
        },
        relatedLedgerEntryId: newLedgerEntryIds[0], // Link to first new entry
        sessionId
      }
    );
    auditEntries.push(originalAudit);

    // Audit each new entry
    for (const newLedgerEntryId of newLedgerEntryIds) {
      const newAudit = await this.createAuditEntry(
        newLedgerEntryId,
        AuditAction.CREATED,
        AuditSource.MANUAL,
        {
          userId,
          description: `Ledger entry created from split`,
          metadata: {
            splitReason,
            originalEntryId: originalLedgerEntryId
          },
          relatedLedgerEntryId: originalLedgerEntryId,
          sessionId
        }
      );
      auditEntries.push(newAudit);
    }

    return auditEntries;
  }

  /**
   * Audit invoice matching
   */
  static async auditInvoiceMatching(
    ledgerEntryId: string,
    invoiceId: string,
    isMatched: boolean,
    userId?: string,
    sessionId?: string
  ): Promise<LedgerAuditTrail> {
    const action = isMatched ? AuditAction.MATCHED_TO_INVOICE : AuditAction.UNMATCHED_FROM_INVOICE;
    const description = isMatched
      ? `Ledger entry matched to invoice ${invoiceId}`
      : `Ledger entry unmatched from invoice ${invoiceId}`;

    return await this.createAuditEntry(
      ledgerEntryId,
      action,
      AuditSource.INVOICE_MATCH,
      {
        userId,
        description,
        metadata: {
          invoiceId,
          isMatched
        },
        sessionId
      }
    );
  }

  /**
   * Log an action for audit trail (simplified interface for transaction adjustments)
   */
  static async logAction(options: {
    ledgerEntryId: string;
    action: AuditAction;
    description: string;
    userId?: string;
    source: AuditSource;
  }): Promise<LedgerAuditTrail> {
    return await this.createAuditEntry(
      options.ledgerEntryId,
      options.action,
      options.source,
      {
        userId: options.userId,
        description: options.description
      }
    );
  }

  /**
   * Get audit summary for a ledger entry
   */
  static async getAuditSummary(ledgerEntryId: string): Promise<{
    totalAuditEntries: number;
    lastModified: Date | null;
    createdFromBOE: boolean;
    boeVersionId?: string;
    boeElementAllocationId?: string;
  }> {
    const auditEntries = await this.getAuditTrailForLedgerEntry(ledgerEntryId);
    const ledgerEntry = await this.ledgerEntryRepository.findOne({
      where: { id: ledgerEntryId }
    });

    return {
      totalAuditEntries: auditEntries.length,
      lastModified: auditEntries.length > 0 ? auditEntries[0].createdAt : null,
      createdFromBOE: ledgerEntry?.createdFromBOE || false,
      boeVersionId: ledgerEntry?.boeVersionId,
      boeElementAllocationId: ledgerEntry?.boeElementAllocationId
    };
  }
} 