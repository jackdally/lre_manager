import React, { useState, useEffect } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { boeVersionsApi } from '../../../services/boeApi';
import { boeCommentsApi } from '../../../services/boeApi';
import { formatCurrency, formatDate } from '../../../utils/currencyUtils';
import { 
  ClockIcon, 
  DocumentTextIcon, 
  ArrowPathIcon, 
  EyeIcon, 
  ChartBarIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  MinusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import Button from '../../common/Button';
import Modal from '../../common/Modal';

interface BOEHistoryProps {
  programId: string;
  sidebarWidth?: number;
}

interface BOEVersionHistory {
  currentVersion: any;
  previousVersion: any;
  allVersions: any[];
  timeline: any[];
}

interface BOEVersionComparison {
  baseVersion: any;
  compareVersion: any;
  changes: {
    costVariance: number;
    costVariancePercentage: number;
    mrVariance: number;
    mrVariancePercentage: number;
    elementChanges: {
      added: any[];
      removed: any[];
      modified: any[];
    };
  };
}

const BOEHistory: React.FC<BOEHistoryProps> = ({ programId, sidebarWidth = 500 }) => {
  const { currentBOE, setCurrentBOE, setToast } = useBOEStore();
  
  const [versionHistory, setVersionHistory] = useState<BOEVersionHistory | null>(null);
  const [comparison, setComparison] = useState<BOEVersionComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [compareVersion, setCompareVersion] = useState<any>(null);
  
  // Form states
  const [rollbackReason, setRollbackReason] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentsByVersion, setCommentsByVersion] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  // Load version history
  useEffect(() => {
    if (currentBOE?.id) {
      loadVersionHistory();
    }
  }, [currentBOE]);

  const loadVersionHistory = async () => {
    if (!currentBOE?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const history = await boeVersionsApi.getVersionHistory(currentBOE.id);
      setVersionHistory(history);
    } catch (error) {
      console.error('Error loading version history:', error);
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments for all versions on load
  useEffect(() => {
    if (versionHistory?.timeline) {
      versionHistory.timeline.forEach((version: any) => {
        fetchComments(version.id);
      });
    }
    // eslint-disable-next-line
  }, [versionHistory]);

  const fetchComments = async (versionId: string) => {
    try {
      const comments = await boeCommentsApi.getCommentsByVersion(versionId);
      setCommentsByVersion(prev => ({ ...prev, [versionId]: comments }));
    } catch (e) {
      // Optionally handle error
    }
  };

  const handleCompareVersions = async (baseVersionId: string, compareVersionId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const comparisonData = await boeVersionsApi.compareVersions(baseVersionId, compareVersionId);
      setComparison(comparisonData);
      setShowComparisonModal(true);
    } catch (error) {
      console.error('Error comparing versions:', error);
      setError('Failed to compare versions');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!selectedVersion || !rollbackReason.trim()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const result = await boeVersionsApi.rollbackVersion(selectedVersion.id, {
        rollbackReason: rollbackReason.trim(),
        createNewVersion: true
      });
      
      setShowRollbackModal(false);
      setRollbackReason('');
      setSelectedVersion(null);
      
      // Update current BOE in store with the new version
      if (result.newVersion) {
        setCurrentBOE(result.newVersion);
      }
      
      // Reload version history
      await loadVersionHistory();
      
      // Show success toast
      setToast({
        message: 'Rollback completed successfully! A new draft version has been created.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error rolling back version:', error);
      setError('Failed to rollback version');
      
      // Show error toast
      setToast({
        message: 'Failed to rollback version. Please try again.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComments = async () => {
    if (!selectedVersion) return;
    
    if (!comments.trim()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      await boeVersionsApi.updateComments(selectedVersion.id, {
        comments: comments.trim(),
        updatedBy: 'current-user' // TODO: Get from auth context
      });
      
      setShowCommentsModal(false);
      setComments('');
      setSelectedVersion(null);
      
      // Reload version history
      await loadVersionHistory();
    } catch (error) {
      console.error('Error updating comments:', error);
      setError('Failed to update comments');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft':
        return <DocumentTextIcon className="h-4 w-4 text-gray-500" />;
      case 'Under Review':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'Approved':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'Rejected':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'Baseline':
        return <ChartBarIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-400" />;
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

  if (loading && !versionHistory) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading version history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">Error Loading History</h3>
          <p className="text-xs text-gray-600 mb-3">{error}</p>
          <Button onClick={loadVersionHistory} variant="primary" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!versionHistory || versionHistory.allVersions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">No Version History</h3>
          <p className="text-xs text-gray-600">
            No previous versions found for this BOE.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Content - No header, parent component provides it */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Version Timeline */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-4">
              {versionHistory.timeline.map((version, index) => (
                <div key={version.id} className="relative">
                  {/* Timeline Connector */}
                  {index < versionHistory.timeline.length - 1 && (
                    <div className="absolute left-4 top-8 w-0.5 h-6 bg-gray-200"></div>
                  )}
                  
                  <div className={`relative flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                    version.isCurrent 
                      ? 'bg-blue-50 border-blue-200 shadow-sm' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}>
                    {/* Version Number Badge */}
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm ${
                        version.isCurrent 
                          ? 'bg-blue-600 text-white ring-2 ring-blue-200' 
                          : 'bg-gray-100 text-gray-700 border-2 border-gray-200'
                      }`}>
                        {version.position}
                      </div>
                    </div>

                    {/* Version Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Version Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <h5 className="text-sm font-semibold text-gray-900 truncate">
                            {version.name}
                          </h5>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            v{version.versionNumber}
                          </span>
                          {version.isCurrent && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                              Current
                            </span>
                          )}
                        </div>
                        
                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(version.status)} flex-shrink-0`}>
                          {getStatusIcon(version.status)}
                          {version.status}
                        </span>
                      </div>

                      {/* Version Details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {formatDate(version.createdAt)}
                          </span>
                          <span className="truncate">by {version.createdBy || 'Unknown'}</span>
                        </div>
                        

                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setSelectedVersion(version);
                            setShowCommentsModal(true);
                            setNewComment('');
                          }}
                          className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          <ChatBubbleLeftIcon className="h-3 w-3" />
                          Comments
                          {commentsByVersion[version.id]?.length > 0 && (
                            <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {commentsByVersion[version.id]?.length}
                            </span>
                          )}
                        </button>
                        
                        {index > 0 && (
                          <button
                            onClick={() => handleCompareVersions(version.id, versionHistory.timeline[index - 1].id)}
                            className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                          >
                            <EyeIcon className="h-3 w-3" />
                            Compare
                          </button>
                        )}
                        
                        {version.status !== 'Draft' && !version.isCurrent && (
                          <button
                            onClick={() => {
                              setSelectedVersion(version);
                              setShowRollbackModal(true);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 transition-colors"
                          >
                            <ArrowPathIcon className="h-3 w-3" />
                            Rollback
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Version Summary Cards */}
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Version Summary</h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Versions:</span>
                  <span className="font-medium">{versionHistory.allVersions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Version:</span>
                  <span className="font-medium">{versionHistory.currentVersion.versionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Latest Cost:</span>
                  <span className="font-medium">{formatCurrency(versionHistory.currentVersion.totalEstimatedCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Versions with Comments:</span>
                  <span className="font-medium">
                    {versionHistory.allVersions.filter(v => commentsByVersion[v.id]?.length > 0).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h5>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    setSelectedVersion(versionHistory.currentVersion);
                    setShowCommentsModal(true);
                  }}
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center text-xs"
                >
                  <ChatBubbleLeftIcon className="h-3 w-3 mr-1" />
                  Add Comments
                </Button>
                {versionHistory.timeline.length > 1 && (
                  <Button
                    onClick={() => handleCompareVersions(
                      versionHistory.currentVersion.id,
                      versionHistory.timeline[versionHistory.timeline.length - 2].id
                    )}
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center text-xs"
                  >
                    <EyeIcon className="h-3 w-3 mr-1" />
                    Compare with Previous
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      <Modal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        title="Version Comparison"
        size="xl"
      >
        {comparison && (
          <div className="space-y-6">
            {/* Version Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Base Version</h5>
                <p className="text-sm text-gray-600">v{comparison.baseVersion.versionNumber}</p>
                <p className="text-sm text-gray-600">{formatDate(comparison.baseVersion.createdAt)}</p>
                <p className="text-sm font-medium mt-2">{formatCurrency(comparison.baseVersion.totalEstimatedCost)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Compare Version</h5>
                <p className="text-sm text-gray-600">v{comparison.compareVersion.versionNumber}</p>
                <p className="text-sm text-gray-600">{formatDate(comparison.compareVersion.createdAt)}</p>
                <p className="text-sm font-medium mt-2">{formatCurrency(comparison.compareVersion.totalEstimatedCost)}</p>
              </div>
            </div>

            {/* Cost Changes */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">Cost Changes</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Cost Variance:</span>
                  <span className={`ml-2 text-sm font-medium ${
                    comparison.changes.costVariance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparison.changes.costVariance >= 0 ? '+' : ''}{formatCurrency(comparison.changes.costVariance)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Percentage:</span>
                  <span className={`ml-2 text-sm font-medium ${
                    comparison.changes.costVariancePercentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparison.changes.costVariancePercentage >= 0 ? '+' : ''}{comparison.changes.costVariancePercentage.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Element Changes */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">Element Changes</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Added Elements:</span>
                  <span className="font-medium text-green-600">{comparison.changes.elementChanges.added.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Removed Elements:</span>
                  <span className="font-medium text-red-600">{comparison.changes.elementChanges.removed.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Modified Elements:</span>
                  <span className="font-medium text-yellow-600">{comparison.changes.elementChanges.modified.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Rollback Modal */}
      <Modal
        isOpen={showRollbackModal}
        onClose={() => setShowRollbackModal(false)}
        title="Rollback Version"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Warning</h4>
            <p className="text-sm text-yellow-700">
              This will create a new draft version based on the selected version. 
              All changes made after this version will be preserved in the current version.
            </p>
          </div>
          
          {selectedVersion && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Rollback Details</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Version: {selectedVersion.versionNumber}</li>
                <li>• Name: {selectedVersion.name}</li>
                <li>• Status: {selectedVersion.status}</li>
                <li>• Total Cost: {formatCurrency(selectedVersion.totalEstimatedCost)}</li>
              </ul>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rollback Reason *
            </label>
            <textarea
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Explain why you're rolling back to this version..."
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setShowRollbackModal(false)}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRollback}
              variant="danger"
              size="sm"
              disabled={!rollbackReason.trim() || submitting}
            >
              {submitting ? 'Rolling Back...' : 'Rollback'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Comments Modal */}
      <Modal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        title="Version Comments"
      >
        <div className="space-y-4">
          {selectedVersion && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Version Details</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Version: {selectedVersion.versionNumber}</li>
                <li>• Name: {selectedVersion.name}</li>
                <li>• Status: {selectedVersion.status}</li>
              </ul>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-2">
              {(commentsByVersion[selectedVersion?.id] || []).map((c, idx) => (
                <div key={c.id || idx} className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-blue-700">{c.authorName}</span>
                    <span className="text-xs text-gray-500">({c.authorRole})</span>
                    <span className="text-xs text-gray-400 ml-2">{formatDate(c.createdAt)}</span>
                    <span className="ml-2 text-xs text-gray-500">[{c.commentType}]</span>
                  </div>
                  <div className="text-sm text-gray-800">{c.comment}</div>
                </div>
              ))}
              {commentsByVersion[selectedVersion?.id]?.length === 0 && (
                <div className="text-xs text-gray-400">No comments yet.</div>
              )}
            </div>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add a new comment..."
            />
            <div className="flex justify-end space-x-2 mt-2">
              <Button
                onClick={() => setShowCommentsModal(false)}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedVersion || !newComment.trim()) return;
                  setAddingComment(true);
                  await boeCommentsApi.createComment(selectedVersion.id, {
                    commentType: 'General', // or let user pick
                    comment: newComment.trim(),
                    authorName: 'Current User', // TODO: get from auth
                    authorRole: 'User', // TODO: get from auth
                  });
                  setNewComment('');
                  setAddingComment(false);
                  fetchComments(selectedVersion.id);
                }}
                variant="primary"
                size="sm"
                disabled={addingComment || !newComment.trim()}
              >
                {addingComment ? 'Adding...' : 'Add Comment'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BOEHistory; 