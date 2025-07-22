import React, { useState } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import BOETemplateSelector from './BOETemplateSelector';
import { BOETemplate, BOEElementAllocation } from '../../../store/boeStore';
import { formatCurrency } from '../../../utils/currencyUtils';
import { 
  CalendarIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface BOEWizardProps {
  programId: string;
  onComplete: (boeData: any) => void;
  onCancel: () => void;
}

interface WizardData {
  template?: BOETemplate;
  basicInfo: {
    name: string;
    description: string;
    versionNumber: string;
  };
  wbsStructure: any[];
  costEstimates: any[];
  allocations: BOEElementAllocation[];
  review: boolean;
}

interface AllocationSetupData {
  elementId: string;
  elementName: string;
  estimatedCost: number;
  allocationType: 'Linear' | 'Front-Loaded' | 'Back-Loaded' | 'Custom';
  startDate: string;
  endDate: string;
  totalAmount: number;
  notes: string;
}

const BOEWizard: React.FC<BOEWizardProps> = ({ programId, onComplete, onCancel }) => {
  const { wizardStep, wizardData, setWizardStep, setWizardData } = useBOEStore();
  
  const [currentData, setCurrentData] = useState<WizardData>({
    basicInfo: {
      name: '',
      description: '',
      versionNumber: '1.0',
    },
    wbsStructure: [],
    costEstimates: [],
    allocations: [],
    review: false,
  });

  const [allocationSetup, setAllocationSetup] = useState<AllocationSetupData[]>([]);

  const steps = [
    { id: 0, title: 'Template Selection', description: 'Choose a BOE template' },
    { id: 1, title: 'Basic Information', description: 'Enter BOE details' },
    { id: 2, title: 'WBS Structure', description: 'Define work breakdown structure' },
    { id: 3, title: 'Cost Estimation', description: 'Enter cost estimates' },
    { id: 4, title: 'Allocation Planning', description: 'Plan monthly allocations' },
    { id: 5, title: 'Review & Create', description: 'Review and create BOE' },
  ];

  const handleTemplateSelect = (template: BOETemplate) => {
    setCurrentData(prev => ({ ...prev, template }));
  };

  const handleBasicInfoChange = (field: keyof typeof currentData.basicInfo, value: string) => {
    setCurrentData(prev => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value }
    }));
  };

  const handleAllocationChange = (elementId: string, field: keyof AllocationSetupData, value: any) => {
    setAllocationSetup(prev => 
      prev.map(item => 
        item.elementId === elementId 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleNext = () => {
    if (wizardStep < steps.length - 1) {
      setWizardStep(wizardStep + 1);
      
      // Initialize allocation setup when moving to allocation step
      if (wizardStep === 3 && currentData.wbsStructure.length > 0) {
        const initialAllocations = currentData.wbsStructure.map(element => ({
          elementId: element.id,
          elementName: element.name,
          estimatedCost: element.estimatedCost || 0,
          allocationType: 'Linear' as const,
          startDate: '',
          endDate: '',
          totalAmount: element.estimatedCost || 0,
          notes: ''
        }));
        setAllocationSetup(initialAllocations);
      }
    }
  };

  const handlePrevious = () => {
    if (wizardStep > 0) {
      setWizardStep(wizardStep - 1);
    }
  };

  const handleComplete = () => {
    const boeData = {
      programId,
      templateId: currentData.template?.id,
      ...currentData.basicInfo,
      elements: currentData.wbsStructure,
      costEstimates: currentData.costEstimates,
      allocations: allocationSetup.filter(a => a.startDate && a.endDate && a.totalAmount > 0),
    };
    onComplete(boeData);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!currentData.template;
      case 1:
        return !!(currentData.basicInfo.name && currentData.basicInfo.description);
      case 2:
        return currentData.wbsStructure.length > 0;
      case 3:
        return currentData.costEstimates.length > 0;
      case 4:
        // At least one allocation must be configured
        return allocationSetup.some(a => a.startDate && a.endDate && a.totalAmount > 0);
      case 5:
        return true;
      default:
        return false;
    }
  };

  const calculateNumberOfMonths = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    return Math.max(1, months + 1);
  };

  const getMonthlyAmount = (totalAmount: number, startDate: string, endDate: string, allocationType: string): number => {
    const months = calculateNumberOfMonths(startDate, endDate);
    if (months === 0) return 0;
    
    switch (allocationType) {
      case 'Linear':
        return totalAmount / months;
      case 'Front-Loaded':
        return (totalAmount * 0.6) / Math.ceil(months * 0.3);
      case 'Back-Loaded':
        return (totalAmount * 0.1) / Math.ceil(months * 0.3);
      default:
        return totalAmount / months;
    }
  };

  const renderStepContent = () => {
    switch (wizardStep) {
      case 0:
        return (
          <div className="wizard-step">
            <h5>Select a BOE Template</h5>
            <p className="text-muted mb-4">
              Choose a template that best matches your project type. Templates provide a starting structure for your BOE.
            </p>
            <BOETemplateSelector
              onTemplateSelect={handleTemplateSelect}
              selectedTemplateId={currentData.template?.id}
            />
          </div>
        );

      case 1:
        return (
          <div className="wizard-step">
            <h5>Basic Information</h5>
            <p className="text-muted mb-4">
              Provide basic information about your BOE.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BOE Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentData.basicInfo.name}
                  onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                  placeholder="Enter BOE name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version Number</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentData.basicInfo.versionNumber}
                  onChange={(e) => handleBasicInfoChange('versionNumber', e.target.value)}
                  placeholder="e.g., 1.0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={currentData.basicInfo.description}
                onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                placeholder="Describe the purpose and scope of this BOE"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="wizard-step">
            <h5>Work Breakdown Structure</h5>
            <p className="text-muted mb-4">
              Define the hierarchical structure of your project work elements.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h6 className="text-blue-900 font-medium">Template Structure</h6>
              <p className="text-blue-700">Based on your selected template: <strong>{currentData.template?.name}</strong></p>
              <ul className="text-blue-700 mt-2 space-y-1">
                <li>• Project Management</li>
                <li>• Requirements Analysis</li>
                <li>• Design & Development</li>
                <li>• Testing & Validation</li>
                <li>• Documentation</li>
                <li>• Management Reserve</li>
              </ul>
            </div>
            <div className="text-center">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                <span className="mr-2">+</span>
                Add WBS Elements
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="wizard-step">
            <h5>Cost Estimation</h5>
            <p className="text-muted mb-4">
              Enter cost estimates for each work element.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h6 className="text-yellow-900 font-medium">Cost Estimation</h6>
              <p className="text-yellow-700">This step will be implemented to allow detailed cost entry for each WBS element.</p>
            </div>
            <div className="text-center mt-4">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                <span className="mr-2">💰</span>
                Enter Cost Estimates
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="wizard-step">
            <h5>Allocation Planning</h5>
            <p className="text-muted mb-4">
              Plan monthly allocations for your BOE elements. This helps with cash flow planning and project scheduling.
            </p>
            
            {allocationSetup.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="mx-auto h-12 w-12 mb-4" />
                <p>No WBS elements found. Please complete the previous steps first.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allocationSetup.map((allocation, index) => (
                  <div key={allocation.elementId} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h6 className="text-gray-900 font-medium">{allocation.elementName}</h6>
                      <span className="text-sm text-gray-500">
                        Est. Cost: {formatCurrency(allocation.estimatedCost)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Allocation Type</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={allocation.allocationType}
                          onChange={(e) => handleAllocationChange(allocation.elementId, 'allocationType', e.target.value)}
                        >
                          <option value="Linear">Linear</option>
                          <option value="Front-Loaded">Front-Loaded</option>
                          <option value="Back-Loaded">Back-Loaded</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={allocation.startDate}
                          onChange={(e) => handleAllocationChange(allocation.elementId, 'startDate', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={allocation.endDate}
                          onChange={(e) => handleAllocationChange(allocation.elementId, 'endDate', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={allocation.totalAmount}
                          onChange={(e) => handleAllocationChange(allocation.elementId, 'totalAmount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    {allocation.startDate && allocation.endDate && allocation.totalAmount > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Monthly Amount:</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(getMonthlyAmount(allocation.totalAmount, allocation.startDate, allocation.endDate, allocation.allocationType))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium text-gray-900">
                            {calculateNumberOfMonths(allocation.startDate, allocation.endDate)} months
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        value={allocation.notes}
                        onChange={(e) => handleAllocationChange(allocation.elementId, 'notes', e.target.value)}
                        placeholder="Additional notes about this allocation..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="wizard-step">
            <h5>Review & Create</h5>
            <p className="text-muted mb-4">
              Review your BOE information before creating.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h6 className="text-gray-900 font-medium mb-3">Basic Information</h6>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {currentData.basicInfo.name}</div>
                  <div><span className="font-medium">Version:</span> {currentData.basicInfo.versionNumber}</div>
                  <div><span className="font-medium">Description:</span> {currentData.basicInfo.description}</div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h6 className="text-gray-900 font-medium mb-3">Template</h6>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Template:</span> {currentData.template?.name}</div>
                  <div><span className="font-medium">Category:</span> {currentData.template?.category}</div>
                  <div><span className="font-medium">Version:</span> {currentData.template?.version}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h6 className="text-gray-900 font-medium mb-3">Allocation Summary</h6>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Elements with Allocations:</span>
                  <span className="font-medium">
                    {allocationSetup.filter(a => a.startDate && a.endDate && a.totalAmount > 0).length} / {allocationSetup.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Allocated Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(allocationSetup.reduce((sum, a) => sum + (a.totalAmount || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <h6 className="text-green-900 font-medium">Ready to Create</h6>
              </div>
              <p className="text-green-700 mt-1">Your BOE is ready to be created with allocation planning. Click "Create BOE" to proceed.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="boe-wizard">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((wizardStep + 1) / steps.length) * 100}%` }}
        ></div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="text-center">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
              index < wizardStep 
                ? 'bg-green-500 text-white' 
                : index === wizardStep 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {index < wizardStep ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{step.id + 1}</span>
              )}
            </div>
            <div className="text-xs">
              <div className={`font-medium ${index <= wizardStep ? 'text-gray-900' : 'text-gray-500'}`}>
                {step.title}
              </div>
              <div className="text-gray-400">{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="wizard-content mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handlePrevious}
          disabled={wizardStep === 0}
        >
          <span className="mr-2">←</span>
          Previous
        </button>

        <div className="flex space-x-2">
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={onCancel}
          >
            Cancel
          </button>
          
          {wizardStep === steps.length - 1 ? (
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleComplete}
              disabled={!isStepValid(wizardStep)}
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Create BOE
            </button>
          ) : (
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNext}
              disabled={!isStepValid(wizardStep)}
            >
              Next
              <span className="ml-2">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BOEWizard; 