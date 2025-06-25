import React from 'react';

interface UploadProgressProps {
  isUploading: boolean;
  uploadProgress: number;
  uploadStatus: string;
  currentStep: string;
  totalSteps: number;
  currentStepNumber: number;
  error: string | null;
  onCancelUpload: () => void;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  isUploading,
  uploadProgress,
  uploadStatus,
  currentStep,
  totalSteps,
  currentStepNumber,
  error,
  onCancelUpload
}) => {
  if (!isUploading && !error) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Progress</h2>
      
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Current Step</span>
              <span className="text-sm text-gray-500">{currentStepNumber} of {totalSteps}</span>
            </div>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-800">{currentStep}</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <span className="text-sm font-medium text-gray-700">Status</span>
            <div className="mt-1 bg-blue-50 rounded-md p-3">
              <p className="text-sm text-blue-800">{uploadStatus}</p>
            </div>
          </div>

          {/* Cancel Button */}
          <div className="pt-4">
            <button
              onClick={onCancelUpload}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Cancel Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadProgress; 