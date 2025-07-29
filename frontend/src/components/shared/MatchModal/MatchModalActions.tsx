import React from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface MatchModalActionsProps {
  currentTab: 'potential' | 'rejected';
  onConfirm?: () => void;
  onReject?: () => void;
  onUndoReject?: () => void;
  onSplit?: () => void;
  onReForecast?: () => void;
  onCancel: () => void;
  canSplit?: boolean;
  canReForecast?: boolean;
  showSplitReForecast?: boolean;
}

const MatchModalActions: React.FC<MatchModalActionsProps> = ({
  currentTab,
  onConfirm,
  onReject,
  onUndoReject,
  onSplit,
  onReForecast,
  onCancel,
  canSplit = false,
  canReForecast = false,
  showSplitReForecast = false
}) => {
  // Determine if we should show the unified adjustment button
  const showAdjustmentButton = showSplitReForecast && (canSplit || canReForecast) && (onSplit || onReForecast);

  // Use either onSplit or onReForecast as the unified handler (they should be the same now)
  const handleAdjustment = onSplit || onReForecast;

  return (
    <div className="flex flex-wrap gap-3">
      {currentTab === 'potential' ? (
        <>
          {onConfirm && (
            <button
              className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              onClick={onConfirm}
            >
              <CheckCircleIcon className="h-4 w-4" />
              Confirm Match
            </button>
          )}
          {onReject && (
            <button
              className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              onClick={onReject}
            >
              <XCircleIcon className="h-4 w-4" />
              Reject Match
            </button>
          )}

          {/* Unified Adjustment Button */}
          {showAdjustmentButton && handleAdjustment && (
            <button
              className="px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              onClick={handleAdjustment}
              title="Confirm match and split or re-forecast ledger entries associated with this BOE allocation"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              Confirm & Adjust
            </button>
          )}
        </>
      ) : (
        onUndoReject && (
          <button
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            onClick={onUndoReject}
          >
            <ArrowPathIcon className="h-4 w-4" />
            Restore Match
          </button>
        )
      )}

      <button
        className="px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
};

export default MatchModalActions; 