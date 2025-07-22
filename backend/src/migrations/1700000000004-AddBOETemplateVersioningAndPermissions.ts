import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBOETemplateVersioningAndPermissions1700000000004 implements MigrationInterface {
  name = 'AddBOETemplateVersioningAndPermissions1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add versioning fields to boe_templates table
    await queryRunner.query(`
      ALTER TABLE "boe_templates" 
      ADD COLUMN "rootTemplateId" uuid,
      ADD COLUMN "majorVersion" integer NOT NULL DEFAULT 1,
      ADD COLUMN "minorVersion" integer NOT NULL DEFAULT 0,
      ADD COLUMN "patchVersion" integer NOT NULL DEFAULT 0,
      ADD COLUMN "isLatestVersion" boolean NOT NULL DEFAULT false,
      ADD COLUMN "versionNotes" text,
      ADD COLUMN "changeLog" text
    `);

    // Add permissions and sharing fields
    await queryRunner.query(`
      ALTER TABLE "boe_templates" 
      ADD COLUMN "isPublic" boolean NOT NULL DEFAULT false,
      ADD COLUMN "sharedWithUsers" text,
      ADD COLUMN "sharedWithRoles" text,
      ADD COLUMN "accessLevel" character varying(20) NOT NULL DEFAULT 'Private',
      ADD COLUMN "allowCopy" boolean NOT NULL DEFAULT false,
      ADD COLUMN "allowModify" boolean NOT NULL DEFAULT false
    `);

    // Add foreign key constraint for rootTemplateId
    await queryRunner.query(`
      ALTER TABLE "boe_templates" 
      ADD CONSTRAINT "FK_boe_templates_root" 
      FOREIGN KEY ("rootTemplateId") REFERENCES "boe_templates"("id") ON DELETE SET NULL
    `);

    // Update existing templates to set them as latest versions and set rootTemplateId
    await queryRunner.query(`
      UPDATE "boe_templates" 
      SET "isLatestVersion" = true, 
          "rootTemplateId" = "id",
          "majorVersion" = 1,
          "minorVersion" = 0,
          "patchVersion" = 0
      WHERE "rootTemplateId" IS NULL
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_boe_templates_root" ON "boe_templates" ("rootTemplateId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_templates_version" ON "boe_templates" ("majorVersion", "minorVersion", "patchVersion")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_templates_latest" ON "boe_templates" ("isLatestVersion")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_templates_access" ON "boe_templates" ("accessLevel", "isPublic")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_boe_templates_access"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_templates_latest"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_templates_version"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_templates_root"`);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "boe_templates" 
      DROP CONSTRAINT "FK_boe_templates_root"
    `);

    // Drop versioning fields
    await queryRunner.query(`
      ALTER TABLE "boe_templates" 
      DROP COLUMN "rootTemplateId",
      DROP COLUMN "majorVersion",
      DROP COLUMN "minorVersion", 
      DROP COLUMN "patchVersion",
      DROP COLUMN "isLatestVersion",
      DROP COLUMN "versionNotes",
      DROP COLUMN "changeLog"
    `);

    // Drop permissions fields
    await queryRunner.query(`
      ALTER TABLE "boe_templates" 
      DROP COLUMN "isPublic",
      DROP COLUMN "sharedWithUsers",
      DROP COLUMN "sharedWithRoles",
      DROP COLUMN "accessLevel",
      DROP COLUMN "allowCopy",
      DROP COLUMN "allowModify"
    `);
  }
} 