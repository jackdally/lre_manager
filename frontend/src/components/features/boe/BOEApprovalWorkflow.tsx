import React, { useState, useEffect } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { boeApprovalsApi, boeVersionsApi } from '../../../services/boeApi';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  CalendarIcon,
  ArrowPathIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../../../utils/currencyUtils';

interface BOEApprovalWorkflowProps {
  programId: string;
}

interface ApprovalAction {
  type: 'approve' | 'reject' | 'request-changes';
  comments: string;
  rejectionReason?: string;
}

const BOEApprovalWorkflow: React.FC<BOEApprovalWorkflowProps> = ({ programId }) => {
  const { currentBOE, setCurrentBOE } = useBOEStore();
  
  // Local state
  const [approvals, setApprovals] = useState<any[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<any>(null);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalsError, setApprovalsError] = useState<string | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ApprovalAction | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedApprovalLevel, setSelectedApprovalLevel] = useState<number | null>(null);

  // Load approvals data
  useEffect(() => {
    const loadApprovalData = async () => {
      if (!currentBOE?.id) return;

      try {
        setApprovalsLoading(true);
        setApprovalsError(null);
        
        // Load both approvals and approval status
        const [approvalsData, statusData] = await Promise.all([
          boeApprovalsApi.getApprovals(currentBOE.id),
          boeApprovalsApi.getApprovalStatus(currentBOE.id)
        ]);
        
        setApprovals(approvalsData);
        setApprovalStatus(statusData);
      } catch (error) {
        console.error('Error loading approval data:', error);
        setApprovalsError(error instanceof Error ? error.message : 'Failed to load approval data');
      } finally {
        setApprovalsLoading(false);
      }
    };

    loadApprovalData();
  }, [currentBOE?.id]);

  // Handle approval actions
  const handleSubmitForApproval = async () => {
    if (!currentBOE?.id) return;

    try {
      setSubmittingAction(true);
      
      // Submit BOE for approval
      const updatedBOE = await boeVersionsApi.submitForApproval(programId);
      setCurrentBOE(updatedBOE);
      
      // Reload approvals
      const approvalsData = await boeApprovalsApi.getApprovals(currentBOE.id);
      setApprovals(approvalsData);
      
    } catch (error) {
      console.error('Error submitting for approval:', error);
      setApprovalsError(error instanceof Error ? error.message : 'Failed to submit for approval');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleApprovalAction = async (action: 'approve' | 'reject') => {
    if (!currentBOE?.id || !selectedAction || !selectedApprovalLevel) return;

    try {
      setSubmittingAction(true);
      
      const approvalData = {
        approvedBy: 'Current User', // TODO: Get from auth context
        comments: selectedAction.comments,
        approvalLevel: selectedApprovalLevel,
        action: action,
        ...(action === 'reject' && { rejectionReason: selectedAction.rejectionReason })
      };

      // Approve/reject BOE version using new API
      const updatedBOE = await boeVersionsApi.approveBOE(programId, currentBOE.id, approvalData);
      setCurrentBOE(updatedBOE);
      
      // Reload approval data
      const [approvalsData, statusData] = await Promise.all([
        boeApprovalsApi.getApprovals(currentBOE.id),
        boeApprovalsApi.getApprovalStatus(currentBOE.id)
      ]);
      
      setApprovals(approvalsData);
      setApprovalStatus(statusData);
      
      setActionModalOpen(false);
      setSelectedAction(null);
      setComments('');
      setRejectionReason('');
      setSelectedApprovalLevel(null);
      
    } catch (error) {
      console.error('Error processing approval action:', error);
      setApprovalsError(error instanceof Error ? error.message : 'Failed to process approval action');
    } finally {
      setSubmittingAction(false);
    }
  };

  const openActionModal = (action: 'approve' | 'reject' | 'request-changes', approvalLevel?: number) => {
    setSelectedAction({ type: action, comments: '' });
    setSelectedApprovalLevel(approvalLevel || null);
    setActionModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft':
        return <DocumentCheckIcon className="h-5 w-5 text-gray-400" />;
      case 'Under Review':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'Approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'Baseline':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Baseline':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canSubmitForApproval = currentBOE?.status === 'Draft';
  const canApprove = currentBOE?.status === 'Under Review';
  const canReject = currentBOE?.status === 'Under Review';
  const canRequestChanges = currentBOE?.status === 'Under Review';

  if (!currentBOE) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <DocumentCheckIcon className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No BOE Found</h3>
          <p className="text-gray-500">
            Please create a BOE first before accessing the approval workflow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Current Status Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Approval Status</h2>
          <div className="flex items-center gap-2">
            {getStatusIcon(currentBOE.status)}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentBOE.status)}`}>
              {currentBOE.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Created By</span>
            </div>
            <p className="text-sm text-gray-900">{currentBOE.createdBy || 'Unknown'}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Created Date</span>
            </div>
            <p className="text-sm text-gray-900">
              {new Date(currentBOE.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CurrencyDollarIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Total Cost</span>
            </div>
            <p className="text-sm text-gray-900">{formatCurrency(currentBOE.totalEstimatedCost)}</p>
          </div>
        </div>

        {/* Approval Workflow Status */}
        {approvalStatus && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Approval Workflow</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Current Level:</span>
                <p className="text-sm text-gray-900">Level {approvalStatus.currentLevel || 'None'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Next Approver:</span>
                <p className="text-sm text-gray-900">{approvalStatus.nextApprover || 'None'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Can Approve:</span>
                <p className="text-sm text-gray-900">{approvalStatus.canApprove ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Workflow Complete:</span>
                <p className="text-sm text-gray-900">{approvalStatus.isComplete ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Approval Actions */}
        <div className="flex flex-wrap gap-3">
          {canSubmitForApproval && (
            <Button
              onClick={handleSubmitForApproval}
              disabled={submittingAction}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submittingAction ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <DocumentCheckIcon className="h-4 w-4 mr-2" />
                  Submit for Approval
                </>
              )}
            </Button>
          )}

          {approvalStatus?.canApprove && approvalStatus.currentLevel && (
            <>
              <Button
                onClick={() => openActionModal('approve', approvalStatus.currentLevel)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Approve Level {approvalStatus.currentLevel}
              </Button>

              <Button
                onClick={() => openActionModal('reject', approvalStatus.currentLevel)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Reject Level {approvalStatus.currentLevel}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Approval History Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Approval History</h2>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {approvalsLoading ? (
          <div className="text-center py-8">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Loading approval history...</p>
          </div>
        ) : approvalsError ? (
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-500">{approvalsError}</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No approval history found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div key={approval.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(approval.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {approval.approverRole} - {approval.approverName || 'Unassigned'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Level {approval.approvalLevel} • {approval.isRequired ? 'Required' : 'Optional'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(approval.status)}`}>
                    {approval.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Submitted:</span>
                    <p className="text-sm text-gray-900">
                      {approval.submittedAt ? new Date(approval.submittedAt).toLocaleString() : 'Not submitted'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Processed:</span>
                    <p className="text-sm text-gray-900">
                      {approval.approvedAt ? new Date(approval.approvedAt).toLocaleString() : 
                       approval.rejectedAt ? new Date(approval.rejectedAt).toLocaleString() : 'Pending'}
                    </p>
                  </div>
                </div>

                {approval.comments && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">Comments:</span>
                    <p className="text-sm text-gray-900 mt-1">{approval.comments}</p>
                  </div>
                )}

                {approval.rejectionReason && (
                  <div>
                    <span className="text-sm font-medium text-red-700">Rejection Reason:</span>
                    <p className="text-sm text-red-900 mt-1">{approval.rejectionReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Action Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => {
          setActionModalOpen(false);
          setSelectedAction(null);
          setComments('');
          setRejectionReason('');
          setSelectedApprovalLevel(null);
        }}
        title={`${selectedAction?.type === 'approve' ? 'Approve' : 
                selectedAction?.type === 'reject' ? 'Reject' : 
                'Request Changes'} BOE - Level ${selectedApprovalLevel}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add your comments..."
            />
          </div>

          {selectedAction?.type === 'reject' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={() => {
                setActionModalOpen(false);
                setSelectedAction(null);
                setComments('');
                setRejectionReason('');
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedAction?.type === 'approve' || selectedAction?.type === 'reject') {
                  setSelectedAction({ ...selectedAction, comments, rejectionReason });
                  handleApprovalAction(selectedAction.type);
                }
              }}
              disabled={submittingAction || (selectedAction?.type === 'reject' && !rejectionReason.trim())}
              className={`${
                selectedAction?.type === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                selectedAction?.type === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                'bg-yellow-600 hover:bg-yellow-700'
              } text-white`}
            >
              {submittingAction ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                selectedAction?.type === 'approve' ? 'Approve' :
                selectedAction?.type === 'reject' ? 'Reject' :
                'Request Changes'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BOEApprovalWorkflow; 