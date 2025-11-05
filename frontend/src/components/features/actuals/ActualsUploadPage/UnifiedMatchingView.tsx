import React, { useState } from 'react';
import { ActualsUploadTransaction, ActualsUploadSession } from '../../../../types/actuals';
import { useActualsOpenMatchModal, useActualsOpenAddToLedgerModal, useActualsConfirmMatch, useActualsRejectMatch } from '../../../../store/actualsStore';
import { CheckCircleIcon, XCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface UnifiedMatchingViewProps {
  transactions: ActualsUploadTransaction[];
  currentSession: ActualsUploadSession | null;
  programId: string;
}

interface LedgerEntry {
  id: string;
  vendor_name?: string;
  expense_description?: string;
  planned_amount?: number;
  planned_date?: string;
  actual_amount?: number;
  actual_date?: string;
  wbsElement?: {
    code: string;
    name: string;
  };
  confidence?: number;
  matchType?: string;
  reasons?: string[];
}

const UnifiedMatchingView: React.FC<UnifiedMatchingViewProps> = ({
  transactions,
  currentSession,
  programId,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState<'confirm' | 'reject' | 'add-to-ledger' | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [showAllMatches, setShowAllMatches] = useState<Set<string>>(new Set());
  
  const openMatchModal = useActualsOpenMatchModal();
  const openAddToLedgerModal = useActualsOpenAddToLedgerModal();
  const confirmMatch = useActualsConfirmMatch();
  const rejectMatch = useActualsRejectMatch();

  const formatCurrency = (amount: number | string | undefined) => {
    if (amount === undefined || amount === null) return 'N/A';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const getTransactionStatus = (transaction: ActualsUploadTransaction) => {
    if (transaction.matchedLedgerEntry) {
      const hasActualData = transaction.matchedLedgerEntry.actual_amount !== null && 
                           transaction.matchedLedgerEntry.actual_date !== null;
      if (hasActualData) return 'confirmed';
      return 'matched';
    }
    if (transaction.status === 'rejected') return 'rejected';
    if (transaction.status === 'unmatched') return 'unmatched';
    if (transaction.status === 'matched' && Array.isArray(transaction.suggestedMatches) && transaction.suggestedMatches.length > 0) {
      return 'matched';
    }
    return transaction.status || 'unmatched';
  };

  const toggleRowExpansion = (transactionId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(transactionId)) {
        next.delete(transactionId);
      } else {
        next.add(transactionId);
      }
      return next;
    });
  };

  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions(prev => {
      const next = new Set(prev);
      if (next.has(transactionId)) {
        next.delete(transactionId);
      } else {
        next.add(transactionId);
      }
      return next;
    });
  };

  const filteredTransactions = statusFilter === 'all'
    ? transactions
    : transactions.filter(tx => getTransactionStatus(tx).toLowerCase() === statusFilter.toLowerCase());

  const statusOrder = ['matched', 'confirmed', 'rejected', 'unmatched', 'replaced'];
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const aStatus = getTransactionStatus(a).toLowerCase();
    const bStatus = getTransactionStatus(b).toLowerCase();
    const aIndex = statusOrder.indexOf(aStatus);
    const bIndex = statusOrder.indexOf(bStatus);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'confirmed': return 'text-green-700 bg-green-100';
      case 'unmatched': return 'text-gray-700 bg-gray-200';
      case 'matched': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-200';
    }
  };

  const handleQuickConfirm = async (transaction: ActualsUploadTransaction, ledgerEntry: LedgerEntry) => {
    try {
      await confirmMatch(ledgerEntry);
    } catch (error) {
      console.error('Failed to confirm match:', error);
    }
  };

  const handleQuickReject = async (transaction: ActualsUploadTransaction, ledgerEntry: LedgerEntry) => {
    try {
      await rejectMatch(ledgerEntry);
    } catch (error) {
      console.error('Failed to reject match:', error);
    }
  };

  const renderMatchesSection = (transaction: ActualsUploadTransaction, suggestedMatches: LedgerEntry[]) => {
    // Sort matches by confidence (highest first)
    const sortedMatches = [...suggestedMatches].sort((a, b) => {
      const aConf = a.confidence || 0;
      const bConf = b.confidence || 0;
      return bConf - aConf; // Descending order
    });
    const showAll = showAllMatches.has(transaction.id);
    const matchesToShow = showAll ? sortedMatches : sortedMatches.slice(0, 1);
    const hasMoreMatches = sortedMatches.length > 1;

    return (
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Potential Matches ({suggestedMatches.length})
          </h3>
          {hasMoreMatches && (
            <button
              onClick={() => {
                setShowAllMatches(prev => {
                  const next = new Set(prev);
                  if (next.has(transaction.id)) {
                    next.delete(transaction.id);
                  } else {
                    next.add(transaction.id);
                  }
                  return next;
                });
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              {showAll ? (
                <>
                  <ChevronUpIcon className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDownIcon className="h-4 w-4" />
                  Show All Matches ({sortedMatches.length - 1} more)
                </>
              )}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Transaction Side */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3 pb-2 border-b">Upload Transaction</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-600">Vendor:</span>
                <span className="ml-2 text-gray-900">{transaction.vendorName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Description:</span>
                <span className="ml-2 text-gray-900">{transaction.description}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Amount:</span>
                <span className="ml-2 text-gray-900 font-semibold">{formatCurrency(transaction.amount)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Date:</span>
                <span className="ml-2 text-gray-900">
                  {transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Potential Matches Side */}
          <div className="space-y-3">
            {matchesToShow.map((match, index) => {
              const hasAmountMismatch = Math.abs((transaction.amount || 0) - (match.planned_amount || 0)) > 0.01;
              const hasDateMismatch = transaction.transactionDate !== match.planned_date;

              return (
                <div
                  key={match.id || index}
                  className="bg-white rounded-lg border border-gray-200 p-4 relative"
                >
                  {match.confidence && (
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        match.confidence >= 0.95 ? 'bg-green-100 text-green-700' :
                        match.confidence >= 0.8 ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {Math.round(match.confidence * 100)}% match
                      </span>
                    </div>
                  )}
                  <h4 className="font-semibold text-gray-900 mb-3 pb-2 border-b">
                    {index === 0 && !showAll ? 'Top Match' : `Ledger Entry ${index + 1}`}
                    {index === 0 && sortedMatches.length > 1 && !showAll && (
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        (Highest confidence: {Math.round((match.confidence || 0) * 100)}%)
                      </span>
                    )}
                  </h4>
                  <div className="space-y-2 text-sm mb-3">
                    <div>
                      <span className="font-medium text-gray-600">Vendor:</span>
                      <span className={`ml-2 ${transaction.vendorName === match.vendor_name ? 'text-green-700 font-semibold' : 'text-gray-900'}`}>
                        {match.vendor_name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Description:</span>
                      <span className="ml-2 text-gray-900">{match.expense_description || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Planned Amount:</span>
                      <span className={`ml-2 font-semibold ${hasAmountMismatch ? 'text-red-600' : 'text-green-700'}`}>
                        {formatCurrency(match.planned_amount)}
                      </span>
                      {hasAmountMismatch && (
                        <span className="ml-2 text-xs text-red-600">
                          (Diff: {formatCurrency((transaction.amount || 0) - (match.planned_amount || 0))})
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Planned Date:</span>
                      <span className={`ml-2 ${hasDateMismatch ? 'text-red-600' : 'text-green-700'}`}>
                        {match.planned_date || 'N/A'}
                      </span>
                    </div>
                    {match.wbsElement && (
                      <div>
                        <span className="font-medium text-gray-600">WBS:</span>
                        <span className="ml-2 text-gray-900">{match.wbsElement.code} - {match.wbsElement.name}</span>
                      </div>
                    )}
                  </div>
                  {match.reasons && match.reasons.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-600 mb-1">Match Reasons:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {match.reasons.map((reason, idx) => (
                          <li key={idx}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleQuickConfirm(transaction, match)}
                      className="btn btn-sm btn-success flex-1"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Confirm
                    </button>
                    <button
                      onClick={() => handleQuickReject(transaction, match)}
                      className="btn btn-sm btn-error flex-1"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                    <button
                      onClick={() => openMatchModal(transaction)}
                      className="btn btn-sm btn-ghost"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const handleBatchConfirm = async () => {
    if (selectedTransactions.size === 0) return;
    setIsProcessingBatch(true);
    try {
      const transactionsToProcess = sortedTransactions.filter(tx => selectedTransactions.has(tx.id));
      let successCount = 0;
      let errorCount = 0;

      for (const transaction of transactionsToProcess) {
        if (transaction.suggestedMatches && transaction.suggestedMatches.length > 0) {
          const bestMatch = transaction.suggestedMatches[0] as LedgerEntry;
          try {
            await confirmMatch(bestMatch);
            successCount++;
          } catch (error) {
            errorCount++;
          }
        }
      }

      setSelectedTransactions(new Set());
      setBatchMode(null);
      alert(`Batch confirm completed: ${successCount} successful, ${errorCount} errors`);
    } catch (error) {
      console.error('Batch confirm failed:', error);
      alert('Batch confirm failed. Please try again.');
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleBatchReject = async () => {
    if (selectedTransactions.size === 0) return;
    setIsProcessingBatch(true);
    try {
      const transactionsToProcess = sortedTransactions.filter(tx => selectedTransactions.has(tx.id));
      let successCount = 0;
      let errorCount = 0;

      for (const transaction of transactionsToProcess) {
        if (transaction.suggestedMatches && transaction.suggestedMatches.length > 0) {
          for (const match of transaction.suggestedMatches) {
            try {
              await rejectMatch(match as LedgerEntry);
              successCount++;
            } catch (error) {
              errorCount++;
            }
          }
        }
      }

      setSelectedTransactions(new Set());
      setBatchMode(null);
      alert(`Batch reject completed: ${successCount} successful, ${errorCount} errors`);
    } catch (error) {
      console.error('Batch reject failed:', error);
      alert('Batch reject failed. Please try again.');
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleBatchAddToLedger = async () => {
    if (selectedTransactions.size === 0) return;
    const transactionsToProcess = sortedTransactions.filter(tx => 
      selectedTransactions.has(tx.id) && getTransactionStatus(tx) === 'unmatched'
    );
    
    if (transactionsToProcess.length === 0) {
      alert('No unmatched transactions selected');
      return;
    }

    // For now, open the first one - in a full implementation, we'd show a bulk modal
    if (transactionsToProcess.length > 0) {
      openAddToLedgerModal(transactionsToProcess[0]);
    }
  };

  const selectAll = () => {
    if (selectedTransactions.size === sortedTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(sortedTransactions.map(tx => tx.id)));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">Transaction Matching</h2>
              {currentSession && (
                <p className="text-sm text-gray-600 mt-1">
                  Session: {currentSession.description || currentSession.originalFilename}
                </p>
              )}
            </div>
            <button
              onClick={selectAll}
              className="btn btn-sm btn-ghost"
            >
              {selectedTransactions.size === sortedTransactions.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="matched">Matched</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="unmatched">Unmatched</option>
            </select>
            {selectedTransactions.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{selectedTransactions.size} selected</span>
                <button
                  onClick={() => setBatchMode(batchMode === 'confirm' ? null : 'confirm')}
                  className={`btn btn-sm ${batchMode === 'confirm' ? 'btn-success' : 'btn-primary'}`}
                  disabled={isProcessingBatch}
                >
                  Batch Confirm
                </button>
                <button
                  onClick={() => setBatchMode(batchMode === 'reject' ? null : 'reject')}
                  className={`btn btn-sm ${batchMode === 'reject' ? 'btn-error' : 'btn-primary'}`}
                  disabled={isProcessingBatch}
                >
                  Batch Reject
                </button>
                <button
                  onClick={() => setBatchMode(batchMode === 'add-to-ledger' ? null : 'add-to-ledger')}
                  className={`btn btn-sm ${batchMode === 'add-to-ledger' ? 'btn-secondary' : 'btn-primary'}`}
                  disabled={isProcessingBatch}
                >
                  Batch Add to Ledger
                </button>
                {batchMode && (
                  <button
                    onClick={() => {
                      if (batchMode === 'confirm') handleBatchConfirm();
                      else if (batchMode === 'reject') handleBatchReject();
                      else if (batchMode === 'add-to-ledger') handleBatchAddToLedger();
                    }}
                    className="btn btn-sm btn-success"
                    disabled={isProcessingBatch}
                  >
                    {isProcessingBatch ? 'Processing...' : 'Execute'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedTransactions(new Set());
                    setBatchMode(null);
                  }}
                  className="btn btn-sm btn-ghost"
                  disabled={isProcessingBatch}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {sortedTransactions.map((transaction) => {
          const status = getTransactionStatus(transaction);
          const isExpanded = expandedRows.has(transaction.id);
          const isSelected = selectedTransactions.has(transaction.id);
          const suggestedMatches = (transaction.suggestedMatches || []) as LedgerEntry[];

          return (
            <div key={transaction.id} className={`transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
              {/* Main Transaction Row */}
              <div className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTransactionSelection(transaction.id)}
                    className="checkbox checkbox-sm"
                  />
                  
                  <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                    <div>
                      <div className="font-medium text-gray-900">{transaction.vendorName}</div>
                      <div className="text-sm text-gray-500 truncate">{transaction.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(transaction.amount)}</div>
                      <div className="text-sm text-gray-500">
                        {transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleDateString() : ''}
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                    <div>
                      {suggestedMatches.length > 0 && (
                        <span className="text-sm text-gray-600">
                          {suggestedMatches.length} potential match{suggestedMatches.length !== 1 ? 'es' : ''}
                        </span>
                      )}
                      {status === 'confirmed' && transaction.matchedLedgerEntry && (
                        <a
                          href={`/programs/${programId}/ledger?highlight=${transaction.matchedLedgerEntry.id}`}
                          className="text-sm text-green-600 hover:text-green-900 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View in Ledger
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      {status === 'matched' && (
                        <button
                          onClick={() => openMatchModal(transaction)}
                          className="btn btn-sm btn-primary"
                        >
                          Review Match
                        </button>
                      )}
                      {status === 'unmatched' && (
                        <button
                          onClick={() => openAddToLedgerModal(transaction)}
                          className="btn btn-sm btn-secondary"
                        >
                          Add to Ledger
                        </button>
                      )}
                      {suggestedMatches.length > 0 && (
                        <button
                          onClick={() => toggleRowExpansion(transaction.id)}
                          className="btn btn-sm btn-ghost"
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="h-5 w-5" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Side-by-Side Comparison */}
              {isExpanded && suggestedMatches.length > 0 && renderMatchesSection(transaction, suggestedMatches)}
            </div>
          );
        })}
      </div>

      {sortedTransactions.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          No transactions found.
        </div>
      )}
    </div>
  );
};

export default UnifiedMatchingView;

