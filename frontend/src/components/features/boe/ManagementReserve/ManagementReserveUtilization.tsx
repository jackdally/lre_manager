import React, { useState } from 'react';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { ManagementReserve } from '../../../../store/boeStore';
import { formatCurrency } from '../../../../utils/currencyUtils';

interface ManagementReserveUtilizationProps {
  managementReserve: ManagementReserve;
  utilizationHistory?: Array<{
    id: string;
    date: string;
    amount: number;
    reason: string;
    description?: string;
    type: 'Utilization' | 'Adjustment' | 'Reallocation';
  }>;
  onUtilizeMR?: (amount: number, reason: string, description?: string) => void;
  isEditable?: boolean;
}

const ManagementReserveUtilization: React.FC<ManagementReserveUtilizationProps> = ({
  managementReserve,
  utilizationHistory = [],
  onUtilizeMR,
  isEditable = false
}) => {
  const [showUtilizeForm, setShowUtilizeForm] = useState(false);
  const [utilizeAmount, setUtilizeAmount] = useState<number>(0);
  const [utilizeReason, setUtilizeReason] = useState<string>('');
  const [utilizeDescription, setUtilizeDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingAmount = managementReserve.adjustedAmount || managementReserve.baselineAmount;
  const utilizedAmount = managementReserve.baselineAmount - remainingAmount;
  const utilizationPercentage = managementReserve.baselineAmount > 0 
    ? (utilizedAmount / managementReserve.baselineAmount) * 100 
    : 0;

  const handleUtilizeMR = async () => {
    if (!onUtilizeMR || utilizeAmount <= 0 || utilizeAmount > remainingAmount || !utilizeReason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onUtilizeMR(utilizeAmount, utilizeReason, utilizeDescription);
      setShowUtilizeForm(false);
      setUtilizeAmount(0);
      setUtilizeReason('');
      setUtilizeDescription('');
    } catch (error) {
      console.error('Error utilizing MR:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUtilizationStatus = () => {
    if (utilizationPercentage >= 90) return { status: 'Critical', color: 'red', icon: ExclamationTriangleIcon };
    if (utilizationPercentage >= 75) return { status: 'High', color: 'yellow', icon: ExclamationTriangleIcon };
    if (utilizationPercentage >= 50) return { status: 'Moderate', color: 'blue', icon: ChartBarIcon };
    return { status: 'Low', color: 'green', icon: ChartBarIcon };
  };

  const status = getUtilizationStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">MR Utilization</h3>
        </div>
        {isEditable && remainingAmount > 0 && (
          <button
            onClick={() => setShowUtilizeForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Utilize MR
          </button>
        )}
      </div>

      {/* Utilization Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Baseline MR</p>
            <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(managementReserve.baselineAmount)}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Utilized</p>
            <ArrowTrendingDownIcon className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(utilizedAmount)}
          </p>
          <p className="text-sm text-gray-600">
            {utilizationPercentage.toFixed(1)}% of baseline
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Remaining</p>
            <CurrencyDollarIcon className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(remainingAmount)}
          </p>
          <p className="text-sm text-gray-600">
            Available for use
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Status</p>
            <StatusIcon className={`h-4 w-4 text-${status.color}-400`} />
          </div>
          <p className={`text-lg font-bold text-${status.color}-600 capitalize`}>
            {status.status}
          </p>
          <p className="text-sm text-gray-600">
            Utilization level
          </p>
        </div>
      </div>

      {/* Utilization Progress Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Utilization Progress</h4>
          <span className="text-sm text-gray-500">
            {utilizationPercentage.toFixed(1)}% utilized
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              utilizationPercentage >= 90 ? 'bg-red-500' :
              utilizationPercentage >= 75 ? 'bg-yellow-500' :
              utilizationPercentage >= 50 ? 'bg-blue-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, utilizationPercentage)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Utilize MR Form */}
      {showUtilizeForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Utilize Management Reserve</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount to Utilize
              </label>
              <input
                type="number"
                value={utilizeAmount}
                onChange={(e) => setUtilizeAmount(Math.min(remainingAmount, Math.max(0, parseFloat(e.target.value) || 0)))}
                max={remainingAmount}
                step={0.01}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Max: ${formatCurrency(remainingAmount)}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason *
              </label>
              <input
                type="text"
                value={utilizeReason}
                onChange={(e) => setUtilizeReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Scope change, Risk mitigation, Schedule acceleration"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={utilizeDescription}
                onChange={(e) => setUtilizeDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional details about the utilization..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUtilizeForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUtilizeMR}
                disabled={isSubmitting || utilizeAmount <= 0 || utilizeAmount > remainingAmount || !utilizeReason.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Utilizing...' : 'Utilize MR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Utilization History */}
      {utilizationHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Utilization History</h4>
          <div className="space-y-3">
            {utilizationHistory.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{entry.reason}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    entry.type === 'Utilization' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {entry.type === 'Utilization' ? '-' : '+'}{formatCurrency(entry.amount)}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    {entry.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning for High Utilization */}
      {utilizationPercentage > 80 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            <h4 className="text-sm font-medium text-yellow-800">High MR Utilization Warning</h4>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            {utilizationPercentage.toFixed(1)}% of management reserve has been utilized. 
            Consider reviewing project risks and budget allocation. Only {formatCurrency(remainingAmount)} remains available.
          </p>
        </div>
      )}
    </div>
  );
};

export default ManagementReserveUtilization; 