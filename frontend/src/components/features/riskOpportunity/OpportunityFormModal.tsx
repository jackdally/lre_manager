import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { FinancialImpactCalculator, calculateExpectedValue } from './shared/FinancialImpactCalculator';
import { useRiskOpportunityStore } from '../../../store/riskOpportunityStore';
import { formatCurrency, parseNumber } from '../../../utils/currencyUtils';
import type { Opportunity, RiskCategory } from '../../../store/riskOpportunityStore';
import axios from 'axios';

interface OpportunityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  opportunity?: Opportunity | null;
  onSave: (opportunity: Opportunity) => void;
}

interface WbsElement {
  id: string;
  code: string;
  name: string;
}

/**
 * Calculate opportunity score
 */
const calculateOpportunityScore = (
  min: number | string,
  mostLikely: number | string,
  max: number | string,
  probability: number | string,
  benefitSeverity: 'Low' | 'Medium' | 'High' | 'Critical'
): number => {
  const severityWeights: Record<string, number> = {
    Low: 1,
    Medium: 2,
    High: 3,
    Critical: 4,
  };

  const expectedBenefit = calculateExpectedValue(min, mostLikely, max);
  const severityWeight = severityWeights[benefitSeverity] || 1;
  const probabilityDecimal = Number(probability || 0) / 100; // Convert to 0-1 range

  return severityWeight * probabilityDecimal * expectedBenefit;
};

const OpportunityFormModal: React.FC<OpportunityFormModalProps> = ({
  isOpen,
  onClose,
  programId,
  opportunity,
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
    benefitSeverity: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    probability: 50,
    benefitMin: 0,
    benefitMostLikely: 0,
    benefitMax: 0,
    owner: '',
    targetRealizationDate: '',
    realizationStrategy: '',
    wbsElementId: '',
    initialNote: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!opportunity;

  useEffect(() => {
    if (isOpen) {
      fetchRiskCategories();
      loadWbsElements();
    }
  }, [isOpen, fetchRiskCategories]);

  const loadWbsElements = async () => {
    try {
      const response = await axios.get<WbsElement[]>(`/api/programs/${programId}/wbs-elements`);
      setWbsElements(response.data);
    } catch (err) {
      console.error('Failed to load WBS elements:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (opportunity) {
        setFormData({
          title: opportunity.title || '',
          description: opportunity.description || '',
          categoryId: opportunity.categoryId || '',
          benefitSeverity: opportunity.benefitSeverity || 'Medium',
          probability: Number(opportunity.probability) || 50,
          benefitMin: Number(opportunity.benefitMin) || 0,
          benefitMostLikely: Number(opportunity.benefitMostLikely) || 0,
          benefitMax: Number(opportunity.benefitMax) || 0,
          owner: opportunity.owner || '',
          targetRealizationDate: opportunity.targetRealizationDate
            ? new Date(opportunity.targetRealizationDate).toISOString().split('T')[0]
            : '',
          realizationStrategy: opportunity.realizationStrategy || '',
          wbsElementId: opportunity.wbsElementId || '',
          initialNote: '',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          categoryId: '',
          benefitSeverity: 'Medium',
          probability: 50,
          benefitMin: 0,
          benefitMostLikely: 0,
          benefitMax: 0,
          owner: '',
          targetRealizationDate: '',
          realizationStrategy: '',
          wbsElementId: '',
          initialNote: '',
        });
      }
      setErrors({});
      setError(null);
    }
  }, [isOpen, opportunity]);

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

    if (formData.benefitMin < 0) {
      newErrors.benefitMin = 'Min cannot be negative';
    }

    if (formData.benefitMostLikely < 0) {
      newErrors.benefitMostLikely = 'Most likely cannot be negative';
    }

    if (formData.benefitMax < 0) {
      newErrors.benefitMax = 'Max cannot be negative';
    }

    if (
      formData.benefitMin > formData.benefitMostLikely ||
      formData.benefitMostLikely > formData.benefitMax
    ) {
      newErrors.benefitRange = 'Invalid range: Min ≤ Most Likely ≤ Max';
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
      // Ensure numeric fields are properly converted
      const benefitMin = Number(formData.benefitMin) || 0;
      const benefitMostLikely = Number(formData.benefitMostLikely) || 0;
      const benefitMax = Number(formData.benefitMax) || 0;
      const probability = Number(formData.probability) || 0;

      const opportunityData: Partial<Opportunity> = {
        title: formData.title,
        description: formData.description || undefined,
        categoryId: formData.categoryId || undefined,
        benefitSeverity: formData.benefitSeverity,
        probability: probability,
        benefitMin: benefitMin,
        benefitMostLikely: benefitMostLikely,
        benefitMax: benefitMax,
        owner: formData.owner || undefined,
        targetRealizationDate: formData.targetRealizationDate
          ? new Date(formData.targetRealizationDate)
          : undefined,
        realizationStrategy: formData.realizationStrategy || undefined,
        wbsElementId: formData.wbsElementId || undefined,
      };

      let savedOpportunity: Opportunity;
      if (isEditing && opportunity) {
        savedOpportunity = await useRiskOpportunityStore.getState().updateOpportunity(
          opportunity.id,
          opportunityData
        );
      } else {
        const createData = { ...opportunityData, initialNote: formData.initialNote || undefined };
        savedOpportunity = await useRiskOpportunityStore.getState().createOpportunity(
          programId,
          createData as any
        );
      }

      onSave(savedOpportunity);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save opportunity');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('benefit')) {
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

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const expectedBenefit = calculateExpectedValue(
    formData.benefitMin,
    formData.benefitMostLikely,
    formData.benefitMax
  );
  const opportunityScore = calculateOpportunityScore(
    formData.benefitMin,
    formData.benefitMostLikely,
    formData.benefitMax,
    formData.probability,
    formData.benefitSeverity
  );

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Opportunity' : 'Create New Opportunity'}
      size="xl"
      footer={
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="opportunity-form"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Opportunity' : 'Create Opportunity'}
          </button>
        </div>
      }
    >
      <form id="opportunity-form" onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="Enter opportunity title"
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
              placeholder="Describe the opportunity"
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
                    className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
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
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Benefit Severity <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.benefitSeverity}
                onChange={(e) =>
                  handleInputChange(
                    'benefitSeverity',
                    e.target.value as 'Low' | 'Medium' | 'High' | 'Critical'
                  )
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
          <h3 className="text-lg font-semibold text-gray-900">Opportunity Assessment</h3>

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
                placeholder="Opportunity owner name"
              />
            </div>
          </div>

          {/* Financial Benefit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Financial Benefit (Cost Savings/Revenue) <span className="text-red-500">*</span>
            </label>
            <FinancialImpactCalculator
              min={formData.benefitMin}
              mostLikely={formData.benefitMostLikely}
              max={formData.benefitMax}
              label="Expected Benefit"
            />
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.benefitMin}
                  onChange={(e) => handleInputChange('benefitMin', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.benefitMin || errors.benefitRange ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Min"
                  required
                />
                {errors.benefitMin && (
                  <p className="text-red-500 text-xs mt-1">{errors.benefitMin}</p>
                )}
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.benefitMostLikely}
                  onChange={(e) => handleInputChange('benefitMostLikely', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.benefitMostLikely || errors.benefitRange
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Most Likely"
                  required
                />
                {errors.benefitMostLikely && (
                  <p className="text-red-500 text-xs mt-1">{errors.benefitMostLikely}</p>
                )}
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.benefitMax}
                  onChange={(e) => handleInputChange('benefitMax', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.benefitMax || errors.benefitRange ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Max"
                  required
                />
                {errors.benefitMax && (
                  <p className="text-red-500 text-xs mt-1">{errors.benefitMax}</p>
                )}
              </div>
            </div>
            {errors.benefitRange && (
              <p className="text-red-500 text-xs mt-1">{errors.benefitRange}</p>
            )}
          </div>

          {/* Opportunity Score Display */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Expected Benefit:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(expectedBenefit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Opportunity Score:</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(opportunityScore)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Realization Date
              </label>
              <input
                type="date"
                value={formData.targetRealizationDate}
                onChange={(e) => handleInputChange('targetRealizationDate', e.target.value)}
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
              Realization Strategy
            </label>
            <textarea
              value={formData.realizationStrategy}
              onChange={(e) => handleInputChange('realizationStrategy', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe how to realize this opportunity"
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
                placeholder="Add an initial note about this opportunity"
              />
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default OpportunityFormModal;

