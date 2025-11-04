import React, { useState, useEffect } from 'react';
import { useBOEStore } from '../../../../store/boeStore';
import { boeVersionsApi } from '../../../../services/boeApi';
import { programSetupApi } from '../../../../services/programSetupApi';
import { useManagementReserve } from '../../../../hooks/useManagementReserve';
import ManagementReserveCalculator from '../../boe/ManagementReserve/ManagementReserveCalculator';
import BOECalculationService from '../../../../services/boeCalculationService';
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface InitialMRSetupStepProps {
  programId: string;
  onStepComplete: () => void;
}

const InitialMRSetupStep: React.FC<InitialMRSetupStepProps> = ({ programId, onStepComplete }) => {
  const { currentBOE, setCurrentBOE, elementAllocations } = useBOEStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [usingEstimatedCost, setUsingEstimatedCost] = useState(false);

  const {
    managementReserve,
    loadManagementReserve,
    updateManagementReserve,
  } = useManagementReserve(currentBOE?.id);

  useEffect(() => {
    loadBOEData();
  }, [programId]);

  useEffect(() => {
    if (currentBOE?.id) {
      loadManagementReserve();
    }
  }, [currentBOE?.id, loadManagementReserve]);

  useEffect(() => {
    if (currentBOE && elementAllocations) {
      calculateTotalCost();
    }
  }, [currentBOE, elementAllocations]);

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
      
      // Mark Initial MR as set
      await programSetupApi.markInitialMRSet(programId);
      
      // Refresh setup status and mark step complete
      onStepComplete();
    } catch (err: any) {
      console.error('Error saving Initial MR:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to save Initial MR');
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

  return (
    <div className="space-y-6">
      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Initial Management Reserve</p>
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

      {/* Management Reserve Calculator */}
      {currentBOE.id && (
        <ManagementReserveCalculator
          boeVersionId={currentBOE.id}
          totalCost={totalCost}
          currentMR={managementReserve || undefined}
          onMRChange={handleMRChange}
          isEditable={currentBOE.status === 'Draft' || currentBOE.status === 'Approved'}
          usingEstimatedCost={usingEstimatedCost}
        />
      )}
    </div>
  );
};

export default InitialMRSetupStep;

