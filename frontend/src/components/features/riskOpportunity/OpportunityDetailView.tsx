import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { useRiskOpportunityStore } from '../../../store/riskOpportunityStore';
import { formatCurrency, formatDate } from '../../../utils/currencyUtils';
import {
  PencilIcon,
  CheckCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import type { Opportunity } from '../../../store/riskOpportunityStore';
import axios from 'axios';

interface OpportunityDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  opportunity: Opportunity | null;
  onEdit: (opportunity: Opportunity) => void;
  onDispositionChange: (opportunity: Opportunity) => void;
}

const OpportunityDetailView: React.FC<OpportunityDetailViewProps> = ({
  isOpen,
  onClose,
  programId,
  opportunity,
  onEdit,
  onDispositionChange,
}) => {
  const [opportunityNotes, setOpportunityNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const { addOpportunityNote } = useRiskOpportunityStore();

  useEffect(() => {
    if (isOpen && opportunity) {
      loadNotes();
    }
  }, [isOpen, opportunity]);

  const loadNotes = async () => {
    if (!opportunity) return;
    try {
      const notes = await axios.get<any[]>(`/api/opportunities/${opportunity.id}/notes`);
      setOpportunityNotes(notes.data);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const handleAddNote = async () => {
    if (!opportunity || !newNote.trim()) return;

    setAddingNote(true);
    try {
      await addOpportunityNote(opportunity.id, newNote);
      setNewNote('');
      await loadNotes();
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  if (!isOpen || !opportunity) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Opportunity Details" size="xl">
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
              <p className="text-sm font-medium text-gray-900">{opportunity.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
              <p className="text-sm text-gray-900">{opportunity.category?.name || '—'}</p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {opportunity.description || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Opportunity Assessment */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Opportunity Assessment</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Benefit Severity</label>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                  opportunity.benefitSeverity
                )}`}
              >
                {opportunity.benefitSeverity}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Probability</label>
              <p className="text-sm text-gray-900">{Number(opportunity.probability || 0).toFixed(1)}%</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Expected Benefit</label>
              <p className="text-sm font-semibold text-green-600">
                {formatCurrency(opportunity.expectedBenefit || 0)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Opportunity Score</label>
              <p className="text-sm font-bold text-green-600">
                {formatCurrency(opportunity.opportunityScore || 0)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Financial Benefit (Min)
              </label>
              <p className="text-sm text-gray-900">{formatCurrency(opportunity.benefitMin)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Financial Benefit (Most Likely)
              </label>
              <p className="text-sm text-gray-900">{formatCurrency(opportunity.benefitMostLikely)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Financial Benefit (Max)
              </label>
              <p className="text-sm text-gray-900">{formatCurrency(opportunity.benefitMax)}</p>
            </div>
            {opportunity.actualBenefit && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Actual Benefit
                </label>
                <p className="text-sm font-bold text-green-700">
                  {formatCurrency(opportunity.actualBenefit)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status & Disposition */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Disposition</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              <p className="text-sm text-gray-900">{opportunity.status}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Disposition</label>
              <p className="text-sm text-gray-900">{opportunity.disposition}</p>
            </div>
            {opportunity.dispositionDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Disposition Date
                </label>
                <p className="text-sm text-gray-900">{formatDate(opportunity.dispositionDate)}</p>
              </div>
            )}
            {opportunity.dispositionReason && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Disposition Reason
                </label>
                <p className="text-sm text-gray-900">{opportunity.dispositionReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Ownership & Dates */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ownership & Timeline</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Owner</label>
              <p className="text-sm text-gray-900">{opportunity.owner || '—'}</p>
            </div>
            {opportunity.identifiedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Identified Date
                </label>
                <p className="text-sm text-gray-900">{formatDate(opportunity.identifiedDate)}</p>
              </div>
            )}
            {opportunity.targetRealizationDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Target Realization Date
                </label>
                <p className="text-sm text-gray-900">{formatDate(opportunity.targetRealizationDate)}</p>
              </div>
            )}
            {opportunity.actualRealizationDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Actual Realization Date
                </label>
                <p className="text-sm text-gray-900">{formatDate(opportunity.actualRealizationDate)}</p>
              </div>
            )}
            {opportunity.wbsElement && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">WBS Element</label>
                <p className="text-sm text-gray-900">
                  {opportunity.wbsElement.code} - {opportunity.wbsElement.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Realization Strategy */}
        {opportunity.realizationStrategy && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Realization Strategy</h3>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {opportunity.realizationStrategy}
            </p>
          </div>
        )}

        {/* Notes History */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-600" />
            Notes History
          </h3>
          <div className="space-y-3">
            {opportunityNotes.map((note) => (
              <div key={note.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.note}</p>
                  <span className="text-xs text-gray-500 ml-4">{formatDate(note.createdAt)}</span>
                </div>
                {note.createdBy && (
                  <p className="text-xs text-gray-500">By: {note.createdBy}</p>
                )}
              </div>
            ))}
            {opportunityNotes.length === 0 && (
              <p className="text-sm text-gray-500">No notes yet</p>
            )}
          </div>

          {/* Add Note */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Note</label>
            <div className="flex space-x-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter note..."
              />
              <button
                onClick={handleAddNote}
                disabled={addingNote || !newNote.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingNote ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => onEdit(opportunity)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button
            onClick={() => onDispositionChange(opportunity)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-700 bg-white border border-purple-300 rounded-md hover:bg-purple-50"
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Change Disposition
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default OpportunityDetailView;

