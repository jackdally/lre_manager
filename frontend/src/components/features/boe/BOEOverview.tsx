import React from 'react';

interface BOEOverviewProps {
  programId: string;
}

const BOEOverview: React.FC<BOEOverviewProps> = ({ programId }) => {
  return (
    <div className="p-6">
      {/* Placeholder Content */}
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">BOE Overview</h3>
        <p className="text-gray-500 mb-6">
          This tab will display a comprehensive overview of the Basis of Estimate including:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Cost Summary</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Total Estimated Cost</li>
              <li>• Management Reserve</li>
              <li>• Total with MR</li>
              <li>• Status and Approval</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Element Summary</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Total Elements</li>
              <li>• Required Elements</li>
              <li>• Optional Elements</li>
              <li>• Completion Status</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Create New BOE
          </button>
        </div>
      </div>
    </div>
  );
};

export default BOEOverview; 