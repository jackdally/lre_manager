import React from 'react';
import { formatCurrency } from '../utils';

// Custom tooltip for bullet chart
export const BulletChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const actual = payload.find((p: any) => p.dataKey === 'actual')?.value;
  const planned = payload[0]?.payload?.planned;
  return (
    <div style={{ background: 'white', border: '1px solid #ccc', borderRadius: 6, padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#2563EB', fontWeight: 500 }}>Actual: {formatCurrency(actual)}</div>
      <div style={{ color: '#6B7280', fontWeight: 500 }}>Planned: {formatCurrency(planned)}</div>
    </div>
  );
};

// Custom tooltip for main chart
interface MainChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  selectedMonth: string;
}

export const MainChartTooltip: React.FC<MainChartTooltipProps> = ({ active, payload, label, selectedMonth }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const isFuture = data.month > selectedMonth;
  return (
    <div style={{ background: 'white', border: '1px solid #ccc', borderRadius: 8, padding: 16, minWidth: 220 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#6B7280', marginBottom: 4 }}>Baseline : <span style={{ color: '#6B7280' }}>${data.baseline?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
      <div style={{ color: '#D97706', marginBottom: 4 }}>Planned : <span style={{ color: '#D97706' }}>${data.planned?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
      <div style={{ color: '#2563EB', marginBottom: 4 }}>Actual : <span style={{ color: '#2563EB' }}>{!isFuture ? `$${data.actual?.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '--'}</span></div>
      <div style={{ color: '#4B5563', marginBottom: 4 }}>Cumulative Baseline : <span style={{ color: '#4B5563' }}>${data.cumBaseline?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
      <div style={{ color: '#D97706', marginBottom: 4 }}>Cumulative Planned : <span style={{ color: '#D97706' }}>${data.cumPlanned?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
      {!isFuture && <div style={{ color: '#2563EB', marginBottom: 4 }}>Cumulative Actual : <span style={{ color: '#2563EB' }}>${data.cumActual?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
      {isFuture && <div style={{ color: '#16A34A', marginBottom: 4 }}>Cumulative Projected : <span style={{ color: '#16A34A' }}>${data.cumProjected?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
    </div>
  );
}; 