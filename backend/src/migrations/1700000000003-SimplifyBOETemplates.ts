import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifyBOETemplates1700000000003 implements MigrationInterface {
  name = 'SimplifyBOETemplates1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, clear existing templates
    await queryRunner.query(`DELETE FROM "boe_template"`);
    
    // Insert simplified templates
    await queryRunner.query(`
      INSERT INTO "boe_template" (
        "id", "name", "description", "category", "version", 
        "isActive", "isDefault", "createdAt", "updatedAt"
      ) VALUES
      (
        uuid_generate_v4(), 
        'Software', 
        'Standard template for software development projects including development, testing, and deployment phases', 
        'Software', 
        '1.0', 
        true, 
        true,
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
      ),
      (
        uuid_generate_v4(), 
        'Hardware', 
        'Template for hardware development and manufacturing projects including design, prototyping, and production phases', 
        'Hardware', 
        '1.0', 
        true, 
        false,
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
      ),
      (
        uuid_generate_v4(), 
        'Services', 
        'Template for consulting and service projects including analysis, implementation, and support phases', 
        'Services', 
        '1.0', 
        true, 
        false,
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore original templates
    await queryRunner.query(`DELETE FROM "boe_template"`);
    
    await queryRunner.query(`
      INSERT INTO "boe_template" (
        "id", "name", "description", "category", "version", 
        "isActive", "isDefault", "createdAt", "updatedAt"
      ) VALUES
      (
        uuid_generate_v4(), 
        'Software Development', 
        'Standard template for software development projects', 
        'Software Development', 
        '1.0', 
        true, 
        true,
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
      ),
      (
        uuid_generate_v4(), 
        'Construction', 
        'Standard template for construction projects', 
        'Construction', 
        '1.0', 
        true, 
        false,
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
      ),
      (
        uuid_generate_v4(), 
        'Research & Development', 
        'Standard template for R&D projects', 
        'Research', 
        '1.0', 
        true, 
        false,
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
      ),
      (
        uuid_generate_v4(), 
        'Consulting Services', 
        'Standard template for consulting projects', 
        'Consulting', 
        '1.0', 
        true, 
        false,
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
      )
    `);
  }
} 