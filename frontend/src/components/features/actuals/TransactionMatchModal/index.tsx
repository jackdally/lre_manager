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

interface LedgerEntry {
  id: string;
  vendor_name?: string;
  expense_description?: string;
  planned_amount?: number;
  planned_date?: string;
  wbs_category?: string;
  wbs_subcategory?: string;
  actual_amount?: number;
  actual_date?: string;
  notes?: string;
  invoice_link_text?: string;
  invoice_link_url?: string;
  [key: string]: any;
}

interface TransactionMatchModalProps {
  sessionFilename?: string;
}

const TransactionMatchModal: React.FC<TransactionMatchModalProps> = ({
  sessionFilename,
}) => {
  // Local state for split/re-forecast modals
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showReForecastModal, setShowReForecastModal] = useState(false);

  // Get state from store
  const ui = useActualsUI();
  const setModalTab = useActualsSetModalTab();
  const setModalIndex = useActualsSetModalIndex();
  const confirmMatch = useActualsConfirmMatch();
  const rejectMatch = useActualsRejectMatch();
  const undoReject = useActualsUndoReject();
  const closeMatchModal = useActualsCloseMatchModal();

  const {
    showMatchModal,
    modalTransaction,
    modalPotentialMatches,
    modalRejectedMatches,
    modalCurrentTab,
    modalCurrentIndex
  } = ui;

  // Filter out replaced entries
  const filteredPotentialLedgerEntries = modalPotentialMatches.filter((entry: LedgerEntry) => entry.status !== 'replaced');
  const filteredRejectedLedgerEntries = modalRejectedMatches.filter((entry: LedgerEntry) => entry.status !== 'replaced');

  // Use filtered arrays for tab logic
  const ledgerEntries = modalCurrentTab === 'potential' ? filteredPotentialLedgerEntries : filteredRejectedLedgerEntries;
  const ledgerEntry = ledgerEntries[modalCurrentIndex];
  const total = ledgerEntries.length;

  // Mismatch detection
  const hasAmountMismatch = ledgerEntry && modalTransaction && 
    Math.abs((modalTransaction.amount || 0) - (ledgerEntry.planned_amount || 0)) > 0.01;
  
  const hasDateMismatch = ledgerEntry && modalTransaction && 
    modalTransaction.transactionDate !== ledgerEntry.planned_date;
  
  const canSplit = ledgerEntry && modalTransaction && hasAmountMismatch && 
    (modalTransaction.amount || 0) < (ledgerEntry.planned_amount || 0);
  
  const canReForecast = ledgerEntry && modalTransaction && (hasAmountMismatch || hasDateMismatch);

  // Handlers
  const handlePrev = () => setModalIndex(Math.max(0, modalCurrentIndex - 1));
  const handleNext = () => setModalIndex(Math.min(total - 1, modalCurrentIndex + 1));
  const handleTab = (tab: 'potential' | 'rejected') => setModalTab(tab);
  const handleConfirm = async () => {
    if (ledgerEntry) {
      await confirmMatch(ledgerEntry);
    }
  };
  const handleReject = async () => {
    if (ledgerEntry) {
      await rejectMatch(ledgerEntry);
    }
  };
  const handleUndoReject = async () => {
    if (ledgerEntry) {
      await undoReject(ledgerEntry);
    }
  };
  const handleSplit = () => {
    setShowSplitModal(true);
  };
  const handleReForecast = () => {
    setShowReForecastModal(true);
  };
  const handleSplitComplete = () => {
    setShowSplitModal(false);
    closeMatchModal();
  };
  const handleReForecastComplete = () => {
    setShowReForecastModal(false);
    closeMatchModal();
  };

  const formatCurrency = (val: number | string | undefined | null) => {
    if (val == null || isNaN(Number(val))) return '--';
    return Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  // Left panel content (Upload Transaction)
  const leftPanel = modalTransaction ? (
    <UploadTransactionPanel
      transaction={modalTransaction}
      sessionFilename={sessionFilename}
    />
  ) : null;

  // Right panel content (Ledger Entry)
  const rightPanel = ledgerEntry ? (
    <LedgerEntryPanel
      ledgerEntry={ledgerEntry}
      isRejected={modalCurrentTab === 'rejected'}
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
        isOpen={showMatchModal}
        onClose={closeMatchModal}
        currentTab={modalCurrentTab}
        onTabChange={handleTab}
        currentIndex={modalCurrentIndex}
        totalCount={total}
        onPrevious={handlePrev}
        onNext={handleNext}
        potentialCount={filteredPotentialLedgerEntries.length}
        rejectedCount={filteredRejectedLedgerEntries.length}
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
        title="Transaction Matching"
        subtitle="Review and confirm matches between uploaded transactions and ledger entries"
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
          onSplitComplete={handleSplitComplete}
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
          onReForecastComplete={handleReForecastComplete}
        />
      )}
    </>
  );
};

export default TransactionMatchModal; 