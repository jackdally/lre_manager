import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface MatchModalTabsProps {
  currentTab: 'potential' | 'rejected';
  potentialCount: number;
  rejectedCount: number;
  onTabChange: (tab: 'potential' | 'rejected') => void;
}

const MatchModalTabs: React.FC<MatchModalTabsProps> = ({
  currentTab,
  potentialCount,
  rejectedCount,
  onTabChange
}) => {
  return (
    <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
      <button
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
          currentTab === 'potential' 
            ? 'bg-white text-blue-700 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
        onClick={() => onTabChange('potential')}
      >
        <div className="flex items-center justify-center gap-2">
          <CheckCircleIcon className="h-4 w-4" />
          Potential Matches ({potentialCount})
        </div>
      </button>
      <button
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
          currentTab === 'rejected' 
            ? 'bg-white text-red-700 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
        onClick={() => onTabChange('rejected')}
      >
        <div className="flex items-center justify-center gap-2">
          <XCircleIcon className="h-4 w-4" />
          Rejected ({rejectedCount})
        </div>
      </button>
    </div>
  );
};

export default MatchModalTabs; 