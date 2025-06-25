import { AppDataSource } from '../../backend/src/config/database';
import { ImportSession } from '../../backend/src/entities/ImportSession';
import { ImportTransaction } from '../../backend/src/entities/ImportTransaction';
import { PotentialMatch } from '../../backend/src/entities/PotentialMatch';
import { RejectedMatch } from '../../backend/src/entities/RejectedMatch';
import { LedgerEntry } from '../../backend/src/entities/LedgerEntry';

async function clearAllData() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    console.log('Starting data cleanup...');

    // Clear in the correct order to avoid foreign key constraints
    console.log('1. Clearing potential matches...');
    const potentialMatchesDeleted = await AppDataSource.getRepository(PotentialMatch).delete({});
    console.log(`   Deleted ${potentialMatchesDeleted.affected || 0} potential matches`);

    console.log('2. Clearing rejected matches...');
    const rejectedMatchesDeleted = await AppDataSource.getRepository(RejectedMatch).delete({});
    console.log(`   Deleted ${rejectedMatchesDeleted.affected || 0} rejected matches`);

    console.log('3. Clearing import transactions...');
    const transactionsDeleted = await AppDataSource.getRepository(ImportTransaction).delete({});
    console.log(`   Deleted ${transactionsDeleted.affected || 0} import transactions`);

    console.log('4. Clearing import sessions...');
    const sessionsDeleted = await AppDataSource.getRepository(ImportSession).delete({});
    console.log(`   Deleted ${sessionsDeleted.affected || 0} import sessions`);

    console.log('5. Clearing ledger entries...');
    const ledgerEntriesDeleted = await AppDataSource.getRepository(LedgerEntry).delete({});
    console.log(`   Deleted ${ledgerEntriesDeleted.affected || 0} ledger entries`);

    console.log('\n✅ All data cleared successfully!');
    console.log('\nSummary:');
    console.log(`   - Potential matches: ${potentialMatchesDeleted.affected || 0}`);
    console.log(`   - Rejected matches: ${rejectedMatchesDeleted.affected || 0}`);
    console.log(`   - Import transactions: ${transactionsDeleted.affected || 0}`);
    console.log(`   - Import sessions: ${sessionsDeleted.affected || 0}`);
    console.log(`   - Ledger entries: ${ledgerEntriesDeleted.affected || 0}`);

  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
}

// Run the script
clearAllData()
  .then(() => {
    console.log('\n🎉 Data cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Data cleanup failed:', error);
    process.exit(1);
  }); 