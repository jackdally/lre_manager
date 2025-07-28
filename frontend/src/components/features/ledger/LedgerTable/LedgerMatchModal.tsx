import React, { useState } from 'react';
import { 
  MatchModal,
  LedgerEntryPanel,
  UploadTransactionMatchPanel
} from '../../../shared/MatchModal';
import BOEContextPanel from '../../actuals/BOEContextPanel';
import LedgerSplitModal from '../LedgerSplitModal';
import LedgerReForecastModal from '../LedgerReForecastModal';
import type { LedgerEntry } from '../../../../types/ledger';
import type { PotentialMatchData, RejectedMatchData } from '../../../../types/actuals';

interface LedgerMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Ledger entry data
  ledgerEntry: LedgerEntry | null;
  
  // Match data
  currentTab: 'matched' | 'rejected'; // Use the actual tab type from Table component
  currentIndex: number;
  potentialMatches: PotentialMatchData[];
  rejectedMatches: RejectedMatchData[];
  
  // Actions
  onTabChange: (tab: 'matched' | 'rejected') => void; // Use the actual tab type
  onIndexChange: (index: number) => void;
  onConfirm: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  onReject: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  onUndoReject: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  
  // State management - CRITICAL: Preserve all state update functions
  setPotentialMatchIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setEntriesWithRejectedMatches: (set: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setPotentialMatched: (matches: PotentialMatchData[] | ((prev: PotentialMatchData[]) => PotentialMatchData[])) => void;
  setPotentialRejected: (matches: RejectedMatchData[] | ((prev: RejectedMatchData[]) => RejectedMatchData[])) => void;
  
  // State setters
  setToast: (toast: any) => void;
  
  // Utils
  formatCurrency: (val: any) => string;
  ledgerEntryId: string;
  programId: string;
}

const LedgerMatchModal: React.FC<LedgerMatchModalProps> = ({
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
  setPotentialMatched,
  setPotentialRejected,
  setToast,
  formatCurrency,
  ledgerEntryId,
  programId
}) => {
  // Local state for split/re-forecast modals
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showReForecastModal, setShowReForecastModal] = useState(false);

  // Determine current matches based on tab
  const currentMatches = currentTab === 'matched' ? potentialMatches : rejectedMatches;
  const currentMatch = currentMatches[currentIndex];

  // Mismatch detection (similar to TransactionMatchModal)
  const hasAmountMismatch = !!(ledgerEntry && currentMatch && 
    Math.abs((currentMatch.amount || 0) - (ledgerEntry.planned_amount || 0)) > 0.01);
  
  const hasDateMismatch = !!(ledgerEntry && currentMatch && 
    currentMatch.transactionDate !== ledgerEntry.planned_date);
  
  const canSplit = !!(ledgerEntry && currentMatch && hasAmountMismatch && 
    (currentMatch.amount || 0) < (ledgerEntry.planned_amount || 0));
  
  const canReForecast = !!(ledgerEntry && currentMatch && (hasAmountMismatch || hasDateMismatch));

  // Action handlers - PRESERVE: All atomic state updates from original implementation
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
      const rejectedMatch = currentMatch;
      
      // Mark this ledger entry as having rejected matches
      setEntriesWithRejectedMatches(prev => new Set([...Array.from(prev), ledgerEntryId]));
      
      // If no more potential matches for this ledger entry, remove it from potential match IDs
      const newMatched = potentialMatches.filter(match => match.id !== rejectedMatch.id);
      if (newMatched.length === 0) {
        setPotentialMatchIds(prev => prev.filter(id => String(id) !== String(ledgerEntryId)));
      }
      
      setToast({ message: 'Match rejected.', type: 'success', undoId: rejectedMatch.id });
      
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
      // PRESERVE: Atomic state updates from original implementation
      try {
        const [potentialRes, rejectedRes] = await Promise.all([
          fetch(`/api/programs/${programId}/ledger/potential-match-ids`),
          fetch(`/api/programs/${programId}/ledger/rejected-match-ids`)
        ]);
        
        if (potentialRes.ok && rejectedRes.ok) {
          const potentialIds = await potentialRes.json();
          const rejectedIds = await rejectedRes.json();
          
          // Update both states atomically with fresh data from backend
          setPotentialMatchIds(potentialIds);
          setEntriesWithRejectedMatches(new Set(rejectedIds));
        }
      } catch (error) {
        console.error('Failed to refresh match IDs after undo:', error);
        // PRESERVE: Fallback to local state updates if API calls fail
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
      }
      
      setToast({ message: 'Rejection undone successfully', type: 'success' });
      
      // Switch to matched tab to show the restored match
      onTabChange('matched');
      onIndexChange(0);
    } else {
      setToast({ message: result?.error || 'Failed to undo rejection', type: 'error' });
    }
  };

  // Split and Re-forecast handlers
  const handleSplit = () => {
    setShowSplitModal(true);
  };

  const handleReForecast = () => {
    setShowReForecastModal(true);
  };

  const handleSplitComplete = () => {
    setShowSplitModal(false);
    onClose();
  };

  const handleReForecastComplete = () => {
    setShowReForecastModal(false);
    onClose();
  };

  // Navigation handlers
  const handlePrevious = () => {
    onIndexChange(Math.max(0, currentIndex - 1));
  };

  const handleNext = () => {
    onIndexChange(Math.min(currentMatches.length - 1, currentIndex + 1));
  };

  const handleTabChange = (tab: 'potential' | 'rejected') => {
    // Map 'potential' to 'matched' for the Table component
    onTabChange(tab === 'potential' ? 'matched' : 'rejected');
    onIndexChange(0);
  };

  // Left panel content (Ledger Entry)
  const leftPanel = ledgerEntry ? (
    <LedgerEntryPanel
      ledgerEntry={ledgerEntry}
      isRejected={false}
      hasAmountMismatch={hasAmountMismatch}
      hasDateMismatch={hasDateMismatch}
      actualAmount={currentMatch?.amount}
      actualDate={currentMatch?.transactionDate}
    />
  ) : null;

  // Right panel content (Upload Transaction)
  const rightPanel = currentMatch ? (
    <UploadTransactionMatchPanel
      transaction={currentMatch}
      isRejected={currentTab === 'rejected'}
    />
  ) : null;

  // Additional content (BOE Context Panel)
  const additionalContent = ledgerEntry?.createdFromBOE && (
    <BOEContextPanel 
      ledgerEntryId={ledgerEntry.id}
      transactionAmount={Number(currentMatch?.amount) || 0}
      isVisible={true}
    />
  );

  return (
    <>
      <MatchModal
        isOpen={isOpen}
        onClose={onClose}
        currentTab={currentTab === 'matched' ? 'potential' : 'rejected'} // Map to shared component's expected type
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
        onSplit={handleSplit}
        onReForecast={handleReForecast}
        hasAmountMismatch={hasAmountMismatch}
        hasDateMismatch={hasDateMismatch}
        plannedAmount={ledgerEntry?.planned_amount || undefined}
        actualAmount={currentMatch?.amount}
        plannedDate={ledgerEntry?.planned_date || undefined}
        actualDate={currentMatch?.transactionDate}
        canSplit={canSplit}
        canReForecast={canReForecast}
        showSplitReForecast={true}
        formatCurrency={formatCurrency}
        title={currentMatches.length > 1 ? 'Multiple Potential Matches' : 'Potential Match'}
        subtitle="Review and confirm matches for ledger entries"
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        additionalContent={additionalContent}
      />

      {/* Split Modal */}
      {showSplitModal && currentMatch && ledgerEntry && (
        <LedgerSplitModal
          isOpen={showSplitModal}
          onClose={() => setShowSplitModal(false)}
          ledgerEntry={ledgerEntry}
          actualTransaction={{
            amount: Number(currentMatch.amount),
            date: currentMatch.transactionDate,
            description: currentMatch.description
          }}
          onSplitComplete={handleSplitComplete}
        />
      )}

      {/* Re-forecast Modal */}
      {showReForecastModal && currentMatch && ledgerEntry && (
        <LedgerReForecastModal
          isOpen={showReForecastModal}
          onClose={() => setShowReForecastModal(false)}
          ledgerEntry={ledgerEntry}
          actualTransaction={{
            amount: Number(currentMatch.amount),
            date: currentMatch.transactionDate,
            description: currentMatch.description
          }}
          onReForecastComplete={handleReForecastComplete}
        />
      )}
    </>
  );
};

export default LedgerMatchModal; 