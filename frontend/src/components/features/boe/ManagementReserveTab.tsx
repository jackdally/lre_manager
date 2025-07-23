import React, { useState, useEffect } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { useManagementReserve } from '../../../hooks/useManagementReserve';
import { 
  ManagementReserveCalculator, 
  ManagementReserveDisplay, 
  ManagementReserveUtilization 
} from './ManagementReserve';
import { PencilIcon, EyeIcon, ChartBarIcon, CalculatorIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ManagementReserveTabProps {
  programId: string;
}

type MRViewMode = 'calculator' | 'display' | 'utilization';

const ManagementReserveTab: React.FC<ManagementReserveTabProps> = ({ programId }) => {
  const { currentBOE } = useBOEStore();
  const [viewMode, setViewMode] = useState<MRViewMode>('display');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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

  // Load MR data when BOE changes
  useEffect(() => {
    if (currentBOE?.id) {
      loadManagementReserve();
      loadMRUtilizationHistory();
    }
  }, [currentBOE?.id, loadManagementReserve, loadMRUtilizationHistory]);

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

  const totalCost = Number(currentBOE?.totalEstimatedCost) || 0;

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
              View
            </button>
            {!managementReserve ? (
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
            )}
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
            />
          </div>
        )}

        {viewMode === 'utilization' && (
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