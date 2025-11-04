import React, { useState, useEffect } from 'react';
import { useBOEStore } from '../../../../store/boeStore';
import { boeVersionsApi, boeApprovalsApi } from '../../../../services/boeApi';
import { programSetupApi } from '../../../../services/programSetupApi';
import BOEWizard from '../../boe/BOEWizard';
import BOEApprovalWorkflow from '../../boe/BOEApprovalWorkflow';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface BOESetupStepProps {
  programId: string;
  onStepComplete: () => void;
}

const BOESetupStep: React.FC<BOESetupStepProps> = ({ programId, onStepComplete }) => {
  const { currentBOE, setCurrentBOE, openWizard, closeWizard, showWizard } = useBOEStore();
  const [boeStatus, setBoeStatus] = useState<'none' | 'creating' | 'draft' | 'under-review' | 'approved' | 'error'>('none');
  const [error, setError] = useState<string | null>(null);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const [showWizardLocal, setShowWizardLocal] = useState(false);

  // Load current BOE on mount
  useEffect(() => {
    loadCurrentBOE();
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
  }, [boeStatus, currentBOE?.id, programId]);

  const loadCurrentBOE = async () => {
    try {
      const boeData = await boeVersionsApi.getCurrentBOE(programId);
      if (boeData.currentBOE) {
        setCurrentBOE(boeData.currentBOE);
        updateBoeStatus(boeData.currentBOE.status);
      } else {
        setBoeStatus('none');
      }
    } catch (err: any) {
      console.error('Error loading BOE:', err);
      setBoeStatus('none');
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

  const handleBOECreated = async (boe: any) => {
    try {
      setCurrentBOE(boe);
      setBoeStatus('draft');
      
      // Update setup status to mark BOE as created
      await programSetupApi.updateSetupStatus(programId, { boeCreated: true });
      
      // Check if approval is needed (based on BOE amount or other criteria)
      // For now, we'll automatically submit for approval if BOE is complete
      // In a real scenario, you might want to check if BOE meets approval criteria first
      await handleSubmitForApproval(boe.id);
    } catch (err: any) {
      console.error('Error handling BOE creation:', err);
      setError(err?.message || 'Failed to process BOE creation');
      setBoeStatus('error');
    }
  };

  const handleSubmitForApproval = async (boeVersionId?: string) => {
    try {
      setCheckingApproval(true);
      setError(null);
      
      const boeId = boeVersionId || currentBOE?.id;
      if (!boeId) {
        throw new Error('BOE ID is required');
      }

      // Submit BOE for approval
      const updatedBOE = await boeVersionsApi.submitForApproval(programId);
      setCurrentBOE(updatedBOE);
      setBoeStatus('under-review');
      
      // Setup status will be updated when BOE is approved
    } catch (err: any) {
      console.error('Error submitting for approval:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to submit for approval';
      setError(errorMessage);
      
      // If submission fails, BOE is still created, just not submitted for approval yet
      // User can manually submit later
      setBoeStatus('draft');
    } finally {
      setCheckingApproval(false);
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

  // Show draft status
  if (boeStatus === 'draft') {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">BOE Created</h3>
              <p className="text-yellow-800 mb-4">
                Your BOE has been created successfully. {error ? `Error: ${error}` : 'Submitting for approval...'}
              </p>
              {error && (
                <button
                  onClick={() => handleSubmitForApproval()}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                  disabled={checkingApproval}
                >
                  {checkingApproval ? 'Submitting...' : 'Submit for Approval'}
                </button>
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
              loadCurrentBOE();
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

