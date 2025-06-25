import React from 'react';

interface UploadProgressProps {
  isUploading: boolean;
  uploadResult: any;
  uploadError: string | null;
  progress?: number;
  status?: string;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  isUploading,
  uploadResult,
  uploadError,
  progress = 0,
  status = 'Uploading...'
}) => {
  if (!isUploading && !uploadResult && !uploadError) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Progress</h3>
      
      {isUploading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{status}</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                {uploadError}
              </div>
            </div>
          </div>
        </div>
      )}

      {uploadResult && !uploadError && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Upload Successful</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Session ID: {uploadResult.sessionId}</p>
                {uploadResult.transactionCount && (
                  <p>Transactions processed: {uploadResult.transactionCount}</p>
                )}
                {uploadResult.matchedCount && (
                  <p>Matched transactions: {uploadResult.matchedCount}</p>
                )}
                {uploadResult.unmatchedCount && (
                  <p>Unmatched transactions: {uploadResult.unmatchedCount}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadProgress; 