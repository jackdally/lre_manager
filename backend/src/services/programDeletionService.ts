import { AppDataSource } from '../config/database';
import { Program } from '../entities/Program';
import { ImportSession } from '../entities/ImportSession';
import { ImportTransaction } from '../entities/ImportTransaction';
import { LedgerEntry } from '../entities/LedgerEntry';
import { BOEVersion } from '../entities/BOEVersion';
import { BOEElement } from '../entities/BOEElement';
import { BOEElementAllocation } from '../entities/BOEElementAllocation';
import { BOEApproval } from '../entities/BOEApproval';
import { ManagementReserve } from '../entities/ManagementReserve';
import { WbsElement } from '../entities/WbsElement';
import { RejectedMatch } from '../entities/RejectedMatch';
import { PotentialMatch } from '../entities/PotentialMatch';
import { ImportConfig } from '../entities/ImportConfig';

export class ProgramDeletionService {
  private programRepo = AppDataSource.getRepository(Program);
  private importSessionRepo = AppDataSource.getRepository(ImportSession);
  private importTransactionRepo = AppDataSource.getRepository(ImportTransaction);
  private ledgerRepo = AppDataSource.getRepository(LedgerEntry);
  private boeVersionRepo = AppDataSource.getRepository(BOEVersion);
  private boeElementRepo = AppDataSource.getRepository(BOEElement);
  private boeElementAllocationRepo = AppDataSource.getRepository(BOEElementAllocation);
  private boeApprovalRepo = AppDataSource.getRepository(BOEApproval);
  private managementReserveRepo = AppDataSource.getRepository(ManagementReserve);
  private wbsElementRepo = AppDataSource.getRepository(WbsElement);
  private rejectedMatchRepo = AppDataSource.getRepository(RejectedMatch);
  private potentialMatchRepo = AppDataSource.getRepository(PotentialMatch);
  private importConfigRepo = AppDataSource.getRepository(ImportConfig);

  async deleteProgram(programId: string): Promise<{ success: boolean; message: string; details?: any }> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Find the program
      const program = await this.programRepo.findOne({ where: { id: programId } });
      if (!program) {
        return { success: false, message: 'Program not found' };
      }

      console.log(`[PROGRAM DELETION] Starting deletion of program: ${program.name} (${program.code})`);

      // 2. Delete RejectedMatch records (they reference ImportTransaction and LedgerEntry)
      console.log('[PROGRAM DELETION] Deleting rejected matches...');
      const rejectedMatches = await this.rejectedMatchRepo
        .createQueryBuilder('rm')
        .leftJoinAndSelect('rm.transaction', 'transaction')
        .leftJoinAndSelect('rm.ledgerEntry', 'ledgerEntry')
        .where('ledgerEntry.programId = :programId', { programId })
        .getMany();
      
      if (rejectedMatches.length > 0) {
        await this.rejectedMatchRepo.remove(rejectedMatches);
        console.log(`[PROGRAM DELETION] Deleted ${rejectedMatches.length} rejected matches`);
      }

      // 3. Delete PotentialMatch records (they reference ImportTransaction and LedgerEntry)
      console.log('[PROGRAM DELETION] Deleting potential matches...');
      const potentialMatches = await this.potentialMatchRepo
        .createQueryBuilder('pm')
        .leftJoinAndSelect('pm.transaction', 'transaction')
        .leftJoinAndSelect('pm.ledgerEntry', 'ledgerEntry')
        .where('ledgerEntry.programId = :programId', { programId })
        .getMany();
      
      if (potentialMatches.length > 0) {
        await this.potentialMatchRepo.remove(potentialMatches);
        console.log(`[PROGRAM DELETION] Deleted ${potentialMatches.length} potential matches`);
      }

      // 4. Delete ImportTransaction records (they reference ImportSession)
      console.log('[PROGRAM DELETION] Deleting import transactions...');
      const importTransactions = await this.importTransactionRepo
        .createQueryBuilder('it')
        .leftJoinAndSelect('it.importSession', 'session')
        .where('session.programId = :programId', { programId })
        .getMany();
      
      if (importTransactions.length > 0) {
        await this.importTransactionRepo.remove(importTransactions);
        console.log(`[PROGRAM DELETION] Deleted ${importTransactions.length} import transactions`);
      }

      // 5. Delete ImportSession records
      console.log('[PROGRAM DELETION] Deleting import sessions...');
      const importSessions = await this.importSessionRepo.find({ where: { program: { id: programId } } });
      if (importSessions.length > 0) {
        await this.importSessionRepo.remove(importSessions);
        console.log(`[PROGRAM DELETION] Deleted ${importSessions.length} import sessions`);
      }

      // 6. Delete BOE-related data
      console.log('[PROGRAM DELETION] Deleting BOE data...');
      const boeVersions = await this.boeVersionRepo.find({ where: { program: { id: programId } } });
      
      for (const boeVersion of boeVersions) {
        // Delete BOE approvals
        const boeApprovals = await this.boeApprovalRepo.find({ where: { boeVersion: { id: boeVersion.id } } });
        if (boeApprovals.length > 0) {
          await this.boeApprovalRepo.remove(boeApprovals);
        }

        // Delete management reserves
        const managementReserves = await this.managementReserveRepo.find({ where: { boeVersion: { id: boeVersion.id } } });
        if (managementReserves.length > 0) {
          await this.managementReserveRepo.remove(managementReserves);
        }

        // Delete BOE element allocations
        const boeElementAllocations = await this.boeElementAllocationRepo.find({ where: { boeVersion: { id: boeVersion.id } } });
        if (boeElementAllocations.length > 0) {
          await this.boeElementAllocationRepo.remove(boeElementAllocations);
        }

        // Delete BOE elements
        const boeElements = await this.boeElementRepo.find({ where: { boeVersion: { id: boeVersion.id } } });
        if (boeElements.length > 0) {
          await this.boeElementRepo.remove(boeElements);
        }
      }

      // Delete BOE versions
      if (boeVersions.length > 0) {
        await this.boeVersionRepo.remove(boeVersions);
        console.log(`[PROGRAM DELETION] Deleted ${boeVersions.length} BOE versions`);
      }

      // 7. Delete LedgerEntry records
      console.log('[PROGRAM DELETION] Deleting ledger entries...');
      const ledgerEntries = await this.ledgerRepo.find({ where: { program: { id: programId } } });
      if (ledgerEntries.length > 0) {
        await this.ledgerRepo.remove(ledgerEntries);
        console.log(`[PROGRAM DELETION] Deleted ${ledgerEntries.length} ledger entries`);
      }

      // 8. Delete WBS elements
      console.log('[PROGRAM DELETION] Deleting WBS elements...');
      const wbsElements = await this.wbsElementRepo.find({ where: { program: { id: programId } } });
      if (wbsElements.length > 0) {
        await this.wbsElementRepo.remove(wbsElements);
        console.log(`[PROGRAM DELETION] Deleted ${wbsElements.length} WBS elements`);
      }

      // 9. Delete ImportConfig records
      console.log('[PROGRAM DELETION] Deleting import configs...');
      const importConfigs = await this.importConfigRepo.find({ where: { program: { id: programId } } });
      if (importConfigs.length > 0) {
        await this.importConfigRepo.remove(importConfigs);
        console.log(`[PROGRAM DELETION] Deleted ${importConfigs.length} import configs`);
      }

      // 10. Finally, delete the program
      console.log('[PROGRAM DELETION] Deleting program...');
      await this.programRepo.remove(program);

      await queryRunner.commitTransaction();
      
      console.log(`[PROGRAM DELETION] Successfully deleted program: ${program.name} (${program.code})`);
      return { 
        success: true, 
        message: `Successfully deleted program: ${program.name} (${program.code})`,
        details: {
          deletedItems: {
            rejectedMatches: rejectedMatches.length,
            potentialMatches: potentialMatches.length,
            importTransactions: importTransactions.length,
            importSessions: importSessions.length,
            boeVersions: boeVersions.length,
            ledgerEntries: ledgerEntries.length,
            wbsElements: wbsElements.length,
            importConfigs: importConfigs.length
          }
        }
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('[PROGRAM DELETION] Error during deletion:', error);
      return { 
        success: false, 
        message: 'Failed to delete program',
        details: error instanceof Error ? error.message : String(error)
      };
    } finally {
      await queryRunner.release();
    }
  }
} 