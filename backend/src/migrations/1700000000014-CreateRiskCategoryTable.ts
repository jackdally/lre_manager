import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateRiskCategoryTable1700000000014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'risk_category',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_system',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create index on code for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_risk_category_code" ON "risk_category" ("code")
    `);

    // Insert predefined categories
    await queryRunner.query(`
      INSERT INTO "risk_category" (code, name, description, is_active, is_system) VALUES
      ('TECHNICAL', 'Technical', 'Technical risks related to design, development, or implementation', true, true),
      ('FINANCIAL', 'Financial', 'Financial risks including budget overruns, cost increases', true, true),
      ('SCHEDULE', 'Schedule', 'Schedule risks including delays, timeline issues', true, true),
      ('REGULATORY', 'Regulatory', 'Regulatory and compliance risks', true, true),
      ('VENDOR', 'Vendor', 'Vendor and supplier risks', true, true),
      ('OPERATIONAL', 'Operational', 'Operational and process risks', true, true),
      ('OTHER', 'Other', 'Other miscellaneous risks', true, true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('risk_category');
  }
}

