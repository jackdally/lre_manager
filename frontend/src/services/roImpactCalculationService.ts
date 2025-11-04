/**
 * R&O Impact Calculation Service
 * 
 * Provides severity weights and calculation helpers for R&O-Driven MR calculation
 */

export const SEVERITY_WEIGHTS = {
  Low: 0.5,
  Medium: 1.0,
  High: 1.5,
  Critical: 2.0,
} as const;

export type Severity = keyof typeof SEVERITY_WEIGHTS;

export interface Risk {
  id: string;
  title: string;
  costImpactMin: number;
  costImpactMostLikely: number;
  costImpactMax: number;
  probability: number; // 0-100
  severity: Severity;
  status?: string;
}

export interface RiskBreakdown {
  riskId: string;
  riskTitle: string;
  costImpact: number;
  probability: number;
  severity: string;
  severityMultiplier: number;
  expectedValue: number;
}

export interface ROImpactCalculationResult {
  amount: number;
  percentage: number;
  baseMR: number;
  baseMRPercentage: number;
  riskAdjustment: number;
  breakdown: RiskBreakdown[];
}

/**
 * Get severity weight multiplier
 */
export function getSeverityWeight(severity: Severity): number {
  return SEVERITY_WEIGHTS[severity];
}

/**
 * Calculate expected value for a single risk
 * Formula: Expected Value = Probability × Most Likely Cost Impact × Severity Multiplier
 */
export function calculateRiskExpectedValue(risk: Risk): number {
  const probability = risk.probability / 100; // Convert percentage to decimal
  const costImpact = risk.costImpactMostLikely;
  const severityMultiplier = getSeverityWeight(risk.severity);
  
  return probability * costImpact * severityMultiplier;
}

/**
 * Calculate total risk adjustment from array of risks
 */
export function calculateTotalRiskAdjustment(risks: Risk[]): {
  totalAdjustment: number;
  breakdown: RiskBreakdown[];
} {
  let totalAdjustment = 0;
  const breakdown: RiskBreakdown[] = risks.map((risk) => {
    const expectedValue = calculateRiskExpectedValue(risk);
    totalAdjustment += expectedValue;

    return {
      riskId: risk.id,
      riskTitle: risk.title,
      costImpact: risk.costImpactMostLikely,
      probability: risk.probability,
      severity: risk.severity,
      severityMultiplier: getSeverityWeight(risk.severity),
      expectedValue: Math.round(expectedValue * 100) / 100, // Round to 2 decimal places
    };
  });

  return {
    totalAdjustment: Math.round(totalAdjustment * 100) / 100,
    breakdown,
  };
}

/**
 * Calculate base MR using Standard method
 */
export function calculateBaseMR(totalCost: number): {
  amount: number;
  percentage: number;
} {
  // Industry standard: 15% for < $500k, 12% for $500k-$1M, 10% for > $1M
  const percentage = totalCost > 1000000 ? 10 : totalCost > 500000 ? 12 : 15;
  const amount = totalCost > 0 ? (totalCost * percentage) / 100 : 0;

  return {
    amount: Math.round(amount * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Calculate R&O-Driven MR
 * Formula: Final MR = Base MR (Standard) + Risk Adjustment
 */
export function calculateRODrivenMR(
  totalCost: number,
  risks: Risk[]
): ROImpactCalculationResult {
  // Calculate base MR using Standard method
  const baseMR = calculateBaseMR(totalCost);

  // Calculate risk adjustments
  const { totalAdjustment, breakdown } = calculateTotalRiskAdjustment(risks);

  // Final MR = Base MR + Risk Adjustment
  const finalMRAmount = baseMR.amount + totalAdjustment;
  const finalMRPercentage = totalCost > 0 ? (finalMRAmount / totalCost) * 100 : 0;

  return {
    amount: Math.round(finalMRAmount * 100) / 100,
    percentage: Math.round(finalMRPercentage * 100) / 100,
    baseMR: baseMR.amount,
    baseMRPercentage: baseMR.percentage,
    riskAdjustment: totalAdjustment,
    breakdown,
  };
}

/**
 * Format severity for display
 */
export function formatSeverity(severity: Severity): string {
  return severity;
}

/**
 * Get severity color class for UI
 */
export function getSeverityColorClass(severity: Severity): string {
  switch (severity) {
    case 'Low':
      return 'text-green-700 bg-green-100';
    case 'Medium':
      return 'text-yellow-700 bg-yellow-100';
    case 'High':
      return 'text-orange-700 bg-orange-100';
    case 'Critical':
      return 'text-red-700 bg-red-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
}

