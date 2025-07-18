import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { FiscalYear } from '../entities/FiscalYear';

const router = Router();
const fiscalYearRepository = AppDataSource.getRepository(FiscalYear);

// Get all fiscal years
router.get('/', async (req, res) => {
  try {
    const fiscalYears = await fiscalYearRepository.find({
      order: { startDate: 'DESC' }
    });
    
    res.json({ fiscalYears });
  } catch (error) {
    console.error('Error fetching fiscal years:', error);
    res.status(500).json({ error: 'Failed to fetch fiscal years' });
  }
});

// Get active fiscal years
router.get('/active', async (req, res) => {
  try {
    const fiscalYears = await fiscalYearRepository.find({
      where: { isActive: true },
      order: { startDate: 'DESC' }
    });
    
    res.json({ fiscalYears });
  } catch (error) {
    console.error('Error fetching active fiscal years:', error);
    res.status(500).json({ error: 'Failed to fetch active fiscal years' });
  }
});

// Get default fiscal year
router.get('/default', async (req, res) => {
  try {
    const fiscalYear = await fiscalYearRepository.findOne({
      where: { isDefault: true }
    });
    
    if (!fiscalYear) {
      return res.status(404).json({ error: 'No default fiscal year found' });
    }
    
    res.json({ fiscalYear });
  } catch (error) {
    console.error('Error fetching default fiscal year:', error);
    res.status(500).json({ error: 'Failed to fetch default fiscal year' });
  }
});

// Get fiscal year by ID
router.get('/:id', async (req, res) => {
  try {
    const fiscalYear = await fiscalYearRepository.findOne({
      where: { id: req.params.id }
    });
    
    if (!fiscalYear) {
      return res.status(404).json({ error: 'Fiscal year not found' });
    }
    
    res.json({ fiscalYear });
  } catch (error) {
    console.error('Error fetching fiscal year:', error);
    res.status(500).json({ error: 'Failed to fetch fiscal year' });
  }
});

// Create new fiscal year
router.post('/', async (req, res) => {
  try {
    const fiscalYearData = req.body;
    
    // Create new fiscal year instance
    const fiscalYear = new FiscalYear();
    Object.assign(fiscalYear, fiscalYearData);
    
    // Basic validation
    if (!fiscalYear.name || !fiscalYear.startDate || !fiscalYear.endDate) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: ['Name, start date, and end date are required']
      });
    }
    
    // Check for date conflicts using raw SQL for complex date range queries
    const existingFiscalYear = await fiscalYearRepository
      .createQueryBuilder('fy')
      .where('fy.startDate = :startDate', { startDate: fiscalYear.startDate })
      .orWhere('fy.endDate = :endDate', { endDate: fiscalYear.endDate })
      .orWhere('fy.startDate <= :startDate AND fy.endDate >= :startDate', { startDate: fiscalYear.startDate })
      .orWhere('fy.startDate <= :endDate AND fy.endDate >= :endDate', { endDate: fiscalYear.endDate })
      .getOne();
    
    if (existingFiscalYear) {
      return res.status(400).json({ 
        error: 'Fiscal year dates conflict with existing fiscal year' 
      });
    }
    
    // If this is set as default, unset other defaults
    if (fiscalYear.isDefault) {
      await fiscalYearRepository.update(
        { isDefault: true },
        { isDefault: false }
      );
    }
    
    const savedFiscalYear = await fiscalYearRepository.save(fiscalYear);
    res.status(201).json({ fiscalYear: savedFiscalYear });
  } catch (error) {
    console.error('Error creating fiscal year:', error);
    res.status(500).json({ error: 'Failed to create fiscal year' });
  }
});

// Update fiscal year
router.put('/:id', async (req, res) => {
  try {
    const fiscalYear = await fiscalYearRepository.findOne({
      where: { id: req.params.id }
    });
    
    if (!fiscalYear) {
      return res.status(404).json({ error: 'Fiscal year not found' });
    }
    
    // Update fiscal year data
    Object.assign(fiscalYear, req.body);
    
    // Basic validation
    if (!fiscalYear.name || !fiscalYear.startDate || !fiscalYear.endDate) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: ['Name, start date, and end date are required']
      });
    }
    
    // Check for date conflicts (excluding current fiscal year) using raw SQL
    const existingFiscalYear = await fiscalYearRepository
      .createQueryBuilder('fy')
      .where('fy.id != :id', { id: fiscalYear.id })
      .andWhere(
        '(fy.startDate = :startDate OR fy.endDate = :endDate OR (fy.startDate <= :startDate AND fy.endDate >= :startDate) OR (fy.startDate <= :endDate AND fy.endDate >= :endDate))',
        { startDate: fiscalYear.startDate, endDate: fiscalYear.endDate }
      )
      .getOne();
    
    if (existingFiscalYear) {
      return res.status(400).json({ 
        error: 'Fiscal year dates conflict with existing fiscal year' 
      });
    }
    
    // If this is set as default, unset other defaults
    if (fiscalYear.isDefault) {
      await fiscalYearRepository
        .createQueryBuilder()
        .update(FiscalYear)
        .set({ isDefault: false })
        .where('id != :id', { id: fiscalYear.id })
        .andWhere('isDefault = :isDefault', { isDefault: true })
        .execute();
    }
    
    const updatedFiscalYear = await fiscalYearRepository.save(fiscalYear);
    res.json({ fiscalYear: updatedFiscalYear });
  } catch (error) {
    console.error('Error updating fiscal year:', error);
    res.status(500).json({ error: 'Failed to update fiscal year' });
  }
});

// Delete fiscal year
router.delete('/:id', async (req, res) => {
  try {
    const fiscalYear = await fiscalYearRepository.findOne({
      where: { id: req.params.id }
    });
    
    if (!fiscalYear) {
      return res.status(404).json({ error: 'Fiscal year not found' });
    }
    
    // Prevent deletion of default fiscal year
    if (fiscalYear.isDefault) {
      return res.status(400).json({ 
        error: 'Cannot delete the default fiscal year' 
      });
    }
    
    // Check if fiscal year is in use (future enhancement)
    // const programsUsingFiscalYear = await programRepository.count({
    //   where: { fiscalYearId: req.params.id }
    // });
    // if (programsUsingFiscalYear > 0) {
    //   return res.status(400).json({ 
    //     error: 'Cannot delete fiscal year that is in use by programs' 
    //   });
    // }
    
    await fiscalYearRepository.remove(fiscalYear);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting fiscal year:', error);
    res.status(500).json({ error: 'Failed to delete fiscal year' });
  }
});

// Set default fiscal year
router.patch('/:id/set-default', async (req, res) => {
  try {
    const fiscalYear = await fiscalYearRepository.findOne({
      where: { id: req.params.id }
    });
    
    if (!fiscalYear) {
      return res.status(404).json({ error: 'Fiscal year not found' });
    }
    
    // Unset current default
    await fiscalYearRepository.update(
      { isDefault: true },
      { isDefault: false }
    );
    
    // Set new default
    fiscalYear.isDefault = true;
    const updatedFiscalYear = await fiscalYearRepository.save(fiscalYear);
    
    res.json({ fiscalYear: updatedFiscalYear });
  } catch (error) {
    console.error('Error setting default fiscal year:', error);
    res.status(500).json({ error: 'Failed to set default fiscal year' });
  }
});

// Get reporting periods for a fiscal year
router.get('/:id/periods', async (req, res) => {
  try {
    const fiscalYear = await fiscalYearRepository.findOne({
      where: { id: req.params.id }
    });
    
    if (!fiscalYear) {
      return res.status(404).json({ error: 'Fiscal year not found' });
    }
    
    const periods = generateReportingPeriods(fiscalYear);
    res.json({ periods });
  } catch (error) {
    console.error('Error generating reporting periods:', error);
    res.status(500).json({ error: 'Failed to generate reporting periods' });
  }
});

// Helper function to generate reporting periods
function generateReportingPeriods(fiscalYear: FiscalYear) {
  const periods = [];
  const startDate = new Date(fiscalYear.startDate);
  const endDate = new Date(fiscalYear.endDate);
  
  let currentDate = new Date(startDate);
  let periodNumber = 1;
  
  while (currentDate <= endDate && periodNumber <= fiscalYear.numberOfPeriods) {
    let periodEndDate = new Date(currentDate);
    
    switch (fiscalYear.periodType) {
      case 'weekly':
        periodEndDate.setDate(currentDate.getDate() + 6);
        break;
      case 'monthly':
        periodEndDate.setMonth(currentDate.getMonth() + 1);
        periodEndDate.setDate(0); // Last day of the month
        break;
      case 'quarterly':
        periodEndDate.setMonth(currentDate.getMonth() + 3);
        periodEndDate.setDate(0);
        break;
      default:
        // Custom periods - divide fiscal year evenly
        const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysPerPeriod = Math.floor(totalDays / fiscalYear.numberOfPeriods);
        periodEndDate.setDate(currentDate.getDate() + daysPerPeriod - 1);
        break;
    }
    
    // Ensure period doesn't extend beyond fiscal year end
    if (periodEndDate > endDate) {
      periodEndDate = new Date(endDate);
    }
    
    periods.push({
      periodNumber,
      name: `Period ${periodNumber}`,
      startDate: currentDate.toISOString().split('T')[0],
      endDate: periodEndDate.toISOString().split('T')[0],
      type: fiscalYear.periodType
    });
    
    // Move to next period
    currentDate = new Date(periodEndDate);
    currentDate.setDate(currentDate.getDate() + 1);
    periodNumber++;
  }
  
  return periods;
}

export default router; 