import React from 'react';
import { formatCurrency } from '../../../../utils/currencyUtils';
import { getSeverityColorClass } from '../../../../services/roImpactCalculationService';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface ROImpactBreakdownProps {
  result: {
    amount: number;
    percentage: number;
    baseMR: number;
    baseMRPercentage: number;
    riskAdjustment: number;
    breakdown: Array<{
      riskId: string;
      riskTitle: string;
      costImpact: number;
      probability: number;
      severity: string;
      severityMultiplier: number;
      expectedValue: number;
    }>;
  };
  totalCost: number;
}

const ROImpactBreakdown: React.FC<ROImpactBreakdownProps> = ({ result, totalCost }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
      <div className="flex items-start">
        <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">R&O-Driven Calculation Breakdown</h3>
          <p className="text-sm text-blue-800 mb-4">
            Management Reserve calculated from actual risk data using severity-weighted expected values.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Base MR</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(result.baseMR)}</p>
            <p className="text-xs text-gray-500">{result.baseMRPercentage}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Risk Adjustment</p>
            <p className="text-lg font-semibold text-orange-600">{formatCurrency(result.riskAdjustment)}</p>
            <p className="text-xs text-gray-500">
              {totalCost > 0 ? ((result.riskAdjustment / totalCost) * 100).toFixed(2) : 0}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Final MR</p>
            <p className="text-lg font-semibold text-blue-600">{formatCurrency(result.amount)}</p>
            <p className="text-xs text-gray-500">{result.percentage.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Risks Analyzed</p>
            <p className="text-lg font-semibold text-gray-900">{result.breakdown.length}</p>
            <p className="text-xs text-gray-500">Active risks</p>
          </div>
        </div>
      </div>

      {/* Risk Breakdown Table */}
      {result.breakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-blue-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900">Risk Breakdown</h4>
            <p className="text-xs text-gray-600 mt-1">
              Formula: Expected Value = Probability × Cost Impact × Severity Multiplier
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Risk
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Cost Impact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Probability
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Multiplier
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Expected Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {result.breakdown.map((risk) => (
                  <tr key={risk.riskId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {risk.riskTitle}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(risk.costImpact)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {risk.probability}%
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColorClass(risk.severity as any)}`}>
                        {risk.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {risk.severityMultiplier}x
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-orange-600">
                      {formatCurrency(risk.expectedValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-sm font-medium text-gray-700 text-right">
                    Total Risk Adjustment:
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-orange-600 text-right">
                    {formatCurrency(result.riskAdjustment)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Formula Explanation */}
      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Calculation Formula</h4>
        <div className="space-y-1 text-sm text-gray-700">
          <p>• Expected Value = Probability × Cost Impact × Severity Multiplier</p>
          <p>• Risk Adjustment = Sum of all risk expected values</p>
          <p>• Final MR = Base MR (Standard) + Risk Adjustment</p>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>Severity Multipliers:</strong> Low (0.5x), Medium (1.0x), High (1.5x), Critical (2.0x)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ROImpactBreakdown;

