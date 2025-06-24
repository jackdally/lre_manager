import { AppDataSource } from '../src/config/database';
import { ImportSession, ImportStatus } from '../src/entities/ImportSession';
import { ImportTransaction, TransactionStatus } from '../src/entities/ImportTransaction';

async function fixInvalidReplacedSessions() {
  await AppDataSource.initialize();
  const sessionRepo = AppDataSource.getRepository(ImportSession);
  const transactionRepo = AppDataSource.getRepository(ImportTransaction);

  const replacedSessions = await sessionRepo.find({ where: { status: ImportStatus.REPLACED } });
  const finalStatuses = [
    TransactionStatus.CONFIRMED,
    TransactionStatus.ADDED_TO_LEDGER,
    TransactionStatus.REJECTED,
    TransactionStatus.REPLACED
  ];

  for (const session of replacedSessions) {
    const transactions = await transactionRepo.find({ where: { importSession: { id: session.id } } });
    const notFinal = transactions.filter(t => !finalStatuses.includes(t.status));
    if (notFinal.length > 0) {
      for (const t of notFinal) {
        t.status = TransactionStatus.REPLACED;
        await transactionRepo.save(t);
        console.log(`Fixed transaction ${t.id} in session ${session.id}`);
      }
    }
  }
  await AppDataSource.destroy();
  console.log('Done.');
}

fixInvalidReplacedSessions().catch(err => {
  console.error('Error running fix script:', err);
}); 