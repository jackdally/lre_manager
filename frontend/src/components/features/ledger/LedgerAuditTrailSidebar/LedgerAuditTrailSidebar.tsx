import React, { useEffect, useState } from 'react';
import { XMarkIcon, ClockIcon, UserIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { AuditTrailService, AuditTrailResponse } from '../../../../services/auditTrailService';
import { LedgerAuditTrail } from '../../../../types/auditTrail';

interface LedgerAuditTrailSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerEntryId: string | null;
  ledgerEntryData?: {
    vendor_name?: string;
    expense_description?: string;
    planned_amount?: number;
    planned_date?: string;
    boeElementAllocationId?: string;
    boeVersionId?: string;
    createdFromBOE?: boolean;
  };
  onNavigateToBOE?: (boeVersionId: string, allocationId?: string) => void;
}

const LedgerAuditTrailSidebar: React.FC<LedgerAuditTrailSidebarProps> = ({
  isOpen,
  onClose,
  ledgerEntryId,
  ledgerEntryData,
  onNavigateToBOE
}) => {
  const [auditTrail, setAuditTrail] = useState<LedgerAuditTrail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && ledgerEntryId) {
      fetchAuditTrail();
    }
  }, [isOpen, ledgerEntryId]);

  const fetchAuditTrail = async () => {
    if (!ledgerEntryId) return;

    setLoading(true);
    setError(null);

    try {
      const response: AuditTrailResponse = await AuditTrailService.getAuditTrailForLedgerEntry(ledgerEntryId);

      if (response.success) {
        setAuditTrail(response.data);
      } else {
        setError(response.error || 'Failed to fetch audit trail');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error fetching audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return <DocumentTextIcon className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <ArrowPathIcon className="h-4 w-4 text-blue-600" />;
      case 'deleted':
        return <XMarkIcon className="h-4 w-4 text-red-600" />;
      case 'pushed_to_ledger':
        return <DocumentTextIcon className="h-4 w-4 text-purple-600" />;
      case 'matched_to_invoice':
        return <DocumentTextIcon className="h-4 w-4 text-orange-600" />;
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return 'Created';
      case 'updated':
        return 'Updated';
      case 'deleted':
        return 'Deleted';
      case 'pushed_to_ledger':
        return 'Pushed to Ledger';
      case 'matched_to_invoice':
        return 'Matched to Invoice';
      case 'split':
        return 'Split';
      case 're_forecasted':
        return 'Re-forecasted';
      default:
        return action;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source.toLowerCase()) {
      case 'manual':
        return 'Manual Entry';
      case 'boe_allocation':
        return 'BOE Allocation';
      case 'boe_push':
        return 'BOE Push';
      case 'invoice_matching':
        return 'Invoice Matching';
      case 'ledger_split':
        return 'Ledger Split';
      case 're_forecasting':
        return 'Re-forecasting';
      default:
        return source;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Audit Trail</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-200 transition-colors"
        >
          <XMarkIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Ledger Entry Info */}
      {ledgerEntryData && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Ledger Entry</h3>
          <div className="space-y-1 text-sm">
            {ledgerEntryData.vendor_name && (
              <div><span className="font-medium">Vendor:</span> {ledgerEntryData.vendor_name}</div>
            )}
            {ledgerEntryData.expense_description && (
              <div><span className="font-medium">Description:</span> {ledgerEntryData.expense_description}</div>
            )}
            {ledgerEntryData.planned_amount && (
              <div><span className="font-medium">Amount:</span> {formatCurrency(ledgerEntryData.planned_amount)}</div>
            )}
            {ledgerEntryData.planned_date && (
              <div><span className="font-medium">Date:</span> {new Date(ledgerEntryData.planned_date).toLocaleDateString()}</div>
            )}
          </div>
        </div>
      )}

      {/* BOE Allocation Info */}
      {ledgerEntryData?.createdFromBOE && ledgerEntryData.boeVersionId && (
        <div className="p-4 border-b border-gray-200 bg-green-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">BOE Allocation</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Created from BOE allocation</span>
              <button
                onClick={() => onNavigateToBOE?.(ledgerEntryData.boeVersionId!, ledgerEntryData.boeElementAllocationId)}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
              >
                <DocumentTextIcon className="h-3 w-3" />
                View BOE
              </button>
            </div>
            {ledgerEntryData.boeElementAllocationId && (
              <div className="text-xs text-gray-500">
                Allocation ID: {ledgerEntryData.boeElementAllocationId.substring(0, 8)}...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading audit trail...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <div className="text-red-600 text-sm">{error}</div>
            <button
              onClick={fetchAuditTrail}
              className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : auditTrail.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No audit trail found for this ledger entry.</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {auditTrail.map((entry, index) => (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getActionIcon(entry.action)}
                    <span className="font-medium text-sm">{getActionLabel(entry.action)}</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(entry.createdAt)}</span>
                </div>

                {entry.description && (
                  <div className="mb-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {entry.description}
                  </div>
                )}

                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Source:</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                      {getSourceLabel(entry.source)}
                    </span>
                  </div>

                  {entry.userId && (
                    <div className="flex items-center gap-1">
                      <UserIcon className="h-3 w-3" />
                      <span>User: {entry.userId}</span>
                    </div>
                  )}

                  {entry.sessionId && (
                    <div className="text-xs text-gray-500">
                      Session: {entry.sessionId.substring(0, 8)}...
                    </div>
                  )}
                </div>

                {/* Show changes if available */}
                {entry.previousValues && entry.newValues && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-xs font-medium text-gray-700 mb-1">Changes:</div>
                    <div className="space-y-1 text-xs">
                      {Object.keys(entry.newValues).map(key => {
                        const oldValue = entry.previousValues?.[key];
                        const newValue = entry.newValues?.[key];

                        if (oldValue === newValue) return null;

                        return (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600">{key}:</span>
                            <div className="text-right">
                              <div className="text-red-600 line-through">{String(oldValue || '--')}</div>
                              <div className="text-green-600">{String(newValue || '--')}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Show metadata if available */}
                {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-xs font-medium text-gray-700 mb-1">Details:</div>
                    <div className="space-y-1 text-xs text-gray-600">
                      {Object.entries(entry.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LedgerAuditTrailSidebar; 