import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ActualsUploadTransaction } from '../../../../types/actuals';
import { useActualsAddToLedger, useActualsSetToast, useActualsProgramId } from '../../../../store/actualsStore';

interface WbsSubcategory {
  id: string;
  name: string;
}

interface WbsCategory {
  id: string;
  name: string;
  subcategories: WbsSubcategory[];
}

interface AddToLedgerModalProps {
  transaction: ActualsUploadTransaction;
  onClose: () => void;
}

const AddToLedgerModal: React.FC<AddToLedgerModalProps> = ({
  transaction,
  onClose,
}) => {
  const [wbsCategory, setWbsCategory] = useState('');
  const [wbsSubcategory, setWbsSubcategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wbsCategories, setWbsCategories] = useState<WbsCategory[]>([]);
  const [loadingWbs, setLoadingWbs] = useState(true);

  const addToLedger = useActualsAddToLedger();
  const setToast = useActualsSetToast();
  const programId = useActualsProgramId();

  // Fetch WBS categories and subcategories
  useEffect(() => {
    const fetchWbsData = async () => {
      if (!programId) return;
      
      setLoadingWbs(true);
      try {
        const response = await axios.get(`/api/programs/${programId}/wbs`);
        setWbsCategories(response.data as WbsCategory[]);
      } catch (error) {
        console.error('Failed to fetch WBS data:', error);
        setToast({ message: 'Failed to load WBS categories', type: 'error' });
      } finally {
        setLoadingWbs(false);
      }
    };

    fetchWbsData();
  }, [programId, setToast]);

  // Reset subcategory when category changes
  useEffect(() => {
    setWbsSubcategory('');
  }, [wbsCategory]);

  // Helper for formatting
  const formatCurrency = (val: number | string | undefined | null) => {
    if (val == null || isNaN(Number(val))) return '--';
    return Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  // Get available subcategories for selected category
  const getAvailableSubcategories = () => {
    const selectedCategory = wbsCategories.find(cat => cat.id === wbsCategory);
    return selectedCategory?.subcategories || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wbsCategory || !wbsSubcategory) {
      setToast({ message: 'Please select both WBS Category and Subcategory', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the names for the selected IDs
      const selectedCategory = wbsCategories.find(cat => cat.id === wbsCategory);
      const selectedSubcategory = selectedCategory?.subcategories.find(sub => sub.id === wbsSubcategory);
      
      if (!selectedCategory || !selectedSubcategory) {
        throw new Error('Invalid WBS selection');
      }

      await addToLedger(transaction.id, selectedCategory.name, selectedSubcategory.name);
      setToast({ message: 'Transaction added to ledger successfully', type: 'success' });
      onClose();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to add transaction to ledger', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full min-w-[400px] relative border-2 border-blue-200">
        {/* Close button */}
        <button 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold" 
          onClick={onClose} 
          aria-label="Close"
          disabled={isSubmitting}
        >
          &times;
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">Add Transaction to Ledger</h2>
          
          {/* Transaction Details */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
            <h3 className="text-lg font-semibold text-blue-700 mb-3">Transaction Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><b className="text-gray-600">Vendor:</b> <span className="text-gray-900">{transaction.vendorName}</span></div>
              <div><b className="text-gray-600">Amount:</b> <span className="text-blue-700 font-semibold">{formatCurrency(transaction.amount)}</span></div>
              <div><b className="text-gray-600">Date:</b> <span className="text-gray-900">{transaction.transactionDate}</span></div>
              <div><b className="text-gray-600">Description:</b> <span className="text-gray-900">{transaction.description}</span></div>
              {transaction.invoiceNumber && (
                <div className="md:col-span-2">
                  <b className="text-gray-600">Invoice Number:</b> <span className="text-gray-900">{transaction.invoiceNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="wbsCategory" className="block text-sm font-medium text-gray-700 mb-2">
                WBS Category <span className="text-red-500">*</span>
              </label>
              {loadingWbs ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  Loading categories...
                </div>
              ) : (
                <select
                  id="wbsCategory"
                  value={wbsCategory}
                  onChange={(e) => setWbsCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select WBS Category</option>
                  {wbsCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="wbsSubcategory" className="block text-sm font-medium text-gray-700 mb-2">
                WBS Subcategory <span className="text-red-500">*</span>
              </label>
              {loadingWbs ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  Loading subcategories...
                </div>
              ) : (
                <select
                  id="wbsSubcategory"
                  value={wbsSubcategory}
                  onChange={(e) => setWbsSubcategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={isSubmitting || !wbsCategory}
                >
                  <option value="">Select WBS Subcategory</option>
                  {getAvailableSubcategories().map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !wbsCategory || !wbsSubcategory || loadingWbs}
              >
                {isSubmitting ? 'Adding...' : 'Add to Ledger'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddToLedgerModal; 