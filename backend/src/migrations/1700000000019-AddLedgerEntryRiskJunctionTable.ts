import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddLedgerEntryRiskJunctionTable1700000000019 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the junction table
    await queryRunner.createTable(
      new Table({
        name: 'ledger_entry_risk',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'ledgerEntryId',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'riskId',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'ledger_entry_risk',
      new TableForeignKey({
        columnNames: ['ledgerEntryId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ledger_entry',
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'ledger_entry_risk',
      new TableForeignKey({
        columnNames: ['riskId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'risk',
        onDelete: 'CASCADE'
      })
    );

    // Create unique index to prevent duplicate links
    await queryRunner.createIndex(
      'ledger_entry_risk',
      new TableIndex({
        name: 'IDX_ledger_entry_risk_unique',
        columnNames: ['ledgerEntryId', 'riskId'],
        isUnique: true
      })
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'ledger_entry_risk',
      new TableIndex({
        name: 'IDX_ledger_entry_risk_ledger_entry',
        columnNames: ['ledgerEntryId']
      })
    );

    await queryRunner.createIndex(
      'ledger_entry_risk',
      new TableIndex({
        name: 'IDX_ledger_entry_risk_risk',
        columnNames: ['riskId']
      })
    );

    // Migrate existing riskId data to junction table
    // Note: We create the unique index first, so ON CONFLICT will work
    await queryRunner.query(`
      INSERT INTO ledger_entry_risk (id, "ledgerEntryId", "riskId", "createdAt")
      SELECT 
        uuid_generate_v4() as id,
        id as "ledgerEntryId",
        "risk_id" as "riskId",
        CURRENT_TIMESTAMP as "createdAt"
      FROM ledger_entry
      WHERE "risk_id" IS NOT NULL
      ON CONFLICT ("ledgerEntryId", "riskId") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ledger_entry_risk');
  }
}

