import React, { useState, useEffect } from 'react';
import { LedgerEntry } from '../../../../types/ledger';
import axios from 'axios';

interface SplitSuggestion {
  plannedAmount: number;
  plannedDate: string;
  description: string;
  reason: string;
}

interface LedgerSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerEntry: LedgerEntry | null;
  onSplitComplete: () => void;
  actualTransaction?: {
    amount: number;
    date: string;
    description?: string;
  };
}

interface SplitEntry {
  plannedAmount: number;
  plannedDate: string;
  description: string;
  notes: string;
}

const LedgerSplitModal: React.FC<LedgerSplitModalProps> = ({
  isOpen,
  onClose,
  ledgerEntry,
  onSplitComplete,
  actualTransaction
}) => {
  const [splits, setSplits] = useState<SplitEntry[]>([]);
  const [splitReason, setSplitReason] = useState('');
  const [suggestions, setSuggestions] = useState<SplitSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [originalAmount, setOriginalAmount] = useState(0);

  useEffect(() => {
    if (isOpen && ledgerEntry) {
      setOriginalAmount(ledgerEntry.planned_amount || 0);
      setTotalAmount(0);
      setSplits([]);
      setSplitReason('');
      setError(null);
      loadSuggestions();
      
      // Auto-populate splits if actual transaction data is provided
      if (actualTransaction && actualTransaction.amount < (ledgerEntry.planned_amount || 0)) {
        const actualAmount = actualTransaction.amount;
        const remainingAmount = (ledgerEntry.planned_amount || 0) - actualAmount;
        
        const autoSplits: SplitEntry[] = [
          {
            plannedAmount: actualAmount,
            plannedDate: actualTransaction.date,
            description: `${ledgerEntry.expense_description} - Matched Amount`,
            notes: `Automatically split: matched to actual invoice of ${actualAmount}`
          },
          {
            plannedAmount: remainingAmount,
            plannedDate: ledgerEntry.planned_date || actualTransaction.date,
            description: `${ledgerEntry.expense_description} - Remaining Amount`,
            notes: `Automatically split: remaining amount of ${remainingAmount}`
          }
        ];
        
        setSplits(autoSplits);
        setSplitReason('Automatic split based on actual invoice amount');
      }
    }
  }, [isOpen, ledgerEntry, actualTransaction]);

  useEffect(() => {
    const total = splits.reduce((sum, split) => sum + split.plannedAmount, 0);
    setTotalAmount(total);
  }, [splits]);

  const loadSuggestions = async () => {
    if (!ledgerEntry) return;

    try {
      const response = await axios.get(`/api/ledger-splitting/${ledgerEntry.id}/split-suggestions`);
      const data = response.data as { suggestions: SplitSuggestion[] };
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error loading split suggestions:', error);
    }
  };

  const addSplit = () => {
    const newSplit: SplitEntry = {
      plannedAmount: 0,
      plannedDate: new Date().toISOString().split('T')[0],
      description: ledgerEntry?.expense_description || '',
      notes: ''
    };
    setSplits([...splits, newSplit]);
  };

  const removeSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const updateSplit = (index: number, field: keyof SplitEntry, value: any) => {
    const updatedSplits = [...splits];
    updatedSplits[index] = { ...updatedSplits[index], [field]: value };
    setSplits(updatedSplits);
  };

  const applySuggestion = (suggestion: SplitSuggestion) => {
    const newSplit: SplitEntry = {
      plannedAmount: suggestion.plannedAmount,
      plannedDate: suggestion.plannedDate,
      description: suggestion.description,
      notes: suggestion.reason
    };
    setSplits([...splits, newSplit]);
  };

  const applyAllSuggestions = () => {
    const newSplits: SplitEntry[] = suggestions.map(suggestion => ({
      plannedAmount: suggestion.plannedAmount,
      plannedDate: suggestion.plannedDate,
      description: suggestion.description,
      notes: suggestion.reason
    }));
    setSplits(newSplits);
  };

  const handleSubmit = async () => {
    if (!ledgerEntry) return;

    // Validation
    if (splits.length === 0) {
      setError('At least one split is required');
      return;
    }

    if (!splitReason.trim()) {
      setError('Split reason is required');
      return;
    }

    if (Math.abs(totalAmount - originalAmount) > 0.01) {
      setError(`Split amounts (${totalAmount}) must equal original amount (${originalAmount})`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post(`/api/ledger-splitting/${ledgerEntry.id}/split`, {
        splits,
        splitReason: splitReason.trim()
      });

      onSplitComplete();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to split ledger entry');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAmountDifference = () => {
    return totalAmount - originalAmount;
  };

  const getAmountDifferenceClass = () => {
    const diff = getAmountDifference();
    if (Math.abs(diff) < 0.01) return 'text-green-600';
    if (diff > 0) return 'text-red-600';
    return 'text-yellow-600';
  };

  if (!isOpen || !ledgerEntry) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Split Ledger Entry</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Original Entry Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">Original Entry</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Vendor:</span> {ledgerEntry.vendor_name}
            </div>
            <div>
              <span className="font-medium">Description:</span> {ledgerEntry.expense_description}
            </div>
            <div>
              <span className="font-medium">Planned Amount:</span> {formatCurrency(originalAmount)}
            </div>
            <div>
              <span className="font-medium">Planned Date:</span> {ledgerEntry.planned_date || 'N/A'}
            </div>
            {ledgerEntry.createdFromBOE && (
              <div className="col-span-2">
                <span className="font-medium text-blue-600">✓ BOE-Created Entry</span>
              </div>
            )}
          </div>
        </div>

        {/* Split Reason */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Split Reason *
          </label>
          <input
            type="text"
            value={splitReason}
            onChange={(e) => setSplitReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Why are you splitting this entry?"
          />
        </div>

        {/* BOE Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-blue-600">BOE Allocation Suggestions</h3>
              <button
                onClick={applyAllSuggestions}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Apply All
              </button>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                Based on your BOE allocation, here are suggested splits:
              </div>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="font-medium">{suggestion.description}</span>
                      <div className="text-gray-500">{suggestion.reason}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatCurrency(suggestion.plannedAmount)} on {suggestion.plannedDate}
                      </span>
                      <button
                        onClick={() => applySuggestion(suggestion)}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Splits */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Splits</h3>
            <button
              onClick={addSplit}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Add Split
            </button>
          </div>

          {splits.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No splits added yet. Click "Add Split" to begin.
            </div>
          ) : (
            <div className="space-y-3">
              {splits.map((split, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Split {index + 1}</h4>
                    <button
                      onClick={() => removeSplit(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Amount *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={split.plannedAmount}
                        onChange={(e) => updateSplit(index, 'plannedAmount', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={split.plannedDate}
                        onChange={(e) => updateSplit(index, 'plannedDate', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={split.description}
                        onChange={(e) => updateSplit(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={split.notes}
                        onChange={(e) => updateSplit(index, 'notes', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Amount Summary */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Split Amount:</span>
            <span className="font-bold">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Original Amount:</span>
            <span className="font-bold">{formatCurrency(originalAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Difference:</span>
            <span className={`font-bold ${getAmountDifferenceClass()}`}>
              {formatCurrency(getAmountDifference())}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || splits.length === 0 || !splitReason.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Splitting...' : 'Split Entry'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LedgerSplitModal; 