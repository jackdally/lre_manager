import { AppDataSource } from '../src/config/database';
import { ImportSession, ImportStatus } from '../src/entities/ImportSession';
import { ImportTransaction, TransactionStatus } from '../src/entities/ImportTransaction';
import { LedgerEntry } from '../src/entities/LedgerEntry';
import { Program } from '../src/entities/Program';
import { PotentialMatch } from '../src/entities/PotentialMatch';
import { ImportService } from '../src/services/importService';

async function createTestPotentialMatches() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const programRepo = AppDataSource.getRepository(Program);
    const sessionRepo = AppDataSource.getRepository(ImportSession);
    const transactionRepo = AppDataSource.getRepository(ImportTransaction);
    const ledgerRepo = AppDataSource.getRepository(LedgerEntry);
    const potentialMatchRepo = AppDataSource.getRepository(PotentialMatch);

    // Get the first program (assuming there's at least one)
    const programs = await programRepo.find();
    if (programs.length === 0) {
      console.log('No programs found. Please create a program first.');
      return;
    }
    const program = programs[0];
    console.log(`Using program: ${program.code} - ${program.name}`);

    // Get some ledger entries to match against
    const ledgerEntries = await ledgerRepo.find({ where: { program: { id: program.id } } });
    if (ledgerEntries.length === 0) {
      console.log('No ledger entries found for this program. Please create some ledger entries first.');
      return;
    }
    console.log(`Found ${ledgerEntries.length} ledger entries`);

    // Create a test import session
    const session = sessionRepo.create({
      filename: 'test-potential-matches.xlsx',
      originalFilename: 'test-potential-matches.xlsx',
      description: 'Test session for potential matches',
      program,
      importConfig: {
        programCodeColumn: 'Program Code',
        vendorColumn: 'Vendor Name',
        descriptionColumn: 'Description',
        amountColumn: 'Amount',
        dateColumn: 'Date',
        amountTolerance: 0.01,
        matchThreshold: 0.7
      },
      status: ImportStatus.PENDING
    });
    await sessionRepo.save(session);
    console.log(`Created import session: ${session.id}`);

    // Create some test import transactions that should match ledger entries
    const testTransactions = [
      {
        vendorName: ledgerEntries[0].vendor_name,
        description: ledgerEntries[0].expense_description,
        amount: ledgerEntries[0].planned_amount || 0,
        transactionDate: ledgerEntries[0].planned_date || '2024-01-01',
        programCode: program.code,
        status: TransactionStatus.UNMATCHED,
        importSession: session
      },
      {
        vendorName: ledgerEntries[1]?.vendor_name || 'Test Vendor 2',
        description: ledgerEntries[1]?.expense_description || 'Test Description 2',
        amount: ledgerEntries[1]?.planned_amount || 500,
        transactionDate: ledgerEntries[1]?.planned_date || '2024-01-15',
        programCode: program.code,
        status: TransactionStatus.UNMATCHED,
        importSession: session
      }
    ];

    const transactions = [];
    for (const txData of testTransactions) {
      const transaction = transactionRepo.create(txData);
      transactions.push(transaction);
    }
    await transactionRepo.save(transactions);
    console.log(`Created ${transactions.length} test transactions`);

    // Run smart matching to create potential matches
    const importService = new ImportService();
    await importService.performSmartMatching(session.id);
    console.log('Smart matching completed');

    // Check how many potential matches were created
    const potentialMatches = await potentialMatchRepo.find({
      where: {
        ledgerEntry: { program: { id: program.id } },
        status: 'potential'
      },
      relations: ['ledgerEntry', 'transaction']
    });

    console.log(`\n✅ Created ${potentialMatches.length} potential matches:`);
    for (const match of potentialMatches) {
      console.log(`  - Transaction: ${match.transaction.vendorName} - ${match.transaction.description} ($${match.transaction.amount})`);
      console.log(`    Ledger Entry: ${match.ledgerEntry.vendor_name} - ${match.ledgerEntry.expense_description} ($${match.ledgerEntry.planned_amount})`);
      console.log(`    Confidence: ${match.confidence}`);
      console.log('');
    }

    // Get the ledger entry IDs that have potential matches
    const matchIds = new Set(potentialMatches.map(pm => pm.ledgerEntry.id));
    console.log(`Ledger entry IDs with potential matches: ${Array.from(matchIds).join(', ')}`);

  } catch (error) {
    console.error('Error creating test potential matches:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
}

// Run the script
createTestPotentialMatches().catch(console.error); 