import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateOpportunityTable1700000000016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'opportunity',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'programId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'categoryId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'benefitMin',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'benefitMostLikely',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'benefitMax',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'probability',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'benefitSeverity',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'Identified'",
          },
          {
            name: 'disposition',
            type: 'varchar',
            default: "'Identified'",
          },
          {
            name: 'dispositionDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'dispositionReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'owner',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'identifiedDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'targetRealizationDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'actualRealizationDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'realizationStrategy',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'actualBenefit',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'wbsElementId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'createdBy',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'updatedBy',
            type: 'varchar',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'opportunity',
      new TableForeignKey({
        columnNames: ['programId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'programs',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'opportunity',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'risk_category',
        onDelete: 'SET NULL',
      })
    );

    // Add WBS element foreign key if table exists
    const wbsTable = await queryRunner.getTable('wbs_element');
    if (wbsTable) {
      await queryRunner.createForeignKey(
        'opportunity',
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
      'opportunity',
      new TableIndex({
        name: 'IDX_opportunity_programId',
        columnNames: ['programId'],
      })
    );

    await queryRunner.createIndex(
      'opportunity',
      new TableIndex({
        name: 'IDX_opportunity_categoryId',
        columnNames: ['categoryId'],
      })
    );

    await queryRunner.createIndex(
      'opportunity',
      new TableIndex({
        name: 'IDX_opportunity_disposition',
        columnNames: ['disposition'],
      })
    );

    await queryRunner.createIndex(
      'opportunity',
      new TableIndex({
        name: 'IDX_opportunity_wbsElementId',
        columnNames: ['wbsElementId'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('opportunity');
  }
}

