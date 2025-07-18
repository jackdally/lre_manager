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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wbsElementId) {
      setToast({ message: 'Please select a WBS element', type: 'error' });
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Add Transaction to Ledger</h2>
        
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
              onChange={handleWbsElementChange}
              placeholder="Select WBS Element"
              className="w-full"
              disabled={isSubmitting}
            />
            {selectedWbsElement && (
              <div className="mt-2 text-sm text-gray-600">
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