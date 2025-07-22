import React, { useEffect, useState } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { timeAllocationApi } from '../../../services/boeApi';
import { formatCurrency, safeNumber } from '../../../utils/currencyUtils';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

interface TimeAllocationSummaryProps {
  programId: string;
  onRefresh?: () => void;
}

const TimeAllocationSummary: React.FC<TimeAllocationSummaryProps> = ({ 
  programId, 
  onRefresh 
}) => {
  const { 
    timeAllocationSummary, 
    timeAllocationsLoading, 
    timeAllocationsError,
    setTimeAllocationSummary, 
    setTimeAllocationsLoading, 
    setTimeAllocationsError 
  } = useBOEStore();

  const [selectedAllocation, setSelectedAllocation] = useState<string | null>(null);
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false);

  // Load time allocation summary
  useEffect(() => {
    loadTimeAllocationSummary();
  }, [programId]);

  const loadTimeAllocationSummary = async () => {
    try {
      setTimeAllocationsLoading(true);
      setTimeAllocationsError(null);
      
      const summary = await timeAllocationApi.getTimeAllocationSummary(programId);
      setTimeAllocationSummary(summary);
    } catch (error) {
      console.error('Error loading time allocation summary:', error);
      setTimeAllocationsError(error instanceof Error ? error.message : 'Failed to load time allocation summary');
    } finally {
      setTimeAllocationsLoading(false);
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600';
    if (variance < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <ArrowTrendingUpIcon className="h-4 w-4 text-red-600" />;
    if (variance < 0) return <ArrowTrendingDownIcon className="h-4 w-4 text-green-600" />;
    return <MinusIcon className="h-4 w-4 text-gray-600" />;
  };

  const getVarianceDescription = (variance: number) => {
    if (variance > 0) return 'Over Budget';
    if (variance < 0) return 'Under Budget';
    return 'On Budget';
  };

  const getStatusColor = (isLocked: boolean) => {
    return isLocked ? 'text-green-600' : 'text-yellow-600';
  };

  const getStatusIcon = (isLocked: boolean) => {
    return isLocked ? 
      <CheckCircleIcon className="h-4 w-4 text-green-600" /> : 
      <ClockIcon className="h-4 w-4 text-yellow-600" />;
  };

  const getStatusText = (isLocked: boolean) => {
    return isLocked ? 'Locked' : 'Draft';
  };

  if (timeAllocationsLoading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (timeAllocationsError) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Time Allocations</h3>
              <div className="mt-2 text-sm text-red-700">
                {timeAllocationsError}
              </div>
              <div className="mt-4">
                <button
                  onClick={loadTimeAllocationSummary}
                  className="text-sm text-red-800 hover:text-red-900 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!timeAllocationSummary || timeAllocationSummary.totalAllocations === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="text-center py-8">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Time Allocations</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first time allocation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Allocations</p>
              <p className="text-2xl font-semibold text-gray-900">
                {timeAllocationSummary.totalAllocations}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(timeAllocationSummary.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Allocated</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(timeAllocationSummary.allocatedAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {getVarianceIcon(timeAllocationSummary.variance)}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Variance</p>
              <p className={`text-2xl font-semibold ${getVarianceColor(timeAllocationSummary.variance)}`}>
                {formatCurrency(Math.abs(timeAllocationSummary.variance))}
              </p>
              <p className={`text-sm ${getVarianceColor(timeAllocationSummary.variance)}`}>
                {getVarianceDescription(timeAllocationSummary.variance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Budget Utilization</h3>
          <div className="text-sm text-gray-500">
            {formatCurrency(timeAllocationSummary.actualAmount)} of {formatCurrency(timeAllocationSummary.allocatedAmount)}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ 
              width: `${timeAllocationSummary.allocatedAmount > 0 ? 
                (timeAllocationSummary.actualAmount / timeAllocationSummary.allocatedAmount) * 100 : 0}%` 
            }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Time Allocations</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeAllocationSummary.allocations.map((allocation) => (
                <tr 
                  key={allocation.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedAllocation(selectedAllocation === allocation.id ? null : allocation.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {allocation.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(allocation.totalAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(allocation.allocatedAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(allocation.actualAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getVarianceIcon(allocation.variance)}
                      <span className={`ml-1 text-sm ${getVarianceColor(allocation.variance)}`}>
                        {formatCurrency(Math.abs(allocation.variance))}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(allocation.isLocked)}
                      <span className={`ml-1 text-sm ${getStatusColor(allocation.isLocked)}`}>
                        {getStatusText(allocation.isLocked)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(allocation.startDate).toLocaleDateString()} - {new Date(allocation.endDate).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Breakdown Visualization */}
      {showMonthlyBreakdown && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h3>
            <button
              onClick={() => setShowMonthlyBreakdown(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Hide
            </button>
          </div>
          
          <div className="space-y-4">
            {timeAllocationSummary.allocations.map((allocation) => (
              <div key={allocation.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">{allocation.name}</h4>
                <div className="grid grid-cols-12 gap-1">
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = new Date();
                    month.setMonth(month.getMonth() + i);
                    const monthKey = month.toISOString().slice(0, 7);
                    const isInRange = month >= new Date(allocation.startDate) && month <= new Date(allocation.endDate);
                    
                    return (
                      <div
                        key={monthKey}
                        className={`h-8 rounded text-xs flex items-center justify-center ${
                          isInRange ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'
                        }`}
                        title={`${monthKey}: ${isInRange ? 'Allocated' : 'No allocation'}`}
                      >
                        {month.getMonth() + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show/Hide Monthly Breakdown Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowMonthlyBreakdown(!showMonthlyBreakdown)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ChartBarIcon className="h-4 w-4 mr-2" />
          {showMonthlyBreakdown ? 'Hide' : 'Show'} Monthly Breakdown
        </button>
      </div>
    </div>
  );
};

export default TimeAllocationSummary; 