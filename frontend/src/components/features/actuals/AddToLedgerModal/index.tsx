import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useActualsAddToLedger, useActualsSetToast, useActualsProgramId } from '../../../../store/actualsStore';
import HierarchicalWbsDropdown, { WbsElement } from '../../ledger/HierarchicalWbsDropdown';

interface AddToLedgerModalProps {
  transaction: {
    id: string;
    vendorName: string;
    description: string;
    amount: number;
    transactionDate: string;
  };
  onClose: () => void;
}

const AddToLedgerModal: React.FC<AddToLedgerModalProps> = ({
  transaction,
  onClose,
}) => {
  const [wbsElementId, setWbsElementId] = useState<string>('');
  const [selectedWbsElement, setSelectedWbsElement] = useState<WbsElement | null>(null);
  const [costCategoryId, setCostCategoryId] = useState<string>('');
  const [costCategories, setCostCategories] = useState<Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
  }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  const addToLedger = useActualsAddToLedger();
  const setToast = useActualsSetToast();
  const programId = useActualsProgramId();

  // Fetch cost categories on component mount
  useEffect(() => {
    const fetchCostCategories = async () => {
      try {
        const response = await axios.get('/api/cost-categories/active');
        setCostCategories(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch cost categories:', error);
      }
    };
    fetchCostCategories();
  }, []);

  // Helper for formatting
  const formatCurrency = (val: number | string | undefined | null) => {
    if (val == null || isNaN(Number(val))) return '--';
    return Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!wbsElementId) {
      newErrors.wbsElementId = 'WBS element is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setToast({ message: 'Please fix the errors before submitting', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      await addToLedger(
        transaction.id,
        wbsElementId,
        costCategoryId || undefined
      );

      setToast({ message: 'Transaction added to ledger successfully', type: 'success' });
      onClose();
    } catch (error: any) {
      setToast({ 
        message: error.response?.data?.message || 'Failed to add transaction to ledger', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWbsElementChange = (elementId: string | null, element?: WbsElement) => {
    setWbsElementId(elementId || '');
    setSelectedWbsElement(element || null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add Transaction to Ledger</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Transaction Details</h3>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">Vendor:</span> {transaction.vendorName}</div>
            <div><span className="font-medium">Description:</span> {transaction.description}</div>
            <div><span className="font-medium">Amount:</span> {formatCurrency(transaction.amount)}</div>
            <div><span className="font-medium">Date:</span> {new Date(transaction.transactionDate).toLocaleDateString()}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="wbsElement" className="block text-sm font-medium text-gray-700 mb-2">
              WBS Element <span className="text-red-500">*</span>
            </label>
            <HierarchicalWbsDropdown
              programId={programId!}
              value={wbsElementId}
              onChange={(id, element) => {
                handleWbsElementChange(id, element);
                if (errors.wbsElementId) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.wbsElementId;
                    return newErrors;
                  });
                }
              }}
              placeholder="Select WBS Element"
              className={`w-full ${errors.wbsElementId ? 'border-red-300' : ''}`}
              disabled={isSubmitting}
            />
            {errors.wbsElementId && (
              <p className="mt-1 text-sm text-red-600">{errors.wbsElementId}</p>
            )}
            {selectedWbsElement && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <div className="font-medium text-gray-900 mb-1">Selected WBS Element:</div>
                <div><span className="font-medium">Code:</span> {selectedWbsElement.code}</div>
                <div><span className="font-medium">Description:</span> {selectedWbsElement.description}</div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="costCategory" className="block text-sm font-medium text-gray-700 mb-2">
              Cost Category
            </label>
            <select
              id="costCategory"
              value={costCategoryId}
              onChange={(e) => setCostCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="">-- Select Cost Category (Optional) --</option>
              {costCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.code} - {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preview Section */}
          {wbsElementId && selectedWbsElement && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-blue-900">Preview</h4>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
              {showPreview && (
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium text-gray-600">Vendor:</span> <span className="text-gray-900">{transaction.vendorName}</span></div>
                  <div><span className="font-medium text-gray-600">Description:</span> <span className="text-gray-900">{transaction.description}</span></div>
                  <div><span className="font-medium text-gray-600">Amount:</span> <span className="text-gray-900 font-semibold">{formatCurrency(transaction.amount)}</span></div>
                  <div><span className="font-medium text-gray-600">Date:</span> <span className="text-gray-900">{new Date(transaction.transactionDate).toLocaleDateString()}</span></div>
                  <div><span className="font-medium text-gray-600">WBS Element:</span> <span className="text-gray-900">{selectedWbsElement.code} - {selectedWbsElement.name}</span></div>
                  {costCategoryId && (
                    <div>
                      <span className="font-medium text-gray-600">Cost Category:</span>{' '}
                      <span className="text-gray-900">
                        {costCategories.find(c => c.id === costCategoryId)?.code} - {costCategories.find(c => c.id === costCategoryId)?.name}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !wbsElementId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add to Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToLedgerModal; 