import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMRUtilizationFieldsToRisk1700000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add materializedAt column
    await queryRunner.addColumn(
      'risk',
      new TableColumn({
        name: 'materializedAt',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add mrUtilizedAmount column
    await queryRunner.addColumn(
      'risk',
      new TableColumn({
        name: 'mrUtilizedAmount',
        type: 'decimal',
        precision: 15,
        scale: 2,
        default: 0,
      })
    );

    // Add mrUtilizationDate column
    await queryRunner.addColumn(
      'risk',
      new TableColumn({
        name: 'mrUtilizationDate',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add mrUtilizationReason column
    await queryRunner.addColumn(
      'risk',
      new TableColumn({
        name: 'mrUtilizationReason',
        type: 'text',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns in reverse order
    await queryRunner.dropColumn('risk', 'mrUtilizationReason');
    await queryRunner.dropColumn('risk', 'mrUtilizationDate');
    await queryRunner.dropColumn('risk', 'mrUtilizedAmount');
    await queryRunner.dropColumn('risk', 'materializedAt');
  }
}

