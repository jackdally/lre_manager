import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBOEStore } from '../../../../store/boeStore';
import { boeVersionsApi } from '../../../../services/boeApi';
import { programSetupApi } from '../../../../services/programSetupApi';
import BOEApprovalWorkflow from '../../boe/BOEApprovalWorkflow';
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface BOEApprovalSetupStepProps {
  programId: string;
  onStepComplete: () => void;
}

const BOEApprovalSetupStep: React.FC<BOEApprovalSetupStepProps> = ({ programId, onStepComplete }) => {
  const navigate = useNavigate();
  const { currentBOE, setCurrentBOE } = useBOEStore();
  const [loading, setLoading] = useState(true);
  const [boeStatus, setBoeStatus] = useState<'draft' | 'under-review' | 'approved' | 'error'>('draft');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentBOE();
  }, [programId]);

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
              handleBOEApproved();
            }
          }
        } catch (err) {
          console.error('Error polling BOE status:', err);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [boeStatus, currentBOE?.id, programId, setCurrentBOE]);

  // Check BOE status when currentBOE changes
  useEffect(() => {
    if (currentBOE) {
      updateBoeStatus(currentBOE.status);
      
      // If BOE is approved, update setup status
      if (currentBOE.status === 'Approved') {
        handleBOEApproved();
      }
    }
  }, [currentBOE]);

  const loadCurrentBOE = async () => {
    try {
      setLoading(true);
      setError(null);

      const boeData = await boeVersionsApi.getCurrentBOE(programId);
      if (boeData.currentBOE) {
        setCurrentBOE(boeData.currentBOE);
        updateBoeStatus(boeData.currentBOE.status);
      } else {
        setError('BOE not found. Please create a BOE first.');
      }
    } catch (err: any) {
      console.error('Error loading BOE:', err);
      setError(err?.message || 'Failed to load BOE information');
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
        setBoeStatus('draft');
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading BOE information...</p>
      </div>
    );
  }

  if (error && !currentBOE) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentBOE) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">BOE Not Found</h3>
            <p className="text-red-800">
              Please create a BOE in the previous step before submitting for approval.
            </p>
          </div>
        </div>
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
                Your BOE has been approved! You can now proceed to baseline your budget to the ledger.
              </p>
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

  // Show draft status - need to submit for approval
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Submit BOE for Approval</h3>
        <p className="text-blue-800 mb-4">
          Your BOE is ready to be submitted for approval. Once approved, you can baseline it to the ledger.
        </p>
        <button
          onClick={() => navigate(`/programs/${programId}/boe`)}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Go to BOE to Submit
          <ArrowRightIcon className="h-5 w-5 ml-2" />
        </button>
      </div>

      {/* BOE Summary */}
      {currentBOE && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">BOE Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">BOE Name</p>
              <p className="text-lg font-medium text-gray-900">{currentBOE.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Version</p>
              <p className="text-lg font-medium text-gray-900">{currentBOE.versionNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                {currentBOE.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOEApprovalSetupStep;

