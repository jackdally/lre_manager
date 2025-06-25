import { useState, useEffect } from 'react';
import { ImportSession, ImportTransaction, SavedConfig, Program } from '../types/actuals';

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