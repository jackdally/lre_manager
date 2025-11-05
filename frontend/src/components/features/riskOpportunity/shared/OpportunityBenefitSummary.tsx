import React from 'react';
import { formatCurrency } from '../../../../utils/currencyUtils';
import type { Opportunity } from '../../../../store/riskOpportunityStore';
import { isOpportunityActive, isOpportunityClosed, isOpportunityRealized } from './dispositionHelpers';

interface OpportunityBenefitSummaryProps {
  opportunities: Opportunity[];
}

/**
 * Opportunity Benefit Summary Component
 * Displays total expected benefit of all active opportunities, breakdown by category, and top 10 opportunities
 */
export const OpportunityBenefitSummary: React.FC<OpportunityBenefitSummaryProps> = ({ opportunities }) => {
  // Filter active opportunities (not closed and not realized)
  const activeOpportunities = opportunities.filter(
    (opp) => isOpportunityActive(opp.disposition)
  );

  // Separate closed opportunities from realized opportunities
  const closedOpportunities = opportunities.filter((opp) => isOpportunityClosed(opp.disposition));
  const realizedOpportunities = opportunities.filter((opp) => isOpportunityRealized(opp.disposition));

  // Calculate total expected benefit
  const totalExpectedBenefit = activeOpportunities.reduce(
    (sum, opp) => sum + (opp.expectedBenefit || 0),
    0
  );

  // Calculate breakdown by category
  const categoryBreakdown = activeOpportunities.reduce((acc, opp) => {
    const categoryName = opp.category?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = { count: 0, totalExpectedBenefit: 0 };
    }
    acc[categoryName].count++;
    acc[categoryName].totalExpectedBenefit += opp.expectedBenefit || 0;
    return acc;
  }, {} as Record<string, { count: number; totalExpectedBenefit: number }>);

  // Get top 10 opportunities by expected benefit
  const topOpportunities = [...activeOpportunities]
    .sort((a, b) => (b.expectedBenefit || 0) - (a.expectedBenefit || 0))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Total Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Total Expected Benefit</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Total Expected Benefit</p>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(totalExpectedBenefit)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Sum of all active opportunities
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Active Opportunities</p>
            <p className="text-2xl font-bold text-green-900">
              {activeOpportunities.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {closedOpportunities.length} closed, {realizedOpportunities.length} realized
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Average Expected Benefit</p>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(activeOpportunities.length > 0 ? totalExpectedBenefit / activeOpportunities.length : 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Per opportunity
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
              .sort((a, b) => b[1].totalExpectedBenefit - a[1].totalExpectedBenefit)
              .map(([category, data]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{category}</p>
                    <p className="text-sm text-gray-600">{data.count} opportunity{data.count !== 1 ? 'ies' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(data.totalExpectedBenefit)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {totalExpectedBenefit > 0
                        ? ((data.totalExpectedBenefit / totalExpectedBenefit) * 100).toFixed(1)
                        : 0}% of total
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Top 10 Opportunities */}
      {topOpportunities.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Opportunities by Expected Benefit</h3>
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
                    Benefit Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Benefit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opportunity Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topOpportunities.map((opp, index) => (
                  <tr key={opp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{opp.title}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {opp.category?.name || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {opp.benefitSeverity}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(opp.expectedBenefit || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatCurrency(opp.opportunityScore || 0)}
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

