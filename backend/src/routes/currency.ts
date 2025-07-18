import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Currency } from '../entities/Currency';
import { ExchangeRate } from '../entities/ExchangeRate';
import * as Joi from 'joi';
import axios from 'axios';

const router = Router();

// Validation schemas
const currencySchema = Joi.object({
  code: Joi.string().length(3).required(),
  name: Joi.string().max(100).required(),
  symbol: Joi.string().max(10).optional(),
  isDefault: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  decimalPlaces: Joi.number().integer().min(0).max(4).default(2),
});

const exchangeRateSchema = Joi.object({
  baseCurrencyId: Joi.string().uuid().required(),
  targetCurrencyId: Joi.string().uuid().required(),
  rate: Joi.number().positive().required(),
  effectiveDate: Joi.date().required(),
  expiresAt: Joi.date().optional(),
  isManual: Joi.boolean().default(false),
  source: Joi.string().max(500).optional(),
});

// Get all currencies
router.get('/', async (req, res) => {
  try {
    const currencyRepo = AppDataSource.getRepository(Currency);
    const currencies = await currencyRepo.find({
      order: { code: 'ASC' }
    });
    
    res.json({ currencies });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({ error: 'Failed to fetch currencies' });
  }
});

// Get active currencies
router.get('/active', async (req, res) => {
  try {
    const currencyRepo = AppDataSource.getRepository(Currency);
    const currencies = await currencyRepo.find({
      where: { isActive: true },
      order: { code: 'ASC' }
    });
    
    res.json({ currencies });
  } catch (error) {
    console.error('Error fetching active currencies:', error);
    res.status(500).json({ error: 'Failed to fetch active currencies' });
  }
});

// Get default currency
router.get('/default', async (req, res) => {
  try {
    const currencyRepo = AppDataSource.getRepository(Currency);
    const defaultCurrency = await currencyRepo.findOne({
      where: { isDefault: true, isActive: true }
    });
    
    if (!defaultCurrency) {
      return res.status(404).json({ error: 'No default currency found' });
    }
    
    res.json({ currency: defaultCurrency });
  } catch (error) {
    console.error('Error fetching default currency:', error);
    res.status(500).json({ error: 'Failed to fetch default currency' });
  }
});

// Get currency by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currencyRepo = AppDataSource.getRepository(Currency);
    const currency = await currencyRepo.findOneBy({ id });
    
    if (!currency) {
      return res.status(404).json({ error: 'Currency not found' });
    }
    
    res.json({ currency });
  } catch (error) {
    console.error('Error fetching currency:', error);
    res.status(500).json({ error: 'Failed to fetch currency' });
  }
});

// Create currency
router.post('/', async (req, res) => {
  try {
    const { error, value } = currencySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const currencyRepo = AppDataSource.getRepository(Currency);
    
    // Check if currency code already exists
    const existingCurrency = await currencyRepo.findOne({
      where: { code: value.code }
    });
    
    if (existingCurrency) {
      return res.status(400).json({ error: 'Currency code already exists' });
    }

    // If setting as default, unset other defaults
    if (value.isDefault) {
      await currencyRepo.update({ isDefault: true }, { isDefault: false });
    }

    const currency = currencyRepo.create(value);
    const savedCurrency = await currencyRepo.save(currency);
    
    res.status(201).json({ currency: savedCurrency });
  } catch (error) {
    console.error('Error creating currency:', error);
    res.status(500).json({ error: 'Failed to create currency' });
  }
});

// Update currency
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = currencySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const currencyRepo = AppDataSource.getRepository(Currency);
    const currency = await currencyRepo.findOneBy({ id });
    
    if (!currency) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    // Check if currency code already exists (if changing code)
    if (value.code !== currency.code) {
      const existingCurrency = await currencyRepo.findOne({
        where: { code: value.code }
      });
      
      if (existingCurrency) {
        return res.status(400).json({ error: 'Currency code already exists' });
      }
    }

    // If setting as default, unset other defaults
    if (value.isDefault && !currency.isDefault) {
      await currencyRepo.update({ isDefault: true }, { isDefault: false });
    }

    await currencyRepo.update(id, value);
    const updatedCurrency = await currencyRepo.findOneBy({ id });
    
    res.json({ currency: updatedCurrency });
  } catch (error) {
    console.error('Error updating currency:', error);
    res.status(500).json({ error: 'Failed to update currency' });
  }
});

// Delete currency
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currencyRepo = AppDataSource.getRepository(Currency);
    const currency = await currencyRepo.findOneBy({ id });
    
    if (!currency) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    // Check if it's the default currency
    if (currency.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default currency' });
    }

    // Check if currency is used in exchange rates
    const exchangeRateRepo = AppDataSource.getRepository(ExchangeRate);
    const exchangeRateCount = await exchangeRateRepo.count({
      where: [
        { baseCurrencyId: id },
        { targetCurrencyId: id }
      ]
    });
    
    if (exchangeRateCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete currency. It is used in ${exchangeRateCount} exchange rates.` 
      });
    }

    await currencyRepo.remove(currency);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting currency:', error);
    res.status(500).json({ error: 'Failed to delete currency' });
  }
});

// Get exchange rates
router.get('/:id/exchange-rates', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    const exchangeRateRepo = AppDataSource.getRepository(ExchangeRate);
    const queryBuilder = exchangeRateRepo.createQueryBuilder('rate')
      .leftJoinAndSelect('rate.baseCurrency', 'baseCurrency')
      .leftJoinAndSelect('rate.targetCurrency', 'targetCurrency')
      .where('rate.baseCurrencyId = :id OR rate.targetCurrencyId = :id', { id });

    if (date) {
      queryBuilder.andWhere('rate.effectiveDate <= :date', { date })
        .andWhere('(rate.expiresAt IS NULL OR rate.expiresAt > :date)', { date });
    }

    const exchangeRates = await queryBuilder
      .orderBy('rate.effectiveDate', 'DESC')
      .getMany();
    
    res.json({ exchangeRates });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

// Create exchange rate
router.post('/:id/exchange-rates', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = exchangeRateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const currencyRepo = AppDataSource.getRepository(Currency);
    const exchangeRateRepo = AppDataSource.getRepository(ExchangeRate);

    // Validate currencies exist
    const baseCurrency = await currencyRepo.findOneBy({ id: value.baseCurrencyId });
    const targetCurrency = await currencyRepo.findOneBy({ id: value.targetCurrencyId });
    
    if (!baseCurrency || !targetCurrency) {
      return res.status(400).json({ error: 'Invalid currency ID' });
    }

    // Check if exchange rate already exists for this date
    const existingRate = await exchangeRateRepo.findOne({
      where: {
        baseCurrencyId: value.baseCurrencyId,
        targetCurrencyId: value.targetCurrencyId,
        effectiveDate: value.effectiveDate
      }
    });

    if (existingRate) {
      return res.status(400).json({ error: 'Exchange rate already exists for this date' });
    }

    const exchangeRate = exchangeRateRepo.create(value);
    const savedRate = await exchangeRateRepo.save(exchangeRate);
    
    res.status(201).json({ exchangeRate: savedRate });
  } catch (error) {
    console.error('Error creating exchange rate:', error);
    res.status(500).json({ error: 'Failed to create exchange rate' });
  }
});

// Update exchange rates from external API
router.post('/update-rates', async (req, res) => {
  try {
    const { baseCurrency = 'USD' } = req.body;
    
    // Use a free exchange rate API (you can replace with your preferred provider)
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    const responseData = response.data as { rates: Record<string, number> };
    const rates = responseData.rates;
    
    const currencyRepo = AppDataSource.getRepository(Currency);
    const exchangeRateRepo = AppDataSource.getRepository(ExchangeRate);
    
    // Get all active currencies
    const currencies = await currencyRepo.find({ where: { isActive: true } });
    const baseCurrencyEntity = await currencyRepo.findOne({ where: { code: baseCurrency } });
    
    if (!baseCurrencyEntity) {
      return res.status(400).json({ error: 'Base currency not found' });
    }

    const today = new Date();
    const results = {
      updated: 0,
      created: 0,
      errors: 0,
      errorsList: [] as string[]
    };

    for (const currency of currencies) {
      if (currency.code === baseCurrency) continue;
      
      const rate = rates[currency.code];
      if (!rate) {
        results.errors++;
        results.errorsList.push(`No rate found for ${currency.code}`);
        continue;
      }

      try {
        // Check if rate already exists for today
        const existingRate = await exchangeRateRepo.findOne({
          where: {
            baseCurrencyId: baseCurrencyEntity.id,
            targetCurrencyId: currency.id,
            effectiveDate: today
          }
        });

        if (existingRate) {
          // Update existing rate
          await exchangeRateRepo.update(existingRate.id, {
            rate,
            source: 'API',
            updatedAt: new Date()
          });
          results.updated++;
        } else {
          // Create new rate
          const exchangeRate = exchangeRateRepo.create({
            baseCurrencyId: baseCurrencyEntity.id,
            targetCurrencyId: currency.id,
            rate,
            effectiveDate: today,
            source: 'API',
            isManual: false
          });
          await exchangeRateRepo.save(exchangeRate);
          results.created++;
        }
      } catch (error) {
        results.errors++;
        results.errorsList.push(`${currency.code}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error updating exchange rates:', error);
    res.status(500).json({ 
      error: 'Failed to update exchange rates',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export { router as currencyRouter }; 