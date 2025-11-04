import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { boeVersionsApi } from '../../../../../services/boeApi';
import { programSetupApi, SetupStatus } from '../../../../../services/programSetupApi';
import { riskOpportunityApi } from '../../../../../services/riskOpportunityApi';

interface ProgramHealthIndicatorsProps {
  programId: string;
  vac?: number; // Variance at Completion
  totalBudget?: number;
}

interface HealthStatus {
  boeStatus: 'none' | 'draft' | 'under-review' | 'approved' | 'baseline' | 'error';
  boeStatusLabel: string;
  riskOpportunityStatus: 'initialized' | 'not-initialized' | 'loading';
  budgetVariance: 'healthy' | 'warning' | 'critical';
  loading: boolean;
}

const ProgramHealthIndicators: React.FC<ProgramHealthIndicatorsProps> = ({
  programId,
  vac = 0,
  totalBudget = 0,
}) => {
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    boeStatus: 'none',
    boeStatusLabel: 'No BOE',
    riskOpportunityStatus: 'loading',
    budgetVariance: 'healthy',
    loading: true,
  });
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);

  useEffect(() => {
    loadHealthStatus();
  }, [programId, vac, totalBudget]);

  const loadHealthStatus = async () => {
    try {
      setHealthStatus((prev) => ({ ...prev, loading: true }));

      // Fetch BOE status, setup status, and R&O status in parallel
      const [boeData, setupData, roStatus] = await Promise.all([
        boeVersionsApi.getCurrentBOE(programId).catch(() => ({ currentBOE: null })),
        programSetupApi.getSetupStatus(programId).catch(() => null),
        riskOpportunityApi.getRegisterStatus(programId).catch(() => ({ initialized: false })),
      ]);

      setSetupStatus(setupData);

      // Determine BOE status
      let boeStatus: HealthStatus['boeStatus'] = 'none';
      let boeStatusLabel = 'No BOE';
      
      if (boeData?.currentBOE) {
        const status = boeData.currentBOE.status;
        switch (status) {
          case 'Draft':
            boeStatus = 'draft';
            boeStatusLabel = 'Draft';
            break;
          case 'Under Review':
            boeStatus = 'under-review';
            boeStatusLabel = 'Under Review';
            break;
          case 'Approved':
            boeStatus = 'approved';
            boeStatusLabel = 'Approved';
            break;
          case 'Baseline':
            boeStatus = 'baseline';
            boeStatusLabel = 'Baseline';
            break;
          default:
            boeStatus = 'none';
            boeStatusLabel = 'Unknown';
        }
      }

      // Determine R&O status
      const riskOpportunityStatus = roStatus.initialized ? 'initialized' : 'not-initialized';

      // Determine budget variance status
      let budgetVariance: HealthStatus['budgetVariance'] = 'healthy';
      if (totalBudget > 0) {
        const vacPercent = (vac / totalBudget) * 100;
        if (vacPercent < -10) {
          budgetVariance = 'critical'; // More than 10% over budget
        } else if (vacPercent < -5) {
          budgetVariance = 'warning'; // Between 5-10% over budget
        }
      }

      setHealthStatus({
        boeStatus,
        boeStatusLabel,
        riskOpportunityStatus,
        budgetVariance,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading health status:', error);
      setHealthStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  const getBOEIndicator = () => {
    const { boeStatus, boeStatusLabel } = healthStatus;
    
    switch (boeStatus) {
      case 'none':
        return {
          icon: XCircleIcon,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          action: () => navigate(`/programs/${programId}/boe`),
          actionLabel: 'Create BOE',
        };
      case 'draft':
        return {
          icon: ClockIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          action: () => navigate(`/programs/${programId}/boe`),
          actionLabel: 'Edit BOE',
        };
      case 'under-review':
        return {
          icon: ClockIcon,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          action: () => navigate(`/programs/${programId}/boe`),
          actionLabel: 'View Status',
        };
      case 'approved':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          action: () => navigate(`/programs/${programId}/boe`),
          actionLabel: 'View BOE',
        };
      case 'baseline':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          action: () => navigate(`/programs/${programId}/boe`),
          actionLabel: 'View BOE',
        };
      default:
        return {
          icon: InformationCircleIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          action: () => navigate(`/programs/${programId}/boe`),
          actionLabel: 'View BOE',
        };
    }
  };

  const getROIndicator = () => {
    const { riskOpportunityStatus } = healthStatus;
    
    if (riskOpportunityStatus === 'initialized') {
      return {
        icon: CheckCircleIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        label: 'Initialized',
        action: () => navigate(`/programs/${programId}/risks`),
        actionLabel: 'Manage R&O',
      };
    } else {
      return {
        icon: ExclamationTriangleIcon,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        label: 'Not Initialized',
        action: () => navigate(`/programs/${programId}/setup`),
        actionLabel: 'Initialize',
      };
    }
  };

  const getBudgetVarianceIndicator = () => {
    const { budgetVariance } = healthStatus;
    
    if (budgetVariance === 'critical') {
      return {
        icon: XCircleIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        label: 'Critical Over Budget',
        message: `VAC: ${vac < 0 ? '-' : ''}$${Math.abs(vac).toLocaleString()}`,
      };
    } else if (budgetVariance === 'warning') {
      return {
        icon: ExclamationTriangleIcon,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        label: 'Over Budget',
        message: `VAC: ${vac < 0 ? '-' : ''}$${Math.abs(vac).toLocaleString()}`,
      };
    } else {
      return null; // Don't show indicator if healthy
    }
  };

  if (healthStatus.loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading health status...</span>
        </div>
      </div>
    );
  }

  const boeIndicator = getBOEIndicator();
  const roIndicator = getROIndicator();
  const budgetIndicator = getBudgetVarianceIndicator();
  const BOEIcon = boeIndicator.icon;
  const ROIcon = roIndicator.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Program Health</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* BOE Status Indicator */}
        <button
          onClick={boeIndicator.action}
          className={`flex items-center justify-between p-3 rounded-lg border ${boeIndicator.bgColor} ${boeIndicator.borderColor} hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center">
            <BOEIcon className={`h-5 w-5 ${boeIndicator.color} mr-2`} />
            <div className="text-left">
              <div className="text-xs font-medium text-gray-600">BOE Status</div>
              <div className={`text-sm font-semibold ${boeIndicator.textColor}`}>
                {healthStatus.boeStatusLabel}
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-500 hover:text-gray-700">
            {boeIndicator.actionLabel} →
          </span>
        </button>

        {/* Risk & Opportunity Status Indicator */}
        <button
          onClick={roIndicator.action}
          className={`flex items-center justify-between p-3 rounded-lg border ${roIndicator.bgColor} ${roIndicator.borderColor} hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center">
            <ROIcon className={`h-5 w-5 ${roIndicator.color} mr-2`} />
            <div className="text-left">
              <div className="text-xs font-medium text-gray-600">R&O Register</div>
              <div className={`text-sm font-semibold ${roIndicator.textColor}`}>
                {roIndicator.label}
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-500 hover:text-gray-700">
            {roIndicator.actionLabel} →
          </span>
        </button>

        {/* Budget Variance Indicator */}
        {budgetIndicator ? (
          <div
            className={`flex items-center justify-between p-3 rounded-lg border ${budgetIndicator.bgColor} ${budgetIndicator.borderColor}`}
          >
            <div className="flex items-center">
              <budgetIndicator.icon className={`h-5 w-5 ${budgetIndicator.color} mr-2`} />
              <div className="text-left">
                <div className="text-xs font-medium text-gray-600">Budget Status</div>
                <div className={`text-sm font-semibold ${budgetIndicator.textColor}`}>
                  {budgetIndicator.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{budgetIndicator.message}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-lg border bg-green-50 border-green-200">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <div className="text-left">
                <div className="text-xs font-medium text-gray-600">Budget Status</div>
                <div className="text-sm font-semibold text-green-800">Healthy</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramHealthIndicators;

