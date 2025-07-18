import React from 'react';

interface UploadActionsProps {
  selectedFile: File | null;
  selectedProgramId: string;
  isUploading: boolean;
  onUpload: () => void;
  onReplaceUpload: () => void;
  canUpload: boolean;
  canReplace: boolean;
}

const UploadActions: React.FC<UploadActionsProps> = ({
  selectedFile,
  selectedProgramId,
  isUploading,
  onUpload,
  onReplaceUpload,
  canUpload,
  canReplace
}) => {
  if (!selectedFile || !selectedProgramId) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Actions</h2>
      
      <div className="space-y-4">
        {/* File Info */}
        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Selected File</h3>
          <div className="text-sm text-gray-600">
            <p><span className="font-medium">Name:</span> {selectedFile.name}</p>
            <p><span className="font-medium">Size:</span> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><span className="font-medium">Type:</span> {selectedFile.type || 'Unknown'}</p>
          </div>
        </div>

        {/* Upload Buttons */}
        <div className="space-y-3">
          <button
            onClick={onUpload}
            disabled={!canUpload || isUploading}
            className={`w-full px-4 py-3 rounded-md font-medium transition-colors ${
              canUpload && !isUploading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>

          {canReplace && (
            <button
              onClick={onReplaceUpload}
              disabled={!canReplace || isUploading}
              className={`w-full px-4 py-3 rounded-md font-medium transition-colors ${
                canReplace && !isUploading
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Replace Existing Data'}
            </button>
          )}
        </div>

        {/* Upload Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Upload Information</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• The file will be processed and transactions will be extracted</p>
            <p>• Duplicate detection will be performed automatically</p>
            <p>• You can review and match transactions before finalizing</p>
            <p>• Use "Replace" to overwrite existing data for the same period</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadActions; 