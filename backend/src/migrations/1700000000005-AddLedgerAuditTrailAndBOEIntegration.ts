import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLedgerAuditTrailAndBOEIntegration1700000000005 implements MigrationInterface {
  name = 'AddLedgerAuditTrailAndBOEIntegration1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add BOE integration fields to LedgerEntry table (only if they don't exist)
    const hasBoeElementAllocationId = await queryRunner.hasColumn('ledger_entry', 'boeElementAllocationId');
    const hasBoeVersionId = await queryRunner.hasColumn('ledger_entry', 'boeVersionId');
    const hasCreatedFromBOE = await queryRunner.hasColumn('ledger_entry', 'createdFromBOE');

    if (!hasBoeElementAllocationId) {
      await queryRunner.query(`ALTER TABLE "ledger_entry" ADD COLUMN "boeElementAllocationId" uuid`);
    }
    if (!hasBoeVersionId) {
      await queryRunner.query(`ALTER TABLE "ledger_entry" ADD COLUMN "boeVersionId" uuid`);
    }
    if (!hasCreatedFromBOE) {
      await queryRunner.query(`ALTER TABLE "ledger_entry" ADD COLUMN "createdFromBOE" boolean NOT NULL DEFAULT false`);
    }

    // Create LedgerAuditTrail table (only if it doesn't exist)
    const hasAuditActionEnum = await queryRunner.hasTable('audit_action_enum');
    const hasAuditSourceEnum = await queryRunner.hasTable('audit_source_enum');
    const hasLedgerAuditTrail = await queryRunner.hasTable('ledger_audit_trail');

    if (!hasAuditActionEnum) {
      await queryRunner.query(`
        CREATE TYPE "public"."audit_action_enum" AS ENUM(
          'created', 'updated', 'deleted', 'pushed_from_boe', 
          'split', 'merged', 're_forecasted', 'matched_to_invoice', 'unmatched_from_invoice'
        )
      `);
    }

    if (!hasAuditSourceEnum) {
      await queryRunner.query(`
        CREATE TYPE "public"."audit_source_enum" AS ENUM(
          'manual', 'boe_allocation', 'boe_push', 'invoice_match', 're_forecasted', 'system'
        )
      `);
    }

    if (!hasLedgerAuditTrail) {
      await queryRunner.query(`
        CREATE TABLE "ledger_audit_trail" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "ledgerEntryId" uuid NOT NULL,
          "action" "public"."audit_action_enum" NOT NULL,
          "source" "public"."audit_source_enum" NOT NULL DEFAULT 'manual',
          "userId" uuid,
          "description" text,
          "previousValues" jsonb,
          "newValues" jsonb,
          "metadata" jsonb,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "boeElementAllocationId" uuid,
          "boeVersionId" uuid,
          "relatedLedgerEntryId" uuid,
          "sessionId" text,
          CONSTRAINT "PK_ledger_audit_trail" PRIMARY KEY ("id")
        )
      `);
    }

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "ledger_entry" 
      ADD CONSTRAINT "FK_ledger_entry_boe_element_allocation" 
      FOREIGN KEY ("boeElementAllocationId") 
      REFERENCES "boe_element_allocation"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "ledger_entry" 
      ADD CONSTRAINT "FK_ledger_entry_boe_version" 
      FOREIGN KEY ("boeVersionId") 
      REFERENCES "boe_version"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "ledger_audit_trail" 
      ADD CONSTRAINT "FK_ledger_audit_trail_ledger_entry" 
      FOREIGN KEY ("ledgerEntryId") 
      REFERENCES "ledger_entry"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "ledger_audit_trail" 
      ADD CONSTRAINT "FK_ledger_audit_trail_boe_element_allocation" 
      FOREIGN KEY ("boeElementAllocationId") 
      REFERENCES "boe_element_allocation"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "ledger_audit_trail" 
      ADD CONSTRAINT "FK_ledger_audit_trail_boe_version" 
      FOREIGN KEY ("boeVersionId") 
      REFERENCES "boe_version"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "ledger_audit_trail" 
      ADD CONSTRAINT "FK_ledger_audit_trail_related_ledger_entry" 
      FOREIGN KEY ("relatedLedgerEntryId") 
      REFERENCES "ledger_entry"("id") ON DELETE SET NULL
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_ledger_audit_trail_ledger_entry_id" 
      ON "ledger_audit_trail" ("ledgerEntryId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ledger_audit_trail_boe_version_id" 
      ON "ledger_audit_trail" ("boeVersionId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ledger_audit_trail_created_at" 
      ON "ledger_audit_trail" ("createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ledger_audit_trail_session_id" 
      ON "ledger_audit_trail" ("sessionId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ledger_entry_boe_integration" 
      ON "ledger_entry" ("boeElementAllocationId", "boeVersionId", "createdFromBOE")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_ledger_entry_boe_integration"`);
    await queryRunner.query(`DROP INDEX "IDX_ledger_audit_trail_session_id"`);
    await queryRunner.query(`DROP INDEX "IDX_ledger_audit_trail_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_ledger_audit_trail_boe_version_id"`);
    await queryRunner.query(`DROP INDEX "IDX_ledger_audit_trail_ledger_entry_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "ledger_audit_trail" DROP CONSTRAINT "FK_ledger_audit_trail_related_ledger_entry"`);
    await queryRunner.query(`ALTER TABLE "ledger_audit_trail" DROP CONSTRAINT "FK_ledger_audit_trail_boe_version"`);
    await queryRunner.query(`ALTER TABLE "ledger_audit_trail" DROP CONSTRAINT "FK_ledger_audit_trail_boe_element_allocation"`);
    await queryRunner.query(`ALTER TABLE "ledger_audit_trail" DROP CONSTRAINT "FK_ledger_audit_trail_ledger_entry"`);
    await queryRunner.query(`ALTER TABLE "ledger_entry" DROP CONSTRAINT "FK_ledger_entry_boe_version"`);
    await queryRunner.query(`ALTER TABLE "ledger_entry" DROP CONSTRAINT "FK_ledger_entry_boe_element_allocation"`);

    // Drop tables and types
    await queryRunner.query(`DROP TABLE "ledger_audit_trail"`);
    await queryRunner.query(`DROP TYPE "public"."audit_source_enum"`);
    await queryRunner.query(`DROP TYPE "public"."audit_action_enum"`);

    // Remove BOE integration fields from LedgerEntry
    await queryRunner.query(`
      ALTER TABLE "ledger_entry" 
      DROP COLUMN "createdFromBOE",
      DROP COLUMN "boeVersionId",
      DROP COLUMN "boeElementAllocationId"
    `);
  }
} 