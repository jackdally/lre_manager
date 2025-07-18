import React, { useState } from 'react';
import { useSettingsStore, WBSTemplate } from '../../../../../store/settingsStore';
import Button from '../../../../common/Button';
import Modal from '../../../../common/Modal';
import WBSStructureEditor from './WBSStructureEditor';
import WBSPreview from './WBSPreview';
import { ChevronDown, ChevronRight } from '../../../../common/icons';

const WBSTemplatesTab: React.FC = () => {
  const { wbsTemplates, addWbsTemplate, updateWbsTemplate, deleteWbsTemplate, setSelectedWbsTemplate } = useSettingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WBSTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    structure: [] as any[],
  });
  const [expandedPreviews, setExpandedPreviews] = useState<Set<string>>(new Set());

  const handleOpenModal = (template?: WBSTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description,
        structure: template.structure,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        structure: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingTemplate) {
      updateWbsTemplate(editingTemplate.id, formData);
    } else {
      const newTemplate: WBSTemplate = {
        id: Date.now().toString(),
        ...formData,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addWbsTemplate(newTemplate);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this WBS template?')) {
      deleteWbsTemplate(id);
    }
  };

  const handleSetDefault = (template: WBSTemplate) => {
    // Update all templates to remove default flag
    wbsTemplates.forEach(t => {
      if (t.id !== template.id) {
        updateWbsTemplate(t.id, { isDefault: false });
      }
    });
    // Set the selected template as default
    updateWbsTemplate(template.id, { isDefault: true });
    setSelectedWbsTemplate(template);
  };

  const togglePreview = (templateId: string) => {
    const newExpanded = new Set(expandedPreviews);
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId);
    } else {
      newExpanded.add(templateId);
    }
    setExpandedPreviews(newExpanded);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">WBS Templates</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage Work Breakdown Structure templates for program planning.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          Add Template
        </Button>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {wbsTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No WBS Templates</h3>
            <p className="text-gray-600 mb-4">
              Create your first WBS template to get started with program planning.
            </p>
            <Button onClick={() => handleOpenModal()}>
              Create Template
            </Button>
          </div>
        ) : (
          wbsTemplates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                    {template.isDefault && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{template.description}</p>
                  <div className="text-sm text-gray-500 mb-3">
                    {template.structure.length} elements • 
                    Updated {new Date(template.updatedAt).toLocaleDateString()}
                  </div>
                  
                  {/* Collapsible WBS Structure Preview */}
                  <div className="border-t border-gray-200 pt-3">
                    <button
                      onClick={() => togglePreview(template.id)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {expandedPreviews.has(template.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      {expandedPreviews.has(template.id) ? 'Hide Preview' : 'Show Preview'}
                    </button>
                    
                    {expandedPreviews.has(template.id) && (
                      <div className="mt-3">
                        <WBSPreview structure={template.structure} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!template.isDefault && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetDefault(template)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenModal(template)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    disabled={template.isDefault}
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
        title={editingTemplate ? 'Edit WBS Template' : 'Create WBS Template'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter template name"
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
              placeholder="Enter template description"
            />
          </div>

          {/* WBS Structure Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WBS Structure
            </label>
            <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
              <WBSStructureEditor
                structure={formData.structure}
                onChange={(structure) => setFormData({ ...formData, structure })}
              />
            </div>
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
              disabled={!formData.name.trim()}
            >
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WBSTemplatesTab; 