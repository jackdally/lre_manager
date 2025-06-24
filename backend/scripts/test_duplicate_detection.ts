import { AppDataSource } from '../src/config/database';
import { ImportTransaction, DuplicateType, TransactionStatus } from '../src/entities/ImportTransaction';
import { ImportSession, ImportStatus } from '../src/entities/ImportSession';
import { Program } from '../src/entities/Program';
import { ImportService } from '../src/services/importService';
import { Not } from 'typeorm';

async function run() {
  await AppDataSource.initialize();
  const importService = new ImportService();
  const programRepo = AppDataSource.getRepository(Program);
  const sessionRepo = AppDataSource.getRepository(ImportSession);
  const transactionRepo = AppDataSource.getRepository(ImportTransaction);
  const rejectedMatchRepo = AppDataSource.getRepository(require('../src/entities/RejectedMatch').RejectedMatch);
  const potentialMatchRepo = AppDataSource.getRepository(require('../src/entities/PotentialMatch').PotentialMatch);

  // Clean up any previous test data (only test data)
  await rejectedMatchRepo.createQueryBuilder().delete().where('1=1').execute();
  await potentialMatchRepo.createQueryBuilder().delete().where('1=1').execute();
  await transactionRepo.createQueryBuilder().delete().where('programCode = :code', { code: 'TST.0001' }).execute();
  await sessionRepo.createQueryBuilder().delete().where('description LIKE :desc', { desc: '%Session%' }).execute();
  await programRepo.delete({ code: 'TST.0001' });

  // 1. Create a test program
  const program = programRepo.create({ code: 'TST.0001', name: 'Test Program', description: 'Test Program', status: 'active', totalBudget: 0, type: 'Annual' });
  await programRepo.save(program);

  // 2. Create an initial session and confirmed transaction (original)
  const session1 = sessionRepo.create({
    filename: 'test1.xlsx',
    originalFilename: 'test1.xlsx',
    description: 'Session 1',
    program,
    importConfig: {},
    status: ImportStatus.COMPLETED
  });
  await sessionRepo.save(session1);

  const originalTx = transactionRepo.create({
    vendorName: 'Vendor A',
    description: 'Test Desc',
    amount: 100,
    transactionDate: '2024-01-01',
    programCode: 'TST.0001',
    invoiceNumber: 'INV-001',
    status: TransactionStatus.CONFIRMED,
    importSession: session1,
    duplicateType: DuplicateType.NONE
  });
  await transactionRepo.save(originalTx);

  // 3. Exact duplicate (should skip import)
  const session2 = sessionRepo.create({
    filename: 'test2.xlsx',
    originalFilename: 'test2.xlsx',
    description: 'Session 2',
    program,
    importConfig: {},
    status: ImportStatus.PENDING
  });
  await sessionRepo.save(session2);

  const exactDuplicate = await importService['parseTransactionRow']({
    'Vendor Name': 'Vendor A',
    'Description': 'Test Desc',
    'Amount': 100,
    'Date': '2024-01-01',
    'Program Code': 'TST.0001',
    'Invoice Number': 'INV-001'
  }, {
    vendorColumn: 'Vendor Name',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    dateColumn: 'Date',
    programCodeColumn: 'Program Code',
    invoiceColumn: 'Invoice Number'
  }, session2);
  console.log('Exact duplicate result (should be null):', exactDuplicate);

  // 4. Different info duplicate (should import and flag)
  const diffInfo = await importService['parseTransactionRow']({
    'Vendor Name': 'Vendor A',
    'Description': 'Test Desc',
    'Amount': 200,
    'Date': '2024-01-02',
    'Program Code': 'TST.0001',
    'Invoice Number': 'INV-001'
  }, {
    vendorColumn: 'Vendor Name',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    dateColumn: 'Date',
    programCodeColumn: 'Program Code',
    invoiceColumn: 'Invoice Number'
  }, session2);
  console.log('Different info duplicate result:', diffInfo?.duplicateType);

  // 5. No invoice, same vendor/amount/date (should import and flag)
  const noInvoice = await importService['parseTransactionRow']({
    'Vendor Name': 'Vendor A',
    'Description': 'Test Desc',
    'Amount': 100,
    'Date': '2024-01-01',
    'Program Code': 'TST.0001'
  }, {
    vendorColumn: 'Vendor Name',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    dateColumn: 'Date',
    programCodeColumn: 'Program Code'
  }, session2);
  console.log('No invoice duplicate result:', noInvoice?.duplicateType);

  // 6. Rejected original (should import and flag as original_rejected)
  const rejectedTx = transactionRepo.create({
    vendorName: 'Vendor B',
    description: 'Test Desc',
    amount: 300,
    transactionDate: '2024-01-03',
    programCode: 'TST.0001',
    invoiceNumber: 'INV-002',
    status: TransactionStatus.REJECTED,
    importSession: session1,
    duplicateType: DuplicateType.NONE
  });
  await transactionRepo.save(rejectedTx);

  const rejectedDuplicate = await importService['parseTransactionRow']({
    'Vendor Name': 'Vendor B',
    'Description': 'Test Desc',
    'Amount': 400,
    'Date': '2024-01-04',
    'Program Code': 'TST.0001',
    'Invoice Number': 'INV-002'
  }, {
    vendorColumn: 'Vendor Name',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    dateColumn: 'Date',
    programCodeColumn: 'Program Code',
    invoiceColumn: 'Invoice Number'
  }, session2);
  console.log('Rejected original duplicate result:', rejectedDuplicate?.duplicateType);

  // 7. Multiple potential duplicates
  const multi1 = transactionRepo.create({
    vendorName: 'Vendor C',
    description: 'Test Desc',
    amount: 500,
    transactionDate: '2024-01-05',
    programCode: 'TST.0001',
    invoiceNumber: 'INV-003',
    status: TransactionStatus.CONFIRMED,
    importSession: session1,
    duplicateType: DuplicateType.NONE
  });
  const multi2 = transactionRepo.create({
    vendorName: 'Vendor C',
    description: 'Test Desc',
    amount: 600,
    transactionDate: '2024-01-06',
    programCode: 'TST.0001',
    invoiceNumber: 'INV-003',
    status: TransactionStatus.CONFIRMED,
    importSession: session1,
    duplicateType: DuplicateType.NONE
  });
  await transactionRepo.save(multi1);
  await transactionRepo.save(multi2);

  const multiDuplicate = await importService['parseTransactionRow']({
    'Vendor Name': 'Vendor C',
    'Description': 'Test Desc',
    'Amount': 700,
    'Date': '2024-01-07',
    'Program Code': 'TST.0001',
    'Invoice Number': 'INV-003'
  }, {
    vendorColumn: 'Vendor Name',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    dateColumn: 'Date',
    programCodeColumn: 'Program Code',
    invoiceColumn: 'Invoice Number'
  }, session2);
  console.log('Multiple potential duplicates result:', multiDuplicate?.duplicateType);

  // 8. Force replace scenario
  // Mark all session1 transactions as replaced
  for (const tx of await transactionRepo.find({ where: { importSession: { id: session1.id } } })) {
    tx.status = TransactionStatus.REPLACED;
    await transactionRepo.save(tx);
  }
  const forceReplaceDuplicate = await importService['parseTransactionRow']({
    'Vendor Name': 'Vendor A',
    'Description': 'Test Desc',
    'Amount': 100,
    'Date': '2024-01-01',
    'Program Code': 'TST.0001',
    'Invoice Number': 'INV-001'
  }, {
    vendorColumn: 'Vendor Name',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    dateColumn: 'Date',
    programCodeColumn: 'Program Code',
    invoiceColumn: 'Invoice Number'
  }, session2);
  console.log('Force replace duplicate result (should not be flagged):', forceReplaceDuplicate?.duplicateType);

  // Clean up test data (only test data)
  await rejectedMatchRepo.createQueryBuilder().delete().where('1=1').execute();
  await potentialMatchRepo.createQueryBuilder().delete().where('1=1').execute();
  await transactionRepo.createQueryBuilder().delete().where('programCode = :code', { code: 'TST.0001' }).execute();
  await sessionRepo.createQueryBuilder().delete().where('description LIKE :desc', { desc: '%Session%' }).execute();
  await programRepo.delete({ code: 'TST.0001' });

  await AppDataSource.destroy();
  console.log('All tests completed.');
}

run().catch(console.error); 