export interface ProgramCreateRequest {
  code: string;
  name: string;
  description: string;
  type: "Annual" | "Period of Performance";
  totalBudget: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  program_manager?: string;
}

export interface LedgerEntryCreateRequest {
  vendor_name: string;
  expense_description: string;
  wbsElementCode: string;
  baseline_date?: string;
  baseline_amount?: number;
  planned_date?: string;
  planned_amount?: number;
  actual_date?: string;
  actual_amount?: number;
  notes?: string;
  invoice_link_text?: string;
  invoice_link_url?: string;
}

export interface ImportConfig {
  vendorColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  dateColumn: string;
  programCodeColumn?: string;
  invoiceColumn?: string;
  categoryColumn?: string;
  subcategoryColumn?: string;
}
