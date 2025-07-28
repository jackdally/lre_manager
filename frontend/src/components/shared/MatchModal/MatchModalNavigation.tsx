import React from 'react';

interface MatchModalNavigationProps {
  currentIndex: number;
  totalCount: number;
  onPrevious: () => void;
  onNext: () => void;
}

const MatchModalNavigation: React.FC<MatchModalNavigationProps> = ({
  currentIndex,
  totalCount,
  onPrevious,
  onNext
}) => {
  if (totalCount <= 1) return null;

  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
      <button 
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
        onClick={onPrevious} 
        disabled={currentIndex === 0}
      >
        ← Previous
      </button>
      <span className="text-sm text-gray-600 font-medium">
        {currentIndex + 1} of {totalCount}
      </span>
      <button 
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
        onClick={onNext} 
        disabled={currentIndex === totalCount - 1}
      >
        Next →
      </button>
    </div>
  );
};

export default MatchModalNavigation; 