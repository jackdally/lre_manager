import { useState, useCallback } from 'react';
import { PotentialMatchData, RejectedMatchData } from '../types/actuals';

interface UsePotentialMatchModalReturn {
  // Modal state
  isOpen: boolean;
  currentTab: 'matched' | 'rejected';
  currentIndex: number;
  ledgerEntryId: string | null;
  
  // Data state
  potentialMatches: PotentialMatchData[];
  rejectedMatches: RejectedMatchData[];
  isLoading: boolean;
  
  // Actions
  openModal: (ledgerEntryId: string) => Promise<void>;
  closeModal: () => void;
  switchTab: (tab: 'matched' | 'rejected') => void;
  setIndex: (index: number) => void;
  refreshData: () => Promise<void>;
  
  // New actions for state management
  confirmMatch: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  rejectMatch: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  undoReject: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  
  // State setters for immediate updates
  setPotentialMatches: (matches: PotentialMatchData[] | ((prev: PotentialMatchData[]) => PotentialMatchData[])) => void;
  setRejectedMatches: (matches: RejectedMatchData[] | ((prev: RejectedMatchData[]) => RejectedMatchData[])) => void;
  
  // Computed values
  currentMatches: PotentialMatchData[] | RejectedMatchData[];
  hasMatches: boolean;
  totalMatches: number;
}

export const usePotentialMatchModal = (programId: string): UsePotentialMatchModalReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'matched' | 'rejected'>('matched');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ledgerEntryId, setLedgerEntryId] = useState<string | null>(null);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatchData[]>([]);
  const [rejectedMatches, setRejectedMatches] = useState<RejectedMatchData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Computed values
  const currentMatches = currentTab === 'matched' ? potentialMatches : rejectedMatches;
  const hasMatches = currentMatches.length > 0;
  const totalMatches = currentMatches.length;

  const openModal = useCallback(async (entryId: string) => {
    setIsOpen(true);
    setLedgerEntryId(entryId);
    setCurrentTab('matched');
    setCurrentIndex(0);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/programs/${programId}/ledger/${entryId}/potential-matches`);
      if (!response.ok) {
        throw new Error(`Failed to fetch potential matches: ${response.status}`);
      }
      
      const data = await response.json();
      setPotentialMatches(data.matched || []);
      setRejectedMatches(data.rejected || []);
      
      // Auto-switch to rejected tab if no potential matches but there are rejected matches
      if (data.matched?.length === 0 && data.rejected?.length > 0) {
        setCurrentTab('rejected');
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Failed to load potential matches:', error);
      setPotentialMatches([]);
      setRejectedMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [programId]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setLedgerEntryId(null);
    setCurrentTab('matched');
    setCurrentIndex(0);
    setPotentialMatches([]);
    setRejectedMatches([]);
  }, []);

  const switchTab = useCallback((tab: 'matched' | 'rejected') => {
    setCurrentTab(tab);
    setCurrentIndex(0);
  }, []);

  const setIndex = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, totalMatches - 1)));
  }, [totalMatches]);

  const refreshData = useCallback(async () => {
    if (!ledgerEntryId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/programs/${programId}/ledger/${ledgerEntryId}/potential-matches`);
      if (response.ok) {
        const data = await response.json();
        setPotentialMatches(data.matched || []);
        setRejectedMatches(data.rejected || []);
      }
    } catch (error) {
      console.error('Failed to refresh potential matches:', error);
    } finally {
      setIsLoading(false);
    }
  }, [programId, ledgerEntryId]);

  // New action methods
  const confirmMatch = useCallback(async (transactionId: string, ledgerEntryId: string) => {
    try {
      const response = await fetch(`/api/import/transaction/${transactionId}/confirm-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledgerEntryId }),
      });
      
      if (response.ok) {
        // Remove all potential matches for this ledger entry
        setPotentialMatches(prev => prev.filter(match => 
          match.ledgerEntry?.id !== ledgerEntryId
        ));
        
        // Close modal after successful confirmation
        closeModal();
        
        return { success: true };
      } else {
        const error = await response.text();
        console.error('Confirm match error:', error);
        return { success: false, error: 'Failed to confirm match.' };
      }
    } catch (error) {
      console.error('Confirm match exception:', error);
      return { success: false, error: 'Failed to confirm match.' };
    }
  }, [closeModal]);

  const rejectMatch = useCallback(async (transactionId: string, ledgerEntryId: string) => {
    try {
      const response = await fetch(`/api/import/transaction/${transactionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledgerEntryId })
      });
      
      if (response.ok) {
        const rejectedMatch = potentialMatches.find(match => match.id === transactionId);
        if (rejectedMatch) {
          // Remove from potential matches
          setPotentialMatches(prev => prev.filter(match => match.id !== transactionId));
          
          // Add to rejected matches
          setRejectedMatches(prev => [...prev, { ...rejectedMatch, status: 'rejected' } as RejectedMatchData]);
          
          // Adjust index if needed
          const newPotentialMatches = potentialMatches.filter(match => match.id !== transactionId);
          if (newPotentialMatches.length === 0) {
            // No more potential matches, close modal
            closeModal();
          } else {
            // Adjust index if we're at the end
            setCurrentIndex(prev => Math.min(prev, newPotentialMatches.length - 1));
          }
        }
        
        return { success: true };
      } else {
        return { success: false, error: 'Failed to reject match.' };
      }
    } catch (error) {
      console.error('Reject match exception:', error);
      return { success: false, error: 'Failed to reject match.' };
    }
  }, [potentialMatches, closeModal]);

  const undoReject = useCallback(async (transactionId: string, ledgerEntryId: string) => {
    try {
      const response = await fetch(`/api/import/transaction/${transactionId}/undo-reject`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledgerEntryId })
      });
      
      if (response.ok) {
        const undoneMatch = rejectedMatches.find(match => match.id === transactionId);
        if (undoneMatch) {
          // Remove from rejected matches
          setRejectedMatches(prev => prev.filter(match => match.id !== transactionId));
          
          // Add back to potential matches
          setPotentialMatches(prev => [...prev, { ...undoneMatch, status: 'potential' } as PotentialMatchData]);
          
          // Switch to matched tab and reset index
          setCurrentTab('matched');
          setCurrentIndex(0);
        }
        
        return { success: true };
      } else {
        return { success: false, error: 'Failed to undo rejection.' };
      }
    } catch (error) {
      console.error('Undo reject exception:', error);
      return { success: false, error: 'Failed to undo rejection.' };
    }
  }, [rejectedMatches]);

  return {
    isOpen,
    currentTab,
    currentIndex,
    ledgerEntryId,
    potentialMatches,
    rejectedMatches,
    isLoading,
    openModal,
    closeModal,
    switchTab,
    setIndex,
    refreshData,
    confirmMatch,
    rejectMatch,
    undoReject,
    setPotentialMatches,
    setRejectedMatches,
    currentMatches,
    hasMatches,
    totalMatches,
  };
}; 