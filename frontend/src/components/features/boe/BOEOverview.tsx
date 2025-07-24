import React, { useState, useEffect } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { boeVersionsApi } from '../../../services/boeApi';
import { useManagementReserve } from '../../../hooks/useManagementReserve';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import BOEWizardModal from './BOEWizardModal';
import { formatCurrency, safeNumber } from '../../../utils/currencyUtils';
import { 
  CurrencyDollarIcon, 
  DocumentArrowUpIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface BOEOverviewProps {
  programId: string;
}

const BOEOverview: React.FC<BOEOverviewProps> = ({ programId }) => {
  const { currentBOE, boeLoading, boeError, setCurrentBOE, setBOELoading, setBOEError, openWizard } = useBOEStore();
  
  // Load Management Reserve data
  const { managementReserve: mrData } = useManagementReserve(currentBOE?.id);
  

  



  const [showDraftOverwriteModal, setShowDraftOverwriteModal] = useState(false);

  // Load BOE data
  useEffect(() => {
    const loadBOE = async () => {
      try {
        setBOELoading(true);
        setBOEError(null);
        
        const boeData = await boeVersionsApi.getCurrentBOE(programId);
        setCurrentBOE(boeData.currentBOE || null);
      } catch (error) {
        console.error('Error loading BOE:', error);
        setBOEError(error instanceof Error ? error.message : 'Failed to load BOE');
      } finally {
        setBOELoading(false);
      }
    };

    if (programId) {
      loadBOE();
    }
  }, [programId, setCurrentBOE, setBOELoading, setBOEError]);

  const handleCreateNewBOE = () => {
    // Check if there's already a draft BOE
    if (currentBOE && currentBOE.status === 'Draft') {
      setShowDraftOverwriteModal(true);
    } else {
      openWizard(programId);
    }
  };

  const handleConfirmOverwrite = async () => {
    setShowDraftOverwriteModal(false);
    openWizard(programId);
  };







  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Baseline':
        return <DocumentArrowUpIcon className="h-5 w-5 text-blue-500" />;
      case 'Under Review':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'Rejected':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Baseline':
        return 'bg-blue-100 text-blue-800';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (boeLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading BOE data...</span>
        </div>
      </div>
    );
  }

  if (boeError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading BOE</h3>
              <div className="mt-2 text-sm text-red-700">{boeError}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentBOE) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <ChartBarIcon className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No BOE Found</h3>
          <p className="text-gray-500 mb-6">
            This program doesn't have a Basis of Estimate yet. Create one to get started.
          </p>
          <Button 
            variant="primary" 
            size="md"
            onClick={handleCreateNewBOE}
          >
            Create New BOE
          </Button>
        </div>

        {/* Centralized BOE Wizard Modal */}
        <BOEWizardModal />
      </div>
    );
  }

  const elements = currentBOE.elements || [];
  const totalElements = elements.length;
  const requiredElements = elements.filter(e => e.isRequired).length;
  const optionalElements = elements.filter(e => e.isOptional).length;
  const totalCost = safeNumber(currentBOE.totalEstimatedCost);
  // Use MR data from the hook, fallback to BOE data if not available
  const managementReserveAmount = mrData?.adjustedAmount || safeNumber(currentBOE.managementReserveAmount);
  const managementReservePercentage = mrData?.adjustedPercentage || safeNumber(currentBOE.managementReservePercentage);
  const totalWithMR = totalCost + safeNumber(managementReserveAmount);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">BOE Overview</h2>
            <p className="text-gray-600 mt-1">
              Version {currentBOE.versionNumber} • {currentBOE.name}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentBOE.status)}`}>
              {getStatusIcon(currentBOE.status)}
              <span className="ml-1">{currentBOE.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Estimated Cost</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Management Reserve</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(managementReserveAmount)}</p>
              <p className="text-sm text-gray-500">{managementReservePercentage}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total with MR</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalWithMR)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Element Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Elements</p>
              <p className="text-2xl font-bold text-gray-900">{totalElements}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Required Elements</p>
              <p className="text-2xl font-bold text-gray-900">{requiredElements}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Optional Elements</p>
              <p className="text-2xl font-bold text-gray-900">{optionalElements}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BOE Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">BOE Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Description</h4>
            <p className="text-gray-600">{currentBOE.description || 'No description provided'}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Change Summary</h4>
            <p className="text-gray-600">{currentBOE.changeSummary || 'No changes documented'}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Created</h4>
            <p className="text-gray-600">{new Date(currentBOE.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Last Updated</h4>
            <p className="text-gray-600">{new Date(currentBOE.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>





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


    </div>
  );
};

export default BOEOverview; 