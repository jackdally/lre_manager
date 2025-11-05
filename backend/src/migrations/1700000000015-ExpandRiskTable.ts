import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class ExpandRiskTable1700000000015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add categoryId column
    await queryRunner.addColumn(
      'risk',
      new TableColumn({
        name: 'categoryId',
        type: 'uuid',
        isNullable: true,
      })
    );

    // Add disposition column
    await queryRunner.addColumn(
      'risk',
      new TableColumn({
        name: 'disposition',
        type: 'varchar',
        default: "'Identified'",
      })
    );

    // Add dispositionDate column
    await queryRunner.addColumn(
      'risk',
      new TableColumn({
        name: 'dispositionDate',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add dispositionReason column
    await queryRunner.addColumn(
      'risk',
      new TableColumn({
        name: 'dispositionReason',
        type: 'text',
        isNullable: true,
      })
    );

    // Add owner column
    await queryRunner.addColumn(
      'risk',
      new TableColumn({
        name: 'owner',
        type: 'varchar',
        isNullable: true,
      })
    );

    // Add identifiedDate column
    await queryRunner.addColumn(
      'risk',
      new TableColumn({
        name: 'identifiedDate',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add targetMitigationDate column
    await queryRunner.addColumn(
      'risk',
      new TableColumn({
        name: 'targetMitigationDate',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add actualMitigationDate column
    await queryRunner.addColumn(
      'risk',
      new TableColumn({
        name: 'actualMitigationDate',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add mitigationStrategy column
    await queryRunner.addColumn(
      'risk',
      new TableColumn({
        name: 'mitigationStrategy',
        type: 'text',
        isNullable: true,
      })
    );

    // Add wbsElementId column
    await queryRunner.addColumn(
      'risk',
      new TableColumn({
        name: 'wbsElementId',
        type: 'uuid',
        isNullable: true,
      })
    );

    // Add foreign key for category
    await queryRunner.createForeignKey(
      'risk',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'risk_category',
        onDelete: 'SET NULL',
      })
    );

    // Add foreign key for wbsElement
    const wbsTable = await queryRunner.getTable('wbs_element');
    if (wbsTable) {
      await queryRunner.createForeignKey(
        'risk',
        new TableForeignKey({
          columnNames: ['wbsElementId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'wbs_element',
          onDelete: 'SET NULL',
        })
      );
    }

    // Create indexes
    await queryRunner.createIndex(
      'risk',
      new TableIndex({
        name: 'IDX_risk_categoryId',
        columnNames: ['categoryId'],
      })
    );

    await queryRunner.createIndex(
      'risk',
      new TableIndex({
        name: 'IDX_risk_disposition',
        columnNames: ['disposition'],
      })
    );

    await queryRunner.createIndex(
      'risk',
      new TableIndex({
        name: 'IDX_risk_wbsElementId',
        columnNames: ['wbsElementId'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('risk', 'IDX_risk_wbsElementId');
    await queryRunner.dropIndex('risk', 'IDX_risk_disposition');
    await queryRunner.dropIndex('risk', 'IDX_risk_categoryId');

    // Drop foreign keys
    const table = await queryRunner.getTable('risk');
    if (table) {
      const wbsFk = table.foreignKeys.find(fk => fk.columnNames.indexOf('wbsElementId') !== -1);
      if (wbsFk) {
        await queryRunner.dropForeignKey('risk', wbsFk);
      }

      const categoryFk = table.foreignKeys.find(fk => fk.columnNames.indexOf('categoryId') !== -1);
      if (categoryFk) {
        await queryRunner.dropForeignKey('risk', categoryFk);
      }
    }

    // Drop columns in reverse order
    await queryRunner.dropColumn('risk', 'wbsElementId');
    await queryRunner.dropColumn('risk', 'mitigationStrategy');
    await queryRunner.dropColumn('risk', 'actualMitigationDate');
    await queryRunner.dropColumn('risk', 'targetMitigationDate');
    await queryRunner.dropColumn('risk', 'identifiedDate');
    await queryRunner.dropColumn('risk', 'owner');
    await queryRunner.dropColumn('risk', 'dispositionReason');
    await queryRunner.dropColumn('risk', 'dispositionDate');
    await queryRunner.dropColumn('risk', 'disposition');
    await queryRunner.dropColumn('risk', 'categoryId');
  }
}

