import { AppDataSource } from '../src/config/database';
import { RiskCategory } from '../src/entities/RiskCategory';

async function seedRiskCategories() {
  console.log('Starting risk category seeding...');
  
  // Initialize database connection if not already initialized
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const categoryRepo = AppDataSource.getRepository(RiskCategory);

  try {
    // Standard categories that should exist in every project
    const standardCategories = [
      {
        code: 'TECHNICAL',
        name: 'Technical',
        description: 'Technical risks related to design, development, or implementation',
        isActive: true,
        isSystem: true,
      },
      {
        code: 'FINANCIAL',
        name: 'Financial',
        description: 'Financial risks including budget overruns, cost increases',
        isActive: true,
        isSystem: true,
      },
      {
        code: 'SCHEDULE',
        name: 'Schedule',
        description: 'Schedule risks including delays, timeline issues',
        isActive: true,
        isSystem: true,
      },
      {
        code: 'REGULATORY',
        name: 'Regulatory',
        description: 'Regulatory and compliance risks',
        isActive: true,
        isSystem: true,
      },
      {
        code: 'VENDOR',
        name: 'Vendor',
        description: 'Vendor and supplier risks',
        isActive: true,
        isSystem: true,
      },
      {
        code: 'OPERATIONAL',
        name: 'Operational',
        description: 'Operational and process risks',
        isActive: true,
        isSystem: true,
      },
      {
        code: 'OTHER',
        name: 'Other',
        description: 'Other miscellaneous risks',
        isActive: true,
        isSystem: true,
      },
    ];

    console.log('Ensuring standard risk categories exist...');
    
    for (const categoryData of standardCategories) {
      // Check if category already exists by code
      let category = await categoryRepo.findOne({ where: { code: categoryData.code } });
      
      if (!category) {
        // Create new category
        category = categoryRepo.create(categoryData);
        await categoryRepo.save(category);
        console.log(`Created category: ${category.code} - ${category.name}`);
      } else {
        // Update existing category to ensure it's marked as system category
        if (!category.isSystem) {
          category.isSystem = true;
          category.isActive = true;
          await categoryRepo.save(category);
          console.log(`Updated category to system category: ${category.code} - ${category.name}`);
        } else {
          console.log(`Category already exists: ${category.code} - ${category.name}`);
        }
      }
    }

    console.log('Risk category seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding risk categories:', error);
    throw error;
  }
  // Note: Don't destroy the connection here as it may be used by the application
}

// Run if executed directly
if (require.main === module) {
  seedRiskCategories()
    .then(() => {
      console.log('Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedRiskCategories };

