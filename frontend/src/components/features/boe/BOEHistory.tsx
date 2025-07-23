import React, { useState, useEffect } from 'react';
import { useBOEStore } from '../../../store/boeStore';
import { boeVersionsApi } from '../../../services/boeApi';
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

const BOEHistory: React.FC<BOEHistoryProps> = ({ programId }) => {
  const { currentBOE } = useBOEStore();
  
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
      
      await boeVersionsApi.rollbackVersion(selectedVersion.id, {
        rollbackReason: rollbackReason.trim(),
        createNewVersion: true
      });
      
      setShowRollbackModal(false);
      setRollbackReason('');
      setSelectedVersion(null);
      
      // Reload version history
      await loadVersionHistory();
      
      // Show success message
      alert('Rollback completed successfully! A new draft version has been created.');
    } catch (error) {
      console.error('Error rolling back version:', error);
      setError('Failed to rollback version');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComments = async () => {
    if (!selectedVersion) return;
    
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
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading version history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading History</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadVersionHistory} variant="primary" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!versionHistory || versionHistory.allVersions.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Version History</h3>
          <p className="text-gray-600">
            No previous versions found for this BOE. Version history will appear here once you create additional versions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">BOE Version History</h3>
          <p className="text-sm text-gray-600">
            Track changes and compare versions of your BOE
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowCommentsModal(true)}
            variant="secondary"
            size="sm"
            className="flex items-center space-x-1"
          >
            <ChatBubbleLeftIcon className="h-4 w-4" />
            <span>Add Comments</span>
          </Button>
        </div>
      </div>

      {/* Version Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-md font-medium text-gray-900">Version Timeline</h4>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {versionHistory.timeline.map((version, index) => (
              <div
                key={version.id}
                className={`flex items-center space-x-4 p-4 rounded-lg border ${
                  version.isCurrent ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                {/* Version Number */}
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    version.isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {version.position}
                  </div>
                </div>

                {/* Version Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h5 className="text-sm font-medium text-gray-900">
                      {version.name} (v{version.versionNumber})
                    </h5>
                    {version.isCurrent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span>{formatDate(version.createdAt)}</span>
                    <span>by {version.createdBy || 'Unknown'}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(version.status)}`}>
                      {getStatusIcon(version.status)}
                      <span className="ml-1">{version.status}</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex space-x-2">
                  <Button
                    onClick={() => {
                      setSelectedVersion(version);
                      setShowCommentsModal(true);
                    }}
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <ChatBubbleLeftIcon className="h-3 w-3" />
                    <span>Comments</span>
                  </Button>
                  
                  {index > 0 && (
                    <Button
                      onClick={() => handleCompareVersions(version.id, versionHistory.timeline[index - 1].id)}
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <EyeIcon className="h-3 w-3" />
                      <span>Compare</span>
                    </Button>
                  )}
                  
                  {version.status !== 'Draft' && !version.isCurrent && (
                    <Button
                      onClick={() => {
                        setSelectedVersion(version);
                        setShowRollbackModal(true);
                      }}
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1 text-orange-600 hover:text-orange-700"
                    >
                      <ArrowPathIcon className="h-3 w-3" />
                      <span>Rollback</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Version Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Version Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Versions:</span>
              <span className="text-sm font-medium">{versionHistory.allVersions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current Version:</span>
              <span className="text-sm font-medium">{versionHistory.currentVersion.versionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Latest Cost:</span>
              <span className="text-sm font-medium">{formatCurrency(versionHistory.currentVersion.totalEstimatedCost)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Change Tracking</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Modified:</span>
              <span className="text-sm font-medium">{formatDate(versionHistory.currentVersion.updatedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Created:</span>
              <span className="text-sm font-medium">{formatDate(versionHistory.currentVersion.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(versionHistory.currentVersion.status)}`}>
                {getStatusIcon(versionHistory.currentVersion.status)}
                <span className="ml-1">{versionHistory.currentVersion.status}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Quick Actions</h4>
          <div className="space-y-2">
            <Button
              onClick={() => {
                setSelectedVersion(versionHistory.currentVersion);
                setShowCommentsModal(true);
              }}
              variant="secondary"
              size="sm"
              className="w-full justify-center"
            >
              <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
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
                className="w-full justify-center"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Compare with Previous
              </Button>
            )}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Add comments about this version..."
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setShowCommentsModal(false)}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateComments}
              variant="primary"
              size="sm"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Comments'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BOEHistory; 