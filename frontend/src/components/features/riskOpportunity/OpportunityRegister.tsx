import React, { useState, useEffect } from 'react';
import { useRiskOpportunityStore } from '../../../store/riskOpportunityStore';
import { formatCurrency } from '../../../utils/currencyUtils';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import OpportunityFormModal from './OpportunityFormModal';
import OpportunityDetailView from './OpportunityDetailView';
import OpportunityDispositionModal from './OpportunityDispositionModal';
import type { Opportunity } from '../../../store/riskOpportunityStore';

interface OpportunityRegisterProps {
  programId: string;
}

const OpportunityRegister: React.FC<OpportunityRegisterProps> = ({ programId }) => {
  const {
    opportunities,
    filters,
    ui,
    fetchOpportunities,
    deleteOpportunity,
    setFilters,
    setSelectedOpportunity,
    setShowOpportunityFormModal,
    setShowOpportunityDetailModal,
    setShowDispositionModal,
    fetchRiskCategories,
  } = useRiskOpportunityStore();

  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  useEffect(() => {
    fetchRiskCategories();
    loadOpportunities();
  }, [programId, filters, sortBy, sortOrder, fetchRiskCategories]);

  const loadOpportunities = async () => {
    try {
      await fetchOpportunities(programId, { ...filters, sortBy, sortOrder });
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    }
  };

  const handleCreateOpportunity = () => {
    setEditingOpportunity(null);
    setShowOpportunityFormModal(true);
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setShowOpportunityFormModal(true);
  };

  const handleViewOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowOpportunityDetailModal(true);
  };

  const handleDeleteOpportunity = async (opportunity: Opportunity) => {
    if (window.confirm(`Are you sure you want to delete "${opportunity.title}"?`)) {
      try {
        await deleteOpportunity(opportunity.id);
      } catch (error) {
        console.error('Failed to delete opportunity:', error);
      }
    }
  };

  const handleChangeDisposition = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowDispositionModal(true, 'opportunity');
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

  const handleExport = async () => {
    try {
      // Fetch full opportunity data with notes for all opportunities
      const opportunitiesWithNotes = await Promise.all(
        opportunities.map(async (opportunity) => {
          try {
            const response = await fetch(`/api/opportunities/${opportunity.id}`);
            if (response.ok) {
              return await response.json();
            }
            return opportunity;
          } catch (error) {
            console.error(`Failed to fetch notes for opportunity ${opportunity.id}:`, error);
            return opportunity;
          }
        })
      );

      // Prepare CSV data
      const headers = [
        'Title',
        'Description',
        'Category',
        'Benefit Severity',
        'Probability (%)',
        'Benefit Min',
        'Benefit Most Likely',
        'Benefit Max',
        'Expected Benefit',
        'Opportunity Score',
        'Disposition',
        'Disposition Date',
        'Disposition Reason',
        'Owner',
        'Identified Date',
        'Target Realization Date',
        'Actual Realization Date',
        'Actual Benefit',
        'WBS Element',
        'Realization Strategy',
        'Notes',
        'Created At',
        'Updated At',
        'Created By',
        'Updated By',
      ];

      const rows = opportunitiesWithNotes.map((opportunity) => {
        // Combine all notes into a single string
        const notesText = opportunity.notes && Array.isArray(opportunity.notes) && opportunity.notes.length > 0
          ? opportunity.notes
              .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              .map((note: any) => {
                const date = note.createdAt ? new Date(note.createdAt).toLocaleString() : '';
                const author = note.createdBy || 'Unknown';
                return `[${date} by ${author}] ${note.note}`;
              })
              .join(' | ')
          : '';

        return [
          opportunity.title || '',
          opportunity.description || '',
          opportunity.category?.name || '',
          opportunity.benefitSeverity || '',
          Number(opportunity.probability || 0).toFixed(2),
          formatCurrency(opportunity.benefitMin || 0),
          formatCurrency(opportunity.benefitMostLikely || 0),
          formatCurrency(opportunity.benefitMax || 0),
          formatCurrency(opportunity.expectedBenefit || 0),
          formatCurrency(opportunity.opportunityScore || 0),
          opportunity.disposition || '',
          opportunity.dispositionDate ? new Date(opportunity.dispositionDate).toLocaleDateString() : '',
          opportunity.dispositionReason || '',
          opportunity.owner || '',
          opportunity.identifiedDate ? new Date(opportunity.identifiedDate).toLocaleDateString() : '',
          opportunity.targetRealizationDate ? new Date(opportunity.targetRealizationDate).toLocaleDateString() : '',
          opportunity.actualRealizationDate ? new Date(opportunity.actualRealizationDate).toLocaleDateString() : '',
          opportunity.actualBenefit ? formatCurrency(opportunity.actualBenefit) : '',
          opportunity.wbsElement ? `${opportunity.wbsElement.code} - ${opportunity.wbsElement.name}` : '',
          opportunity.realizationStrategy || '',
          notesText,
          opportunity.createdAt ? new Date(opportunity.createdAt).toLocaleString() : '',
          opportunity.updatedAt ? new Date(opportunity.updatedAt).toLocaleString() : '',
          opportunity.createdBy || '',
          opportunity.updatedBy || '',
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
      link.setAttribute('download', `opportunity-register-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting opportunities:', error);
      alert('Failed to export opportunities. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Opportunity Register</h3>
          <p className="text-sm text-gray-600">
            {opportunities.length} {opportunities.length === 1 ? 'opportunity' : 'opportunities'}{' '}
            identified
          </p>
        </div>
        <div className="flex items-center gap-2">
          {opportunities.length > 0 && (
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
            onClick={handleCreateOpportunity}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Opportunity
          </button>
        </div>
      </div>

      {/* Filters - Same as RiskRegister */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Search</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Title or description..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Category</label>
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({ category: e.target.value || undefined })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Dispositions</option>
              <option value="Identified">Identified</option>
              <option value="In Progress">In Progress</option>
              <option value="Realized">Realized</option>
              <option value="Retired">Retired</option>
              <option value="Deferred">Deferred</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Owner</label>
            <input
              type="text"
              value={filters.owner || ''}
              onChange={(e) => setFilters({ owner: e.target.value || undefined })}
              placeholder="Owner name..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Probability
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Benefit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opportunity Score
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
                    Loading opportunities...
                  </td>
                </tr>
              ) : opportunities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No opportunities found. Click "Add Opportunity" to create your first opportunity.
                  </td>
                </tr>
              ) : (
                opportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{opportunity.title}</div>
                      {opportunity.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {opportunity.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {opportunity.category?.name || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                          opportunity.benefitSeverity
                        )}`}
                      >
                        {opportunity.benefitSeverity}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {Number(opportunity.probability || 0).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(opportunity.expectedBenefit || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatCurrency(opportunity.opportunityScore || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {opportunity.disposition}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {opportunity.owner || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewOpportunity(opportunity)}
                          className="text-green-600 hover:text-green-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditOpportunity(opportunity)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleChangeDisposition(opportunity)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Change Disposition"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteOpportunity(opportunity)}
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
      <OpportunityFormModal
        isOpen={ui.showOpportunityFormModal}
        onClose={() => {
          setShowOpportunityFormModal(false);
          setEditingOpportunity(null);
        }}
        programId={programId}
        opportunity={editingOpportunity}
        onSave={(opportunity) => {
          loadOpportunities();
        }}
      />

      <OpportunityDetailView
        isOpen={ui.showOpportunityDetailModal}
        onClose={() => {
          setShowOpportunityDetailModal(false);
          setSelectedOpportunity(null);
        }}
        programId={programId}
        opportunity={ui.selectedOpportunity}
        onEdit={(opportunity) => {
          setShowOpportunityDetailModal(false);
          handleEditOpportunity(opportunity);
        }}
        onDispositionChange={(opportunity) => {
          setShowOpportunityDetailModal(false);
          handleChangeDisposition(opportunity);
        }}
      />

      <OpportunityDispositionModal
        isOpen={ui.showDispositionModal && ui.dispositionType === 'opportunity'}
        onClose={() => {
          setShowDispositionModal(false);
          setSelectedOpportunity(null);
        }}
        programId={programId}
        opportunity={ui.dispositionType === 'opportunity' ? ui.selectedOpportunity : null}
        onSave={(opportunity) => {
          loadOpportunities();
        }}
      />
    </div>
  );
};

export default OpportunityRegister;

