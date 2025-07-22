import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  LockClosedIcon,
  LockOpenIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useBOEStore, BOEElementAllocation } from '../../../store/boeStore';
import { elementAllocationApi } from '../../../services/boeApi';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface BOEElementAllocationManagerProps {
  boeVersionId: string;
  selectedElementId?: string;
  selectedElementName?: string;
  onAllocationCreated?: () => void;
}

interface ElementAllocationFormData {
  name: string;
  description: string;
  totalAmount: number;
  allocationType: 'Linear' | 'Front-Loaded' | 'Back-Loaded' | 'Custom';
  startDate: string;
  endDate: string;
  totalQuantity?: number;
  quantityUnit?: string;
  notes: string;
  assumptions: string;
  risks: string;
}

const BOEElementAllocationManager: React.FC<BOEElementAllocationManagerProps> = ({ 
  boeVersionId,
  selectedElementId,
  selectedElementName,
  onAllocationCreated 
}) => {
  const { 
    elementAllocations,
    elementAllocationSummary,
    elementAllocationsLoading, 
    setElementAllocationsLoading, 
    setElementAllocationsError,
    setElementAllocations,
    setElementAllocationSummary
  } = useBOEStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<ElementAllocationFormData>({
    name: '',
    description: '',
    totalAmount: 0,
    allocationType: 'Linear',
    startDate: '',
    endDate: '',
    notes: '',
    assumptions: '',
    risks: ''
  });
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<{
    [month: string]: { amount: number; quantity?: number; date: string; }
  }>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Calculate monthly breakdown when form data changes
  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.totalAmount > 0) {
      const breakdown = calculateMonthlyBreakdown(
        formData.totalAmount,
        formData.totalQuantity,
        formData.startDate,
        formData.endDate,
        formData.allocationType
      );
      setMonthlyBreakdown(breakdown);
    }
  }, [formData.totalAmount, formData.totalQuantity, formData.startDate, formData.endDate, formData.allocationType]);

  const calculateMonthlyBreakdown = (
    totalAmount: number,
    totalQuantity: number | undefined,
    startDate: string,
    endDate: string,
    allocationType: string
  ) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    
    if (months <= 0) return {};

    const breakdown: { [month: string]: { amount: number; quantity?: number; date: string; } } = {};
    let remainingAmount = totalAmount;
    let remainingQuantity = totalQuantity;

    for (let i = 0; i < months; i++) {
      const currentDate = new Date(start);
      currentDate.setMonth(start.getMonth() + i);
      const monthKey = currentDate.toISOString().slice(0, 7); // YYYY-MM format
      
      let monthlyAmount: number;
      let monthlyQuantity: number | undefined;
      
      switch (allocationType) {
        case 'Linear':
          monthlyAmount = Math.round((totalAmount / months) * 100) / 100;
          monthlyQuantity = totalQuantity ? Math.round((totalQuantity / months) * 100) / 100 : undefined;
          break;
        case 'Front-Loaded':
          // 60% in first 30% of months, 30% in next 40%, 10% in last 30%
          if (i < Math.ceil(months * 0.3)) {
            monthlyAmount = Math.round((totalAmount * 0.6 / Math.ceil(months * 0.3)) * 100) / 100;
            monthlyQuantity = totalQuantity ? Math.round((totalQuantity * 0.6 / Math.ceil(months * 0.3)) * 100) / 100 : undefined;
          } else if (i < Math.ceil(months * 0.7)) {
            monthlyAmount = Math.round((totalAmount * 0.3 / (Math.ceil(months * 0.7) - Math.ceil(months * 0.3))) * 100) / 100;
            monthlyQuantity = totalQuantity ? Math.round((totalQuantity * 0.3 / (Math.ceil(months * 0.7) - Math.ceil(months * 0.3))) * 100) / 100 : undefined;
          } else {
            monthlyAmount = Math.round((totalAmount * 0.1 / (months - Math.ceil(months * 0.7))) * 100) / 100;
            monthlyQuantity = totalQuantity ? Math.round((totalQuantity * 0.1 / (months - Math.ceil(months * 0.7))) * 100) / 100 : undefined;
          }
          break;
        case 'Back-Loaded':
          // 10% in first 30% of months, 30% in next 40%, 60% in last 30%
          if (i < Math.ceil(months * 0.3)) {
            monthlyAmount = Math.round((totalAmount * 0.1 / Math.ceil(months * 0.3)) * 100) / 100;
            monthlyQuantity = totalQuantity ? Math.round((totalQuantity * 0.1 / Math.ceil(months * 0.3)) * 100) / 100 : undefined;
          } else if (i < Math.ceil(months * 0.7)) {
            monthlyAmount = Math.round((totalAmount * 0.3 / (Math.ceil(months * 0.7) - Math.ceil(months * 0.3))) * 100) / 100;
            monthlyQuantity = totalQuantity ? Math.round((totalQuantity * 0.3 / (Math.ceil(months * 0.7) - Math.ceil(months * 0.3))) * 100) / 100 : undefined;
          } else {
            monthlyAmount = Math.round((totalAmount * 0.6 / (months - Math.ceil(months * 0.7))) * 100) / 100;
            monthlyQuantity = totalQuantity ? Math.round((totalQuantity * 0.6 / (months - Math.ceil(months * 0.7))) * 100) / 100 : undefined;
          }
          break;
        default:
          monthlyAmount = Math.round((totalAmount / months) * 100) / 100;
          monthlyQuantity = totalQuantity ? Math.round((totalQuantity / months) * 100) / 100 : undefined;
      }

      // Adjust for rounding errors on last month
      if (i === months - 1) {
        monthlyAmount = remainingAmount;
        monthlyQuantity = remainingQuantity;
      }

      breakdown[monthKey] = {
        amount: monthlyAmount,
        quantity: monthlyQuantity,
        date: currentDate.toISOString().slice(0, 10)
      };

      remainingAmount -= monthlyAmount;
      if (remainingQuantity && monthlyQuantity) {
        remainingQuantity -= monthlyQuantity;
      }
    }

    return breakdown;
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('Name is required');
    }

    if (!formData.description.trim()) {
      errors.push('Description is required');
    }

    if (!formData.totalAmount || formData.totalAmount <= 0) {
      errors.push('Total amount must be greater than 0');
    }

    if (!formData.startDate) {
      errors.push('Start date is required');
    }

    if (!formData.endDate) {
      errors.push('End date is required');
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (startDate >= endDate) {
        errors.push('End date must be after start date');
      }
    }

    if (formData.totalQuantity && formData.totalQuantity <= 0) {
      errors.push('Total quantity must be greater than 0 if provided');
    }

    if (formData.totalQuantity && !formData.quantityUnit) {
      errors.push('Quantity unit is required when total quantity is provided');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleCreateAllocation = async () => {
    if (!validateForm() || !selectedElementId) {
      return;
    }

    try {
      setCreating(true);
      const allocationData = {
        ...formData,
        boeVersionId
      };

      const newAllocation = await elementAllocationApi.createElementAllocation(
        selectedElementId,
        allocationData
      );

      // Refresh allocations
      await loadElementAllocations();
      
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        totalAmount: 0,
        allocationType: 'Linear',
        startDate: '',
        endDate: '',
        notes: '',
        assumptions: '',
        risks: ''
      });
      onAllocationCreated?.();
    } catch (error) {
      console.error('Error creating element allocation:', error);
      setValidationErrors(['Failed to create allocation']);
    } finally {
      setCreating(false);
    }
  };

  const loadElementAllocations = async () => {
    try {
      setElementAllocationsLoading(true);
      setElementAllocationsError(null);
      
      const [allocations, summary] = await Promise.all([
        elementAllocationApi.getElementAllocations(boeVersionId),
        elementAllocationApi.getElementAllocationSummary(boeVersionId)
      ]);
      
      setElementAllocations(allocations);
      setElementAllocationSummary(summary);
    } catch (error) {
      console.error('Error loading element allocations:', error);
      setElementAllocationsError(error instanceof Error ? error.message : 'Failed to load element allocations');
    } finally {
      setElementAllocationsLoading(false);
    }
  };

  useEffect(() => {
    loadElementAllocations();
  }, [boeVersionId]);

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600';
    if (variance < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <ArrowUpIcon className="h-4 w-4 text-red-600" />;
    if (variance < 0) return <ArrowDownIcon className="h-4 w-4 text-green-600" />;
    return null;
  };

  if (elementAllocationsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter allocations for selected element if provided
  const filteredAllocations = selectedElementId 
    ? elementAllocations.filter(allocation => allocation.boeElementId === selectedElementId)
    : elementAllocations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedElementName ? `Allocations for ${selectedElementName}` : 'Element Allocations'}
          </h2>
          <p className="text-sm text-gray-600">
            {selectedElementName 
              ? `Manage monthly allocations for this element`
              : 'Manage monthly allocations for BOE elements'
            }
          </p>
        </div>
        {selectedElementId && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Allocation
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {elementAllocationSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500">Total Allocations</div>
            <div className="text-2xl font-semibold text-gray-900">
              {elementAllocationSummary.totalAllocations}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500">Total Amount</div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatCurrency(elementAllocationSummary.totalAmount)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500">Allocated Amount</div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatCurrency(elementAllocationSummary.allocatedAmount)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500">Variance</div>
            <div className={`text-2xl font-semibold flex items-center ${getVarianceColor(elementAllocationSummary.variance)}`}>
              {getVarianceIcon(elementAllocationSummary.variance)}
              {formatCurrency(elementAllocationSummary.variance)}
            </div>
          </div>
        </div>
      )}

      {/* Allocations List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Element Allocations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAllocations.map((allocation) => (
                <tr key={allocation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {allocation.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {allocation.allocationType}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(allocation.totalAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(allocation.startDate)} - {formatDate(allocation.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {allocation.isLocked ? (
                        <LockClosedIcon className="h-4 w-4 text-green-600 mr-1" />
                      ) : (
                        <LockOpenIcon className="h-4 w-4 text-yellow-600 mr-1" />
                      )}
                      <span className={`text-sm ${allocation.isLocked ? 'text-green-600' : 'text-yellow-600'}`}>
                        {allocation.isLocked ? 'Locked' : 'Draft'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => {/* TODO: Edit allocation */}}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {!allocation.isLocked && (
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => {/* TODO: Delete allocation */}}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Allocation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Element Allocation</h3>
              
              {/* Form */}
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allocation Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Software Development - Level 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allocation Type *
                    </label>
                    <select
                      value={formData.allocationType}
                      onChange={(e) => setFormData({ ...formData, allocationType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Linear">Linear</option>
                      <option value="Front-Loaded">Front-Loaded</option>
                      <option value="Back-Loaded">Back-Loaded</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the allocation..."
                  />
                </div>

                {/* Amount and Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Quantity
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.totalQuantity || ''}
                      onChange={(e) => setFormData({ ...formData, totalQuantity: parseFloat(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity Unit
                    </label>
                    <input
                      type="text"
                      value={formData.quantityUnit || ''}
                      onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., hours, units"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Monthly Breakdown Preview */}
                {Object.keys(monthlyBreakdown).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Breakdown Preview
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700 mb-2">
                        <div>Month</div>
                        <div>Amount</div>
                        <div>Quantity</div>
                        <div>Date</div>
                      </div>
                      {Object.entries(monthlyBreakdown).map(([month, data]) => (
                        <div key={month} className="grid grid-cols-4 gap-4 text-sm text-gray-600 py-1 border-b border-gray-200">
                          <div>{month}</div>
                          <div>{formatCurrency(data.amount)}</div>
                          <div>{data.quantity ? `${data.quantity} ${formData.quantityUnit || ''}` : '-'}</div>
                          <div>{data.date}</div>
                        </div>
                      ))}
                      <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-900 pt-2 border-t border-gray-300">
                        <div>Total</div>
                        <div>{formatCurrency(Object.values(monthlyBreakdown).reduce((sum, data) => sum + data.amount, 0))}</div>
                        <div>{formData.totalQuantity ? `${formData.totalQuantity} ${formData.quantityUnit || ''}` : '-'}</div>
                        <div></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Notes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional notes..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assumptions
                    </label>
                    <textarea
                      value={formData.assumptions}
                      onChange={(e) => setFormData({ ...formData, assumptions: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Key assumptions..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Risks
                    </label>
                    <textarea
                      value={formData.risks}
                      onChange={(e) => setFormData({ ...formData, risks: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Potential risks..."
                    />
                  </div>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                        <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                          {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAllocation}
                    disabled={creating || !selectedElementId}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Allocation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOEElementAllocationManager; 