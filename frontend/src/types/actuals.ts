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

export interface ActualsUploadConfig {
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
  columnMapping: ActualsUploadConfig;
  isDefault: boolean;
  isGlobal: boolean;
  program?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ActualsUploadSession {
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
  program?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface ActualsUploadTransaction {
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
  importSession?: {
    id: string;
    program: {
      id: string;
      code: string;
      name: string;
    };
  };
}

export interface Program {
  id: string;
  code: string;
  name: string;
  description: string;
}

// Add new interfaces for potential matches and rejected matches
export interface PotentialMatchData {
  id: string;
  vendorName: string;
  description: string;
  amount: number;
  transactionDate: string;
  status: string;
  matchConfidence?: number;
  confidence?: number;
  actualsUploadSession?: {
    id: string;
    originalFilename: string;
    description: string;
    createdAt: string;
  } | null;
  // Add ledgerEntry property that the frontend expects
  ledgerEntry?: {
    id: string;
    vendor_name: string;
    expense_description: string;
    planned_amount: number;
    planned_date: string;
    wbsElementId: string;
    wbsElement: {
      id: string;
      code: string;
      name: string;
      description: string;
      level: number;
      parentId?: string;
    };
    actual_amount?: number;
    actual_date?: string;
    notes?: string;
    invoice_link_text?: string;
    invoice_link_url?: string;
  };
}

export interface RejectedMatchData {
  id: string;
  vendorName: string;
  description: string;
  amount: number;
  transactionDate: string;
  status: string;
  matchConfidence?: number;
  confidence?: number;
  actualsUploadSession?: {
    id: string;
    originalFilename: string;
    description: string;
    createdAt: string;
  } | null;
  // Add ledgerEntry property that the frontend expects
  ledgerEntry?: {
    id: string;
    vendor_name: string;
    expense_description: string;
    planned_amount: number;
    planned_date: string;
    wbsElementId: string;
    wbsElement: {
      id: string;
      code: string;
      name: string;
      description: string;
      level: number;
      parentId?: string;
    };
    actual_amount?: number;
    actual_date?: string;
    notes?: string;
    invoice_link_text?: string;
    invoice_link_url?: string;
  };
}

export interface PotentialMatchesResponse {
  matched: PotentialMatchData[];
  rejected: RejectedMatchData[];
}
