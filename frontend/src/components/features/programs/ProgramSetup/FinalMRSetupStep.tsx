import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBOEStore, ManagementReserve } from '../../../../store/boeStore';
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

  // Type assertion for managementReserve - ensure proper typing
  const mr: ManagementReserve | null = managementReserve ? (managementReserve as ManagementReserve) : null;

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
  if (setupStatus?.finalMRSet || mr) {
    const initialMRAmount = initialMR ? Number(initialMR.baselineAmount || initialMR.adjustedAmount || 0) : 0;
    const currentMRAmount = mr ? Number(mr.baselineAmount || mr.adjustedAmount || 0) : 0;

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
              {mr && (
                <div className="bg-white rounded-lg p-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Final MR Amount</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(currentMRAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Calculation Method</p>
                      <p className="text-lg font-semibold text-gray-900">{mr.calculationMethod}</p>
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
          <div className="text-sm text-blue-800 space-y-3">
            <div>
              <p className="font-semibold text-base mb-2">What is Final Management Reserve?</p>
              <p>
                Final Management Reserve (MR) is the approved MR amount that will be baselined with your BOE. 
                This is your opportunity to refine your Initial MR based on Risk & Opportunity analysis or 
                your own assessment.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">Calculation Options:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>R&O-Driven:</strong> Automatically calculates MR based on actual risk data with severity-weighted expected values (available if you completed R&O analysis)</li>
                <li><strong>Standard/Risk-Based/Custom:</strong> Adjust your Initial MR using traditional calculation methods</li>
              </ul>
            </div>
            <div className="bg-blue-100 border border-blue-300 rounded p-3">
              <p className="font-medium mb-1">⚠️ Important:</p>
              <p>
                This Final MR will be locked once you baseline your BOE to the ledger. Ensure you're satisfied 
                with this amount before proceeding to approval and baseline.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Initial MR Comparison */}
      {initialMRAmount > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-300 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
            Initial MR vs Final MR Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1 font-medium">Initial MR</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(initialMRAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">Preliminary estimate</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-300 border-2">
              <p className="text-xs text-blue-600 mb-1 font-medium">Final MR</p>
              <p className="text-2xl font-bold text-blue-900">
                {mr !== null
                  ? formatCurrency(Number((mr as ManagementReserve).baselineAmount || (mr as ManagementReserve).adjustedAmount || 0))
                  : 'Not set'
                }
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {mr !== null ? `Using ${(mr as ManagementReserve).calculationMethod || 'Unknown'} method` : 'To be determined'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1 font-medium">Difference</p>
              {mr !== null ? (
                <>
                  {(() => {
                    const finalMR = mr as ManagementReserve;
                    const finalAmount = Number(finalMR.baselineAmount || finalMR.adjustedAmount || 0);
                    const diff = finalAmount - initialMRAmount;
                    const diffPercent = initialMRAmount > 0 ? (diff / initialMRAmount * 100) : 0;
                    return (
                      <>
                        <p className={`text-2xl font-bold ${
                          diff >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {diff >= 0 ? '+' : ''}
                          {formatCurrency(diff)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {diffPercent.toFixed(1)}% change
                        </p>
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-400">—</p>
                  <p className="text-xs text-gray-500 mt-1">Set Final MR to see</p>
                </>
              )}
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-xs text-yellow-800">
              <strong>💡 Tip:</strong> Compare your Final MR to Initial MR to see how R&O analysis or your adjustments 
              have affected the MR amount. If you completed R&O analysis, use the R&O-Driven method for a data-driven calculation.
            </p>
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
        {mr && (
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

