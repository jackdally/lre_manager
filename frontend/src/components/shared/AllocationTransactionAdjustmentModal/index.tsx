import React, { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { LedgerEntry } from '../../../types/ledger';
import {
  transactionAdjustmentApi,
  type AdjustmentScenario,
  type AvailableScenarios,
  type AllocationImpact,
  type PartialDeliveryRequest,
  type ReForecastRequest,
  type ScheduleChangeRequest,
  type AllocationImpactRequest
} from '../../../services/transactionAdjustmentApi';
import axios from 'axios'; // Added axios import

interface AllocationTransactionAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerEntry: LedgerEntry | null;
  actualTransaction?: {
    amount: number;
    date: string;
    description?: string;
  };
  transactionId?: string; // Add transaction ID for match confirmation
  onAdjustmentComplete: () => void;
  onLedgerRefresh?: () => void; // Add callback to refresh ledger table
  programId?: string; // Add programId for ledger link
}

type WizardStep = 'scenario' | 'configuration' | 'allocation-impact' | 'preview' | 'complete';

interface Split {
  id: string;
  amount: number;
  date: string;
  description: string;
}

const AllocationTransactionAdjustmentModal: React.FC<AllocationTransactionAdjustmentModalProps> = ({
  isOpen,
  onClose,
  ledgerEntry,
  actualTransaction,
  transactionId,
  onAdjustmentComplete,
  onLedgerRefresh,
  programId
}) => {
  // State
  const [currentStep, setCurrentStep] = useState<WizardStep>('scenario');
  const [selectedScenario, setSelectedScenario] = useState<AdjustmentScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API data state
  const [availableScenarios, setAvailableScenarios] = useState<AvailableScenarios | null>(null);
  const [allocationImpact, setAllocationImpact] = useState<AllocationImpact | null>(null);

  // Configuration state for each scenario
  const [configuration, setConfiguration] = useState({
    // Partial delivery configuration
    remainingAmount: 0,
    remainingDate: '',

    // Re-forecast configuration
    relevelingScope: 'remaining' as 'single' | 'remaining' | 'entire',
    relevelingAlgorithm: 'linear' as 'linear' | 'front-loaded' | 'back-loaded' | 'custom',
    baselineExceedanceJustification: '',

    // Schedule change configuration
    newPlannedDate: '',

    // General configuration
    reason: ''
  });

  // Custom manual distribution state
  const [customDistribution, setCustomDistribution] = useState<{ [key: string]: number }>({});

  // Weight customization state for front/back loaded algorithms
  const [weightIntensity, setWeightIntensity] = useState(0.5); // 0 = strong, 0.5 = moderate, 1 = linear
  const [splits, setSplits] = useState<Split[]>([]);

  // Success message state
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    message: string;
    ledgerLink?: string;
  } | null>(null);

  // Load available scenarios from API
  const loadAvailableScenarios = useCallback(async () => {
    if (!ledgerEntry || !actualTransaction) return;

    setLoading(true);
    setError(null);

    try {
      const scenarios = await transactionAdjustmentApi.getAvailableScenarios(
        ledgerEntry.id,
        actualTransaction.amount,
        actualTransaction.date
      );
      setAvailableScenarios(scenarios);
    } catch (err) {
      console.error('Error loading scenarios:', err);
      setError('Failed to load available scenarios. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [ledgerEntry, actualTransaction]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && ledgerEntry && actualTransaction) {
      setCurrentStep('scenario');
      setSelectedScenario(null);
      setConfiguration({
        remainingAmount: 0,
        remainingDate: '',
        relevelingScope: 'remaining',
        relevelingAlgorithm: 'linear',
        baselineExceedanceJustification: '',
        newPlannedDate: '',
        reason: ''
      });
      setCustomDistribution({});
      setWeightIntensity(0.5);
      setError(null);
      setAllocationImpact(null);
      setSplits([]); // Reset splits
      setSuccessMessage(null); // Reset success message

      // Load available scenarios from API
      loadAvailableScenarios();
    }
  }, [isOpen, ledgerEntry, actualTransaction]);

  // Reset custom distribution when algorithm changes
  useEffect(() => {
    if (configuration.relevelingAlgorithm === 'custom') {
      setCustomDistribution({});
    }
  }, [configuration.relevelingAlgorithm]);

  // Calculate allocation impact from API
  const calculateAllocationImpact = async () => {
    if (!ledgerEntry || !selectedScenario) return;

    setLoading(true);
    setError(null);

    try {
      const request: AllocationImpactRequest = {
        ledgerEntryId: ledgerEntry.id,
        scenario: selectedScenario,
        remainingAmount: configuration.remainingAmount,
        remainingDate: configuration.remainingDate,
        relevelingScope: configuration.relevelingScope,
        relevelingAlgorithm: configuration.relevelingAlgorithm,
        weightIntensity,
        customDistribution,
        actualAmount: actualTransaction?.amount,
        actualDate: actualTransaction?.date
      };

      // Add splits data for Partial Delivery
      if (selectedScenario === 'partial_delivery' && splits.length > 0) {
        request.splits = splits.map(split => ({
          amount: split.amount,
          date: split.date,
          description: split.description
        }));
      }

      const impact = await transactionAdjustmentApi.calculateAllocationImpact(request);
      setAllocationImpact(impact);
    } catch (err) {
      console.error('Error calculating allocation impact:', err);
      setError('Failed to calculate allocation impact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Apply the adjustment
  const applyAdjustment = async () => {
    if (!ledgerEntry || !selectedScenario) return;

    setLoading(true);
    setError(null);

    try {
      switch (selectedScenario) {
        case 'partial_delivery':
          const partialDeliveryRequest: PartialDeliveryRequest = {
            ledgerEntryId: ledgerEntry.id,
            splits: splits.map(split => ({
              amount: split.amount,
              date: split.date,
              description: split.description
            })),
            reason: configuration.reason,
            actualAmount: actualTransaction?.amount,
            actualDate: actualTransaction?.date
          };
          await transactionAdjustmentApi.applyPartialDelivery(partialDeliveryRequest);
          break;

        case 'cost_overrun':
        case 'cost_underspend':
          const reForecastRequest: ReForecastRequest = {
            ledgerEntryId: ledgerEntry.id,
            scenario: selectedScenario,
            relevelingScope: configuration.relevelingScope,
            relevelingAlgorithm: configuration.relevelingAlgorithm,
            weightIntensity,
            customDistribution,
            baselineExceedanceJustification: configuration.baselineExceedanceJustification,
            reason: configuration.reason,
            actualAmount: actualTransaction?.amount,
            actualDate: actualTransaction?.date
          };
          await transactionAdjustmentApi.applyReForecast(reForecastRequest);
          break;

        case 'schedule_change':
          const scheduleChangeRequest: ScheduleChangeRequest = {
            ledgerEntryId: ledgerEntry.id,
            newPlannedDate: configuration.newPlannedDate,
            reason: configuration.reason
          };
          await transactionAdjustmentApi.applyScheduleChange(scheduleChangeRequest);
          break;

        default:
          throw new Error('Invalid scenario');
      }

      // CRITICAL: After applying the adjustment, also confirm the match
      // This ensures the transaction is marked as confirmed and shows the "View Upload" link
      if (actualTransaction && transactionId) {
        try {
          // Call the confirm match API directly
          await axios.post(`/api/import/transaction/${transactionId}/confirm-match`, {
            ledgerEntryId: ledgerEntry.id
          });
        } catch (confirmError) {
          console.error('Error confirming match after adjustment:', confirmError);
          // Don't throw here - the adjustment was successful, just the match confirmation failed
          // The user can still see the adjustment was applied
        }
      }

      // Move to complete step
      setCurrentStep('complete');
      onAdjustmentComplete();
      onLedgerRefresh?.(); // Call the callback after adjustment is complete

      // Show success message with link to ledger page
      setSuccessMessage({
        title: 'Adjustment Applied Successfully!',
        message: 'The transaction has been split and the match has been confirmed. You can now view the updated ledger entries.',
        ledgerLink: programId ? `/programs/${programId}/ledger?highlight=${ledgerEntry.id}` : undefined
      });
    } catch (err) {
      console.error('Error applying adjustment:', err);
      setError('Failed to apply adjustment. Please try again.');
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

  const getStepStatus = (step: WizardStep) => {
    const stepOrder: WizardStep[] = ['scenario', 'configuration', 'allocation-impact', 'preview', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'scenario':
        return selectedScenario !== null;
      case 'configuration':
        if (!selectedScenario) return false;
        if (!configuration.reason) return false;

        switch (selectedScenario) {
          case 'partial_delivery':
            if (!ledgerEntry || !actualTransaction) return false;
            const plannedAmount = ledgerEntry.planned_amount || 0;
            const actualAmount = actualTransaction.amount;
            const totalSplitsAmount = splits.reduce((sum, split) => sum + split.amount, 0);
            const remainingAmount = plannedAmount - actualAmount - totalSplitsAmount;

            // Check if at least one split is provided
            const hasSplits = splits.length > 0;

            // Check if all splits have required fields
            const allSplitsValid = splits.every(split =>
              split.amount > 0 && split.date !== ''
            );

            // Check if total splits don't exceed remaining amount
            const splitsWithinBudget = remainingAmount >= 0;

            return hasSplits && allSplitsValid && splitsWithinBudget;
          case 'cost_overrun':
          case 'cost_underspend':
            return configuration.relevelingScope && configuration.relevelingAlgorithm;
          case 'schedule_change':
            return configuration.newPlannedDate !== '';
          default:
            return false;
        }
      case 'allocation-impact':
        return true; // Always allow proceeding from allocation impact
      case 'preview':
        return true; // Always allow proceeding from preview
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 'configuration' && selectedScenario) {
      // Calculate allocation impact when moving from configuration to allocation-impact
      calculateAllocationImpact();
    } else if (currentStep === 'preview') {
      // Apply the adjustment when moving from preview to complete
      applyAdjustment();
      return; // Don't advance step yet, wait for API response
    }

    const stepOrder: WizardStep[] = ['scenario', 'configuration', 'allocation-impact', 'preview', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const stepOrder: WizardStep[] = ['scenario', 'configuration', 'allocation-impact', 'preview', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'scenario', label: 'Adjustment Type', icon: InformationCircleIcon },
      { key: 'configuration', label: 'Settings', icon: CurrencyDollarIcon },
      { key: 'allocation-impact', label: 'Impact Preview', icon: ChatBubbleLeftRightIcon },
      { key: 'preview', label: 'Confirm', icon: DocumentMagnifyingGlassIcon }
    ];

    return (
      <div className="flex items-center justify-between mb-8 overflow-x-auto">
        {steps.map((step, index) => {
          const status = getStepStatus(step.key as WizardStep);
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-center flex-shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                status === 'current' ? 'bg-blue-500 border-blue-500 text-white' :
                  'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                {status === 'completed' ? (
                  <CheckCircleIcon className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="ml-2">
                <div className={`text-xs font-medium ${status === 'completed' ? 'text-green-600' :
                  status === 'current' ? 'text-blue-600' :
                    'text-gray-400'
                  }`}>
                  {step.label}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderScenarioStep = () => {
    if (loading || !availableScenarios) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available scenarios...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadAvailableScenarios}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!availableScenarios.available || availableScenarios.available.length === 0) {
      return (
        <div className="text-center py-8">
          <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No adjustment scenarios available for this transaction.</p>
        </div>
      );
    }

    // Map scenario IDs to icons and colors for display
    const getScenarioDisplay = (scenarioId: AdjustmentScenario) => {
      switch (scenarioId) {
        case 'partial_delivery':
          return { icon: ArrowRightIcon, color: 'blue' };
        case 'cost_overrun':
          return { icon: ArrowPathIcon, color: 'red' };
        case 'cost_underspend':
          return { icon: ArrowPathIcon, color: 'green' };
        case 'schedule_change':
          return { icon: CalendarIcon, color: 'purple' };
        default:
          return { icon: InformationCircleIcon, color: 'gray' };
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Adjustment Scenario</h3>
          <p className="text-gray-600">
            Choose how to handle the mismatch between planned and actual transaction data.
          </p>
        </div>

        {/* Transaction Summary */}
        {ledgerEntry && actualTransaction && (
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-4">Transaction Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Planned Amount:</span>
                <span className="font-semibold text-blue-900 ml-2">
                  {formatCurrency(ledgerEntry.planned_amount || 0)}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Actual Amount:</span>
                <span className="font-semibold text-blue-900 ml-2">
                  {formatCurrency(actualTransaction.amount)}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Planned Date:</span>
                <span className="font-semibold text-blue-900 ml-2">
                  {ledgerEntry.planned_date || 'Not set'}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Actual Date:</span>
                <span className="font-semibold text-blue-900 ml-2">
                  {actualTransaction.date}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scenario Options */}
        <div className="space-y-3">
          {availableScenarios.available.map((scenario) => {
            const display = getScenarioDisplay(scenario.id);
            const Icon = display.icon;
            const isSelected = selectedScenario === scenario.id;
            const isRecommended = scenario.recommended;

            return (
              <div
                key={scenario.id}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                  ? `border-${display.color}-500 bg-${display.color}-50`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                onClick={() => setSelectedScenario(scenario.id)}
              >
                {isRecommended && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Recommended
                  </div>
                )}

                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-${display.color}-100 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${display.color}-600`} />
                  </div>

                  <div className="flex-1">
                    <h4 className={`font-semibold ${isSelected ? `text-${display.color}-900` : 'text-gray-900'
                      }`}>
                      {scenario.title}
                    </h4>
                    <p className={`text-sm mt-1 ${isSelected ? `text-${display.color}-700` : 'text-gray-600'
                      }`}>
                      {scenario.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded-full border-2 ${isSelected
                      ? `border-${display.color}-500 bg-${display.color}-500`
                      : 'border-gray-300'
                      }`}>
                      {isSelected && (
                        <div className={`w-full h-full rounded-full bg-${display.color}-500 flex items-center justify-center`}>
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderConfigurationStep = () => {
    if (!selectedScenario) return null;

    switch (selectedScenario) {
      case 'partial_delivery':
        return renderPartialDeliveryConfiguration();
      case 'cost_overrun':
      case 'cost_underspend':
        return renderReForecastConfiguration();
      case 'schedule_change':
        return renderScheduleChangeConfiguration();
      default:
        return null;
    }
  };

  const renderPartialDeliveryConfiguration = () => {
    if (!ledgerEntry || !actualTransaction) return null;

    const plannedAmount = ledgerEntry.planned_amount || 0;
    const actualAmount = actualTransaction.amount;
    const totalSplitsAmount = splits.reduce((sum, split) => sum + split.amount, 0);
    const remainingAmount = plannedAmount - actualAmount - totalSplitsAmount;

    const addSplit = () => {
      const newSplit: Split = {
        id: Date.now().toString(),
        amount: 0,
        date: '',
        description: ''
      };
      setSplits(prev => [...prev, newSplit]);
    };

    const removeSplit = (id: string) => {
      setSplits(prev => prev.filter(split => split.id !== id));
    };

    const updateSplit = (id: string, field: keyof Split, value: string | number) => {
      setSplits(prev => prev.map(split =>
        split.id === id ? { ...split, [field]: value } : split
      ));
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <ArrowRightIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Split Entry Configuration</h3>
          <p className="text-gray-600">Configure the splits for partial delivery scenario.</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-4">Split Summary</h4>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">Delivered Portion</h5>
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-semibold">{formatCurrency(actualAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{actualTransaction.date}</span>
                </div>
              </div>
            </div>

            {/* Multiple Splits */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-blue-900">Future Splits</h5>
                <button
                  type="button"
                  onClick={addSplit}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Split
                </button>
              </div>

              {splits.map((split, index) => (
                <div key={split.id} className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h6 className="font-medium text-blue-900">Split {index + 1}</h6>
                    <button
                      type="button"
                      onClick={() => removeSplit(split.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount *
                      </label>
                      <input
                        type="number"
                        value={split.amount || ''}
                        onChange={(e) => updateSplit(split.id, 'amount', Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter amount"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Date *
                      </label>
                      <input
                        type="date"
                        value={split.date}
                        onChange={(e) => updateSplit(split.id, 'date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={split.description}
                      onChange={(e) => updateSplit(split.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Optional description for this split"
                    />
                  </div>
                </div>
              ))}

              {/* Remaining Amount Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Remaining to Allocate:</span>
                  <span className={`font-semibold ${remainingAmount < 0 ? 'text-red-600' : remainingAmount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {formatCurrency(remainingAmount)}
                  </span>
                </div>
                {remainingAmount < 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    Warning: Total splits exceed the remaining amount
                  </p>
                )}
                {remainingAmount > 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Note: {formatCurrency(remainingAmount)} still needs to be allocated
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reason for split */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Reason for Split</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Explanation *
            </label>
            <textarea
              value={configuration.reason}
              onChange={(e) => setConfiguration(prev => ({
                ...prev,
                reason: e.target.value
              }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Explain why this split is necessary (e.g., partial delivery, vendor constraints, etc.)"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderReForecastConfiguration = () => {
    if (!ledgerEntry || !actualTransaction) return null;

    const plannedAmount = ledgerEntry.planned_amount || 0;
    const actualAmount = actualTransaction.amount;
    const difference = actualAmount - plannedAmount;
    const isOverrun = difference > 0;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <ArrowPathIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Re-forecast Configuration</h3>
          <p className="text-gray-600">
            {isOverrun
              ? 'Configure how to handle the cost overrun by re-allocating from future months.'
              : 'Configure how to re-allocate the remaining amount to future months.'
            }
          </p>
        </div>

        <div className={`rounded-lg p-6 border ${isOverrun ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
          <h4 className={`font-semibold mb-4 ${isOverrun ? 'text-red-900' : 'text-green-900'
            }`}>
            {isOverrun ? 'Cost Overrun' : 'Cost Underspend'} Summary
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Planned Amount:</span>
              <span className="font-semibold">{formatCurrency(plannedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Actual Amount:</span>
              <span className="font-semibold">{formatCurrency(actualAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">
                {isOverrun ? 'Overrun Amount:' : 'Remaining Amount:'}
              </span>
              <span className={`font-bold ${isOverrun ? 'text-red-600' : 'text-green-600'
                }`}>
                {formatCurrency(Math.abs(difference))}
              </span>
            </div>
          </div>
        </div>

        {/* Re-leveling options */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Re-leveling Configuration</h4>

          {/* Re-leveling Scope */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Re-leveling Scope *
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="relevelingScope"
                  value="single"
                  checked={configuration.relevelingScope === 'single'}
                  onChange={(e) => setConfiguration(prev => ({
                    ...prev,
                    relevelingScope: e.target.value as 'single' | 'remaining' | 'entire'
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">This Entry Only</div>
                  <div className="text-sm text-gray-500">Adjust only this specific ledger entry</div>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="relevelingScope"
                  value="remaining"
                  checked={configuration.relevelingScope === 'remaining'}
                  onChange={(e) => setConfiguration(prev => ({
                    ...prev,
                    relevelingScope: e.target.value as 'single' | 'remaining' | 'entire'
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Remaining Months</div>
                  <div className="text-sm text-gray-500">Re-level across future months in this allocation</div>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="relevelingScope"
                  value="entire"
                  checked={configuration.relevelingScope === 'entire'}
                  onChange={(e) => setConfiguration(prev => ({
                    ...prev,
                    relevelingScope: e.target.value as 'single' | 'remaining' | 'entire'
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Entire Allocation</div>
                  <div className="text-sm text-gray-500">Re-level across all months in this allocation</div>
                </div>
              </label>
            </div>
          </div>

          {/* Re-leveling Algorithm - Only show if not single scope */}
          {configuration.relevelingScope !== 'single' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Re-leveling Algorithm *
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="relevelingAlgorithm"
                    value="linear"
                    checked={configuration.relevelingAlgorithm === 'linear'}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      relevelingAlgorithm: e.target.value as 'linear' | 'front-loaded' | 'back-loaded' | 'custom'
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Linear</div>
                    <div className="text-sm text-gray-500">Distribute evenly across all months</div>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="relevelingAlgorithm"
                    value="front-loaded"
                    checked={configuration.relevelingAlgorithm === 'front-loaded'}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      relevelingAlgorithm: e.target.value as 'linear' | 'front-loaded' | 'back-loaded' | 'custom'
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Front-Loaded</div>
                    <div className="text-sm text-gray-500">Concentrate in earlier months</div>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="relevelingAlgorithm"
                    value="back-loaded"
                    checked={configuration.relevelingAlgorithm === 'back-loaded'}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      relevelingAlgorithm: e.target.value as 'linear' | 'front-loaded' | 'back-loaded' | 'custom'
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Back-Loaded</div>
                    <div className="text-sm text-gray-500">Concentrate in later months</div>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="relevelingAlgorithm"
                    value="custom"
                    checked={configuration.relevelingAlgorithm === 'custom'}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      relevelingAlgorithm: e.target.value as 'linear' | 'front-loaded' | 'back-loaded' | 'custom'
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Custom</div>
                    <div className="text-sm text-gray-500">Manual distribution in next step</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Weight Intensity Slider - Only show for front-loaded or back-loaded */}
          {configuration.relevelingScope !== 'single' &&
            (configuration.relevelingAlgorithm === 'front-loaded' || configuration.relevelingAlgorithm === 'back-loaded') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Weight Intensity
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Adjust the distribution intensity for {configuration.relevelingAlgorithm.replace('-', ' ')} allocation.
                </p>
                <div className="space-y-4">
                  <div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.125"
                      value={weightIntensity}
                      onChange={(e) => setWeightIntensity(parseFloat(e.target.value))}
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Linear</span>
                      <span>Strong</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Baseline Exceedance Justification - Only show if there's a baseline warning */}
          {configuration.relevelingScope !== 'single' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Re-forecast Reason *
              </label>
              <textarea
                value={configuration.reason}
                onChange={(e) => setConfiguration(prev => ({
                  ...prev,
                  reason: e.target.value
                }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Explain why this re-forecast is necessary (e.g., cost overrun, schedule change, etc.)"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderScheduleChangeConfiguration = () => {
    if (!ledgerEntry || !actualTransaction) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-purple-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Change Configuration</h3>
          <p className="text-gray-600">Update the planned date to match the actual transaction date.</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-4">Schedule Change Summary</h4>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Current Planned Date:</span>
              <span className="font-semibold">{ledgerEntry.planned_date || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Actual Transaction Date:</span>
              <span className="font-semibold text-purple-700">{actualTransaction.date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Amount:</span>
              <span className="font-semibold">{formatCurrency(ledgerEntry.planned_amount || 0)}</span>
            </div>
          </div>
        </div>

        {/* New Planned Date Configuration */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">New Planned Date</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Updated Planned Date *
              </label>
              <input
                type="date"
                value={configuration.newPlannedDate || actualTransaction.date}
                onChange={(e) => setConfiguration(prev => ({
                  ...prev,
                  newPlannedDate: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: {actualTransaction.date} (matches actual transaction)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Schedule Change *
              </label>
              <textarea
                value={configuration.reason}
                onChange={(e) => setConfiguration(prev => ({
                  ...prev,
                  reason: e.target.value
                }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Explain why the schedule change is necessary (e.g., vendor delay, delivery issues, etc.)"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAllocationImpactStep = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculating allocation impact...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={calculateAllocationImpact}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!allocationImpact) {
      return (
        <div className="text-center py-8">
          <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No allocation impact data available.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Allocation Impact Preview</h3>
          <p className="text-gray-600">
            Review how this adjustment will affect future ledger entries and allocations.
          </p>
        </div>

        {/* Impact Summary */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-4">Impact Summary</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="font-medium text-blue-900">Total Change</div>
              <div className="text-lg font-bold text-blue-700">
                {formatCurrency(allocationImpact.totalChange)}
              </div>
              {(selectedScenario === 'cost_overrun' || selectedScenario === 'cost_underspend') && allocationImpact.totalChange === 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  Net zero (debits = credits)
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="font-medium text-blue-900">Entries Affected</div>
              <div className="text-lg font-bold text-blue-700">
                {allocationImpact.entriesAffected}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="font-medium text-blue-900">Scenario</div>
              <div className="text-lg font-bold text-blue-700">
                {availableScenarios?.available.find(s => s.id === selectedScenario)?.title || 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        {/* Warnings and Notes */}
        {((allocationImpact.warnings && allocationImpact.warnings.length > 0) ||
          (allocationImpact.notes && allocationImpact.notes.length > 0)) && (
            <div className="space-y-3">
              {allocationImpact.warnings && allocationImpact.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-900 mb-2">Warnings</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {allocationImpact.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start">
                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {allocationImpact.notes && allocationImpact.notes.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">Notes</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {allocationImpact.notes.map((note, index) => (
                      <li key={index} className="flex items-start">
                        <InformationCircleIcon className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        {/* Custom Distribution Input (if applicable) */}
        {selectedScenario && (selectedScenario === 'cost_overrun' || selectedScenario === 'cost_underspend') &&
          configuration.relevelingAlgorithm === 'custom' &&
          allocationImpact.futureAllocations && allocationImpact.futureAllocations.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h5 className="font-medium text-yellow-900 mb-3">Manual Distribution</h5>
              <p className="text-sm text-yellow-700 mb-4">
                Enter the amount to allocate to each future month. Total must equal {formatCurrency(Math.abs(allocationImpact.totalChange))}.
              </p>
              <div className="space-y-3">
                {allocationImpact.futureAllocations.map((allocation) => (
                  <div key={allocation.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-yellow-900 mb-1">
                        {allocation.description} ({allocation.plannedDate})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={customDistribution[allocation.id] || ''}
                        onChange={(e) => setCustomDistribution(prev => ({
                          ...prev,
                          [allocation.id]: parseFloat(e.target.value) || 0
                        }))}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="text-sm text-yellow-700">
                      Original: {formatCurrency(allocation.originalPlanned)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total validation */}
              <div className="mt-4 p-3 bg-white rounded border border-yellow-300">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-700">Current Total:</span>
                  <span className={`text-sm font-bold ${Math.abs(Object.values(customDistribution).reduce((sum, amount) => sum + Math.abs(amount), 0) -
                    Math.abs(allocationImpact.totalChange)) < 0.01
                    ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {formatCurrency(Object.values(customDistribution).reduce((sum, amount) => sum + Math.abs(amount), 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-yellow-700">Required Total:</span>
                  <span className="text-sm font-medium text-yellow-900">
                    {formatCurrency(Math.abs(allocationImpact.totalChange))}
                  </span>
                </div>
              </div>
            </div>
          )}

        {/* Weight Intensity Slider (if applicable) */}
        {selectedScenario && (selectedScenario === 'cost_overrun' || selectedScenario === 'cost_underspend') &&
          (configuration.relevelingAlgorithm === 'front-loaded' || configuration.relevelingAlgorithm === 'back-loaded') &&
          allocationImpact.futureAllocations && allocationImpact.futureAllocations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h5 className="font-medium text-blue-900 mb-3">Weight Intensity</h5>
              <p className="text-sm text-blue-700 mb-4">
                Adjust the distribution intensity for {configuration.relevelingAlgorithm.replace('-', ' ')} allocation.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Intensity Level
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.125"
                    value={weightIntensity}
                    onChange={(e) => setWeightIntensity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-blue-600 mt-1">
                    <span>Linear</span>
                    <span>Strong</span>
                  </div>
                </div>

                {/* Weight preview */}
                <div className="bg-white rounded border border-blue-200 p-4">
                  <h6 className="font-medium text-blue-900 mb-2">Weight Distribution Preview</h6>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {allocationImpact.futureAllocations.slice(0, 4).map((allocation, index) => {
                      const calculatePreviewWeights = (algorithm: string, intensity: number, count: number) => {
                        const weights: number[] = [];

                        if (algorithm === 'front-loaded') {
                          const weightSets = [
                            [1.0, 0.0, 0.0, 0.0],     // Strong: 100%, 0%, 0%, 0%
                            [0.75, 0.25, 0.0, 0.0],   // 75%, 25%, 0%, 0%
                            [0.5, 0.5, 0.0, 0.0],     // 50%, 50%, 0%, 0%
                            [0.5, 0.3, 0.2, 0.0],     // 50%, 30%, 20%, 0%
                            [0.4, 0.3, 0.2, 0.1],     // Moderate: 40%, 30%, 20%, 10%
                            [0.375, 0.275, 0.225, 0.125], // 37.5%, 27.5%, 22.5%, 12.5%
                            [0.325, 0.275, 0.225, 0.175], // 32.5%, 27.5%, 22.5%, 17.5%
                            [0.3, 0.25, 0.25, 0.2],   // 30%, 25%, 25%, 20%
                            [0.25, 0.25, 0.25, 0.25]  // Linear: 25%, 25%, 25%, 25%
                          ];
                          const setIndex = Math.round((1 - intensity) * (weightSets.length - 1));
                          return weightSets[setIndex] || weightSets[0];
                        } else if (algorithm === 'back-loaded') {
                          const weightSets = [
                            [0.0, 0.0, 0.0, 1.0],     // Strong: 0%, 0%, 0%, 100%
                            [0.0, 0.0, 0.25, 0.75],   // 0%, 0%, 25%, 75%
                            [0.0, 0.0, 0.5, 0.5],     // 0%, 0%, 50%, 50%
                            [0.0, 0.2, 0.3, 0.5],     // 0%, 20%, 30%, 50%
                            [0.1, 0.2, 0.3, 0.4],     // Moderate: 10%, 20%, 30%, 40%
                            [0.125, 0.225, 0.275, 0.375], // 12.5%, 22.5%, 27.5%, 37.5%
                            [0.175, 0.225, 0.275, 0.325], // 17.5%, 22.5%, 27.5%, 32.5%
                            [0.2, 0.25, 0.25, 0.3],   // 20%, 25%, 25%, 30%
                            [0.25, 0.25, 0.25, 0.25]  // Linear: 25%, 25%, 25%, 25%
                          ];
                          const setIndex = Math.round((1 - intensity) * (weightSets.length - 1));
                          return weightSets[setIndex] || weightSets[0];
                        }

                        return weights;
                      };

                      const weights = calculatePreviewWeights(
                        configuration.relevelingAlgorithm,
                        weightIntensity,
                        allocationImpact.futureAllocations ? allocationImpact.futureAllocations.length : 0
                      );

                      return (
                        <div key={allocation.id} className="text-center">
                          <div className="font-medium text-blue-900">{allocation.plannedDate}</div>
                          <div className="text-blue-600">{(weights[index] * 100).toFixed(0)}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Detailed Allocation Changes */}
        <div className="bg-white rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 p-6 border-b border-gray-200">
            Detailed Allocation Changes
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original Planned
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Planned
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allocationImpact.futureAllocations && allocationImpact.futureAllocations.map((allocation, index) => (
                  <tr key={allocation.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {allocation.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {allocation.plannedDate}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(allocation.originalPlanned)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(allocation.newPlanned)}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium text-right ${allocation.change > 0 ? 'text-green-600' :
                      allocation.change < 0 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                      {allocation.change > 0 ? '+' : ''}{formatCurrency(allocation.change)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Important Notes</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Changes will only affect <strong>planned</strong> amounts, not the BOE baseline</li>
            <li>• All changes will be logged in the audit trail for tracking</li>
            <li>• You can review and confirm these changes in the next step</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderPreviewStep = () => {
    if (!selectedScenario) return null;

    const getScenarioDetails = () => {
      switch (selectedScenario) {
        case 'partial_delivery':
          return {
            title: 'Split Entry - Partial Delivery',
            details: [
              { label: 'Number of Splits', value: splits.length.toString() },
              { label: 'Total Split Amount', value: formatCurrency(splits.reduce((sum, split) => sum + split.amount, 0)) },
              { label: 'Reason', value: configuration.reason }
            ]
          };
        case 'cost_overrun':
          return {
            title: 'Re-forecast - Cost Overrun',
            details: [
              { label: 'Re-leveling Scope', value: configuration.relevelingScope },
              { label: 'Re-leveling Algorithm', value: configuration.relevelingAlgorithm },
              { label: 'Reason', value: configuration.reason }
            ]
          };
        case 'cost_underspend':
          return {
            title: 'Re-forecast - Cost Underspend',
            details: [
              { label: 'Re-leveling Scope', value: configuration.relevelingScope },
              { label: 'Re-leveling Algorithm', value: configuration.relevelingAlgorithm },
              { label: 'Reason', value: configuration.reason }
            ]
          };
        case 'schedule_change':
          return {
            title: 'Re-forecast - Schedule Change',
            details: [
              { label: 'New Planned Date', value: configuration.newPlannedDate },
              { label: 'Reason', value: configuration.reason }
            ]
          };
        default:
          return { title: 'Unknown Scenario', details: [] };
      }
    };

    const scenarioDetails = getScenarioDetails();

    return (
      <div className="space-y-6">
        <div className="text-center">
          <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Changes</h3>
          <p className="text-gray-600">Review the changes before applying them.</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Adjustment Summary</h4>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h5 className="font-medium text-gray-900 mb-2">Selected Scenario</h5>
              <p className="text-sm text-gray-700">{scenarioDetails.title}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h5 className="font-medium text-gray-900 mb-2">Configuration Details</h5>
              <div className="space-y-2">
                {scenarioDetails.details.map((detail, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">{detail.label}:</span>
                    <span className="text-gray-900">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction Summary */}
            {ledgerEntry && actualTransaction && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h5 className="font-medium text-gray-900 mb-2">Transaction Summary</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Planned Amount:</span>
                    <span className="ml-2 font-semibold text-blue-700">{formatCurrency(ledgerEntry.planned_amount || 0)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Actual Amount:</span>
                    <span className="ml-2 font-semibold text-green-700">{formatCurrency(actualTransaction.amount)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Planned Date:</span>
                    <span className="ml-2 text-gray-900">{ledgerEntry.planned_date || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Actual Date:</span>
                    <span className="ml-2 text-gray-900">{actualTransaction.date}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Splits Summary for Partial Delivery */}
            {selectedScenario === 'partial_delivery' && splits.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h5 className="font-medium text-gray-900 mb-2">Splits Summary</h5>
                <div className="space-y-3">
                  {splits.map((split, index) => (
                    <div key={split.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                      <div>
                        <div className="font-medium text-gray-900">Split {index + 1}</div>
                        {split.description && (
                          <div className="text-sm text-gray-600">{split.description}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-700">{formatCurrency(split.amount)}</div>
                        <div className="text-sm text-gray-600">{split.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Original Entry Changes for Partial Delivery */}
            {selectedScenario === 'partial_delivery' && ledgerEntry && actualTransaction && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h5 className="font-medium text-gray-900 mb-2">Original Entry Changes</h5>
                <div className="bg-blue-50 rounded p-3 border border-blue-200">
                  <div className="text-sm text-blue-800 mb-2">
                    <strong>{ledgerEntry.expense_description}</strong> will be updated:
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-700">Actual Amount:</span>
                      <span className="ml-2 font-semibold text-green-700">{formatCurrency(actualTransaction.amount)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Actual Date:</span>
                      <span className="ml-2 text-blue-900">{actualTransaction.date}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Planned Amount:</span>
                      <span className="ml-2 text-blue-900">{formatCurrency(ledgerEntry.planned_amount || 0)}</span>
                      <span className="ml-2 text-xs text-red-600">→ {formatCurrency((ledgerEntry.planned_amount || 0) - splits.reduce((sum, split) => sum + split.amount, 0))}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Planned Date:</span>
                      <span className="ml-2 text-blue-900">{ledgerEntry.planned_date || 'N/A'}</span>
                      <span className="ml-2 text-xs text-gray-500">(unchanged)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-700">
                    Planned amount reduced by {formatCurrency(splits.reduce((sum, split) => sum + split.amount, 0))} (total split amount)
                  </div>
                </div>
              </div>
            )}

            {/* Allocation Impact Summary for Cost Overrun/Cost Underspend */}
            {(selectedScenario === 'cost_overrun' || selectedScenario === 'cost_underspend') && allocationImpact && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h5 className="font-medium text-gray-900 mb-2">Allocation Impact Summary</h5>
                <div className="bg-blue-50 rounded p-3 border border-blue-200 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-700">Total Change:</span>
                      <div className="font-semibold text-blue-900">
                        {formatCurrency(allocationImpact.totalChange)}
                        {allocationImpact.totalChange === 0 && (
                          <div className="text-xs text-blue-600">Net zero (debits = credits)</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Entries Affected:</span>
                      <div className="font-semibold text-blue-900">{allocationImpact.entriesAffected}</div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Algorithm:</span>
                      <div className="font-semibold text-blue-900">{configuration.relevelingAlgorithm}</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Changes */}
                {allocationImpact.futureAllocations && allocationImpact.futureAllocations.length > 0 && (
                  <div>
                    <h6 className="font-medium text-gray-900 mb-3">Detailed Allocation Changes</h6>
                    <div className="space-y-3">
                      {allocationImpact.futureAllocations.map((allocation, index) => (
                        <div key={allocation.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {allocation.description}
                              {allocation.id === ledgerEntry?.id && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Original Entry</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">{allocation.plannedDate}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {formatCurrency(allocation.originalPlanned)} → {formatCurrency(allocation.newPlanned)}
                            </div>
                            <div className={`font-semibold ${allocation.change >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {allocation.change >= 0 ? '+' : ''}{formatCurrency(allocation.change)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings and Notes */}
                {((allocationImpact.warnings && allocationImpact.warnings.length > 0) ||
                  (allocationImpact.notes && allocationImpact.notes.length > 0)) && (
                    <div className="mt-4 space-y-2">
                      {allocationImpact.warnings && allocationImpact.warnings.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <div className="text-sm text-yellow-800">
                            <strong>Warnings:</strong> {allocationImpact.warnings.join(', ')}
                          </div>
                        </div>
                      )}
                      {allocationImpact.notes && allocationImpact.notes.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <div className="text-sm text-blue-800">
                            <strong>Notes:</strong> {allocationImpact.notes.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            )}

            {/* Schedule Change Details */}
            {selectedScenario === 'schedule_change' && ledgerEntry && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h5 className="font-medium text-gray-900 mb-2">Schedule Change Details</h5>
                <div className="bg-blue-50 rounded p-3 border border-blue-200">
                  <div className="text-sm text-blue-800 mb-2">
                    <strong>{ledgerEntry.expense_description}</strong> will be rescheduled:
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-700">Current Planned Date:</span>
                      <span className="ml-2 text-blue-900">{ledgerEntry.planned_date || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">New Planned Date:</span>
                      <span className="ml-2 font-semibold text-green-700">{configuration.newPlannedDate}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Planned Amount:</span>
                      <span className="ml-2 text-blue-900">{formatCurrency(ledgerEntry.planned_amount || 0)}</span>
                      <span className="ml-2 text-xs text-gray-500">(unchanged)</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Actual Amount:</span>
                      <span className="ml-2 text-green-700">{actualTransaction ? formatCurrency(actualTransaction.amount) : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-700">
                    Only the planned date will be updated. All other values remain unchanged.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCompleteStep = () => {
    if (!successMessage) return null;

    return (
      <div className="text-center space-y-6">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
          <CheckCircleIcon className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{successMessage.title}</h3>
          <p className="text-gray-600">{successMessage.message}</p>
          {successMessage.ledgerLink && (
            <a
              href={successMessage.ledgerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View Ledger
            </a>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'scenario':
        return renderScenarioStep();
      case 'configuration':
        return renderConfigurationStep();
      case 'allocation-impact':
        return renderAllocationImpactStep();
      case 'preview':
        return renderPreviewStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Confirm Match & Adjust Ledger
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Confirm the transaction match and adjust the ledger entry as needed
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {renderStepIndicator()}
          {renderCurrentStep()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 'scenario'}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center gap-3">
            {error && (
              <div className="text-sm text-red-600 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {error}
              </div>
            )}

            {currentStep === 'complete' ? (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceedToNext() || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocationTransactionAdjustmentModal;