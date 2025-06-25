export interface ActualsSession {
  id: string;
  filename: string;
  originalFilename: string;
  description: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  errorRecords: number;
  createdAt: string;
  updatedAt: string;
  program: {
    id: string;
    code: string;
    name: string;
  };
}

export interface ActualsTransaction {
  id: string;
  vendorName: string;
  description: string;
  amount: number;
  transactionDate: string;
  programCode: string;
  category: string | null;
  subcategory: string | null;
  invoiceNumber: string | null;
  referenceNumber: string | null;
  transactionId: string | null;
  status: string;
  duplicateType: string;
  duplicateOfId: string | null;
  createdAt: string;
  updatedAt: string;
  actualsSession: {
    id: string;
    originalFilename: string;
    description: string;
  };
}

export interface ActualsConfig {
  vendorColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  dateColumn: string;
  programCodeColumn?: string;
  invoiceColumn?: string;
  categoryColumn?: string;
  subcategoryColumn?: string;
}

export interface ImportConfig {
  programCodeColumn: string;
  vendorColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  dateColumn: string;
  periodColumn?: string;
  categoryColumn?: string;
  subcategoryColumn?: string;
  invoiceColumn?: string;
  referenceColumn?: string;
  transactionIdColumn?: string;
  dateFormat?: string;
  amountTolerance?: number;
  matchThreshold?: number;
}

export interface SavedConfig {
  id: string;
  name: string;
  description: string;
  columnMapping: ImportConfig;
  isDefault: boolean;
  isGlobal: boolean;
  program?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ImportSession {
  id: string;
  filename: string;
  originalFilename: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'replaced';
  totalRecords: number;
  processedRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  errorRecords: number;
  confirmedRecords?: number;
  rejectedRecords?: number;
  replacedRecords?: number;
  addedToLedgerRecords?: number;
  createdAt: string;
  updatedAt: string;
  replacedBySessionId?: string | null;
}

export interface ImportTransaction {
  id: string;
  vendorName: string;
  description: string;
  amount: number;
  transactionDate: string;
  programCode: string;
  category?: string;
  subcategory?: string;
  invoiceNumber?: string;
  referenceNumber?: string;
  transactionId?: string;
  status: 'unmatched' | 'matched' | 'confirmed' | 'rejected' | 'added_to_ledger' | 'replaced';
  matchConfidence?: number;
  suggestedMatches?: any[];
  matchedLedgerEntry?: any;
  duplicateType?: 'none' | 'exact_duplicate' | 'different_info_confirmed' | 'different_info_pending' | 'original_rejected' | 'no_invoice_potential' | 'multiple_potential';
  duplicateOfId?: string | null;
  preservedFromSessionId?: string | null;
  rejectedMatches?: any[];
}

export interface Program {
  id: string;
  code: string;
  name: string;
  description: string;
}
