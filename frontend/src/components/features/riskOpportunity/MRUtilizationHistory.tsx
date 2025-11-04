import React from 'react';
import { CalendarIcon, DocumentTextIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
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

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">MR Utilization History</h4>
          <div className="text-sm text-gray-600">
            Total Utilized: <span className="font-semibold text-gray-900">
              {formatCurrency(managementReserve.utilizedAmount || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {utilizationHistory.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <CurrencyDollarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No MR utilization history yet</p>
          </div>
        ) : (
          utilizationHistory.map((entry) => {
            const riskInfo = getRiskInfo(entry);
            
            return (
              <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span>
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        entry.type === 'Utilization'
                          ? 'bg-red-100 text-red-800'
                          : entry.type === 'Adjustment'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {entry.type}
                      </span>
                      {riskInfo.isRiskRelated && (
                        <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
                          Risk-Related
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-start space-x-2 mb-1">
                      <DocumentTextIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entry.reason}</p>
                        {riskInfo.riskTitle && (
                          <p className="text-xs text-purple-700 mt-1">
                            Related Risk: {riskInfo.riskTitle}
                          </p>
                        )}
                        {entry.description && (
                          <p className="text-xs text-gray-600 mt-1">{entry.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 text-right flex-shrink-0">
                    <p className={`text-lg font-semibold ${
                      entry.type === 'Utilization' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {entry.type === 'Utilization' ? '-' : '+'}
                      {formatCurrency(entry.amount)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      {utilizationHistory.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Remaining MR</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(managementReserve.remainingAmount || 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Utilization %</p>
              <p className="text-lg font-semibold text-gray-900">
                {(managementReserve.utilizationPercentage || 0).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Entries</p>
              <p className="text-lg font-semibold text-gray-900">
                {utilizationHistory.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MRUtilizationHistory;

