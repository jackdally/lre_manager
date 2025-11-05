import React from 'react';
import { formatCurrency } from '../../../../utils/currencyUtils';

interface RiskScoreCalculatorProps {
  min: number | string;
  mostLikely: number | string;
  max: number | string;
  probability: number | string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  showBreakdown?: boolean;
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
 * Calculate risk score
 * Risk Score = SeverityWeight × Likelihood × ExpectedValue
 */
export const calculateRiskScore = (
  min: number | string,
  mostLikely: number | string,
  max: number | string,
  probability: number | string,
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
): number => {
  const severityWeights: Record<string, number> = {
    Low: 1,
    Medium: 2,
    High: 3,
    Critical: 4,
  };

  const expectedValue = calculateExpectedValue(min, mostLikely, max);
  const severityWeight = severityWeights[severity] || 1;
  const probabilityDecimal = Number(probability || 0) / 100; // Convert to 0-1 range

  return severityWeight * probabilityDecimal * expectedValue;
};

/**
 * Display component for risk score calculation
 */
export const RiskScoreCalculator: React.FC<RiskScoreCalculatorProps> = ({
  min,
  mostLikely,
  max,
  probability,
  severity,
  showBreakdown = false,
}) => {
  // Ensure values are numbers for calculation
  const minNum = Number(min) || 0;
  const mostLikelyNum = Number(mostLikely) || 0;
  const maxNum = Number(max) || 0;
  const probabilityNum = Number(probability) || 0;
  
  const expectedValue = calculateExpectedValue(minNum, mostLikelyNum, maxNum);
  const riskScore = calculateRiskScore(minNum, mostLikelyNum, maxNum, probabilityNum, severity);

  const severityWeights: Record<string, number> = {
    Low: 1,
    Medium: 2,
    High: 3,
    Critical: 4,
  };

  const severityWeight = severityWeights[severity] || 1;
  const probabilityDecimal = probabilityNum / 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Expected Value:</span>
        <span className="text-sm font-semibold text-gray-900">{formatCurrency(expectedValue)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Risk Score:</span>
        <span className="text-sm font-bold text-red-600">{formatCurrency(riskScore)}</span>
      </div>
      {showBreakdown && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
          <div>Severity Weight: {severityWeight} × Probability: {(probabilityDecimal * 100).toFixed(1)}% × Expected Value: {formatCurrency(expectedValue)}</div>
        </div>
      )}
    </div>
  );
};

