import React from 'react';

interface BulkDeleteModalProps {
  show: boolean;
  selectedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const LedgerBulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  show,
  selectedCount,
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
        <h3 className="text-lg font-bold mb-2 text-red-600">Confirm Delete</h3>
        <div className="mb-4 text-gray-800">Are you sure you want to delete {selectedCount} selected row(s)? This action cannot be undone.</div>
        <button className="btn btn-error mr-2" onClick={onConfirm}>Delete</button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default LedgerBulkDeleteModal; 