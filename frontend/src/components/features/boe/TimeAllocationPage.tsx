import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBOEStore } from '../../../store/boeStore';
import { timeAllocationApi } from '../../../services/boeApi';
import TimeAllocationManager from './TimeAllocationManager';
import TimeAllocationSummary from './TimeAllocationSummary';
import TimeAllocationActions from './TimeAllocationActions';
import { 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface TimeAllocationPageProps {
  programId?: string;
}

const TimeAllocationPage: React.FC<TimeAllocationPageProps> = ({ programId: propProgramId }) => {
  const { id: urlProgramId } = useParams<{ id: string }>();
  const programId = propProgramId || urlProgramId;

  const { 
    timeAllocationSummary,
    timeAllocationsLoading, 
    timeAllocationsError,
    setTimeAllocationSummary, 
    setTimeAllocationsLoading, 
    setTimeAllocationsError 
  } = useBOEStore();

  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);
  const [selectedAllocationName, setSelectedAllocationName] = useState<string | null>(null);
  const [selectedAllocationLocked, setSelectedAllocationLocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'manager' | 'actions'>('summary');

  // Load time allocation summary on mount
  useEffect(() => {
    if (programId) {
      loadTimeAllocationSummary();
    }
  }, [programId]);

  const loadTimeAllocationSummary = async () => {
    if (!programId) return;

    try {
      setTimeAllocationsLoading(true);
      setTimeAllocationsError(null);
      
      const summary = await timeAllocationApi.getTimeAllocationSummary(programId);
      setTimeAllocationSummary(summary);
    } catch (error) {
      console.error('Error loading time allocation summary:', error);
      setTimeAllocationsError(error instanceof Error ? error.message : 'Failed to load time allocation summary');
    } finally {
      setTimeAllocationsLoading(false);
    }
  };

  const handleAllocationCreated = () => {
    // Refresh the summary when a new allocation is created
    loadTimeAllocationSummary();
    setActiveTab('summary');
  };

  const handleActionCompleted = () => {
    // Refresh the summary when an action is completed
    loadTimeAllocationSummary();
  };

  const handleAllocationSelect = (allocationId: string, allocationName: string, isLocked: boolean) => {
    setSelectedAllocationId(allocationId);
    setSelectedAllocationName(allocationName);
    setSelectedAllocationLocked(isLocked);
    setActiveTab('actions');
  };

  if (!programId) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                Program ID is required to view time allocations.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Allocations</h1>
          <p className="text-sm text-gray-600">
            Manage time-based cost allocations for direct labor and contractor costs
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadTimeAllocationSummary}
            disabled={timeAllocationsLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${timeAllocationsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {timeAllocationsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Time Allocations</h3>
              <div className="mt-2 text-sm text-red-700">
                {timeAllocationsError}
              </div>
              <div className="mt-4">
                <button
                  onClick={loadTimeAllocationSummary}
                  className="text-sm text-red-800 hover:text-red-900 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ClockIcon className="h-4 w-4 inline mr-2" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab('manager')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manager'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckCircleIcon className="h-4 w-4 inline mr-2" />
            Create & Manage
          </button>
          {selectedAllocationId && (
            <button
              onClick={() => setActiveTab('actions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'actions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Actions
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'summary' && (
          <TimeAllocationSummary
            programId={programId}
            onRefresh={loadTimeAllocationSummary}
          />
        )}

        {activeTab === 'manager' && (
          <TimeAllocationManager
            programId={programId}
            onAllocationCreated={handleAllocationCreated}
          />
        )}

        {activeTab === 'actions' && selectedAllocationId && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Time Allocation Actions</h3>
                {selectedAllocationName && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: <span className="font-medium">{selectedAllocationName}</span>
                  </p>
                )}
              </div>
              
              <TimeAllocationActions
                programId={programId}
                allocationId={selectedAllocationId}
                allocationName={selectedAllocationName || undefined}
                isLocked={selectedAllocationLocked}
                onActionCompleted={handleActionCompleted}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('summary')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  View All Allocations
                </button>
                <button
                  onClick={() => setActiveTab('manager')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Create New Allocation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* No Allocation Selected Message */}
      {activeTab === 'actions' && !selectedAllocationId && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-center py-8">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Allocation Selected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a time allocation from the summary to perform actions.
            </p>
            <div className="mt-4">
              <button
                onClick={() => setActiveTab('summary')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                View Allocations
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default TimeAllocationPage; 