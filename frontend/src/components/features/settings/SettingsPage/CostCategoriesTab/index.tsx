import React, { useState } from 'react';
import { useSettingsStore, CostCategory } from '../../../../../store/settingsStore';
import Button from '../../../../common/Button';
import Modal from '../../../../common/Modal';

const CostCategoriesTab: React.FC = () => {
  const costCategories = useSettingsStore(state => state.costCategories);
  const addCostCategory = useSettingsStore(state => state.addCostCategory);
  const updateCostCategory = useSettingsStore(state => state.updateCostCategory);
  const deleteCostCategory = useSettingsStore(state => state.deleteCostCategory);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CostCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true,
  });

  const handleOpenModal = (category?: CostCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        code: category.code,
        description: category.description,
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingCategory) {
      updateCostCategory(editingCategory.id, formData);
    } else {
      const newCategory: CostCategory = {
        id: Date.now().toString(),
        ...formData,
      };
      addCostCategory(newCategory);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this cost category?')) {
      deleteCostCategory(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Cost Categories</h2>
          <p className="text-sm text-gray-600 mt-1">
            Standardize cost categories across all programs and ledgers.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          Add Category
        </Button>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {costCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏷️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Cost Categories</h3>
            <p className="text-gray-600 mb-4">
              Create cost categories to standardize expense tracking across programs.
            </p>
            <Button onClick={() => handleOpenModal()}>
              Create Category
            </Button>
          </div>
        ) : (
          costCategories.map((category) => (
            <div
              key={category.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {category.code}
                    </span>
                    {category.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{category.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenModal(category)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
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
        title={editingCategory ? 'Edit Cost Category' : 'Create Cost Category'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category code"
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
              rows={3}
              placeholder="Enter category description"
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
              disabled={!formData.name.trim() || !formData.code.trim()}
            >
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CostCategoriesTab; 