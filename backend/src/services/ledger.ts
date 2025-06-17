import { LedgerEntry } from '../entities/LedgerEntry';
import * as XLSX from 'xlsx';
import { AppDataSource } from '../config/database';
import { Program } from '../entities/Program';

export function calculateActualsToDate(entries: LedgerEntry[], date: Date = new Date()): number {
  return entries
    .filter(entry => entry.actual_amount && entry.actual_date && new Date(entry.actual_date) <= date)
    .reduce((sum, entry) => sum + Number(entry.actual_amount), 0);
}

export function calculatePlannedToDate(entries: LedgerEntry[], date: Date = new Date()): number {
  return entries
    .filter(entry => entry.planned_amount && entry.planned_date && new Date(entry.planned_date) <= date)
    .reduce((sum, entry) => sum + Number(entry.planned_amount), 0);
}

export function calculateScheduleVariance(entries: LedgerEntry[], date: Date = new Date()): number {
  return calculateActualsToDate(entries, date) - calculateBaselineToDate(entries, date);
}

export function calculateBaselineToDate(entries: LedgerEntry[], date: Date = new Date()): number {
  return entries
    .filter(entry => entry.baseline_amount && entry.baseline_date && new Date(entry.baseline_date) <= date)
    .reduce((sum, entry) => sum + Number(entry.baseline_amount), 0);
}

export function calculateCostVariance(entries: LedgerEntry[], date: Date = new Date()): number {
  return calculatePlannedToDate(entries, date) - calculateActualsToDate(entries, date);
}

export function calculateSPI(entries: LedgerEntry[], date: Date = new Date()): number {
  const planned = calculatePlannedToDate(entries, date);
  const actual = calculateActualsToDate(entries, date);
  return actual !== 0 ? planned / actual : 0;
}

export async function importLedgerFromFile(filePath: string, ext: string): Promise<any> {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const ledgerRepo = AppDataSource.getRepository(LedgerEntry);
  const programRepo = AppDataSource.getRepository(Program);
  let inserted = 0;
  let failed = 0;
  const errors: any[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // Required fields
      const required = ['vendor_name', 'expense_description', 'wbs_category', 'wbs_subcategory', 'program_code'];
      for (const f of required) {
        if (!row[f]) throw new Error(`Missing required field: ${f}`);
      }
      // Find program
      const program = await programRepo.findOneBy({ code: row.program_code });
      if (!program) throw new Error(`Program not found: ${row.program_code}`);
      // Create entry
      const entry = ledgerRepo.create({
        vendor_name: row.vendor_name,
        expense_description: row.expense_description,
        wbs_category: row.wbs_category,
        wbs_subcategory: row.wbs_subcategory,
        baseline_date: row.baseline_date || null,
        baseline_amount: row.baseline_amount ? Number(row.baseline_amount) : null,
        planned_date: row.planned_date || null,
        planned_amount: row.planned_amount ? Number(row.planned_amount) : null,
        actual_date: row.actual_date || null,
        actual_amount: row.actual_amount ? Number(row.actual_amount) : null,
        notes: row.notes || null,
        program: program,
      });
      await ledgerRepo.save(entry);
      inserted++;
    } catch (err: any) {
      failed++;
      errors.push({ row: i + 2, error: err.message }); // +2 for header and 0-index
    }
  }
  return { inserted, failed, errors };
} 