import React, { useState } from 'react';
import Modal from '../../common/Modal';
import { DISPOSITION_DEFINITIONS, RISK_DISPOSITION_TRANSITIONS, OPPORTUNITY_DISPOSITION_TRANSITIONS } from './shared/dispositionHelpers';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface DispositionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DispositionInfoModal: React.FC<DispositionInfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'risk' | 'opportunity'>('risk');

  const riskDispositions = DISPOSITION_DEFINITIONS.filter(
    d => d.category === 'risk' || d.category === 'both'
  );
  const opportunityDispositions = DISPOSITION_DEFINITIONS.filter(
    d => d.category === 'opportunity' || d.category === 'both'
  );

  const renderFlowchart = (type: 'risk' | 'opportunity') => {
    const transitions = type === 'risk' ? RISK_DISPOSITION_TRANSITIONS : OPPORTUNITY_DISPOSITION_TRANSITIONS;
    const dispositions = type === 'risk' ? riskDispositions : opportunityDispositions;
    
    // Group dispositions by stage
    const activeStates = ['Identified', 'In Progress'];
    const terminalStates = ['Realized'];
    const closureStates = ['Retired', 'Mitigated', 'Transferred', 'Accepted', 'Lost', 'Deferred'];

    const getStateColor = (state: string) => {
      if (activeStates.includes(state)) return 'bg-blue-50 border-blue-200 text-blue-900';
      // Realized is terminal but good for opportunities, bad for risks
      if (state === 'Realized') {
        return type === 'risk' 
          ? 'bg-red-50 border-red-200 text-red-900'
          : 'bg-green-50 border-green-200 text-green-900';
      }
      if (closureStates.includes(state)) return 'bg-gray-50 border-gray-200 text-gray-900';
      return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    };

    // Get context-specific description for a disposition
    const getContextualDescription = (def: { value: string; label: string; description: string; category: string }) => {
      if (type === 'risk') {
        // Risk-specific descriptions
        switch (def.value) {
          case 'Identified':
            return 'Risk has been identified but no action has been taken yet.';
          case 'In Progress':
            return 'Active work is being done to mitigate the risk.';
          case 'Realized':
            return 'Risk has occurred (materialized). This is a terminal state indicating the risk has materialized. MR was used to cover the cost. Can only be reversed to "In Progress" by reversing MR utilization.';
          case 'Retired':
            return 'Risk has been mitigated and closed out. Can be reopened if needed.';
          case 'Mitigated':
            return 'Risk has been successfully mitigated through preventive or corrective actions.';
          case 'Transferred':
            return 'Risk has been transferred to another party (e.g., via insurance or contract).';
          case 'Accepted':
            return 'Risk has been accepted (acknowledged but no mitigation actions will be taken).';
          default:
            return def.description;
        }
      } else {
        // Opportunity-specific descriptions
        switch (def.value) {
          case 'Identified':
            return 'Opportunity has been identified but no action has been taken yet.';
          case 'In Progress':
            return 'Active work is being done to realize the opportunity.';
          case 'Realized':
            return 'Opportunity has been successfully captured. This is a terminal state indicating the opportunity has materialized. Can only be reversed to "In Progress" if needed.';
          case 'Retired':
            return 'Opportunity is no longer relevant and has been closed out. Can be reopened if needed.';
          case 'Deferred':
            return 'Opportunity is being deferred to a later time or phase.';
          case 'Lost':
            return 'Opportunity was not captured or is no longer available. Can be reopened if the opportunity becomes available again.';
          default:
            return def.description;
        }
      }
    };

    return (
      <div className="space-y-6">
        {/* Status Definitions */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Status Definitions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dispositions.map(def => {
              const isActive = activeStates.includes(def.value);
              const isTerminal = terminalStates.includes(def.value);
              const isClosure = closureStates.includes(def.value);
              
                return (
                  <div
                    key={def.value}
                    className={`${getStateColor(def.value)} rounded-lg border-2 p-4`}
                  >
                    <div className="font-bold text-base mb-2">{def.label}</div>
                    <div className="text-sm text-gray-700 leading-relaxed">{getContextualDescription(def)}</div>
                  </div>
                );
            })}
          </div>
        </div>

        {/* Transition Flow */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Transition Flow</h3>
          <div className="space-y-4">
            {Object.entries(transitions)
              .sort(([a], [b]) => {
                // Sort by: Active states first, then terminal, then closure
                const getOrder = (state: string) => {
                  if (activeStates.includes(state)) return 0;
                  if (terminalStates.includes(state)) return 1;
                  return 2;
                };
                return getOrder(a) - getOrder(b);
              })
              .map(([fromState, toStates]) => {
                const fromDef = dispositions.find(d => d.value === fromState);
                if (!fromDef) return null;
                
                const stateColor = getStateColor(fromState);
                
                return (
                  <div
                    key={fromState}
                    className={`${stateColor} rounded-lg border-2 p-4`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-bold text-lg mb-1">{fromDef.label}</div>
                        <div className="text-sm text-gray-700">{getContextualDescription(fromDef)}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Can transition to:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {toStates.map(toState => {
                          const toDef = dispositions.find(d => d.value === toState);
                          return (
                            <span
                              key={toState}
                              className="inline-block bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                              title={toDef?.description}
                            >
                              {toState}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Key Notes */}
        <div className={`${type === 'risk' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4`}>
          <div className="flex items-start">
            <InformationCircleIcon className={`h-5 w-5 ${type === 'risk' ? 'text-blue-600' : 'text-green-600'} mr-3 mt-0.5 flex-shrink-0`} />
            <div className={`text-sm ${type === 'risk' ? 'text-blue-800' : 'text-green-800'}`}>
              <p className="font-semibold mb-2">Key Notes for {type === 'risk' ? 'Risks' : 'Opportunities'}:</p>
              <ul className="list-disc list-inside space-y-1.5">
                {type === 'risk' ? (
                  <>
                    <li><strong>Realized</strong> is a terminal state - the risk has occurred and Management Reserve (MR) was used to cover the cost. Can only be reversed to "In Progress" (which automatically reverses MR utilization).</li>
                    <li><strong>Retired</strong> is for risks that were successfully mitigated and then closed out - not for realized risks.</li>
                    <li><strong>Mitigated</strong> means the risk was prevented or reduced through active measures.</li>
                    <li><strong>Transferred</strong> means the risk was moved to another party (insurance, contractor, etc.).</li>
                    <li><strong>Accepted</strong> means the risk is acknowledged but no mitigation actions will be taken.</li>
                    <li>Most states can be reversed to "In Progress" or "Identified" to correct mistakes.</li>
                    <li>Materializing a risk (using MR) automatically transitions it to "Realized".</li>
                  </>
                ) : (
                  <>
                    <li><strong>Realized</strong> is a terminal state - the opportunity has been successfully captured and the benefit has been obtained. This is a positive outcome.</li>
                    <li><strong>Deferred</strong> means the opportunity is being postponed to a later time or phase.</li>
                    <li><strong>Lost</strong> means the opportunity was not captured or is no longer available.</li>
                    <li><strong>Retired</strong> means the opportunity is no longer relevant and has been closed out.</li>
                    <li>Most states can be reversed to "In Progress" or "Identified" to correct mistakes.</li>
                    <li>Retired or lost opportunities can be reopened if the opportunity becomes available again.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disposition Status Guide"
      size="xl"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('risk')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'risk'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Risks
            </button>
            <button
              onClick={() => setActiveTab('opportunity')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'opportunity'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Opportunities
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="max-h-[65vh] overflow-y-auto pr-2">
          {renderFlowchart(activeTab)}
        </div>
      </div>
    </Modal>
  );
};

export default DispositionInfoModal;

