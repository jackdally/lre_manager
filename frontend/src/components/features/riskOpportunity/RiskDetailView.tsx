import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { useRiskOpportunityStore } from '../../../store/riskOpportunityStore';
import { formatCurrency, formatDate } from '../../../utils/currencyUtils';
import {
  PencilIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { Risk } from '../../../store/riskOpportunityStore';
import axios from 'axios';
import RiskMaterializationModal from './RiskMaterializationModal';

interface RiskDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  risk: Risk | null;
  onEdit: (risk: Risk) => void;
  onDispositionChange: (risk: Risk) => void;
  onMRUpdate?: () => void;
}

const RiskDetailView: React.FC<RiskDetailViewProps> = ({
  isOpen,
  onClose,
  programId,
  risk,
  onEdit,
  onDispositionChange,
  onMRUpdate,
}) => {
  const [riskNotes, setRiskNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showMaterializationModal, setShowMaterializationModal] = useState(false);
  const { addRiskNote } = useRiskOpportunityStore();

  useEffect(() => {
    if (isOpen && risk) {
      loadNotes();
    }
  }, [isOpen, risk]);

  const loadNotes = async () => {
    if (!risk) return;
    try {
      const notes = await axios.get<any[]>(`/api/risks/${risk.id}/notes`);
      setRiskNotes(notes.data);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const handleAddNote = async () => {
    if (!risk || !newNote.trim()) return;

    setAddingNote(true);
    try {
      await addRiskNote(risk.id, newNote);
      setNewNote('');
      await loadNotes();
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  const handleMaterializeRisk = () => {
    setShowMaterializationModal(true);
  };

  const handleMaterializationComplete = (updatedRisk: Risk) => {
    setShowMaterializationModal(false);
    if (onMRUpdate) {
      onMRUpdate();
    }
    // Refresh the risk data by closing and reopening or reloading
    // The parent component should handle refreshing the risk list
    onClose();
  };

  if (!isOpen || !risk) return null;

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
    <Modal isOpen={isOpen} onClose={onClose} title="Risk Details" size="xl">
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
              <p className="text-sm font-medium text-gray-900">{risk.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
              <p className="text-sm text-gray-900">{risk.category?.name || '—'}</p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {risk.description || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Severity</label>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                  risk.severity
                )}`}
              >
                {risk.severity}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Probability</label>
              <p className="text-sm text-gray-900">{Number(risk.probability || 0).toFixed(1)}%</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Expected Value</label>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(risk.expectedValue || 0)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Risk Score</label>
              <p className="text-sm font-bold text-red-600">
                {formatCurrency(risk.riskScore || 0)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Financial Impact (Min)
              </label>
              <p className="text-sm text-gray-900">{formatCurrency(risk.costImpactMin)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Financial Impact (Most Likely)
              </label>
              <p className="text-sm text-gray-900">{formatCurrency(risk.costImpactMostLikely)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Financial Impact (Max)
              </label>
              <p className="text-sm text-gray-900">{formatCurrency(risk.costImpactMax)}</p>
            </div>
          </div>
        </div>

        {/* Status & Disposition */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Disposition</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              <p className="text-sm text-gray-900">{risk.status}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Disposition</label>
              <p className="text-sm text-gray-900">{risk.disposition}</p>
            </div>
            {risk.dispositionDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Disposition Date
                </label>
                <p className="text-sm text-gray-900">{formatDate(risk.dispositionDate)}</p>
              </div>
            )}
            {risk.dispositionReason && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Disposition Reason
                </label>
                <p className="text-sm text-gray-900">{risk.dispositionReason}</p>
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
              <p className="text-sm text-gray-900">{risk.owner || '—'}</p>
            </div>
            {risk.identifiedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Identified Date
                </label>
                <p className="text-sm text-gray-900">{formatDate(risk.identifiedDate)}</p>
              </div>
            )}
            {risk.targetMitigationDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Target Mitigation Date
                </label>
                <p className="text-sm text-gray-900">{formatDate(risk.targetMitigationDate)}</p>
              </div>
            )}
            {risk.actualMitigationDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Actual Mitigation Date
                </label>
                <p className="text-sm text-gray-900">{formatDate(risk.actualMitigationDate)}</p>
              </div>
            )}
            {risk.wbsElement && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">WBS Element</label>
                <p className="text-sm text-gray-900">
                  {risk.wbsElement.code} - {risk.wbsElement.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mitigation Strategy */}
        {risk.mitigationStrategy && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mitigation Strategy</h3>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{risk.mitigationStrategy}</p>
          </div>
        )}

        {/* MR Utilization */}
        {risk.mrUtilizedAmount > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-600" />
              MR Utilization
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Utilized Amount:</span>
                <span className="text-sm font-bold text-blue-900">
                  {formatCurrency(risk.mrUtilizedAmount)}
                </span>
              </div>
              {risk.mrUtilizationDate && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Utilization Date:</span>
                  <span className="text-sm text-gray-900">{formatDate(risk.mrUtilizationDate)}</span>
                </div>
              )}
              {risk.mrUtilizationReason && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Reason:</span>
                  <p className="text-sm text-gray-900 mt-1">{risk.mrUtilizationReason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes History */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-600" />
            Notes History
          </h3>
          <div className="space-y-3">
            {riskNotes.map((note) => (
              <div
                key={note.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.note}</p>
                  <span className="text-xs text-gray-500 ml-4">
                    {formatDate(note.createdAt)}
                  </span>
                </div>
                {note.createdBy && (
                  <p className="text-xs text-gray-500">By: {note.createdBy}</p>
                )}
              </div>
            ))}
            {riskNotes.length === 0 && (
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter note..."
              />
              <button
                onClick={handleAddNote}
                disabled={addingNote || !newNote.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingNote ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => onEdit(risk)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button
            onClick={() => onDispositionChange(risk)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-700 bg-white border border-purple-300 rounded-md hover:bg-purple-50"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            Change Disposition
          </button>
          {(risk.disposition === 'Identified' || risk.disposition === 'In Progress') && !risk.materializedAt && (
            <button
              onClick={handleMaterializeRisk}
              data-materialize-button
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              title="Materialize this risk and utilize MR. This will change the disposition to 'Realized' (terminal state)."
            >
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              Materialize & Use MR
            </button>
          )}
        </div>
      </div>

      {/* Materialization Modal */}
      <RiskMaterializationModal
        isOpen={showMaterializationModal}
        onClose={() => setShowMaterializationModal(false)}
        programId={programId}
        risk={risk}
        onSave={handleMaterializationComplete}
        onMRUpdate={onMRUpdate}
      />
    </Modal>
  );
};

export default RiskDetailView;

