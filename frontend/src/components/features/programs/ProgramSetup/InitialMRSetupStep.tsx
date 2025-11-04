import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBOEStore } from '../../../../store/boeStore';
import { boeVersionsApi } from '../../../../services/boeApi';
import { programSetupApi } from '../../../../services/programSetupApi';
import { useManagementReserve } from '../../../../hooks/useManagementReserve';
import { CheckCircleIcon, InformationCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface InitialMRSetupStepProps {
  programId: string;
  onStepComplete: () => void;
}

const InitialMRSetupStep: React.FC<InitialMRSetupStepProps> = ({ programId, onStepComplete }) => {
  const navigate = useNavigate();
  const { currentBOE, setCurrentBOE } = useBOEStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<any>(null);
  const [hasCheckedMR, setHasCheckedMR] = useState(false);

  const {
    managementReserve,
    loadManagementReserve,
  } = useManagementReserve(currentBOE?.id);

  useEffect(() => {
    loadData();
  }, [programId]);

  useEffect(() => {
    if (currentBOE?.id) {
      loadManagementReserve();
    }
  }, [currentBOE?.id, loadManagementReserve]);

  // Check if MR exists and mark step complete if needed
  useEffect(() => {
    if (!hasCheckedMR && managementReserve && setupStatus && !setupStatus.initialMRSet) {
      checkMRStatus();
    }
  }, [managementReserve, setupStatus, programId, hasCheckedMR]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load BOE and setup status
      const [boeData, status] = await Promise.all([
        boeVersionsApi.getCurrentBOE(programId),
        programSetupApi.getSetupStatus(programId)
      ]);

      if (boeData.currentBOE) {
        setCurrentBOE(boeData.currentBOE);
      } else {
        setError('BOE not found. Please create a BOE first.');
      }

      setSetupStatus(status);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const checkMRStatus = async () => {
    // If MR exists and initialMRSet is false, mark it as set
    if (managementReserve && setupStatus && !setupStatus.initialMRSet && !hasCheckedMR) {
      setHasCheckedMR(true);
      try {
        await programSetupApi.markInitialMRSet(programId);
        // Refresh status and mark step complete
        const updatedStatus = await programSetupApi.getSetupStatus(programId);
        setSetupStatus(updatedStatus);
        onStepComplete();
      } catch (err: any) {
        console.error('Error marking Initial MR as set:', err);
        setHasCheckedMR(false); // Reset on error so we can retry
      }
    }
  };

  const handleGoToBOE = () => {
    navigate(`/programs/${programId}/boe`);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error && !currentBOE) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentBOE) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">BOE not found. Please create a BOE first.</p>
      </div>
    );
  }

  // If MR already exists and step is marked complete, show success
  if (setupStatus?.initialMRSet || managementReserve) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Initial MR Set</h3>
              <p className="text-green-800">
                {managementReserve 
                  ? `Your Initial Management Reserve has been set (${managementReserve.calculationMethod} method). You can proceed to the next step.`
                  : 'Initial Management Reserve step is complete. You can proceed to the next step.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Set Initial Management Reserve</p>
            <p>
              Set your initial Management Reserve (MR) using Standard, Risk-Based, or Custom calculation methods. 
              This is your preliminary MR estimate that you can refine later based on Risk & Opportunity analysis.
            </p>
            <p className="mt-2">
              <strong>Note:</strong> You'll have the opportunity to adjust this MR in the Final MR step after analyzing risks and opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGoToBOE}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          Go to BOE to Set Initial MR
          <ArrowRightIcon className="h-5 w-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default InitialMRSetupStep;
