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
