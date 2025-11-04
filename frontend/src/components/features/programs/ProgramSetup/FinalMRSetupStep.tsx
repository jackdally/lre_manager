import React, { useState, useEffect } from 'react';
import { useBOEStore } from '../../../../store/boeStore';
import { boeVersionsApi } from '../../../../services/boeApi';
import { programSetupApi } from '../../../../services/programSetupApi';
import { useManagementReserve } from '../../../../hooks/useManagementReserve';
import ManagementReserveCalculator from '../../boe/ManagementReserve/ManagementReserveCalculator';
import BOECalculationService from '../../../../services/boeCalculationService';
import { formatCurrency } from '../../../../utils/currencyUtils';
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface FinalMRSetupStepProps {
  programId: string;
  onStepComplete: () => void;
}

const FinalMRSetupStep: React.FC<FinalMRSetupStepProps> = ({ programId, onStepComplete }) => {
  const { currentBOE, setCurrentBOE, elementAllocations } = useBOEStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [usingEstimatedCost, setUsingEstimatedCost] = useState(false);
  const [initialMR, setInitialMR] = useState<any>(null);
  const [setupStatus, setSetupStatus] = useState<any>(null);

  const {
    managementReserve,
    loadManagementReserve,
    updateManagementReserve,
  } = useManagementReserve(currentBOE?.id);

  useEffect(() => {
    loadBOEData();
    loadSetupStatus();
  }, [programId]);

  useEffect(() => {
    if (currentBOE?.id) {
      loadManagementReserve();
      // Load initial MR (will be the same MR, but we'll track it separately in Phase 2)
      // For now, we'll use the current MR as both initial and final
      setInitialMR(managementReserve);
    }
  }, [currentBOE?.id, loadManagementReserve, managementReserve]);

  useEffect(() => {
    if (currentBOE && elementAllocations) {
      calculateTotalCost();
    }
  }, [currentBOE, elementAllocations]);

  const loadSetupStatus = async () => {
    try {
      const status = await programSetupApi.getSetupStatus(programId);
      setSetupStatus(status);
    } catch (err: any) {
      console.error('Error loading setup status:', err);
    }
  };

  const loadBOEData = async () => {
    try {
      setLoading(true);
      setError(null);

      const boeData = await boeVersionsApi.getCurrentBOE(programId);
      if (boeData.currentBOE) {
        setCurrentBOE(boeData.currentBOE);
      } else {
        setError('BOE not found. Please create a BOE first.');
      }
    } catch (err: any) {
      console.error('Error loading BOE:', err);
      setError(err?.message || 'Failed to load BOE data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = () => {
    if (!currentBOE || !currentBOE.elements) return;

    // Build hierarchical structure for calculations
    const hierarchicalElements = BOECalculationService.buildHierarchicalStructure(currentBOE.elements);
    
    // Calculate totals using BOECalculationService
    const calculationResult = BOECalculationService.calculateBOETotals(
      hierarchicalElements,
      0, // MR percentage not needed for this calculation
      elementAllocations || []
    );

    const totalAllocatedCost = calculationResult.totalAllocatedCost || 0;
    const totalEstimatedCost = calculationResult.totalEstimatedCost || 0;
    
    // Use allocated cost if available, otherwise use estimated
    const finalCost = totalAllocatedCost > 0 ? totalAllocatedCost : totalEstimatedCost;
    const usingEstimated = totalAllocatedCost === 0;

    setTotalCost(finalCost);
    setUsingEstimatedCost(usingEstimated);
  };

  const handleMRChange = async (mr: any) => {
    if (!currentBOE?.id) return;

    try {
      setError(null);
      await updateManagementReserve(mr);
      
      // Mark Final MR as set
      await programSetupApi.markFinalMRSet(programId);
      
      // Refresh setup status and mark step complete
      onStepComplete();
    } catch (err: any) {
      console.error('Error saving Final MR:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to save Final MR');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading BOE data...</p>
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

  const initialMRAmount = initialMR ? Number(initialMR.baselineAmount || initialMR.adjustedAmount || 0) : 0;
  const currentMRAmount = managementReserve ? Number(managementReserve.baselineAmount || managementReserve.adjustedAmount || 0) : 0;

  return (
    <div className="space-y-6">
      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Finalize Management Reserve</p>
            <p>
              Set your final Management Reserve (MR) amount. You can use R&O-Driven calculation if you've entered 
              risks and opportunities, or adjust from your Initial MR based on your analysis.
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
          <h3 className="text-sm font-medium text-gray-900 mb-4">Initial MR Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Initial MR</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(initialMRAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Current MR</p>
              <p className="text-lg font-semibold text-blue-600">
                {currentMRAmount > 0 ? formatCurrency(currentMRAmount) : 'Not Set'}
              </p>
            </div>
          </div>
          {currentMRAmount > 0 && initialMRAmount !== currentMRAmount && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Change:</span>{' '}
                <span className={currentMRAmount > initialMRAmount ? 'text-red-600' : 'text-green-600'}>
                  {currentMRAmount > initialMRAmount ? '+' : ''}
                  {formatCurrency(currentMRAmount - initialMRAmount)} (
                  {((currentMRAmount - initialMRAmount) / initialMRAmount * 100).toFixed(1)}%)
                </span>
              </p>
            </div>
          )}
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

      {/* Management Reserve Calculator */}
      {currentBOE.id && (
        <ManagementReserveCalculator
          boeVersionId={currentBOE.id}
          totalCost={totalCost}
          currentMR={managementReserve || undefined}
          onMRChange={handleMRChange}
          isEditable={currentBOE.status === 'Draft' || currentBOE.status === 'Approved'}
          usingEstimatedCost={usingEstimatedCost}
          showROIntegration={setupStatus?.roAnalysisComplete === true}
        />
      )}
    </div>
  );
};

export default FinalMRSetupStep;

