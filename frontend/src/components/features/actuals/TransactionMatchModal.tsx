import React, { useState, useEffect } from 'react';

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

interface ImportTransaction {
  id: string;
  vendorName: string;
  description: string;
  amount: number;
  transactionDate: string;
  status?: string;
  importSession?: { originalFilename: string };
  matchConfidence?: number;
  confidence?: number;
  invoiceNumber?: string;
  referenceNumber?: string;
  transactionId?: string;
  category?: string;
  subcategory?: string;
  [key: string]: any;
}

interface TransactionMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: ImportTransaction;
  potentialLedgerEntries: LedgerEntry[];
  rejectedLedgerEntries: LedgerEntry[];
  onConfirm: (ledgerEntry: LedgerEntry) => void;
  onReject: (ledgerEntry: LedgerEntry) => void;
  onUndoReject: (ledgerEntry: LedgerEntry) => void;
}

const TransactionMatchModal: React.FC<TransactionMatchModalProps> = ({
  isOpen,
  onClose,
  transaction,
  potentialLedgerEntries,
  rejectedLedgerEntries,
  onConfirm,
  onReject,
  onUndoReject,
}) => {
  const [currentTab, setCurrentTab] = useState<'potential' | 'rejected'>('potential');
  const [currentLedgerIndex, setCurrentLedgerIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentTab('potential');
      setCurrentLedgerIndex(0);
    }
  }, [isOpen]);

  // Auto-switch to rejected tab if no potential matches but there are rejected matches
  useEffect(() => {
    if (isOpen && potentialLedgerEntries.length === 0 && rejectedLedgerEntries.length > 0 && currentTab === 'potential') {
      setCurrentTab('rejected');
      setCurrentLedgerIndex(0);
    }
  }, [isOpen, potentialLedgerEntries.length, rejectedLedgerEntries.length, currentTab]);

  // Ensure valid index after restoring a rejected item
  useEffect(() => {
    if (currentTab === 'rejected' && currentLedgerIndex >= rejectedLedgerEntries.length && rejectedLedgerEntries.length > 0) {
      setCurrentLedgerIndex(0);
    }
    if (currentTab === 'potential' && currentLedgerIndex >= potentialLedgerEntries.length && potentialLedgerEntries.length > 0) {
      setCurrentLedgerIndex(0);
    }
  }, [rejectedLedgerEntries.length, potentialLedgerEntries.length, currentLedgerIndex, currentTab]);

  // Filter out replaced entries
  const filteredPotentialLedgerEntries = potentialLedgerEntries.filter(entry => entry.status !== 'replaced');
  const filteredRejectedLedgerEntries = rejectedLedgerEntries.filter(entry => entry.status !== 'replaced');

  // Use filtered arrays for tab logic
  const ledgerEntries = currentTab === 'potential' ? filteredPotentialLedgerEntries : filteredRejectedLedgerEntries;
  const ledgerEntry = ledgerEntries[currentLedgerIndex];
  const total = ledgerEntries.length;

  // Handlers
  const handlePrev = () => setCurrentLedgerIndex((i) => Math.max(0, i - 1));
  const handleNext = () => setCurrentLedgerIndex((i) => Math.min(total - 1, i + 1));
  const handleTab = (tab: 'potential' | 'rejected') => {
    setCurrentTab(tab);
    setCurrentLedgerIndex(0);
  };
  const handleConfirm = () => {
    onConfirm(ledgerEntry);
    onClose();
  };
  const handleReject = () => {
    onReject(ledgerEntry);
    // Let the parent component handle index management after the list is updated
  };

  // Helper for formatting
  const formatCurrency = (val: number | string | undefined | null) => {
    if (val == null || isNaN(Number(val))) return '--';
    return Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const matchConfidence = (transaction.confidence ?? transaction.matchConfidence ?? 0) * 100;
  let confidenceColor = 'text-gray-500';
  if (matchConfidence >= 80) confidenceColor = 'text-green-600';
  else if (matchConfidence >= 60) confidenceColor = 'text-yellow-600';
  else confidenceColor = 'text-red-600';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full min-w-[340px] relative border-2 border-blue-200 flex flex-col md:flex-row gap-8">
        {/* Close button */}
        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold" onClick={onClose} aria-label="Close">&times;</button>
        {/* Left: Potential Match */}
        <div className="flex-1 bg-blue-50 rounded-lg p-6 border border-blue-200 min-w-[260px]">
          <h3 className="text-lg font-bold text-blue-700 mb-2">Potential Upload Match</h3>
          <div className="mb-2 text-base"><b className="text-gray-600">Vendor:</b> <span className="text-gray-900">{transaction.vendorName}</span></div>
          <div className="mb-2 text-base"><b className="text-gray-600">Description:</b> <span className="text-gray-900">{transaction.description}</span></div>
          <div className="mb-2 text-base"><b className="text-gray-600">Amount:</b> <span className="text-blue-700 font-semibold">{formatCurrency(transaction.amount)}</span></div>
          <div className="mb-2 text-base"><b className="text-gray-600">Date:</b> <span className="text-gray-900">{transaction.transactionDate}</span></div>
          {transaction.category && <div className="mb-2 text-base"><b className="text-gray-600">Category:</b> <span className="text-gray-900">{transaction.category}</span></div>}
          {transaction.subcategory && <div className="mb-2 text-base"><b className="text-gray-600">Subcategory:</b> <span className="text-gray-900">{transaction.subcategory}</span></div>}
          {transaction.invoiceNumber && (
            <div className="mb-2 text-base">
              <b className="text-gray-600">Invoice Number:</b>
              {transaction.referenceNumber && transaction.referenceNumber.startsWith('http') ? (
                <a
                  href={transaction.referenceNumber}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline ml-1"
                >
                  {transaction.invoiceNumber}
                </a>
              ) : (
                <span className="text-gray-900 ml-1">{transaction.invoiceNumber}</span>
              )}
            </div>
          )}
          {transaction.status && <div className="mb-2 text-base"><b className="text-gray-600">Status:</b> <span className="text-gray-900">{transaction.status}</span></div>}
          {transaction.importSession && <div className="mb-2 text-base"><b className="text-gray-600">Upload Session:</b> <span className="text-gray-900">{transaction.importSession.originalFilename}</span></div>}
          <div className="mb-2 text-base font-semibold">Match Confidence: <span className={`font-bold ${confidenceColor}`}>{matchConfidence.toFixed(1)}%</span></div>
        </div>
        {/* Right: Ledger Entry with Tabs */}
        <div className="flex-1 min-w-[260px]">
          <div className="flex gap-4 mb-4 border-b border-blue-200">
            <button
              className={`px-4 py-2 font-bold border-b-2 transition ${currentTab === 'potential' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
              onClick={() => handleTab('potential')}
            >
              Potential Matches
            </button>
            <button
              className={`px-4 py-2 font-bold border-b-2 transition ${currentTab === 'rejected' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
              onClick={() => handleTab('rejected')}
            >
              Rejected
            </button>
          </div>
          {ledgerEntry ? (
            <div className={`rounded-lg p-6 border ${currentTab === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <h3 className={`text-lg font-bold mb-2 ${currentTab === 'rejected' ? 'text-red-700' : 'text-blue-700'}`}>{currentTab === 'rejected' ? 'Rejected Ledger Entry' : 'Ledger Entry'}</h3>
              <div className="mb-2 text-base"><b className="text-gray-600">Vendor:</b> <span className="text-gray-900">{ledgerEntry.vendor_name}</span></div>
              <div className="mb-2 text-base"><b className="text-gray-600">Description:</b> <span className="text-gray-900">{ledgerEntry.expense_description}</span></div>
              <div className="mb-2 text-base"><b className="text-gray-600">Planned Amount:</b> <span className="text-blue-700 font-semibold">{formatCurrency(ledgerEntry.planned_amount)}</span></div>
              <div className="mb-2 text-base"><b className="text-gray-600">Planned Date:</b> <span className="text-gray-900">{ledgerEntry.planned_date}</span></div>
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
              {currentTab === 'rejected' && (
                <button
                  className="btn btn-success mt-4 px-6 py-2 text-base font-semibold rounded shadow hover:bg-green-700 transition"
                  onClick={() => onUndoReject(ledgerEntry)}
                >
                  Restore
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[120px] text-gray-500 text-lg font-semibold py-8">
              {currentTab === 'potential' ? 'No potential matches for this transaction.' : 'No rejected matches for this transaction.'}
            </div>
          )}
          {/* Navigation and Actions */}
          {ledgerEntry && (
            <div className="flex flex-col gap-2 mt-6">
              <div className="flex flex-row flex-wrap items-center justify-between gap-2 w-full">
                {/* Pagination */}
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost px-4 py-2 text-base font-semibold rounded shadow hover:bg-gray-200 transition" onClick={handlePrev} disabled={currentLedgerIndex === 0}>Prev</button>
                  <span className="text-sm text-gray-600">{total > 0 ? `${currentLedgerIndex + 1} / ${total}` : ''}</span>
                  <button className="btn btn-ghost px-4 py-2 text-base font-semibold rounded shadow hover:bg-gray-200 transition" onClick={handleNext} disabled={currentLedgerIndex === total - 1}>Next</button>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {currentTab === 'potential' && (
                    <>
                      <button className="btn btn-primary px-6 py-2 text-base font-semibold rounded shadow hover:bg-blue-700 transition" onClick={handleConfirm}>Confirm</button>
                      <button className="btn btn-error px-6 py-2 text-base font-semibold rounded shadow hover:bg-red-700 transition" onClick={handleReject}>Reject</button>
                    </>
                  )}
                  <button className="btn btn-ghost px-6 py-2 text-base font-semibold rounded shadow hover:bg-gray-200 transition" onClick={onClose}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionMatchModal; 