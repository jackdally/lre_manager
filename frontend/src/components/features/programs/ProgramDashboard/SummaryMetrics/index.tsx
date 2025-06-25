import React from 'react';
import { SummaryType } from '../types';
import { formatCurrency } from '../utils';

interface SummaryMetricsProps {
  summary: SummaryType | null;
  missingActualsCount: number;
}

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({
  summary,
  missingActualsCount
}) => {
  if (!summary) return null;

  const hasMissingActuals = missingActualsCount > 0;
  const warningIcon = hasMissingActuals ? <span style={{ fontSize: '1.5em', verticalAlign: 'middle' }}>⚠️</span> : '';
  const baseClasses = `rounded-xl shadow p-4 transition-colors ${hasMissingActuals ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-white'}`;
  const opacityStyle = hasMissingActuals ? { opacity: 0.6 } : {};
  const textClasses = hasMissingActuals ? 'text-gray-400' : 'text-gray-500';
  const valueClasses = hasMissingActuals ? 'text-gray-500' : 'text-gray-900';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Actuals to Date */}
      <div className={baseClasses} style={opacityStyle}>
        <div className={`text-sm mb-1 ${textClasses}`}>
          {warningIcon} Actuals to Date
        </div>
        <div className={`font-bold text-2xl ${valueClasses}`}>
          {formatCurrency(summary.actualsToDate)}
        </div>
      </div>

      {/* ETC (Future Planned) */}
      <div className={baseClasses} style={opacityStyle}>
        <div className={`text-sm mb-1 ${textClasses}`}>
          {warningIcon} ETC (Future Planned)
        </div>
        <div className={`font-bold text-2xl ${valueClasses}`}>
          {formatCurrency(summary.etc)}
        </div>
      </div>

      {/* EAC (Actuals + ETC) */}
      <div className={baseClasses} style={opacityStyle}>
        <div className={`text-sm mb-1 ${textClasses}`}>
          {warningIcon} EAC (Actuals + ETC)
        </div>
        <div className={`font-bold text-2xl ${valueClasses}`}>
          {formatCurrency(summary.eac)}
        </div>
      </div>

      {/* VAC (Budget - EAC) */}
      <div className={baseClasses} style={opacityStyle}>
        <div className={`text-sm mb-1 ${textClasses}`}>
          {warningIcon} VAC (Budget - EAC)
        </div>
        <div className={`font-bold text-2xl ${hasMissingActuals ? 'text-gray-500' : summary.vac < 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(summary.vac)}
        </div>
      </div>
    </div>
  );
}; 