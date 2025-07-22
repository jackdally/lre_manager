import React, { useState } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { timeAllocationApi } from '../../../services/boeApi';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import { formatCurrency } from '../../../utils/currencyUtils';
import { 
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  LockClosedIcon,
  LockOpenIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface TimeAllocationActionsProps {
  programId: string;
  allocationId?: string;
  allocationName?: string;
  isLocked?: boolean;
  onActionCompleted?: () => void;
}

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm: () => void;
  confirmText: string;
  loading?: boolean;
  variant?: 'primary' | 'danger';
}

const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText,
  loading = false,
  variant = 'primary'
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="md"
  >
    <div className="space-y-4">
      {children}
      
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          variant="secondary"
          size="md"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant={variant}
          size="md"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </div>
    </div>
  </Modal>
);

const TimeAllocationActions: React.FC<TimeAllocationActionsProps> = ({
  programId,
  allocationId,
  allocationName,
  isLocked = false,
  onActionCompleted
}) => {
  const { setTimeAllocationsError } = useBOEStore();

  const [showPushToLedgerModal, setShowPushToLedgerModal] = useState(false);
  const [showUpdateActualsModal, setShowUpdateActualsModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePushToLedger = async () => {
    if (!allocationId) return;

    try {
      setLoading(true);
      setTimeAllocationsError(null);

      await timeAllocationApi.pushToLedger(allocationId);
      
      setShowPushToLedgerModal(false);
      
      // Show success message
      // You could add a toast notification here
      
      if (onActionCompleted) {
        onActionCompleted();
      }
    } catch (error) {
      console.error('Error pushing to ledger:', error);
      setTimeAllocationsError(error instanceof Error ? error.message : 'Failed to push to ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateActuals = async () => {
    if (!allocationId) return;

    try {
      setLoading(true);
      setTimeAllocationsError(null);

      await timeAllocationApi.updateActuals(allocationId);
      
      setShowUpdateActualsModal(false);
      
      // Show success message
      // You could add a toast notification here
      
      if (onActionCompleted) {
        onActionCompleted();
      }
    } catch (error) {
      console.error('Error updating actuals:', error);
      setTimeAllocationsError(error instanceof Error ? error.message : 'Failed to update actuals');
    } finally {
      setLoading(false);
    }
  };

  const handleLockAllocation = async () => {
    if (!allocationId) return;

    try {
      setLoading(true);
      setTimeAllocationsError(null);

      // This would be a new API endpoint for locking/unlocking
      // await timeAllocationApi.lockAllocation(allocationId);
      
      setShowLockModal(false);
      
      if (onActionCompleted) {
        onActionCompleted();
      }
    } catch (error) {
      console.error('Error locking allocation:', error);
      setTimeAllocationsError(error instanceof Error ? error.message : 'Failed to lock allocation');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockAllocation = async () => {
    if (!allocationId) return;

    try {
      setLoading(true);
      setTimeAllocationsError(null);

      // This would be a new API endpoint for locking/unlocking
      // await timeAllocationApi.unlockAllocation(allocationId);
      
      setShowUnlockModal(false);
      
      if (onActionCompleted) {
        onActionCompleted();
      }
    } catch (error) {
      console.error('Error unlocking allocation:', error);
      setTimeAllocationsError(error instanceof Error ? error.message : 'Failed to unlock allocation');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Export functionality - could export to CSV, Excel, or PDF
    console.log('Export functionality not yet implemented');
    // You could implement export logic here
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowPushToLedgerModal(true)}
          disabled={!allocationId || isLocked}
        >
          <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
          Push to Ledger
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowUpdateActualsModal(true)}
          disabled={!allocationId}
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Update Actuals
        </Button>

        {!isLocked ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowLockModal(true)}
            disabled={!allocationId}
          >
            <LockClosedIcon className="h-4 w-4 mr-2" />
            Lock Allocation
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowUnlockModal(true)}
            disabled={!allocationId}
          >
            <LockOpenIcon className="h-4 w-4 mr-2" />
            Unlock Allocation
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
        >
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Push to Ledger Modal */}
      <ActionModal
        isOpen={showPushToLedgerModal}
        onClose={() => setShowPushToLedgerModal(false)}
        title="Push to Ledger"
        onConfirm={handlePushToLedger}
        confirmText="Push to Ledger"
        loading={loading}
        variant="primary"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <ArrowUpTrayIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Push Time Allocation to Ledger</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>This will create ledger entries for each month of the time allocation:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Creates baseline budget entries for each month</li>
                    <li>Sets planned amounts based on the allocation pattern</li>
                    <li>Locks the time allocation to prevent changes</li>
                    <li>Links entries to the program and time allocation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {allocationName && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Time Allocation Details</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Name:</strong> {allocationName}</p>
                <p><strong>Status:</strong> {isLocked ? 'Locked' : 'Draft'}</p>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Once pushed to ledger, this time allocation will be locked and cannot be modified. 
                  You can still update actuals from the ledger system.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ActionModal>

      {/* Update Actuals Modal */}
      <ActionModal
        isOpen={showUpdateActualsModal}
        onClose={() => setShowUpdateActualsModal(false)}
        title="Update Actuals from Ledger"
        onConfirm={handleUpdateActuals}
        confirmText="Update Actuals"
        loading={loading}
        variant="primary"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <ArrowDownTrayIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Update Actuals from Ledger</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>This will synchronize actual amounts from the ledger system:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Updates monthly breakdown with actual amounts</li>
                    <li>Calculates variances between planned and actual</li>
                    <li>Refreshes allocation summary and metrics</li>
                    <li>Maintains data consistency across systems</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {allocationName && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Time Allocation Details</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Name:</strong> {allocationName}</p>
                <p><strong>Status:</strong> {isLocked ? 'Locked' : 'Draft'}</p>
              </div>
            </div>
          )}
        </div>
      </ActionModal>

      {/* Lock Allocation Modal */}
      <ActionModal
        isOpen={showLockModal}
        onClose={() => setShowLockModal(false)}
        title="Lock Time Allocation"
        onConfirm={handleLockAllocation}
        confirmText="Lock Allocation"
        loading={loading}
        variant="primary"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <LockClosedIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Lock Time Allocation</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>This will lock the time allocation to prevent further changes:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Prevents modification of allocation details</li>
                    <li>Maintains data integrity</li>
                    <li>Can be unlocked later if needed</li>
                    <li>Required before pushing to ledger</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {allocationName && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Time Allocation Details</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Name:</strong> {allocationName}</p>
                <p><strong>Current Status:</strong> Draft</p>
              </div>
            </div>
          )}
        </div>
      </ActionModal>

      {/* Unlock Allocation Modal */}
      <ActionModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        title="Unlock Time Allocation"
        onConfirm={handleUnlockAllocation}
        confirmText="Unlock Allocation"
        loading={loading}
        variant="danger"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <LockOpenIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Unlock Time Allocation</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>This will unlock the time allocation to allow modifications:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Allows modification of allocation details</li>
                    <li>May affect ledger entries if already pushed</li>
                    <li>Use with caution in production environments</li>
                    <li>Consider creating a new version instead</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {allocationName && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Time Allocation Details</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Name:</strong> {allocationName}</p>
                <p><strong>Current Status:</strong> Locked</p>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Unlocking this allocation may affect existing ledger entries and calculations. 
                  Consider the impact before proceeding.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ActionModal>
    </div>
  );
};

export default TimeAllocationActions; 