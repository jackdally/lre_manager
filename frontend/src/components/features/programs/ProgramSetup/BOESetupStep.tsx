import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBOEStore } from '../../../../store/boeStore';
import { boeVersionsApi } from '../../../../services/boeApi';
import { elementAllocationApi } from '../../../../services/boeApi';
import { programSetupApi } from '../../../../services/programSetupApi';
import BOEWizard from '../../boe/BOEWizard';
import BOEApprovalWorkflow from '../../boe/BOEApprovalWorkflow';
import { useManagementReserve } from '../../../../hooks/useManagementReserve';
import BOECalculationService from '../../../../services/boeCalculationService';
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface BOESetupStepProps {
  programId: string;
  onStepComplete: () => void;
}

const BOESetupStep: React.FC<BOESetupStepProps> = ({ programId, onStepComplete }) => {
  const navigate = useNavigate();
  const { 
    currentBOE, 
    setCurrentBOE, 
    elements,
    setElements,
    elementAllocations,
    setElementAllocations,
    openWizard, 
    closeWizard, 
    showWizard 
  } = useBOEStore();
  
  const [boeStatus, setBoeStatus] = useState<'none' | 'creating' | 'draft' | 'under-review' | 'approved' | 'error'>('none');
  const [error, setError] = useState<string | null>(null);
  const [showWizardLocal, setShowWizardLocal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load Management Reserve
  const { managementReserve: mrData } = useManagementReserve(currentBOE?.id);

  // Load current BOE and related data on mount
  useEffect(() => {
    loadBOEData();
  }, [programId]);

  // Check BOE status and update setup status accordingly
  useEffect(() => {
    if (currentBOE) {
      updateBoeStatus(currentBOE.status);
      
      // If BOE is approved, update setup status and mark step complete
      if (currentBOE.status === 'Approved' && boeStatus !== 'approved') {
        handleBOEApproved();
      }
    } else {
      setBoeStatus('none');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBOE]);

  // Poll for approval status if BOE is under review
  useEffect(() => {
    if (boeStatus === 'under-review' && currentBOE?.id) {
      const interval = setInterval(async () => {
        try {
          const boeData = await boeVersionsApi.getCurrentBOE(programId);
          if (boeData.currentBOE) {
            setCurrentBOE(boeData.currentBOE);
            if (boeData.currentBOE.status === 'Approved') {
              clearInterval(interval);
            }
          }
        } catch (err) {
          console.error('Error polling BOE status:', err);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [boeStatus, currentBOE?.id, programId, setCurrentBOE]);

  const loadBOEData = async () => {
    try {
      setLoading(true);
      setError(null);

      const boeData = await boeVersionsApi.getCurrentBOE(programId);
      if (boeData.currentBOE) {
        const currentBOE = boeData.currentBOE;
        setCurrentBOE(currentBOE);
        
        // Extract elements from currentBOE (they're included in relations)
        // The API returns elements nested in currentBOE.elements, not at boeData.elements level
        const elementsFromBOE = currentBOE.elements || [];
        setElements(elementsFromBOE);
        updateBoeStatus(currentBOE.status);
        
        // Load allocations
        if (currentBOE.id) {
          try {
            const allocations = await elementAllocationApi.getElementAllocations(currentBOE.id);
            setElementAllocations(allocations);
          } catch (err) {
            console.error('Error loading allocations:', err);
            setElementAllocations([]);
          }
        }
      } else {
        setBoeStatus('none');
        setElements([]);
        setElementAllocations([]);
      }
    } catch (err: any) {
      console.error('Error loading BOE:', err);
      setBoeStatus('none');
      setError(err?.message || 'Failed to load BOE data');
    } finally {
      setLoading(false);
    }
  };

  const updateBoeStatus = (status: string) => {
    switch (status) {
      case 'Draft':
        setBoeStatus('draft');
        break;
      case 'Under Review':
        setBoeStatus('under-review');
        break;
      case 'Approved':
        setBoeStatus('approved');
        break;
      default:
        setBoeStatus('none');
    }
  };

  // Check if BOE is ready for approval (same logic as BOEProgressTracker)
  const boeReadiness = useMemo(() => {
    if (!currentBOE) {
      return {
        isReady: false,
        incompleteSteps: ['Create BOE'],
        missingItems: []
      };
    }

    // Check if elements are loaded
    if (!elements || elements.length === 0) {
      return {
        isReady: false,
        incompleteSteps: ['Define WBS Structure'],
        missingItems: ['No WBS elements found. Please add elements to your BOE.']
      };
    }

    const hierarchical = BOECalculationService.buildHierarchicalStructure(elements);
    const validation = hierarchical.length > 0
      ? BOECalculationService.validateBOEStructure(hierarchical)
      : { isValid: false, errors: [] as string[] };

    // Determine WBS status (matching BOEProgressTracker logic)
    // WBS is complete if elements exist and validation is valid
    // WBS is in-progress if elements exist but validation fails
    // WBS is not-started if no elements
    const wbsIsComplete = elements.length > 0 && validation.isValid;

    // If WBS is not complete, show that as incomplete
    if (!wbsIsComplete) {
      return {
        isReady: false,
        incompleteSteps: ['Define WBS Structure'],
        missingItems: validation.errors.length > 0 
          ? validation.errors 
          : ['WBS structure needs to be completed and validated']
      };
    }

    // WBS is complete, now check allocations and MR
    // Check required leaf elements
    const requiredLeaves: any[] = [];
    const walk = (els: any[]) => {
      els.forEach(el => {
        const hasChildren = !!(el.childElements && el.childElements.length > 0);
        if (!hasChildren) {
          if (el.isRequired) requiredLeaves.push(el);
        } else if (el.childElements) {
          walk(el.childElements);
        }
      });
    };
    walk(hierarchical);

    // Check allocations (matching BOEProgressTracker logic)
    const allocatedRequiredLeaves = requiredLeaves.filter(leaf =>
      (elementAllocations || []).some(a => a.boeElementId === leaf.id && (a.totalAmount || 0) > 0)
    ).length;

    const missingAllocations: string[] = [];
    requiredLeaves.forEach(leaf => {
      const total = (elementAllocations || [])
        .filter(a => a.boeElementId === leaf.id)
        .reduce((s, a) => s + (a.totalAmount || 0), 0);
      if (total <= 0) {
        missingAllocations.push(`${leaf.code} - ${leaf.name}`);
      }
    });

    // Check Management Reserve (matching BOEProgressTracker logic)
    const mrJustification = (mrData?.justification || '').trim();
    const hasMRRecord = !!mrData;
    const hasMRJustification = mrJustification.length > 0;
    const mrAddressed = hasMRRecord && hasMRJustification;

    const incompleteSteps: string[] = [];
    const missingItems: string[] = [];

    // Only show allocations as incomplete if there are required leaves that need allocations
    if (requiredLeaves.length > 0 && allocatedRequiredLeaves < requiredLeaves.length) {
      incompleteSteps.push('Create Allocations');
      if (missingAllocations.length > 0) {
        // Show up to 5 missing allocations, then summarize
        const displayCount = Math.min(missingAllocations.length, 5);
        missingItems.push(...missingAllocations.slice(0, displayCount).map(item => `Allocation needed: ${item}`));
        if (missingAllocations.length > 5) {
          missingItems.push(`... and ${missingAllocations.length - 5} more`);
        }
      }
    }

    if (!mrAddressed) {
      incompleteSteps.push('Set Management Reserve');
      if (!hasMRRecord) {
        missingItems.push('Management Reserve record not created');
      } else if (!hasMRJustification) {
        missingItems.push('Management Reserve justification is required');
      }
    }

    const isReady = incompleteSteps.length === 0 && allocatedRequiredLeaves === requiredLeaves.length && mrAddressed;

    return {
      isReady,
      incompleteSteps,
      missingItems
    };
  }, [currentBOE, elements, elementAllocations, mrData]);

  const handleBOECreated = async (boe: any) => {
    try {
      setCurrentBOE(boe);
      setBoeStatus('draft');
      
      // Update setup status to mark BOE as created
      await programSetupApi.updateSetupStatus(programId, { boeCreated: true });
      
      // Reload BOE data to get elements
      await loadBOEData();
    } catch (err: any) {
      console.error('Error handling BOE creation:', err);
      setError(err?.message || 'Failed to process BOE creation');
      setBoeStatus('error');
    }
  };

  const handleBOEApproved = async () => {
    try {
      // Update setup status to mark BOE as approved
      await programSetupApi.updateSetupStatus(programId, { boeApproved: true });
      
      // Mark step as complete
      onStepComplete();
    } catch (err: any) {
      console.error('Error updating setup status after approval:', err);
      setError('Failed to update setup status');
    }
  };

  const handleWizardComplete = async (boeData: any) => {
    try {
      setBoeStatus('creating');
      setError(null);

      // Create BOE using the wizard data
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

      const newBOE = await boeVersionsApi.createBOE(programId, boeCreationData);
      await handleBOECreated(newBOE);
      
      closeWizard();
      setShowWizardLocal(false);
    } catch (err: any) {
      console.error('Error creating BOE:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to create BOE');
      setBoeStatus('error');
    }
  };

  // Show wizard if no BOE exists
  if (boeStatus === 'none') {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Create Your Basis of Estimate</h3>
          <p className="text-blue-800 mb-4">
            Start by creating your BOE to establish your program budget. This will be the foundation for all financial tracking.
          </p>
          <button
            onClick={() => {
              openWizard(programId);
              setShowWizardLocal(true);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create BOE
          </button>
        </div>

        {/* BOE Wizard Modal */}
        {(showWizard || showWizardLocal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Create New BOE</h2>
                <p className="text-gray-600 mt-1">Follow the steps below to create a new Basis of Estimate</p>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <BOEWizard
                  programId={programId}
                  onComplete={handleWizardComplete}
                  onCancel={() => {
                    closeWizard();
                    setShowWizardLocal(false);
                  }}
                  sourceBOE={undefined}
                  currentBOE={undefined}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading BOE data...</p>
      </div>
    );
  }

  // Show draft status with completion check
  if (boeStatus === 'draft') {
    const { isReady, incompleteSteps, missingItems } = boeReadiness;

    return (
      <div className="space-y-6">
        <div className={`border rounded-lg p-6 ${isReady ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-start">
            {isReady ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 mt-0.5" />
            ) : (
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">BOE Created</h3>
              {isReady ? (
                <div>
                  <p className="text-green-800 mb-4">
                    Your BOE is complete and ready to submit for approval! All required steps have been completed.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/programs/${programId}/boe`)}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      Go to BOE to Submit
                      <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-yellow-800 mb-4">
                    Your BOE has been created, but you need to complete additional steps before it can be submitted for approval.
                  </p>
                  
                  {incompleteSteps.length > 0 && (
                    <div className="mb-4">
                      <p className="font-medium text-yellow-900 mb-2">Still need to complete:</p>
                      <ul className="list-disc list-inside space-y-1 text-yellow-800">
                        {incompleteSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {missingItems.length > 0 && missingItems.length <= 5 && (
                    <div className="mb-4 text-sm">
                      <p className="font-medium text-yellow-900 mb-2">Details:</p>
                      <ul className="list-disc list-inside space-y-1 text-yellow-700">
                        {missingItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/programs/${programId}/boe`)}
                      className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                    >
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      Complete BOE Setup
                      <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show approval workflow if under review
  if (boeStatus === 'under-review') {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">BOE Under Review</h3>
          <p className="text-blue-800 mb-4">
            Your BOE has been submitted for approval. Please wait for approval before proceeding.
          </p>
          <button
            onClick={() => navigate(`/programs/${programId}/boe`)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            View BOE Approval Status
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </button>
        </div>
        <BOEApprovalWorkflow programId={programId} />
      </div>
    );
  }

  // Show approved status
  if (boeStatus === 'approved') {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">BOE Approved</h3>
              <p className="text-green-800">
                Your BOE has been approved! You can now proceed to the next step.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (boeStatus === 'error') {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-red-800 mb-4">{error || 'An error occurred while processing your BOE'}</p>
          <button
            onClick={() => {
              setError(null);
              setBoeStatus('none');
              loadBOEData();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Creating state
  return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Processing BOE...</p>
    </div>
  );
};

export default BOESetupStep;
