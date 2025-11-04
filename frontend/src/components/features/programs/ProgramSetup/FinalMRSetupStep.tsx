import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBOEStore } from '../../../../store/boeStore';
import { boeVersionsApi } from '../../../../services/boeApi';
import { programSetupApi } from '../../../../services/programSetupApi';
import { useManagementReserve } from '../../../../hooks/useManagementReserve';
import { formatCurrency } from '../../../../utils/currencyUtils';
import { CheckCircleIcon, InformationCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface FinalMRSetupStepProps {
  programId: string;
  onStepComplete: () => void;
}

const FinalMRSetupStep: React.FC<FinalMRSetupStepProps> = ({ programId, onStepComplete }) => {
  const navigate = useNavigate();
  const { currentBOE, setCurrentBOE } = useBOEStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialMR, setInitialMR] = useState<any>(null);
  const [setupStatus, setSetupStatus] = useState<any>(null);
  // Removed hasCheckedMR - we don't auto-complete Final MR

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

  // Note: We don't auto-complete Final MR - user must explicitly set it
  // This ensures they review and confirm the Final MR amount after R&O analysis
  // useEffect(() => {
  //   if (!hasCheckedMR && managementReserve && setupStatus && !setupStatus.finalMRSet) {
  //     checkMRStatus();
  //   }
  // }, [managementReserve, setupStatus, programId, hasCheckedMR]);

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
      
      // Load initial MR if it exists (we'll track this separately in Phase 2)
      // For now, use current MR as both initial and final
      if (managementReserve) {
        setInitialMR(managementReserve);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Removed checkMRStatus - Final MR must be explicitly set by user
  // This ensures they review and confirm the Final MR amount after R&O analysis

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
  if (setupStatus?.finalMRSet || managementReserve) {
    const initialMRAmount = initialMR ? Number(initialMR.baselineAmount || initialMR.adjustedAmount || 0) : 0;
    const currentMRAmount = managementReserve ? Number(managementReserve.baselineAmount || managementReserve.adjustedAmount || 0) : 0;

    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Final MR Set</h3>
              <p className="text-green-800 mb-4">
                Your Final Management Reserve has been set. You can now proceed to submit your BOE for approval.
              </p>
              {managementReserve && (
                <div className="bg-white rounded-lg p-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Final MR Amount</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(currentMRAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Calculation Method</p>
                      <p className="text-lg font-semibold text-gray-900">{managementReserve.calculationMethod}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const initialMRAmount = initialMR ? Number(initialMR.baselineAmount || initialMR.adjustedAmount || 0) : 0;

  return (
    <div className="space-y-6">
      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Finalize Management Reserve</p>
            <p>
              Set your final Management Reserve (MR) amount. You can use <strong>R&O-Driven calculation</strong> if you've entered 
              risks and opportunities, or use Standard, Risk-Based, or Custom methods to adjust from your Initial MR.
            </p>
            <p className="mt-2">
              <strong>R&O-Driven Calculation:</strong> Automatically calculates MR based on actual risk data with severity-weighted expected values.
              Available when you have active risks entered in the R&O register.
            </p>
            <p className="mt-2">
              <strong>Note:</strong> This final MR will be included when you baseline your BOE to the ledger.
            </p>
          </div>
        </div>
      </div>

      {/* Initial MR Comparison */}
      {initialMRAmount > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Initial MR Reference</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Initial MR</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(initialMRAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Status</p>
              <p className="text-sm text-gray-700">Compare with Initial MR when setting Final MR</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <button
          onClick={handleGoToBOE}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          Go to BOE to Finalize MR
          <ArrowRightIcon className="h-5 w-5 ml-2" />
        </button>
        {managementReserve && (
          <button
            onClick={async () => {
              try {
                setLoading(true);
                await programSetupApi.markFinalMRSet(programId);
                const updatedStatus = await programSetupApi.getSetupStatus(programId);
                setSetupStatus(updatedStatus);
                onStepComplete();
              } catch (err: any) {
                console.error('Error marking Final MR as set:', err);
                setError(err?.response?.data?.message || err?.message || 'Failed to mark Final MR as set');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            {loading ? 'Processing...' : 'Mark Final MR as Set'}
          </button>
        )}
      </div>
    </div>
  );
};

export default FinalMRSetupStep;

