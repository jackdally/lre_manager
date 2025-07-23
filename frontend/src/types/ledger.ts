export interface LedgerEntry {
  id: string;
  vendor_name: string;
  expense_description: string;
  wbsElementId: string;
  wbsElement: {
    id: string;
    code: string;
    name: string;
    description: string;
    level: number;
    parentId?: string;
  };
  costCategoryId?: string;
  costCategory?: {
    id: string;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
  };
  baseline_date: string | null;
  baseline_amount: number | null;
  planned_date: string | null;
  planned_amount: number | null;
  actual_date: string | null;
  actual_amount: number | null;
  notes: string | null;
  invoice_number: string | null;
  invoice_link_text: string | null;
  invoice_link_url: string | null;
  program: {
    id: string;
    code: string;
    name: string;
  };
  // BOE Integration Fields
  boeElementAllocationId?: string;
  boeVersionId?: string;
  createdFromBOE?: boolean;
  actualsUploadTransaction?: {
    id: string;
    vendorName: string;
    description: string;
    amount: number;
    transactionDate: string;
    status: string;
    actualsUploadSession?: {
      id: string;
      originalFilename: string;
      description: string;
      createdAt: string;
    };
  };
}

export interface LedgerEntryCreateRequest {
  vendor_name: string;
  expense_description: string;
  wbsElementId: string;
  costCategoryId?: string;
  baseline_date?: string;
  baseline_amount?: number;
  planned_date?: string;
  planned_amount?: number;
  actual_date?: string;
  actual_amount?: number;
  notes?: string;
  invoice_number?: string;
  invoice_link_text?: string;
  invoice_link_url?: string;
}

export interface LedgerSummary {
  month: string;
  actualsToDate: number;
  plannedToDate: number;
  baselineToDate: number;
  budget: number;
  etc: number;
  eac: number;
  vac: number;
  monthlyCashFlow: number;
  scheduleVariance: number;
  costVariance: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
}
