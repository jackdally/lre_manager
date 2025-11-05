import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMRFieldsToProgramSetupStatus1700000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add initialMRSet column
    await queryRunner.addColumn(
      'program_setup_status',
      new TableColumn({
        name: 'initialMRSet',
        type: 'boolean',
        default: false,
      })
    );

    // Add roAnalysisComplete column (nullable)
    await queryRunner.addColumn(
      'program_setup_status',
      new TableColumn({
        name: 'roAnalysisComplete',
        type: 'boolean',
        isNullable: true,
        default: null,
      })
    );

    // Add finalMRSet column
    await queryRunner.addColumn(
      'program_setup_status',
      new TableColumn({
        name: 'finalMRSet',
        type: 'boolean',
        default: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns in reverse order
    await queryRunner.dropColumn('program_setup_status', 'finalMRSet');
    await queryRunner.dropColumn('program_setup_status', 'roAnalysisComplete');
    await queryRunner.dropColumn('program_setup_status', 'initialMRSet');
  }
}

