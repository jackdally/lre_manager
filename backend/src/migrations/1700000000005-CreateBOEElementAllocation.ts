import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBOEElementAllocation1700000000005 implements MigrationInterface {
  name = 'CreateBOEElementAllocation1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create boe_element_allocations table
    await queryRunner.query(`
      CREATE TABLE "boe_element_allocations" (
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
        "totalQuantity" decimal(10,2),
        "quantityUnit" character varying(50),
        "monthlyQuantity" decimal(10,2),
        "boeElementId" uuid NOT NULL,
        "boeVersionId" uuid NOT NULL,
        "monthlyBreakdown" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying(255),
        "updatedBy" character varying(255),
        CONSTRAINT "PK_boe_element_allocations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_boe_element_allocations_boe_element" FOREIGN KEY ("boeElementId") REFERENCES "boe_elements"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_boe_element_allocations_boe_version" FOREIGN KEY ("boeVersionId") REFERENCES "boe_versions"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_boe_element_allocations_boe_element" ON "boe_element_allocations" ("boeElementId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_element_allocations_boe_version" ON "boe_element_allocations" ("boeVersionId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_element_allocations_active" ON "boe_element_allocations" ("isActive")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_element_allocations_locked" ON "boe_element_allocations" ("isLocked")
    `);

    // Add unique constraint to prevent multiple allocations for the same element
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_boe_element_allocations_unique_element" 
      ON "boe_element_allocations" ("boeElementId") 
      WHERE "isActive" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_boe_element_allocations_unique_element"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_element_allocations_locked"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_element_allocations_active"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_element_allocations_boe_version"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_element_allocations_boe_element"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "boe_element_allocations"`);
  }
} 