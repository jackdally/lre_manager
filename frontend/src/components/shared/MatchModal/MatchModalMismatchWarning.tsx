import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface MatchModalMismatchWarningProps {
  hasAmountMismatch: boolean;
  hasDateMismatch: boolean;
  plannedAmount?: number | string;
  actualAmount?: number | string;
  plannedDate?: string;
  actualDate?: string;
  canSplit?: boolean;
  formatCurrency?: (val: any) => string;
}

const MatchModalMismatchWarning: React.FC<MatchModalMismatchWarningProps> = ({
  hasAmountMismatch,
  hasDateMismatch,
  plannedAmount,
  actualAmount,
  plannedDate,
  actualDate,
  canSplit = false,
  formatCurrency = (val) => val?.toString() || '--'
}) => {
  if (!hasAmountMismatch && !hasDateMismatch) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-yellow-800 mb-1">Mismatch Detected</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            {hasAmountMismatch && (
              <p>• Amount: {formatCurrency(plannedAmount)} planned vs {formatCurrency(actualAmount)} actual</p>
            )}
            {hasDateMismatch && (
              <p>• Date: {plannedDate} planned vs {actualDate} actual</p>
            )}
            <p className="mt-2 font-medium">
              {canSplit 
                ? 'Consider using Split Entry or Re-forecast to resolve differences.'
                : 'Consider using Re-forecast to resolve differences.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchModalMismatchWarning; 