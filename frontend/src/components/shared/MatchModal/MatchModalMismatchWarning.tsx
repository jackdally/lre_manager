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
    
    // Match the same logic as the modal's getRecommendedScenario()
    if (plannedNum === actualNum && plannedDate !== actualDate) {
      return "Schedule change detected. Use 'Split/Re-forecast Ledger' to adjust the planned date.";
    } else if (actualNum > plannedNum) {
      return "Cost overrun detected. Use 'Split/Re-forecast Ledger' to pull additional funds from future months to cover the overrun.";
    } else if (actualNum < plannedNum) {
      return "Cost underspend detected. Use 'Split/Re-forecast Ledger' to re-allocate remaining costs to future months.";
    }
    
    return "Mismatch detected. Use 'Split/Re-forecast Ledger' to resolve differences.";
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
                Recommended Action:
              </p>
              <p className="text-yellow-700">{getGuidanceText()}</p>
              
              <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded">
                <p className="text-xs text-purple-800 font-medium">
                  💡 <strong>Tip:</strong> Click the "Split/Re-forecast Ledger" button below to open the adjustment wizard
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchModalMismatchWarning; 