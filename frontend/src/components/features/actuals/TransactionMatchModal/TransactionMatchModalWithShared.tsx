import React, { useState } from 'react';
import { ActualsUploadTransaction } from '../../../../types/actuals';
import { 
  useActualsUI, 
  useActualsSetModalTab, 
  useActualsSetModalIndex, 
  useActualsConfirmMatch, 
  useActualsRejectMatch, 
  useActualsUndoReject, 
  useActualsCloseMatchModal 
} from '../../../../store/actualsStore';
import BOEContextPanel from '../BOEContextPanel';
import LedgerSplitModal from '../../ledger/LedgerSplitModal';
import LedgerReForecastModal from '../../ledger/LedgerReForecastModal';
import { 
  MatchModal,
  UploadTransactionPanel,
  LedgerEntryPanel
} from '../../../shared/MatchModal';

interface TransactionMatchModalWithSharedProps {
  modalTransaction: ActualsUploadTransaction | null;
  ledgerEntry: any;
  modalIndex: number;
  modalTab: 'potential' | 'rejected';
  isOpen: boolean;
  potentialMatches: any[];
  rejectedMatches: any[];
  onClose: () => void;
}

const TransactionMatchModalWithShared: React.FC<TransactionMatchModalWithSharedProps> = ({
  modalTransaction,
  ledgerEntry,
  modalIndex,
  modalTab,
  isOpen,
  potentialMatches,
  rejectedMatches,
  onClose
}) => {
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showReForecastModal, setShowReForecastModal] = useState(false);
  
  const confirmMatch = useActualsConfirmMatch();
  const rejectMatch = useActualsRejectMatch();
  const undoReject = useActualsUndoReject();
  const setModalTab = useActualsSetModalTab();
  const setModalIndex = useActualsSetModalIndex();

  // Determine current matches based on tab
  const currentMatches = modalTab === 'potential' ? potentialMatches : rejectedMatches;
  const currentMatch = currentMatches[modalIndex];

  // Mismatch detection
  const hasAmountMismatch = modalTransaction && ledgerEntry && 
    Math.abs(Number(modalTransaction.amount) - Number(ledgerEntry.planned_amount)) > 0.01;
  
  const hasDateMismatch = modalTransaction && ledgerEntry && 
    modalTransaction.transactionDate !== ledgerEntry.planned_date;

  // Determine if split/re-forecast options should be shown
  const canSplit = hasAmountMismatch && Number(modalTransaction?.amount) > Number(ledgerEntry?.planned_amount);
  const canReForecast = hasAmountMismatch || hasDateMismatch;

  // Format currency helper
  const formatCurrency = (val: any) => {
    if (val == null || isNaN(Number(val))) return '--';
    return Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  // Action handlers
  const handleConfirm = async () => {
    if (!ledgerEntry) return;
    
    await confirmMatch(ledgerEntry);
    onClose();
  };

  const handleReject = async () => {
    if (!ledgerEntry) return;
    
    await rejectMatch(ledgerEntry);
    // If no more potential matches, close modal
    if (potentialMatches.length <= 1) {
      onClose();
    }
  };

  const handleUndoReject = async () => {
    if (!ledgerEntry) return;
    
    await undoReject(ledgerEntry);
    setModalTab('potential');
    setModalIndex(0);
  };

  const handleSplit = () => {
    setShowSplitModal(true);
  };

  const handleReForecast = () => {
    setShowReForecastModal(true);
  };

  // Navigation handlers
  const handlePrevious = () => {
    setModalIndex(Math.max(0, modalIndex - 1));
  };

  const handleNext = () => {
    setModalIndex(Math.min(currentMatches.length - 1, modalIndex + 1));
  };

  const handleTabChange = (tab: 'potential' | 'rejected') => {
    setModalTab(tab);
    setModalIndex(0);
  };

  // Left panel content (Upload Transaction)
  const leftPanel = modalTransaction ? (
    <UploadTransactionPanel
      transaction={modalTransaction}
      sessionFilename={modalTransaction.importSession?.id}
    />
  ) : null;

  // Right panel content (Ledger Entry)
  const rightPanel = ledgerEntry ? (
    <LedgerEntryPanel
      ledgerEntry={ledgerEntry}
      isRejected={modalTab === 'rejected'}
      hasAmountMismatch={hasAmountMismatch}
      hasDateMismatch={hasDateMismatch}
      actualAmount={modalTransaction?.amount}
      actualDate={modalTransaction?.transactionDate}
    />
  ) : null;

  // Additional content (BOE Context Panel)
  const additionalContent = ledgerEntry?.createdFromBOE && (
    <BOEContextPanel 
      ledgerEntryId={ledgerEntry.id}
      transactionAmount={Number(modalTransaction?.amount) || 0}
      isVisible={true}
    />
  );

  return (
    <>
      <MatchModal
        isOpen={isOpen}
        onClose={onClose}
        currentTab={modalTab}
        onTabChange={handleTabChange}
        currentIndex={modalIndex}
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
        plannedAmount={ledgerEntry?.planned_amount}
        actualAmount={modalTransaction?.amount}
        plannedDate={ledgerEntry?.planned_date}
        actualDate={modalTransaction?.transactionDate}
        canSplit={canSplit}
        canReForecast={canReForecast}
        showSplitReForecast={true}
        formatCurrency={formatCurrency}
        title="Transaction Match"
        subtitle={`Review and confirm matches for uploaded transactions`}
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        additionalContent={additionalContent}
      />

      {/* Split Modal */}
      {showSplitModal && modalTransaction && ledgerEntry && (
        <LedgerSplitModal
          isOpen={showSplitModal}
          onClose={() => setShowSplitModal(false)}
          ledgerEntry={ledgerEntry}
          actualTransaction={{
            amount: Number(modalTransaction.amount),
            date: modalTransaction.transactionDate,
            description: modalTransaction.description
          }}
          onSplitComplete={() => {
            setShowSplitModal(false);
            onClose();
          }}
        />
      )}

      {/* Re-forecast Modal */}
      {showReForecastModal && modalTransaction && ledgerEntry && (
        <LedgerReForecastModal
          isOpen={showReForecastModal}
          onClose={() => setShowReForecastModal(false)}
          ledgerEntry={ledgerEntry}
          actualTransaction={{
            amount: Number(modalTransaction.amount),
            date: modalTransaction.transactionDate,
            description: modalTransaction.description
          }}
          onReForecastComplete={() => {
            setShowReForecastModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
};

export default TransactionMatchModalWithShared; 