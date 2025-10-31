import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorToBOEElementAllocations1700000000007 implements MigrationInterface {
  name = 'AddVendorToBOEElementAllocations1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add vendorId column to boe_element_allocations table
    await queryRunner.query(`
      ALTER TABLE "boe_element_allocations" 
      ADD COLUMN "vendorId" uuid
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "boe_element_allocations" 
      ADD CONSTRAINT "FK_boe_element_allocations_vendor" 
      FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE SET NULL
    `);

    // Create index for vendor lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_boe_element_allocations_vendor" 
      ON "boe_element_allocations" ("vendorId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_boe_element_allocations_vendor"`);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "boe_element_allocations" 
      DROP CONSTRAINT "FK_boe_element_allocations_vendor"
    `);

    // Drop column
    await queryRunner.query(`
      ALTER TABLE "boe_element_allocations" 
      DROP COLUMN "vendorId"
    `);
  }
}

