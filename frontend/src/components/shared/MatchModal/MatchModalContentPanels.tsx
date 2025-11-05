import React from 'react';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Helper for formatting currency
const formatCurrency = (val: number | string | undefined | null) => {
  if (val == null || isNaN(Number(val))) return '--';
  return Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Helper for formatting confidence
const formatConfidence = (confidence: number | string | undefined | null) => {
  if (confidence == null) return 0;
  const num = Number(confidence);
  return isNaN(num) ? 0 : num;
};

// Upload Transaction Panel (for actuals modal)
export const UploadTransactionPanel: React.FC<{
  transaction: any;
  sessionFilename?: string;
}> = ({ transaction, sessionFilename }) => {
  const matchConfidence = formatConfidence(transaction.matchConfidence || transaction.confidence) * 100;
  let confidenceColor = 'text-gray-500';
  let confidenceBg = 'bg-gray-100';
  if (matchConfidence >= 95) {
    confidenceColor = 'text-green-600';
    confidenceBg = 'bg-green-100';
  } else if (matchConfidence >= 80) {
    confidenceColor = 'text-green-600';
    confidenceBg = 'bg-green-100';
  } else if (matchConfidence >= 60) {
    confidenceColor = 'text-yellow-600';
    confidenceBg = 'bg-yellow-100';
  } else {
    confidenceColor = 'text-red-600';
    confidenceBg = 'bg-red-100';
  }

  return (
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
          <span className="text-sm text-gray-900 font-medium">{transaction.vendorName}</span>
        </div>
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-gray-600">Description</span>
          <span className="text-sm text-gray-900 max-w-xs text-right">{transaction.description}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Amount</span>
          <span className="text-lg font-bold text-blue-700">{formatCurrency(transaction.amount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Date</span>
          <span className="text-sm text-gray-900">{transaction.transactionDate}</span>
        </div>
        {transaction.category && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Category</span>
            <span className="text-sm text-gray-900">{transaction.category}</span>
          </div>
        )}
        {transaction.subcategory && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Subcategory</span>
            <span className="text-sm text-gray-900">{transaction.subcategory}</span>
          </div>
        )}
        {transaction.invoiceNumber && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Invoice</span>
            {transaction.referenceNumber && transaction.referenceNumber.startsWith('http') ? (
              <a
                href={transaction.referenceNumber}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {transaction.invoiceNumber}
              </a>
            ) : (
              <span className="text-sm text-gray-900">{transaction.invoiceNumber}</span>
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
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Match Confidence</span>
          <span className={`px-3 py-1 rounded-full text-lg font-bold ${confidenceColor} ${confidenceBg}`}>
            {matchConfidence.toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              matchConfidence >= 95 ? 'bg-green-500' :
              matchConfidence >= 80 ? 'bg-green-400' : 
              matchConfidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${matchConfidence}%` }}
          />
        </div>
        {matchConfidence >= 95 && (
          <p className="mt-2 text-xs text-green-700 font-medium">Excellent Match</p>
        )}
        {matchConfidence >= 80 && matchConfidence < 95 && (
          <p className="mt-2 text-xs text-green-600 font-medium">Good Match</p>
        )}
        {matchConfidence >= 60 && matchConfidence < 80 && (
          <p className="mt-2 text-xs text-yellow-600 font-medium">Review Recommended</p>
        )}
        {matchConfidence < 60 && (
          <p className="mt-2 text-xs text-red-600 font-medium">Low Confidence - Manual Review Required</p>
        )}
      </div>
    </div>
  );
};

// Ledger Entry Panel (for both modals)
export const LedgerEntryPanel: React.FC<{
  ledgerEntry: any;
  isRejected?: boolean;
  hasAmountMismatch?: boolean;
  hasDateMismatch?: boolean;
  actualAmount?: number | string;
  actualDate?: string;
  confidence?: number;
  matchType?: string;
  reasons?: string[];
}> = ({ 
  ledgerEntry, 
  isRejected = false, 
  hasAmountMismatch = false, 
  hasDateMismatch = false,
  actualAmount,
  actualDate,
  confidence,
  matchType,
  reasons
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gray-100 rounded-lg">
          <DocumentMagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {isRejected ? 'Rejected Ledger Entry' : 'Ledger Entry'}
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

      {/* Match Reasons */}
      {reasons && reasons.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Why This Match</h4>
          <ul className="space-y-1">
            {reasons.map((reason, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Match Type Indicator */}
      {matchType && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Match Type:</span>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {matchType}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Upload Transaction Panel (for ledger modal - right side)
export const UploadTransactionMatchPanel: React.FC<{
  transaction: any;
  isRejected?: boolean;
}> = ({ transaction, isRejected = false }) => {
  const matchConfidence = formatConfidence(transaction.matchConfidence || transaction.confidence) * 100;
  let confidenceColor = 'text-gray-500';
  if (matchConfidence >= 80) confidenceColor = 'text-green-600';
  else if (matchConfidence >= 60) confidenceColor = 'text-yellow-600';
  else confidenceColor = 'text-red-600';

  return (
    <div className={`rounded-lg p-6 border ${isRejected ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
      <h3 className={`text-lg font-bold mb-2 ${isRejected ? 'text-red-700' : 'text-blue-700'}`}>
        {isRejected ? 'Rejected Match' : 'Potential Upload Match'}
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-gray-600">Vendor</span>
          <span className="text-sm text-gray-900 font-medium">{transaction.vendorName}</span>
        </div>
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-gray-600">Description</span>
          <span className="text-sm text-gray-900 max-w-xs text-right">{transaction.description}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Amount</span>
          <span className="text-lg font-bold text-blue-700">{formatCurrency(transaction.amount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Date</span>
          <span className="text-sm text-gray-900">
            {transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleDateString() : ''}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Status</span>
          <span className="text-sm text-gray-900 capitalize">{transaction.status}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Upload Session</span>
          <span className="text-sm text-gray-900">{transaction.actualsUploadSession?.originalFilename}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Match Confidence</span>
          <span className={`text-lg font-bold ${confidenceColor}`}>
            {matchConfidence.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}; 