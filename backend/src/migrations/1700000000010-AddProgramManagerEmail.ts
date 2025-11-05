import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProgramManagerEmail1700000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add program_manager_email column to program table
    await queryRunner.addColumn(
      'program',
      new TableColumn({
        name: 'program_manager_email',
        type: 'varchar',
        isNullable: true,
        length: '255',
      })
    );

    // Create index for faster lookups (optional but helpful for email queries)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_program_manager_email" ON "program" ("program_manager_email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_program_manager_email"
    `);

    // Drop column
    await queryRunner.dropColumn('program', 'program_manager_email');
  }
}

