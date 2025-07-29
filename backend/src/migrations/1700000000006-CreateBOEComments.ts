import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBOEComments1700000000006 implements MigrationInterface {
  name = 'CreateBOEComments1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create boe_comments table
    await queryRunner.query(`
      CREATE TABLE "boe_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "boeVersionId" uuid NOT NULL,
        "commentType" character varying(50) NOT NULL,
        "comment" text NOT NULL,
        "authorName" character varying(255) NOT NULL,
        "authorRole" character varying(255) NOT NULL,
        "authorEmail" character varying(255),
        "isInternal" boolean NOT NULL DEFAULT false,
        "isResolved" boolean NOT NULL DEFAULT false,
        "resolvedBy" character varying(255),
        "resolvedAt" TIMESTAMP,
        "resolutionNotes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_boe_comments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_boe_comments_boe_version" FOREIGN KEY ("boeVersionId") REFERENCES "boe_version"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_boe_comments_boe_version" ON "boe_comments" ("boeVersionId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_comments_type" ON "boe_comments" ("commentType")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_comments_resolved" ON "boe_comments" ("isResolved")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_boe_comments_created_at" ON "boe_comments" ("createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_boe_comments_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_comments_resolved"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_comments_type"`);
    await queryRunner.query(`DROP INDEX "IDX_boe_comments_boe_version"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "boe_comments"`);
  }
} 