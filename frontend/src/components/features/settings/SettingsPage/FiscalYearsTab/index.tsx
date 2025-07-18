import React, { useState } from 'react';
import { useSettingsStore, FiscalYear } from '../../../../../store/settingsStore';
import Button from '../../../../common/Button';
import Modal from '../../../../common/Modal';

const FiscalYearsTab: React.FC = () => {
  const { fiscalYears, activeFiscalYear, setFiscalYears, setActiveFiscalYear } = useSettingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<FiscalYear | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: false,
  });

  const handleOpenModal = (fiscalYear?: FiscalYear) => {
    if (fiscalYear) {
      setEditingYear(fiscalYear);
      setFormData({
        name: fiscalYear.name,
        startDate: fiscalYear.startDate,
        endDate: fiscalYear.endDate,
        isActive: fiscalYear.isActive,
      });
    } else {
      setEditingYear(null);
      setFormData({
        name: '',
        startDate: '',
        endDate: '',
        isActive: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingYear) {
      const updatedYears = fiscalYears.map(fy => 
        fy.id === editingYear.id ? { ...fy, ...formData } : fy
      );
      setFiscalYears(updatedYears);
    } else {
      const newFiscalYear: FiscalYear = {
        id: Date.now().toString(),
        ...formData,
      };
      setFiscalYears([...fiscalYears, newFiscalYear]);
    }
    setIsModalOpen(false);
  };

  const handleSetActive = (fiscalYear: FiscalYear) => {
    setActiveFiscalYear(fiscalYear);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this fiscal year?')) {
      const updatedYears = fiscalYears.filter(fy => fy.id !== id);
      setFiscalYears(updatedYears);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Fiscal Years</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage fiscal year periods for reporting and planning.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          Add Fiscal Year
        </Button>
      </div>

      {/* Fiscal Years List */}
      <div className="space-y-4">
        {fiscalYears.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Fiscal Years</h3>
            <p className="text-gray-600 mb-4">
              Add fiscal years to organize reporting periods and planning cycles.
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
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{fiscalYear.name}</h3>
                    {fiscalYear.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                    {activeFiscalYear?.id === fiscalYear.id && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">
                    {new Date(fiscalYear.startDate).toLocaleDateString()} - {new Date(fiscalYear.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {activeFiscalYear?.id !== fiscalYear.id && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetActive(fiscalYear)}
                    >
                      Set Active
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenModal(fiscalYear)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(fiscalYear.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingYear ? 'Edit Fiscal Year' : 'Add Fiscal Year'}
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
              placeholder="e.g., FY 2024"
            />
          </div>
          
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || !formData.startDate || !formData.endDate}
            >
              {editingYear ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FiscalYearsTab; 