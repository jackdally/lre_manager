import React from 'react';
import { 
  MatchModal,
  LedgerEntryPanel,
  UploadTransactionMatchPanel
} from '../../../shared/MatchModal';

interface LedgerMatchModalWithSharedProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Ledger entry data
  ledgerEntry: any;
  
  // Match data
  currentTab: 'potential' | 'rejected';
  currentIndex: number;
  potentialMatches: any[];
  rejectedMatches: any[];
  
  // Actions
  onTabChange: (tab: 'potential' | 'rejected') => void;
  onIndexChange: (index: number) => void;
  onConfirm: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  onReject: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  onUndoReject: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  
  // State management
  setPotentialMatchIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setEntriesWithRejectedMatches: (set: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setToast: (toast: any) => void;
  
  // Utils
  formatCurrency: (val: any) => string;
  ledgerEntryId: string;
}

const LedgerMatchModalWithShared: React.FC<LedgerMatchModalWithSharedProps> = ({
  isOpen,
  onClose,
  ledgerEntry,
  currentTab,
  currentIndex,
  potentialMatches,
  rejectedMatches,
  onTabChange,
  onIndexChange,
  onConfirm,
  onReject,
  onUndoReject,
  setPotentialMatchIds,
  setEntriesWithRejectedMatches,
  setToast,
  formatCurrency,
  ledgerEntryId
}) => {
  // Determine current matches based on tab
  const currentMatches = currentTab === 'potential' ? potentialMatches : rejectedMatches;
  const currentMatch = currentMatches[currentIndex];

  // Action handlers
  const handleConfirm = async () => {
    if (!currentMatch || !ledgerEntryId) return;
    
    const result = await onConfirm(currentMatch.id, ledgerEntryId);
    
    if (result.success) {
      // Remove this ledger entry from potential match IDs
      setPotentialMatchIds(prev => prev.filter(id => String(id) !== String(ledgerEntryId)));
      setToast({ message: 'Match confirmed successfully.', type: 'success' });
      onClose();
    } else {
      setToast({ message: result.error || 'Failed to confirm match.', type: 'error' });
    }
  };

  const handleReject = async () => {
    if (!currentMatch || !ledgerEntryId) return;
    
    const result = await onReject(currentMatch.id, ledgerEntryId);
    
    if (result.success) {
      // Mark this ledger entry as having rejected matches
      setEntriesWithRejectedMatches(prev => new Set([...Array.from(prev), ledgerEntryId]));
      
      // If no more potential matches for this ledger entry, remove it from potential match IDs
      const newMatched = potentialMatches.filter(match => match.id !== currentMatch.id);
      if (newMatched.length === 0) {
        setPotentialMatchIds(prev => prev.filter(id => String(id) !== String(ledgerEntryId)));
      }
      
      setToast({ message: 'Match rejected.', type: 'success', undoId: currentMatch.id });
      
      // If no more potential matches, close modal
      if (newMatched.length === 0) {
        onClose();
      }
    } else {
      setToast({ message: result.error || 'Failed to reject match.', type: 'error' });
    }
  };

  const handleUndoReject = async () => {
    if (!currentMatch || !ledgerEntryId) return;
    
    const result = await onUndoReject(currentMatch.id, ledgerEntryId);
    
    if (result?.success) {
      // Refresh match IDs from backend (simplified for example)
      setEntriesWithRejectedMatches(prev => {
        const newSet = new Set(prev);
        const remainingRejectedForEntry = rejectedMatches.filter(m => 
          m.ledgerEntry?.id === ledgerEntryId && m.id !== currentMatch.id
        );
        if (remainingRejectedForEntry.length === 0) {
          newSet.delete(ledgerEntryId);
        }
        return newSet;
      });
      
      setPotentialMatchIds(prev => {
        if (!prev.includes(ledgerEntryId)) {
          return [...prev, ledgerEntryId];
        }
        return prev;
      });
      
      setToast({ message: 'Rejection undone successfully', type: 'success' });
      
      // Switch to matched tab to show the restored match
      onTabChange('potential');
      onIndexChange(0);
    } else {
      setToast({ message: result?.error || 'Failed to undo rejection', type: 'error' });
    }
  };

  // Navigation handlers
  const handlePrevious = () => {
    onIndexChange(Math.max(0, currentIndex - 1));
  };

  const handleNext = () => {
    onIndexChange(Math.min(currentMatches.length - 1, currentIndex + 1));
  };

  const handleTabChange = (tab: 'potential' | 'rejected') => {
    onTabChange(tab);
    onIndexChange(0);
  };

  // Left panel content (Ledger Entry)
  const leftPanel = ledgerEntry ? (
    <LedgerEntryPanel
      ledgerEntry={ledgerEntry}
      isRejected={false}
    />
  ) : null;

  // Right panel content (Upload Transaction)
  const rightPanel = currentMatch ? (
    <UploadTransactionMatchPanel
      transaction={currentMatch}
      isRejected={currentTab === 'rejected'}
    />
  ) : null;

  return (
    <MatchModal
      isOpen={isOpen}
      onClose={onClose}
      currentTab={currentTab}
      onTabChange={handleTabChange}
      currentIndex={currentIndex}
      totalCount={currentMatches.length}
      onPrevious={handlePrevious}
      onNext={handleNext}
      potentialCount={potentialMatches.length}
      rejectedCount={rejectedMatches.length}
      onConfirm={handleConfirm}
      onReject={handleReject}
      onUndoReject={handleUndoReject}
      formatCurrency={formatCurrency}
      title={currentMatches.length > 1 ? 'Multiple Potential Matches' : 'Potential Match'}
      subtitle="Review and confirm matches for ledger entries"
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      showSplitReForecast={false} // Ledger modal doesn't have split/re-forecast
    />
  );
};

export default LedgerMatchModalWithShared; 