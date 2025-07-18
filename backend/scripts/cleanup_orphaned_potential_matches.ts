import { AppDataSource } from '../src/config/database';
import { PotentialMatch } from '../src/entities/PotentialMatch';
import { ImportTransaction } from '../src/entities/ImportTransaction';
import { TransactionStatus } from '../src/entities/ImportTransaction';

async function cleanupOrphanedPotentialMatches() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const potentialMatchRepo = AppDataSource.getRepository(PotentialMatch);
    const transactionRepo = AppDataSource.getRepository(ImportTransaction);

    // Find all potential matches for transactions with final statuses
    const finalStatuses = [TransactionStatus.CONFIRMED, TransactionStatus.ADDED_TO_LEDGER, TransactionStatus.REJECTED, TransactionStatus.REPLACED];
    
    const orphanedMatches = await potentialMatchRepo
      .createQueryBuilder('pm')
      .leftJoinAndSelect('pm.transaction', 'transaction')
      .where('transaction.status IN (:...statuses)', { statuses: [TransactionStatus.REJECTED, TransactionStatus.REPLACED] })
      .getMany();

    console.log(`Found ${orphanedMatches.length} orphaned potential matches for rejected/replaced transactions`);

    if (orphanedMatches.length > 0) {
      // Group by transaction status for reporting
      const byStatus = orphanedMatches.reduce((acc, match) => {
        const status = match.transaction.status;
        if (!acc[status]) acc[status] = [];
        acc[status].push(match);
        return acc;
      }, {} as Record<string, typeof orphanedMatches>);

      console.log('Orphaned matches by status:');
      Object.entries(byStatus).forEach(([status, matches]) => {
        console.log(`  ${status}: ${matches.length} matches`);
      });

      // Delete the orphaned matches by their IDs
      const orphanedIds = orphanedMatches.map(m => m.id);
      const deleteResult = await potentialMatchRepo.delete(orphanedIds);
      console.log(`Successfully cleaned up ${deleteResult.affected || 0} orphaned potential matches`);
    } else {
      console.log('No orphaned potential matches found');
    }

  } catch (error) {
    console.error('Error cleaning up orphaned potential matches:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
}

// Run the cleanup
cleanupOrphanedPotentialMatches()
  .then(() => {
    console.log('Cleanup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }); 