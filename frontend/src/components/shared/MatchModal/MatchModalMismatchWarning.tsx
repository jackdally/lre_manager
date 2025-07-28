import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface MatchModalMismatchWarningProps {
  hasAmountMismatch?: boolean;
  hasDateMismatch?: boolean;
  plannedAmount?: number | string;
  actualAmount?: number | string;
  plannedDate?: string;
  actualDate?: string;
  canSplit?: boolean;
  canReForecast?: boolean;
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
  canReForecast = false,
  formatCurrency = (val) => val?.toString() || '--'
}) => {
  if (!hasAmountMismatch && !hasDateMismatch) return null;

  // Determine the scenario and provide appropriate guidance
  const getGuidanceText = () => {
    const actualNum = Number(actualAmount) || 0;
    const plannedNum = Number(plannedAmount) || 0;
    
    if (hasAmountMismatch && hasDateMismatch) {
      if (actualNum < plannedNum) {
        return "Partial delivery with schedule change. Consider splitting for delivered portion and re-forecasting remaining amount.";
      } else if (actualNum > plannedNum) {
        return "Overrun with schedule change. Re-forecast to pull additional funds from future months.";
      }
    } else if (hasAmountMismatch) {
      if (actualNum < plannedNum) {
        return "Partial delivery detected. Split to create separate entries for delivered and remaining portions, or re-forecast to move remaining amount to future months.";
      } else if (actualNum > plannedNum) {
        return "Overrun detected. Re-forecast to pull additional funds from future months to cover the overrun.";
      }
    } else if (hasDateMismatch) {
      return "Schedule change detected. Re-forecast to move planned amount to the new date.";
    }
    
    return "Mismatch detected. Consider using Split Entry or Re-forecast to resolve differences.";
  };

  const showBothOptions = canSplit && canReForecast;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-yellow-800 mb-2">Mismatch Detected</h4>
          <div className="text-sm text-yellow-700 space-y-2">
            {/* Mismatch Details */}
            <div className="space-y-1">
              {hasAmountMismatch && (
                <p>• Amount: {formatCurrency(plannedAmount)} planned vs {formatCurrency(actualAmount)} actual</p>
              )}
              {hasDateMismatch && (
                <p>• Date: {plannedDate} planned vs {actualDate} actual</p>
              )}
            </div>
            
            {/* Guidance */}
            <div className="bg-yellow-100 rounded p-3 border border-yellow-300">
              <p className="font-medium text-yellow-800 mb-1">
                {showBothOptions ? "Available Actions:" : "Recommended Action:"}
              </p>
              <p className="text-yellow-700">{getGuidanceText()}</p>
              
              {showBothOptions && (
                <div className="mt-2 text-xs text-yellow-600">
                  <p><strong>Split Entry:</strong> Create separate entries for delivered and remaining portions</p>
                  <p><strong>Re-forecast:</strong> Adjust planned amounts and dates for future planning</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchModalMismatchWarning; 