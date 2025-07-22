import React, { useState, useEffect } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { BOETemplate } from '../../../store/boeStore';
import { boeTemplatesApi } from '../../../services/boeApi';
import BOETemplateWizard from './BOETemplateWizard';

interface BOETemplateSelectorProps {
  onTemplateSelect: (template: BOETemplate) => void;
  selectedTemplateId?: string;
  showCreateNew?: boolean;
}

const BOETemplateSelector: React.FC<BOETemplateSelectorProps> = ({
  onTemplateSelect,
  selectedTemplateId,
  showCreateNew = true,
}) => {
  const {
    templates,
    templatesLoading,
    templatesError,
    setTemplates,
    setTemplatesLoading,
    setTemplatesError,
  } = useBOEStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [showTemplateWizard, setShowTemplateWizard] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BOETemplate | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setTemplatesLoading(true);
        setTemplatesError(null);
        
        const templatesData = await boeTemplatesApi.getTemplates();
        setTemplates(templatesData);
        setTemplatesLoading(false);
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplatesError(error instanceof Error ? error.message : 'Failed to load templates');
        setTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, [setTemplates, setTemplatesLoading, setTemplatesError]);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const handleTemplateSelect = (template: BOETemplate) => {
    onTemplateSelect(template);
  };

  const handlePreviewToggle = (templateId: string) => {
    setShowPreview(showPreview === templateId ? null : templateId);
  };

  const handleCreateNewTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateWizard(true);
  };

  const handleEditTemplate = (template: BOETemplate) => {
    setEditingTemplate(template);
    setShowTemplateWizard(true);
  };

  const handleTemplateWizardComplete = (templateData: any) => {
    // TODO: Save template via API
    console.log('Template data:', templateData);
    setShowTemplateWizard(false);
    setEditingTemplate(null);
    // Refresh templates list
    // loadTemplates();
  };

  const handleTemplateWizardCancel = () => {
    setShowTemplateWizard(false);
    setEditingTemplate(null);
  };

  if (templatesLoading) {
    return (
      <div className="template-selector">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading templates...</span>
        </div>
      </div>
    );
  }

  if (templatesError) {
    return (
      <div className="template-selector">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h5 className="text-red-800 font-medium">Error Loading Templates</h5>
          <p className="text-red-700 mt-1">{templatesError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="template-selector">
      {/* Template Wizard Modal */}
      {showTemplateWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <BOETemplateWizard
            onComplete={handleTemplateWizardComplete}
            onCancel={handleTemplateWizardCancel}
            editTemplate={editingTemplate}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="md:col-span-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-1">
          {showCreateNew && (
            <button 
              onClick={handleCreateNewTemplate}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Template
            </button>
          )}
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h5 className="text-blue-800 font-medium">No Templates Found</h5>
          <p className="text-blue-700 mt-1">No templates match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className={`bg-white rounded-lg shadow-md border-2 transition-colors ${
              selectedTemplateId === template.id ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h6 className="font-medium text-gray-900">{template.name}</h6>
                  {template.isDefault && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">Default</span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-gray-500">Category: {template.category}</span>
                  <span className="text-xs text-gray-500">v{template.version}</span>
                </div>
                <div className="flex justify-between items-center space-x-2">
                  <button
                    className="flex-1 text-sm text-gray-600 hover:text-gray-800 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    onClick={() => handlePreviewToggle(template.id)}
                  >
                    {showPreview === template.id ? 'Hide' : 'Preview'}
                  </button>
                  <button
                    className={`flex-1 text-sm px-3 py-1 rounded transition-colors ${
                      selectedTemplateId === template.id
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-600 border border-blue-300 hover:bg-blue-50'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    {selectedTemplateId === template.id ? 'Selected' : 'Select'}
                  </button>
                </div>
                
                {/* Edit button */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="w-full text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Template
                  </button>
                </div>
              </div>
              
              {showPreview === template.id && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <h6 className="font-medium text-gray-900 mt-3 mb-2">Template Preview</h6>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-2">Structure:</p>
                    <ul className="space-y-1 mb-3">
                      <li>• Project Management</li>
                      <li>• Requirements Analysis</li>
                      <li>• Design & Development</li>
                      <li>• Testing & Validation</li>
                      <li>• Documentation</li>
                      <li>• Management Reserve</li>
                    </ul>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-medium">Default MR:</span> 10%
                      </div>
                      <div>
                        <span className="font-medium">Elements:</span> 15-25
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Showing {filteredTemplates.length} of {templates.length} templates
          </span>
          {selectedTemplateId && (
            <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2">
              <div className="flex items-center text-green-800">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Template selected</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BOETemplateSelector; 