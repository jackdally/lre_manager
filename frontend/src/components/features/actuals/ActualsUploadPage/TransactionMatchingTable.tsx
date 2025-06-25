import React from 'react';
import { ImportTransaction, ImportSession } from '../../../../types/actuals';

interface TransactionMatchingTableProps {
  transactions: ImportTransaction[];
  currentSession: ImportSession | null;
  potentialMatchesMap: { [transactionId: string]: any[] };
  onReviewMatch: (transaction: ImportTransaction, matches: any[]) => void;
  onAddToLedger: (transactionId: string, wbsCategory: string, wbsSubcategory: string) => void;
  onIgnoreDuplicate: (transactionId: string) => void;
  onRejectDuplicate: (transactionId: string) => void;
  onAcceptAndReplaceOriginal: (transactionId: string, duplicateOfId: string | null | undefined) => void;
  showAllDuplicates: boolean;
  onToggleShowAllDuplicates: () => void;
}

const TransactionMatchingTable: React.FC<TransactionMatchingTableProps> = ({
  transactions,
  currentSession,
  potentialMatchesMap,
  onReviewMatch,
  onAddToLedger,
  onIgnoreDuplicate,
  onRejectDuplicate,
  onAcceptAndReplaceOriginal,
  showAllDuplicates,
  onToggleShowAllDuplicates
}) => {
  const formatCurrency = (amount: number | string | undefined) => {
    if (amount === undefined || amount === null) return 'N/A';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const filteredTransactions = showAllDuplicates 
    ? transactions 
    : transactions.filter(tx => !tx.duplicateType || tx.duplicateType === 'none');

  // Add a type guard for 'rejected' status
  function isRejectedStatus(status: string): status is 'rejected' {
    return status === 'rejected';
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          {currentSession && (
            <p className="text-sm text-gray-600 mt-1">
              {currentSession.originalFilename} - {currentSession.matchedRecords} matched, {currentSession.unmatchedRecords} unmatched
            </p>
          )}
        </div>
        <button
          className={`px-4 py-2 rounded-md font-semibold border transition-colors ${
            showAllDuplicates 
              ? 'bg-blue-100 border-blue-400 text-blue-700' 
              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400'
          }`}
          onClick={onToggleShowAllDuplicates}
        >
          {showAllDuplicates ? 'Hide Duplicates' : 'Show All'}
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Match Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => {
              const potentialMatches = potentialMatchesMap[transaction.id] || [];
              const hasPotentialMatches = potentialMatches.length > 0;
              const hasRejectedMatches = transaction.rejectedMatches && transaction.rejectedMatches.length > 0;

              return (
                <tr key={transaction.id} className={`hover:bg-gray-50 ${transaction.duplicateType && transaction.duplicateType !== 'none' && transaction.status !== 'rejected' ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.vendorName || 'Unknown Vendor'}
                        {transaction.preservedFromSessionId && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800 border border-blue-300 cursor-pointer"
                            title="View original session"
                          >
                            Preserved from previous upload
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.description || 'No description'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {`${formatCurrency(transaction.amount)} - ${transaction.transactionDate || 'No date'}`}
                      </div>
                      {transaction.duplicateType && transaction.duplicateType !== 'none' && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${
                            transaction.duplicateType === 'exact_duplicate' 
                              ? 'bg-red-200 text-red-900 border-red-400'
                            : transaction.duplicateType === 'different_info_confirmed'
                              ? 'bg-orange-200 text-orange-900 border-orange-400'
                            : transaction.duplicateType === 'different_info_pending'
                              ? 'bg-yellow-200 text-yellow-900 border-yellow-400'
                            : transaction.duplicateType === 'original_rejected'
                              ? 'bg-purple-200 text-purple-900 border-purple-400'
                            : transaction.duplicateType === 'no_invoice_potential'
                              ? 'bg-blue-200 text-blue-900 border-blue-400'
                            : transaction.duplicateType === 'multiple_potential'
                              ? 'bg-indigo-200 text-indigo-900 border-indigo-400'
                            : 'bg-gray-200 text-gray-900 border-gray-400'
                          }`}>
                            {transaction.duplicateType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          {transaction.duplicateOfId && transaction.status !== 'rejected' && (
                            <button
                              className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                              onClick={() => onAcceptAndReplaceOriginal(transaction.id, transaction.duplicateOfId)}
                            >
                              Accept & Replace Original
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.duplicateType && transaction.duplicateType !== 'none' && transaction.status !== 'rejected' ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">Duplicate detected</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => onIgnoreDuplicate(transaction.id)}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Ignore
                          </button>
                          <button
                            onClick={() => onRejectDuplicate(transaction.id)}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                        ${transaction.status === 'rejected' || (transaction.status === 'matched' && (!potentialMatchesMap[transaction.id] || potentialMatchesMap[transaction.id].length === 0) && transaction.rejectedMatches && transaction.rejectedMatches.length > 0)
                          ? 'text-red-600 bg-red-100'
                        : transaction.status === 'confirmed'
                          ? 'text-green-700 bg-green-100'
                        : transaction.status === 'unmatched'
                          ? 'text-gray-700 bg-gray-200'
                        : transaction.status === 'matched'
                          ? 'text-blue-700 bg-blue-100'
                        : 'text-gray-700 bg-gray-200' 
                      }`}>
                        {
                          (transaction.status === 'matched' && (!potentialMatchesMap[transaction.id] || potentialMatchesMap[transaction.id].length === 0) && transaction.rejectedMatches && transaction.rejectedMatches.length > 0)
                            ? 'rejected'
                          : transaction.status || 'unmatched'
                        }
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.matchConfidence ? `${(transaction.matchConfidence * 100).toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {transaction.status === 'rejected' ? (
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-600 cursor-not-allowed opacity-70">
                        rejected
                      </span>
                    ) : (
                      (() => {
                        if (transaction.status === 'matched' && hasPotentialMatches) {
                          return (
                            <button
                              onClick={() => onReviewMatch(transaction, potentialMatches)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Review Match
                            </button>
                          );
                        }
                        if (((!hasPotentialMatches && hasRejectedMatches && transaction.status === 'matched') || (isRejectedStatus(transaction.status) && hasRejectedMatches))) {
                          return (
                            <button
                              onClick={() => onReviewMatch(transaction, [])}
                              className="text-red-600 hover:text-red-900"
                            >
                              Review Rejected Matches
                            </button>
                          );
                        }
                        return null;
                      })()
                    )}
                    {transaction.status === 'unmatched' && (
                      <button
                        onClick={() => {
                          const wbsCategory = prompt('Enter WBS Category:');
                          const wbsSubcategory = prompt('Enter WBS Subcategory:');
                          if (wbsCategory && wbsSubcategory) {
                            onAddToLedger(transaction.id, wbsCategory, wbsSubcategory);
                          }
                        }}
                        className="text-gray-700 hover:text-gray-900"
                      >
                        Add to Ledger
                      </button>
                    )}
                    {(transaction.status === 'confirmed' || transaction.status === 'added_to_ledger') && transaction.matchedLedgerEntry && (
                      <a
                        href={`/programs/${transaction.programCode}/ledger?highlight=${transaction.matchedLedgerEntry.id}`}
                        className="text-green-600 hover:text-green-900 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View in Ledger
                      </a>
                    )}
                    {((transaction.status === 'confirmed' || transaction.status === 'added_to_ledger') && !transaction.matchedLedgerEntry) && (
                      <span className="text-gray-400">{transaction.status}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredTransactions.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          No transactions found.
        </div>
      )}
    </div>
  );
};

export default TransactionMatchingTable; 