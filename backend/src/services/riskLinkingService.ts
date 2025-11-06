import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { LedgerEntry } from '../entities/LedgerEntry';
import { Risk } from '../entities/Risk';
import { LedgerEntryRisk } from '../entities/LedgerEntryRisk';
import { LedgerAuditTrailService } from './ledgerAuditTrailService';
import { AuditSource, AuditAction } from '../entities/LedgerAuditTrail';

export interface RiskWithMetadata {
  risk: Risk;
  sharedWithCount: number; // Number of other entries sharing this risk (in same allocation)
  isFromAllocation: boolean; // Whether this entry is part of an allocation
}

export class RiskLinkingService {
  private static ledgerEntryRepo: Repository<LedgerEntry> = AppDataSource.getRepository(LedgerEntry);
  private static riskRepo: Repository<Risk> = AppDataSource.getRepository(Risk);
  private static ledgerEntryRiskRepo: Repository<LedgerEntryRisk> = AppDataSource.getRepository(LedgerEntryRisk);

  /**
   * Get all risks linked to a ledger entry with metadata
   */
  static async getRisksForLedgerEntry(ledgerEntryId: string): Promise<RiskWithMetadata[]> {
    const entry = await this.ledgerEntryRepo.findOne({
      where: { id: ledgerEntryId },
      relations: ['program']
    });

    if (!entry) {
      throw new Error('Ledger entry not found');
    }

    // Load risks through the junction table
    const riskLinks = await this.ledgerEntryRiskRepo.find({
      where: { ledgerEntryId: ledgerEntryId },
      relations: ['risk']
    });

    const risks = riskLinks.map(link => link.risk);
    const isFromAllocation = !!entry.boeElementAllocationId;

    // If entry is from allocation, count how many other entries share each risk
    let sharedCounts: Map<string, number> = new Map();
    if (isFromAllocation && entry.boeElementAllocationId) {
      // Get all entries with the same allocation ID
      const allocationEntries = await this.ledgerEntryRepo.find({
        where: { boeElementAllocationId: entry.boeElementAllocationId }
      });

      // Load all risk links for these entries
      const allocationEntryIds = allocationEntries.map(e => e.id);
      const allRiskLinks = await this.ledgerEntryRiskRepo.find({
        where: { ledgerEntryId: In(allocationEntryIds) },
        relations: ['risk']
      });

      // Count how many entries share each risk
      risks.forEach(risk => {
        const entryIdsWithThisRisk = new Set(
          allRiskLinks
            .filter(link => link.risk.id === risk.id)
            .map(link => link.ledgerEntryId)
        );
        const count = entryIdsWithThisRisk.size;
        sharedCounts.set(risk.id, Math.max(0, count - 1)); // -1 to exclude current entry, ensure non-negative
      });
    }

    return risks.map(risk => ({
      risk,
      sharedWithCount: sharedCounts.get(risk.id) || 0,
      isFromAllocation
    }));
  }

  /**
   * Get all ledger entries that share the same allocation as the given entry
   */
  static async getAllocationEntries(ledgerEntryId: string): Promise<LedgerEntry[]> {
    const entry = await this.ledgerEntryRepo.findOne({
      where: { id: ledgerEntryId }
    });

    if (!entry) {
      throw new Error('Ledger entry not found');
    }

    if (!entry.boeElementAllocationId) {
      return [entry]; // No allocation, return just this entry
    }

    // Get all entries with the same allocation ID
    return await this.ledgerEntryRepo.find({
      where: { boeElementAllocationId: entry.boeElementAllocationId }
    });
  }

  /**
   * Link a risk to a ledger entry (with automatic propagation to allocation entries)
   */
  static async linkRiskToLedgerEntry(
    ledgerEntryId: string,
    riskId: string,
    userId?: string
  ): Promise<{ affectedEntries: number; entryIds: string[] }> {
    // Verify risk exists
    const risk = await this.riskRepo.findOne({ where: { id: riskId } });
    if (!risk) {
      throw new Error('Risk not found');
    }

    // Get the entry and all entries in the same allocation
    const targetEntries = await this.getAllocationEntries(ledgerEntryId);
    const entryIds = targetEntries.map(e => e.id);

    // Link risk to all target entries
    const results = await Promise.all(
      targetEntries.map(async (entry) => {
        // Check if link already exists
        const existingLink = await this.ledgerEntryRiskRepo.findOne({
          where: {
            ledgerEntryId: entry.id,
            riskId: riskId
          }
        });

        if (!existingLink) {
          // Create new link
          const link = this.ledgerEntryRiskRepo.create({
            ledgerEntryId: entry.id,
            riskId: riskId
          });
          await this.ledgerEntryRiskRepo.save(link);

          // Audit trail logging - non-blocking
          try {
            await LedgerAuditTrailService.auditLedgerEntryUpdate(
              entry.id,
              { riskId: null },
              { riskId: riskId },
              AuditSource.MANUAL,
              userId
            );
            // Also log with metadata about risk linking
            await LedgerAuditTrailService.createAuditEntry(
              entry.id,
              AuditAction.UPDATED,
              AuditSource.MANUAL,
              {
                userId,
                description: `Risk "${risk.title}" linked to ledger entry`,
                metadata: {
                  riskLinking: true,
                  riskId: riskId,
                  riskTitle: risk.title,
                  propagated: targetEntries.length > 1,
                  affectedEntriesCount: targetEntries.length
                }
              }
            );
          } catch (auditError) {
            console.error(`Error creating audit trail for risk link on entry ${entry.id}:`, auditError);
          }
        }
      })
    );

    return {
      affectedEntries: targetEntries.length,
      entryIds
    };
  }

  /**
   * Unlink a risk from a ledger entry (with automatic propagation to allocation entries)
   */
  static async unlinkRiskFromLedgerEntry(
    ledgerEntryId: string,
    riskId: string,
    userId?: string
  ): Promise<{ affectedEntries: number; entryIds: string[] }> {
    // Verify risk exists
    const risk = await this.riskRepo.findOne({ where: { id: riskId } });
    if (!risk) {
      throw new Error('Risk not found');
    }

    // Get the entry and all entries in the same allocation
    const targetEntries = await this.getAllocationEntries(ledgerEntryId);
    const entryIds = targetEntries.map(e => e.id);

    // Unlink risk from all target entries
    await Promise.all(
      targetEntries.map(async (entry) => {
        // Find and delete the link
        const link = await this.ledgerEntryRiskRepo.findOne({
          where: {
            ledgerEntryId: entry.id,
            riskId: riskId
          }
        });

        if (link) {
          await this.ledgerEntryRiskRepo.remove(link);

          // Audit trail logging - non-blocking
          try {
            await LedgerAuditTrailService.auditLedgerEntryUpdate(
              entry.id,
              { riskId: riskId },
              { riskId: null },
              AuditSource.MANUAL,
              userId
            );
            // Also log with metadata about risk unlinking
            await LedgerAuditTrailService.createAuditEntry(
              entry.id,
              AuditAction.UPDATED,
              AuditSource.MANUAL,
              {
                userId,
                description: `Risk "${risk.title}" unlinked from ledger entry`,
                metadata: {
                  riskUnlinking: true,
                  riskId: riskId,
                  riskTitle: risk.title,
                  propagated: targetEntries.length > 1,
                  affectedEntriesCount: targetEntries.length
                }
              }
            );
          } catch (auditError) {
            console.error(`Error creating audit trail for risk unlink on entry ${entry.id}:`, auditError);
          }
        }
      })
    );

    return {
      affectedEntries: targetEntries.length,
      entryIds
    };
  }

  /**
   * Link multiple risks to a ledger entry
   */
  static async linkRisksToLedgerEntry(
    ledgerEntryId: string,
    riskIds: string[],
    userId?: string
  ): Promise<{ affectedEntries: number; entryIds: string[] }> {
    const results = await Promise.all(
      riskIds.map(riskId => this.linkRiskToLedgerEntry(ledgerEntryId, riskId, userId))
    );

    // All should have the same affected entries count
    return {
      affectedEntries: results[0]?.affectedEntries || 0,
      entryIds: results[0]?.entryIds || []
    };
  }

  /**
   * Unlink multiple risks from a ledger entry
   */
  static async unlinkRisksFromLedgerEntry(
    ledgerEntryId: string,
    riskIds: string[],
    userId?: string
  ): Promise<{ affectedEntries: number; entryIds: string[] }> {
    const results = await Promise.all(
      riskIds.map(riskId => this.unlinkRiskFromLedgerEntry(ledgerEntryId, riskId, userId))
    );

    // All should have the same affected entries count
    return {
      affectedEntries: results[0]?.affectedEntries || 0,
      entryIds: results[0]?.entryIds || []
    };
  }
}

