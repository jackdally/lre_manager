import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { boeVersionsApi } from '../../../../../services/boeApi';

interface ProgramHealthIndicatorsProps {
  programId: string;
  vac?: number; // Variance at Completion
  totalBudget?: number;
  missingActualsCount?: number;
  scheduleVariance?: number;
  schedulePerformanceIndex?: number;
  costPerformanceIndex?: number;
  baselineToDate?: number;
  actualsToDate?: number;
}

interface HealthConcern {
  id: string;
  severity: 'warning' | 'critical';
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Program Health Indicators - Shows dynamic, actionable health metrics
 * 
 * Only displays when there are concerns that need user attention.
 * All indicators shown here are actionable and change over time.
 */
const ProgramHealthIndicators: React.FC<ProgramHealthIndicatorsProps> = ({
  programId,
  vac = 0,
  totalBudget = 0,
  missingActualsCount = 0,
  scheduleVariance = 0,
  schedulePerformanceIndex = 1.0,
  costPerformanceIndex = 1.0,
  baselineToDate = 0,
  actualsToDate = 0,
}) => {
  const navigate = useNavigate();
  const [boeAge, setBoeAge] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBOEAge();
  }, [programId]);

  const loadBOEAge = async () => {
    try {
      const boeData = await boeVersionsApi.getCurrentBOE(programId);
      if (boeData?.currentBOE?.updatedAt) {
        const updatedDate = new Date(boeData.currentBOE.updatedAt);
        const daysSinceUpdate = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
        setBoeAge(daysSinceUpdate);
      }
    } catch (error) {
      console.error('Error loading BOE age:', error);
    } finally {
      setLoading(false);
    }
  };

  const concerns: HealthConcern[] = [];

  // 1. Budget Variance (VAC)
  if (totalBudget > 0) {
    const vacPercent = (vac / totalBudget) * 100;
    if (vacPercent < -10) {
      concerns.push({
        id: 'budget-critical',
        severity: 'critical',
        icon: XCircleIcon,
        title: 'Critical: Over Budget',
        message: `${Math.abs(vacPercent).toFixed(1)}% over budget (VAC: ${vac < 0 ? '-' : ''}$${Math.abs(vac).toLocaleString()})`,
        action: {
          label: 'Review Budget',
          onClick: () => navigate(`/programs/${programId}/boe`),
        },
      });
    } else if (vacPercent < -5) {
      concerns.push({
        id: 'budget-warning',
        severity: 'warning',
        icon: ExclamationTriangleIcon,
        title: 'Warning: Over Budget',
        message: `${Math.abs(vacPercent).toFixed(1)}% over budget (VAC: ${vac < 0 ? '-' : ''}$${Math.abs(vac).toLocaleString()})`,
        action: {
          label: 'Review Budget',
          onClick: () => navigate(`/programs/${programId}/boe`),
        },
      });
    }
  }

  // 2. Schedule Performance (SPI)
  if (schedulePerformanceIndex < 0.9) {
    concerns.push({
      id: 'schedule-critical',
      severity: 'critical',
      icon: ClockIcon,
      title: 'Critical: Behind Schedule',
      message: `SPI: ${schedulePerformanceIndex.toFixed(2)} - Significantly behind schedule`,
      action: {
        label: 'Review Schedule',
        onClick: () => navigate(`/programs/${programId}/ledger`),
      },
    });
  } else if (schedulePerformanceIndex < 0.95) {
    concerns.push({
      id: 'schedule-warning',
      severity: 'warning',
      icon: ClockIcon,
      title: 'Warning: Behind Schedule',
      message: `SPI: ${schedulePerformanceIndex.toFixed(2)} - Slightly behind schedule`,
      action: {
        label: 'Review Schedule',
        onClick: () => navigate(`/programs/${programId}/ledger`),
      },
    });
  }

  // 3. Cost Performance (CPI)
  if (costPerformanceIndex < 0.9) {
    concerns.push({
      id: 'cost-critical',
      severity: 'critical',
      icon: ArrowTrendingDownIcon,
      title: 'Critical: Cost Overrun',
      message: `CPI: ${costPerformanceIndex.toFixed(2)} - Significant cost overrun`,
      action: {
        label: 'Review Costs',
        onClick: () => navigate(`/programs/${programId}/ledger`),
      },
    });
  } else if (costPerformanceIndex < 0.95) {
    concerns.push({
      id: 'cost-warning',
      severity: 'warning',
      icon: ArrowTrendingDownIcon,
      title: 'Warning: Cost Overrun',
      message: `CPI: ${costPerformanceIndex.toFixed(2)} - Slight cost overrun`,
      action: {
        label: 'Review Costs',
        onClick: () => navigate(`/programs/${programId}/ledger`),
      },
    });
  }

  // 4. Missing Actuals
  if (missingActualsCount > 0) {
    concerns.push({
      id: 'missing-actuals',
      severity: 'warning',
      icon: ExclamationTriangleIcon,
      title: 'Missing Actuals',
      message: `${missingActualsCount} ${missingActualsCount === 1 ? 'entry' : 'entries'} missing actuals data`,
      action: {
        label: 'Upload Actuals',
        onClick: () => navigate(`/programs/${programId}/actuals`),
      },
    });
  }

  // 5. BOE Age Warning (if BOE is old)
  if (boeAge !== null && boeAge > 90) {
    concerns.push({
      id: 'boe-age',
      severity: 'warning',
      icon: ClockIcon,
      title: 'BOE May Need Review',
      message: `BOE hasn't been updated in ${boeAge} days. Consider reviewing for accuracy.`,
      action: {
        label: 'Review BOE',
        onClick: () => navigate(`/programs/${programId}/boe`),
      },
    });
  }

  // 6. BOE Variance Warning (if actuals differ significantly from baseline)
  if (baselineToDate > 0 && actualsToDate > 0) {
    const variancePercent = ((actualsToDate - baselineToDate) / baselineToDate) * 100;
    if (Math.abs(variancePercent) > 15) {
      concerns.push({
        id: 'boe-variance',
        severity: variancePercent > 0 ? 'critical' : 'warning',
        icon: ExclamationTriangleIcon,
        title: variancePercent > 0 ? 'Spending Exceeds Baseline' : 'Spending Below Baseline',
        message: `Actuals ${variancePercent > 0 ? 'exceed' : 'below'} baseline by ${Math.abs(variancePercent).toFixed(1)}%`,
        action: {
          label: 'Review BOE',
          onClick: () => navigate(`/programs/${programId}/boe`),
        },
      });
    }
  }

  // Don't render if no concerns
  if (concerns.length === 0) {
    return null;
  }

  // Sort concerns: critical first, then by severity
  const sortedConcerns = concerns.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return 0;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Program Health</h3>
        <span className="text-xs text-gray-500">{concerns.length} {concerns.length === 1 ? 'concern' : 'concerns'}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedConcerns.map((concern) => {
          const Icon = concern.icon;
          const bgColor = concern.severity === 'critical' ? 'bg-red-50' : 'bg-yellow-50';
          const borderColor = concern.severity === 'critical' ? 'border-red-200' : 'border-yellow-200';
          const textColor = concern.severity === 'critical' ? 'text-red-800' : 'text-yellow-800';
          const iconColor = concern.severity === 'critical' ? 'text-red-600' : 'text-yellow-600';

          return (
            <div
              key={concern.id}
              className={`flex items-start justify-between p-3 rounded-lg border ${bgColor} ${borderColor}`}
            >
              <div className="flex items-start flex-1">
                <Icon className={`h-5 w-5 ${iconColor} mr-2 mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold ${textColor} mb-1`}>
                    {concern.title}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">{concern.message}</div>
                  {concern.action && (
                    <button
                      onClick={concern.action.onClick}
                      className={`text-xs font-medium ${
                        concern.severity === 'critical'
                          ? 'text-red-700 hover:text-red-800'
                          : 'text-yellow-700 hover:text-yellow-800'
                      } underline`}
                    >
                      {concern.action.label} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgramHealthIndicators;
