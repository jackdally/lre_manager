import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface WbsCostSummary {
  elementId: string;
  elementCode: string;
  elementName: string;
  level: number;
  parentId?: string;
  baselineTotal: number;
  plannedTotal: number;
  actualTotal: number;
  childCount: number;
  hasChildren: boolean;
  children?: WbsCostSummary[];
}

interface WbsRollupReportData {
  programId: string;
  totalBaseline: number;
  totalPlanned: number;
  totalActual: number;
  elements: WbsCostSummary[];
  summary: {
    baselineVariance: number;
    plannedVariance: number;
    costPerformanceIndex: number;
    schedulePerformanceIndex: number;
  };
}

interface WbsRollupReportProps {
  programId: string;
}

const WbsRollupReport: React.FC<WbsRollupReportProps> = ({ programId }) => {
  const [report, setReport] = useState<WbsRollupReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/programs/${programId}/wbs-report`);
        setReport(response.data as WbsRollupReportData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load WBS report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [programId]);

  const toggleExpansion = (elementId: string) => {
    setExpandedElements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(elementId)) {
        newSet.delete(elementId);
      } else {
        newSet.add(elementId);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600';
    if (variance < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const renderElement = (element: WbsCostSummary, depth: number = 0) => {
    const isExpanded = expandedElements.has(element.elementId);
    const hasChildren = element.children && element.children.length > 0;
    const baselineVariance = element.actualTotal - element.baselineTotal;
    const plannedVariance = element.actualTotal - element.plannedTotal;

    return (
      <div key={element.elementId} className="border-b border-gray-200 last:border-b-0">
        <div 
          className={`
            flex items-center p-3 hover:bg-gray-50 transition-colors
            ${depth > 0 ? 'ml-6' : ''}
          `}
        >
          {/* Expand/collapse button */}
          {hasChildren && (
            <button
              onClick={() => toggleExpansion(element.elementId)}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}
          
          {/* Element info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {element.elementCode}
              </span>
              <span className="font-medium">{element.elementName}</span>
              <span className="text-xs text-gray-500">(Level {element.level})</span>
            </div>
          </div>

          {/* Cost columns */}
          <div className="flex gap-4 text-sm">
            <div className="text-right min-w-[100px]">
              <div className="font-medium">{formatCurrency(element.baselineTotal)}</div>
              <div className={`text-xs ${getVarianceColor(baselineVariance)}`}>
                {baselineVariance !== 0 && (
                  baselineVariance > 0 ? '+' : ''
                )}{formatCurrency(baselineVariance)}
              </div>
            </div>
            <div className="text-right min-w-[100px]">
              <div className="font-medium">{formatCurrency(element.plannedTotal)}</div>
              <div className={`text-xs ${getVarianceColor(plannedVariance)}`}>
                {plannedVariance !== 0 && (
                  plannedVariance > 0 ? '+' : ''
                )}{formatCurrency(plannedVariance)}
              </div>
            </div>
            <div className="text-right min-w-[100px] font-medium">
              {formatCurrency(element.actualTotal)}
            </div>
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {element.children!.map(child => renderElement(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading WBS report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="text-red-800">Error: {error}</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
        <div className="text-gray-600">No WBS report data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold">WBS Cost Roll-up</h3>
      </div>
      
      {/* Table Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex-1 font-medium">WBS Element</div>
          <div className="text-right min-w-[100px] font-medium">Baseline</div>
          <div className="text-right min-w-[100px] font-medium">Planned</div>
          <div className="text-right min-w-[100px] font-medium">Actual</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {report.elements.map(element => renderElement(element))}
      </div>
    </div>
  );
};

export default WbsRollupReport; 