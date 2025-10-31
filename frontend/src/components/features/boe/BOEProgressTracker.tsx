import React, { useMemo } from 'react';
import BOECalculationService from '../../../services/boeCalculationService';
import { BOEElement, BOEElementAllocation } from '../../../store/boeStore';
import { useManagementReserve } from '../../../hooks/useManagementReserve';

type StepStatus = 'locked' | 'not-started' | 'in-progress' | 'ready' | 'complete';

interface BOEProgressTrackerProps {
  boeVersionId?: string;
  currentBOE: any | null;
  elements: BOEElement[];
  elementAllocations: BOEElementAllocation[];
  onNavigate: (tab: 'overview' | 'details' | 'management-reserve') => void;
}

const statusClasses: Record<StepStatus, string> = {
  locked: 'bg-gray-100 text-gray-400 border-gray-200',
  'not-started': 'bg-gray-100 text-gray-700 border-gray-200',
  'in-progress': 'bg-yellow-50 text-yellow-800 border-yellow-200',
  ready: 'bg-blue-50 text-blue-800 border-blue-200',
  complete: 'bg-green-50 text-green-800 border-green-200',
};

const BOEProgressTracker: React.FC<BOEProgressTrackerProps> = ({
  boeVersionId,
  currentBOE,
  elements,
  elementAllocations,
  onNavigate,
}) => {
  const { managementReserve } = useManagementReserve(currentBOE?.id);

  const { steps, percentage } = useMemo(() => {
    const hierarchical = elements && elements.length > 0
      ? BOECalculationService.buildHierarchicalStructure(elements)
      : [];

    // Validation for WBS
    const validation = hierarchical.length > 0
      ? BOECalculationService.validateBOEStructure(hierarchical)
      : { isValid: false, errors: [] as string[] };

    // Helper: required leaf elements
    const requiredLeaves: BOEElement[] = (() => {
      const req: BOEElement[] = [];
      const walk = (els: BOEElement[]) => {
        els.forEach(el => {
          const hasChildren = !!(el.childElements && el.childElements.length > 0);
          if (!hasChildren) {
            if (el.isRequired) req.push(el);
          } else if (el.childElements) {
            walk(el.childElements);
          }
        });
      };
      if (hierarchical.length > 0) walk(hierarchical);
      return req;
    })();

    // Allocation coverage
    const allocatedRequiredLeaves = requiredLeaves.filter(leaf =>
      elementAllocations.some(a => a.boeElementId === leaf.id && (a.totalAmount || 0) > 0)
    ).length;

    // MR is considered addressed when there is a real MR record
    // with justification. Amount may be zero (explicitly justified 0%).
    const mrAmount = Number(managementReserve?.adjustedAmount ?? managementReserve?.baselineAmount ?? 0);
    const mrJustification = (managementReserve?.justification || '').trim();
    const hasMRRecord = !!managementReserve;
    const hasMRJustification = mrJustification.length > 0;
    const mrAddressed = hasMRRecord && hasMRJustification; // amount can be 0 or greater

    // Determine step statuses
    const wbsStatus: StepStatus = elements.length === 0
      ? 'not-started'
      : validation.isValid
        ? 'complete'
        : 'in-progress';

    const allocStatus: StepStatus = !validation.isValid
      ? 'locked'
      : requiredLeaves.length === 0
        ? 'complete'
        : allocatedRequiredLeaves === 0
          ? 'not-started'
          : allocatedRequiredLeaves < requiredLeaves.length
            ? 'in-progress'
            : 'complete';

    const mrStatus: StepStatus = !validation.isValid
      ? 'locked'
      : mrAddressed
        ? 'complete'
        : hasMRRecord
          ? 'in-progress' // started but missing justification
          : 'not-started';

    const reviewStatus: StepStatus = (() => {
      if (!validation.isValid) return 'locked';
      const missingRequiredAlloc = requiredLeaves.length - allocatedRequiredLeaves;
      if (missingRequiredAlloc > 0) return 'in-progress';
      // Require MR to be addressed (record + justification) before Review is ready
      if (!mrAddressed) return 'in-progress';
      if (['Under Review', 'Baseline', 'Approved'].includes(currentBOE?.status)) return 'complete';
      return 'ready';
    })();

    const steps = [
      { key: 'wbs' as const, label: 'Define WBS', status: wbsStatus, to: 'details' as const },
      { key: 'alloc' as const, label: 'Create Allocations', status: allocStatus, to: 'details' as const },
      { key: 'mr' as const, label: 'Set MR', status: mrStatus, to: 'management-reserve' as const },
      { key: 'review' as const, label: 'Review & Submit', status: reviewStatus, to: 'overview' as const },
    ];

    const statusScore: Record<StepStatus, number> = {
      locked: 0,
      'not-started': 0,
      'in-progress': 0.5,
      ready: 0.9,
      complete: 1,
    };
    const pct = Math.round(
      (steps.reduce((s, st) => s + statusScore[st.status], 0) / steps.length) * 100
    );

    return { steps, percentage: pct };
  }, [elements, elementAllocations, currentBOE, managementReserve]);

  return (
    <div className="px-6 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">BOE Progress</div>
        <div className="text-sm font-medium text-gray-900">{percentage}% Complete</div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {steps.map(step => (
          <button
            key={step.key}
            onClick={() => onNavigate(step.to)}
            className={`w-full border rounded-md px-3 py-2 text-left transition-colors ${statusClasses[step.status]}`}
            title={step.label}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{step.label}</span>
              <span className="text-xs opacity-75 capitalize">{step.status.replace('-', ' ')}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BOEProgressTracker;

