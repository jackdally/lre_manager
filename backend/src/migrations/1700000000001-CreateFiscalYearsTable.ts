import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFiscalYearsTable1700000000001 implements MigrationInterface {
  name = 'CreateFiscalYearsTable1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create fiscal_years table
    await queryRunner.query(`
      CREATE TABLE "fiscal_years" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" character varying(500),
        "startDate" date NOT NULL,
        "endDate" date NOT NULL,
        "isActive" boolean NOT NULL DEFAULT false,
        "isDefault" boolean NOT NULL DEFAULT false,
        "type" character varying(50) NOT NULL DEFAULT 'calendar',
        "numberOfPeriods" integer NOT NULL DEFAULT 12,
        "periodType" character varying(20) NOT NULL DEFAULT 'monthly',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fiscal_years" PRIMARY KEY ("id")
      )
    `);

    // Create index on isActive and isDefault for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_fiscal_years_active" ON "fiscal_years" ("isActive")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_fiscal_years_default" ON "fiscal_years" ("isDefault")
    `);

    // Insert default fiscal years
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    await queryRunner.query(`
      INSERT INTO "fiscal_years" ("id", "name", "description", "startDate", "endDate", "isActive", "isDefault", "type", "numberOfPeriods", "periodType") VALUES
      (uuid_generate_v4(), 'FY ${currentYear}', 'Fiscal Year ${currentYear} (Calendar Year)', '${currentYear}-01-01', '${currentYear}-12-31', true, true, 'calendar', 12, 'monthly'),
      (uuid_generate_v4(), 'FY ${nextYear}', 'Fiscal Year ${nextYear} (Calendar Year)', '${nextYear}-01-01', '${nextYear}-12-31', true, false, 'calendar', 12, 'monthly'),
      (uuid_generate_v4(), 'FY ${currentYear} (Federal)', 'Federal Fiscal Year ${currentYear}', '${currentYear}-10-01', '${nextYear}-09-30', false, false, 'fiscal', 12, 'monthly'),
      (uuid_generate_v4(), 'FY ${nextYear} (Federal)', 'Federal Fiscal Year ${nextYear}', '${nextYear}-10-01', '${nextYear + 1}-09-30', false, false, 'fiscal', 12, 'monthly')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_fiscal_years_default"`);
    await queryRunner.query(`DROP INDEX "IDX_fiscal_years_active"`);
    
    // Drop table
    await queryRunner.query(`DROP TABLE "fiscal_years"`);
  }
} 