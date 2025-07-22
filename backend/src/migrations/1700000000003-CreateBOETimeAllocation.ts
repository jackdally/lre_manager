import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBOETimeAllocation1700000000003 implements MigrationInterface {
  name = 'CreateBOETimeAllocation1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create boe_time_allocations table
    await queryRunner.query(`
      CREATE TABLE "boe_time_allocations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "totalAmount" decimal(15,2) NOT NULL,
        "allocationType" character varying(50) NOT NULL,
        "startDate" date NOT NULL,
        "endDate" date NOT NULL,
        "numberOfMonths" integer NOT NULL,
        "monthlyAmount" decimal(15,2) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT false,
        "isLocked" boolean NOT NULL DEFAULT false,
        "notes" text,
        "assumptions" text,
        "risks" text,
        "boeElementId" uuid,
        "programId" uuid NOT NULL,
        "monthlyBreakdown" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying(255),
        "updatedBy" character varying(255),
        CONSTRAINT "PK_boe_time_allocations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_boe_time_allocations_boe_element" FOREIGN KEY ("boeElementId") REFERENCES "boe_elements"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_boe_time_allocations_program" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_boe_time_allocations_program" ON "boe_time_allocations" ("programId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_time_allocations_active" ON "boe_time_allocations" ("isActive")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_time_allocations_dates" ON "boe_time_allocations" ("startDate", "endDate")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_boe_time_allocations_dates"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_time_allocations_active"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_time_allocations_program"`);
    await queryRunner.query(`DROP TABLE "boe_time_allocations"`);
  }
} 