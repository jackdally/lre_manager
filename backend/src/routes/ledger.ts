import { Router, Request } from 'express';
import { AppDataSource } from '../config/database';
import { LedgerEntry } from '../entities/LedgerEntry';
import { Program } from '../entities/Program';
import { Risk } from '../entities/Risk';
import { Between, Like, In } from 'typeorm';
import multer from 'multer';
import path from 'path';
import { importLedgerFromFile } from '../services/ledger';
import * as XLSX from 'xlsx';
import { PotentialMatch } from '../entities/PotentialMatch';
import { RiskOpportunityService } from '../services/riskOpportunityService';
import { LedgerAuditTrailService } from '../services/ledgerAuditTrailService';
import { AuditSource, AuditAction } from '../entities/LedgerAuditTrail';
import { RiskLinkingService } from '../services/riskLinkingService';

const router = Router();
const ledgerRepo = AppDataSource.getRepository(LedgerEntry);
const programRepo = AppDataSource.getRepository(Program);
const riskRepo = AppDataSource.getRepository(Risk);
const upload = multer({ dest: '/tmp' });

// Helper function to extract userId from request
function getUserId(req: Request): string | undefined {
  return (req.body?.userId || req.headers['user-id'] as string) || undefined;
}

// Get all unique dropdown options for a program (vendors, wbs elements)
router.get('/:programId/ledger/dropdown-options', async (req, res) => {
  const { programId } = req.params;

  console.log('Dropdown options endpoint called with programId:', programId);

  try {
    // Get all active vendors from the vendor table
    const vendorRepo = AppDataSource.getRepository(require('../entities/Vendor').Vendor);
    const vendors = await vendorRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });

    // Get all WBS elements (hierarchical structure)
    const wbsElementRepo = AppDataSource.getRepository(require('../entities/WbsElement').WbsElement);
    const wbsElements = await wbsElementRepo.find({
      where: { program: { id: programId } },
      order: { code: 'ASC' }
    });

    // Get all active cost categories
    const costCategoryRepo = AppDataSource.getRepository(require('../entities/CostCategory').CostCategory);
    const costCategories = await costCategoryRepo.find({
      where: { isActive: true },
      order: { code: 'ASC' }
    });

    console.log('Found vendors:', vendors.length, 'wbs elements:', wbsElements.length, 'cost categories:', costCategories.length);

    res.json({
      vendors: vendors.map(vendor => ({
        id: vendor.id,
        name: vendor.name,
        isActive: vendor.isActive,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt
      })),
      wbsElements: wbsElements.map(el => ({
        id: el.id,
        code: el.code,
        name: el.name,
        description: el.description,
        level: el.level,
        parentId: el.parentId
      })),
      costCategories: costCategories.map(category => ({
        id: category.id,
        code: category.code,
        name: category.name,
        description: category.description,
        isActive: category.isActive
      }))
    });
  } catch (err) {
    console.error('Error in dropdown-options endpoint:', err);
    res.status(500).json({ message: 'Error fetching dropdown options', error: err });
  }
});

// List ledger entries for a program (with pagination/filter)
router.get('/:programId/ledger', async (req, res) => {
  const { programId } = req.params;
  const { page = 1, limit = 20, search = '', filterType = 'all', vendorFilter } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    // Use query builder for more complex filtering
    const queryBuilder = ledgerRepo.createQueryBuilder('ledger')
      .leftJoinAndSelect('ledger.program', 'program')
      .leftJoinAndSelect('ledger.wbsElement', 'wbsElement')
      .leftJoinAndSelect('ledger.costCategory', 'costCategory')
      .leftJoinAndSelect('ledger.risk', 'risk')
      .where('program.id = :programId', { programId });

    // Add search filter across multiple fields
    if (search) {
      queryBuilder.andWhere(
        '(ledger.vendor_name LIKE :search OR ledger.expense_description LIKE :search OR ledger.notes LIKE :search OR ledger.invoice_link_text LIKE :search)',
        { search: `%${search}%` }
      );
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

    // Add WBS element filter
    if (req.query.wbsElementFilter) {
      queryBuilder.andWhere('ledger.wbsElementId = :wbsElementFilter', { wbsElementFilter: req.query.wbsElementFilter });
    }

    // Add cost category filter
    if (req.query.costCategoryFilter) {
      queryBuilder.andWhere('ledger.costCategoryId = :costCategoryFilter', { costCategoryFilter: req.query.costCategoryFilter });
    }

    // Add ordering and pagination
    queryBuilder.orderBy('ledger.baseline_date', 'ASC')
      .skip(skip)
      .take(Number(limit));

    const [entries, total] = await queryBuilder.getManyAndCount();

    // Load risks through the junction table (we'll add them after)
    const entryIds = entries.map(e => e.id);

    if (entryIds.length > 0) {
      // Load all risk links for these entries
      const { LedgerEntryRisk } = require('../entities/LedgerEntryRisk');
      const ledgerEntryRiskRepo = AppDataSource.getRepository(LedgerEntryRisk);
      const riskLinks = await ledgerEntryRiskRepo.find({
        where: { ledgerEntryId: In(entryIds) },
        relations: ['risk']
      });

      // Group risks by entry ID
      const risksByEntryId = new Map<string, Risk[]>();
      riskLinks.forEach(link => {
        if (!risksByEntryId.has(link.ledgerEntryId)) {
          risksByEntryId.set(link.ledgerEntryId, []);
        }
        risksByEntryId.get(link.ledgerEntryId)!.push(link.risk);
      });

      // Add risks to each entry
      entries.forEach(entry => {
        (entry as any).risks = risksByEntryId.get(entry.id) || [];
      });
    }

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
    const requiredFields = ['vendor_name', 'expense_description', 'wbsElementId'];
    const missingFields = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');

    if (missingFields.length > 0) {
      return res.status(400).json({ message: 'Missing required fields', missingFields });
    }

    const program = await programRepo.findOneBy({ id: programId });
    if (!program) return res.status(404).json({ message: 'Program not found' });

    // Validate WBS element exists and belongs to this program
    const wbsElementRepo = AppDataSource.getRepository(require('../entities/WbsElement').WbsElement);
    const wbsElement = await wbsElementRepo.findOne({
      where: { id: req.body.wbsElementId, program: { id: programId } }
    });
    if (!wbsElement) {
      return res.status(400).json({ message: 'Invalid WBS element ID or element does not belong to this program' });
    }

    // Validate cost category if provided
    if (req.body.costCategoryId) {
      const costCategoryRepo = AppDataSource.getRepository(require('../entities/CostCategory').CostCategory);
      const costCategory = await costCategoryRepo.findOne({
        where: { id: req.body.costCategoryId, isActive: true }
      });
      if (!costCategory) {
        return res.status(400).json({ message: 'Invalid cost category ID or category is not active' });
      }
    }

    const entry = ledgerRepo.create({ ...req.body, program });
    const saved = await ledgerRepo.save(entry);

    // Audit trail logging - non-blocking
    try {
      const userId = getUserId(req);
      // TypeScript sometimes infers save() as returning array, but we know it's a single entry
      const savedEntry = Array.isArray(saved) ? saved[0] : saved;
      await LedgerAuditTrailService.auditLedgerEntryCreation(
        savedEntry,
        AuditSource.MANUAL,
        userId
      );
    } catch (auditError) {
      console.error('Error creating audit trail for ledger entry creation:', auditError);
      // Don't fail the request if audit logging fails
    }

    const responseEntry = Array.isArray(saved) ? saved[0] : saved;
    res.status(201).json(responseEntry);
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

    // Validate cost category if provided
    if (req.body.costCategoryId) {
      const costCategoryRepo = AppDataSource.getRepository(require('../entities/CostCategory').CostCategory);
      const costCategory = await costCategoryRepo.findOne({
        where: { id: req.body.costCategoryId, isActive: true }
      });
      if (!costCategory) {
        return res.status(400).json({ message: 'Invalid cost category ID or category is not active' });
      }
    }

    const entry = await ledgerRepo.findOne({
      where: { id, program: { id: programId } },
      relations: ['program'],
    });
    if (!entry) return res.status(404).json({ message: 'Ledger entry not found for this program' });

    // Capture previous values for audit trail
    const previousValues: Record<string, any> = {
      vendor_name: entry.vendor_name,
      expense_description: entry.expense_description,
      baseline_amount: entry.baseline_amount,
      baseline_date: entry.baseline_date,
      planned_amount: entry.planned_amount,
      planned_date: entry.planned_date,
      actual_amount: entry.actual_amount,
      actual_date: entry.actual_date,
      wbsElementId: entry.wbsElementId,
      costCategoryId: entry.costCategoryId,
      vendorId: entry.vendorId,
      riskId: entry.riskId,
      notes: entry.notes,
      invoice_link_text: entry.invoice_link_text,
      invoice_link_url: entry.invoice_link_url
    };

    // Capture new values from req.body before merging (to avoid floating-point precision issues)
    const numericFields = ['baseline_amount', 'planned_amount', 'actual_amount'];
    const newValuesFromRequest: Record<string, any> = {};
    Object.keys(previousValues).forEach(key => {
      if (key in req.body) {
        // Normalize numeric values to numbers (handles string inputs)
        if (numericFields.includes(key)) {
          const value = req.body[key];
          newValuesFromRequest[key] = value === null || value === undefined || value === '' ? null : Number(value);
        } else {
          newValuesFromRequest[key] = req.body[key];
        }
      }
    });

    ledgerRepo.merge(entry, req.body);
    const saved = await ledgerRepo.save(entry);

    // Check if any values actually changed
    // Use numeric comparison for float fields to handle precision issues
    const newValues: Record<string, any> = {};
    let hasChanges = false;

    Object.keys(previousValues).forEach(key => {
      const oldValue = previousValues[key];
      // Use value from request body if available, otherwise from saved entity
      const newValue = key in newValuesFromRequest ? newValuesFromRequest[key] : (saved as any)[key];

      let changed = false;
      if (numericFields.includes(key)) {
        // For numeric fields, use tolerance-based comparison
        const oldNum = oldValue === null || oldValue === undefined ? null : Number(oldValue);
        const newNum = newValue === null || newValue === undefined ? null : Number(newValue);
        if (oldNum === null && newNum === null) {
          changed = false;
        } else if (oldNum === null || newNum === null) {
          changed = true;
        } else {
          // Use small tolerance for floating point comparison (0.01 cents)
          changed = Math.abs(oldNum - newNum) > 0.0001;
        }
      } else {
        // For non-numeric fields, use strict equality
        changed = oldValue !== newValue;
      }

      if (changed) {
        newValues[key] = newValue;
        hasChanges = true;
      }
    });

    // Audit trail logging - only if values changed, non-blocking
    if (hasChanges) {
      try {
        const userId = getUserId(req);
        await LedgerAuditTrailService.auditLedgerEntryUpdate(
          saved.id,
          previousValues,
          newValues,
          AuditSource.MANUAL,
          userId
        );
      } catch (auditError) {
        console.error('Error creating audit trail for ledger entry update:', auditError);
        // Don't fail the request if audit logging fails
      }
    }

    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error updating ledger entry', error: err instanceof Error ? err.message : err });
  }
});

// Delete ledger entry
router.delete('/ledger/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const entry = await ledgerRepo.findOne({
      where: { id },
      relations: ['program']
    });
    if (!entry) return res.status(404).json({ message: 'Ledger entry not found' });

    // Audit trail logging before deletion - non-blocking
    try {
      const userId = getUserId(req);
      await LedgerAuditTrailService.auditLedgerEntryDeletion(
        entry,
        AuditSource.MANUAL,
        userId
      );
    } catch (auditError) {
      console.error('Error creating audit trail for ledger entry deletion:', auditError);
      // Don't fail the request if audit logging fails
    }

    await ledgerRepo.remove(entry);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Error deleting ledger entry', error: err });
  }
});

// Summary endpoint
// If `month` (YYYY-MM) is provided, return detailed EVM-style metrics for that month (existing behavior).
// If `month` is omitted, return lightweight KPI counts for the current state to power the Ledger page top bar.
router.get('/:programId/ledger/summary', async (req, res) => {
  const { programId } = req.params;
  const { month } = req.query; // format: YYYY-MM

  // Lightweight KPI mode (no month provided)
  if (!month) {
    try {
      const entries = await ledgerRepo.find({
        where: { program: { id: programId } },
        relations: ['program'],
      });

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startStr = startOfMonth.toISOString().slice(0, 10);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const endStr = new Date(nextMonth.getTime() - 1).toISOString().slice(0, 10);

      const totalRecords = entries.length;
      const withActualsCount = entries.filter(e => e.actual_amount != null && e.actual_date != null).length;

      // Missing actuals: only count entries that are planned on or before the current accounting month
      // and don't have actuals yet
      const missingActualsCount = entries.filter(e => {
        if (e.actual_amount != null && e.actual_date != null) return false; // Has actuals, not missing
        if (!e.planned_date) return false; // No planned date, can't determine if missing
        const plannedDate = new Date(e.planned_date);
        const currentMonthEnd = new Date(nextMonth.getTime() - 1); // Last day of current month
        return plannedDate <= currentMonthEnd; // Only count if planned date is in or before current month
      }).length;

      const inMonthCount = entries.filter(e => !!e.planned_date && e.planned_date >= startStr && e.planned_date <= endStr).length;

      return res.json({
        totalRecords,
        currentAccountingMonth: currentMonth,
        inMonthCount,
        withActualsCount,
        missingActualsCount,
      });
    } catch (err) {
      return res.status(500).json({ message: 'Error fetching summary KPIs', error: err });
    }
  }

  // Detailed month summary mode
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
    const userId = getUserId(req);
    const result = await importLedgerFromFile(req.file.path, ext, req.params.programId, userId, req.file.originalname);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Import failed' });
  }
});



// Download import template
router.get('/import/template', (req, res) => {
  // Update the template columns to include cost categories
  const columns = [
    'vendor_name',
    'expense_description',
    'wbsElementCode',
    'costCategoryCode',
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
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
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
      order: { confidence: 'DESC', createdAt: 'DESC' }, // Sort by confidence first (highest first)
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
// Only returns ledger entries that are the "top match" (highest confidence) for each transaction
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
      relations: ['transaction', 'ledgerEntry', 'ledgerEntry.program']
    });

    // Group matches by transaction ID
    const matchesByTransaction = new Map<string, typeof potentialMatches>();
    for (const pm of potentialMatches) {
      const txId = pm.transaction.id;
      if (!matchesByTransaction.has(txId)) {
        matchesByTransaction.set(txId, []);
      }
      matchesByTransaction.get(txId)!.push(pm);
    }

    // For each transaction, find the top match (highest confidence)
    // Only include matches with confidence >= 0.7 (70%) to reduce noise
    const topMatchLedgerEntryIds = new Set<string>();
    for (const [txId, matches] of matchesByTransaction.entries()) {
      // Sort by confidence descending
      const sortedMatches = matches.sort((a, b) => b.confidence - a.confidence);
      const topMatch = sortedMatches[0];

      // Only include if confidence is at least 70%
      if (topMatch && topMatch.confidence >= 0.7) {
        topMatchLedgerEntryIds.add(topMatch.ledgerEntry.id);
      }
    }

    res.json(Array.from(topMatchLedgerEntryIds));
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

// Get all risks linked to a ledger entry
router.get('/:programId/ledger/:entryId/risks', async (req, res) => {
  const { programId, entryId } = req.params;

  try {
    const ledgerEntry = await ledgerRepo.findOne({
      where: { id: entryId, program: { id: programId } },
      relations: ['program']
    });

    if (!ledgerEntry) {
      return res.status(404).json({ message: 'Ledger entry not found' });
    }

    const risksWithMetadata = await RiskLinkingService.getRisksForLedgerEntry(entryId);
    res.json({ risks: risksWithMetadata });
  } catch (error: any) {
    console.error('Error fetching risks for ledger entry:', error);
    res.status(500).json({ message: 'Failed to fetch risks', error: error.message });
  }
});

// Link risk(s) to ledger entry (supports single or multiple)
router.post('/:programId/ledger/:entryId/link-risk', async (req, res) => {
  const { programId, entryId } = req.params;
  const { riskId, riskIds } = req.body;

  try {
    const ledgerEntry = await ledgerRepo.findOne({
      where: { id: entryId, program: { id: programId } },
      relations: ['program']
    });

    if (!ledgerEntry) {
      return res.status(404).json({ message: 'Ledger entry not found' });
    }

    const userId = getUserId(req);
    let result;

    // Support both single riskId (backward compatible) and multiple riskIds
    if (riskIds && Array.isArray(riskIds)) {
      // Link multiple risks
      result = await RiskLinkingService.linkRisksToLedgerEntry(entryId, riskIds, userId);
    } else if (riskId) {
      // Link single risk (backward compatible)
      result = await RiskLinkingService.linkRiskToLedgerEntry(entryId, riskId, userId);
    } else {
      return res.status(400).json({ message: 'riskId or riskIds is required' });
    }

    // Get updated entry
    const updatedEntry = await ledgerRepo.findOne({
      where: { id: entryId },
      relations: ['program']
    });

    // Load risks through the junction table
    const { LedgerEntryRisk } = require('../entities/LedgerEntryRisk');
    const ledgerEntryRiskRepo = AppDataSource.getRepository(LedgerEntryRisk);
    const riskLinks = await ledgerEntryRiskRepo.find({
      where: { ledgerEntryId: entryId },
      relations: ['risk', 'risk.program']
    });
    const risks = riskLinks.map(link => link.risk);
    (updatedEntry as any).risks = risks;

    res.json({
      ledgerEntry: updatedEntry,
      affectedEntries: result.affectedEntries,
      message: result.affectedEntries > 1
        ? `Risk(s) linked to this entry and ${result.affectedEntries - 1} other entries in the allocation`
        : 'Risk(s) linked successfully'
    });
  } catch (error: any) {
    console.error('Error linking risk to ledger entry:', error);
    res.status(500).json({ message: 'Failed to link risk', error: error.message });
  }
});

// Unlink risk from ledger entry
router.delete('/:programId/ledger/:entryId/risks/:riskId', async (req, res) => {
  const { programId, entryId, riskId } = req.params;

  try {
    const ledgerEntry = await ledgerRepo.findOne({
      where: { id: entryId, program: { id: programId } },
      relations: ['program']
    });

    if (!ledgerEntry) {
      return res.status(404).json({ message: 'Ledger entry not found' });
    }

    const userId = getUserId(req);
    const result = await RiskLinkingService.unlinkRiskFromLedgerEntry(entryId, riskId, userId);

    // Get updated entry
    const updatedEntry = await ledgerRepo.findOne({
      where: { id: entryId },
      relations: ['program']
    });

    // Load risks through the junction table
    const { LedgerEntryRisk } = require('../entities/LedgerEntryRisk');
    const ledgerEntryRiskRepo = AppDataSource.getRepository(LedgerEntryRisk);
    const riskLinks = await ledgerEntryRiskRepo.find({
      where: { ledgerEntryId: entryId },
      relations: ['risk', 'risk.program']
    });
    const risks = riskLinks.map(link => link.risk);
    (updatedEntry as any).risks = risks;

    res.json({
      ledgerEntry: updatedEntry,
      affectedEntries: result.affectedEntries,
      message: result.affectedEntries > 1
        ? `Risk unlinked from this entry and ${result.affectedEntries - 1} other entries in the allocation`
        : 'Risk unlinked successfully'
    });
  } catch (error: any) {
    console.error('Error unlinking risk from ledger entry:', error);
    res.status(500).json({ message: 'Failed to unlink risk', error: error.message });
  }
});

// Get linked risk for a ledger entry
router.get('/:programId/ledger/:entryId/linked-risk', async (req, res) => {
  const { programId, entryId } = req.params;

  try {
    const ledgerEntry = await ledgerRepo.findOne({
      where: { id: entryId, program: { id: programId } },
      relations: ['risk', 'risk.program']
    });

    if (!ledgerEntry) {
      return res.status(404).json({ message: 'Ledger entry not found' });
    }

    if (!ledgerEntry.risk) {
      return res.json({ risk: null });
    }

    res.json({ risk: ledgerEntry.risk });
  } catch (error: any) {
    console.error('Error fetching linked risk:', error);
    res.status(500).json({ message: 'Failed to fetch linked risk', error: error.message });
  }
});

// Utilize MR from ledger entry
router.post('/:programId/ledger/:entryId/utilize-mr', async (req, res) => {
  const { programId, entryId } = req.params;
  const { riskId, amount, reason } = req.body;

  try {
    const ledgerEntry = await ledgerRepo.findOne({
      where: { id: entryId, program: { id: programId } },
      relations: ['program']
    });

    if (!ledgerEntry) {
      return res.status(404).json({ message: 'Ledger entry not found' });
    }

    // Validate that ledger entry has actuals
    if (!ledgerEntry.actual_amount || !ledgerEntry.actual_date) {
      return res.status(400).json({ message: 'Ledger entry must have actual amount and date to utilize MR' });
    }

    // Use provided riskId or the linked riskId
    const targetRiskId = riskId || ledgerEntry.riskId;

    if (!targetRiskId) {
      return res.status(400).json({ message: 'Risk ID is required. Either provide riskId in request or link a risk to the ledger entry first.' });
    }

    // Validate risk exists and belongs to program
    const risk = await riskRepo.findOne({
      where: { id: targetRiskId, program: { id: programId } }
    });

    if (!risk) {
      return res.status(404).json({ message: 'Risk not found' });
    }

    // Use actual amount if amount not provided
    const utilizationAmount = amount || ledgerEntry.actual_amount;

    // Utilize MR
    const result = await RiskOpportunityService.utilizeMRForRisk(
      targetRiskId,
      Number(utilizationAmount),
      reason || `MR utilization from ledger entry: ${ledgerEntry.expense_description}`
    );

    // Link the ledger entry to the risk if not already linked
    const wasLinked = !!ledgerEntry.riskId;
    if (!ledgerEntry.riskId) {
      ledgerEntry.riskId = targetRiskId;
      await ledgerRepo.save(ledgerEntry);
    }

    // Audit trail logging for MR utilization - non-blocking
    try {
      const userId = getUserId(req);
      await LedgerAuditTrailService.auditLedgerEntryUpdate(
        ledgerEntry.id,
        { riskId: wasLinked ? ledgerEntry.riskId : undefined },
        {
          riskId: ledgerEntry.riskId,
          // Note: actual_amount and actual_date are not changed by MR utilization
        },
        AuditSource.MANUAL,
        userId
      );
      // Also log with metadata about MR utilization
      await LedgerAuditTrailService.createAuditEntry(
        ledgerEntry.id,
        AuditAction.UPDATED,
        AuditSource.MANUAL,
        {
          userId,
          description: `MR utilized: ${utilizationAmount} for ${reason || 'No reason provided'}`,
          metadata: {
            mrUtilization: true,
            amount: utilizationAmount,
            reason: reason || `MR utilization from ledger entry: ${ledgerEntry.expense_description}`,
            riskId: targetRiskId
          }
        }
      );
    } catch (auditError) {
      console.error('Error creating audit trail for MR utilization:', auditError);
      // Don't fail the request if audit logging fails
    }

    res.json({
      success: true,
      risk: result.risk,
      managementReserve: result.managementReserve,
      ledgerEntry: await ledgerRepo.findOne({
        where: { id: entryId },
        relations: ['risk']
      })
    });
  } catch (error: any) {
    console.error('Error utilizing MR from ledger entry:', error);
    res.status(500).json({ message: 'Failed to utilize MR', error: error.message });
  }
});

export const ledgerRouter = router; 