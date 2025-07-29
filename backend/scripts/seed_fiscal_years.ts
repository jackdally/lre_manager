import { AppDataSource } from '../src/config/database';
import { FiscalYear } from '../src/entities/FiscalYear';

async function seedFiscalYears() {
  console.log('Starting fiscal year seeding...');
  
  // Use existing database connection
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const fiscalYearRepo = AppDataSource.getRepository(FiscalYear);

  try {
    // Check if fiscal years already exist
    const existingCount = await fiscalYearRepo.count();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing fiscal years. Skipping seeding.`);
      return;
    }

    // Default fiscal years
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    const defaultFiscalYears = [
      {
        name: `FY ${currentYear}`,
        description: `Fiscal Year ${currentYear} (Calendar Year)`,
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
        isActive: true,
        isDefault: true,
        type: 'calendar' as const,
        numberOfPeriods: 12,
        periodType: 'monthly' as const,
      },
      {
        name: `FY ${nextYear}`,
        description: `Fiscal Year ${nextYear} (Calendar Year)`,
        startDate: `${nextYear}-01-01`,
        endDate: `${nextYear}-12-31`,
        isActive: true,
        isDefault: false,
        type: 'calendar' as const,
        numberOfPeriods: 12,
        periodType: 'monthly' as const,
      },
      {
        name: `FY ${currentYear} (Federal)`,
        description: `Federal Fiscal Year ${currentYear}`,
        startDate: `${currentYear}-10-01`,
        endDate: `${nextYear}-09-30`,
        isActive: false,
        isDefault: false,
        type: 'fiscal' as const,
        numberOfPeriods: 12,
        periodType: 'monthly' as const,
      },
      {
        name: `FY ${nextYear} (Federal)`,
        description: `Federal Fiscal Year ${nextYear}`,
        startDate: `${nextYear}-10-01`,
        endDate: `${nextYear + 1}-09-30`,
        isActive: false,
        isDefault: false,
        type: 'fiscal' as const,
        numberOfPeriods: 12,
        periodType: 'monthly' as const,
      },
    ];

    console.log('Creating default fiscal years...');
    for (const fiscalYearData of defaultFiscalYears) {
      const fiscalYear = fiscalYearRepo.create(fiscalYearData);
      await fiscalYearRepo.save(fiscalYear);
      console.log(`Created fiscal year: ${fiscalYear.name} - ${fiscalYear.description}`);
    }

    console.log('Fiscal year seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding fiscal years:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seedFiscalYears(); 