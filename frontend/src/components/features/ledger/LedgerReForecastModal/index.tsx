import React, { useState, useEffect } from 'react';
import { LedgerEntry } from '../../../../types/ledger';
import axios from 'axios';
import { 
  XMarkIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  DocumentMagnifyingGlassIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface ReForecastSuggestion {
  plannedAmount: number;
  plannedDate: string;
  reason: string;
  type?: 'overrun' | 'underspend' | 'schedule_change' | 'boe_allocation';
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

type WizardStep = 'overview' | 'amount' | 'date' | 'reason' | 'preview' | 'complete';

const LedgerReForecastModal: React.FC<LedgerReForecastModalProps> = ({
  isOpen,
  onClose,
  ledgerEntry,
  onReForecastComplete,
  actualTransaction
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('overview');
  const [newPlannedAmount, setNewPlannedAmount] = useState(0);
  const [newPlannedDate, setNewPlannedDate] = useState('');
  const [reForecastReason, setReForecastReason] = useState('');
  const [suggestions, setSuggestions] = useState<ReForecastSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isOpen && ledgerEntry) {
      setCurrentStep('overview');
      setNewPlannedAmount(ledgerEntry.planned_amount || 0);
      setNewPlannedDate(ledgerEntry.planned_date || new Date().toISOString().split('T')[0]);
      setReForecastReason('');
      setError(null);
      setIsComplete(false);
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
      // Build query parameters for actual transaction data
      const params = new URLSearchParams();
      if (actualTransaction) {
        params.append('actualAmount', actualTransaction.amount.toString());
        params.append('actualDate', actualTransaction.date);
      }

      const response = await axios.get(`/api/ledger-splitting/${ledgerEntry.id}/re-forecast-suggestions?${params.toString()}`);
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
    setCurrentStep('preview');
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

      setIsComplete(true);
      setCurrentStep('complete');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to re-forecast entry');
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
    return newPlannedAmount - (ledgerEntry?.planned_amount || 0);
  };

  const getAmountDifferenceClass = () => {
    const diff = getAmountDifference();
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBaselineWarning = () => {
    if (!ledgerEntry?.baseline_amount) return null;
    
    const diff = newPlannedAmount - ledgerEntry.baseline_amount;
    if (diff > 0) {
      return `Warning: New amount exceeds baseline by ${formatCurrency(diff)}`;
    }
    return null;
  };

  const getStepStatus = (step: WizardStep) => {
    if (currentStep === step) return 'current';
    if (currentStep === 'complete') return 'complete';
    
    const stepOrder: WizardStep[] = ['overview', 'amount', 'date', 'reason', 'preview', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    return stepIndex < currentIndex ? 'complete' : 'upcoming';
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'overview':
        return true;
      case 'amount':
        return newPlannedAmount > 0;
      case 'date':
        return newPlannedDate && newPlannedAmount > 0;
      case 'reason':
        return newPlannedDate && newPlannedAmount > 0 && reForecastReason.trim();
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const stepOrder: WizardStep[] = ['overview', 'amount', 'date', 'reason', 'preview', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const stepOrder: WizardStep[] = ['overview', 'amount', 'date', 'reason', 'preview', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'overview', label: 'Overview', icon: InformationCircleIcon },
      { key: 'amount', label: 'Amount', icon: CurrencyDollarIcon },
      { key: 'date', label: 'Date', icon: CalendarIcon },
      { key: 'reason', label: 'Reason', icon: ChatBubbleLeftRightIcon },
      { key: 'preview', label: 'Preview', icon: DocumentMagnifyingGlassIcon }
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const status = getStepStatus(step.key as WizardStep);
          const Icon = step.icon;
          
          return (
            <div key={step.key} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                status === 'complete' ? 'bg-green-500 border-green-500 text-white' :
                status === 'current' ? 'bg-blue-500 border-blue-500 text-white' :
                'bg-gray-100 border-gray-300 text-gray-400'
              }`}>
                {status === 'complete' ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <div className="ml-3">
                <div className={`text-sm font-medium ${
                  status === 'complete' ? 'text-green-600' :
                  status === 'current' ? 'text-blue-600' :
                  'text-gray-400'
                }`}>
                  {step.label}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  status === 'complete' ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderOverviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <ArrowPathIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Re-forecast Ledger Entry</h3>
        <p className="text-gray-600">Update the planned amount and date for this ledger entry based on actual data.</p>
      </div>

      {/* Original Entry Info */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DocumentMagnifyingGlassIcon className="h-5 w-5" />
          Original Entry Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Vendor:</span>
            <span className="ml-2 text-gray-900">{ledgerEntry?.vendor_name}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Description:</span>
            <span className="ml-2 text-gray-900">{ledgerEntry?.expense_description}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Current Planned Amount:</span>
            <span className="ml-2 font-semibold text-blue-700">{formatCurrency(ledgerEntry?.planned_amount || 0)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Current Planned Date:</span>
            <span className="ml-2 text-gray-900">{ledgerEntry?.planned_date || 'N/A'}</span>
          </div>
          {ledgerEntry?.baseline_amount && (
            <div>
              <span className="font-medium text-gray-600">Baseline Amount:</span>
              <span className="ml-2 font-semibold text-green-700">{formatCurrency(ledgerEntry.baseline_amount)}</span>
            </div>
          )}
          {ledgerEntry?.createdFromBOE && (
            <div className="md:col-span-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                BOE-Created Entry
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actual Transaction Info */}
      {actualTransaction && (
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <InformationCircleIcon className="h-5 w-5" />
            Actual Transaction Data
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-700">Actual Amount:</span>
              <span className="ml-2 font-semibold text-blue-900">{formatCurrency(actualTransaction.amount)}</span>
            </div>
            <div>
              <span className="font-medium text-blue-700">Actual Date:</span>
              <span className="ml-2 text-blue-900">{actualTransaction.date}</span>
            </div>
            {actualTransaction.description && (
              <div className="md:col-span-2">
                <span className="font-medium text-blue-700">Description:</span>
                <span className="ml-2 text-blue-900">{actualTransaction.description}</span>
              </div>
            )}
          </div>
        </div>
      )}

             {/* Smart Re-forecast Suggestions */}
       {suggestions.length > 0 && (
         <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
           <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
             <InformationCircleIcon className="h-5 w-5" />
             Smart Re-forecast Suggestions
           </h4>
           <p className="text-sm text-blue-700 mb-4">
             Based on your actual transaction and BOE allocation, here are suggested re-forecasts:
           </p>
           <div className="space-y-3">
             {suggestions.map((suggestion, index) => {
               // Determine styling based on suggestion type
               const getSuggestionStyle = () => {
                 switch (suggestion.type) {
                   case 'overrun':
                     return 'bg-red-50 border-red-200 text-red-800';
                   case 'underspend':
                     return 'bg-green-50 border-green-200 text-green-800';
                   case 'schedule_change':
                     return 'bg-purple-50 border-purple-200 text-purple-800';
                   case 'boe_allocation':
                     return 'bg-yellow-50 border-yellow-200 text-yellow-800';
                   default:
                     return 'bg-white border-gray-200 text-gray-800';
                 }
               };

               const getButtonStyle = () => {
                 switch (suggestion.type) {
                   case 'overrun':
                     return 'bg-red-600 hover:bg-red-700';
                   case 'underspend':
                     return 'bg-green-600 hover:bg-green-700';
                   case 'schedule_change':
                     return 'bg-purple-600 hover:bg-purple-700';
                   case 'boe_allocation':
                     return 'bg-yellow-600 hover:bg-yellow-700';
                   default:
                     return 'bg-blue-600 hover:bg-blue-700';
                 }
               };

               return (
                 <div key={index} className={`flex justify-between items-center p-3 rounded border ${getSuggestionStyle()}`}>
                   <div className="text-sm flex-1">
                     <div className="font-medium">{suggestion.reason}</div>
                     {suggestion.type && (
                       <div className="text-xs opacity-75 mt-1">
                         Type: {suggestion.type.replace('_', ' ')}
                       </div>
                     )}
                   </div>
                   <div className="flex items-center gap-3 ml-4">
                     <span className="text-sm font-medium">
                       {formatCurrency(suggestion.plannedAmount)} on {suggestion.plannedDate}
                     </span>
                     <button
                       onClick={() => applySuggestion(suggestion)}
                       className={`text-xs text-white px-3 py-1.5 rounded transition-colors ${getButtonStyle()}`}
                     >
                       Apply
                     </button>
                   </div>
                 </div>
               );
             })}
           </div>
         </div>
       )}
    </div>
  );

  const renderAmountStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CurrencyDollarIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Update Planned Amount</h3>
        <p className="text-gray-600">Enter the new planned amount for this ledger entry.</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Planned Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={newPlannedAmount}
                onChange={(e) => setNewPlannedAmount(parseFloat(e.target.value) || 0)}
                className="block w-full pl-7 pr-12 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Amount Comparison */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="font-medium text-gray-900 mb-3">Amount Comparison</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Planned:</span>
                <span className="font-medium">{formatCurrency(ledgerEntry?.planned_amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New Planned:</span>
                <span className="font-semibold text-blue-700">{formatCurrency(newPlannedAmount)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Change:</span>
                <span className={`font-bold ${getAmountDifferenceClass()}`}>
                  {formatCurrency(getAmountDifference())}
                </span>
              </div>
            </div>
          </div>

          {/* Baseline Warning */}
          {getBaselineWarning() && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">{getBaselineWarning()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDateStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CalendarIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Update Planned Date</h3>
        <p className="text-gray-600">Select the new planned date for this ledger entry.</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Planned Date *
            </label>
            <input
              type="date"
              value={newPlannedDate}
              onChange={(e) => setNewPlannedDate(e.target.value)}
              className="block w-full py-3 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date Comparison */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="font-medium text-gray-900 mb-3">Date Comparison</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Planned:</span>
                <span className="font-medium">{ledgerEntry?.planned_date || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New Planned:</span>
                <span className="font-semibold text-blue-700">{newPlannedDate || 'Not set'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReasonStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Provide Re-forecast Reason</h3>
        <p className="text-gray-600">Explain why you are re-forecasting this entry.</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Re-forecast Reason *
          </label>
          <textarea
            value={reForecastReason}
            onChange={(e) => setReForecastReason(e.target.value)}
            rows={4}
            className="block w-full py-3 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Explain why you are re-forecasting this entry (e.g., actual invoice received, schedule change, etc.)"
          />
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Changes</h3>
        <p className="text-gray-600">Review your re-forecast changes before applying them.</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="space-y-4">
          {/* Summary of Changes */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="font-medium text-gray-900 mb-3">Summary of Changes</h5>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Planned Amount:</span>
                <div className="text-right">
                  <div className="text-gray-400 line-through">{formatCurrency(ledgerEntry?.planned_amount || 0)}</div>
                  <div className="font-semibold text-blue-700">{formatCurrency(newPlannedAmount)}</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Planned Date:</span>
                <div className="text-right">
                  <div className="text-gray-400 line-through">{ledgerEntry?.planned_date || 'N/A'}</div>
                  <div className="font-semibold text-blue-700">{newPlannedDate}</div>
                </div>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Total Change:</span>
                <span className={`font-bold ${getAmountDifferenceClass()}`}>
                  {formatCurrency(getAmountDifference())}
                </span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="font-medium text-gray-900 mb-2">Re-forecast Reason</h5>
            <p className="text-sm text-gray-700">{reForecastReason}</p>
          </div>

          {/* Warnings */}
          {getBaselineWarning() && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">{getBaselineWarning()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
        <CheckCircleIcon className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Re-forecast Complete!</h3>
        <p className="text-gray-600">
          The ledger entry has been successfully re-forecast with the new planned amount and date.
        </p>
      </div>
      
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="text-sm text-green-800">
          <div className="font-medium mb-2">Updated Entry Details:</div>
          <div className="space-y-1">
            <div>Amount: {formatCurrency(newPlannedAmount)}</div>
            <div>Date: {newPlannedDate}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'overview':
        return renderOverviewStep();
      case 'amount':
        return renderAmountStep();
      case 'date':
        return renderDateStep();
      case 'reason':
        return renderReasonStep();
      case 'preview':
        return renderPreviewStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };

  if (!isOpen || !ledgerEntry) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <ArrowPathIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Re-forecast Ledger Entry</h2>
              <p className="text-sm text-gray-600">
                {ledgerEntry.vendor_name} - {ledgerEntry.expense_description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Step Indicator */}
        {currentStep !== 'complete' && (
          <div className="px-6 pt-6">
            {renderStepIndicator()}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderCurrentStep()}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {currentStep !== 'complete' && (
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={currentStep === 'overview' ? onClose : handlePrevious}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              {currentStep === 'overview' ? 'Cancel' : 'Previous'}
            </button>
            
            <div className="flex gap-3">
              {currentStep === 'preview' && (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !canProceedToNext()}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Re-forecasting...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-4 w-4" />
                      Apply Re-forecast
                    </>
                  )}
                </button>
              )}
              
              {currentStep !== 'preview' && (
                <button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}

        {/* Complete Step Actions */}
        {currentStep === 'complete' && (
          <div className="flex justify-center p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onReForecastComplete}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LedgerReForecastModal; 