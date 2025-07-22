/**
 * Utility functions for currency formatting and number handling
 */

/**
 * Format a number as currency with proper decimal places
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  
  // Ensure we have a valid number
  const num = Number(amount);
  if (isNaN(num)) {
    return '$0.00';
  }
  
  // Check for extremely large numbers that might cause formatting issues
  if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
    return '$0.00';
  }
  
  // Format with 2 decimal places and proper thousands separators
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

/**
 * Format a number with thousands separators but no currency symbol
 */
export const formatNumber = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  
  const num = Number(amount);
  if (isNaN(num)) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Parse a string to a valid number, handling edge cases
 */
export const parseNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    // Remove currency symbols and commas
    const cleaned = value.replace(/[$,]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
};

/**
 * Round a number to 2 decimal places
 */
export const roundToTwoDecimals = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

/**
 * Validate if a value is a valid currency amount
 */
export const isValidCurrency = (value: any): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  
  const num = parseNumber(value);
  return !isNaN(num) && num >= 0;
};

/**
 * Safe number conversion with debugging
 */
export const safeNumber = (value: any): number => {
  if (value === null || value === undefined) {
    return 0;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    // Handle malformed strings like "00.000.000.000.000.000.000.00"
    if (value.includes('00.000.000')) {
      return 0;
    }
    
    const cleaned = value.replace(/[$,]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}; 