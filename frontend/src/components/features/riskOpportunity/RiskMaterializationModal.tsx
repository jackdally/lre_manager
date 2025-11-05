import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { useRiskOpportunityStore } from '../../../store/riskOpportunityStore';
import type { Risk } from '../../../store/riskOpportunityStore';
import { InformationCircleIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../../utils/currencyUtils';

interface RiskMaterializationModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  risk: Risk | null;
  onSave: (risk: Risk) => void;
  onMRUpdate?: () => void;
}

const RiskMaterializationModal: React.FC<RiskMaterializationModalProps> = ({
  isOpen,
  onClose,
  programId,
  risk,
  onSave,
  onMRUpdate,
}) => {
  const { materializeRisk } = useRiskOpportunityStore();
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && risk) {
      setAmount('');
      setReason('');
      setError(null);
    }
  }, [isOpen, risk]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!risk) return;

    if (!amount || !amount.trim()) {
      setError('MR utilization amount is required');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!reason || !reason.trim()) {
      setError('Reason for MR utilization is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedRisk = await materializeRisk(risk.id, amountNum, reason);
      onSave(updatedRisk);
      if (onMRUpdate) {
        onMRUpdate();
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to materialize risk');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !risk) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Materialize Risk & Use Management Reserve"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">Materializing this risk will:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Utilize Management Reserve</li>
                  <li>Change disposition from <span className="font-semibold">"{risk.disposition}"</span> to <span className="font-semibold">"Realized"</span></li>
                  <li>Mark the risk as closed (terminal state)</li>
                </ul>
                <p className="mt-2">
                  This indicates the risk has occurred and MR is being used to cover the cost.
                </p>
              </div>
            </div>
          </div>

          {/* Risk Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Risk Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Title:</span>
                <p className="font-medium text-gray-900">{risk.title}</p>
              </div>
              <div>
                <span className="text-gray-600">Current Disposition:</span>
                <p className="font-medium text-gray-900">{risk.disposition}</p>
              </div>
              {risk.expectedValue && (
                <div>
                  <span className="text-gray-600">Expected Value:</span>
                  <p className="font-medium text-gray-900">{formatCurrency(risk.expectedValue)}</p>
                </div>
              )}
            </div>
          </div>

          {/* MR Utilization Amount */}
          <div>
            <label htmlFor="mr-amount" className="block text-sm font-medium text-gray-700 mb-2">
              MR Utilization Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="mr-amount"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                disabled={loading}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enter the amount of Management Reserve to utilize for this risk.
            </p>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="mr-reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for MR Utilization *
            </label>
            <textarea
              id="mr-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why MR is being utilized for this risk. Include details about how the risk materialized..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              This reason will be included in the risk disposition and MR utilization history.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount || !reason.trim()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Materializing...
                </>
              ) : (
                <>
                  <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                  Materialize & Use MR
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default RiskMaterializationModal;

