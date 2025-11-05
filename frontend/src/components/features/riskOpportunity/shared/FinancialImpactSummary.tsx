import React from 'react';
import { formatCurrency } from '../../../../utils/currencyUtils';
import type { Risk } from '../../../../store/riskOpportunityStore';
import { isRiskActive, isRiskClosed, isRiskRealized } from './dispositionHelpers';

interface FinancialImpactSummaryProps {
  risks: Risk[];
}

/**
 * Financial Impact Summary Component
 * Displays total expected value of all active risks, breakdown by category, and top 10 risks
 */
export const FinancialImpactSummary: React.FC<FinancialImpactSummaryProps> = ({ risks }) => {
  // Filter active risks (not closed and not realized)
  const activeRisks = risks.filter(
    (risk) => isRiskActive(risk.disposition)
  );

  // Separate closed risks (avoided) from realized risks (occurred)
  const closedRisks = risks.filter((risk) => isRiskClosed(risk.disposition));
  const realizedRisks = risks.filter((risk) => isRiskRealized(risk.disposition));

  // Calculate total expected value
  const totalExpectedValue = activeRisks.reduce(
    (sum, risk) => sum + (risk.expectedValue || 0),
    0
  );

  // Calculate breakdown by category
  const categoryBreakdown = activeRisks.reduce((acc, risk) => {
    const categoryName = risk.category?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = { count: 0, totalExpectedValue: 0 };
    }
    acc[categoryName].count++;
    acc[categoryName].totalExpectedValue += risk.expectedValue || 0;
    return acc;
  }, {} as Record<string, { count: number; totalExpectedValue: number }>);

  // Get top 10 risks by expected value
  const topRisks = [...activeRisks]
    .sort((a, b) => (b.expectedValue || 0) - (a.expectedValue || 0))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Total Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Total Financial Impact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Total Expected Value</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(totalExpectedValue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Sum of all active risks
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Active Risks</p>
            <p className="text-2xl font-bold text-blue-900">
              {activeRisks.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {closedRisks.length} closed, {realizedRisks.length} realized
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Average Expected Value</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(activeRisks.length > 0 ? totalExpectedValue / activeRisks.length : 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Per risk
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Breakdown by Category</h3>
          <div className="space-y-3">
            {Object.entries(categoryBreakdown)
              .sort((a, b) => b[1].totalExpectedValue - a[1].totalExpectedValue)
              .map(([category, data]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{category}</p>
                    <p className="text-sm text-gray-600">{data.count} risk{data.count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(data.totalExpectedValue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {totalExpectedValue > 0
                        ? ((data.totalExpectedValue / totalExpectedValue) * 100).toFixed(1)
                        : 0}% of total
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Top 10 Risks */}
      {topRisks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Risks by Expected Value</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topRisks.map((risk, index) => (
                  <tr key={risk.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{risk.title}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {risk.category?.name || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {risk.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(risk.expectedValue || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-red-600">
                      {formatCurrency(risk.riskScore || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

