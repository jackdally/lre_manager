import React, { useState, useMemo } from 'react';
import { XMarkIcon, CurrencyDollarIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../../utils/currencyUtils';
import { riskOpportunityApi } from '../../../services/riskOpportunityApi';

interface MRUtilizationRequestProps {
  riskId: string;
  riskTitle: string;
  availableMR: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const MRUtilizationRequest: React.FC<MRUtilizationRequestProps> = ({
  riskId,
  riskTitle,
  availableMR,
  onSuccess,
  onCancel,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ amount?: string; reason?: string }>({});

  // Calculate utilization percentage
  const utilizationPercentage = useMemo(() => {
    if (!amount || !availableMR || availableMR === 0) return 0;
    return (amount / availableMR) * 100;
  }, [amount, availableMR]);

  // Validate form in real-time
  const validateForm = () => {
    const errors: { amount?: string; reason?: string } = {};
    
    if (!amount || amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    } else if (amount > availableMR) {
      errors.amount = `Amount cannot exceed available MR (${formatCurrency(availableMR)})`;
    }
    
    if (!reason.trim()) {
      errors.reason = 'Reason is required';
    } else if (reason.trim().length < 10) {
      errors.reason = 'Please provide a more detailed reason (at least 10 characters)';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await riskOpportunityApi.utilizeMRForRisk(riskId, amount, reason);
      onSuccess();
    } catch (err: any) {
      console.error('Error utilizing MR:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to utilize MR';
      setError(errorMessage);
      
      // If it's an amount-related error, show it in the amount field
      if (errorMessage.toLowerCase().includes('amount') || errorMessage.toLowerCase().includes('exceed')) {
        setValidationErrors({ amount: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update validation on change
  const handleAmountChange = (value: number) => {
    setAmount(value);
    setError(null);
    if (value > 0) {
      validateForm();
    }
  };

  const handleReasonChange = (value: string) => {
    setReason(value);
    setError(null);
    if (value.trim().length > 0) {
      validateForm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Request MR Utilization</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Risk Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-1">Risk:</p>
            <p className="text-sm text-blue-900">{riskTitle}</p>
          </div>

          {/* Available MR */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-800 font-medium mb-1">Available MR:</p>
                <p className="text-lg font-semibold text-green-900">{formatCurrency(availableMR)}</p>
              </div>
              {amount > 0 && (
                <div className="text-right">
                  <p className="text-xs text-green-700 mb-1">Will utilize:</p>
                  <p className="text-sm font-semibold text-green-900">
                    {utilizationPercentage.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Utilization Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="amount"
                min="0.01"
                max={availableMR}
                step="0.01"
                value={amount || ''}
                onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                className={`block w-full pl-7 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm ${
                  validationErrors.amount
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="0.00"
                required
              />
            </div>
            <div className="mt-1 space-y-1">
              {validationErrors.amount ? (
                <p className="text-xs text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  {validationErrors.amount}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Maximum: {formatCurrency(availableMR)}
                  {amount > 0 && availableMR > 0 && (
                    <span className="ml-2">({utilizationPercentage.toFixed(1)}% of available MR)</span>
                  )}
                </p>
              )}
              {amount > 0 && utilizationPercentage > 80 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                  <p className="text-xs text-yellow-800 flex items-center">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                    High utilization: This will use {utilizationPercentage.toFixed(1)}% of remaining MR
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Utilization *
              <span className="ml-2 text-xs text-gray-500 font-normal">
                ({reason.trim().length} / 10 minimum characters)
              </span>
            </label>
            <textarea
              id="reason"
              rows={4}
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm ${
                validationErrors.reason
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Explain why MR is being utilized for this risk. Include details about how the risk materialized and why MR is needed..."
              required
            />
            <div className="mt-1 space-y-1">
              {validationErrors.reason ? (
                <p className="text-xs text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  {validationErrors.reason}
                </p>
              ) : (
                <div className="flex items-start">
                  <InformationCircleIcon className="h-3 w-3 mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-500">
                    Provide a clear explanation of why MR is needed for this materialized risk. 
                    This helps with tracking and audit purposes.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && !validationErrors.amount && !validationErrors.reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 mb-1">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !amount || !reason.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Request Utilization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MRUtilizationRequest;

