import React from 'react';

interface BOEHistoryProps {
  programId: string;
}

const BOEHistory: React.FC<BOEHistoryProps> = ({ programId }) => {
  return (
    <div className="p-6">
      {/* Placeholder Content */}
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">BOE History</h3>
        <p className="text-gray-500 mb-6">
          This tab will display BOE version history and comparison options including:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Version History</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Version timeline</li>
              <li>• Change tracking</li>
              <li>• Version comparison</li>
              <li>• Rollback options</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Change Analysis</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Cost variance tracking</li>
              <li>• Element changes</li>
              <li>• Approval history</li>
              <li>• Audit trail</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors mr-3">
            Compare Versions
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors mr-3">
            Create New Version
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
            Export History
          </button>
        </div>
      </div>
    </div>
  );
};

export default BOEHistory; 