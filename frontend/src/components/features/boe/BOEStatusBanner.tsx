import React from 'react';
import { useBOEStore } from '../../../store/boeStore';
import Button from '../../common/Button';
import { 
  DocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../../../utils/currencyUtils';

interface BOEStatusBannerProps {
  programId: string;
  onViewApprovalStatus?: () => void;
  onViewHistory?: () => void;
}

const BOEStatusBanner: React.FC<BOEStatusBannerProps> = ({ 
  programId, 
  onViewApprovalStatus, 
  onViewHistory 
}) => {
  const { currentBOE } = useBOEStore();

  if (!currentBOE) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft':
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
      case 'Under Review':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'Approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Rejected':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'Baseline':
        return <DocumentArrowUpIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };



  const getWorkflowStages = () => {
    const stages = [
      { key: 'Draft', label: 'Draft', icon: DocumentCheckIcon, completed: true },
      { key: 'Under Review', label: 'Under Review', icon: ClockIcon, completed: currentBOE.status !== 'Draft' },
      { key: 'Approved', label: 'Approved', icon: CheckCircleIcon, completed: ['Approved', 'Baseline'].includes(currentBOE.status) },
      { key: 'Baseline', label: 'Baseline', icon: CheckCircleIcon, completed: currentBOE.status === 'Baseline' }
    ];

    if (currentBOE.status === 'Rejected') {
      stages[1].completed = true; // Under Review was reached
    }

    return stages;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Baseline':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getContextualActions = () => {
    const actions = [];

    // Add status-specific primary actions only
    switch (currentBOE.status) {
      case 'Draft':
        actions.push({
          label: 'Submit for Approval',
          icon: DocumentArrowUpIcon,
          variant: 'primary',
          action: 'submit-for-approval'
        });
        break;
      
      case 'Approved':
        actions.push({
          label: 'Push to Ledger',
          icon: DocumentArrowUpIcon,
          variant: 'primary',
          action: 'push-to-ledger'
        });
        break;
      
      case 'Baseline':
        actions.push({
          label: 'Create New Version',
          icon: DocumentCheckIcon,
          variant: 'primary',
          action: 'create-new-version'
        });
        break;
    }

    return actions;
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'view-approval-status':
        onViewApprovalStatus?.();
        break;
      case 'view-history':
        onViewHistory?.();
        break;
      case 'submit-for-approval':
        // This will be handled by the parent component
        break;
      case 'push-to-ledger':
        // This will be handled by the parent component
        break;
      case 'create-new-version':
        // This will be handled by the parent component
        break;
    }
  };

  const workflowStages = getWorkflowStages();
  const contextualActions = getContextualActions();

  return (
    <div className="bg-white border-b-2 border-gray-300 shadow-md">
      {/* Status Banner */}
      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 shadow-sm flex items-center gap-2 ${getStatusBadgeColor(currentBOE.status)}`}>
                {getStatusIcon(currentBOE.status)}
                {currentBOE.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 font-medium">
              Version {currentBOE.versionNumber} • {formatCurrency(currentBOE.totalEstimatedCost)}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {contextualActions.map((action, index) => (
              <Button
                key={index}
                onClick={() => handleAction(action.action)}
                className={`${
                  action.variant === 'primary' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <action.icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Workflow Progress Bar */}
        <div className="bg-gray-50 rounded-lg border border-gray-300 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Approval Workflow</h3>
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              {workflowStages.filter(stage => stage.completed).length} of {workflowStages.length} stages complete
            </span>
          </div>
          
          <div className="flex items-center">
            {workflowStages.map((stage, index) => (
              <React.Fragment key={stage.key}>
                <div className="flex flex-col items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2
                    ${stage.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'bg-gray-200 border-gray-300 text-gray-500'
                    }
                  `}>
                    {stage.completed ? (
                      <CheckCircleIconSolid className="h-4 w-4" />
                    ) : (
                      <stage.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className={`
                    text-xs mt-1 text-center max-w-16
                    ${stage.completed ? 'text-green-600 font-medium' : 'text-gray-500'}
                  `}>
                    {stage.label}
                  </span>
                </div>
                
                {index < workflowStages.length - 1 && (
                  <div className={`
                    flex-1 h-0.5 mx-2
                    ${stage.completed && workflowStages[index + 1].completed ? 'bg-green-500' : 'bg-gray-300'}
                  `} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOEStatusBanner; 