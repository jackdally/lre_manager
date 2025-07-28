import React from 'react';
import MatchModalHeader from './MatchModalHeader';
import MatchModalTabs from './MatchModalTabs';
import MatchModalActions from './MatchModalActions';
import MatchModalNavigation from './MatchModalNavigation';
import MatchModalEmptyState from './MatchModalEmptyState';
import MatchModalMismatchWarning from './MatchModalMismatchWarning';

interface MatchModalProps {
  // Modal state
  isOpen: boolean;
  onClose: () => void;
  
  // Tab state
  currentTab: 'potential' | 'rejected';
  onTabChange: (tab: 'potential' | 'rejected') => void;
  
  // Navigation state
  currentIndex: number;
  totalCount: number;
  onPrevious: () => void;
  onNext: () => void;
  
  // Data
  potentialCount: number;
  rejectedCount: number;
  isLoading?: boolean;
  
  // Actions
  onConfirm?: () => void;
  onReject?: () => void;
  onUndoReject?: () => void;
  onSplit?: () => void;
  onReForecast?: () => void;
  
  // Mismatch detection
  hasAmountMismatch?: boolean;
  hasDateMismatch?: boolean;
  plannedAmount?: number | string;
  actualAmount?: number | string;
  plannedDate?: string;
  actualDate?: string;
  canSplit?: boolean;
  canReForecast?: boolean;
  
  // Features
  showSplitReForecast?: boolean;
  formatCurrency?: (val: any) => string;
  
  // Content
  title: string;
  subtitle: string;
  
  // Children for flexible content
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  
  // Additional content
  additionalContent?: React.ReactNode;
}

const MatchModal: React.FC<MatchModalProps> = ({
  isOpen,
  onClose,
  currentTab,
  onTabChange,
  currentIndex,
  totalCount,
  onPrevious,
  onNext,
  potentialCount,
  rejectedCount,
  isLoading = false,
  onConfirm,
  onReject,
  onUndoReject,
  onSplit,
  onReForecast,
  hasAmountMismatch = false,
  hasDateMismatch = false,
  plannedAmount,
  actualAmount,
  plannedDate,
  actualDate,
  canSplit = false,
  canReForecast = false,
  showSplitReForecast = false,
  formatCurrency = (val) => val?.toString() || '--',
  title,
  subtitle,
  leftPanel,
  rightPanel,
  additionalContent
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <MatchModalHeader
          title={title}
          subtitle={subtitle}
          onClose={onClose}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left Panel */}
          <div className="lg:w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            {leftPanel}
          </div>

          {/* Right Panel */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            {/* Tab Navigation */}
            <MatchModalTabs
              currentTab={currentTab}
              potentialCount={potentialCount}
              rejectedCount={rejectedCount}
              onTabChange={onTabChange}
            />

            {/* Content Area */}
            {totalCount === 0 ? (
              <MatchModalEmptyState
                currentTab={currentTab}
                isLoading={isLoading}
              />
            ) : (
              <div className="space-y-6">
                {/* Mismatch Warning */}
                <MatchModalMismatchWarning
                  hasAmountMismatch={hasAmountMismatch}
                  hasDateMismatch={hasDateMismatch}
                  plannedAmount={plannedAmount}
                  actualAmount={actualAmount}
                  plannedDate={plannedDate}
                  actualDate={actualDate}
                  canSplit={canSplit}
                  formatCurrency={formatCurrency}
                />

                {/* Additional Content (e.g., BOE Context Panel) */}
                {additionalContent}

                {/* Right Panel Content */}
                {rightPanel}

                {/* Navigation and Actions */}
                <div className="space-y-4">
                  {/* Pagination */}
                  <MatchModalNavigation
                    currentIndex={currentIndex}
                    totalCount={totalCount}
                    onPrevious={onPrevious}
                    onNext={onNext}
                  />

                  {/* Action Buttons */}
                  <MatchModalActions
                    currentTab={currentTab}
                    onConfirm={onConfirm}
                    onReject={onReject}
                    onUndoReject={onUndoReject}
                    onSplit={onSplit}
                    onReForecast={onReForecast}
                    onCancel={onClose}
                    canSplit={canSplit}
                    canReForecast={canReForecast}
                    showSplitReForecast={showSplitReForecast}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchModal; 