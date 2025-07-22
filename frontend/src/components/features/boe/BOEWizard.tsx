import React, { useState } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import BOETemplateSelector from './BOETemplateSelector';
import { BOETemplate } from '../../../store/boeStore';

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
  review: boolean;
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
    review: false,
  });

  const steps = [
    { id: 0, title: 'Template Selection', description: 'Choose a BOE template' },
    { id: 1, title: 'Basic Information', description: 'Enter BOE details' },
    { id: 2, title: 'WBS Structure', description: 'Define work breakdown structure' },
    { id: 3, title: 'Cost Estimation', description: 'Enter cost estimates' },
    { id: 4, title: 'Review & Create', description: 'Review and create BOE' },
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

  const handleNext = () => {
    if (wizardStep < steps.length - 1) {
      setWizardStep(wizardStep + 1);
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
        return true;
      default:
        return false;
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
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">BOE Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={currentData.basicInfo.name}
                    onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                    placeholder="Enter BOE name"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Version Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={currentData.basicInfo.versionNumber}
                    onChange={(e) => handleBasicInfoChange('versionNumber', e.target.value)}
                    placeholder="e.g., 1.0"
                  />
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Description *</label>
              <textarea
                className="form-control"
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
            <div className="alert alert-info">
              <h6>Template Structure</h6>
              <p>Based on your selected template: <strong>{currentData.template?.name}</strong></p>
              <ul className="mb-0">
                <li>Project Management</li>
                <li>Requirements Analysis</li>
                <li>Design & Development</li>
                <li>Testing & Validation</li>
                <li>Documentation</li>
                <li>Management Reserve</li>
              </ul>
            </div>
            <div className="text-center">
              <button className="btn btn-primary">
                <i className="fas fa-plus me-2"></i>
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
            <div className="alert alert-warning">
              <h6>Cost Estimation</h6>
              <p>This step will be implemented to allow detailed cost entry for each WBS element.</p>
            </div>
            <div className="text-center">
              <button className="btn btn-primary">
                <i className="fas fa-calculator me-2"></i>
                Enter Cost Estimates
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="wizard-step">
            <h5>Review & Create</h5>
            <p className="text-muted mb-4">
              Review your BOE information before creating.
            </p>
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h6>Basic Information</h6>
                  </div>
                  <div className="card-body">
                    <p><strong>Name:</strong> {currentData.basicInfo.name}</p>
                    <p><strong>Version:</strong> {currentData.basicInfo.versionNumber}</p>
                    <p><strong>Description:</strong> {currentData.basicInfo.description}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h6>Template</h6>
                  </div>
                  <div className="card-body">
                    <p><strong>Template:</strong> {currentData.template?.name}</p>
                    <p><strong>Category:</strong> {currentData.template?.category}</p>
                    <p><strong>Version:</strong> {currentData.template?.version}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="alert alert-success mt-3">
              <h6>Ready to Create</h6>
              <p>Your BOE is ready to be created. Click "Create BOE" to proceed.</p>
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
      <div className="progress mb-4" style={{ height: '4px' }}>
        <div
          className="progress-bar"
          style={{ width: `${((wizardStep + 1) / steps.length) * 100}%` }}
        ></div>
      </div>

      {/* Step Indicators */}
      <div className="row mb-4">
        {steps.map((step, index) => (
          <div key={step.id} className="col">
            <div className={`text-center ${index <= wizardStep ? 'text-primary' : 'text-muted'}`}>
              <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${
                index < wizardStep ? 'bg-primary text-white' : 
                index === wizardStep ? 'bg-primary text-white' : 'bg-light text-muted'
              }`} style={{ width: '40px', height: '40px' }}>
                {index < wizardStep ? (
                  <i className="fas fa-check"></i>
                ) : (
                  <span>{step.id + 1}</span>
                )}
              </div>
              <div className="small">
                <div className="fw-bold">{step.title}</div>
                <div className="text-muted">{step.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="wizard-content">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="d-flex justify-content-between mt-4">
        <button
          className="btn btn-outline-secondary"
          onClick={handlePrevious}
          disabled={wizardStep === 0}
        >
          <i className="fas fa-arrow-left me-2"></i>
          Previous
        </button>

        <div>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={onCancel}
          >
            Cancel
          </button>
          
          {wizardStep === steps.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={handleComplete}
              disabled={!isStepValid(wizardStep)}
            >
              <i className="fas fa-check me-2"></i>
              Create BOE
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!isStepValid(wizardStep)}
            >
              Next
              <i className="fas fa-arrow-right ms-2"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BOEWizard; 