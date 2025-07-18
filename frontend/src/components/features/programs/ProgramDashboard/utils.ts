// Add a helper for currency formatting with negative sign before dollar
export function formatCurrency(val: number | undefined | null) {
  if (val == null) return '--';
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(absVal);
  return (val < 0 ? '-' : '') + formatted;
}

// Helper for percent formatting with sign
export function formatPercent(val: number | undefined | null, showPlus = false) {
  if (val == null || isNaN(val)) return '--';
  const sign = val > 0 ? (showPlus ? '+' : '') : (val < 0 ? '-' : '');
  return sign + Math.abs(val).toFixed(1) + '%';
}

// Helper to format ISO or YYYY-MM-DD as MM/DD/YYYY
export const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A';
  // Extract only the date part if it's an ISO string
  const datePart = dateStr.split('T')[0];
  const [y, m, d] = datePart.split('-');
  return `${m}/${d}/${y}`;
};

// Helper to get YYYY-MM from ISO or YYYY-MM-DD string
export const getYearMonth = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  const datePart = dateStr.split('T')[0];
  const [y, m] = datePart.split('-');
  return `${y}-${m}`;
};

export const CATEGORY_COLORS = [
  '#2563EB', '#F59E42', '#10B981', '#F43F5E', '#6366F1', '#FBBF24', '#14B8A6', '#A21CAF', '#E11D48', '#64748B'
]; 