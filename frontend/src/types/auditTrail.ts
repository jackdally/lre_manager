export interface LedgerAuditTrail {
  id: string;
  ledgerEntryId: string;
  action: string;
  source: string;
  userId?: string;
  sessionId?: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AuditTrailSummary {
  totalEntries: number;
  creationDate?: string;
  lastModified?: string;
  createdBy?: string;
  source: string;
  relatedEntries?: string[];
}

export type AuditSource = 
  | 'manual'
  | 'boe_allocation'
  | 'boe_push'
  | 'invoice_matching'
  | 'ledger_split'
  | 're_forecasting';

export type AuditAction = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'pushed_to_ledger'
  | 'matched_to_invoice'
  | 'split'
  | 're_forecasted'; 