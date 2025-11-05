import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { useRiskOpportunityStore } from '../../../store/riskOpportunityStore';
import type { Opportunity } from '../../../store/riskOpportunityStore';
import {
  getValidOpportunityDispositions,
  getDispositionDefinition,
  getTransitionExplanation,
  isReversalTransition,
  isFromTerminalState,
  DISPOSITION_DEFINITIONS,
} from './shared/dispositionHelpers';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface OpportunityDispositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  opportunity: Opportunity | null;
  onSave: (opportunity: Opportunity) => void;
}

const OpportunityDispositionModal: React.FC<OpportunityDispositionModalProps> = ({
  isOpen,
  onClose,
  programId,
  opportunity,
  onSave,
}) => {
  const { updateOpportunityDisposition } = useRiskOpportunityStore();
  const [disposition, setDisposition] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [dispositionDate, setDispositionDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get valid next dispositions based on current state
  const validDispositions = opportunity ? getValidOpportunityDispositions(opportunity.disposition) : [];

  useEffect(() => {
    if (isOpen && opportunity) {
      setDisposition(opportunity.disposition);
      setReason('');
      setDispositionDate(new Date().toISOString().split('T')[0]);
      setError(null);
    }
  }, [isOpen, opportunity]);

  // Get selected disposition definition
  const selectedDispositionDef = disposition ? getDispositionDefinition(disposition) : null;
  const transitionExplanation = opportunity && disposition && opportunity.disposition !== disposition
    ? getTransitionExplanation(opportunity.disposition, disposition, 'opportunity')
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!opportunity || !disposition || !reason.trim()) {
      setError('Disposition and reason are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate transition before submitting
      if (!validDispositions.includes(disposition) && disposition !== opportunity.disposition) {
        const explanation = getTransitionExplanation(opportunity.disposition, disposition, 'opportunity');
        setError(explanation);
        return;
      }

      const updatedOpportunity = await updateOpportunityDisposition(
        opportunity.id,
        disposition,
        reason,
        dispositionDate ? new Date(dispositionDate) : undefined
      );
      onSave(updatedOpportunity);
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update disposition';
      // Enhance error message with transition info if it's a transition error
      if (errorMessage.includes('Invalid disposition transition')) {
        const explanation = getTransitionExplanation(opportunity.disposition, disposition, 'opportunity');
        setError(`${errorMessage}. ${explanation}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !opportunity) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Opportunity Disposition" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Disposition
          </label>
          <div className="bg-gray-50 px-3 py-2 rounded-md">
            <p className="text-sm font-medium text-gray-900">{opportunity.disposition}</p>
            {getDispositionDefinition(opportunity.disposition) && (
              <p className="text-xs text-gray-600 mt-1">
                {getDispositionDefinition(opportunity.disposition)!.description}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              New Disposition <span className="text-red-500">*</span>
            </label>
            {validDispositions.length > 0 && (
              <span className="text-xs text-gray-500">
                {validDispositions.length} valid transition{validDispositions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <select
            value={disposition}
            onChange={(e) => {
              setDisposition(e.target.value);
              setError(null); // Clear error when user changes selection
            }}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              transitionExplanation && !transitionExplanation.includes('valid') 
                ? 'border-yellow-400 bg-yellow-50' 
                : 'border-gray-300'
            }`}
            required
          >
            <option value={opportunity.disposition}>
              {opportunity.disposition} (current)
            </option>
            {validDispositions.map((disp) => (
              <option key={disp} value={disp}>
                {disp}
              </option>
            ))}
            {validDispositions.length === 0 && (
              <option value="" disabled>
                No valid transitions (terminal state)
              </option>
            )}
          </select>
          
          {/* Transition explanation */}
          {transitionExplanation && (
            <div className={`mt-2 p-2 rounded-md text-xs ${
              transitionExplanation.includes('valid')
                ? transitionExplanation.includes('reopen')
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}>
              <div className="flex items-start">
                <InformationCircleIcon className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Transition Rules</p>
                  <p>{transitionExplanation}</p>
                  {opportunity && disposition && (
                    <>
                      {isReversalTransition(opportunity.disposition, disposition, 'opportunity') && (
                        <p className="mt-1 text-amber-700 font-medium">
                          ⚠️ This is a reversal - reopening the opportunity for active work.
                        </p>
                      )}
                      {isFromTerminalState(opportunity.disposition) && (
                        <p className="mt-1 text-amber-700 font-medium">
                          ⚠️ Reopening from a closed state. This will make the opportunity active again.
                        </p>
                      )}
                    </>
                  )}
                  {validDispositions.length > 0 && (
                    <p className="mt-1">
                      <strong>Valid next states:</strong> {validDispositions.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Selected disposition description */}
          {selectedDispositionDef && disposition !== opportunity.disposition && (
            <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs text-gray-700">
              <p className="font-medium mb-1">{selectedDispositionDef.label}:</p>
              <p>{selectedDispositionDef.description}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Disposition Date
          </label>
          <input
            type="date"
            value={dispositionDate}
            onChange={(e) => setDispositionDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Explain the reason for this disposition change..."
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Disposition'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default OpportunityDispositionModal;

