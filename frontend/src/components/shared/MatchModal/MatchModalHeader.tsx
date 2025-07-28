import React from 'react';
import { XMarkIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface MatchModalHeaderProps {
  title: string;
  subtitle: string;
  onClose: () => void;
}

const MatchModalHeader: React.FC<MatchModalHeaderProps> = ({
  title,
  subtitle,
  onClose
}) => {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex items-center gap-3">
        <DocumentMagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>
      <button 
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" 
        onClick={onClose}
        aria-label="Close"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>
    </div>
  );
};

export default MatchModalHeader; 