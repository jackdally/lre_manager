import { useState } from 'react';
import { ActualsUploadTransaction } from '../types/actuals';

export const useActualsTransactions = () => {
  const [potentialMatchesMap, setPotentialMatchesMap] = useState<{ [transactionId: string]: any[] }>({});
  const [rejectedLedgerEntries, setRejectedLedgerEntries] = useState<any[]>([]);

  const confirmMatch = async (transactionId: string, ledgerEntryId: string) => {
    try {
      const response = await fetch(`/api/import/transaction/${transactionId}/confirm-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ledgerEntryId }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Failed to confirm match:', err);
      throw err;
    }
  };

  const addToLedger = async (transactionId: string, wbsElementId: string) => {
    try {
      const response = await fetch(`/api/import/transaction/${transactionId}/add-to-ledger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wbsElementId }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Failed to add to ledger:', err);
      throw err;
    }
  };

  const handleReviewMatch = async (transaction: ActualsUploadTransaction, matches: any[]) => {
    try {
      const [matchesRes, rejectedRes] = await Promise.all([
        fetch(`/api/import/transaction/${transaction.id}/potential-matches`),
        fetch(`/api/import/transaction/${transaction.id}/rejected-ledger-entries`)
      ]);

      if (!matchesRes.ok) {
        throw new Error(`Failed to fetch potential matches: ${matchesRes.status} ${matchesRes.statusText}`);
      }
      
      if (!rejectedRes.ok) {
        throw new Error(`Failed to fetch rejected entries: ${rejectedRes.status} ${rejectedRes.statusText}`);
      }

      const potentialMatches = await matchesRes.json();
      const rejected = await rejectedRes.json();
      
      setPotentialMatchesMap(prev => ({ ...prev, [transaction.id]: potentialMatches }));
      setRejectedLedgerEntries(rejected);
      
      return { potentialMatches, rejected };
    } catch (err) {
      console.error('Failed to load match data:', err);
      // Set empty arrays on error to prevent UI issues
      setPotentialMatchesMap(prev => ({ ...prev, [transaction.id]: [] }));
      setRejectedLedgerEntries([]);
      throw err;
    }
  };

  const handleModalConfirm = async (modalTransaction: ActualsUploadTransaction, modalMatch: any) => {
    try {
      await confirmMatch(modalTransaction.id, modalMatch.id);
      
      // Refresh potential matches and rejected entries
      const [matchesRes, rejectedRes] = await Promise.all([
        fetch(`/api/import/transaction/${modalTransaction.id}/potential-matches`),
        fetch(`/api/import/transaction/${modalTransaction.id}/rejected-ledger-entries`)
      ]);

      if (matchesRes.ok && rejectedRes.ok) {
        const potentialMatches = await matchesRes.json();
        const rejected = await rejectedRes.json();
        
        setPotentialMatchesMap(prev => ({ ...prev, [modalTransaction.id]: potentialMatches }));
        setRejectedLedgerEntries(rejected);
      }
    } catch (err) {
      console.error('Failed to confirm match:', err);
      throw err;
    }
  };

  const handleModalReject = async (modalTransaction: ActualsUploadTransaction, ledgerEntry: any) => {
    try {
      await fetch(`/api/import/transaction/${modalTransaction.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ledgerEntryId: ledgerEntry.id }),
      });

      // Refresh potential matches and rejected entries
      const [matchesRes, rejectedRes] = await Promise.all([
        fetch(`/api/import/transaction/${modalTransaction.id}/potential-matches`),
        fetch(`/api/import/transaction/${modalTransaction.id}/rejected-ledger-entries`)
      ]);

      if (matchesRes.ok && rejectedRes.ok) {
        const potentialMatches = await matchesRes.json();
        const rejected = await rejectedRes.json();
        
        setPotentialMatchesMap(prev => ({ ...prev, [modalTransaction.id]: potentialMatches }));
        setRejectedLedgerEntries(rejected);
      }
    } catch (err) {
      console.error('Failed to reject match:', err);
      throw err;
    }
  };

  const handleModalUndoReject = async (modalTransaction: ActualsUploadTransaction, ledgerEntry: any) => {
    try {
      await fetch(`/api/import/transaction/${modalTransaction.id}/undo-reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ledgerEntryId: ledgerEntry.id }),
      });

      // Refresh potential matches and rejected entries
      const [matchesRes, rejectedRes] = await Promise.all([
        fetch(`/api/import/transaction/${modalTransaction.id}/potential-matches`),
        fetch(`/api/import/transaction/${modalTransaction.id}/rejected-ledger-entries`)
      ]);

      if (matchesRes.ok && rejectedRes.ok) {
        const potentialMatches = await matchesRes.json();
        const rejected = await rejectedRes.json();
        
        setPotentialMatchesMap(prev => ({ ...prev, [modalTransaction.id]: potentialMatches }));
        setRejectedLedgerEntries(rejected);
      }
    } catch (err) {
      console.error('Failed to undo reject:', err);
      throw err;
    }
  };

  const fetchBatchData = async (transactions: ActualsUploadTransaction[]) => {
    try {
      const [potentialMatchesRes, rejectedMatchesRes] = await Promise.all([
        fetch('/api/import/transactions/potential-matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionIds: transactions.map(t => t.id)
          }),
        }),
        fetch('/api/import/transactions/rejected-ledger-entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionIds: transactions.map(t => t.id)
          }),
        })
      ]);

      if (potentialMatchesRes.ok && rejectedMatchesRes.ok) {
        const potentialMatches = await potentialMatchesRes.json();
        const rejectedMatches = await rejectedMatchesRes.json();
        
        const newPotentialMatchesMap: { [transactionId: string]: any[] } = {};
        transactions.forEach(transaction => {
          newPotentialMatchesMap[transaction.id] = potentialMatches[transaction.id] || [];
        });
        
        setPotentialMatchesMap(prev => ({ ...prev, ...newPotentialMatchesMap }));
        return { potentialMatches, rejectedMatches };
      }
    } catch (err) {
      console.error('Failed to fetch batch data:', err);
      throw err;
    }
  };

  const handleIgnoreDuplicate = async (transactionId: string) => {
    try {
      await fetch(`/api/import/transaction/${transactionId}/ignore-duplicate`, { 
        method: 'POST' 
      });
    } catch (err) {
      console.error('Failed to ignore duplicate:', err);
      throw err;
    }
  };

  const handleRejectDuplicate = async (transactionId: string) => {
    try {
      await fetch(`/api/import/transaction/${transactionId}/reject-duplicate`, { 
        method: 'POST' 
      });
    } catch (err) {
      console.error('Failed to reject duplicate:', err);
      throw err;
    }
  };

  const handleAcceptAndReplaceOriginal = async (transactionId: string, duplicateOfId: string | null | undefined) => {
    try {
      await fetch(`/api/import/transaction/${transactionId}/accept-replace-original`, { 
        method: 'POST' 
      });
    } catch (err) {
      console.error('Failed to accept and replace original:', err);
      throw err;
    }
  };

  const handleForceSmartMatching = async (programId: string) => {
    try {
      const response = await fetch(`/api/import/${programId}/force-smart-matching`, { 
        method: 'POST' 
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Failed to force smart matching:', err);
      throw err;
    }
  };

  const cancelSession = async (sessionId: string) => {
    try {
      await fetch(`/api/import/session/${sessionId}/cancel`, { 
        method: 'POST' 
      });
    } catch (err) {
      console.error('Failed to cancel session:', err);
      throw err;
    }
  };

  return {
    potentialMatchesMap,
    setPotentialMatchesMap,
    rejectedLedgerEntries,
    setRejectedLedgerEntries,
    confirmMatch,
    addToLedger,
    handleReviewMatch,
    handleModalConfirm,
    handleModalReject,
    handleModalUndoReject,
    fetchBatchData,
    handleIgnoreDuplicate,
    handleRejectDuplicate,
    handleAcceptAndReplaceOriginal,
    handleForceSmartMatching,
    cancelSession
  };
}; 