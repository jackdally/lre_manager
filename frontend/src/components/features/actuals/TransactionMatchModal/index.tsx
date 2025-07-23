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
    // Refresh the matching data
    // This will be handled by the store when we implement the refresh logic
  };
  
  const handleReForecastComplete = () => {
    setShowReForecastModal(false);
    // Refresh the matching data
    // This will be handled by the store when we implement the refresh logic
  };

  // Helper for formatting
  const formatCurrency = (val: number | string | undefined | null) => {
    if (val == null || isNaN(Number(val))) return '--';
    return Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  if (!showMatchModal || !modalTransaction) return null;

  const matchConfidence = (modalTransaction.matchConfidence ?? 0) * 100;
  let confidenceColor = 'text-gray-500';
  if (matchConfidence >= 80) confidenceColor = 'text-green-600';
  else if (matchConfidence >= 60) confidenceColor = 'text-yellow-600';
  else confidenceColor = 'text-red-600';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full min-w-[340px] relative border-2 border-blue-200 flex flex-col md:flex-row gap-8">
        {/* Close button */}
        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold" onClick={closeMatchModal} aria-label="Close">&times;</button>
        {/* Left: Potential Match */}
        <div className="flex-1 bg-blue-50 rounded-lg p-6 border border-blue-200 min-w-[260px]">
          <h3 className="text-lg font-bold text-blue-700 mb-2">Potential Upload Match</h3>
          <div className="mb-2 text-base"><b className="text-gray-600">Vendor:</b> <span className="text-gray-900">{modalTransaction.vendorName}</span></div>
          <div className="mb-2 text-base"><b className="text-gray-600">Description:</b> <span className="text-gray-900">{modalTransaction.description}</span></div>
          <div className="mb-2 text-base"><b className="text-gray-600">Amount:</b> <span className="text-blue-700 font-semibold">{formatCurrency(modalTransaction.amount)}</span></div>
          <div className="mb-2 text-base"><b className="text-gray-600">Date:</b> <span className="text-gray-900">{modalTransaction.transactionDate}</span></div>
          {modalTransaction.category && <div className="mb-2 text-base"><b className="text-gray-600">Category:</b> <span className="text-gray-900">{modalTransaction.category}</span></div>}
          {modalTransaction.subcategory && <div className="mb-2 text-base"><b className="text-gray-600">Subcategory:</b> <span className="text-gray-900">{modalTransaction.subcategory}</span></div>}
          {modalTransaction.invoiceNumber && (
            <div className="mb-2 text-base">
              <b className="text-gray-600">Invoice Number:</b>
              {modalTransaction.referenceNumber && modalTransaction.referenceNumber.startsWith('http') ? (
                <a
                  href={modalTransaction.referenceNumber}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline ml-1"
                >
                  {modalTransaction.invoiceNumber}
                </a>
              ) : (
                <span className="text-gray-900 ml-1">{modalTransaction.invoiceNumber}</span>
              )}
            </div>
          )}
          {modalTransaction.status && <div className="mb-2 text-base"><b className="text-gray-600">Status:</b> <span className="text-gray-900">{modalTransaction.status}</span></div>}
          {sessionFilename && <div className="mb-2 text-base"><b className="text-gray-600">Upload Session:</b> <span className="text-gray-900">{sessionFilename}</span></div>}
          <div className="mb-2 text-base font-semibold">Match Confidence: <span className={`font-bold ${confidenceColor}`}>{matchConfidence.toFixed(1)}%</span></div>
        </div>
        {/* Right: Ledger Entry with Tabs */}
        <div className="flex-1 min-w-[260px]">
          <div className="flex gap-4 mb-4 border-b border-blue-200">
            <button
              className={`px-4 py-2 font-bold border-b-2 transition ${modalCurrentTab === 'potential' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
              onClick={() => handleTab('potential')}
            >
              Potential Matches
            </button>
            <button
              className={`px-4 py-2 font-bold border-b-2 transition ${modalCurrentTab === 'rejected' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
              onClick={() => handleTab('rejected')}
            >
              Rejected
            </button>
          </div>
          {ledgerEntry ? (
            <div className={`rounded-lg p-6 border ${modalCurrentTab === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <h3 className={`text-lg font-bold mb-2 ${modalCurrentTab === 'rejected' ? 'text-red-700' : 'text-blue-700'}`}>{modalCurrentTab === 'rejected' ? 'Rejected Ledger Entry' : 'Ledger Entry'}</h3>
              
              {/* Mismatch Warning */}
              {(hasAmountMismatch || hasDateMismatch) && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <div className="font-medium">Amount or Date Mismatch Detected</div>
                      <div className="text-sm">
                        {hasAmountMismatch && hasDateMismatch && 'Amount and date do not match the actual invoice.'}
                        {hasAmountMismatch && !hasDateMismatch && 'Amount does not match the actual invoice.'}
                        {!hasAmountMismatch && hasDateMismatch && 'Date does not match the actual invoice.'}
                        {canSplit && ' Consider splitting the entry or re-forecasting.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* BOE Context Panel - only show for BOE-created entries */}
              {ledgerEntry.createdFromBOE && (
                <BOEContextPanel
                  ledgerEntryId={ledgerEntry.id}
                  transactionAmount={modalTransaction.amount}
                  isVisible={true}
                />
              )}
              
              <div className="mb-2 text-base"><b className="text-gray-600">Vendor:</b> <span className="text-gray-900">{ledgerEntry.vendor_name}</span></div>
              <div className="mb-2 text-base"><b className="text-gray-600">Description:</b> <span className="text-gray-900">{ledgerEntry.expense_description}</span></div>
              <div className="mb-2 text-base">
                <b className="text-gray-600">Planned Amount:</b> 
                <span className={`font-semibold ${hasAmountMismatch ? 'text-red-600' : 'text-blue-700'}`}>
                  {formatCurrency(ledgerEntry.planned_amount)}
                </span>
                {hasAmountMismatch && modalTransaction && (
                  <span className="text-sm text-red-600 ml-2">
                    (vs {formatCurrency(modalTransaction.amount)} actual)
                  </span>
                )}
              </div>
              <div className="mb-2 text-base">
                <b className="text-gray-600">Planned Date:</b> 
                <span className={`${hasDateMismatch ? 'text-red-600' : 'text-gray-900'}`}>
                  {ledgerEntry.planned_date}
                </span>
                {hasDateMismatch && modalTransaction && (
                  <span className="text-sm text-red-600 ml-2">
                    (vs {modalTransaction.transactionDate} actual)
                  </span>
                )}
              </div>
              {ledgerEntry.actual_amount && <div className="mb-2 text-base"><b className="text-gray-600">Actual Amount:</b> <span className="text-green-700 font-semibold">{formatCurrency(ledgerEntry.actual_amount)}</span></div>}
              {ledgerEntry.actual_date && <div className="mb-2 text-base"><b className="text-gray-600">Actual Date:</b> <span className="text-gray-900">{ledgerEntry.actual_date}</span></div>}
              {ledgerEntry.wbs_category && <div className="mb-2 text-base"><b className="text-gray-600">WBS Category:</b> <span className="text-gray-900">{ledgerEntry.wbs_category}</span></div>}
              {ledgerEntry.wbs_subcategory && <div className="mb-2 text-base"><b className="text-gray-600">WBS Subcategory:</b> <span className="text-gray-900">{ledgerEntry.wbs_subcategory}</span></div>}
              {ledgerEntry.notes && <div className="mb-2 text-base"><b className="text-gray-600">Notes:</b> <span className="text-gray-900">{ledgerEntry.notes}</span></div>}
              {ledgerEntry.invoice_link_url && (
                <div className="mb-2 text-base">
                  <b className="text-gray-600">Invoice Link:</b> 
                  <a 
                    href={ledgerEntry.invoice_link_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline ml-1"
                  >
                    {ledgerEntry.invoice_link_text || 'View Invoice'}
                  </a>
                </div>
              )}
              {/* Restore button for rejected tab */}
              {modalCurrentTab === 'rejected' && (
                <button
                  className="btn btn-success mt-4 px-6 py-2 text-base font-semibold rounded shadow hover:bg-green-700 transition"
                  onClick={handleUndoReject}
                >
                  Restore
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[120px] text-gray-500 text-lg font-semibold py-8">
              {modalCurrentTab === 'potential' ? 'No potential matches for this transaction.' : 'No rejected matches for this transaction.'}
            </div>
          )}
          {/* Navigation and Actions */}
          {ledgerEntry && (
            <div className="flex flex-col gap-2 mt-6">
              <div className="flex flex-row flex-wrap items-center justify-between gap-2 w-full">
                {/* Pagination */}
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost px-4 py-2 text-base font-semibold rounded shadow hover:bg-gray-200 transition" onClick={handlePrev} disabled={modalCurrentIndex === 0}>Prev</button>
                  <span className="text-sm text-gray-600">{total > 0 ? `${modalCurrentIndex + 1} / ${total}` : ''}</span>
                  <button className="btn btn-ghost px-4 py-2 text-base font-semibold rounded shadow hover:bg-gray-200 transition" onClick={handleNext} disabled={modalCurrentIndex === total - 1}>Next</button>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {modalCurrentTab === 'potential' && (
                    <>
                      <button className="btn btn-primary px-6 py-2 text-base font-semibold rounded shadow hover:bg-blue-700 transition" onClick={handleConfirm}>Confirm</button>
                      <button className="btn btn-error px-6 py-2 text-base font-semibold rounded shadow hover:bg-red-700 transition" onClick={handleReject}>Reject</button>
                      
                      {/* Split/Re-forecast Options */}
                      {canSplit && (
                        <button 
                          className="btn btn-warning px-4 py-2 text-sm font-semibold rounded shadow hover:bg-yellow-600 transition" 
                          onClick={handleSplit}
                          title="Split ledger entry to match actual amount"
                        >
                          Split Entry
                        </button>
                      )}
                      {canReForecast && !canSplit && (
                        <button 
                          className="btn btn-info px-4 py-2 text-sm font-semibold rounded shadow hover:bg-blue-600 transition" 
                          onClick={handleReForecast}
                          title="Re-forecast planned amount or date"
                        >
                          Re-forecast
                        </button>
                      )}
                    </>
                  )}
                  <button className="btn btn-ghost px-6 py-2 text-base font-semibold rounded shadow hover:bg-gray-200 transition" onClick={closeMatchModal}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Split Modal */}
      <LedgerSplitModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        ledgerEntry={ledgerEntry || null}
        onSplitComplete={handleSplitComplete}
        actualTransaction={modalTransaction ? {
          amount: modalTransaction.amount || 0,
          date: modalTransaction.transactionDate,
          description: modalTransaction.description
        } : undefined}
      />
      
      {/* Re-forecast Modal */}
      <LedgerReForecastModal
        isOpen={showReForecastModal}
        onClose={() => setShowReForecastModal(false)}
        ledgerEntry={ledgerEntry || null}
        onReForecastComplete={handleReForecastComplete}
        actualTransaction={modalTransaction ? {
          amount: modalTransaction.amount || 0,
          date: modalTransaction.transactionDate,
          description: modalTransaction.description
        } : undefined}
      />
    </div>
  );
};

export default TransactionMatchModal; 