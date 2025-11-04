import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBOEStore } from '../../../store/boeStore';
import Layout from '../../layout';
import BOEOverview from './BOEOverview';
import BOEDetails from './BOEDetails';
import BOEApproval from './BOEApproval';
import BOEHistory from './BOEHistory';
import ManagementReserveTab from './ManagementReserveTab';
import BOEStatusBanner from './BOEStatusBanner';
import BOETemplateSelector from './BOETemplateSelector';
import BOEWizardModal from './BOEWizardModal';
import { BOETemplate } from '../../../store/boeStore';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import EnhancedErrorMessage from '../../common/EnhancedErrorMessage';
import { boeApiService } from '../../../services/boeApi';
import { boeVersionsApi } from '../../../services/boeApi';
import BOECalculationService from '../../../services/boeCalculationService';
import { useManagementReserve } from '../../../hooks/useManagementReserve';
import BOEProgressTracker from './BOEProgressTracker';


interface BOEPageProps {
  programId?: string;
}

const BOEPage: React.FC<BOEPageProps> = ({ programId: propProgramId }) => {
  const { id: urlProgramId } = useParams<{ id: string }>();
  const programId = propProgramId || urlProgramId;



  const {
    currentBOE,
    boeLoading,
    boeError,
    elements,
    elementAllocations,
    activeTab,
    setActiveTab,
    setCurrentBOE,
    setBOELoading,
    setBOEError,
    openWizard,
    toast,
    clearToast,
    setToast,
  } = useBOEStore();



  const [isInitialized, setIsInitialized] = useState(false);
  const [showTemplateManagement, setShowTemplateManagement] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BOETemplate | null>(null);
  const [showDraftOverwriteModal, setShowDraftOverwriteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showApprovalSidebar, setShowApprovalSidebar] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [pushToLedgerModalOpen, setPushToLedgerModalOpen] = useState(false);
  const [pushingToLedger, setPushingToLedger] = useState(false);
  const [ledgerPushResult, setLedgerPushResult] = useState<any>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const { managementReserve: mrData } = useManagementReserve(currentBOE?.id);

  const [showNewVersionConfirmation, setShowNewVersionConfirmation] = useState(false);
  const [approvalSidebarWidth, setApprovalSidebarWidth] = useState(() => {
    // Calculate responsive default width based on screen size
    const screenWidth = window.innerWidth;
    if (screenWidth >= 1920) return 500; // Large screens
    if (screenWidth >= 1440) return 450; // Medium-large screens
    if (screenWidth >= 1024) return 400; // Medium screens
    return 350; // Small screens
  });
  const [historySidebarWidth, setHistorySidebarWidth] = useState(() => {
    // Calculate responsive default width based on screen size
    const screenWidth = window.innerWidth;
    if (screenWidth >= 1920) return 500; // Large screens
    if (screenWidth >= 1440) return 450; // Medium-large screens
    if (screenWidth >= 1024) return 400; // Medium screens
    return 350; // Small screens
  });
  const approvalSidebarRef = useRef<HTMLDivElement>(null);
  const historySidebarRef = useRef<HTMLDivElement>(null);



  // Auto-clear toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  // Load BOE data when component mounts
  useEffect(() => {
    if (!programId) {
      setBOEError('Program ID is required');
      return;
    }

    const loadBOE = async () => {
      try {
        setBOELoading(true);
        setBOEError(null);

        // Load current BOE from API
        const boeData = await boeApiService.versions.getCurrentBOE(programId);
        // The API returns { program, currentBOE, hasBOE, lastBOEUpdate }
        // not the BOESummary structure we expected
        setCurrentBOE(boeData.currentBOE || null);


        setBOELoading(false);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading BOE:', error);
        setBOEError(error instanceof Error ? error.message : 'Failed to load BOE');
        setBOELoading(false);
      }
    };

    loadBOE();
  }, [programId, setCurrentBOE, setBOELoading, setBOEError]);

  // Reload BOE data when currentBOE changes (e.g., after rollback)
  useEffect(() => {
    if (currentBOE && programId && isInitialized) {
      const loadBOEDetails = async () => {
        try {
          setBOELoading(true);
          setBOEError(null);

          // Load complete BOE data with elements and allocations
          const boeData = await boeApiService.versions.getCurrentBOE(programId);
          setCurrentBOE(boeData.currentBOE || null);

          setBOELoading(false);
        } catch (error) {
          console.error('Error reloading BOE details:', error);
          setBOEError(error instanceof Error ? error.message : 'Failed to reload BOE details');
          setBOELoading(false);
        }
      };

      loadBOEDetails();
    }
  }, [currentBOE?.id, programId, isInitialized, setCurrentBOE, setBOELoading, setBOEError]);

  const handleCreateBOEFromTemplate = () => {
    // Check if there's already a draft BOE
    if (currentBOE && currentBOE.status === 'Draft') {
      setShowDraftOverwriteModal(true);
    } else {
      openWizard(programId!);
      setShowTemplateManagement(false);
    }
  };

  const handleConfirmOverwrite = async () => {
    setShowDraftOverwriteModal(false);

    // Delete the existing draft BOE before opening the wizard
    if (currentBOE && currentBOE.status === 'Draft') {
      try {
        // Call the delete BOE API
        const response = await fetch(`${process.env.REACT_APP_API_URL}/programs/${programId}/boe/${currentBOE.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete existing draft BOE');
        }

        // Clear the current BOE from state
        setCurrentBOE(null);
      } catch (error) {
        console.error('Error deleting existing draft BOE:', error);
        // Show error but still allow wizard to proceed
      }
    }

    openWizard(programId!);
    setShowTemplateManagement(false);
  };

  const handleSubmitForApproval = async () => {
    if (!currentBOE || !programId) return;

    try {
      setApprovalError(null);
      // Client-side validation aligned with the progress tracker
      const preSubmitErrors: string[] = [];

      // 1) WBS validation
      const hierarchical = elements && elements.length > 0
        ? BOECalculationService.buildHierarchicalStructure(elements)
        : [];
      if (hierarchical.length === 0) {
        preSubmitErrors.push('No WBS elements defined.');
      } else {
        const validation = BOECalculationService.validateBOEStructure(hierarchical);
        if (!validation.isValid && validation.errors.length > 0) {
          preSubmitErrors.push('WBS validation issues:');
          validation.errors.forEach(e => preSubmitErrors.push(`- ${e}`));
        }
      }

      // Helper: required leaf elements list
      const requiredLeaves: any[] = [];
      const walk = (els: any[]) => {
        els.forEach(el => {
          const hasChildren = el.childElements && el.childElements.length > 0;
          if (!hasChildren) {
            if (el.isRequired) requiredLeaves.push(el);
          } else {
            walk(el.childElements);
          }
        });
      };
      if (hierarchical.length > 0) walk(hierarchical);

      // 2) Required allocations for required leaves
      const missingAllocations: string[] = [];
      requiredLeaves.forEach(leaf => {
        const total = elementAllocations
          .filter(a => a.boeElementId === leaf.id)
          .reduce((s, a) => s + (a.totalAmount || 0), 0);
        if (total <= 0) missingAllocations.push(`${leaf.code} - ${leaf.name}`);
      });
      if (missingAllocations.length > 0) {
        preSubmitErrors.push('Missing allocations for required elements:');
        missingAllocations.forEach(line => preSubmitErrors.push(`- ${line}`));
      }

      // 3) MR required to submit (addressed means MR record exists and has justification)
      const mrJustification = (mrData?.justification || '').trim();
      const hasMRRecord = !!mrData;
      if (!hasMRRecord || mrJustification.length === 0) {
        preSubmitErrors.push('Management Reserve is not addressed. Please calculate (0% allowed) and provide justification.');
      }

      if (preSubmitErrors.length > 0) {
        setApprovalError(preSubmitErrors.join('\n'));
        return; // do not submit
      }

      // Use the proper API service
      const result = await boeVersionsApi.submitForApproval(programId);

      // Update BOE status to "Under Review"
      if (result) {
        setCurrentBOE({
          ...currentBOE,
          status: 'Under Review'
        });
      }
    } catch (error: any) {
      console.error('Error submitting for approval:', error);
      // Extract the validation error message
      const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
      setApprovalError(errorMessage);
    }
  };

  const handleRevertToDraft = async () => {
    if (!currentBOE || !programId) return;

    try {
      // Use the proper API service
      const result = await boeVersionsApi.revertToDraft(programId, currentBOE.id);

      // Update BOE status to "Draft"
      if (result) {
        setCurrentBOE({
          ...currentBOE,
          status: 'Draft'
        });
      }
    } catch (error: any) {
      console.error('Error reverting to draft:', error);
      // Handle error - could show a toast or modal
      alert('Failed to revert to draft: ' + (error?.response?.data?.message || error?.message || 'Unknown error'));
    }
  };

  const handlePushToLedger = async () => {
    if (!currentBOE || !programId) return;

    try {
      setPushingToLedger(true);

      // Use the proper API service
      const result = await boeVersionsApi.pushToLedger(programId, currentBOE.id);
      setLedgerPushResult(result);

      // Update BOE status to "Baseline"
      if (result.success) {
        setCurrentBOE({
          ...currentBOE,
          status: 'Baseline'
        });
      }
    } catch (error: any) {
      console.error('Error pushing to ledger:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to push to ledger';
      alert(errorMessage);
    } finally {
      setPushingToLedger(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!currentBOE || !programId) return;
    if (currentBOE.status !== 'Draft') return;

    const confirmed = window.confirm('Delete current Draft BOE? This cannot be undone.');
    if (!confirmed) return;

    try {
      await boeVersionsApi.deleteBOE(programId, currentBOE.id);

      // Reload current BOE (should return latest active or null)
      const boeData = await boeApiService.versions.getCurrentBOE(programId);
      setCurrentBOE(boeData.currentBOE || null);

      setToast({ message: 'Draft BOE deleted.', type: 'success' });
    } catch (error: any) {
      console.error('Error deleting draft BOE:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete draft BOE';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleCreateNewVersion = () => {
    // Show confirmation dialog first
    setShowNewVersionConfirmation(true);
  };

  const handleConfirmNewVersion = () => {
    setShowNewVersionConfirmation(false);

    // Check if there's already a draft BOE
    if (currentBOE && currentBOE.status === 'Draft') {
      setShowDraftOverwriteModal(true);
    } else {
      // Open the wizard with version-from-current method
      openWizard(programId!);
    }
  };


  if (!programId) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>Program ID is required to view BOE.</p>
        </div>
      </div>
    );
  }

  if (boeLoading && !isInitialized) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading BOE...</span>
          </div>
        </div>
      </div>
    );
  }

  if (boeError) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <h4>Error Loading BOE</h4>
          <p>{boeError}</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Basis of Estimate (BOE)</h1>
              <p className="mt-2 text-gray-600">
                Manage and track project estimates, costs, and management reserve
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowTemplateManagement(!showTemplateManagement)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${showTemplateManagement
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {showTemplateManagement ? 'Hide Templates' : 'Manage Templates'}
                </span>
              </button>

              {/* Create New Version Button */}
              {currentBOE && (
                <button
                  onClick={handleCreateNewVersion}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Version
                </button>
              )}

              {/* Temporary: Delete Draft BOE button */}
              {currentBOE && currentBOE.status === 'Draft' && (
                <button
                  onClick={handleDeleteDraft}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a2 2 0 012-2h2a2 2 0 012 2m-6 0h6" />
                  </svg>
                  Delete Draft
                </button>
              )}

              {/* Secondary Action Buttons */}
              {currentBOE && (
                <>
                  <button
                    onClick={() => setShowHistorySidebar(true)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    History
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {boeError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{boeError}</div>
              </div>
            </div>
          </div>
        )}

        {/* Template Management */}
        {showTemplateManagement && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">BOE Template Management</h2>
              <p className="text-gray-600">
                Create, edit, and manage BOE templates that can be used to create new BOEs.
              </p>
            </div>
            <BOETemplateSelector
              onTemplateSelect={(template) => {

                setSelectedTemplate(template);
                // Don't launch wizard here - just select the template
              }}
              selectedTemplateId={selectedTemplate?.id}
              showCreateNew={true}
            />

            {/* Show action buttons when a template is selected */}
            {selectedTemplate && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Selected Template: {selectedTemplate.name}</h3>
                    <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleCreateBOEFromTemplate}
                      variant="primary"
                      size="sm"
                    >
                      Create BOE from Template
                    </Button>
                    <Button
                      onClick={() => setSelectedTemplate(null)}
                      variant="secondary"
                      size="sm"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BOE Status Banner */}
        {currentBOE && (
          <BOEStatusBanner
            programId={programId!}
            onViewApprovalStatus={() => setShowApprovalSidebar(true)}
            onViewHistory={() => setShowHistoryModal(true)}
            onPushToLedger={() => setPushToLedgerModalOpen(true)}
            onSubmitForApproval={handleSubmitForApproval}
            onRevertToDraft={handleRevertToDraft}
            onCreateNewVersion={handleCreateNewVersion}
          />
        )}

        {/* Enhanced Approval Error Display */}
        {approvalError && (
          <div className="mb-6">
            <EnhancedErrorMessage
              title="Approval Submission Failed"
              message={
                approvalError.startsWith('BOE validation failed:')
                  ? "Your BOE cannot be submitted for approval until the following issues are resolved:"
                  : approvalError
              }
              type="error"
              details={
                approvalError.startsWith('BOE validation failed:')
                  ? (() => {
                      const errorText = approvalError.replace('BOE validation failed: ', '');
                      const errors = errorText.split(', ');
                      const details: string[] = [];
                      
                      // Group errors by category
                      const categories: { [key: string]: string[] } = {};
                      let currentCategory = '';
                      
                      errors.forEach(error => {
                        if (error.includes(': ')) {
                          const [category, items] = error.split(': ');
                          currentCategory = category;
                          categories[category] = items.split(', ').map(item => item.trim());
                        } else if (currentCategory && !error.includes(':')) {
                          categories[currentCategory].push(error.trim());
                        } else {
                          categories[error] = [];
                        }
                      });
                      
                      Object.entries(categories).forEach(([category, items]) => {
                        if (items.length > 0) {
                          details.push(`${category}: ${items.join(', ')}`);
                        } else {
                          details.push(category);
                        }
                      });
                      
                      return details;
                    })()
                  : [approvalError]
              }
              recoverySuggestions={(() => {
                const suggestions: string[] = [];
                if (approvalError.includes('Missing Allocations')) {
                  suggestions.push('Go to the Allocations tab and create allocations for all required elements');
                }
                if (approvalError.includes('Missing Vendors')) {
                  suggestions.push('Edit WBS elements and assign vendors to all leaf elements');
                }
                if (approvalError.includes('Management Reserve')) {
                  suggestions.push('Configure Management Reserve in the Management Reserve tab');
                }
                if (approvalError.includes('WBS element')) {
                  suggestions.push('Ensure all required WBS elements have cost estimates and cost categories assigned');
                }
                if (suggestions.length === 0) {
                  suggestions.push('Review the BOE Details tab and ensure all required fields are completed');
                  suggestions.push('Check the Allocations tab to ensure all elements have allocations configured');
                }
                return suggestions;
              })()}
              onDismiss={() => setApprovalError(null)}
              onAction={{
                label: 'View BOE Details',
                onClick: () => {
                  setActiveTab('details');
                  setApprovalError(null);
                },
              }}
            />
          </div>
        )}



        {/* Centralized BOE Wizard Modal */}
        <BOEWizardModal />



        {/* History Modal */}
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title="BOE Version History"
          size="lg"
        >
          <BOEHistory programId={programId!} />
        </Modal>

        {/* Draft Overwrite Confirmation Modal */}
        <Modal
          isOpen={showDraftOverwriteModal}
          onClose={() => setShowDraftOverwriteModal(false)}
          title="Overwrite Draft BOE"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Warning</h4>
              <p className="text-sm text-yellow-700">
                You already have a draft BOE for this program. Creating a new one will overwrite the existing draft.
                Are you sure you want to proceed?
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setShowDraftOverwriteModal(false)}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmOverwrite}
                variant="primary"
                size="sm"
              >
                Overwrite Draft
              </Button>
            </div>
          </div>
        </Modal>

        {/* New Version Confirmation Modal */}
        <Modal
          isOpen={showNewVersionConfirmation}
          onClose={() => setShowNewVersionConfirmation(false)}
          title="Create New BOE Version"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important</h4>
              <p className="text-sm text-yellow-700">
                Creating a new BOE version will:
              </p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Create a new version based on the current baseline BOE</li>
                <li>• Require a new approval workflow</li>
                <li>• Add a new baseline to the project once approved</li>
                <li>• Maintain the current baseline BOE as historical data</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Current BOE Information</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Version: {currentBOE?.versionNumber}</li>
                <li>• Status: {currentBOE?.status}</li>
                <li>• Total Cost: ${currentBOE?.totalEstimatedCost?.toLocaleString() || 0}</li>
                <li>• Elements: {currentBOE?.elements?.length || 0}</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setShowNewVersionConfirmation(false)}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmNewVersion}
                variant="primary"
                size="sm"
              >
                Create New Version
              </Button>
            </div>
          </div>
        </Modal>

        {/* Push to Ledger Modal */}
        <Modal
          isOpen={pushToLedgerModalOpen}
          onClose={() => setPushToLedgerModalOpen(false)}
          title="Push BOE to Ledger"
        >
          <div className="space-y-4">
            {!ledgerPushResult ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">⚠️ Important</h4>
                  <p className="text-sm text-blue-700">
                    This action will create ledger entries for all BOE elements with estimated costs.
                    The BOE status will be updated to "Baseline" after successful push.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Summary</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• BOE elements to process: {currentBOE?.elements?.length || 0}</li>
                    <li>• Total estimated cost: ${currentBOE?.totalEstimatedCost?.toLocaleString() || 0}</li>
                    <li>• Ledger entries will be created as baseline budget</li>
                    <li>• BOE status will change to "Baseline"</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => setPushToLedgerModalOpen(false)}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePushToLedger}
                    variant="primary"
                    size="sm"
                    disabled={pushingToLedger}
                  >
                    {pushingToLedger ? 'Pushing...' : 'Push to Ledger'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                {ledgerPushResult.success ? (
                  <>
                    <div className="text-green-500 text-6xl mb-4">✓</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Success!</h4>
                    <p className="text-gray-600 mb-4">
                      Successfully pushed BOE to ledger. {ledgerPushResult.entriesCreated || 0} ledger entries were created.
                    </p>
                    <Button
                      onClick={() => setPushToLedgerModalOpen(false)}
                      variant="primary"
                      size="sm"
                    >
                      Close
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-red-500 text-6xl mb-4">✗</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Error</h4>
                    <p className="text-gray-600 mb-4">
                      {ledgerPushResult.message || 'Failed to push BOE to ledger'}
                    </p>
                    <div className="flex justify-center space-x-2">
                      <Button
                        onClick={() => setLedgerPushResult(null)}
                        variant="secondary"
                        size="sm"
                      >
                        Try Again
                      </Button>
                      <Button
                        onClick={() => setPushToLedgerModalOpen(false)}
                        variant="primary"
                        size="sm"
                      >
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </Modal>

        {/* Visual Separator */}
        <div className="bg-gray-100 h-px mx-6 my-6"></div>

        {/* Progress Tracker */}
        {currentBOE && (
          <BOEProgressTracker
            boeVersionId={currentBOE.id}
            currentBOE={currentBOE}
            elements={elements}
            elementAllocations={elementAllocations}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`
                py-3 px-2 border-b-2 font-semibold text-base flex items-center gap-2
                ${activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>📊</span>
              Overview
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`
                py-3 px-2 border-b-2 font-semibold text-base flex items-center gap-2
                ${activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>📋</span>
              Details
            </button>
            <button
              onClick={() => setActiveTab('management-reserve')}
              className={`
                py-3 px-2 border-b-2 font-semibold text-base flex items-center gap-2
                ${activeTab === 'management-reserve'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>💰</span>
              Management Reserve
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'overview' && <BOEOverview programId={programId} />}
          {activeTab === 'details' && <BOEDetails programId={programId} />}
          {activeTab === 'management-reserve' && <ManagementReserveTab programId={programId} />}
        </div>

        {/* Resizable Approval Sidebar */}
        <div
          className={`fixed inset-y-0 right-0 z-50 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${showApprovalSidebar ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ width: `${approvalSidebarWidth}px` }}
          ref={approvalSidebarRef}
        >
          {/* Drag Handle for Resizing */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors duration-200"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = approvalSidebarWidth;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = startX - moveEvent.clientX;
                const screenWidth = window.innerWidth;
                const minWidth = screenWidth >= 1024 ? 350 : 300;
                const maxWidth = screenWidth >= 1920 ? 700 : screenWidth >= 1440 ? 600 : 500;
                const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
                setApprovalSidebarWidth(newWidth);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
            title="Drag to resize sidebar"
          >
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-gray-400 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200" />
          </div>

          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-medium text-gray-900 truncate">Approval Status</h4>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  Review and manage BOE approval workflow
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-2">
                {/* Resize Indicator */}
                <div className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                  {approvalSidebarWidth}px
                </div>
                <button
                  onClick={() => setShowApprovalSidebar(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 p-1"
                  title="Close sidebar"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <BOEApproval programId={programId!} />
              </div>
            </div>
          </div>
        </div>

        {/* Resizable History Sidebar */}
        <div
          className={`fixed inset-y-0 right-0 z-50 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${showHistorySidebar ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ width: `${historySidebarWidth}px` }}
          ref={historySidebarRef}
        >
          {/* Drag Handle for Resizing */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors duration-200"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = historySidebarWidth;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = startX - moveEvent.clientX;
                const screenWidth = window.innerWidth;
                const minWidth = screenWidth >= 1024 ? 350 : 300;
                const maxWidth = screenWidth >= 1920 ? 700 : screenWidth >= 1440 ? 600 : 500;
                const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
                setHistorySidebarWidth(newWidth);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
            title="Drag to resize sidebar"
          >
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-gray-400 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200" />
          </div>

          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-medium text-gray-900 truncate">Version History</h4>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  View and compare BOE versions
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-2">
                {/* Resize Indicator */}
                <div className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                  {historySidebarWidth}px
                </div>
                <button
                  onClick={() => setShowHistorySidebar(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 p-1"
                  title="Close sidebar"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-hidden min-h-0">
              <BOEHistory programId={programId!} sidebarWidth={historySidebarWidth} />
            </div>
          </div>
        </div>

        {/* Backdrop for sidebars */}
        {(showApprovalSidebar || showHistorySidebar) && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-25 transition-opacity duration-300"
            onClick={() => {
              setShowApprovalSidebar(false);
              setShowHistorySidebar(false);
            }}
          />
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
                'bg-blue-500 text-white'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {toast.type === 'success' && (
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={clearToast}
                className="ml-4 text-white hover:text-gray-200 focus:outline-none"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BOEPage; 