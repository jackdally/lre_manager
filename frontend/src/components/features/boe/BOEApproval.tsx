import React from 'react';

interface BOEApprovalProps {
  programId: string;
}

const BOEApproval: React.FC<BOEApprovalProps> = ({ programId }) => {
  return (
    <div className="p-6">
      {/* Placeholder Content */}
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">BOE Approval</h3>
        <p className="text-gray-500 mb-6">
          This tab will display BOE approval status, workflow, and actions including:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Approval Status</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Current approval stage</li>
              <li>• Approval workflow</li>
              <li>• Approver assignments</li>
              <li>• Status tracking</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Approval Actions</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Submit for approval</li>
              <li>• Approve/Reject</li>
              <li>• Add comments</li>
              <li>• Request changes</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8">
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors mr-3">
            Submit for Approval
          </button>
          <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors mr-3">
            Request Changes
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
            View History
          </button>
        </div>
      </div>
    </div>
  );
};

export default BOEApproval; 