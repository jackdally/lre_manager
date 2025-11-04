/**
 * Severity weight constants for R&O-Driven Management Reserve calculation
 * 
 * These multipliers are applied to the expected value of each risk
 * to adjust the MR based on risk severity.
 */
export const SEVERITY_WEIGHTS = {
  Low: 0.5,
  Medium: 1.0,
  High: 1.5,
  Critical: 2.0,
} as const;

export type Severity = keyof typeof SEVERITY_WEIGHTS;

/**
 * Get severity weight multiplier
 */
export function getSeverityWeight(severity: Severity): number {
  return SEVERITY_WEIGHTS[severity];
}

