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
  XMarkIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon,
  InformationCircleIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';

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
  let confidenceIcon = <InformationCircleIcon className="h-5 w-5" />;
  if (matchConfidence >= 80) {
    confidenceColor = 'text-green-600';
    confidenceIcon = <CheckCircleIcon className="h-5 w-5" />;
  } else if (matchConfidence >= 60) {
    confidenceColor = 'text-yellow-600';
    confidenceIcon = <ExclamationTriangleIcon className="h-5 w-5" />;
  } else {
    confidenceColor = 'text-red-600';
    confidenceIcon = <XCircleIcon className="h-5 w-5" />;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <DocumentMagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Transaction Matching</h2>
              <p className="text-sm text-gray-600">
                Review and confirm matches between uploaded transactions and ledger entries
              </p>
            </div>
          </div>
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" 
            onClick={closeMatchModal}
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left Panel: Upload Transaction */}
          <div className="lg:w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DocumentMagnifyingGlassIcon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900">Upload Transaction</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600">Vendor</span>
                  <span className="text-sm text-gray-900 font-medium">{modalTransaction.vendorName}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600">Description</span>
                  <span className="text-sm text-gray-900 max-w-xs text-right">{modalTransaction.description}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Amount</span>
                  <span className="text-lg font-bold text-blue-700">{formatCurrency(modalTransaction.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Date</span>
                  <span className="text-sm text-gray-900">{modalTransaction.transactionDate}</span>
                </div>
                {modalTransaction.category && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Category</span>
                    <span className="text-sm text-gray-900">{modalTransaction.category}</span>
                  </div>
                )}
                {modalTransaction.subcategory && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Subcategory</span>
                    <span className="text-sm text-gray-900">{modalTransaction.subcategory}</span>
                  </div>
                )}
                {modalTransaction.invoiceNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Invoice</span>
                    {modalTransaction.referenceNumber && modalTransaction.referenceNumber.startsWith('http') ? (
                      <a
                        href={modalTransaction.referenceNumber}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        {modalTransaction.invoiceNumber}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-900">{modalTransaction.invoiceNumber}</span>
                    )}
                  </div>
                )}
                {sessionFilename && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Session</span>
                    <span className="text-sm text-gray-900">{sessionFilename}</span>
                  </div>
                )}
              </div>

              {/* Match Confidence */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Match Confidence</span>
                  <div className="flex items-center gap-2">
                    {confidenceIcon}
                    <span className={`text-lg font-bold ${confidenceColor}`}>
                      {matchConfidence.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      matchConfidence >= 80 ? 'bg-green-500' : 
                      matchConfidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${matchConfidence}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Ledger Entry with Tabs */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            {/* Tab Navigation */}
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  modalCurrentTab === 'potential' 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => handleTab('potential')}
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckCircleIcon className="h-4 w-4" />
                  Potential Matches ({filteredPotentialLedgerEntries.length})
                </div>
              </button>
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  modalCurrentTab === 'rejected' 
                    ? 'bg-white text-red-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => handleTab('rejected')}
              >
                <div className="flex items-center justify-center gap-2">
                  <XCircleIcon className="h-4 w-4" />
                  Rejected ({filteredRejectedLedgerEntries.length})
                </div>
              </button>
            </div>

            {/* Content Area */}
            {ledgerEntry ? (
              <div className="space-y-6">
                {/* Mismatch Warning */}
                {(hasAmountMismatch || hasDateMismatch) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-1">Mismatch Detected</h4>
                        <div className="text-sm text-yellow-700 space-y-1">
                          {hasAmountMismatch && (
                            <p>• Amount: {formatCurrency(ledgerEntry.planned_amount)} planned vs {formatCurrency(modalTransaction.amount)} actual</p>
                          )}
                          {hasDateMismatch && (
                            <p>• Date: {ledgerEntry.planned_date} planned vs {modalTransaction.transactionDate} actual</p>
                          )}
                          <p className="mt-2 font-medium">
                            Consider using Split Entry or Re-forecast to resolve differences.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* BOE Context Panel */}
                {ledgerEntry.createdFromBOE && (
                  <BOEContextPanel
                    ledgerEntryId={ledgerEntry.id}
                    transactionAmount={modalTransaction.amount}
                    isVisible={true}
                  />
                )}

                {/* Ledger Entry Details */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <DocumentMagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {modalCurrentTab === 'rejected' ? 'Rejected Ledger Entry' : 'Ledger Entry'}
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-600">Vendor</span>
                      <span className="text-sm text-gray-900 font-medium">{ledgerEntry.vendor_name}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-600">Description</span>
                      <span className="text-sm text-gray-900 max-w-xs text-right">{ledgerEntry.expense_description}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Planned Amount</span>
                      <span className={`text-lg font-bold ${hasAmountMismatch ? 'text-red-600' : 'text-blue-700'}`}>
                        {formatCurrency(ledgerEntry.planned_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Planned Date</span>
                      <span className={`text-sm ${hasDateMismatch ? 'text-red-600' : 'text-gray-900'}`}>
                        {ledgerEntry.planned_date}
                      </span>
                    </div>
                    {ledgerEntry.actual_amount && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Actual Amount</span>
                        <span className="text-sm font-semibold text-green-700">{formatCurrency(ledgerEntry.actual_amount)}</span>
                      </div>
                    )}
                    {ledgerEntry.actual_date && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Actual Date</span>
                        <span className="text-sm text-gray-900">{ledgerEntry.actual_date}</span>
                      </div>
                    )}
                    {ledgerEntry.wbs_category && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">WBS Category</span>
                        <span className="text-sm text-gray-900">{ledgerEntry.wbs_category}</span>
                      </div>
                    )}
                    {ledgerEntry.wbs_subcategory && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">WBS Subcategory</span>
                        <span className="text-sm text-gray-900">{ledgerEntry.wbs_subcategory}</span>
                      </div>
                    )}
                    {ledgerEntry.notes && (
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Notes</span>
                        <span className="text-sm text-gray-900 max-w-xs text-right">{ledgerEntry.notes}</span>
                      </div>
                    )}
                    {ledgerEntry.invoice_link_url && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Invoice Link</span>
                        <a 
                          href={ledgerEntry.invoice_link_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          {ledgerEntry.invoice_link_text || 'View Invoice'}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation and Actions */}
                <div className="space-y-4">
                  {/* Pagination */}
                  {total > 1 && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <button 
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                        onClick={handlePrev} 
                        disabled={modalCurrentIndex === 0}
                      >
                        ← Previous
                      </button>
                      <span className="text-sm text-gray-600 font-medium">
                        {modalCurrentIndex + 1} of {total}
                      </span>
                      <button 
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                        onClick={handleNext} 
                        disabled={modalCurrentIndex === total - 1}
                      >
                        Next →
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {modalCurrentTab === 'potential' ? (
                      <>
                        <button 
                          className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          onClick={handleConfirm}
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Confirm Match
                        </button>
                        <button 
                          className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                          onClick={handleReject}
                        >
                          <XCircleIcon className="h-4 w-4" />
                          Reject Match
                        </button>
                        
                        {/* Split/Re-forecast Options */}
                        {canSplit && (
                          <button 
                            className="px-4 py-2.5 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                            onClick={handleSplit}
                            title="Split ledger entry to match actual amount"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                            Split Entry
                          </button>
                        )}
                        {canReForecast && !canSplit && (
                          <button 
                            className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            onClick={handleReForecast}
                            title="Re-forecast planned amount or date"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                            Re-forecast
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        onClick={handleUndoReject}
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                        Restore Match
                      </button>
                    )}
                    
                    <button 
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      onClick={closeMatchModal}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500">
                <DocumentMagnifyingGlassIcon className="h-12 w-12 mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">
                  {modalCurrentTab === 'potential' ? 'No Potential Matches' : 'No Rejected Matches'}
                </h3>
                <p className="text-sm text-gray-400 text-center">
                  {modalCurrentTab === 'potential' 
                    ? 'No potential matches found for this transaction.' 
                    : 'No rejected matches found for this transaction.'
                  }
                </p>
              </div>
            )}
          </div>
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