import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { LedgerEntry } from '../../../../types/ledger';
import HierarchicalWbsDropdown, { WbsElement } from '../HierarchicalWbsDropdown';
import VendorAutocomplete from '../../../common/VendorAutocomplete';
import { Vendor } from '../../../../store/settingsStore';
import axios from 'axios';

interface LedgerEntryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: LedgerEntry | null;
  programId: string;
  vendorOptions: Vendor[];
  wbsElementOptions: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    level: number;
    parentId?: string;
  }>;
  costCategoryOptions: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
  }>;
  onSave: (id: string, updates: Partial<LedgerEntry>) => Promise<void>;
}

const LedgerEntryEditModal: React.FC<LedgerEntryEditModalProps> = ({
  isOpen,
  onClose,
  entry,
  programId,
  vendorOptions,
  wbsElementOptions,
  costCategoryOptions,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<LedgerEntry>>({});
  const [selectedWbsElement, setSelectedWbsElement] = useState<WbsElement | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when entry changes
  useEffect(() => {
    if (entry) {
      setFormData({
        vendor_name: entry.vendor_name || '',
        expense_description: entry.expense_description || '',
        wbsElementId: entry.wbsElementId || '',
        costCategoryId: entry.costCategoryId || '',
        baseline_date: entry.baseline_date || '',
        baseline_amount: entry.baseline_amount || null,
        planned_date: entry.planned_date || '',
        planned_amount: entry.planned_amount || null,
        actual_date: entry.actual_date || '',
        actual_amount: entry.actual_amount || null,
        notes: entry.notes || '',
        invoice_link_text: entry.invoice_link_text || '',
        invoice_link_url: entry.invoice_link_url || '',
      });
      setSelectedWbsElement(entry.wbsElement ? {
        id: entry.wbsElement.id,
        code: entry.wbsElement.code,
        name: entry.wbsElement.name,
        description: entry.wbsElement.description,
        level: entry.wbsElement.level,
        parentId: entry.wbsElement.parentId,
      } : null);
      setErrors({});
    }
  }, [entry]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData, onClose]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleWbsElementChange = (elementId: string | null, element?: WbsElement) => {
    setFormData(prev => ({ ...prev, wbsElementId: elementId || '' }));
    setSelectedWbsElement(element || null);
    if (errors.wbsElementId) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.wbsElementId;
        return newErrors;
      });
    }
  };

  const handleVendorChange = (value: string) => {
    handleInputChange('vendor_name', value);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vendor_name || formData.vendor_name.trim() === '') {
      newErrors.vendor_name = 'Vendor name is required';
    }

    if (!formData.expense_description || formData.expense_description.trim() === '') {
      newErrors.expense_description = 'Expense description is required';
    }

    if (!formData.wbsElementId) {
      newErrors.wbsElementId = 'WBS Element is required';
    }

    // Validate amounts are numbers if provided
    if (formData.baseline_amount !== null && formData.baseline_amount !== undefined && isNaN(Number(formData.baseline_amount))) {
      newErrors.baseline_amount = 'Baseline amount must be a valid number';
    }

    if (formData.planned_amount !== null && formData.planned_amount !== undefined && isNaN(Number(formData.planned_amount))) {
      newErrors.planned_amount = 'Planned amount must be a valid number';
    }

    if (formData.actual_amount !== null && formData.actual_amount !== undefined && isNaN(Number(formData.actual_amount))) {
      newErrors.actual_amount = 'Actual amount must be a valid number';
    }

    // Validate dates if amounts are provided
    if (formData.baseline_amount && !formData.baseline_date) {
      newErrors.baseline_date = 'Baseline date is required when baseline amount is set';
    }

    if (formData.planned_amount && !formData.planned_date) {
      newErrors.planned_date = 'Planned date is required when planned amount is set';
    }

    if (formData.actual_amount && !formData.actual_date) {
      newErrors.actual_date = 'Actual date is required when actual amount is set';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!entry || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare updates - only include changed fields
      const updates: Partial<LedgerEntry> = {};

      if (formData.vendor_name !== entry.vendor_name) {
        updates.vendor_name = formData.vendor_name;
      }
      if (formData.expense_description !== entry.expense_description) {
        updates.expense_description = formData.expense_description;
      }
      if (formData.wbsElementId !== entry.wbsElementId) {
        updates.wbsElementId = formData.wbsElementId;
      }
      if (formData.costCategoryId !== entry.costCategoryId) {
        updates.costCategoryId = formData.costCategoryId || undefined;
      }
      if (formData.baseline_date !== entry.baseline_date) {
        updates.baseline_date = formData.baseline_date || null;
      }
      if (formData.baseline_amount !== entry.baseline_amount) {
        updates.baseline_amount = formData.baseline_amount !== null && formData.baseline_amount !== undefined ? Number(formData.baseline_amount) : null;
      }
      if (formData.planned_date !== entry.planned_date) {
        updates.planned_date = formData.planned_date || null;
      }
      if (formData.planned_amount !== entry.planned_amount) {
        updates.planned_amount = formData.planned_amount !== null && formData.planned_amount !== undefined ? Number(formData.planned_amount) : null;
      }
      if (formData.actual_date !== entry.actual_date) {
        updates.actual_date = formData.actual_date || null;
      }
      if (formData.actual_amount !== entry.actual_amount) {
        updates.actual_amount = formData.actual_amount !== null && formData.actual_amount !== undefined ? Number(formData.actual_amount) : null;
      }
      if (formData.notes !== entry.notes) {
        updates.notes = formData.notes || null;
      }
      if (formData.invoice_link_text !== entry.invoice_link_text) {
        updates.invoice_link_text = formData.invoice_link_text || null;
      }
      if (formData.invoice_link_url !== entry.invoice_link_url) {
        updates.invoice_link_url = formData.invoice_link_url || null;
      }

      await onSave(entry.id, updates);
      onClose();
    } catch (error: any) {
      console.error('Error saving ledger entry:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to save ledger entry' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number | string | undefined | null) => {
    if (val == null || isNaN(Number(val))) return '';
    return Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  if (!isOpen || !entry) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Edit Ledger Entry</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <VendorAutocomplete
                    vendors={vendorOptions}
                    value={formData.vendor_name || ''}
                    onChange={handleVendorChange}
                    placeholder="Search or type vendor name"
                    className="w-full"
                    disabled={isSubmitting}
                    error={!!errors.vendor_name}
                  />
                  {errors.vendor_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.vendor_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WBS Element <span className="text-red-500">*</span>
                  </label>
                  <HierarchicalWbsDropdown
                    programId={programId}
                    value={formData.wbsElementId}
                    onChange={handleWbsElementChange}
                    placeholder="Select WBS Element"
                    className="w-full"
                    disabled={isSubmitting}
                  />
                  {errors.wbsElementId && (
                    <p className="mt-1 text-sm text-red-600">{errors.wbsElementId}</p>
                  )}
                  {selectedWbsElement && (
                    <div className="mt-2 text-sm text-gray-600">
                      <div><span className="font-medium">Code:</span> {selectedWbsElement.code}</div>
                      <div><span className="font-medium">Description:</span> {selectedWbsElement.description}</div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.expense_description || ''}
                  onChange={(e) => handleInputChange('expense_description', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.expense_description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  rows={3}
                  disabled={isSubmitting}
                  placeholder="Enter expense description"
                />
                {errors.expense_description && (
                  <p className="mt-1 text-sm text-red-600">{errors.expense_description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Category
                </label>
                <select
                  value={formData.costCategoryId || ''}
                  onChange={(e) => handleInputChange('costCategoryId', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="">-- Select Cost Category (Optional) --</option>
                  {costCategoryOptions.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.code} - {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Baseline Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Baseline Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Baseline Date
                  </label>
                  <input
                    type="date"
                    value={formData.baseline_date || ''}
                    onChange={(e) => handleInputChange('baseline_date', e.target.value || null)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.baseline_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.baseline_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.baseline_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Baseline Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.baseline_amount ?? ''}
                    onChange={(e) => handleInputChange('baseline_amount', e.target.value === '' ? null : e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.baseline_amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                  {errors.baseline_amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.baseline_amount}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Planned Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Planned Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planned Date
                  </label>
                  <input
                    type="date"
                    value={formData.planned_date || ''}
                    onChange={(e) => handleInputChange('planned_date', e.target.value || null)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.planned_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.planned_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.planned_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planned Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.planned_amount ?? ''}
                    onChange={(e) => handleInputChange('planned_amount', e.target.value === '' ? null : e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.planned_amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                  {errors.planned_amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.planned_amount}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actual Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Actual Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Date
                  </label>
                  <input
                    type="date"
                    value={formData.actual_date || ''}
                    onChange={(e) => handleInputChange('actual_date', e.target.value || null)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.actual_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.actual_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.actual_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.actual_amount ?? ''}
                    onChange={(e) => handleInputChange('actual_amount', e.target.value === '' ? null : e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.actual_amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                  {errors.actual_amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.actual_amount}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Additional Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Link Text
                  </label>
                  <input
                    type="text"
                    value={formData.invoice_link_text || ''}
                    onChange={(e) => handleInputChange('invoice_link_text', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., View Invoice"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Link URL
                  </label>
                  <input
                    type="url"
                    value={formData.invoice_link_url || ''}
                    onChange={(e) => handleInputChange('invoice_link_url', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Additional notes..."
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Keyboard shortcut hint */}
        <div className="px-6 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">Esc</kbd> to cancel, <kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+Enter</kbd> to save
        </div>
      </div>
    </div>
  );
};

export default LedgerEntryEditModal;

