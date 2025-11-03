import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateProgramSetupStatus1700000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create program_setup_status table
    await queryRunner.createTable(
      new Table({
        name: 'program_setup_status',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'programId',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'boeCreated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'boeApproved',
            type: 'boolean',
            default: false,
          },
          {
            name: 'boeBaselined',
            type: 'boolean',
            default: false,
          },
          {
            name: 'riskOpportunityRegisterCreated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create foreign key to program table
    await queryRunner.createForeignKey(
      'program_setup_status',
      new TableForeignKey({
        columnNames: ['programId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'program',
        onDelete: 'CASCADE',
      })
    );

    // Create index on programId for faster lookups
    await queryRunner.createIndex(
      'program_setup_status',
      new TableIndex({
        name: 'IDX_program_setup_status_programId',
        columnNames: ['programId'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.dropIndex('program_setup_status', 'IDX_program_setup_status_programId');
    
    // Drop foreign key
    const table = await queryRunner.getTable('program_setup_status');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('programId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('program_setup_status', foreignKey);
    }

    // Drop table
    await queryRunner.dropTable('program_setup_status');
  }
}

