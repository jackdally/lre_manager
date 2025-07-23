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
import { boeApiService } from '../../../services/boeApi';


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
    activeTab,
    setActiveTab,
    setCurrentBOE,
    setBOELoading,
    setBOEError,
    openWizard,
  } = useBOEStore();
  


  const [isInitialized, setIsInitialized] = useState(false);
  const [showTemplateManagement, setShowTemplateManagement] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BOETemplate | null>(null);
  const [showDraftOverwriteModal, setShowDraftOverwriteModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showApprovalSidebar, setShowApprovalSidebar] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
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
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  showTemplateManagement
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
              
              {/* Secondary Action Buttons */}
              {currentBOE && (
                <>
                  <button
                    onClick={() => setShowApprovalSidebar(true)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Approval Status
                  </button>
                  
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
                console.log('Template selected:', template);
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
            onViewApprovalStatus={() => setShowApprovalModal(true)}
            onViewHistory={() => setShowHistoryModal(true)}
          />
        )}

        {/* Centralized BOE Wizard Modal */}
        <BOEWizardModal />

        {/* Approval Status Modal */}
        <Modal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          title="BOE Approval Status"
          size="lg"
        >
          <BOEApproval programId={programId!} />
        </Modal>

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

        {/* Visual Separator */}
        <div className="bg-gray-100 h-px mx-6 my-6"></div>
        
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
            <div className="flex-1 overflow-hidden">
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
      </div>
    </Layout>
  );
};

export default BOEPage; 