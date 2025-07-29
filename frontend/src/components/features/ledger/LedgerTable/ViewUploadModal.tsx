import React, { useState } from 'react';
import { XMarkIcon, DocumentMagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ViewUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    uploadData: {
        id: string;
        vendorName: string;
        description: string;
        amount: number;
        transactionDate: string;
        status: string;
        actualsUploadSession?: {
            originalFilename: string;
            description?: string;
            createdAt: string;
        };
    } | null;
    onRemoveMatch?: (id: string) => Promise<void>;
    formatCurrency?: (val: number | string | undefined | null) => string;
    setToast?: (toast: { message: string; type: 'success' | 'error' }) => void;
}

const ViewUploadModal: React.FC<ViewUploadModalProps> = ({
    isOpen,
    onClose,
    uploadData,
    onRemoveMatch,
    formatCurrency = (val) => {
        if (val == null || isNaN(Number(val))) return '--';
        return Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    },
    setToast
}) => {
    const [showConfirmRemove, setShowConfirmRemove] = useState(false);
    const [removing, setRemoving] = useState(false);

    if (!isOpen || !uploadData) return null;

    const handleRemoveMatch = async () => {
        setRemoving(true);
        try {
            if (onRemoveMatch) {
                await onRemoveMatch(uploadData.id);
            }
            setShowConfirmRemove(false);
            setRemoving(false);
            onClose();
            setToast?.({ message: 'Match removed successfully.', type: 'success' });
        } catch (error: any) {
            setRemoving(false);
            setToast?.({ message: error?.message || 'Failed to remove match.', type: 'error' });
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DocumentMagnifyingGlassIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Upload Details</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Review transaction details from upload session
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                            aria-label="Close modal"
                            disabled={removing}
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Transaction Details */}
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900">Transaction Information</h3>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Vendor</label>
                                        <p className="text-sm text-gray-900 font-medium">{uploadData.vendorName}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Amount</label>
                                        <p className="text-sm text-green-700 font-semibold">{formatCurrency(uploadData.amount)}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                                        <p className="text-sm text-gray-900">{uploadData.description}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Transaction Date</label>
                                        <p className="text-sm text-gray-900">
                                            {uploadData.transactionDate ? new Date(uploadData.transactionDate).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${uploadData.status === 'confirmed'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {uploadData.status.charAt(0).toUpperCase() + uploadData.status.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upload Session Details */}
                        {uploadData.actualsUploadSession && (
                            <div className="bg-white rounded-lg border border-gray-200">
                                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                                    <h3 className="text-lg font-semibold text-gray-900">Upload Session</h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">File Name</label>
                                            <p className="text-sm text-gray-900 font-medium">{uploadData.actualsUploadSession.originalFilename}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Uploaded</label>
                                            <p className="text-sm text-gray-900">
                                                {uploadData.actualsUploadSession.createdAt ? new Date(uploadData.actualsUploadSession.createdAt).toLocaleString() : 'N/A'}
                                            </p>
                                        </div>
                                        {uploadData.actualsUploadSession.description && (
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Session Description</label>
                                                <p className="text-sm text-gray-900">{uploadData.actualsUploadSession.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {uploadData.status === 'confirmed' && !showConfirmRemove && (
                                <button
                                    onClick={() => setShowConfirmRemove(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors"
                                    disabled={removing}
                                >
                                    <TrashIcon className="h-4 w-4" />
                                    Remove Match
                                </button>
                            )}
                            {uploadData.status === 'confirmed' && showConfirmRemove && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700">Are you sure?</span>
                                    <button
                                        onClick={handleRemoveMatch}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-60"
                                        disabled={removing}
                                    >
                                        {removing ? (
                                            <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                        ) : null}
                                        Yes
                                    </button>
                                    <button
                                        onClick={() => setShowConfirmRemove(false)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                        disabled={removing}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                disabled={removing}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewUploadModal;