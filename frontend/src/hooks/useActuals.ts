import { useState, useEffect } from 'react';

interface ImportConfig {
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

interface SavedConfig {
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

interface ImportSession {
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

interface ImportTransaction {
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

interface Program {
  id: string;
  code: string;
  name: string;
  description: string;
}

export const useActuals = (programId: string) => {
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ImportSession | null>(null);
  const [transactions, setTransactions] = useState<ImportTransaction[]>([]);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionMatchCounts, setSessionMatchCounts] = useState<Record<string, { matched: number; unmatched: number; duplicates: number; allDispositioned: boolean }>>({});

  const loadSessions = async () => {
    try {
      const response = await fetch(`/api/import/${programId}/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const loadSavedConfigs = async () => {
    try {
      const response = await fetch(`/api/import/${programId}/config`);
      if (response.ok) {
        const data = await response.json();
        setSavedConfigs(data);
      }
    } catch (err) {
      console.error('Failed to load saved configs:', err);
    }
  };

  const loadPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (err) {
      console.error('Failed to load programs:', err);
    }
  };

  const loadSessionDetails = async (sessionId: string) => {
    try {
      setLoading(true);
      const [sessionResponse, transactionsResponse] = await Promise.all([
        fetch(`/api/import/session/${sessionId}`),
        fetch(`/api/import/session/${sessionId}/transactions`)
      ]);

      if (sessionResponse.ok && transactionsResponse.ok) {
        const sessionData = await sessionResponse.json();
        const transactionsData = await transactionsResponse.json();
        
        setCurrentSession(sessionData);
        setTransactions(transactionsData);
      }
    } catch (err) {
      console.error('Failed to load session details:', err);
      setError('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionTransactionCounts = async (sessionId: string): Promise<{ matched: number; unmatched: number; duplicates: number; allDispositioned: boolean }> => {
    try {
      const response = await fetch(`/api/import/session/${sessionId}/transactions`);
      if (response.ok) {
        const transactions = await response.json();
        let matched = 0;
        let unmatched = 0;
        let duplicates = 0;
        
        transactions.forEach((tx: ImportTransaction) => {
          if (tx.duplicateType && tx.duplicateType !== 'none') {
            duplicates++;
          } else if (tx.status === 'matched' || tx.status === 'confirmed' || tx.status === 'added_to_ledger') {
            matched++;
          } else if (tx.status === 'unmatched') {
            unmatched++;
          }
        });
        
        const allDispositioned = transactions.every((tx: ImportTransaction) => 
          tx.status !== 'unmatched' || (tx.duplicateType && tx.duplicateType !== 'none')
        );
        
        return { matched, unmatched, duplicates, allDispositioned };
      }
    } catch {
      // Ignore errors for this function
    }
    return { matched: 0, unmatched: 0, duplicates: 0, allDispositioned: false };
  };

  const updateSessionMatchCounts = async (sessionId: string) => {
    const counts = await fetchSessionTransactionCounts(sessionId);
    setSessionMatchCounts(prev => ({ ...prev, [sessionId]: counts }));
  };

  useEffect(() => {
    if (programId) {
      loadSessions();
      loadSavedConfigs();
      loadPrograms();
    }
  }, [programId]);

  return {
    sessions,
    currentSession,
    transactions,
    savedConfigs,
    programs,
    loading,
    error,
    sessionMatchCounts,
    loadSessions,
    loadSavedConfigs,
    loadPrograms,
    loadSessionDetails,
    updateSessionMatchCounts,
    setCurrentSession,
    setTransactions,
    setError
  };
}; 