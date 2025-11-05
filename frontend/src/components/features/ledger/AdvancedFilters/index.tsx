import React, { useState } from 'react';
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon, FunnelIcon } from '@heroicons/react/24/outline';

export interface DateRangeFilter {
  start?: string;
  end?: string;
}

export interface AmountRangeFilter {
  min?: number;
  max?: number;
}

export interface AdvancedFiltersState {
  // Date range filters
  baselineDateRange?: DateRangeFilter;
  plannedDateRange?: DateRangeFilter;
  actualDateRange?: DateRangeFilter;
  
  // Amount range filters
  baselineAmountRange?: AmountRangeFilter;
  plannedAmountRange?: AmountRangeFilter;
  actualAmountRange?: AmountRangeFilter;
  
  // Status filters
  hasActuals?: boolean;
  missingActuals?: boolean;
  hasInvoiceLink?: boolean;
  hasNotes?: boolean;
  createdFromBOE?: boolean;
  matchedWithActuals?: boolean;
  linkedToRisk?: boolean;
  
  // Quick filters (computed from above)
  isOverdue?: boolean;
}

interface AdvancedFiltersProps {
  filters: AdvancedFiltersState;
  onFiltersChange: (filters: AdvancedFiltersState) => void;
  onClearAll: () => void;
  vendorOptions: Array<{ id: string; name: string }>;
  wbsElementOptions: Array<{ id: string; code: string; name: string }>;
  costCategoryOptions: Array<{ id: string; code: string; name: string }>;
  hideHeader?: boolean;
  autoExpand?: boolean;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearAll,
  vendorOptions,
  wbsElementOptions,
  costCategoryOptions,
  hideHeader = false,
  autoExpand = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['status']));

  const updateFilter = (key: keyof AdvancedFiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const clearFilter = (key: keyof AdvancedFiltersState) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.baselineDateRange?.start || filters.baselineDateRange?.end) count++;
    if (filters.plannedDateRange?.start || filters.plannedDateRange?.end) count++;
    if (filters.actualDateRange?.start || filters.actualDateRange?.end) count++;
    if (filters.baselineAmountRange?.min !== undefined || filters.baselineAmountRange?.max !== undefined) count++;
    if (filters.plannedAmountRange?.min !== undefined || filters.plannedAmountRange?.max !== undefined) count++;
    if (filters.actualAmountRange?.min !== undefined || filters.actualAmountRange?.max !== undefined) count++;
    if (filters.hasActuals !== undefined) count++;
    if (filters.missingActuals !== undefined) count++;
    if (filters.hasInvoiceLink !== undefined) count++;
    if (filters.hasNotes !== undefined) count++;
    if (filters.createdFromBOE !== undefined) count++;
    if (filters.matchedWithActuals !== undefined) count++;
    if (filters.linkedToRisk !== undefined) count++;
    if (filters.isOverdue !== undefined) count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className={`${hideHeader ? '' : 'bg-white border border-gray-200 rounded-lg shadow-sm'} mb-4`}>
      {/* Header */}
      {!hideHeader && (
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearAll();
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          )}
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </div>
      )}

      {/* Filter Content */}
      {(isExpanded || hideHeader) && (
        <div className={`${hideHeader ? 'px-0' : 'px-4'} pb-4 space-y-4 ${!hideHeader ? 'border-t border-gray-200' : ''}`}>
          {/* Quick Filters - hide when in popover since we already have quick filters above */}
          {!hideHeader && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Quick Filters</h4>
              <button
                onClick={() => toggleGroup('quick')}
                className="text-xs text-gray-500"
              >
                {expandedGroups.has('quick') ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {expandedGroups.has('quick') && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => updateFilter('hasActuals', filters.hasActuals ? undefined : true)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    filters.hasActuals
                      ? 'bg-green-100 border-green-400 text-green-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Has Actuals
                </button>
                <button
                  onClick={() => updateFilter('missingActuals', filters.missingActuals ? undefined : true)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    filters.missingActuals
                      ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Missing Actuals
                </button>
                <button
                  onClick={() => updateFilter('isOverdue', filters.isOverdue ? undefined : true)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    filters.isOverdue
                      ? 'bg-red-100 border-red-400 text-red-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Overdue
                </button>
                <button
                  onClick={() => updateFilter('hasInvoiceLink', filters.hasInvoiceLink ? undefined : true)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    filters.hasInvoiceLink
                      ? 'bg-blue-100 border-blue-400 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Has Invoice Link
                </button>
              </div>
            )}
          </div>
          )}

          {/* Date Range Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Date Ranges</h4>
              <button
                onClick={() => toggleGroup('dates')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {expandedGroups.has('dates') ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {expandedGroups.has('dates') && (
              <div className="space-y-4">
                {/* Baseline Date */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">Baseline Date</label>
                    {(filters.baselineDateRange?.start || filters.baselineDateRange?.end) && (
                      <button
                        onClick={() => clearFilter('baselineDateRange')}
                        className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <XMarkIcon className="h-3 w-3" />
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">From</label>
                      <input
                        type="date"
                        value={filters.baselineDateRange?.start || ''}
                        onChange={(e) => updateFilter('baselineDateRange', {
                          ...filters.baselineDateRange,
                          start: e.target.value || undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">To</label>
                      <input
                        type="date"
                        value={filters.baselineDateRange?.end || ''}
                        onChange={(e) => updateFilter('baselineDateRange', {
                          ...filters.baselineDateRange,
                          end: e.target.value || undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Planned Date */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">Planned Date</label>
                    {(filters.plannedDateRange?.start || filters.plannedDateRange?.end) && (
                      <button
                        onClick={() => clearFilter('plannedDateRange')}
                        className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <XMarkIcon className="h-3 w-3" />
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">From</label>
                      <input
                        type="date"
                        value={filters.plannedDateRange?.start || ''}
                        onChange={(e) => updateFilter('plannedDateRange', {
                          ...filters.plannedDateRange,
                          start: e.target.value || undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">To</label>
                      <input
                        type="date"
                        value={filters.plannedDateRange?.end || ''}
                        onChange={(e) => updateFilter('plannedDateRange', {
                          ...filters.plannedDateRange,
                          end: e.target.value || undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Actual Date */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">Actual Date</label>
                    {(filters.actualDateRange?.start || filters.actualDateRange?.end) && (
                      <button
                        onClick={() => clearFilter('actualDateRange')}
                        className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <XMarkIcon className="h-3 w-3" />
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">From</label>
                      <input
                        type="date"
                        value={filters.actualDateRange?.start || ''}
                        onChange={(e) => updateFilter('actualDateRange', {
                          ...filters.actualDateRange,
                          start: e.target.value || undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">To</label>
                      <input
                        type="date"
                        value={filters.actualDateRange?.end || ''}
                        onChange={(e) => updateFilter('actualDateRange', {
                          ...filters.actualDateRange,
                          end: e.target.value || undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Amount Range Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Amount Ranges</h4>
              <button
                onClick={() => toggleGroup('amounts')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {expandedGroups.has('amounts') ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {expandedGroups.has('amounts') && (
              <div className="space-y-4">
                {/* Baseline Amount */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">Baseline Amount</label>
                    {(filters.baselineAmountRange?.min !== undefined || filters.baselineAmountRange?.max !== undefined) && (
                      <button
                        onClick={() => clearFilter('baselineAmountRange')}
                        className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <XMarkIcon className="h-3 w-3" />
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Minimum ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={filters.baselineAmountRange?.min ?? ''}
                        onChange={(e) => updateFilter('baselineAmountRange', {
                          ...filters.baselineAmountRange,
                          min: e.target.value ? parseFloat(e.target.value) : undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Maximum ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={filters.baselineAmountRange?.max ?? ''}
                        onChange={(e) => updateFilter('baselineAmountRange', {
                          ...filters.baselineAmountRange,
                          max: e.target.value ? parseFloat(e.target.value) : undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Planned Amount */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">Planned Amount</label>
                    {(filters.plannedAmountRange?.min !== undefined || filters.plannedAmountRange?.max !== undefined) && (
                      <button
                        onClick={() => clearFilter('plannedAmountRange')}
                        className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <XMarkIcon className="h-3 w-3" />
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Minimum ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={filters.plannedAmountRange?.min ?? ''}
                        onChange={(e) => updateFilter('plannedAmountRange', {
                          ...filters.plannedAmountRange,
                          min: e.target.value ? parseFloat(e.target.value) : undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Maximum ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={filters.plannedAmountRange?.max ?? ''}
                        onChange={(e) => updateFilter('plannedAmountRange', {
                          ...filters.plannedAmountRange,
                          max: e.target.value ? parseFloat(e.target.value) : undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Actual Amount */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">Actual Amount</label>
                    {(filters.actualAmountRange?.min !== undefined || filters.actualAmountRange?.max !== undefined) && (
                      <button
                        onClick={() => clearFilter('actualAmountRange')}
                        className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <XMarkIcon className="h-3 w-3" />
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Minimum ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={filters.actualAmountRange?.min ?? ''}
                        onChange={(e) => updateFilter('actualAmountRange', {
                          ...filters.actualAmountRange,
                          min: e.target.value ? parseFloat(e.target.value) : undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Maximum ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={filters.actualAmountRange?.max ?? ''}
                        onChange={(e) => updateFilter('actualAmountRange', {
                          ...filters.actualAmountRange,
                          max: e.target.value ? parseFloat(e.target.value) : undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Status Filters</h4>
              <button
                onClick={() => toggleGroup('status')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {expandedGroups.has('status') ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {expandedGroups.has('status') && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.hasNotes === true}
                      onChange={(e) => updateFilter('hasNotes', e.target.checked ? true : undefined)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Has Notes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.createdFromBOE === true}
                      onChange={(e) => updateFilter('createdFromBOE', e.target.checked ? true : undefined)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Created from BOE</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.hasInvoiceLink === true}
                      onChange={(e) => updateFilter('hasInvoiceLink', e.target.checked ? true : undefined)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Has Invoice Link</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.hasActuals === true}
                      onChange={(e) => updateFilter('hasActuals', e.target.checked ? true : undefined)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Has Actuals</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.missingActuals === true}
                      onChange={(e) => updateFilter('missingActuals', e.target.checked ? true : undefined)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Missing Actuals</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.matchedWithActuals === true}
                      onChange={(e) => updateFilter('matchedWithActuals', e.target.checked ? true : undefined)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Matched with Actuals Upload</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.linkedToRisk === true}
                      onChange={(e) => updateFilter('linkedToRisk', e.target.checked ? true : undefined)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Linked to Risk</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Active Filter Tags */}
          {activeCount > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {filters.baselineDateRange?.start || filters.baselineDateRange?.end ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Baseline Date: {filters.baselineDateRange.start || '...'} to {filters.baselineDateRange.end || '...'}
                    <button onClick={() => clearFilter('baselineDateRange')} className="hover:text-blue-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ) : null}
                {filters.plannedDateRange?.start || filters.plannedDateRange?.end ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Planned Date: {filters.plannedDateRange.start || '...'} to {filters.plannedDateRange.end || '...'}
                    <button onClick={() => clearFilter('plannedDateRange')} className="hover:text-blue-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ) : null}
                {filters.actualDateRange?.start || filters.actualDateRange?.end ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Actual Date: {filters.actualDateRange.start || '...'} to {filters.actualDateRange.end || '...'}
                    <button onClick={() => clearFilter('actualDateRange')} className="hover:text-blue-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ) : null}
                {filters.baselineAmountRange?.min !== undefined || filters.baselineAmountRange?.max !== undefined ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Baseline Amount: ${filters.baselineAmountRange.min ?? '...'} - ${filters.baselineAmountRange.max ?? '...'}
                    <button onClick={() => clearFilter('baselineAmountRange')} className="hover:text-green-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ) : null}
                {filters.plannedAmountRange?.min !== undefined || filters.plannedAmountRange?.max !== undefined ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Planned Amount: ${filters.plannedAmountRange.min ?? '...'} - ${filters.plannedAmountRange.max ?? '...'}
                    <button onClick={() => clearFilter('plannedAmountRange')} className="hover:text-green-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ) : null}
                {filters.actualAmountRange?.min !== undefined || filters.actualAmountRange?.max !== undefined ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Actual Amount: ${filters.actualAmountRange.min ?? '...'} - ${filters.actualAmountRange.max ?? '...'}
                    <button onClick={() => clearFilter('actualAmountRange')} className="hover:text-green-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ) : null}
                {filters.hasActuals && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Has Actuals
                    <button onClick={() => clearFilter('hasActuals')} className="hover:text-green-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.missingActuals && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                    Missing Actuals
                    <button onClick={() => clearFilter('missingActuals')} className="hover:text-yellow-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.isOverdue && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                    Overdue
                    <button onClick={() => clearFilter('isOverdue')} className="hover:text-red-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.hasInvoiceLink && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Has Invoice Link
                    <button onClick={() => clearFilter('hasInvoiceLink')} className="hover:text-blue-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.hasNotes && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    Has Notes
                    <button onClick={() => clearFilter('hasNotes')} className="hover:text-gray-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.createdFromBOE && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    Created from BOE
                    <button onClick={() => clearFilter('createdFromBOE')} className="hover:text-purple-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.matchedWithActuals && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                    Matched with Actuals Upload
                    <button onClick={() => clearFilter('matchedWithActuals')} className="hover:text-teal-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.linkedToRisk && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                    Linked to Risk
                    <button onClick={() => clearFilter('linkedToRisk')} className="hover:text-orange-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;

