import React, { useState, useEffect } from 'react';
import { BOEElement } from '../../../store/boeStore';
import { useSettingsStore } from '../../../store/settingsStore';
import Button from '../../common/Button';

interface BOEElementModalProps {
  element?: BOEElement | null;
  parentId?: string | null;
  onSave: (element: BOEElement) => void;
  onCancel: () => void;
}

const BOEElementModal: React.FC<BOEElementModalProps> = ({
  element,
  parentId,
  onSave,
  onCancel
}) => {
  const { costCategories, vendors, fetchCostCategories, fetchVendors } = useSettingsStore();
  
  const [formData, setFormData] = useState({
    code: element?.code || '',
    name: element?.name || '',
    description: element?.description || '',
    level: element?.level || 1,
    estimatedCost: element?.estimatedCost || 0,
    actualCost: element?.actualCost || 0,
    variance: element?.variance || 0,
    managementReservePercentage: element?.managementReservePercentage || 0,
    managementReserveAmount: element?.managementReserveAmount || 0,
    isRequired: element?.isRequired ?? true,
    isOptional: element?.isOptional ?? false,
    notes: element?.notes || '',
    assumptions: element?.assumptions || '',
    risks: element?.risks || '',
    costCategoryId: element?.costCategoryId || '',
    vendorId: element?.vendorId || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load cost categories and vendors
  useEffect(() => {
    fetchCostCategories();
    fetchVendors();
  }, [fetchCostCategories, fetchVendors]);

  // Calculate level based on parent
  useEffect(() => {
    if (parentId) {
      setFormData(prev => ({ ...prev, level: 2 })); // Assuming parent is level 1
    } else {
      setFormData(prev => ({ ...prev, level: 1 }));
    }
  }, [parentId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.estimatedCost < 0) {
      newErrors.estimatedCost = 'Estimated cost cannot be negative';
    }

    if (formData.managementReservePercentage < 0 || formData.managementReservePercentage > 100) {
      newErrors.managementReservePercentage = 'Management reserve percentage must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const elementData: BOEElement = {
      id: element?.id || `temp-${Date.now()}`,
      code: formData.code,
      name: formData.name,
      description: formData.description,
      level: formData.level,
      parentElementId: parentId || undefined,
      costCategoryId: formData.costCategoryId || undefined,
      vendorId: formData.vendorId || undefined,
      estimatedCost: formData.estimatedCost,
      actualCost: formData.actualCost,
      variance: formData.variance,
      managementReservePercentage: formData.managementReservePercentage || undefined,
      managementReserveAmount: formData.managementReserveAmount,
      isRequired: formData.isRequired,
      isOptional: formData.isOptional,
      notes: formData.notes || undefined,
      assumptions: formData.assumptions || undefined,
      risks: formData.risks || undefined,
      boeVersionId: element?.boeVersionId || '',
      createdAt: element?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      childElements: element?.childElements || []
    };

    onSave(elementData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code *
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.code ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 1.1, 2.3"
          />
          {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Element name"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Element description"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Level
          </label>
          <input
            type="number"
            value={formData.level}
            onChange={(e) => handleInputChange('level', parseInt(e.target.value))}
            min={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Estimated Cost */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Cost
          </label>
          <input
            type="number"
            value={formData.estimatedCost}
            onChange={(e) => handleInputChange('estimatedCost', parseFloat(e.target.value) || 0)}
            min={0}
            step={0.01}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.estimatedCost ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.estimatedCost && <p className="text-red-500 text-xs mt-1">{errors.estimatedCost}</p>}
        </div>

        {/* Management Reserve Percentage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MR Percentage (%)
          </label>
          <input
            type="number"
            value={formData.managementReservePercentage}
            onChange={(e) => handleInputChange('managementReservePercentage', parseFloat(e.target.value) || 0)}
            min={0}
            max={100}
            step={0.1}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.managementReservePercentage ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.managementReservePercentage && <p className="text-red-500 text-xs mt-1">{errors.managementReservePercentage}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Cost Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cost Category
          </label>
          <select
            value={formData.costCategoryId}
            onChange={(e) => handleInputChange('costCategoryId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select cost category</option>
            {costCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Vendor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vendor
          </label>
          <select
            value={formData.vendorId}
            onChange={(e) => handleInputChange('vendorId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select vendor</option>
            {vendors.map(vendor => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Required/Optional */}
      <div className="flex space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isRequired}
            onChange={(e) => handleInputChange('isRequired', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Required</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isOptional}
            onChange={(e) => handleInputChange('isOptional', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Optional</span>
        </label>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Additional notes"
        />
      </div>

      {/* Assumptions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assumptions
        </label>
        <textarea
          value={formData.assumptions}
          onChange={(e) => handleInputChange('assumptions', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Key assumptions"
        />
      </div>

      {/* Risks */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Risks
        </label>
        <textarea
          value={formData.risks}
          onChange={(e) => handleInputChange('risks', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Potential risks"
        />
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          size="sm"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
        >
          {element ? 'Update' : 'Create'} Element
        </Button>
      </div>
    </form>
  );
};

export default BOEElementModal; 