import React from 'react';

interface FileUploadSectionProps {
  file: File | null;
  description: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  file,
  description,
  onFileChange,
  onDescriptionChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Upload NetSuite Export</h2>
      
      {/* File Upload Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">File Upload</h3>
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
          Select File
        </label>
        <div className="flex items-center gap-4">
          <label htmlFor="file-upload" className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors font-semibold shadow-sm">
            Choose File
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onFileChange}
              className="hidden"
            />
          </label>
          {file && (
            <span className="text-sm text-gray-700 truncate max-w-xs">
              {file.name}
            </span>
          )}
        </div>
      </div>

      {/* Description Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
        <label htmlFor="upload-description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <input
          id="upload-description"
          type="text"
          value={description}
          onChange={onDescriptionChange}
          placeholder="Enter a description for this upload"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default FileUploadSection; 