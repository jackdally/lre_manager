import React from 'react';
import { 
  CalculatorIcon, 
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ManagementReserve } from '../../../../store/boeStore';
import { formatCurrency } from '../../../../utils/currencyUtils';

interface ManagementReserveDisplayProps {
  managementReserve: ManagementReserve;
  totalCost: number;
  showUtilization?: boolean;
}

const ManagementReserveDisplay: React.FC<ManagementReserveDisplayProps> = ({
  managementReserve,
  totalCost,
  showUtilization = false
}) => {
  const utilizationPercentage = managementReserve.baselineAmount > 0 
    ? ((managementReserve.baselineAmount - (managementReserve.adjustedAmount || managementReserve.baselineAmount)) / managementReserve.baselineAmount) * 100 
    : 0;

  const remainingAmount = managementReserve.adjustedAmount || managementReserve.baselineAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <CalculatorIcon className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900">Management Reserve</h3>
      </div>

      {/* MR Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Baseline MR</p>
            <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(managementReserve.baselineAmount)}
          </p>
          <p className="text-sm text-gray-600">
            {managementReserve.baselinePercentage}% of total cost
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Remaining MR</p>
            <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(remainingAmount)}
          </p>
          <p className="text-sm text-gray-600">
            {managementReserve.adjustedPercentage || managementReserve.baselinePercentage}% of total cost
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total with MR</p>
            <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(totalCost + managementReserve.baselineAmount)}
          </p>
          <p className="text-sm text-gray-600">
            Including baseline MR
          </p>
        </div>
      </div>

      {/* Utilization Progress */}
      {showUtilization && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">MR Utilization</h4>
            <span className="text-sm text-gray-500">
              {utilizationPercentage.toFixed(1)}% utilized
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, utilizationPercentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Used: {formatCurrency(managementReserve.baselineAmount - remainingAmount)}</span>
            <span>Remaining: {formatCurrency(remainingAmount)}</span>
          </div>
        </div>
      )}

      {/* Calculation Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Calculation Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Calculation Method</p>
            <p className="font-medium text-gray-900 capitalize">
              {managementReserve.calculationMethod?.replace('-', ' ') || 'Standard'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Risk Factors</p>
            <p className="font-medium text-gray-900">
              {managementReserve.riskFactors || 'None specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Justification */}
      {managementReserve.justification && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
            <h4 className="text-sm font-medium text-gray-700">Justification</h4>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {managementReserve.justification}
          </p>
        </div>
      )}

      {/* Notes */}
      {managementReserve.notes && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
            <h4 className="text-sm font-medium text-gray-700">Notes</h4>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {managementReserve.notes}
          </p>
        </div>
      )}

      {/* Status and Timestamps */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Status Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <div className="flex items-center space-x-2">
              {managementReserve.isActive ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">Active</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Inactive</span>
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Updated</p>
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">
                {managementReserve.updatedAt 
                  ? new Date(managementReserve.updatedAt).toLocaleDateString()
                  : 'Not available'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning for High Utilization */}
      {showUtilization && utilizationPercentage > 80 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            <h4 className="text-sm font-medium text-yellow-800">High MR Utilization</h4>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            {utilizationPercentage.toFixed(1)}% of management reserve has been utilized. 
            Consider reviewing project risks and budget allocation.
          </p>
        </div>
      )}
    </div>
  );
};

export default ManagementReserveDisplay; 