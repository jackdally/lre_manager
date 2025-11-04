import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMonthlyReminders1700000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create monthly_reminders table
    await queryRunner.createTable(
      new Table({
        name: 'monthly_reminders',
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
          },
          {
            name: 'month',
            type: 'varchar',
            length: '7', // Format: YYYY-MM
          },
          {
            name: 'isDismissed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'dismissedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'dismissedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'emailSent',
            type: 'boolean',
            default: false,
          },
          {
            name: 'emailSentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'inAppNotificationShown',
            type: 'boolean',
            default: false,
          },
          {
            name: 'inAppNotificationShownAt',
            type: 'timestamp',
            isNullable: true,
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
      'monthly_reminders',
      new TableForeignKey({
        columnNames: ['programId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'program',
        onDelete: 'CASCADE',
      })
    );

    // Create indexes for faster lookups
    await queryRunner.createIndex(
      'monthly_reminders',
      new TableIndex({
        name: 'IDX_monthly_reminders_programId',
        columnNames: ['programId'],
      })
    );

    await queryRunner.createIndex(
      'monthly_reminders',
      new TableIndex({
        name: 'IDX_monthly_reminders_month',
        columnNames: ['month'],
      })
    );

    await queryRunner.createIndex(
      'monthly_reminders',
      new TableIndex({
        name: 'IDX_monthly_reminders_isDismissed',
        columnNames: ['isDismissed'],
      })
    );

    // Create unique constraint on programId + month to prevent duplicates
    await queryRunner.createIndex(
      'monthly_reminders',
      new TableIndex({
        name: 'IDX_monthly_reminders_program_month',
        columnNames: ['programId', 'month'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('monthly_reminders', 'IDX_monthly_reminders_program_month');
    await queryRunner.dropIndex('monthly_reminders', 'IDX_monthly_reminders_isDismissed');
    await queryRunner.dropIndex('monthly_reminders', 'IDX_monthly_reminders_month');
    await queryRunner.dropIndex('monthly_reminders', 'IDX_monthly_reminders_programId');

    // Drop foreign key
    const table = await queryRunner.getTable('monthly_reminders');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('programId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('monthly_reminders', foreignKey);
    }

    // Drop table
    await queryRunner.dropTable('monthly_reminders');
  }
}

