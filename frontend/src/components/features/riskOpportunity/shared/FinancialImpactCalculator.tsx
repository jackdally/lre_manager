import React from 'react';
import { formatCurrency } from '../../../../utils/currencyUtils';

interface FinancialImpactCalculatorProps {
  min: number | string;
  mostLikely: number | string;
  max: number | string;
  label?: string;
  showExpectedValue?: boolean;
}

/**
 * Calculate expected value using PERT formula
 * Formula: (Min + 4×Most Likely + Max) / 6
 */
export const calculateExpectedValue = (min: number | string, mostLikely: number | string, max: number | string): number => {
  // Convert to numbers, handling strings from API
  const minNum = Number(min) || 0;
  const mostLikelyNum = Number(mostLikely) || 0;
  const maxNum = Number(max) || 0;
  
  // Validate range
  if (minNum > mostLikelyNum || mostLikelyNum > maxNum) {
    return 0;
  }
  
  // PERT formula: (Min + 4×Most Likely + Max) / 6
  return (minNum + 4 * mostLikelyNum + maxNum) / 6;
};

/**
 * Display component for financial impact calculation
 */
export const FinancialImpactCalculator: React.FC<FinancialImpactCalculatorProps> = ({
  min,
  mostLikely,
  max,
  label = 'Expected Value',
  showExpectedValue = true,
}) => {
  // Ensure values are numbers for display and calculation
  const minNum = Number(min) || 0;
  const mostLikelyNum = Number(mostLikely) || 0;
  const maxNum = Number(max) || 0;
  const expectedValue = calculateExpectedValue(minNum, mostLikelyNum, maxNum);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Min</label>
          <div className="text-sm font-medium text-gray-700">{formatCurrency(minNum)}</div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Most Likely</label>
          <div className="text-sm font-medium text-gray-700">{formatCurrency(mostLikelyNum)}</div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Max</label>
          <div className="text-sm font-medium text-gray-700">{formatCurrency(maxNum)}</div>
        </div>
      </div>
      {showExpectedValue && (
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{label}:</span>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(expectedValue)}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Formula: (Min + 4×Most Likely + Max) / 6
          </div>
        </div>
      )}
    </div>
  );
};

