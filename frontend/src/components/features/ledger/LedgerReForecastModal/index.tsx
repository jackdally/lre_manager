import React, { useState, useEffect } from 'react';
import { LedgerEntry } from '../../../../types/ledger';
import axios from 'axios';

interface ReForecastSuggestion {
  plannedAmount: number;
  plannedDate: string;
  reason: string;
}

interface LedgerReForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerEntry: LedgerEntry | null;
  onReForecastComplete: () => void;
  actualTransaction?: {
    amount: number;
    date: string;
    description?: string;
  };
}

const LedgerReForecastModal: React.FC<LedgerReForecastModalProps> = ({
  isOpen,
  onClose,
  ledgerEntry,
  onReForecastComplete,
  actualTransaction
}) => {
  const [newPlannedAmount, setNewPlannedAmount] = useState(0);
  const [newPlannedDate, setNewPlannedDate] = useState('');
  const [reForecastReason, setReForecastReason] = useState('');
  const [suggestions, setSuggestions] = useState<ReForecastSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && ledgerEntry) {
      setNewPlannedAmount(ledgerEntry.planned_amount || 0);
      setNewPlannedDate(ledgerEntry.planned_date || new Date().toISOString().split('T')[0]);
      setReForecastReason('');
      setError(null);
      loadSuggestions();
      
      // Auto-populate re-forecast if actual transaction data is provided
      if (actualTransaction) {
        setNewPlannedAmount(actualTransaction.amount);
        setNewPlannedDate(actualTransaction.date);
        setReForecastReason(`Re-forecast based on actual invoice: ${actualTransaction.amount} on ${actualTransaction.date}`);
      }
    }
  }, [isOpen, ledgerEntry, actualTransaction]);

  const loadSuggestions = async () => {
    if (!ledgerEntry) return;

    try {
      const response = await axios.get(`/api/ledger-splitting/${ledgerEntry.id}/re-forecast-suggestions`);
      const data = response.data as { suggestions: ReForecastSuggestion[] };
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error loading re-forecast suggestions:', error);
    }
  };

  const applySuggestion = (suggestion: ReForecastSuggestion) => {
    setNewPlannedAmount(suggestion.plannedAmount);
    setNewPlannedDate(suggestion.plannedDate);
    setReForecastReason(suggestion.reason);
  };

  const handleSubmit = async () => {
    if (!ledgerEntry) return;

    // Validation
    if (newPlannedAmount <= 0) {
      setError('New planned amount must be greater than 0');
      return;
    }

    if (!newPlannedDate) {
      setError('New planned date is required');
      return;
    }

    if (!reForecastReason.trim()) {
      setError('Re-forecast reason is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post(`/api/ledger-splitting/${ledgerEntry.id}/re-forecast`, {
        newPlannedAmount,
        newPlannedDate,
        reForecastReason: reForecastReason.trim()
      });

      onReForecastComplete();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to re-forecast ledger entry');
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
    if (!ledgerEntry) return 0;
    return newPlannedAmount - (ledgerEntry.planned_amount || 0);
  };

  const getAmountDifferenceClass = () => {
    const diff = getAmountDifference();
    if (Math.abs(diff) < 0.01) return 'text-green-600';
    if (diff > 0) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getBaselineWarning = () => {
    if (!ledgerEntry || !ledgerEntry.createdFromBOE) return null;
    
    const baselineAmount = ledgerEntry.baseline_amount || 0;
    if (newPlannedAmount > baselineAmount) {
      return `Warning: New planned amount (${formatCurrency(newPlannedAmount)}) exceeds baseline amount (${formatCurrency(baselineAmount)})`;
    }
    return null;
  };

  if (!isOpen || !ledgerEntry) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Re-forecast Ledger Entry</h2>
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
              <span className="font-medium">Current Planned Amount:</span> {formatCurrency(ledgerEntry.planned_amount || 0)}
            </div>
            <div>
              <span className="font-medium">Current Planned Date:</span> {ledgerEntry.planned_date || 'N/A'}
            </div>
            {ledgerEntry.baseline_amount && (
              <div>
                <span className="font-medium">Baseline Amount:</span> {formatCurrency(ledgerEntry.baseline_amount)}
              </div>
            )}
            {ledgerEntry.createdFromBOE && (
              <div>
                <span className="font-medium text-blue-600">✓ BOE-Created Entry</span>
              </div>
            )}
          </div>
        </div>

        {/* BOE Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-blue-600 mb-2">BOE Allocation Suggestions</h3>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                Based on your BOE allocation, here are suggested re-forecasts:
              </div>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="text-sm">
                      <div className="font-medium">{suggestion.reason}</div>
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

        {/* Re-forecast Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Planned Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={newPlannedAmount}
              onChange={(e) => setNewPlannedAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Planned Date *
            </label>
            <input
              type="date"
              value={newPlannedDate}
              onChange={(e) => setNewPlannedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Re-forecast Reason *
            </label>
            <textarea
              value={reForecastReason}
              onChange={(e) => setReForecastReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Why are you re-forecasting this entry?"
            />
          </div>
        </div>

        {/* Amount Summary */}
        <div className="bg-gray-50 p-3 rounded-lg my-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">New Planned Amount:</span>
            <span className="font-bold">{formatCurrency(newPlannedAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Current Planned Amount:</span>
            <span className="font-bold">{formatCurrency(ledgerEntry.planned_amount || 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Change:</span>
            <span className={`font-bold ${getAmountDifferenceClass()}`}>
              {formatCurrency(getAmountDifference())}
            </span>
          </div>
        </div>

        {/* Baseline Warning */}
        {getBaselineWarning() && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
            {getBaselineWarning()}
          </div>
        )}

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
            disabled={loading || newPlannedAmount <= 0 || !newPlannedDate || !reForecastReason.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Re-forecasting...' : 'Re-forecast Entry'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LedgerReForecastModal; 