import React from 'react';
import { SummaryType } from '../types';
import { formatCurrency } from '../utils';

interface AdditionalMetricsProps {
  summary: SummaryType | null;
  missingActualsCount: number;
}

export const AdditionalMetrics: React.FC<AdditionalMetricsProps> = ({
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
      {/* Schedule Variance (SV) */}
      <div className={baseClasses} style={opacityStyle}>
        <div className={`text-sm mb-1 ${textClasses}`}>
          {warningIcon} Schedule Variance (SV)
        </div>
        <div className="text-xs text-gray-400 mb-2">Actuals to Date - Baseline to Date</div>
        <div className={`font-semibold text-lg ${hasMissingActuals ? 'text-gray-500' : summary.scheduleVariance > 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
          {formatCurrency(summary.scheduleVariance)}
        </div>
        <div className="text-xs text-gray-400 mt-1">SPI: {summary.schedulePerformanceIndex?.toFixed(2)}</div>
      </div>

      {/* Cost Variance (CV) */}
      <div className={baseClasses} style={opacityStyle}>
        <div className={`text-sm mb-1 ${textClasses}`}>
          {warningIcon} Cost Variance (CV)
        </div>
        <div className="text-xs text-gray-400 mb-2">Planned to Date - Actuals to Date</div>
        <div className={`font-semibold text-lg ${hasMissingActuals ? 'text-gray-500' : summary.costVariance > 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
          {formatCurrency(summary.costVariance)}
        </div>
        <div className="text-xs text-gray-400 mt-1">CPI: {summary.costPerformanceIndex?.toFixed(2)}</div>
      </div>

      {/* Project Baseline */}
      <div className={baseClasses} style={opacityStyle}>
        <div className={`text-sm mb-1 ${textClasses}`}>
          {warningIcon} Project Baseline
        </div>
        <div className="text-xs text-gray-400 mb-2">Total Baseline Budget</div>
        <div className={`font-semibold text-lg ${valueClasses}`}>
          {formatCurrency(summary.project_baseline_total)}
        </div>
        <div className="text-xs text-gray-400 mt-1">To Date: {formatCurrency(summary.baselineToDate)}</div>
      </div>

      {/* Project Planned */}
      <div className={baseClasses} style={opacityStyle}>
        <div className={`text-sm mb-1 ${textClasses}`}>
          {warningIcon} Project Planned
        </div>
        <div className="text-xs text-gray-400 mb-2">Total Planned Budget</div>
        <div className={`font-semibold text-lg ${valueClasses}`}>
          {formatCurrency(summary.project_planned_total)}
        </div>
        <div className="text-xs text-gray-400 mt-1">To Date: {formatCurrency(summary.plannedToDate)}</div>
      </div>
    </div>
  );
}; 