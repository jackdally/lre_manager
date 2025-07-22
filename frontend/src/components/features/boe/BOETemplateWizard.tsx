import React, { useState } from 'react';
import { useBOEStore } from '../../../store/boeStore';

interface BOETemplateWizardProps {
  onComplete: (templateData: any) => void;
  onCancel: () => void;
  editTemplate?: any; // For editing existing templates
}

interface TemplateData {
  basicInfo: {
    name: string;
    description: string;
    category: string;
    version: string;
  };
  wbsStructure: any[];
  costCategories: any[];
  permissions: {
    isPublic: boolean;
    sharedWith: string[];
  };
  review: boolean;
}

const BOETemplateWizard: React.FC<BOETemplateWizardProps> = ({
  onComplete,
  onCancel,
  editTemplate,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [templateData, setTemplateData] = useState<TemplateData>({
    basicInfo: {
      name: editTemplate?.name || '',
      description: editTemplate?.description || '',
      category: editTemplate?.category || 'Software Development',
      version: editTemplate?.version || '1.0',
    },
    wbsStructure: editTemplate?.wbsStructure || [],
    costCategories: editTemplate?.costCategories || [],
    permissions: {
      isPublic: false,
      sharedWith: [],
    },
    review: false,
  });

  const steps = [
    { id: 0, title: 'Basic Information', description: 'Template details and metadata' },
    { id: 1, title: 'WBS Structure', description: 'Define work breakdown structure' },
    { id: 2, title: 'Cost Categories', description: 'Configure cost categories' },
    { id: 3, title: 'Permissions', description: 'Set sharing and access permissions' },
    { id: 4, title: 'Review & Save', description: 'Review and save template' },
  ];

  const categories = [
    'Software Development',
    'Hardware Development',
    'Research & Development',
    'Infrastructure',
    'Consulting',
    'Training',
    'Other',
  ];

  const handleBasicInfoChange = (field: keyof typeof templateData.basicInfo, value: string) => {
    setTemplateData(prev => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value }
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const finalTemplateData = {
      ...templateData,
      id: editTemplate?.id,
      isEdit: !!editTemplate,
    };
    onComplete(finalTemplateData);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(templateData.basicInfo.name && templateData.basicInfo.description);
      case 1:
        return templateData.wbsStructure.length > 0;
      case 2:
        return templateData.costCategories.length > 0;
      case 3:
        return true; // Permissions are optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Template Basic Information</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateData.basicInfo.name}
                    onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter template name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={templateData.basicInfo.description}
                    onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the template purpose and structure"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={templateData.basicInfo.category}
                    onChange={(e) => handleBasicInfoChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version
                  </label>
                  <input
                    type="text"
                    value={templateData.basicInfo.version}
                    onChange={(e) => handleBasicInfoChange('version', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1.0"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">WBS Structure</h3>
              <p className="text-gray-600 mb-4">
                Define the work breakdown structure for this template. This will be the foundation for all BOEs created from this template.
              </p>
              
              {/* Placeholder for WBS structure editor */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">WBS Structure Editor</h4>
                <p className="text-sm text-gray-600 mb-4">
                  This will include hierarchical WBS editing with drag-and-drop functionality.
                </p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Add WBS Element
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Categories</h3>
              <p className="text-gray-600 mb-4">
                Configure the cost categories that will be available for this template.
              </p>
              
              {/* Placeholder for cost category configuration */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Cost Category Configuration</h4>
                <p className="text-sm text-gray-600 mb-4">
                  This will include cost category selection and configuration options.
                </p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Configure Categories
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions & Sharing</h3>
              <p className="text-gray-600 mb-4">
                Set who can access and use this template.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={templateData.permissions.isPublic}
                    onChange={(e) => setTemplateData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, isPublic: e.target.checked }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                    Make this template public (available to all users)
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share with specific users (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email addresses separated by commas"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Leave empty if template is public or for personal use only
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review Template</h3>
              <p className="text-gray-600 mb-4">
                Review the template details before saving.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="font-medium text-gray-700">Name:</dt>
                        <dd className="text-gray-900">{templateData.basicInfo.name}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Description:</dt>
                        <dd className="text-gray-900">{templateData.basicInfo.description}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Category:</dt>
                        <dd className="text-gray-900">{templateData.basicInfo.category}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Version:</dt>
                        <dd className="text-gray-900">{templateData.basicInfo.version}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Permissions</h4>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="font-medium text-gray-700">Public Access:</dt>
                        <dd className="text-gray-900">{templateData.permissions.isPublic ? 'Yes' : 'No'}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">WBS Elements:</dt>
                        <dd className="text-gray-900">{templateData.wbsStructure.length} elements</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Cost Categories:</dt>
                        <dd className="text-gray-900">{templateData.costCategories.length} categories</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editTemplate ? 'Edit BOE Template' : 'Create New BOE Template'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {steps[currentStep].description}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`ml-4 w-8 h-0.5 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {renderStepContent()}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Previous
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            
            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleComplete}
                disabled={!isStepValid(currentStep)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  isStepValid(currentStep)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {editTemplate ? 'Update Template' : 'Create Template'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  isStepValid(currentStep)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOETemplateWizard; 