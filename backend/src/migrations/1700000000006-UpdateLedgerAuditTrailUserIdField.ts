import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateLedgerAuditTrailUserIdField1700000000006 implements MigrationInterface {
  name = 'UpdateLedgerAuditTrailUserIdField1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change userId column from uuid to text
    await queryRunner.query(`ALTER TABLE "ledger_audit_trail" ALTER COLUMN "userId" TYPE text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert userId column back to uuid
    await queryRunner.query(`ALTER TABLE "ledger_audit_trail" ALTER COLUMN "userId" TYPE uuid USING userId::uuid`);
  }
} 