import React from 'react';

interface BOEDetailsProps {
  programId: string;
}

const BOEDetails: React.FC<BOEDetailsProps> = ({ programId }) => {
  return (
    <div className="p-6">
      {/* Placeholder Content */}
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">BOE Details</h3>
        <p className="text-gray-500 mb-6">
          This tab will display detailed BOE elements and cost breakdown including:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">WBS Elements</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Hierarchical WBS structure</li>
              <li>• Element descriptions</li>
              <li>• Cost categories</li>
              <li>• Vendor assignments</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Cost Breakdown</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Planned vs Actual costs</li>
              <li>• Cost variance analysis</li>
              <li>• Roll-up calculations</li>
              <li>• Management reserve allocation</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors mr-3">
            Edit BOE
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
            Export Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default BOEDetails; 