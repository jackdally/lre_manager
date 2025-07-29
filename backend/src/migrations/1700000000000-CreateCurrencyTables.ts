import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCurrencyTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create currencies table
    await queryRunner.createTable(
      new Table({
        name: 'currencies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '3',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'symbol',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'isDefault',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'decimalPlaces',
            type: 'int',
            default: 2,
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

    // Create exchange_rates table
    await queryRunner.createTable(
      new Table({
        name: 'exchange_rates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'baseCurrencyId',
            type: 'uuid',
          },
          {
            name: 'targetCurrencyId',
            type: 'uuid',
          },
          {
            name: 'rate',
            type: 'decimal',
            precision: 10,
            scale: 6,
          },
          {
            name: 'effectiveDate',
            type: 'date',
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'isManual',
            type: 'boolean',
            default: false,
          },
          {
            name: 'source',
            type: 'varchar',
            length: '500',
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

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'exchange_rates',
      new TableForeignKey({
        columnNames: ['baseCurrencyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'currencies',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'exchange_rates',
      new TableForeignKey({
        columnNames: ['targetCurrencyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'currencies',
        onDelete: 'CASCADE',
      })
    );

    // Add indexes for better performance
    await queryRunner.createIndex(
      'exchange_rates',
      new TableIndex({
        name: 'IDX_EXCHANGE_RATES_CURRENCIES',
        columnNames: ['baseCurrencyId', 'targetCurrencyId'],
      })
    );

    await queryRunner.createIndex(
      'exchange_rates',
      new TableIndex({
        name: 'IDX_EXCHANGE_RATES_EFFECTIVE_DATE',
        columnNames: ['effectiveDate'],
      })
    );

    // Insert default currencies
    await queryRunner.query(`
      INSERT INTO currencies (code, name, symbol, "isDefault", "isActive", "decimalPlaces") VALUES
      ('USD', 'US Dollar', '$', true, true, 2),
      ('EUR', 'Euro', '€', false, true, 2),
      ('GBP', 'British Pound', '£', false, true, 2),
      ('CAD', 'Canadian Dollar', 'C$', false, true, 2),
      ('AUD', 'Australian Dollar', 'A$', false, true, 2),
      ('JPY', 'Japanese Yen', '¥', false, true, 0),
      ('CHF', 'Swiss Franc', 'CHF', false, true, 2),
      ('CNY', 'Chinese Yuan', '¥', false, true, 2),
      ('INR', 'Indian Rupee', '₹', false, true, 2),
      ('BRL', 'Brazilian Real', 'R$', false, true, 2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('exchange_rates');
    await queryRunner.dropTable('currencies');
  }
} 