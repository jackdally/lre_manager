import React, { useState, useEffect } from 'react';
import { useSettingsStore, FiscalYear } from '../../../../../store/settingsStore';
import Button from '../../../../common/Button';
import Modal from '../../../../common/Modal';

const FiscalYearsTab: React.FC = () => {
  const {
    fiscalYears,
    isLoading,
    error,
    fetchFiscalYears,
    createFiscalYearApi,
    updateFiscalYearApi,
    deleteFiscalYearApi,
    setError
  } = useSettingsStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFiscalYear, setEditingFiscalYear] = useState<FiscalYear | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true,
    isDefault: false,
    type: 'calendar' as 'calendar' | 'fiscal' | 'custom',
    numberOfPeriods: 12,
    periodType: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'custom',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPeriodsModal, setShowPeriodsModal] = useState(false);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<FiscalYear | null>(null);
  const [periods, setPeriods] = useState<any[]>([]);

  // Fetch fiscal years on component mount
  useEffect(() => {
    fetchFiscalYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleOpenModal = (fiscalYear?: FiscalYear) => {
    if (fiscalYear) {
      setEditingFiscalYear(fiscalYear);
      setFormData({
        name: fiscalYear.name,
        description: fiscalYear.description || '',
        startDate: fiscalYear.startDate,
        endDate: fiscalYear.endDate,
        isActive: fiscalYear.isActive,
        isDefault: fiscalYear.isDefault,
        type: fiscalYear.type,
        numberOfPeriods: fiscalYear.numberOfPeriods,
        periodType: fiscalYear.periodType,
      });
    } else {
      setEditingFiscalYear(null);
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        isActive: true,
        isDefault: false,
        type: 'calendar',
        numberOfPeriods: 12,
        periodType: 'monthly',
      });
    }
    setIsModalOpen(true);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) return;
    
    setIsSubmitting(true);
    try {
      if (editingFiscalYear) {
        await updateFiscalYearApi(editingFiscalYear.id, formData);
      } else {
        await createFiscalYearApi(formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving fiscal year:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this fiscal year?')) {
      try {
        await deleteFiscalYearApi(id);
      } catch (error) {
        console.error('Error deleting fiscal year:', error);
      }
    }
  };

  const handleOpenPeriodsModal = async (fiscalYear: FiscalYear) => {
    setSelectedFiscalYear(fiscalYear);
    setShowPeriodsModal(true);
    
    try {
      const response = await fetch(`http://localhost:4000/api/fiscal-years/${fiscalYear.id}/periods`);
      const data = await response.json();
      setPeriods(data.periods || []);
    } catch (error) {
      console.error('Error fetching periods:', error);
      setPeriods([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFiscalYearStatus = (fiscalYear: FiscalYear) => {
    const now = new Date();
    const startDate = new Date(fiscalYear.startDate);
    const endDate = new Date(fiscalYear.endDate);
    
    if (now < startDate) return 'Future';
    if (now > endDate) return 'Past';
    return 'Current';
  };

  if (isLoading && fiscalYears.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Fiscal Years</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage fiscal years and reporting periods for financial planning.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          Add Fiscal Year
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading fiscal years...</div>
        </div>
      )}

      {/* Fiscal Years List */}
      {!isLoading && (
        <div className="space-y-4">
          {fiscalYears.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Fiscal Years</h3>
              <p className="text-gray-600 mb-4">
                Add fiscal years to enable proper financial planning and reporting.
              </p>
              <Button onClick={() => handleOpenModal()}>
                Add Fiscal Year
              </Button>
            </div>
          ) : (
            fiscalYears.map((fiscalYear) => (
              <div
                key={fiscalYear.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{fiscalYear.name}</h3>
                      <p className="text-sm text-gray-500">{fiscalYear.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">
                          {formatDate(fiscalYear.startDate)} - {formatDate(fiscalYear.endDate)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {fiscalYear.numberOfPeriods} {fiscalYear.periodType} periods
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      {fiscalYear.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Default
                        </span>
                      )}
                      {!fiscalYear.isActive && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        getFiscalYearStatus(fiscalYear) === 'Current' 
                          ? 'bg-green-100 text-green-800'
                          : getFiscalYearStatus(fiscalYear) === 'Future'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {getFiscalYearStatus(fiscalYear)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleOpenPeriodsModal(fiscalYear)}
                        variant="secondary"
                        size="sm"
                      >
                        Periods
                      </Button>
                      <Button
                        onClick={() => handleOpenModal(fiscalYear)}
                        variant="secondary"
                        size="sm"
                      >
                        Edit
                      </Button>
                      {!fiscalYear.isDefault && (
                        <Button
                          onClick={() => handleDelete(fiscalYear.id)}
                          variant="danger"
                          size="sm"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Fiscal Year Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFiscalYear ? 'Edit Fiscal Year' : 'Add Fiscal Year'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fiscal Year Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="FY 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Fiscal year description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
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
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="calendar">Calendar Year</option>
                <option value="fiscal">Fiscal Year</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period Type
              </label>
              <select
                value={formData.periodType}
                onChange={(e) => setFormData({ ...formData, periodType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Periods
            </label>
            <input
              type="number"
              value={formData.numberOfPeriods}
              onChange={(e) => setFormData({ ...formData, numberOfPeriods: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="52"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Default</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => setIsModalOpen(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name.trim() || !formData.startDate || !formData.endDate}
            >
              {isSubmitting ? 'Saving...' : editingFiscalYear ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Periods Modal */}
      <Modal
        isOpen={showPeriodsModal}
        onClose={() => setShowPeriodsModal(false)}
        title={`Reporting Periods - ${selectedFiscalYear?.name}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Reporting periods for {selectedFiscalYear?.name} ({selectedFiscalYear?.type} year)
          </p>
          
          {periods.length > 0 ? (
            <div className="space-y-2">
              {periods.map((period) => (
                <div key={period.periodNumber} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{period.name}</span>
                    <div className="text-sm text-gray-500">
                      {formatDate(period.startDate)} - {formatDate(period.endDate)}
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">{period.type}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No periods available
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setShowPeriodsModal(false)}
              variant="secondary"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FiscalYearsTab; 