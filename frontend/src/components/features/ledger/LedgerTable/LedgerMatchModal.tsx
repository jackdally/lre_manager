import React, { useState } from 'react';
import {
  MatchModal,
  LedgerEntryPanel,
  UploadTransactionMatchPanel
} from '../../../shared/MatchModal';
import BOEContextPanel from '../../actuals/BOEContextPanel';
import AllocationTransactionAdjustmentModal from '../../../shared/AllocationTransactionAdjustmentModal';
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
  // Local state for unified adjustment modal
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

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
      setToast({ message: result?.error || 'Failed to confirm match', type: 'error' });
    }
  };

  const handleReject = async () => {
    if (!currentMatch || !ledgerEntryId) return;

    const result = await onReject(currentMatch.id, ledgerEntryId);

    if (result.success) {
      // Move from potential to rejected
      setPotentialMatched(prev => prev.filter(match => match.id !== currentMatch.id));
      setPotentialRejected(prev => [...prev, { ...currentMatch, status: 'rejected' }]);

      // Add to rejected matches set
      setEntriesWithRejectedMatches(prev => new Set([...Array.from(prev), ledgerEntryId]));

      setToast({ message: 'Match rejected successfully.', type: 'success' });

      // Switch to rejected tab and reset index
      onTabChange('rejected');
      onIndexChange(0);
    } else {
      setToast({ message: result?.error || 'Failed to reject match', type: 'error' });
    }
  };

  const handleUndoReject = async () => {
    if (!currentMatch || !ledgerEntryId) return;

    const result = await onUndoReject(currentMatch.id, ledgerEntryId);

    if (result.success) {
      // Move from rejected back to potential
      setPotentialRejected(prev => prev.filter(match => match.id !== currentMatch.id));
      setPotentialMatched(prev => [...prev, { ...currentMatch, status: 'potential' }]);

      // Remove from rejected matches set
      setEntriesWithRejectedMatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(ledgerEntryId);
        return newSet;
      });

      setToast({ message: 'Rejection undone successfully.', type: 'success' });

      // Switch back to matched tab and reset index
      onTabChange('matched');
      onIndexChange(0);
    } else {
      setToast({ message: result?.error || 'Failed to undo rejection', type: 'error' });
    }
  };

  // Unified adjustment handler - replaces both split and re-forecast
  const handleAdjustment = () => {
    setShowAdjustmentModal(true);
  };

  const handleAdjustmentComplete = () => {
    setShowAdjustmentModal(false);

    // Remove this ledger entry from potential match IDs (same as handleConfirm)
    if (ledgerEntryId) {
      setPotentialMatchIds(prev => prev.filter(id => String(id) !== String(ledgerEntryId)));
    }

    setToast({ message: 'Match confirmed and adjustment applied successfully.', type: 'success' });
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
        onSplit={handleAdjustment}
        onReForecast={handleAdjustment}
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

      {/* Unified Adjustment Modal */}
      {showAdjustmentModal && currentMatch && ledgerEntry && (
        <AllocationTransactionAdjustmentModal
          isOpen={showAdjustmentModal}
          onClose={() => setShowAdjustmentModal(false)}
          ledgerEntry={ledgerEntry}
          actualTransaction={{
            amount: Number(currentMatch.amount),
            date: currentMatch.transactionDate,
            description: currentMatch.description
          }}
          transactionId={currentMatch.id}
          onAdjustmentComplete={handleAdjustmentComplete}
        />
      )}
    </>
  );
};

export default LedgerMatchModal; 