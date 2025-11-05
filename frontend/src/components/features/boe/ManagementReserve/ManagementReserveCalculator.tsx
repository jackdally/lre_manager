import React, { useState, useEffect, useMemo } from 'react';
import {
  CalculatorIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { ManagementReserve } from '../../../../store/boeStore';
import { formatCurrency } from '../../../../utils/currencyUtils';
import { managementReserveApi } from '../../../../services/boeApi';
import Button from '../../../common/Button';
import ROImpactBreakdown from './ROImpactBreakdown';

interface ManagementReserveCalculatorProps {
  boeVersionId: string;
  totalCost: number;
  currentMR?: ManagementReserve;
  onMRChange: (mr: ManagementReserve) => void;
  isEditable?: boolean;
  // R&O Placeholders for future integration
  riskMatrix?: any; // Placeholder: will be RiskMatrix type later
  showROIntegration?: boolean; // Placeholder: will show R&O features when available
  usingEstimatedCost?: boolean; // Whether MR is calculated from estimated cost vs allocated cost
}

type CalculationMethod = 'Standard' | 'Risk-Based' | 'Custom' | 'R&O-Driven';

interface CalculationResult {
  amount: number;
  percentage: number;
  breakdown: {
    basePercentage: number;
    complexityAdjustment: number;
    riskAdjustment: number;
    finalPercentage: number;
    roAdjustment?: number; // Placeholder for R&O adjustments
  };
}

const ManagementReserveCalculator: React.FC<ManagementReserveCalculatorProps> = ({
  boeVersionId,
  totalCost,
  currentMR,
  onMRChange,
  isEditable = true,
  // R&O Placeholders
  riskMatrix = null,
  showROIntegration = false,
  usingEstimatedCost = false
}) => {
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>('Standard');
  const [customPercentage, setCustomPercentage] = useState<number>(10);
  const [justification, setJustification] = useState<string>(currentMR?.justification || '');
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [projectComplexity, setProjectComplexity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [notes, setNotes] = useState<string>(currentMR?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roCalculationResult, setRoCalculationResult] = useState<any>(null);
  const [loadingROCalculation, setLoadingROCalculation] = useState(false);
  const [roCalculationError, setRoCalculationError] = useState<string | null>(null);

  const fetchRODrivenCalculation = React.useCallback(async () => {
    if (!boeVersionId) return;

    setLoadingROCalculation(true);
    setRoCalculationError(null);

    try {
      const result = await managementReserveApi.calculateRODrivenMR(boeVersionId);
      setRoCalculationResult(result);
    } catch (error: any) {
      console.error('Error calculating R&O-Driven MR:', error);
      setRoCalculationError(error?.response?.data?.message || error?.message || 'Failed to calculate R&O-Driven MR');
      setRoCalculationResult(null);
    } finally {
      setLoadingROCalculation(false);
    }
  }, [boeVersionId]);

  // Fetch R&O-Driven calculation when method is selected
  useEffect(() => {
    if (calculationMethod === 'R&O-Driven' && boeVersionId) {
      fetchRODrivenCalculation();
    } else {
      setRoCalculationResult(null);
      setRoCalculationError(null);
    }
  }, [calculationMethod, boeVersionId, fetchRODrivenCalculation]);

  // Calculate MR based on selected method
  const calculatedMR = useMemo((): CalculationResult => {
    // If R&O-Driven, use the fetched result
    if (calculationMethod === 'R&O-Driven' && roCalculationResult) {
      return {
        amount: roCalculationResult.amount,
        percentage: roCalculationResult.percentage,
        breakdown: {
          basePercentage: roCalculationResult.baseMRPercentage,
          complexityAdjustment: 0,
          riskAdjustment: roCalculationResult.riskAdjustment,
          finalPercentage: roCalculationResult.percentage,
          roAdjustment: roCalculationResult.riskAdjustment
        }
      };
    }

    let basePercentage = 10;
    let complexityAdjustment = 0;
    let riskAdjustment = 0;
    let finalPercentage = 10;

    switch (calculationMethod) {
      case 'Standard':
        // Industry standard: varies by project size (15% for < $500k, 12% for $500k-$1M, 10% for > $1M)
        basePercentage = totalCost > 1000000 ? 10 : totalCost > 500000 ? 12 : 15;
        finalPercentage = basePercentage;
        break;

      case 'Risk-Based':
        // Base percentage based on project size
        basePercentage = totalCost > 1000000 ? 8 : totalCost > 500000 ? 10 : 12;

        // Complexity adjustment
        complexityAdjustment = projectComplexity === 'High' ? 3 : projectComplexity === 'Medium' ? 1 : 0;

        // Risk factors adjustment
        riskAdjustment = riskFactors.length * 0.5; // 0.5% per risk factor

        finalPercentage = Math.min(25, basePercentage + complexityAdjustment + riskAdjustment);
        break;

      case 'Custom':
        finalPercentage = customPercentage;
        break;

      case 'R&O-Driven':
        // If calculation is loading or failed, show placeholder
        if (loadingROCalculation) {
          basePercentage = totalCost > 1000000 ? 10 : totalCost > 500000 ? 12 : 15;
          finalPercentage = basePercentage;
        } else if (roCalculationError || !roCalculationResult) {
          // Show base calculation if error
          basePercentage = totalCost > 1000000 ? 10 : totalCost > 500000 ? 12 : 15;
          finalPercentage = basePercentage;
        }
        break;

      default:
        finalPercentage = 10;
    }

    const amount = totalCost > 0 ? (totalCost * finalPercentage) / 100 : 0;

    return {
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round(finalPercentage * 100) / 100,
      breakdown: {
        basePercentage,
        complexityAdjustment,
        riskAdjustment,
        finalPercentage,
        roAdjustment: calculationMethod === 'R&O-Driven' && roCalculationResult ? roCalculationResult.riskAdjustment : 0
      }
    };
  }, [calculationMethod, totalCost, customPercentage, projectComplexity, riskFactors, roCalculationResult, loadingROCalculation, roCalculationError]);

  // Handle save
  const handleSave = async () => {
    if (!isEditable) return;

    setIsSubmitting(true);
    try {
      const newMR: Partial<ManagementReserve> = {
        baselineAmount: calculatedMR.amount,
        baselinePercentage: calculatedMR.percentage,
        adjustedAmount: calculatedMR.amount,
        adjustedPercentage: calculatedMR.percentage,
        calculationMethod: calculationMethod as 'Standard' | 'Risk-Based' | 'Custom' | 'R&O-Driven',
        justification,
        notes,
        riskFactors: riskFactors.join(', '),
        isActive: true,
        boeVersionId
      };

      onMRChange(newMR as ManagementReserve);
    } catch (error) {
      console.error('Error saving MR:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Risk factor options
  const riskFactorOptions = [
    'Technology Risk',
    'Schedule Risk',
    'Resource Risk',
    'External Dependencies',
    'Regulatory Changes',
    'Market Volatility',
    'Scope Creep',
    'Quality Issues'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalculatorIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Management Reserve Calculator</h3>
        </div>
        {!isEditable && (
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Read Only
          </span>
        )}
      </div>

      {/* Warning when using estimated cost */}
      {usingEstimatedCost && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                Using Estimated Cost
              </h4>
              <p className="text-sm text-yellow-700">
                Management Reserve is currently calculated from estimated costs because not all required allocations have been assigned.
                Once all allocations are complete, the calculation will automatically use allocated amounts instead.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calculation Method Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Calculation Method
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CalculationMethodCard
            method="Standard"
            title="Standard"
            description={`Industry standard ${totalCost > 1000000 ? '10%' : totalCost > 500000 ? '12%' : '15%'}`}
            selected={calculationMethod === 'Standard'}
            onClick={() => setCalculationMethod('Standard')}
            disabled={!isEditable}
          />
          <CalculationMethodCard
            method="Risk-Based"
            title="Risk-Based"
            description="Project-specific risk factors"
            selected={calculationMethod === 'Risk-Based'}
            onClick={() => setCalculationMethod('Risk-Based')}
            disabled={!isEditable}
          />
          <CalculationMethodCard
            method="Custom"
            title="Custom"
            description="User-defined percentage"
            selected={calculationMethod === 'Custom'}
            onClick={() => setCalculationMethod('Custom')}
            disabled={!isEditable}
          />
          <RODrivenCalculationCard
            selected={calculationMethod === 'R&O-Driven'}
            onClick={() => setCalculationMethod('R&O-Driven')}
            disabled={!isEditable}
          />
        </div>
      </div>

      {/* R&O-Driven Calculation Display */}
      {calculationMethod === 'R&O-Driven' && (
        <div className="space-y-4">
          {/* R&O-Driven Information Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-purple-800">
                <p className="font-semibold mb-1">R&O-Driven Calculation Method</p>
                <p className="mb-2">
                  This method automatically calculates your Management Reserve using actual risk data from your Risk & Opportunity register.
                </p>
                <div className="bg-purple-100 border border-purple-300 rounded p-2 mt-2">
                  <p className="text-xs font-medium mb-1">Formula:</p>
                  <p className="text-xs">
                    <strong>Base MR</strong> (Standard calculation) + <strong>Risk Adjustment</strong> (sum of severity-weighted expected values)
                  </p>
                  <p className="text-xs mt-1">
                    <strong>Expected Value</strong> = Probability × Most Likely Cost Impact × Severity Multiplier
                  </p>
                </div>
              </div>
            </div>
          </div>

          {loadingROCalculation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-sm text-blue-800">Calculating R&O-Driven MR from your risk data...</p>
              </div>
            </div>
          )}

          {roCalculationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 mb-1">Calculation Error</p>
                  <p className="text-sm text-red-700 mb-2">{roCalculationError}</p>
                  <button
                    onClick={fetchRODrivenCalculation}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {roCalculationResult && (
            <ROImpactBreakdown result={roCalculationResult} totalCost={totalCost} />
          )}

          {!loadingROCalculation && !roCalculationError && !roCalculationResult && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 mb-1">No Risk Data Available</p>
                  <p className="text-sm text-yellow-700 mb-2">
                    R&O-Driven calculation requires at least one active risk with cost impact and probability in your Risk & Opportunity register.
                  </p>
                  <p className="text-xs text-yellow-600">
                    <strong>Tip:</strong> Complete the R&O Analysis step in program setup or add risks manually on the R&O page to enable this calculation method.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calculation Interface */}
      {calculationMethod !== 'R&O-Driven' && (
        <div className="space-y-4">
          {/* Custom Percentage Input */}
          {calculationMethod === 'Custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Percentage (%)
              </label>
              <input
                type="number"
                value={customPercentage}
                onChange={(e) => setCustomPercentage(Math.min(25, Math.max(0, parseFloat(e.target.value) || 0)))}
                min={0}
                max={25}
                step={0.1}
                disabled={!isEditable}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Range: 0-25%. Industry standard is 5-15%.
              </p>
            </div>
          )}

          {/* Risk-Based Configuration */}
          {calculationMethod === 'Risk-Based' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Complexity
                </label>
                <select
                  value={projectComplexity}
                  onChange={(e) => setProjectComplexity(e.target.value as 'Low' | 'Medium' | 'High')}
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="Low">Low Complexity</option>
                  <option value="Medium">Medium Complexity</option>
                  <option value="High">High Complexity</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Factors
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {riskFactorOptions.map((factor) => (
                    <label key={factor} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={riskFactors.includes(factor)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRiskFactors([...riskFactors, factor]);
                          } else {
                            setRiskFactors(riskFactors.filter(f => f !== factor));
                          }
                        }}
                        disabled={!isEditable}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                      <span className="text-sm text-gray-700">{factor}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calculation Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Calculation Preview</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">MR Percentage</p>
            <p className="text-2xl font-bold text-blue-600">{calculatedMR.percentage}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">MR Amount</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(calculatedMR.amount)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total with MR</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalCost + calculatedMR.amount)}</p>
          </div>
        </div>

        {/* Breakdown for Risk-Based */}
        {calculationMethod === 'Risk-Based' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Calculation Breakdown</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Base:</span>
                <span className="ml-1 font-medium">{calculatedMR.breakdown.basePercentage}%</span>
              </div>
              <div>
                <span className="text-gray-500">Complexity:</span>
                <span className="ml-1 font-medium">+{calculatedMR.breakdown.complexityAdjustment}%</span>
              </div>
              <div>
                <span className="text-gray-500">Risk Factors:</span>
                <span className="ml-1 font-medium">+{calculatedMR.breakdown.riskAdjustment}%</span>
              </div>
              <div>
                <span className="text-gray-500">Final:</span>
                <span className="ml-1 font-medium text-blue-600">{calculatedMR.breakdown.finalPercentage}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Justification and Notes */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Justification
          </label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            disabled={!isEditable}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Explain the rationale for this management reserve calculation..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            disabled={!isEditable}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Additional notes and assumptions..."
          />
        </div>
      </div>

      {/* Actions */}
      {isEditable && (
        <div className="flex justify-end space-x-3">
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex items-center space-x-2"
          >
            <CheckCircleIcon className="h-4 w-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save MR'}</span>
          </Button>
        </div>
      )}
    </div>
  );
};

// Calculation Method Card Component
interface CalculationMethodCardProps {
  method: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const CalculationMethodCard: React.FC<CalculationMethodCardProps> = ({
  method,
  title,
  description,
  selected,
  onClick,
  disabled = false
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-4 rounded-lg border-2 text-left transition-all ${selected
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-medium text-gray-900">{title}</h4>
      {selected && <CheckCircleIcon className="h-5 w-5 text-blue-600" />}
    </div>
    <p className="text-sm text-gray-600">{description}</p>
  </button>
);

// R&O-Driven Calculation Card (Placeholder)
interface RODrivenCalculationCardProps {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const RODrivenCalculationCard: React.FC<RODrivenCalculationCardProps> = ({
  selected,
  onClick,
  disabled = false
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-4 rounded-lg border-2 text-left transition-all ${selected
        ? 'border-purple-500 bg-purple-50'
        : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} relative`}
  >
    {selected && (
      <div className="absolute top-2 right-2">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-600 text-white">
          Recommended
        </span>
      </div>
    )}
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center">
        <ChartBarIcon className="h-5 w-5 text-purple-600 mr-2" />
        <h4 className="font-semibold text-gray-900">R&O-Driven</h4>
      </div>
      {selected && <CheckCircleIcon className="h-5 w-5 text-purple-600" />}
    </div>
    <p className="text-sm text-gray-700 mb-2">
      <strong>Data-driven calculation</strong> based on actual Risk & Opportunity analysis
    </p>
    <div className="mt-2 pt-2 border-t border-gray-200">
      <p className="text-xs text-gray-600">
        <strong>How it works:</strong> Uses severity-weighted expected values from your risk register to calculate MR automatically
      </p>
    </div>
  </button>
);

export default ManagementReserveCalculator; 