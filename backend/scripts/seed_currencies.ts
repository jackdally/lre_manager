import { AppDataSource } from '../src/config/database';
import { Currency } from '../src/entities/Currency';

async function seedCurrencies() {
  console.log('Starting currency seeding...');
  
  // Use existing database connection
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const currencyRepo = AppDataSource.getRepository(Currency);

  try {
    // Check if currencies already exist
    const existingCount = await currencyRepo.count();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing currencies. Skipping seeding.`);
      return;
    }

    // Default currencies
    const defaultCurrencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', isDefault: true, isActive: true, decimalPlaces: 2 },
      { code: 'EUR', name: 'Euro', symbol: '€', isDefault: false, isActive: true, decimalPlaces: 2 },
      { code: 'GBP', name: 'British Pound', symbol: '£', isDefault: false, isActive: true, decimalPlaces: 2 },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', isDefault: false, isActive: true, decimalPlaces: 2 },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', isDefault: false, isActive: true, decimalPlaces: 2 },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', isDefault: false, isActive: true, decimalPlaces: 0 },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', isDefault: false, isActive: true, decimalPlaces: 2 },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', isDefault: false, isActive: true, decimalPlaces: 2 },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', isDefault: false, isActive: true, decimalPlaces: 2 },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', isDefault: false, isActive: true, decimalPlaces: 2 }
    ];

    console.log('Creating default currencies...');
    for (const currencyData of defaultCurrencies) {
      const currency = currencyRepo.create(currencyData);
      await currencyRepo.save(currency);
      console.log(`Created currency: ${currency.code} - ${currency.name}`);
    }

    console.log('Currency seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding currencies:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seedCurrencies(); 