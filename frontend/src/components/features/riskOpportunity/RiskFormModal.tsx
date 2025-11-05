import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { RiskScoreCalculator, calculateRiskScore, calculateExpectedValue } from './shared/RiskScoreCalculator';
import { FinancialImpactCalculator } from './shared/FinancialImpactCalculator';
import { useRiskOpportunityStore } from '../../../store/riskOpportunityStore';
import { formatCurrency, parseNumber } from '../../../utils/currencyUtils';
import type { Risk, RiskCategory } from '../../../store/riskOpportunityStore';
import axios from 'axios';

interface RiskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  risk?: Risk | null;
  onSave: (risk: Risk) => void;
}

interface WbsElement {
  id: string;
  code: string;
  name: string;
}

const RiskFormModal: React.FC<RiskFormModalProps> = ({
  isOpen,
  onClose,
  programId,
  risk,
  onSave,
}) => {
  const { riskCategories, fetchRiskCategories, createRiskCategory } = useRiskOpportunityStore();
  const [wbsElements, setWbsElements] = useState<WbsElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    code: '',
    name: '',
    description: '',
  });
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    severity: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    probability: 50,
    costImpactMin: 0,
    costImpactMostLikely: 0,
    costImpactMax: 0,
    owner: '',
    targetMitigationDate: '',
    mitigationStrategy: '',
    wbsElementId: '',
    initialNote: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!risk;

  // Load categories and WBS elements
  useEffect(() => {
    if (isOpen) {
      fetchRiskCategories();
      loadWbsElements();
    }
  }, [isOpen, fetchRiskCategories]);

  // Load WBS elements
  const loadWbsElements = async () => {
    try {
      const response = await axios.get<WbsElement[]>(`/api/programs/${programId}/wbs-elements`);
      setWbsElements(response.data);
    } catch (err) {
      console.error('Failed to load WBS elements:', err);
    }
  };

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (risk) {
        setFormData({
          title: risk.title || '',
          description: risk.description || '',
          categoryId: risk.categoryId || '',
          severity: risk.severity || 'Medium',
          probability: Number(risk.probability) || 50,
          costImpactMin: Number(risk.costImpactMin) || 0,
          costImpactMostLikely: Number(risk.costImpactMostLikely) || 0,
          costImpactMax: Number(risk.costImpactMax) || 0,
          owner: risk.owner || '',
          targetMitigationDate: risk.targetMitigationDate
            ? new Date(risk.targetMitigationDate).toISOString().split('T')[0]
            : '',
          mitigationStrategy: risk.mitigationStrategy || '',
          wbsElementId: risk.wbsElementId || '',
          initialNote: '',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          categoryId: '',
          severity: 'Medium',
          probability: 50,
          costImpactMin: 0,
          costImpactMostLikely: 0,
          costImpactMax: 0,
          owner: '',
          targetMitigationDate: '',
          mitigationStrategy: '',
          wbsElementId: '',
          initialNote: '',
        });
      }
      setErrors({});
      setError(null);
    }
  }, [isOpen, risk]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (formData.probability < 0 || formData.probability > 100) {
      newErrors.probability = 'Probability must be between 0 and 100';
    }

    if (formData.costImpactMin < 0) {
      newErrors.costImpactMin = 'Min cannot be negative';
    }

    if (formData.costImpactMostLikely < 0) {
      newErrors.costImpactMostLikely = 'Most likely cannot be negative';
    }

    if (formData.costImpactMax < 0) {
      newErrors.costImpactMax = 'Max cannot be negative';
    }

    if (
      formData.costImpactMin > formData.costImpactMostLikely ||
      formData.costImpactMostLikely > formData.costImpactMax
    ) {
      newErrors.costImpactRange = 'Invalid range: Min ≤ Most Likely ≤ Max';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const riskData: Partial<Risk> = {
        title: formData.title,
        description: formData.description || undefined,
        categoryId: formData.categoryId || undefined,
        severity: formData.severity,
        probability: formData.probability,
        costImpactMin: formData.costImpactMin,
        costImpactMostLikely: formData.costImpactMostLikely,
        costImpactMax: formData.costImpactMax,
        owner: formData.owner || undefined,
        targetMitigationDate: formData.targetMitigationDate
          ? new Date(formData.targetMitigationDate)
          : undefined,
        mitigationStrategy: formData.mitigationStrategy || undefined,
        wbsElementId: formData.wbsElementId || undefined,
      };

      let savedRisk: Risk;
      if (isEditing && risk) {
        savedRisk = await useRiskOpportunityStore.getState().updateRisk(risk.id, riskData);
      } else {
        const createData = { ...riskData, initialNote: formData.initialNote || undefined };
        savedRisk = await useRiskOpportunityStore.getState().createRisk(programId, createData as any);
      }

      onSave(savedRisk);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save risk');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('costImpact')) {
      const numValue = parseNumber(value);
      setFormData((prev) => ({ ...prev, [field]: numValue }));
    } else if (field === 'probability') {
      const numValue = parseNumber(value);
      setFormData((prev) => ({
        ...prev,
        probability: Math.min(100, Math.max(0, numValue)),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const expectedValue = calculateExpectedValue(
    formData.costImpactMin,
    formData.costImpactMostLikely,
    formData.costImpactMax
  );
  const riskScore = calculateRiskScore(
    formData.costImpactMin,
    formData.costImpactMostLikely,
    formData.costImpactMax,
    formData.probability,
    formData.severity
  );

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Risk' : 'Create New Risk'}
      size="xl"
      footer={
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="risk-form"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Risk' : 'Create Risk'}
          </button>
        </div>
      }
    >
      <form id="risk-form" onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter risk title"
              required
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the risk"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                {!showCreateCategory && (
                  <button
                    type="button"
                    onClick={() => setShowCreateCategory(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New
                  </button>
                )}
              </div>
              {!showCreateCategory ? (
                <>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.categoryId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select Category</option>
                    {riskCategories.filter(cat => cat.isActive).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>
                  )}
                  {riskCategories.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No categories available. Create one to get started.</p>
                  )}
                </>
              ) : (
                <div className="space-y-2 border border-gray-300 rounded-md p-3 bg-gray-50">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCategoryData.name}
                      onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Technical"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Category Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCategoryData.code}
                      onChange={(e) => setNewCategoryData({ ...newCategoryData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., TECHNICAL"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newCategoryData.description}
                      onChange={(e) => setNewCategoryData({ ...newCategoryData, description: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Brief description"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newCategoryData.name.trim() || !newCategoryData.code.trim()) {
                          setError('Category name and code are required');
                          return;
                        }
                        setCreatingCategory(true);
                        try {
                          const newCategory = await createRiskCategory({
                            name: newCategoryData.name.trim(),
                            code: newCategoryData.code.trim(),
                            description: newCategoryData.description.trim() || undefined,
                            isActive: true,
                          });
                          handleInputChange('categoryId', newCategory.id);
                          setShowCreateCategory(false);
                          setNewCategoryData({ code: '', name: '', description: '' });
                          setError(null);
                        } catch (err: any) {
                          setError(err.response?.data?.error || 'Failed to create category');
                        } finally {
                          setCreatingCategory(false);
                        }
                      }}
                      disabled={creatingCategory || !newCategoryData.name.trim() || !newCategoryData.code.trim()}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingCategory ? 'Creating...' : 'Create & Select'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateCategory(false);
                        setNewCategoryData({ code: '', name: '', description: '' });
                        setError(null);
                      }}
                      disabled={creatingCategory}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.severity}
                onChange={(e) =>
                  handleInputChange('severity', e.target.value as 'Low' | 'Medium' | 'High' | 'Critical')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assessment */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Probability (0-100%) <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => handleInputChange('probability', e.target.value)}
                  className="w-full"
                />
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => handleInputChange('probability', e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>
              {errors.probability && (
                <p className="text-red-500 text-xs mt-1">{errors.probability}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => handleInputChange('owner', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Risk owner name"
              />
            </div>
          </div>

          {/* Financial Impact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Financial Impact (Cost) <span className="text-red-500">*</span>
            </label>
            <FinancialImpactCalculator
              min={formData.costImpactMin}
              mostLikely={formData.costImpactMostLikely}
              max={formData.costImpactMax}
            />
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costImpactMin}
                  onChange={(e) => handleInputChange('costImpactMin', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.costImpactMin || errors.costImpactRange
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Min"
                  required
                />
                {errors.costImpactMin && (
                  <p className="text-red-500 text-xs mt-1">{errors.costImpactMin}</p>
                )}
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costImpactMostLikely}
                  onChange={(e) => handleInputChange('costImpactMostLikely', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.costImpactMostLikely || errors.costImpactRange
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Most Likely"
                  required
                />
                {errors.costImpactMostLikely && (
                  <p className="text-red-500 text-xs mt-1">{errors.costImpactMostLikely}</p>
                )}
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costImpactMax}
                  onChange={(e) => handleInputChange('costImpactMax', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.costImpactMax || errors.costImpactRange
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Max"
                  required
                />
                {errors.costImpactMax && (
                  <p className="text-red-500 text-xs mt-1">{errors.costImpactMax}</p>
                )}
              </div>
            </div>
            {errors.costImpactRange && (
              <p className="text-red-500 text-xs mt-1">{errors.costImpactRange}</p>
            )}
          </div>

          {/* Risk Score Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <RiskScoreCalculator
              min={formData.costImpactMin}
              mostLikely={formData.costImpactMostLikely}
              max={formData.costImpactMax}
              probability={formData.probability}
              severity={formData.severity}
              showBreakdown={true}
            />
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Mitigation Date
              </label>
              <input
                type="date"
                value={formData.targetMitigationDate}
                onChange={(e) => handleInputChange('targetMitigationDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WBS Element</label>
              <select
                value={formData.wbsElementId}
                onChange={(e) => handleInputChange('wbsElementId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">None</option>
                {wbsElements.map((element) => (
                  <option key={element.id} value={element.id}>
                    {element.code} - {element.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mitigation Strategy
            </label>
            <textarea
              value={formData.mitigationStrategy}
              onChange={(e) => handleInputChange('mitigationStrategy', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the mitigation strategy"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Note</label>
              <textarea
                value={formData.initialNote}
                onChange={(e) => handleInputChange('initialNote', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add an initial note about this risk"
              />
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default RiskFormModal;

