import React from 'react';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface MatchModalEmptyStateProps {
  currentTab: 'potential' | 'rejected';
  isLoading?: boolean;
}

const MatchModalEmptyState: React.FC<MatchModalEmptyStateProps> = ({
  currentTab,
  isLoading = false
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500">
      <DocumentMagnifyingGlassIcon className="h-12 w-12 mb-4 text-gray-300" />
      {isLoading ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-lg font-medium">Loading matches...</span>
          </div>
          <p className="text-sm text-gray-400 text-center">
            Please wait while we find potential matches.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium mb-2">
            {currentTab === 'potential' ? 'No Potential Matches' : 'No Rejected Matches'}
          </h3>
          <p className="text-sm text-gray-400 text-center">
            {currentTab === 'potential' 
              ? 'No potential matches found for this item.' 
              : 'No rejected matches found for this item.'
            }
          </p>
        </>
      )}
    </div>
  );
};

export default MatchModalEmptyState; 