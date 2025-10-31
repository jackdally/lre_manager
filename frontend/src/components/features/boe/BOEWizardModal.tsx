import React, { useState } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { boeVersionsApi, wbsTemplateIntegrationApi } from '../../../services/boeApi';
import BOEWizard from './BOEWizard';

const BOEWizardModal: React.FC = () => {
  const { showWizard, wizardProgramId, currentBOE, closeWizard, setCurrentBOE, setToast, setActiveTab } = useBOEStore();
  const [isCreating, setIsCreating] = useState(false);

  if (!showWizard || !wizardProgramId) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentBOE ? 'Create New Version' : 'Create New BOE'}
          </h2>
          <p className="text-gray-600 mt-1">
            {currentBOE 
              ? `Creating new version from ${currentBOE.name} (${currentBOE.versionNumber})`
              : 'Follow the steps below to create a new Basis of Estimate'
            }
          </p>
          {isCreating && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-800 text-sm">
                  {currentBOE ? 'Creating new version...' : 'Creating BOE...'}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <BOEWizard
            key="centralized-wizard"
            programId={wizardProgramId}
            currentBOE={currentBOE}
            sourceBOE={currentBOE}
            onComplete={async (boeData) => {
              try {
                setIsCreating(true);
          
                
                let newBOE;
                
                // Check if this is a version creation (any method when currentBOE exists) or new BOE creation
                if (currentBOE && boeData.creationMethod) {
                  // Use version creation API for all methods when creating a version
                  const versionData = {
                    creationMethod: 'version-from-current',
                    changeSummary: boeData.changeSummary || 'New version created from existing BOE',
                    wizardData: boeData
                  };
                  
                  const result = await boeVersionsApi.createVersion(wizardProgramId, versionData);
                  newBOE = result.boeVersion;
          
                } else {
                  // Regular BOE creation: send flattened elements if provided
                  const sourceTree = (boeData?.elements || boeData?.wbsStructure || []) as any[];

                  const flatElements: any[] = [];
                  const walk = (nodes: any[], parentId?: string) => {
                    nodes.forEach((n) => {
                      const tempId = n.id || `temp-${Math.random().toString(36).slice(2)}`;
                      flatElements.push({
                        id: tempId,
                        code: n.code,
                        name: n.name,
                        description: n.description || '',
                        level: n.level || 1,
                        parentElementId: parentId,
                        costCategoryId: n.costCategoryId || undefined,
                        vendorId: n.vendorId || undefined,
                        estimatedCost: typeof n.estimatedCost === 'string' ? parseFloat(n.estimatedCost) || 0 : (n.estimatedCost || 0),
                        isRequired: n.isRequired !== false,
                        isOptional: n.isRequired === false,
                        notes: n.notes || ''
                      });
                      if (Array.isArray(n.childElements) && n.childElements.length) {
                        walk(n.childElements, tempId);
                      }
                    });
                  };
                  walk(sourceTree);

                  const boeCreationData: any = {
                    name: boeData.name,
                    description: boeData.description,
                    status: 'Draft',
                    elements: flatElements,
                  };

                  newBOE = await boeVersionsApi.createBOE(wizardProgramId, boeCreationData);
                }
                
                // Update the current BOE in the store
                setCurrentBOE(newBOE);
                
                // Close the wizard
                closeWizard();
                
                // Show success toast
                setToast({
                  message: currentBOE && boeData.creationMethod 
                    ? 'New BOE version created successfully!' 
                    : 'BOE created successfully!',
                  type: 'success'
                });

                // Navigate to Details tab to continue structure/allocation work
                setActiveTab('details');
                
              } catch (error) {
                console.error('Error creating BOE:', error);
                // Show error toast
                setToast({
                  message: 'Error creating BOE. Please try again.',
                  type: 'error'
                });
              } finally {
                setIsCreating(false);
              }
            }}
            onCancel={() => {
              closeWizard();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BOEWizardModal; 