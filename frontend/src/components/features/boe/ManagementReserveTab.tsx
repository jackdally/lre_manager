import React, { useState, useEffect, useMemo } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { useManagementReserve } from '../../../hooks/useManagementReserve';
import { 
  ManagementReserveCalculator, 
  ManagementReserveDisplay, 
  ManagementReserveUtilization 
} from './ManagementReserve';
import { PencilIcon, EyeIcon, ChartBarIcon, CalculatorIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { elementAllocationApi } from '../../../services/boeApi';
import { BOECalculationService } from '../../../services/boeCalculationService';
import type { BOEElementAllocation } from '../../../store/boeStore';

interface ManagementReserveTabProps {
  programId: string;
}

type MRViewMode = 'calculator' | 'display' | 'utilization';

const ManagementReserveTab: React.FC<ManagementReserveTabProps> = ({ programId }) => {
  const { currentBOE, elements, elementAllocations, setElementAllocations } = useBOEStore();
  const [viewMode, setViewMode] = useState<MRViewMode>('display');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [allocationsLoading, setAllocationsLoading] = useState(false);

  const {
    managementReserve,
    mrLoading,
    mrError,
    mrUtilizationHistory,
    loadManagementReserve,
    updateManagementReserve,
    utilizeManagementReserve,
    loadMRUtilizationHistory,
  } = useManagementReserve(currentBOE?.id);

  // Check if BOE is baselined (MR utilization moved to R&O page)
  const isBaselined = currentBOE?.status === 'Baseline' || currentBOE?.status === 'PushedToProgram';

  // Load MR data when BOE changes
  useEffect(() => {
    if (currentBOE?.id) {
      loadManagementReserve();
      loadMRUtilizationHistory();
    }
  }, [currentBOE?.id, loadManagementReserve, loadMRUtilizationHistory]);

  // Load element allocations
  useEffect(() => {
    const loadAllocations = async () => {
      if (!currentBOE?.id) return;
      
      try {
        setAllocationsLoading(true);
        const allocations = await elementAllocationApi.getElementAllocations(currentBOE.id);
        setElementAllocations(allocations);
      } catch (error) {
        console.error('Error loading allocations:', error);
        setElementAllocations([]);
      } finally {
        setAllocationsLoading(false);
      }
    };

    loadAllocations();
  }, [currentBOE?.id, setElementAllocations]);

  const handleMRChange = async (mr: any) => {
    try {
      await updateManagementReserve(mr);
      // Auto-switch back to display mode after successful save
      setViewMode('display');
      // Show success message
      setShowSuccessMessage(true);
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error updating MR:', error);
    }
  };

  const handleUtilizeMR = async (amount: number, reason: string, description?: string) => {
    try {
      await utilizeManagementReserve(amount, reason, description);
      // Refresh utilization history
      loadMRUtilizationHistory();
    } catch (error) {
      console.error('Error utilizing MR:', error);
    }
  };

  // Calculate totals and check if all required allocations are complete
  const { totalCost, totalAllocatedCost, allRequiredAllocated, usingEstimatedCost } = useMemo(() => {
    // Use elements from store, or fall back to currentBOE.elements if store doesn't have them
    const boeElements = elements && elements.length > 0 ? elements : (currentBOE?.elements || []);
    
    if (!currentBOE || !boeElements || boeElements.length === 0) {
      return {
        totalCost: Number(currentBOE?.totalEstimatedCost) || 0,
        totalAllocatedCost: 0,
        allRequiredAllocated: false,
        usingEstimatedCost: true
      };
    }

    // Build hierarchical structure for calculations
    const hierarchicalElements = BOECalculationService.buildHierarchicalStructure(boeElements);
    
    // Calculate totals using BOECalculationService
    const calculationResult = BOECalculationService.calculateBOETotals(
      hierarchicalElements,
      0, // MR percentage not needed for this calculation
      elementAllocations || []
    );

    const totalEstimatedCost = calculationResult.totalEstimatedCost;
    const totalAllocatedCost = calculationResult.totalAllocatedCost;

    // Check if all required allocations are complete (same logic as BOEOverview)
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
    walk(hierarchicalElements);

    const allRequiredAllocated = requiredLeaves.length === 0 || requiredLeaves.every(leaf =>
      (elementAllocations || []).some(a => a.boeElementId === leaf.id && (a.totalAmount || 0) > 0)
    );

    // Use allocated cost if all required allocations are complete, otherwise use estimated
    const finalCost = allRequiredAllocated && totalAllocatedCost > 0 ? totalAllocatedCost : totalEstimatedCost;
    const usingEstimatedCost = !allRequiredAllocated || totalAllocatedCost === 0;

    return {
      totalCost: finalCost,
      totalAllocatedCost,
      allRequiredAllocated,
      usingEstimatedCost
    };
  }, [currentBOE, elements, elementAllocations, currentBOE?.elements]);

  if (!currentBOE) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <ChartBarIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No BOE Available</h3>
          <p className="text-gray-600">
            Please create a BOE first to access Management Reserve functionality.
          </p>
        </div>
      </div>
    );
  }

  if (mrLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Management Reserve...</p>
        </div>
      </div>
    );
  }

  if (mrError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">Error Loading Management Reserve</h3>
          <p className="text-sm text-red-700">{mrError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with View Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Management Reserve</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage and track management reserve for {currentBOE.name}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('display')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'display'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <EyeIcon className="h-4 w-4 inline mr-1" />
              {isBaselined ? 'MR Summary' : 'View'}
            </button>
            {!managementReserve && !isBaselined ? (
              <button
                onClick={() => setViewMode('calculator')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'calculator'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <PencilIcon className="h-4 w-4 inline mr-1" />
                Calculate
              </button>
            ) : (
              !isBaselined && (
                <button
                  onClick={() => setViewMode('calculator')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'calculator'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  <CalculatorIcon className="h-4 w-4 inline mr-1" />
                  Recalculate
                </button>
              )
            )}
            {/* Hide utilization view after baselining - MR utilization moved to R&O page */}
            {!isBaselined && (
              <button
                onClick={() => setViewMode('utilization')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'utilization'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ChartBarIcon className="h-4 w-4 inline mr-1" />
                Utilization
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Success!</h3>
              <p className="text-sm text-green-700">Management Reserve has been saved successfully.</p>
            </div>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      <div className="space-y-6">
        {viewMode === 'display' && (
          <div>
            {managementReserve ? (
              <ManagementReserveDisplay
                managementReserve={managementReserve}
                totalCost={totalCost}
                showUtilization={true}
                isEditable={currentBOE.status === 'Draft'}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <ChartBarIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Management Reserve</h3>
                <p className="text-gray-600 mb-4">
                  No management reserve has been calculated for this BOE yet.
                </p>
                <button
                  onClick={() => setViewMode('calculator')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Calculate Management Reserve
                </button>
              </div>
            )}
          </div>
        )}

        {viewMode === 'calculator' && (
          <div>
            <ManagementReserveCalculator
              boeVersionId={currentBOE.id}
              totalCost={totalCost}
              currentMR={managementReserve || undefined}
              onMRChange={handleMRChange}
              isEditable={currentBOE.status === 'Draft'}
              showROIntegration={false} // Placeholder for future R&O integration
              usingEstimatedCost={usingEstimatedCost}
            />
          </div>
        )}

        {/* Utilization view - hidden after baselining (moved to R&O page) */}
        {viewMode === 'utilization' && !isBaselined && (
          <div>
            {managementReserve ? (
              <ManagementReserveUtilization
                managementReserve={managementReserve}
                utilizationHistory={mrUtilizationHistory}
                onUtilizeMR={handleUtilizeMR}
                isEditable={currentBOE.status === 'Draft'}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <ChartBarIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Management Reserve</h3>
                <p className="text-gray-600">
                  Management reserve must be calculated before tracking utilization.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Show read-only MR Summary after baselining */}
        {isBaselined && managementReserve && (
          <div>
            <ManagementReserveDisplay
              managementReserve={managementReserve}
              totalCost={totalCost}
              showUtilization={false}
              isEditable={false}
            />
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">MR Utilization Moved to R&O Page</h4>
                  <p className="text-sm text-blue-800">
                    After baselining, MR utilization is managed from the Risks & Opportunities page. 
                    This allows you to link MR utilization directly to materialized risks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* R&O Integration Notice */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">R&O Integration Coming Soon</h4>
        <p className="text-sm text-blue-700">
          Future versions will include integration with the Risks & Opportunities system for 
          more sophisticated management reserve calculations based on actual risk analysis.
        </p>
      </div>
    </div>
  );
};

export default ManagementReserveTab; 