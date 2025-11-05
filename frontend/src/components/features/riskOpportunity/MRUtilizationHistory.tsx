import React, { useMemo } from 'react';
import { CalendarIcon, DocumentTextIcon, CurrencyDollarIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../../utils/currencyUtils';
import { ManagementReserve } from '../../../store/boeStore';

interface UtilizationHistoryEntry {
  id: string;
  date: string;
  amount: number;
  reason: string;
  description?: string;
  type: 'Utilization' | 'Adjustment' | 'Reallocation';
}

interface MRUtilizationHistoryProps {
  utilizationHistory: UtilizationHistoryEntry[];
  managementReserve: ManagementReserve;
}

const MRUtilizationHistory: React.FC<MRUtilizationHistoryProps> = ({
  utilizationHistory,
  managementReserve,
}) => {
  // Parse risk information from MR notes if available
  const parseRiskFromNotes = (notes: string | null): { riskTitle?: string; isRiskRelated: boolean } => {
    if (!notes) return { isRiskRelated: false };
    
    // Look for pattern: "Utilized $X for Risk: "Title""
    const riskMatch = notes.match(/Utilized \$[\d,]+\.?\d* for Risk: "([^"]+)"/);
    if (riskMatch) {
      return {
        riskTitle: riskMatch[1],
        isRiskRelated: true,
      };
    }
    
    return { isRiskRelated: false };
  };

  const getRiskInfo = (entry: UtilizationHistoryEntry) => {
    // Try to extract risk info from MR notes
    // Note: In future, we'll enhance the history endpoint to include risk data directly
    if (managementReserve.notes) {
      const riskInfo = parseRiskFromNotes(managementReserve.notes);
      return riskInfo;
    }
    return { isRiskRelated: false };
  };

  // Sort history by date (newest first)
  const sortedHistory = useMemo(() => {
    return [...utilizationHistory].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [utilizationHistory]);

  // Calculate utilization statistics
  const stats = useMemo(() => {
    const totalUtilized = managementReserve.utilizedAmount || 0;
    const baselineAmount = managementReserve.adjustedAmount || managementReserve.baselineAmount || 0;
    const remaining = managementReserve.remainingAmount || 0;
    const utilizationPercentage = baselineAmount > 0 ? (totalUtilized / baselineAmount) * 100 : 0;
    const riskRelatedCount = sortedHistory.filter(entry => {
      const riskInfo = getRiskInfo(entry);
      return riskInfo.isRiskRelated;
    }).length;

    return {
      totalUtilized,
      baselineAmount,
      remaining,
      utilizationPercentage,
      riskRelatedCount,
      totalEntries: sortedHistory.length
    };
  }, [managementReserve, sortedHistory]);

  // Get utilization status color
  const getUtilizationStatus = () => {
    if (stats.utilizationPercentage >= 90) return { status: 'Critical', color: 'red', icon: ExclamationTriangleIcon };
    if (stats.utilizationPercentage >= 75) return { status: 'High', color: 'yellow', icon: ExclamationTriangleIcon };
    if (stats.utilizationPercentage >= 50) return { status: 'Moderate', color: 'blue', icon: InformationCircleIcon };
    return { status: 'Low', color: 'green', icon: InformationCircleIcon };
  };

  const utilizationStatus = getUtilizationStatus();
  const StatusIcon = utilizationStatus.icon;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header with Summary */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-blue-600" />
            MR Utilization History
          </h4>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            utilizationStatus.color === 'red' ? 'bg-red-100 text-red-800' :
            utilizationStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            utilizationStatus.color === 'blue' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {utilizationStatus.status} Utilization
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-600">Utilization %</p>
            <p className={`text-sm font-semibold ${
              stats.utilizationPercentage >= 90 ? 'text-red-600' :
              stats.utilizationPercentage >= 75 ? 'text-yellow-600' :
              stats.utilizationPercentage >= 50 ? 'text-blue-600' :
              'text-green-600'
            }`}>
              {stats.utilizationPercentage.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-600">Risk-Related</p>
            <p className="text-sm font-semibold text-purple-600">
              {stats.riskRelatedCount} / {stats.totalEntries}
            </p>
          </div>
        </div>
      </div>

      {/* History Entries */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {sortedHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-600 mb-1">No MR Utilization History</p>
            <p className="text-xs text-gray-500">
              When risks materialize and MR is utilized, entries will appear here
            </p>
          </div>
        ) : (
          sortedHistory.map((entry, index) => {
            const riskInfo = getRiskInfo(entry);
            
            return (
              <div key={entry.id} className={`p-4 hover:bg-gray-50 transition-colors ${
                index === 0 ? 'bg-blue-50/30' : ''
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <CalendarIcon className="h-3 w-3 text-gray-400" />
                        <span className="font-medium">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {new Date(entry.date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        entry.type === 'Utilization'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : entry.type === 'Adjustment'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        {entry.type}
                      </span>
                      {riskInfo.isRiskRelated && (
                        <span className="text-xs px-2 py-0.5 rounded font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          🔗 Risk-Linked
                        </span>
                      )}
                      {index === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          Most Recent
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <DocumentTextIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{entry.reason}</p>
                        {riskInfo.riskTitle && (
                          <div className="bg-purple-50 border border-purple-200 rounded p-2 mt-1 mb-1">
                            <p className="text-xs font-medium text-purple-900 mb-0.5">Related Risk:</p>
                            <p className="text-xs text-purple-800">{riskInfo.riskTitle}</p>
                          </div>
                        )}
                        {entry.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{entry.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 text-right flex-shrink-0">
                    <p className={`text-lg font-bold ${
                      entry.type === 'Utilization' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {entry.type === 'Utilization' ? '-' : '+'}
                      {formatCurrency(entry.amount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {((entry.amount / stats.baselineAmount) * 100).toFixed(2)}% of baseline
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* High Utilization Warning */}
      {sortedHistory.length > 0 && stats.utilizationPercentage >= 75 && (
        <div className="p-4 border-t border-gray-200 bg-yellow-50">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-xs text-yellow-800 flex items-center">
              <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
              <strong>High Utilization Warning:</strong> {stats.utilizationPercentage.toFixed(1)}% of MR has been utilized.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MRUtilizationHistory;

