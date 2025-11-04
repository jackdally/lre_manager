import React, { useState, useEffect } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { boeApprovalsApi, boeVersionsApi } from '../../../services/boeApi';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import EnhancedErrorMessage from '../../common/EnhancedErrorMessage';
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
      } catch (error: any) {
        console.error('Error loading approval data:', error);
        // Extract the error message from the API response
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load approval data';
        setApprovalsError(errorMessage);
      } finally {
        setApprovalsLoading(false);
      }
    };

    loadApprovalData();
  }, [currentBOE?.id, currentBOE?.status]);

  // Handle approval actions
  const handleSubmitForApproval = async () => {
    if (!currentBOE?.id) return;

    try {
      setSubmittingAction(true);
      setApprovalsError(null);
      
      // Submit BOE for approval
      const updatedBOE = await boeVersionsApi.submitForApproval(programId);
      setCurrentBOE(updatedBOE);
      
      // Reload both approvals and approval status with the updated BOE
      const [approvalsData, statusData] = await Promise.all([
        boeApprovalsApi.getApprovals(updatedBOE.id),
        boeApprovalsApi.getApprovalStatus(updatedBOE.id)
      ]);
      
      setApprovals(approvalsData);
      setApprovalStatus(statusData);
      
    } catch (error: any) {
      console.error('Error submitting for approval:', error);
      // Extract the validation error message from the API response
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit for approval';
      setApprovalsError(errorMessage);
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
      
    } catch (error: any) {
      console.error('Error processing approval action:', error);
      // Extract the error message from the API response
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to process approval action';
      setApprovalsError(errorMessage);
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
    <div className="p-4 space-y-4">
      {/* Enhanced Error Display */}
      {approvalsError && (
        <div className="mb-6">
          <EnhancedErrorMessage
            title="Approval Submission Failed"
            message={
              approvalsError.startsWith('BOE validation failed:')
                ? "Your BOE cannot be submitted for approval until the following issues are resolved:"
                : approvalsError
            }
            type="error"
            details={
              approvalsError.startsWith('BOE validation failed:')
                ? (() => {
                    const errorText = approvalsError.replace('BOE validation failed: ', '');
                    const errors = errorText.split(', ');
                    const details: string[] = [];
                    
                    errors.forEach(error => {
                      if (error.includes(': ')) {
                        const [category, items] = error.split(': ');
                        const itemList = items.split(', ');
                        details.push(`${category}: ${itemList.join(', ')}`);
                      } else {
                        details.push(error);
                      }
                    });
                    
                    return details;
                  })()
                : [approvalsError]
            }
            recoverySuggestions={(() => {
              const suggestions: string[] = [];
              if (approvalsError.includes('Missing Allocations')) {
                suggestions.push('Navigate to the Allocations tab and create allocations for all required elements');
              }
              if (approvalsError.includes('Missing Vendors')) {
                suggestions.push('Assign vendors to all leaf elements in the WBS Structure');
              }
              if (approvalsError.includes('Management Reserve')) {
                suggestions.push('Configure Management Reserve in the BOE Overview section');
              }
              if (approvalsError.includes('WBS element')) {
                suggestions.push('Ensure all required WBS elements have cost estimates and cost categories');
              }
              if (suggestions.length === 0) {
                suggestions.push('Review the BOE details and ensure all required fields are completed');
                suggestions.push('Check that all allocations are properly configured');
              }
              return suggestions;
            })()}
            onDismiss={() => setApprovalsError(null)}
            onAction={{
              label: 'Go to BOE Details',
              onClick: () => {
                // Scroll to BOE details section or navigate
                window.location.hash = 'boe-details';
                setApprovalsError(null);
              },
            }}
          />
        </div>
      )}

      {/* Current Status Section */}
      <div className="space-y-4">
        {/* Status Header Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Approval Status</h2>
              <p className="text-sm text-gray-600 mt-1">Current BOE approval workflow status</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(currentBOE.status)}
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(currentBOE.status)}`}>
                {currentBOE.status}
              </span>
            </div>
          </div>

          {/* BOE Info Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1.5">
                <UserIcon className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Created By</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{currentBOE.createdBy || 'Unknown'}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1.5">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Created Date</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(currentBOE.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1.5">
                <CurrencyDollarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total Cost</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(currentBOE.totalEstimatedCost)}</p>
            </div>
          </div>
        </div>

        {/* Approval Workflow Status Card */}
        {approvalStatus && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-blue-600" />
                Approval Workflow
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <span className="text-xs font-medium text-blue-700 uppercase tracking-wide block mb-1">Current Level</span>
                <p className="text-sm font-semibold text-blue-900">{approvalStatus.currentLevel || 'None'}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <span className="text-xs font-medium text-blue-700 uppercase tracking-wide block mb-1">Next Approver</span>
                <p className="text-sm font-semibold text-blue-900">{approvalStatus.nextApprover || 'None'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1">Can Approve</span>
                <p className={`text-sm font-semibold ${approvalStatus.canApprove ? 'text-green-700' : 'text-gray-700'}`}>
                  {approvalStatus.canApprove ? 'Yes' : 'No'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1">Workflow Complete</span>
                <p className={`text-sm font-semibold ${approvalStatus.isComplete ? 'text-green-700' : 'text-gray-700'}`}>
                  {approvalStatus.isComplete ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Approval Actions */}
        {(canSubmitForApproval || (approvalStatus?.canApprove && approvalStatus.currentLevel)) && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {canSubmitForApproval && (
                <button
                  onClick={handleSubmitForApproval}
                  disabled={submittingAction}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
                </button>
              )}

              {approvalStatus?.canApprove && approvalStatus.currentLevel && approvalStatus.currentLevel.startsWith('Level ') && (
                <>
                  <button
                    onClick={() => {
                      const levelNumber = parseInt(approvalStatus.currentLevel.replace('Level ', ''));
                      openActionModal('approve', levelNumber);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Approve {approvalStatus.currentLevel}
                  </button>

                  <button
                    onClick={() => {
                      const levelNumber = parseInt(approvalStatus.currentLevel.replace('Level ', ''));
                      openActionModal('reject', levelNumber);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Reject {approvalStatus.currentLevel}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Approval History Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600" />
            <h2 className="text-base font-semibold text-gray-900">Approval History</h2>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1.5" />
            Refresh
          </button>
        </div>

        <div className="p-4">
          {approvalsLoading ? (
            <div className="text-center py-12">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Loading approval history...</p>
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">No Approval History</p>
              <p className="text-xs text-gray-500">Approval entries will appear here once the workflow begins.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((approval) => (
                <div key={approval.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon(approval.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          {approval.approverRole} - {approval.approverName || 'Unassigned'}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          Level {approval.approvalLevel} • {approval.isRequired ? 'Required' : 'Optional'}
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-white rounded p-2 border border-gray-200">
                            <span className="text-gray-600 font-medium block mb-0.5">Submitted</span>
                            <p className="text-gray-900 font-medium">
                              {approval.submittedAt 
                                ? new Date(approval.submittedAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Not submitted'}
                            </p>
                          </div>
                          <div className="bg-white rounded p-2 border border-gray-200">
                            <span className="text-gray-600 font-medium block mb-0.5">Processed</span>
                            <p className="text-gray-900 font-medium">
                              {approval.approvedAt 
                                ? new Date(approval.approvedAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : approval.rejectedAt 
                                ? new Date(approval.rejectedAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Pending'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getStatusColor(approval.status)}`}>
                      {approval.status}
                    </span>
                  </div>

                  {approval.comments && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs font-medium text-gray-700 block mb-1.5">Comments</span>
                      <p className="text-xs text-gray-900 bg-white rounded p-2 border border-gray-200">{approval.comments}</p>
                    </div>
                  )}

                  {approval.rejectionReason && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs font-medium text-red-700 block mb-1.5">Rejection Reason</span>
                      <p className="text-xs text-red-900 bg-red-50 rounded p-2 border border-red-200">{approval.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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