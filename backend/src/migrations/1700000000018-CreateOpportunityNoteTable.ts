import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateOpportunityNoteTable1700000000018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'opportunity_note',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'opportunityId',
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
      'opportunity_note',
      new TableForeignKey({
        columnNames: ['opportunityId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'opportunity',
        onDelete: 'CASCADE',
      })
    );

    // Create index for faster queries
    await queryRunner.createIndex(
      'opportunity_note',
      new TableIndex({
        name: 'IDX_opportunity_note_opportunityId',
        columnNames: ['opportunityId'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('opportunity_note');
  }
}

