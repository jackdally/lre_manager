export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

export const FILE_TYPES = {
  EXCEL: [".xlsx", ".xls"],
  CSV: [".csv"],
  ALL: [".xlsx", ".xls", ".csv"]
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const PROGRAM_TYPES = ["Annual", "Period of Performance"] as const;

export const PROGRAM_STATUSES = ["Active", "Inactive", "Completed", "On Hold"] as const;

export const TRANSACTION_STATUSES = [
  "UNMATCHED",
  "MATCHED",
  "CONFIRMED",
  "REJECTED",
  "ADDED_TO_LEDGER",
  "REPLACED"
] as const;

export const DUPLICATE_TYPES = [
  "NONE",
  "EXACT",
  "INVOICE_MATCH",
  "NO_INVOICE_POTENTIAL",
  "MULTIPLE_POTENTIAL"
] as const;
