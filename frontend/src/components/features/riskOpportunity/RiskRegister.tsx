import React, { useState, useEffect } from 'react';
import { useRiskOpportunityStore } from '../../../store/riskOpportunityStore';
import { formatCurrency } from '../../../utils/currencyUtils';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import RiskFormModal from './RiskFormModal';
import RiskDetailView from './RiskDetailView';
import RiskDispositionModal from './RiskDispositionModal';
import type { Risk } from '../../../store/riskOpportunityStore';

interface RiskRegisterProps {
  programId: string;
  onMRUpdate?: () => void;
}

const RiskRegister: React.FC<RiskRegisterProps> = ({ programId, onMRUpdate }) => {
  const {
    risks,
    filters,
    ui,
    fetchRisks,
    deleteRisk,
    setFilters,
    setSelectedRisk,
    setShowRiskFormModal,
    setShowRiskDetailModal,
    setShowDispositionModal,
    fetchRiskCategories,
  } = useRiskOpportunityStore();

  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  useEffect(() => {
    fetchRiskCategories();
    loadRisks();
  }, [programId, filters, sortBy, sortOrder, fetchRiskCategories]);

  const loadRisks = async () => {
    try {
      await fetchRisks(programId, { ...filters, sortBy, sortOrder });
    } catch (error) {
      console.error('Failed to load risks:', error);
    }
  };

  const handleCreateRisk = () => {
    setEditingRisk(null);
    setShowRiskFormModal(true);
  };

  const handleEditRisk = (risk: Risk) => {
    setEditingRisk(risk);
    setShowRiskFormModal(true);
  };

  const handleViewRisk = (risk: Risk) => {
    setSelectedRisk(risk);
    setShowRiskDetailModal(true);
  };

  const handleDeleteRisk = async (risk: Risk) => {
    if (window.confirm(`Are you sure you want to delete "${risk.title}"?`)) {
      try {
        await deleteRisk(risk.id);
      } catch (error) {
        console.error('Failed to delete risk:', error);
      }
    }
  };

  const handleChangeDisposition = (risk: Risk) => {
    setSelectedRisk(risk);
    setShowDispositionModal(true, 'risk');
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

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

  const getDispositionIcon = (disposition: string) => {
    switch (disposition) {
      case 'Mitigated':
      case 'Realized':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'Retired':
        return <XCircleIcon className="h-5 w-5 text-gray-600" />;
      case 'In Progress':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-600" />;
    }
  };

  const handleExport = async () => {
    try {
      // Fetch full risk data with notes for all risks
      const risksWithNotes = await Promise.all(
        risks.map(async (risk) => {
          try {
            const response = await fetch(`/api/risks/${risk.id}`);
            if (response.ok) {
              return await response.json();
            }
            return risk;
          } catch (error) {
            console.error(`Failed to fetch notes for risk ${risk.id}:`, error);
            return risk;
          }
        })
      );

      // Prepare CSV data
      const headers = [
        'Title',
        'Description',
        'Category',
        'Severity',
        'Probability (%)',
        'Cost Impact Min',
        'Cost Impact Most Likely',
        'Cost Impact Max',
        'Expected Value',
        'Risk Score',
        'Disposition',
        'Disposition Date',
        'Disposition Reason',
        'Owner',
        'Identified Date',
        'Target Mitigation Date',
        'Actual Mitigation Date',
        'WBS Element',
        'Mitigation Strategy',
        'MR Utilized Amount',
        'MR Utilization Date',
        'MR Utilization Reason',
        'Notes',
        'Created At',
        'Updated At',
        'Created By',
        'Updated By',
      ];

      const rows = risksWithNotes.map((risk) => {
        // Combine all notes into a single string
        const notesText = risk.notes && Array.isArray(risk.notes) && risk.notes.length > 0
          ? risk.notes
              .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              .map((note: any) => {
                const date = note.createdAt ? new Date(note.createdAt).toLocaleString() : '';
                const author = note.createdBy || 'Unknown';
                return `[${date} by ${author}] ${note.note}`;
              })
              .join(' | ')
          : '';

        return [
          risk.title || '',
          risk.description || '',
          risk.category?.name || '',
          risk.severity || '',
          Number(risk.probability || 0).toFixed(2),
          formatCurrency(risk.costImpactMin || 0),
          formatCurrency(risk.costImpactMostLikely || 0),
          formatCurrency(risk.costImpactMax || 0),
          formatCurrency(risk.expectedValue || 0),
          formatCurrency(risk.riskScore || 0),
          risk.disposition || '',
          risk.dispositionDate ? new Date(risk.dispositionDate).toLocaleDateString() : '',
          risk.dispositionReason || '',
          risk.owner || '',
          risk.identifiedDate ? new Date(risk.identifiedDate).toLocaleDateString() : '',
          risk.targetMitigationDate ? new Date(risk.targetMitigationDate).toLocaleDateString() : '',
          risk.actualMitigationDate ? new Date(risk.actualMitigationDate).toLocaleDateString() : '',
          risk.wbsElement ? `${risk.wbsElement.code} - ${risk.wbsElement.name}` : '',
          risk.mitigationStrategy || '',
          formatCurrency(risk.mrUtilizedAmount || 0),
          risk.mrUtilizationDate ? new Date(risk.mrUtilizationDate).toLocaleDateString() : '',
          risk.mrUtilizationReason || '',
          notesText,
          risk.createdAt ? new Date(risk.createdAt).toLocaleString() : '',
          risk.updatedAt ? new Date(risk.updatedAt).toLocaleString() : '',
          risk.createdBy || '',
          risk.updatedBy || '',
        ];
      });

      // Convert to CSV
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `risk-register-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting risks:', error);
      alert('Failed to export risks. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Risk Register</h3>
          <p className="text-sm text-gray-600">
            {risks.length} {risks.length === 1 ? 'risk' : 'risks'} identified
          </p>
        </div>
        <div className="flex items-center gap-2">
          {risks.length > 0 && (
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
              title="Export to CSV"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export CSV
            </button>
          )}
          <button
            onClick={handleCreateRisk}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Risk
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Search</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Title or description..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Category</label>
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({ category: e.target.value || undefined })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {useRiskOpportunityStore.getState().riskCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Severity</label>
            <select
              value={filters.severity || ''}
              onChange={(e) => setFilters({ severity: e.target.value || undefined })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Disposition</label>
            <select
              value={filters.disposition || ''}
              onChange={(e) => setFilters({ disposition: e.target.value || undefined })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Dispositions</option>
              <option value="Identified">Identified</option>
              <option value="In Progress">In Progress</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Realized">Realized</option>
              <option value="Retired">Retired</option>
              <option value="Transferred">Transferred</option>
              <option value="Accepted">Accepted</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Owner</label>
            <input
              type="text"
              value={filters.owner || ''}
              onChange={(e) => setFilters({ owner: e.target.value || undefined })}
              placeholder="Owner name..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('title')}
                >
                  Title
                  {sortBy === 'title' && (
                    <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}
                >
                  Category
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('severity')}
                >
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Probability
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('expectedValue')}
                >
                  Expected Value
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('riskScore')}
                >
                  Risk Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disposition
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ui.loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Loading risks...
                  </td>
                </tr>
              ) : risks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No risks found. Click "Add Risk" to create your first risk.
                  </td>
                </tr>
              ) : (
                risks.map((risk) => (
                  <tr key={risk.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{risk.title}</div>
                      {risk.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {risk.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {risk.category?.name || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                          risk.severity
                        )}`}
                      >
                        {risk.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {Number(risk.probability || 0).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(risk.expectedValue || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-red-600">
                      {formatCurrency(risk.riskScore || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getDispositionIcon(risk.disposition)}
                        <span className="text-sm text-gray-600">{risk.disposition}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {risk.owner || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewRisk(risk)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditRisk(risk)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        {(risk.disposition === 'Identified' || risk.disposition === 'In Progress') && !risk.materializedAt && (
                          <button
                            onClick={() => {
                              setSelectedRisk(risk);
                              setShowRiskDetailModal(true);
                              // Scroll to materialize button in detail view
                              setTimeout(() => {
                                const materializeBtn = document.querySelector('[data-materialize-button]');
                                if (materializeBtn) {
                                  materializeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }, 100);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Materialize & Use MR"
                          >
                            <CurrencyDollarIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleChangeDisposition(risk)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Change Disposition"
                        >
                          <ExclamationTriangleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRisk(risk)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RiskFormModal
        isOpen={ui.showRiskFormModal}
        onClose={() => {
          setShowRiskFormModal(false);
          setEditingRisk(null);
        }}
        programId={programId}
        risk={editingRisk}
        onSave={(risk) => {
          loadRisks();
        }}
      />

      <RiskDetailView
        isOpen={ui.showRiskDetailModal}
        onClose={() => {
          setShowRiskDetailModal(false);
          setSelectedRisk(null);
        }}
        onMRUpdate={onMRUpdate}
        programId={programId}
        risk={ui.selectedRisk}
        onEdit={(risk) => {
          setShowRiskDetailModal(false);
          handleEditRisk(risk);
        }}
        onDispositionChange={(risk) => {
          setShowRiskDetailModal(false);
          handleChangeDisposition(risk);
        }}
      />

      <RiskDispositionModal
        isOpen={ui.showDispositionModal && ui.dispositionType === 'risk'}
        onClose={() => {
          setShowDispositionModal(false);
          setSelectedRisk(null);
        }}
        programId={programId}
        risk={ui.dispositionType === 'risk' ? ui.selectedRisk : null}
        onSave={(risk) => {
          loadRisks();
        }}
      />
    </div>
  );
};

export default RiskRegister;

