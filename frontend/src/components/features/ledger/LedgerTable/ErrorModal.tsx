import React from 'react';

interface ErrorModalProps {
  show: boolean;
  error: string | null;
  onClose: () => void;
}

const LedgerErrorModal: React.FC<ErrorModalProps> = ({
  show,
  error,
  onClose,
}) => {
  if (!show || !error) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
        <h3 className="text-lg font-bold mb-2 text-red-600">Error</h3>
        <div className="mb-4 text-gray-800">{error}</div>
        <button className="btn btn-error" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default LedgerErrorModal; 