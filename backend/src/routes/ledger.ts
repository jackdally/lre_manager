import { Router, Request } from 'express';
import { AppDataSource } from '../config/database';
import { LedgerEntry } from '../entities/LedgerEntry';
import { Program } from '../entities/Program';
import { Between, Like, In } from 'typeorm';
import multer from 'multer';
import path from 'path';
import { importLedgerFromFile } from '../services/ledger';
import * as XLSX from 'xlsx';
import { PotentialMatch } from '../entities/PotentialMatch';

const router = Router();
const ledgerRepo = AppDataSource.getRepository(LedgerEntry);
const programRepo = AppDataSource.getRepository(Program);
const upload = multer({ dest: '/tmp' });

// Get all unique dropdown options for a program (vendors, categories, subcategories)
router.get('/:programId/ledger/dropdown-options', async (req, res) => {
  const { programId } = req.params;
  
  console.log('Dropdown options endpoint called with programId:', programId);
  
  try {
    // Get all unique vendors
    const vendors = await ledgerRepo
      .createQueryBuilder('ledger')
      .leftJoin('ledger.program', 'program')
      .where('program.id = :programId', { programId })
      .andWhere('ledger.vendor_name IS NOT NULL')
      .andWhere('ledger.vendor_name != :emptyString', { emptyString: '' })
      .select('ledger.vendor_name', 'vendor_name')
      .distinct()
      .orderBy('ledger.vendor_name', 'ASC')
      .getRawMany();

    // Get all unique categories
    const categories = await ledgerRepo
      .createQueryBuilder('ledger')
      .leftJoin('ledger.program', 'program')
      .where('program.id = :programId', { programId })
      .andWhere('ledger.wbs_category IS NOT NULL')
      .andWhere('ledger.wbs_category != :emptyString', { emptyString: '' })
      .select('ledger.wbs_category', 'wbs_category')
      .distinct()
      .orderBy('ledger.wbs_category', 'ASC')
      .getRawMany();

    // Get all unique subcategories
    const subcategories = await ledgerRepo
      .createQueryBuilder('ledger')
      .leftJoin('ledger.program', 'program')
      .where('program.id = :programId', { programId })
      .andWhere('ledger.wbs_subcategory IS NOT NULL')
      .andWhere('ledger.wbs_subcategory != :emptyString', { emptyString: '' })
      .select('ledger.wbs_subcategory', 'wbs_subcategory')
      .distinct()
      .orderBy('ledger.wbs_subcategory', 'ASC')
      .getRawMany();

    console.log('Found vendors:', vendors.length, 'categories:', categories.length, 'subcategories:', subcategories.length);

    res.json({
      vendors: vendors.map(v => v.vendor_name),
      categories: categories.map(c => c.wbs_category),
      subcategories: subcategories.map(s => s.wbs_subcategory)
    });
  } catch (err) {
    console.error('Error in dropdown-options endpoint:', err);
    res.status(500).json({ message: 'Error fetching dropdown options', error: err });
  }
});

// List ledger entries for a program (with pagination/filter)
router.get('/:programId/ledger', async (req, res) => {
  const { programId } = req.params;
  const { page = 1, limit = 20, search = '', filterType = 'all', vendorFilter, wbsCategoryFilter, wbsSubcategoryFilter } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  
  try {
    // Use query builder for more complex filtering
    const queryBuilder = ledgerRepo.createQueryBuilder('ledger')
      .leftJoinAndSelect('ledger.program', 'program')
      .where('program.id = :programId', { programId });

    // Add search filter
    if (search) {
      queryBuilder.andWhere('ledger.vendor_name LIKE :search', { search: `%${search}%` });
    }

    // Add filterType logic
    if (filterType === 'emptyActuals') {
      queryBuilder.andWhere('ledger.actual_amount IS NULL')
                 .andWhere('ledger.actual_date IS NULL');
    } else if (filterType === 'currentMonthPlanned') {
      // Get current month's start and end dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      queryBuilder.andWhere('ledger.planned_date BETWEEN :startDate AND :endDate', {
        startDate: startOfMonth.toISOString().slice(0, 10),
        endDate: endOfMonth.toISOString().slice(0, 10)
      });
    }

    // Add vendor filter (only if not already set by search)
    if (vendorFilter && !search) {
      queryBuilder.andWhere('ledger.vendor_name = :vendorFilter', { vendorFilter });
    }

    // Add WBS category filter
    if (wbsCategoryFilter) {
      queryBuilder.andWhere('ledger.wbs_category = :wbsCategoryFilter', { wbsCategoryFilter });
    }

    // Add WBS subcategory filter
    if (wbsSubcategoryFilter) {
      queryBuilder.andWhere('ledger.wbs_subcategory = :wbsSubcategoryFilter', { wbsSubcategoryFilter });
    }

    // Add ordering and pagination
    queryBuilder.orderBy('ledger.baseline_date', 'ASC')
                .skip(skip)
                .take(Number(limit));

    const [entries, total] = await queryBuilder.getManyAndCount();

    // For each entry, find the related ImportTransaction (if any) and its ImportSession
    const importTransactionRepo = AppDataSource.getRepository(require('../entities/ImportTransaction').ImportTransaction);
    const importSessionRepo = AppDataSource.getRepository(require('../entities/ImportSession').ImportSession);
    const entriesWithImportInfo = await Promise.all(entries.map(async (entry) => {
      const importTransaction = await importTransactionRepo.findOne({
        where: {
          matchedLedgerEntry: { id: entry.id },
          amount: entry.actual_amount,
          transactionDate: entry.actual_date,
          status: In(['confirmed', 'added_to_ledger']), // Only show if confirmed or added
        },
        relations: ['importSession'],
        order: { createdAt: 'DESC' },
      });
      if (importTransaction) {
        return {
          ...entry,
          actualsUploadTransaction: {
            id: importTransaction.id,
            vendorName: importTransaction.vendorName,
            description: importTransaction.description,
            amount: importTransaction.amount,
            transactionDate: importTransaction.transactionDate,
            status: importTransaction.status,
            actualsUploadSession: importTransaction.importSession ? {
              id: importTransaction.importSession.id,
              originalFilename: importTransaction.importSession.originalFilename,
              description: importTransaction.importSession.description,
              createdAt: importTransaction.importSession.createdAt,
            } : null,
          },
        };
      } else {
        return entry;
      }
    }));

    res.json({ entries: entriesWithImportInfo, total });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching ledger entries', error: err });
  }
});

// Create ledger entry
router.post('/:programId/ledger', async (req, res) => {
  const { programId } = req.params;
  try {
    const requiredFields = ['vendor_name', 'expense_description', 'wbs_category', 'wbs_subcategory'];
    const missingFields = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
    if (missingFields.length > 0) {
      return res.status(400).json({ message: 'Missing required fields', missingFields });
    }
    const program = await programRepo.findOneBy({ id: programId });
    if (!program) return res.status(404).json({ message: 'Program not found' });
    const entry = ledgerRepo.create({ ...req.body, program });
    const saved = await ledgerRepo.save(entry);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error creating ledger entry', error: err instanceof Error ? err.message : err });
  }
});

// Update ledger entry (RESTful, scoped to program)
router.put('/:programId/ledger/:id', async (req, res) => {
  const { programId, id } = req.params;
  try {
    // Convert empty string dates to null
    ['baseline_date', 'planned_date', 'actual_date'].forEach(field => {
      if (req.body[field] === '') req.body[field] = null;
    });
    const entry = await ledgerRepo.findOne({
      where: { id, program: { id: programId } },
      relations: ['program'],
    });
    if (!entry) return res.status(404).json({ message: 'Ledger entry not found for this program' });
    ledgerRepo.merge(entry, req.body);
    const saved = await ledgerRepo.save(entry);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error updating ledger entry', error: err instanceof Error ? err.message : err });
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
router.get('/:programId/ledger/summary', async (req, res) => {
  const { programId } = req.params;
  const { month } = req.query; // format: YYYY-MM
  if (!month) return res.status(400).json({ message: 'Month is required' });
  try {
    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(end.getDate() - 1); // last day of selected month
    // Convert to YYYY-MM-DD strings
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    // Fetch all entries for the program
    const entries = await ledgerRepo.find({
      where: {
        program: { id: programId }
      },
      relations: ['program'],
    });

    // Fetch the program to get the total budget
    const program = await programRepo.findOneBy({ id: programId });
    if (!program) return res.status(404).json({ message: 'Program not found' });
    const budget = program.totalBudget || 0;

    // Project-wide totals (not filtered by date)
    const project_baseline_total = entries.reduce((sum, e) => sum + (e.baseline_amount || 0), 0);
    const project_planned_total = entries.reduce((sum, e) => sum + (e.planned_amount || 0), 0);

    // Calculate summary metrics (filtered by date)
    const actualsToDate = entries.reduce((sum, e) => {
      if (!e.actual_date) return sum;
      const actualDate = new Date(e.actual_date);
      if (actualDate <= end) { // Include actuals up to and including the selected month
        return sum + (e.actual_amount || 0);
      }
      return sum;
    }, 0);
    
    // ETC (Estimate to Complete) = Sum of planned amounts for future months only
    const etc = entries.reduce((sum, e) => {
      if (!e.planned_date) return sum;
      const plannedDate = new Date(e.planned_date);
      if (plannedDate > end) { // Only include future months strictly after the selected month
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
      if (baselineDate <= end) {
        return sum + (e.baseline_amount || 0);
      }
      return sum;
    }, 0);

    const plannedToDate = entries.reduce((sum, e) => {
      if (!e.planned_date) return sum;
      const plannedDate = new Date(e.planned_date);
      if (plannedDate <= end) {
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

    // Debug log for CV investigation
    console.log(`[CV DEBUG] Month: ${month}, plannedToDate: ${plannedToDate}, actualsToDate: ${actualsToDate}, costVariance: ${costVariance}`);

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
router.get('/:programId/ledger/summary-full', async (req, res) => {
  const { programId } = req.params;
  try {
    const entries = await ledgerRepo.find({
      where: { program: { id: programId } },
      relations: ['program'],
    });
    // Group by month (YYYY-MM) for each type
    const baselineMap: Record<string, number> = {};
    const plannedMap: Record<string, number> = {};
    const actualMap: Record<string, number> = {};
    entries.forEach(e => {
      if (e.baseline_date && e.baseline_amount != null) {
        const month = e.baseline_date.slice(0, 7);
        baselineMap[month] = (baselineMap[month] || 0) + (e.baseline_amount || 0);
      }
      if (e.planned_date && e.planned_amount != null) {
        const month = e.planned_date.slice(0, 7);
        plannedMap[month] = (plannedMap[month] || 0) + (e.planned_amount || 0);
      }
      if (e.actual_date && e.actual_amount != null) {
        const month = e.actual_date.slice(0, 7);
        actualMap[month] = (actualMap[month] || 0) + (e.actual_amount || 0);
      }
    });
    // Collect all months present in any map
    const allMonths = Array.from(new Set([
      ...Object.keys(baselineMap),
      ...Object.keys(plannedMap),
      ...Object.keys(actualMap),
    ])).sort();
    // Build cumulative totals
    let cumBaseline = 0, cumPlanned = 0, cumActual = 0;
    const result = allMonths.map(month => {
      cumBaseline += baselineMap[month] || 0;
      cumPlanned += plannedMap[month] || 0;
      cumActual += actualMap[month] || 0;
      return {
        month,
        baseline: baselineMap[month] || 0,
        planned: plannedMap[month] || 0,
        actual: actualMap[month] || 0,
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

// Import ledger entries from Excel or CSV
router.post('/:programId/import/ledger', upload.single('file'), async (req: Request & { file?: any }, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      return res.status(400).json({ error: 'Unsupported file type' });
    }
    const result = await importLedgerFromFile(req.file.path, ext, req.params.programId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Import failed' });
  }
});

// Download ledger template (Excel)
router.get('/template', async (req, res) => {
  // Define all possible columns for the ledger
  const headers = [
    'vendor_name',
    'expense_description',
    'wbs_category',
    'wbs_subcategory',
    'baseline_date',
    'baseline_amount',
    'planned_date',
    'planned_amount',
    'actual_date',
    'actual_amount',
    'notes',
    'invoice_link_text',
    'invoice_link_url',
  ];
  // Create a worksheet with just the headers
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'LedgerTemplate');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="ledger_template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// Download import template
router.get('/import/template', (req, res) => {
  // Update the template columns to include invoice_link_text and invoice_link_url
  const columns = [
    'vendor_name',
    'expense_description',
    'wbs_category',
    'wbs_subcategory',
    'baseline_date',
    'baseline_amount',
    'planned_date',
    'planned_amount',
    'actual_date',
    'actual_amount',
    'notes',
    'invoice_link_text',
    'invoice_link_url'
  ];
  // Create a worksheet with just the headers
  const ws = XLSX.utils.aoa_to_sheet([columns]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'LedgerTemplate');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="ledger_template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// Get potential matches for a ledger entry (matched and rejected)
router.get('/:programId/ledger/:ledgerEntryId/potential-matches', async (req, res) => {
  const { ledgerEntryId } = req.params;
  try {
    const potentialMatchRepo = AppDataSource.getRepository(PotentialMatch);
    
    // Get all potential matches for this ledger entry
    const potentialMatches = await potentialMatchRepo.find({
      where: {
        ledgerEntry: { id: ledgerEntryId },
        status: 'potential'
      },
      relations: ['transaction', 'transaction.importSession', 'ledgerEntry'],
      order: { createdAt: 'DESC' },
    });
    
    // Get rejected matches for this ledger entry
    const rejectedMatchRepo = AppDataSource.getRepository(require('../entities/RejectedMatch').RejectedMatch);
    const rejectedMatches = await rejectedMatchRepo.find({
      where: {
        ledgerEntry: { id: ledgerEntryId }
      },
      relations: ['transaction', 'transaction.importSession', 'ledgerEntry'],
      order: { createdAt: 'DESC' },
    });
    
    // Transform the data to include ledgerEntry property that frontend expects
    const matched = potentialMatches.map(pm => ({
      ...pm.transaction,
      ledgerEntry: pm.ledgerEntry,
      confidence: pm.confidence
    }));
    
    const rejected = rejectedMatches.map(rm => ({
      ...rm.transaction,
      ledgerEntry: rm.ledgerEntry
    }));
    
    res.json({ 
      matched, 
      rejected 
    });
  } catch (err) {
    console.error('Error fetching potential matches:', err);
    res.status(500).json({ error: 'Failed to fetch potential matches' });
  }
});

// Get all ledger entry IDs with potential matches for a program
router.get('/:programId/ledger/potential-match-ids', async (req, res) => {
  const { programId } = req.params;
  try {
    const potentialMatchRepo = AppDataSource.getRepository(PotentialMatch);
    
    // Get all potential matches for this program
    const potentialMatches = await potentialMatchRepo.find({
      where: {
        ledgerEntry: { program: { id: programId } },
        status: 'potential'
      },
      relations: ['ledgerEntry', 'ledgerEntry.program']
    });
    
    // Extract unique ledger entry IDs
    const matchIds = new Set(potentialMatches.map(pm => pm.ledgerEntry.id));
    res.json(Array.from(matchIds));
  } catch (err) {
    console.error('Error fetching potential match IDs:', err);
    res.status(500).json({ error: 'Failed to fetch potential match IDs' });
  }
});

// Get all ledger entry IDs with rejected matches for a program
router.get('/:programId/ledger/rejected-match-ids', async (req, res) => {
  const { programId } = req.params;
  try {
    const rejectedMatchRepo = AppDataSource.getRepository(require('../entities/RejectedMatch').RejectedMatch);
    const rejected = await rejectedMatchRepo
      .createQueryBuilder('rm')
      .leftJoin('rm.ledgerEntry', 'le')
      .leftJoin('le.program', 'p')
      .where('p.id = :programId', { programId })
      .select('le.id', 'ledgerEntryId')
      .distinct(true)
      .getRawMany();
    const ids = rejected.map(m => m.ledgerEntryId);
    res.json(ids);
  } catch (err) {
    console.error('Error fetching rejected match IDs:', err);
    res.status(500).json({ error: 'Failed to fetch rejected match IDs' });
  }
});

export const ledgerRouter = router; 