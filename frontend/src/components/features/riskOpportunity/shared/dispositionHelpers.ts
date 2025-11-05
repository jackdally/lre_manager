/**
 * Disposition definitions and transition helpers
 */

export interface DispositionDefinition {
  value: string;
  label: string;
  description: string;
  category: 'risk' | 'opportunity' | 'both';
}

export const DISPOSITION_DEFINITIONS: DispositionDefinition[] = [
  {
    value: 'Identified',
    label: 'Identified',
    description: 'Risk or opportunity has been identified but no action has been taken yet.',
    category: 'both',
  },
  {
    value: 'In Progress',
    label: 'In Progress',
    description: 'Active work is being done to mitigate the risk or realize the opportunity.',
    category: 'both',
  },
  {
    value: 'Mitigated',
    label: 'Mitigated',
    description: 'Risk has been successfully mitigated through preventive or corrective actions.',
    category: 'risk',
  },
  {
    value: 'Realized',
    label: 'Realized',
    description: 'Risk has occurred (materialized) or opportunity has been successfully captured. This is a terminal state indicating the risk/opportunity has materialized. Can only be reversed to "In Progress" by reversing MR utilization.',
    category: 'both',
  },
  {
    value: 'Retired',
    label: 'Retired',
    description: 'Risk or opportunity is no longer relevant and has been closed out. Can be reopened if needed.',
    category: 'both',
  },
  {
    value: 'Transferred',
    label: 'Transferred',
    description: 'Risk has been transferred to another party (e.g., via insurance or contract).',
    category: 'risk',
  },
  {
    value: 'Accepted',
    label: 'Accepted',
    description: 'Risk has been accepted (acknowledged but no mitigation actions will be taken).',
    category: 'risk',
  },
  {
    value: 'Deferred',
    label: 'Deferred',
    description: 'Opportunity is being deferred to a later time or phase.',
    category: 'opportunity',
  },
  {
    value: 'Lost',
    label: 'Lost',
    description: 'Opportunity was not captured or is no longer available. Can be reopened if the opportunity becomes available again.',
    category: 'opportunity',
  },
];

/**
 * Valid disposition transitions for risks
 * Allows reversals to enable correction of mistakes
 */
export const RISK_DISPOSITION_TRANSITIONS: Record<string, string[]> = {
  Identified: ['In Progress', 'Mitigated', 'Realized', 'Retired', 'Transferred', 'Accepted'], // Allow Realized for materialization
  'In Progress': ['Mitigated', 'Realized', 'Retired', 'Transferred', 'Accepted', 'Identified'],
  Mitigated: ['Retired', 'In Progress'], // Can go back to In Progress if mistake
  Realized: ['In Progress'], // Terminal state - can only be reversed to In Progress (requires MR reversal)
  Retired: ['In Progress', 'Mitigated', 'Realized', 'Transferred', 'Accepted'], // Can reopen from retired
  Transferred: ['Retired', 'In Progress'], // Can go back to In Progress if mistake
  Accepted: ['Retired', 'In Progress'], // Can go back to In Progress if mistake
};

/**
 * Valid disposition transitions for opportunities
 * Allows reversals to enable correction of mistakes
 */
export const OPPORTUNITY_DISPOSITION_TRANSITIONS: Record<string, string[]> = {
  Identified: ['In Progress', 'Realized', 'Retired', 'Deferred'],
  'In Progress': ['Realized', 'Retired', 'Deferred', 'Lost', 'Identified'],
  Realized: ['In Progress'], // Terminal state - can only be reversed to In Progress
  Retired: ['In Progress', 'Realized', 'Deferred'], // Can reopen from retired
  Deferred: ['Identified', 'In Progress', 'Retired', 'Lost'],
  Lost: ['Retired', 'In Progress'], // Can go back to In Progress if mistake
};

/**
 * Get valid next dispositions for a risk
 */
export const getValidRiskDispositions = (currentDisposition: string): string[] => {
  return RISK_DISPOSITION_TRANSITIONS[currentDisposition] || [];
};

/**
 * Get valid next dispositions for an opportunity
 */
export const getValidOpportunityDispositions = (currentDisposition: string): string[] => {
  return OPPORTUNITY_DISPOSITION_TRANSITIONS[currentDisposition] || [];
};

/**
 * Get disposition definition
 */
export const getDispositionDefinition = (disposition: string): DispositionDefinition | undefined => {
  return DISPOSITION_DEFINITIONS.find(d => d.value === disposition);
};

/**
 * Check if a transition is valid for a risk
 */
export const isValidRiskTransition = (current: string, next: string): boolean => {
  const valid = RISK_DISPOSITION_TRANSITIONS[current] || [];
  return valid.includes(next);
};

/**
 * Check if a transition is valid for an opportunity
 */
export const isValidOpportunityTransition = (current: string, next: string): boolean => {
  const valid = OPPORTUNITY_DISPOSITION_TRANSITIONS[current] || [];
  return valid.includes(next);
};

/**
 * Check if a transition is a reversal (going back to a previous state)
 */
export const isReversalTransition = (current: string, next: string, type: 'risk' | 'opportunity'): boolean => {
  // Reversal transitions (going back to active states)
  const reversalStates = ['In Progress', 'Identified'];
  return reversalStates.includes(next) && current !== 'Identified' && current !== 'In Progress';
};

/**
 * Check if transitioning from a terminal state
 */
export const isFromTerminalState = (current: string): boolean => {
  return current === 'Retired' || current === 'Lost' || current === 'Realized';
};

/**
 * Get transition explanation message
 */
export const getTransitionExplanation = (
  current: string,
  next: string,
  type: 'risk' | 'opportunity'
): string => {
  const valid = type === 'risk' 
    ? getValidRiskDispositions(current)
    : getValidOpportunityDispositions(current);
  
  if (valid.length === 0) {
    return `${current} is a terminal state. No further transitions are allowed.`;
  }
  
  if (!valid.includes(next)) {
    return `Cannot transition from "${current}" to "${next}". Valid next states are: ${valid.join(', ')}.`;
  }
  
  // Add special messaging for reversals and terminal state transitions
  if (isReversalTransition(current, next, type)) {
    return `Transitioning from "${current}" to "${next}" is valid. This will reopen the risk/opportunity for active work.`;
  }
  
  if (current === 'Realized' && next === 'In Progress') {
    return `Transitioning from "${current}" to "${next}" is valid. This will reverse the materialization. Note: MR utilization must also be reversed separately.`;
  }
  
  if (isFromTerminalState(current) && current !== 'Realized') {
    return `Transitioning from "${current}" to "${next}" is valid. This will reopen the risk/opportunity from a closed state.`;
  }
  
  return `Transitioning from "${current}" to "${next}" is valid.`;
};

/**
 * Check if a risk is realized (risk occurred - hit to the program)
 */
export const isRiskRealized = (disposition: string): boolean => {
  return disposition === 'Realized';
};

/**
 * Check if an opportunity is realized (opportunity captured - benefit obtained)
 */
export const isOpportunityRealized = (disposition: string): boolean => {
  return disposition === 'Realized';
};

/**
 * Check if a risk is closed (avoided/neutralized - not a hit)
 * Closed states for risks: Retired, Mitigated, Transferred, Accepted
 * Note: Realized is NOT included here - it's a different category (risk occurred)
 */
export const isRiskClosed = (disposition: string): boolean => {
  const closedStates = ['Retired', 'Mitigated', 'Transferred', 'Accepted'];
  return closedStates.includes(disposition);
};

/**
 * Check if an opportunity is closed (no longer relevant)
 * Closed states for opportunities: Retired, Lost
 * Note: Realized is NOT included here - it's a positive outcome
 */
export const isOpportunityClosed = (disposition: string): boolean => {
  const closedStates = ['Retired', 'Lost'];
  return closedStates.includes(disposition);
};

/**
 * Check if a risk is active (not closed and not realized)
 */
export const isRiskActive = (disposition: string): boolean => {
  return !isRiskClosed(disposition) && !isRiskRealized(disposition);
};

/**
 * Check if an opportunity is active (not closed and not realized)
 */
export const isOpportunityActive = (disposition: string): boolean => {
  return !isOpportunityClosed(disposition) && !isOpportunityRealized(disposition);
};

