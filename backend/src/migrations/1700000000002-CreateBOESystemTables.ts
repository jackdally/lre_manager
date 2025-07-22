import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBOESystemTables1700000000002 implements MigrationInterface {
  name = 'CreateBOESystemTables1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create boe_templates table
    await queryRunner.query(`
      CREATE TABLE "boe_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "category" character varying(100) NOT NULL,
        "version" character varying(50) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "isDefault" boolean NOT NULL DEFAULT false,
        "parentTemplateId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying(255),
        "updatedBy" character varying(255),
        CONSTRAINT "PK_boe_templates" PRIMARY KEY ("id"),
        CONSTRAINT "FK_boe_templates_parent" FOREIGN KEY ("parentTemplateId") REFERENCES "boe_templates"("id") ON DELETE SET NULL
      )
    `);

    // Create boe_template_elements table
    await queryRunner.query(`
      CREATE TABLE "boe_template_elements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "level" integer NOT NULL,
        "parentElementId" uuid,
        "costCategoryId" uuid,
        "estimatedCost" decimal(15,2),
        "managementReservePercentage" decimal(5,2),
        "isRequired" boolean NOT NULL DEFAULT true,
        "isOptional" boolean NOT NULL DEFAULT false,
        "notes" text,
        "templateId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_boe_template_elements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_boe_template_elements_template" FOREIGN KEY ("templateId") REFERENCES "boe_templates"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_boe_template_elements_parent" FOREIGN KEY ("parentElementId") REFERENCES "boe_template_elements"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_boe_template_elements_cost_category" FOREIGN KEY ("costCategoryId") REFERENCES "cost_categories"("id") ON DELETE SET NULL
      )
    `);

    // Create boe_versions table
    await queryRunner.query(`
      CREATE TABLE "boe_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "versionNumber" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'Draft',
        "templateId" uuid,
        "totalEstimatedCost" decimal(15,2) NOT NULL DEFAULT 0,
        "managementReserveAmount" decimal(15,2) NOT NULL DEFAULT 0,
        "managementReservePercentage" decimal(5,2) NOT NULL DEFAULT 0,
        "changeSummary" text,
        "justification" text,
        "approvedBy" character varying(255),
        "approvedAt" TIMESTAMP,
        "rejectedBy" character varying(255),
        "rejectedAt" TIMESTAMP,
        "rejectionReason" text,
        "programId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying(255),
        "updatedBy" character varying(255),
        CONSTRAINT "PK_boe_versions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_boe_versions_program" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE
      )
    `);

    // Create boe_elements table
    await queryRunner.query(`
      CREATE TABLE "boe_elements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "level" integer NOT NULL,
        "parentElementId" uuid,
        "costCategoryId" uuid,
        "vendorId" uuid,
        "estimatedCost" decimal(15,2) NOT NULL DEFAULT 0,
        "actualCost" decimal(15,2) NOT NULL DEFAULT 0,
        "variance" decimal(15,2) NOT NULL DEFAULT 0,
        "managementReservePercentage" decimal(5,2),
        "managementReserveAmount" decimal(15,2) NOT NULL DEFAULT 0,
        "isRequired" boolean NOT NULL DEFAULT true,
        "isOptional" boolean NOT NULL DEFAULT false,
        "notes" text,
        "assumptions" text,
        "risks" text,
        "boeVersionId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_boe_elements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_boe_elements_boe_version" FOREIGN KEY ("boeVersionId") REFERENCES "boe_versions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_boe_elements_parent" FOREIGN KEY ("parentElementId") REFERENCES "boe_elements"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_boe_elements_cost_category" FOREIGN KEY ("costCategoryId") REFERENCES "cost_categories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_boe_elements_vendor" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL
      )
    `);

    // Create boe_approvals table
    await queryRunner.query(`
      CREATE TABLE "boe_approvals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "approvalLevel" integer NOT NULL,
        "approverRole" character varying(100) NOT NULL,
        "approverName" character varying(255),
        "approverEmail" character varying(255),
        "status" character varying(50) NOT NULL DEFAULT 'Pending',
        "submittedAt" TIMESTAMP,
        "approvedAt" TIMESTAMP,
        "rejectedAt" TIMESTAMP,
        "comments" text,
        "rejectionReason" text,
        "isRequired" boolean NOT NULL DEFAULT false,
        "isOptional" boolean NOT NULL DEFAULT false,
        "sequenceOrder" integer NOT NULL DEFAULT 0,
        "boeVersionId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_boe_approvals" PRIMARY KEY ("id"),
        CONSTRAINT "FK_boe_approvals_boe_version" FOREIGN KEY ("boeVersionId") REFERENCES "boe_versions"("id") ON DELETE CASCADE
      )
    `);

    // Create management_reserves table
    await queryRunner.query(`
      CREATE TABLE "management_reserves" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "baselineAmount" decimal(15,2) NOT NULL DEFAULT 0,
        "baselinePercentage" decimal(5,2) NOT NULL DEFAULT 0,
        "adjustedAmount" decimal(15,2) NOT NULL DEFAULT 0,
        "adjustedPercentage" decimal(5,2) NOT NULL DEFAULT 0,
        "utilizedAmount" decimal(15,2) NOT NULL DEFAULT 0,
        "remainingAmount" decimal(15,2) NOT NULL DEFAULT 0,
        "utilizationPercentage" decimal(5,2) NOT NULL DEFAULT 0,
        "calculationMethod" character varying(50) NOT NULL DEFAULT 'Standard',
        "justification" text,
        "riskFactors" text,
        "notes" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "boeVersionId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying(255),
        "updatedBy" character varying(255),
        CONSTRAINT "PK_management_reserves" PRIMARY KEY ("id"),
        CONSTRAINT "FK_management_reserves_boe_version" FOREIGN KEY ("boeVersionId") REFERENCES "boe_versions"("id") ON DELETE CASCADE
      )
    `);

    // Add BOE-related columns to programs table
    await queryRunner.query(`
      ALTER TABLE "programs" 
      ADD COLUMN "currentBOEVersionId" uuid,
      ADD COLUMN "boeTemplateId" uuid,
      ADD COLUMN "hasBOE" boolean NOT NULL DEFAULT false,
      ADD COLUMN "lastBOEUpdate" TIMESTAMP
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_boe_templates_active" ON "boe_templates" ("isActive")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_templates_category" ON "boe_templates" ("category")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_versions_program" ON "boe_versions" ("programId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_versions_status" ON "boe_versions" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_elements_version" ON "boe_elements" ("boeVersionId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_elements_level" ON "boe_elements" ("level")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_approvals_version" ON "boe_approvals" ("boeVersionId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_approvals_status" ON "boe_approvals" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_management_reserves_version" ON "management_reserves" ("boeVersionId")
    `);

    // Insert default BOE templates
    await queryRunner.query(`
      INSERT INTO "boe_templates" ("id", "name", "description", "category", "version", "isActive", "isDefault") VALUES
      (uuid_generate_v4(), 'Software Development', 'Standard template for software development projects', 'Software Development', '1.0', true, true),
      (uuid_generate_v4(), 'Construction', 'Standard template for construction projects', 'Construction', '1.0', true, false),
      (uuid_generate_v4(), 'Research & Development', 'Standard template for R&D projects', 'Research', '1.0', true, false),
      (uuid_generate_v4(), 'Consulting Services', 'Standard template for consulting projects', 'Consulting', '1.0', true, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_management_reserves_version"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_approvals_status"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_approvals_version"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_elements_level"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_elements_version"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_versions_status"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_versions_program"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_templates_category"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_templates_active"`);

    // Remove BOE-related columns from programs table
    await queryRunner.query(`
      ALTER TABLE "programs" 
      DROP COLUMN "currentBOEVersionId",
      DROP COLUMN "boeTemplateId",
      DROP COLUMN "hasBOE",
      DROP COLUMN "lastBOEUpdate"
    `);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "management_reserves"`);
    await queryRunner.query(`DROP TABLE "boe_approvals"`);
    await queryRunner.query(`DROP TABLE "boe_elements"`);
    await queryRunner.query(`DROP TABLE "boe_versions"`);
    await queryRunner.query(`DROP TABLE "boe_template_elements"`);
    await queryRunner.query(`DROP TABLE "boe_templates"`);
  }
} 