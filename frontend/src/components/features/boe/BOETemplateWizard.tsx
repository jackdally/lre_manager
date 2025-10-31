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
    sharedWithRoles: string[];
    accessLevel: 'Private' | 'Shared' | 'Public';
    allowCopy: boolean;
    allowModify: boolean;
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
      category: editTemplate?.category || 'Hardware Development',
      version: editTemplate?.version || '1.0',
    },
    wbsStructure: editTemplate?.wbsStructure || editTemplate?.elements || [],
    costCategories: editTemplate?.costCategories || [],
    permissions: {
      isPublic: false,
      sharedWith: [],
      sharedWithRoles: [],
      accessLevel: 'Private' as const,
      allowCopy: false,
      allowModify: false,
    },
    review: false,
  });

  const steps = [
    { id: 0, title: 'Basic Information', description: 'Template details and metadata' },
    { id: 1, title: 'WBS Structure', description: 'Define work breakdown structure' },
    { id: 2, title: 'Permissions', description: 'Set sharing and access permissions' },
    { id: 3, title: 'Review & Save', description: 'Review and save template' },
  ];

  // Helpers for WBS editing
  const generateId = () => Math.random().toString(36).slice(2);

  type WbsNode = {
    id: string;
    code: string;
    name: string;
    level: number;
    parentElementId?: string;
    childElements?: WbsNode[];
  };

  const setWbs = (updater: (prev: any[]) => any[]) => {
    setTemplateData(prev => ({ ...prev, wbsStructure: updater(prev.wbsStructure) }));
  };

  const addRoot = () => {
    setWbs(prev => [
      ...prev,
      { id: generateId(), code: `${prev.length + 1}.0`, name: 'New Element', level: 1, childElements: [] }
    ]);
  };

  const addChild = (parentId: string) => {
    const addRec = (nodes: WbsNode[]): WbsNode[] => nodes.map(n => {
      if (n.id === parentId) {
        const children = n.childElements || [];
        const child: WbsNode = {
          id: generateId(),
          code: `${n.code}.${(children.length + 1)}`,
          name: 'New Child',
          level: (n.level || 1) + 1,
          parentElementId: n.id,
          childElements: []
        };
        return { ...n, childElements: [...children, child] };
      }
      return { ...n, childElements: n.childElements ? addRec(n.childElements) : n.childElements } as WbsNode;
    });
    setWbs(prev => addRec(prev));
  };

  const updateNode = (id: string, changes: Partial<WbsNode>) => {
    const updRec = (nodes: WbsNode[]): WbsNode[] => nodes.map(n => (
      n.id === id
        ? { ...n, ...changes }
        : { ...n, childElements: n.childElements ? updRec(n.childElements) : n.childElements }
    ));
    setWbs(prev => updRec(prev));
  };

  const deleteNode = (id: string) => {
    const delRec = (nodes: WbsNode[]): WbsNode[] => nodes
      .filter(n => n.id !== id)
      .map(n => ({ ...n, childElements: n.childElements ? delRec(n.childElements) : n.childElements }));
    setWbs(prev => delRec(prev));
  };

  const seedPreset = (preset: 'Hardware' | 'Software' | 'Services') => {
    const hw: WbsNode[] = [
      { id: generateId(), code: '1.0', name: 'Project Management', level: 1, childElements: [] },
      { id: generateId(), code: '2.0', name: 'Requirements', level: 1, childElements: [] },
      { id: generateId(), code: '3.0', name: 'Hardware Design', level: 1, childElements: [
        { id: generateId(), code: '3.1', name: 'Electrical', level: 2, parentElementId: '', childElements: [] },
        { id: generateId(), code: '3.2', name: 'Mechanical', level: 2, parentElementId: '', childElements: [] }
      ] },
      { id: generateId(), code: '4.0', name: 'Procurement', level: 1, childElements: [] },
      { id: generateId(), code: '5.0', name: 'Integration & Test', level: 1, childElements: [] },
      { id: generateId(), code: '6.0', name: 'Documentation', level: 1, childElements: [] },
    ];
    const sw: WbsNode[] = [
      { id: generateId(), code: '1.0', name: 'Project Management', level: 1, childElements: [] },
      { id: generateId(), code: '2.0', name: 'Requirements', level: 1, childElements: [] },
      { id: generateId(), code: '3.0', name: 'Design & Development', level: 1, childElements: [
        { id: generateId(), code: '3.1', name: 'Frontend', level: 2, parentElementId: '', childElements: [] },
        { id: generateId(), code: '3.2', name: 'Backend', level: 2, parentElementId: '', childElements: [] }
      ] },
      { id: generateId(), code: '4.0', name: 'Testing & Validation', level: 1, childElements: [] },
      { id: generateId(), code: '5.0', name: 'Documentation', level: 1, childElements: [] },
    ];
    const sv: WbsNode[] = [
      { id: generateId(), code: '1.0', name: 'Project Management', level: 1, childElements: [] },
      { id: generateId(), code: '2.0', name: 'Discovery', level: 1, childElements: [] },
      { id: generateId(), code: '3.0', name: 'Delivery', level: 1, childElements: [] },
      { id: generateId(), code: '4.0', name: 'Knowledge Transfer', level: 1, childElements: [] },
    ];
    const mapParent = (nodes: WbsNode[], parentId?: string): WbsNode[] => nodes.map(n => ({
      ...n,
      parentElementId: parentId,
      childElements: n.childElements ? mapParent(n.childElements, n.id) : [],
    }));
    const chosen = preset === 'Hardware' ? hw : preset === 'Software' ? sw : sv;
    setWbs(() => mapParent(chosen));
  };

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
        return true; // Permissions are optional
      case 3:
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">WBS Structure</h3>
              <div className="flex items-center gap-2">
                <button onClick={addRoot} className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700">Add Root</button>
                <select
                  value={templateData.basicInfo.category}
                  onChange={(e) => handleBasicInfoChange('category', e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-md"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                  onClick={() => seedPreset(
                    templateData.basicInfo.category.includes('Hardware') ? 'Hardware' :
                    templateData.basicInfo.category.includes('Software') ? 'Software' : 'Services'
                  )}
                  className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Seed from Preset
                </button>
              </div>
            </div>

            {templateData.wbsStructure.length === 0 ? (
              <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-md p-4">
                No WBS elements yet. Click "Add Root" or "Seed from Preset".
              </div>
            ) : (
              <div className="bg-gray-50 rounded-md p-3">
                {templateData.wbsStructure.map((node: any) => (
                  <WbsItem key={node.id} node={node} onAddChild={addChild} onUpdate={updateNode} onDelete={deleteNode} />
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions</h3>
              <p className="text-gray-600 mb-4">Choose who can access this template.</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Access Level</label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="accessLevel"
                        checked={templateData.permissions.accessLevel === 'Private'}
                        onChange={() => setTemplateData(prev => ({ ...prev, permissions: { ...prev.permissions, accessLevel: 'Private', isPublic: false } }))}
                      />
                      Private
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="accessLevel"
                        checked={templateData.permissions.accessLevel === 'Shared'}
                        onChange={() => setTemplateData(prev => ({ ...prev, permissions: { ...prev.permissions, accessLevel: 'Shared', isPublic: false } }))}
                      />
                      Organization
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="accessLevel"
                        checked={templateData.permissions.accessLevel === 'Public'}
                        onChange={() => setTemplateData(prev => ({ ...prev, permissions: { ...prev.permissions, accessLevel: 'Public', isPublic: true } }))}
                      />
                      Public
                    </label>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowCopy"
                    checked={templateData.permissions.allowCopy}
                    onChange={(e) => setTemplateData(prev => ({ ...prev, permissions: { ...prev.permissions, allowCopy: e.target.checked } }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allowCopy" className="ml-2 block text-sm text-gray-900">
                    Allow others to copy this template
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
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
                        <dt className="font-medium text-gray-700">Access Level:</dt>
                        <dd className="text-gray-900">{templateData.permissions.accessLevel}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Public Access:</dt>
                        <dd className="text-gray-900">{templateData.permissions.isPublic ? 'Yes' : 'No'}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Shared Users:</dt>
                        <dd className="text-gray-900">
                          {templateData.permissions.sharedWith.length > 0 
                            ? templateData.permissions.sharedWith.join(', ') 
                            : 'None'}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Shared Roles:</dt>
                        <dd className="text-gray-900">
                          {templateData.permissions.sharedWithRoles.length > 0 
                            ? templateData.permissions.sharedWithRoles.join(', ') 
                            : 'None'}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Allow Copy:</dt>
                        <dd className="text-gray-900">{templateData.permissions.allowCopy ? 'Yes' : 'No'}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Allow Modify:</dt>
                        <dd className="text-gray-900">{templateData.permissions.allowModify ? 'Yes' : 'No'}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Structure</h4>
                    <dl className="space-y-2 text-sm">
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

  // WBS item component (inline, simple editor)
  const WbsItem: React.FC<{ node: any; onAddChild: (id: string) => void; onUpdate: (id: string, c: any) => void; onDelete: (id: string) => void; }>
    = ({ node, onAddChild, onUpdate, onDelete }) => {
    return (
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <input
            value={node.code}
            onChange={(e) => onUpdate(node.id, { code: e.target.value })}
            className="w-28 px-2 py-1 border border-gray-300 rounded"
            placeholder="Code"
          />
          <input
            value={node.name}
            onChange={(e) => onUpdate(node.id, { name: e.target.value })}
            className="flex-1 px-2 py-1 border border-gray-300 rounded"
            placeholder="Name"
          />
          <button onClick={() => onAddChild(node.id)} className="text-sm px-2 py-1 border border-gray-300 rounded hover:bg-gray-100">Add Child</button>
          <button onClick={() => onDelete(node.id)} className="text-sm px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50">Delete</button>
        </div>
        {Array.isArray(node.childElements) && node.childElements.length > 0 && (
          <div className="pl-6 mt-1">
            {node.childElements.map((child: any) => (
              <WbsItem key={child.id} node={child} onAddChild={onAddChild} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    );
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