import React, { useState, useEffect } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { timeAllocationApi } from '../../../services/boeApi';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import { formatCurrency, safeNumber } from '../../../utils/currencyUtils';
import { 
  CalendarIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface TimeAllocationManagerProps {
  programId: string;
  onAllocationCreated?: () => void;
}

interface TimeAllocationFormData {
  name: string;
  description: string;
  totalAmount: number;
  allocationType: 'Linear' | 'Front-Loaded' | 'Back-Loaded' | 'Custom';
  startDate: string;
  endDate: string;
  notes?: string;
  assumptions?: string;
  risks?: string;
  boeElementId?: string;
}

const TimeAllocationManager: React.FC<TimeAllocationManagerProps> = ({ 
  programId, 
  onAllocationCreated 
}) => {
  const { 
    timeAllocationsLoading, 
    setTimeAllocationsLoading, 
    setTimeAllocationsError 
  } = useBOEStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<TimeAllocationFormData>({
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
    [month: string]: { amount: number; date: string; }
  }>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Calculate monthly breakdown when form data changes
  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.totalAmount > 0) {
      const breakdown = calculateMonthlyBreakdown(
        formData.totalAmount,
        formData.startDate,
        formData.endDate,
        formData.allocationType
      );
      setMonthlyBreakdown(breakdown);
    }
  }, [formData.totalAmount, formData.startDate, formData.endDate, formData.allocationType]);

  const calculateMonthlyBreakdown = (
    totalAmount: number,
    startDate: string,
    endDate: string,
    allocationType: string
  ) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    
    if (months <= 0) return {};

    const breakdown: { [month: string]: { amount: number; date: string; } } = {};
    let remainingAmount = totalAmount;

    for (let i = 0; i < months; i++) {
      const currentDate = new Date(start);
      currentDate.setMonth(start.getMonth() + i);
      const monthKey = currentDate.toISOString().slice(0, 7); // YYYY-MM format
      
      let monthlyAmount: number;
      
      switch (allocationType) {
        case 'Linear':
          monthlyAmount = Math.round((totalAmount / months) * 100) / 100;
          break;
        case 'Front-Loaded':
          // 60% in first 30% of months, 30% in next 40%, 10% in last 30%
          if (i < Math.ceil(months * 0.3)) {
            monthlyAmount = Math.round((totalAmount * 0.6 / Math.ceil(months * 0.3)) * 100) / 100;
          } else if (i < Math.ceil(months * 0.7)) {
            monthlyAmount = Math.round((totalAmount * 0.3 / (Math.ceil(months * 0.7) - Math.ceil(months * 0.3))) * 100) / 100;
          } else {
            monthlyAmount = Math.round((totalAmount * 0.1 / (months - Math.ceil(months * 0.7))) * 100) / 100;
          }
          break;
        case 'Back-Loaded':
          // 10% in first 30% of months, 30% in next 40%, 60% in last 30%
          if (i < Math.ceil(months * 0.3)) {
            monthlyAmount = Math.round((totalAmount * 0.1 / Math.ceil(months * 0.3)) * 100) / 100;
          } else if (i < Math.ceil(months * 0.7)) {
            monthlyAmount = Math.round((totalAmount * 0.3 / (Math.ceil(months * 0.7) - Math.ceil(months * 0.3))) * 100) / 100;
          } else {
            monthlyAmount = Math.round((totalAmount * 0.6 / (months - Math.ceil(months * 0.7))) * 100) / 100;
          }
          break;
        default:
          monthlyAmount = Math.round((totalAmount / months) * 100) / 100;
      }

      // Adjust for rounding errors on last month
      if (i === months - 1) {
        monthlyAmount = remainingAmount;
      }

      breakdown[monthKey] = {
        amount: monthlyAmount,
        date: currentDate.toISOString().slice(0, 10)
      };

      remainingAmount -= monthlyAmount;
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

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);
      setTimeAllocationsError(null);

      const allocationData = {
        ...formData,
        totalAmount: safeNumber(formData.totalAmount)
      };

      await timeAllocationApi.createTimeAllocation(programId, allocationData);

      // Reset form and close modal
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
      setShowCreateModal(false);
      setValidationErrors([]);

      // Notify parent component
      if (onAllocationCreated) {
        onAllocationCreated();
      }
    } catch (error) {
      console.error('Error creating time allocation:', error);
      setTimeAllocationsError(error instanceof Error ? error.message : 'Failed to create time allocation');
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (field: keyof TimeAllocationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getAllocationTypeDescription = (type: string) => {
    switch (type) {
      case 'Linear':
        return 'Equal amounts distributed across all months';
      case 'Front-Loaded':
        return 'Higher amounts in early months, decreasing over time';
      case 'Back-Loaded':
        return 'Lower amounts in early months, increasing over time';
      case 'Custom':
        return 'Custom allocation pattern (not yet implemented)';
      default:
        return '';
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600';
    if (variance < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Time Allocations</h2>
          <p className="text-sm text-gray-600">
            Manage time-based cost allocations for direct labor and contractor costs
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreateModal(true)}
          disabled={timeAllocationsLoading}
        >
          <ClockIcon className="h-4 w-4 mr-2" />
          Create Time Allocation
        </Button>
      </div>

      {/* Create Time Allocation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Time Allocation"
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Software Development Contractor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount *
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => handleInputChange('totalAmount', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the work or services to be provided"
            />
          </div>

          {/* Allocation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allocation Type *
            </label>
            <select
              value={formData.allocationType}
              onChange={(e) => handleInputChange('allocationType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Linear">Linear</option>
              <option value="Front-Loaded">Front-Loaded</option>
              <option value="Back-Loaded">Back-Loaded</option>
              <option value="Custom">Custom</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {getAllocationTypeDescription(formData.allocationType)}
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Monthly Breakdown Preview */}
          {Object.keys(monthlyBreakdown).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Breakdown Preview
              </label>
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 mb-2">
                  <div>Month</div>
                  <div>Amount</div>
                  <div>Date</div>
                </div>
                {Object.entries(monthlyBreakdown).map(([month, data]) => (
                  <div key={month} className="grid grid-cols-3 gap-4 text-sm text-gray-600 py-1 border-b border-gray-200">
                    <div>{month}</div>
                    <div>{formatCurrency(data.amount)}</div>
                    <div>{data.date}</div>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-900 pt-2 border-t border-gray-300">
                  <div>Total</div>
                  <div>{formatCurrency(Object.values(monthlyBreakdown).reduce((sum, data) => sum + data.amount, 0))}</div>
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
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes"
              />
            </div>

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
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={creating || validationErrors.length > 0}
            >
              {creating ? 'Creating...' : 'Create Time Allocation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TimeAllocationManager; 