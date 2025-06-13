import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { LedgerEntry } from '../entities/LedgerEntry';
import { Program } from '../entities/Program';
import { Between, Like } from 'typeorm';

const router = Router();
const ledgerRepo = AppDataSource.getRepository(LedgerEntry);
const programRepo = AppDataSource.getRepository(Program);

// List ledger entries for a program (with pagination/filter)
router.get('/programs/:programId/ledger', async (req, res) => {
  const { programId } = req.params;
  const { page = 1, pageSize = 20, search = '' } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);
  try {
    const [entries, total] = await ledgerRepo.findAndCount({
      where: {
        program: { id: Number(programId) },
        vendor_name: Like(`%${search}%`),
      },
      order: { baseline_date: 'ASC' },
      skip,
      take: Number(pageSize),
      relations: ['program'],
    });
    res.json({ entries, total });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching ledger entries', error: err });
  }
});

// Create ledger entry
router.post('/programs/:programId/ledger', async (req, res) => {
  const { programId } = req.params;
  try {
    const program = await programRepo.findOneBy({ id: Number(programId) });
    if (!program) return res.status(404).json({ message: 'Program not found' });
    const entry = ledgerRepo.create({ ...req.body, program });
    const saved = await ledgerRepo.save(entry);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error creating ledger entry', error: err });
  }
});

// Update ledger entry
router.put('/ledger/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const entry = await ledgerRepo.findOneBy({ id });
    if (!entry) return res.status(404).json({ message: 'Ledger entry not found' });
    ledgerRepo.merge(entry, req.body);
    const saved = await ledgerRepo.save(entry);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error updating ledger entry', error: err });
  }
});

// Delete ledger entry
router.delete('/ledger/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const entry = await ledgerRepo.findOneBy({ id });
    if (!entry) return res.status(404).json({ message: 'Ledger entry not found' });
    await ledgerRepo.remove(entry);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Error deleting ledger entry', error: err });
  }
});

// Summary endpoint for a selected month
router.get('/programs/:programId/ledger/summary', async (req, res) => {
  const { programId } = req.params;
  const { month } = req.query; // format: YYYY-MM
  if (!month) return res.status(400).json({ message: 'Month is required' });
  try {
    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    // Convert to YYYY-MM-DD strings
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    // Fetch all entries for the program
    const entries = await ledgerRepo.find({
      where: {
        program: { id: Number(programId) }
      },
      relations: ['program'],
    });

    // Fetch the program to get the total budget
    const program = await programRepo.findOneBy({ id: Number(programId) });
    if (!program) return res.status(404).json({ message: 'Program not found' });
    const budget = program.totalBudget || 0;

    // Project-wide totals (not filtered by date)
    const project_baseline_total = entries.reduce((sum, e) => sum + (e.baseline_amount || 0), 0);
    const project_planned_total = entries.reduce((sum, e) => sum + (e.planned_amount || 0), 0);

    // Calculate summary metrics (filtered by date)
    const actualsToDate = entries.reduce((sum, e) => {
      if (!e.actual_date) return sum;
      const actualDate = new Date(e.actual_date);
      if (actualDate < end) { // Only include actuals up to the selected month
        return sum + (e.actual_amount || 0);
      }
      return sum;
    }, 0);
    
    // ETC (Estimate to Complete) = Sum of planned amounts for future months only
    const etc = entries.reduce((sum, e) => {
      if (!e.planned_date) return sum;
      const plannedDate = new Date(e.planned_date);
      if (plannedDate >= end) { // Only include future months
        return sum + (e.planned_amount || 0);
      }
      return sum;
    }, 0);

    // EAC (Estimate at Completion) = Actuals to date + ETC
    const eac = actualsToDate + etc;

    // Baseline and planned totals up to the selected month (filtered)
    const baselineToDate = entries.reduce((sum, e) => {
      if (!e.baseline_date) return sum;
      const baselineDate = new Date(e.baseline_date);
      if (baselineDate < end) {
        return sum + (e.baseline_amount || 0);
      }
      return sum;
    }, 0);

    const plannedToDate = entries.reduce((sum, e) => {
      if (!e.planned_date) return sum;
      const plannedDate = new Date(e.planned_date);
      if (plannedDate < end) {
        return sum + (e.planned_amount || 0);
      }
      return sum;
    }, 0);

    // VAC (Variance at Completion) = Budget - EAC
    const vac = budget - eac;

    // Monthly cash flow = Sum of planned amounts for the current month
    const monthlyCashFlow = entries.reduce((sum, e) => {
      if (!e.planned_date) return sum;
      const plannedDate = new Date(e.planned_date);
      if (plannedDate >= start && plannedDate < end) {
        return sum + (e.planned_amount || 0);
      }
      return sum;
    }, 0);

    // Schedule Variance (SV) = Actuals to Date - Baseline to Date
    const scheduleVariance = actualsToDate - baselineToDate;

    // Cost Variance (CV) = Planned to Date - Actuals to Date
    const costVariance = plannedToDate - actualsToDate;

    // Schedule Performance Index (SPI) = Actuals to Date / Baseline to Date
    const schedulePerformanceIndex = baselineToDate !== 0 ? actualsToDate / baselineToDate : 0;

    // Cost Performance Index (CPI) = Planned to Date / Actuals to Date
    const costPerformanceIndex = actualsToDate !== 0 ? plannedToDate / actualsToDate : 0;

    res.json({
      actualsToDate,
      etc,
      eac,
      vac,
      monthlyCashFlow,
      baselineToDate,
      plannedToDate,
      project_baseline_total,
      project_planned_total,
      budget,
      scheduleVariance,
      costVariance,
      schedulePerformanceIndex,
      costPerformanceIndex,
      graphData: entries.map(e => ({
        date: e.planned_date,
        planned: e.planned_amount,
        actual: e.actual_amount,
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching summary', error: err });
  }
});

// Full project summary endpoint for clustered/cumulative chart
router.get('/programs/:programId/ledger/summary-full', async (req, res) => {
  const { programId } = req.params;
  try {
    const entries = await ledgerRepo.find({
      where: { program: { id: Number(programId) } },
      relations: ['program'],
    });
    // Group by month (YYYY-MM)
    const monthMap: Record<string, { baseline: number; planned: number; actual: number }> = {};
    entries.forEach(e => {
      // Use planned_date for grouping; fallback to baseline_date if missing
      const date = e.planned_date || e.baseline_date;
      if (!date) return;
      const month = date.slice(0, 7); // YYYY-MM
      if (!monthMap[month]) monthMap[month] = { baseline: 0, planned: 0, actual: 0 };
      monthMap[month].baseline += e.baseline_amount || 0;
      monthMap[month].planned += e.planned_amount || 0;
      monthMap[month].actual += e.actual_amount || 0;
    });
    // Sort months ascending
    const months = Object.keys(monthMap).sort();
    // Build cumulative totals
    let cumBaseline = 0, cumPlanned = 0, cumActual = 0;
    const result = months.map(month => {
      cumBaseline += monthMap[month].baseline;
      cumPlanned += monthMap[month].planned;
      cumActual += monthMap[month].actual;
      return {
        month,
        baseline: monthMap[month].baseline,
        planned: monthMap[month].planned,
        actual: monthMap[month].actual,
        cumBaseline,
        cumPlanned,
        cumActual,
      };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching full summary', error: err });
  }
});

export const ledgerRouter = router; 