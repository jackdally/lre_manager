import React, { useState, useEffect } from 'react';
import { BOEElement } from '../../../store/boeStore';
import { useSettingsStore } from '../../../store/settingsStore';
import Button from '../../common/Button';

interface BOEElementModalProps {
  element?: BOEElement | null;
  parentId?: string | null;
  defaultCode?: string; // pre-populated code for new elements
  onSave: (element: BOEElement) => void;
  onCancel: () => void;
}

const BOEElementModal: React.FC<BOEElementModalProps> = ({
  element,
  parentId,
  defaultCode,
  onSave,
  onCancel
}) => {
  const { costCategories, fetchCostCategories } = useSettingsStore();
  
  const [formData, setFormData] = useState({
    code: element?.code || defaultCode || '',
    name: element?.name || '',
    description: element?.description || '',
    level: element?.level || 1,
    estimatedCost: element?.estimatedCost || 0,
    actualCost: element?.actualCost || 0,
    variance: element?.variance || 0,
    // MR is managed at BOE level; keep fields internally but not exposed in UI
    managementReservePercentage: element?.managementReservePercentage || 0,
    managementReserveAmount: element?.managementReserveAmount || 0,
    isRequired: element?.isRequired ?? true,
    notes: element?.notes || '',
    assumptions: element?.assumptions || '',
    risks: element?.risks || '',
    costCategoryId: element?.costCategoryId || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load cost categories
  useEffect(() => {
    fetchCostCategories();
  }, [fetchCostCategories]);

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

    // MR is managed at BOE level; nothing to validate here

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // If this element has children (editing case), force estimatedCost to 0 as aggregator
    const isAggregator = Boolean(element?.childElements && element.childElements.length > 0);
    const elementData: BOEElement = {
      id: element?.id || `temp-${Date.now()}`,
      code: formData.code,
      name: formData.name,
      description: formData.description,
      level: formData.level,
      parentElementId: parentId || undefined,
      costCategoryId: formData.costCategoryId || undefined,
      estimatedCost: isAggregator ? 0 : formData.estimatedCost,
      actualCost: formData.actualCost,
      variance: formData.variance,
      managementReservePercentage: undefined,
      managementReserveAmount: 0,
      isRequired: formData.isRequired,
      isOptional: !formData.isRequired,
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

  const isParentAggregator = Boolean(element?.childElements && element.childElements.length > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Code (auto-generated) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code *
          </label>
          <input
            type="text"
            value={formData.code}
            readOnly
            disabled
            className={`w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-600 cursor-not-allowed ${
              errors.code ? 'border-red-500' : 'border-gray-300'
            }`}
            title="WBS Code is auto-generated based on position in the hierarchy"
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
        {/* Level (calculated, read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Level
          </label>
          <input
            type="number"
            value={formData.level}
            readOnly
            disabled
            min={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
            title="Level is calculated from the WBS hierarchy"
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
            disabled={isParentAggregator}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.estimatedCost ? 'border-red-500' : 'border-gray-300'
            } ${isParentAggregator ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
            title={isParentAggregator ? 'Cost is aggregated from child elements' : ''}
          />
          {errors.estimatedCost && <p className="text-red-500 text-xs mt-1">{errors.estimatedCost}</p>}
        </div>

        {/* MR Percentage removed - MR is configured at BOE level */}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Cost Category (leaves only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cost Category
          </label>
          <select
            value={formData.costCategoryId}
            onChange={(e) => handleInputChange('costCategoryId', e.target.value)}
            disabled={isParentAggregator}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isParentAggregator ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
            title={isParentAggregator ? 'Parents inherit categories from their children' : ''}
          >
            <option value="">Select cost category</option>
            {costCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Required toggle (single) */}
      <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-gray-50">
        <div>
          <div className="text-sm font-medium text-gray-800">Required element</div>
          <div className="text-xs text-gray-500">If unchecked, this element is optional.</div>
        </div>
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={formData.isRequired}
            onChange={(e) => handleInputChange('isRequired', e.target.checked)}
            className="h-4 w-4"
          />
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