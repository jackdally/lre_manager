import { AppDataSource } from '../src/config/database';
import { ImportSession } from '../src/entities/ImportSession';
import { ImportTransaction } from '../src/entities/ImportTransaction';
import { PotentialMatch } from '../src/entities/PotentialMatch';
import { RejectedMatch } from '../src/entities/RejectedMatch';
import { LedgerEntry } from '../src/entities/LedgerEntry';

async function clearAllData() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    console.log('Starting data cleanup...');

    // Delete in the correct order to avoid foreign key constraints
    console.log('1. Deleting potential matches...');
    await AppDataSource.getRepository(PotentialMatch).createQueryBuilder().delete().execute();
    console.log('   Deleted all potential matches');

    console.log('2. Deleting rejected matches...');
    await AppDataSource.getRepository(RejectedMatch).createQueryBuilder().delete().execute();
    console.log('   Deleted all rejected matches');

    console.log('3. Deleting import transactions...');
    await AppDataSource.getRepository(ImportTransaction).createQueryBuilder().delete().execute();
    console.log('   Deleted all import transactions');

    console.log('4. Deleting import sessions...');
    await AppDataSource.getRepository(ImportSession).createQueryBuilder().delete().execute();
    console.log('   Deleted all import sessions');

    console.log('5. Deleting ledger entries...');
    await AppDataSource.getRepository(LedgerEntry).createQueryBuilder().delete().execute();
    console.log('   Deleted all ledger entries');

    console.log('\n✅ All data deleted successfully!');
  } catch (error) {
    console.error('Error deleting data:', error);
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