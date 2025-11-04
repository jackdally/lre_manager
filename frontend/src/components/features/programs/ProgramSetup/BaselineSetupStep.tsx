import React, { useState, useEffect } from 'react';
import { useBOEStore } from '../../../../store/boeStore';
import { boeVersionsApi } from '../../../../services/boeApi';
import { programSetupApi } from '../../../../services/programSetupApi';
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface BaselineSetupStepProps {
  programId: string;
  onStepComplete: () => void;
}

const BaselineSetupStep: React.FC<BaselineSetupStepProps> = ({ programId, onStepComplete }) => {
  const { currentBOE, setCurrentBOE } = useBOEStore();
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushResult, setPushResult] = useState<{ success: boolean; entriesCreated: number; message: string } | null>(null);
  const [setupStatus, setSetupStatus] = useState<any>(null);

  useEffect(() => {
    loadCurrentBOE();
    loadSetupStatus();
  }, [programId]);

  const loadSetupStatus = async () => {
    try {
      const status = await programSetupApi.getSetupStatus(programId);
      setSetupStatus(status);
    } catch (err: any) {
      console.error('Error loading setup status:', err);
    }
  };

  const loadCurrentBOE = async () => {
    try {
      setLoading(true);
      const boeData = await boeVersionsApi.getCurrentBOE(programId);
      if (boeData.currentBOE) {
        setCurrentBOE(boeData.currentBOE);
        
        // If BOE is already baselined, mark step as complete
        if (boeData.currentBOE.status === 'Baseline') {
          await handleBaselineComplete();
        }
      }
    } catch (err: any) {
      console.error('Error loading BOE:', err);
      setError('Failed to load BOE information');
    } finally {
      setLoading(false);
    }
  };

  const handleBaselineComplete = async () => {
    try {
      // Update setup status to mark BOE as baselined
      await programSetupApi.updateSetupStatus(programId, { boeBaselined: true });
      onStepComplete();
    } catch (err: any) {
      console.error('Error updating setup status after baseline:', err);
      setError('Failed to update setup status');
    }
  };

  const handlePushToLedger = async () => {
    if (!currentBOE) {
      setError('No BOE found to push to ledger');
      return;
    }

    if (!setupStatus?.finalMRSet) {
      setError('Final Management Reserve must be set before baselining. Please complete the Final MR step first.');
      return;
    }

    if (currentBOE.status !== 'Approved') {
      setError('BOE must be approved before it can be baselined');
      return;
    }

    try {
      setPushing(true);
      setError(null);
      setPushResult(null);

      const result = await boeVersionsApi.pushToLedger(programId, currentBOE.id);
      
      if (result.success) {
        setPushResult(result);
        
        // Update BOE status in store
        setCurrentBOE({
          ...currentBOE,
          status: 'Baseline'
        });

        // Mark baseline step as complete
        await handleBaselineComplete();
      } else {
        setError(result.message || 'Failed to push BOE to ledger');
      }
    } catch (err: any) {
      console.error('Error pushing BOE to ledger:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to push BOE to ledger';
      setError(errorMessage);
    } finally {
      setPushing(false);
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

  if (!currentBOE) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">No BOE Found</h3>
            <p className="text-red-800">
              You need to create and approve a BOE before you can baseline it to the ledger.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!setupStatus?.finalMRSet) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Final MR Not Set</h3>
              <p className="text-yellow-800 mb-4">
                You must finalize your Management Reserve before you can baseline the BOE to the ledger.
              </p>
              <p className="text-sm text-yellow-700">
                Please complete the "Finalize Management Reserve" step first.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentBOE.status !== 'Approved') {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">BOE Not Approved</h3>
              <p className="text-yellow-800 mb-4">
                Your BOE is currently in "{currentBOE.status}" status. It must be approved before you can baseline it to the ledger.
              </p>
              <p className="text-sm text-yellow-700">
                Please complete the approval process in the previous step.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pushResult && pushResult.success) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Successfully Baselined!</h3>
              <p className="text-green-800 mb-4">
                Your BOE has been successfully pushed to the ledger as baseline budget entries.
              </p>
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Entries Created:</span> {pushResult.entriesCreated}
                </p>
                {pushResult.message && (
                  <p className="text-sm text-gray-600 mt-2">{pushResult.message}</p>
                )}
              </div>
              <p className="text-sm text-green-700">
                You can now proceed to the next step.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 space-y-3">
            <div>
              <p className="font-semibold text-base mb-2">Baseline Your Budget to Ledger</p>
              <p>
                Baselining your BOE creates permanent budget entries in the ledger. This establishes your program's 
                official baseline budget that will be used for tracking actuals, variances, and reporting.
              </p>
            </div>
            <div className="bg-blue-100 border border-blue-300 rounded p-3">
              <p className="font-medium mb-1">⚠️ Important:</p>
              <p>
                Once baselined, the BOE and Management Reserve amounts are locked. This is a critical step that 
                cannot be undone. Ensure all amounts are correct before proceeding.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-Baseline Checklist */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
          Pre-Baseline Checklist
        </h3>
        <div className="space-y-3">
          <div className={`flex items-start ${setupStatus?.boeCreated ? 'text-green-700' : 'text-gray-400'}`}>
            <CheckCircleIcon className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${setupStatus?.boeCreated ? 'text-green-600' : 'text-gray-300'}`} />
            <div className="flex-1">
              <p className={`font-medium ${setupStatus?.boeCreated ? '' : 'line-through'}`}>
                BOE Created
              </p>
              <p className="text-sm text-gray-600">
                Basis of Estimate with WBS structure and element allocations
              </p>
            </div>
          </div>
          <div className={`flex items-start ${setupStatus?.initialMRSet ? 'text-green-700' : 'text-gray-400'}`}>
            <CheckCircleIcon className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${setupStatus?.initialMRSet ? 'text-green-600' : 'text-gray-300'}`} />
            <div className="flex-1">
              <p className={`font-medium ${setupStatus?.initialMRSet ? '' : 'line-through'}`}>
                Initial MR Set
              </p>
              <p className="text-sm text-gray-600">
                Preliminary Management Reserve estimate established
              </p>
            </div>
          </div>
          <div className={`flex items-start ${setupStatus?.boeApproved ? 'text-green-700' : 'text-yellow-700'}`}>
            <CheckCircleIcon className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${setupStatus?.boeApproved ? 'text-green-600' : 'text-yellow-500'}`} />
            <div className="flex-1">
              <p className={`font-medium ${setupStatus?.boeApproved ? '' : ''}`}>
                BOE Approved
              </p>
              <p className="text-sm text-gray-600">
                BOE must be in "Approved" status (currently: {currentBOE.status})
              </p>
            </div>
          </div>
          <div className={`flex items-start ${setupStatus?.finalMRSet ? 'text-green-700' : 'text-red-700'}`}>
            <CheckCircleIcon className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${setupStatus?.finalMRSet ? 'text-green-600' : 'text-red-500'}`} />
            <div className="flex-1">
              <p className={`font-medium ${setupStatus?.finalMRSet ? '' : ''}`}>
                Final MR Set
              </p>
              <p className="text-sm text-gray-600">
                Final Management Reserve amount finalized (required before baseline)
              </p>
            </div>
          </div>
        </div>
        {setupStatus?.boeApproved && setupStatus?.finalMRSet && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800 font-medium">
              ✅ All prerequisites met. You're ready to baseline your BOE to the ledger.
            </p>
          </div>
        )}
      </div>

      {/* BOE Summary */}
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
            <p className="text-sm text-gray-600">Total Estimated Cost</p>
            <p className="text-lg font-medium text-gray-900">
              ${currentBOE.totalEstimatedCost?.toLocaleString() || '0'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              {currentBOE.status}
            </span>
          </div>
        </div>
      </div>

      {/* What Happens When You Baseline */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">What Happens When You Baseline:</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li>Creates ledger entries for all BOE element allocations with planned amounts and dates</li>
          <li>Establishes Management Reserve as available for utilization (tracked on R&O page)</li>
          <li>Updates BOE status to "Baseline" (locked from further changes)</li>
          <li>Enables actuals tracking and variance reporting against the baseline</li>
        </ul>
      </div>

      {/* Warning Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">⚠️ Final Warning:</p>
            <p>
              This action <strong>cannot be undone</strong>. Once baselined, the BOE and MR amounts are permanently 
              locked. Double-check all amounts before proceeding.
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handlePushToLedger}
          disabled={pushing || currentBOE.status !== 'Approved' || !setupStatus?.finalMRSet}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {pushing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Pushing to Ledger...
            </>
          ) : (
            <>
              Push to Ledger
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BaselineSetupStep;

