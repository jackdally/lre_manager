export interface Program {
  id: string;
  code: string;
  name: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number;
  type: 'Annual' | 'Period of Performance';
  program_manager?: string;
  program_manager_email?: string | null;
}

export interface LedgerEntry {
  id: string;
  vendor_name: string;
  expense_description: string;
  wbs_category: string;
  wbs_subcategory: string;
  baseline_date: string;
  baseline_amount: number;
  planned_date: string;
  planned_amount: number;
  actual_date: string | null;
  actual_amount: number | null;
  notes: string | null;
}

export interface SummaryType {
  actualsToDate: number;
  etc: number;
  eac: number;
  vac: number;
  scheduleVariance: number;
  schedulePerformanceIndex: number;
  costVariance: number;
  costPerformanceIndex: number;
  project_baseline_total: number;
  baselineToDate: number;
  project_planned_total: number;
  plannedToDate: number;
}

export interface FullSummaryType {
  month: string;
  baseline: number;
  planned: number;
  actual: number;
  cumBaseline: number;
  cumPlanned: number;
  cumActual: number;
  cumProjected: number;
}

export interface TopRowSummaryType {
  actualsToDate: number;
  eac: number;
  vac: number;
}

export interface LedgerEntriesResponse {
  entries: LedgerEntry[];
}

export interface CategoryDataItem {
  name: string;
  actual: number;
  planned: number;
  color: string;
} 