import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { WbsElement, WbsElementFormData } from '../../../../types/wbs';
import axios from 'axios';

interface WbsElementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (element: WbsElement) => void;
  programId: string;
  element?: WbsElement | null;
  parentId?: string;
  parentElements?: WbsElement[];
}

const WbsElementModal: React.FC<WbsElementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  programId,
  element,
  parentId,
  parentElements = []
}) => {
  const [formData, setFormData] = useState<WbsElementFormData>({
    code: '',
    name: '',
    description: '',
    level: 1,
    parentId: undefined
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!element;

  useEffect(() => {
    if (isOpen) {
      if (element) {
        // Editing existing element
        setFormData({
          code: element.code,
          name: element.name,
          description: element.description,
          level: element.level,
          parentId: element.parentId
        });
      } else {
        // Adding new element
        setFormData({
          code: '',
          name: '',
          description: '',
          level: parentId ? 2 : 1, // If parentId is provided, this is a child element
          parentId: parentId
        });
      }
      setError(null);
    }
  }, [isOpen, element, parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim() || !formData.name.trim() || !formData.description.trim()) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      if (isEditing) {
        // Update existing element
        response = await axios.put(`/api/programs/wbs-elements/${element!.id}`, formData);
      } else {
        // Create new element
        response = await axios.post(`/api/programs/${programId}/wbs-elements`, formData);
      }

      onSave(response.data as WbsElement);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save WBS element');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof WbsElementFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Edit WBS Element' : 'Add WBS Element'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1.1, 2.3.1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Element name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Element description"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <input
              type="number"
              value={formData.level}
              onChange={(e) => handleInputChange('level', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="10"
            />
          </div>

          {parentElements.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Element
              </label>
              <select
                value={formData.parentId || ''}
                onChange={(e) => handleInputChange('parentId', e.target.value || '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No parent (root level)</option>
                {parentElements.map(parent => (
                  <option key={parent.id} value={parent.id}>
                    {parent.code} - {parent.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WbsElementModal; 