import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRiskNoteTable1700000000017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'risk_note',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'riskId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'note',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'createdBy',
            type: 'varchar',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'risk_note',
      new TableForeignKey({
        columnNames: ['riskId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'risk',
        onDelete: 'CASCADE',
      })
    );

    // Create index for faster queries
    await queryRunner.createIndex(
      'risk_note',
      new TableIndex({
        name: 'IDX_risk_note_riskId',
        columnNames: ['riskId'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('risk_note');
  }
}

