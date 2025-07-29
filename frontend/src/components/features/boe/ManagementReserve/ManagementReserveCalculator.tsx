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
import Button from '../../../common/Button';

interface ManagementReserveCalculatorProps {
  boeVersionId: string;
  totalCost: number;
  currentMR?: ManagementReserve;
  onMRChange: (mr: ManagementReserve) => void;
  isEditable?: boolean;
  // R&O Placeholders for future integration
  riskMatrix?: any; // Placeholder: will be RiskMatrix type later
  showROIntegration?: boolean; // Placeholder: will show R&O features when available
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
  showROIntegration = false
}) => {
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>('Standard');
  const [customPercentage, setCustomPercentage] = useState<number>(10);
  const [justification, setJustification] = useState<string>(currentMR?.justification || '');
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [projectComplexity, setProjectComplexity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [notes, setNotes] = useState<string>(currentMR?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate MR based on selected method
  const calculatedMR = useMemo((): CalculationResult => {
    let basePercentage = 10;
    let complexityAdjustment = 0;
    let riskAdjustment = 0;
    let finalPercentage = 10;

    switch (calculationMethod) {
      case 'Standard':
        // Industry standard: 5-15% based on project complexity
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
        // Placeholder: will use actual R&O data later
        console.log('R&O-Driven calculation placeholder - will use actual risk matrix data');
        basePercentage = totalCost > 1000000 ? 10 : totalCost > 500000 ? 12 : 15;
        finalPercentage = basePercentage;
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
        roAdjustment: 0 // Placeholder for R&O adjustments
      }
    };
  }, [calculationMethod, totalCost, customPercentage, projectComplexity, riskFactors]);

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
        calculationMethod: calculationMethod as 'Standard' | 'Risk-Based' | 'Custom',
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

      {/* Calculation Method Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Calculation Method
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CalculationMethodCard
            method="Standard"
            title="Standard"
            description="Industry standard 5-15%"
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
            disabled={!showROIntegration || !isEditable}
          />
        </div>
      </div>

      {/* R&O Integration Placeholder */}
      {calculationMethod === 'R&O-Driven' && (
        <ROIntegrationPlaceholder />
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
    className={`p-4 rounded-lg border-2 text-left transition-all ${
      selected
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
    className={`p-4 rounded-lg border-2 text-left transition-all ${
      selected
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-medium text-gray-900">R&O-Driven</h4>
      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
    </div>
    <p className="text-sm text-gray-600">Based on actual risk and opportunity analysis</p>
    {disabled && (
      <p className="text-xs text-gray-500 mt-1">
        Available when R&O system is implemented
      </p>
    )}
  </button>
);

// R&O Integration Placeholder Component
const ROIntegrationPlaceholder: React.FC = () => (
  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-blue-700">R&O Integration</h3>
      <span className="text-xs bg-blue-200 text-blue-600 px-2 py-1 rounded">Coming Soon</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <h4 className="font-medium text-gray-700 mb-2">Risk Analysis</h4>
        <p className="text-sm text-gray-600">
          Calculate MR based on identified risks, their probability, and potential cost impact.
        </p>
      </div>
      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <h4 className="font-medium text-gray-700 mb-2">Opportunity Analysis</h4>
        <p className="text-sm text-gray-600">
          Factor in opportunities that may reduce MR requirements.
        </p>
      </div>
    </div>
    <div className="mt-4 p-3 bg-blue-100 rounded-lg">
      <p className="text-sm text-blue-700">
        <strong>Note:</strong> This feature will be available when the R&O system is implemented. 
        For now, please use Standard, Risk-Based, or Custom calculation methods.
      </p>
    </div>
  </div>
);

export default ManagementReserveCalculator; 