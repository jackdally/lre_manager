import React from 'react';
import { ActualsUploadTransaction, ActualsUploadSession } from '../../../../types/actuals';
import { useActualsOpenMatchModal, useActualsOpenAddToLedgerModal } from '../../../../store/actualsStore';

interface TransactionMatchingTableProps {
  transactions: ActualsUploadTransaction[];
  currentSession: ActualsUploadSession | null;
  programId: string;
}

const TransactionMatchingTable: React.FC<TransactionMatchingTableProps> = ({
  transactions,
  currentSession,
  programId,
}) => {
  // Get the modal functions from the store
  const openMatchModal = useActualsOpenMatchModal();
  const openAddToLedgerModal = useActualsOpenAddToLedgerModal();

  // Status filter state
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  // Show all duplicates toggle
  const [showAllDuplicates, setShowAllDuplicates] = React.useState<boolean>(false);

  // Helper: format currency
  const formatCurrency = (amount: number | string | undefined) => {
    if (amount === undefined || amount === null) return 'N/A';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  // Status logic
  const getTransactionStatus = (transaction: ActualsUploadTransaction) => {
    // First check if it's a confirmed match (has actual data)
    if (transaction.matchedLedgerEntry) {
      const hasActualData = transaction.matchedLedgerEntry.actual_amount !== null && 
                           transaction.matchedLedgerEntry.actual_date !== null;
      
      if (hasActualData) {
        return 'confirmed';
      } else {
        // This is a suggested match, not confirmed
        return 'matched';
      }
    }

    // Prioritize the backend status - if backend says it's rejected, it's rejected
    if (transaction.status === 'rejected') {
      return 'rejected';
    }

    // If backend says it's unmatched, it's unmatched
    if (transaction.status === 'unmatched') {
      return 'unmatched';
    }

    // If backend says it's matched, check if there are still suggested matches
    if (transaction.status === 'matched') {
      if (Array.isArray(transaction.suggestedMatches) && transaction.suggestedMatches.length > 0) {
        return 'matched';
      } else {
        // Backend says matched but no suggested matches - this shouldn't happen
        // but if it does, treat as unmatched
        return 'unmatched';
      }
    }

    // Check if it has suggested matches (matched status) - fallback for edge cases
    if (Array.isArray(transaction.suggestedMatches) && transaction.suggestedMatches.length > 0) {
      return 'matched';
    }

    // Default to the transaction's status or unmatched
    const finalStatus = transaction.status || 'unmatched';
    return finalStatus;
  };

  // Filter for duplicates
  const filteredByDuplicates = showAllDuplicates
    ? transactions
    : transactions.filter(tx => !tx.duplicateType || tx.duplicateType === 'none');

  // Status filter
  const filteredTransactions = statusFilter === 'all'
    ? filteredByDuplicates
    : filteredByDuplicates.filter(tx => getTransactionStatus(tx).toLowerCase() === statusFilter.toLowerCase());

  // Sorting order
  const statusOrder = [
    'matched',
    'confirmed',
    'rejected',
    'unmatched',
    'replaced',
  ];
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const aStatus = getTransactionStatus(a).toLowerCase();
    const bStatus = getTransactionStatus(b).toLowerCase();
    const aIndex = statusOrder.indexOf(aStatus);
    const bIndex = statusOrder.indexOf(bStatus);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });

  // Status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'confirmed':
        return 'text-green-700 bg-green-100';
      case 'unmatched':
        return 'text-gray-700 bg-gray-200';
      case 'matched':
        return 'text-blue-700 bg-blue-100';
      default:
        return 'text-gray-700 bg-gray-200';
    }
  };

  // Action button logic
  const renderAction = (tx: ActualsUploadTransaction) => {
    const status = getTransactionStatus(tx);
    if (status === 'matched') {
      return (
        <button className="text-blue-600 hover:text-blue-900" onClick={() => openMatchModal(tx)}>Review Match</button>
      );
    }
    if (status === 'rejected') {
      return (
        <button className="text-red-600 hover:text-red-900" onClick={() => openMatchModal(tx)}>Review Rejected Matches</button>
      );
    }
    if (status === 'unmatched') {
      return (
        <button className="text-gray-700 hover:text-gray-900" onClick={() => openAddToLedgerModal(tx)}>Add to Ledger</button>
      );
    }
    if (status === 'confirmed' && tx.matchedLedgerEntry) {
      return (
        <a
          href={`/programs/${programId}/ledger?highlight=${tx.matchedLedgerEntry.id}`}
          className="text-green-600 hover:text-green-900 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          View in Ledger
        </a>
      );
    }
    return null;
  };

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
        <div className="flex items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All</option>
              <option value="matched">Matched</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="unmatched">Unmatched</option>
              <option value="replaced">Replaced</option>
            </select>
          </div>
          {/* Show All Duplicates Button */}
          <button
            className={`px-4 py-2 rounded-md font-semibold border transition-colors ${
              showAllDuplicates
                ? 'bg-blue-100 border-blue-400 text-blue-700'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400'
            }`}
            onClick={() => setShowAllDuplicates(!showAllDuplicates)}
          >
            {showAllDuplicates ? 'Hide Duplicates' : 'Show All'}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTransactions.map((tx) => (
              <tr key={tx.id}>
                <td className="px-6 py-4">{tx.vendorName}</td>
                <td className="px-6 py-4">{tx.description}</td>
                <td className="px-6 py-4">{formatCurrency(tx.amount)}</td>
                <td className="px-6 py-4">{tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : ''}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(getTransactionStatus(tx))}`}>
                    {getTransactionStatus(tx)}
                  </span>
                </td>
                <td className="px-6 py-4">{renderAction(tx)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sortedTransactions.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          No transactions found.
        </div>
      )}
    </div>
  );
};

export default TransactionMatchingTable; 