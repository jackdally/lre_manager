import React, { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Popover, Transition } from '@headlessui/react';
import AdvancedFilters from '../AdvancedFilters';
import FilterPresetManager from '../../../shared/FilterPresetManager';

interface OrganizedHeaderProps {
  // Search
  search: string;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  
  // Filters
  filterType: 'all' | 'currentMonthPlanned' | 'emptyActuals';
  setFilterType: (type: 'all' | 'currentMonthPlanned' | 'emptyActuals') => void;
  advancedFilters: any;
  setAdvancedFilters: (filters: any) => void;
  
  // Presets
  programId: string;
  currentFilters: any;
  onApplyPreset: (filters: any) => void;
  
  // Actions
  onAddEntry: () => void;
  onExportCSV: () => void;
  
  // Options for filters
  vendorOptions: Array<{ id: string; name: string }>;
  wbsElementOptions: Array<{ id: string; code: string; name: string }>;
  costCategoryOptions: Array<{ id: string; code: string; name: string }>;
  
  // Bulk actions
  selectedRows: string[];
  onBulkEdit: () => void;
  onBulkDelete: () => void;
}

const OrganizedHeader: React.FC<OrganizedHeaderProps> = ({
  search,
  setSearch,
  setPage,
  filterType,
  setFilterType,
  advancedFilters,
  setAdvancedFilters,
  programId,
  currentFilters,
  onApplyPreset,
  onAddEntry,
  onExportCSV,
  vendorOptions,
  wbsElementOptions,
  costCategoryOptions,
  selectedRows,
  onBulkEdit,
  onBulkDelete,
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filterType !== 'all') count++;
    if (advancedFilters) {
      if (advancedFilters.baselineDateRange?.start || advancedFilters.baselineDateRange?.end) count++;
      if (advancedFilters.plannedDateRange?.start || advancedFilters.plannedDateRange?.end) count++;
      if (advancedFilters.actualDateRange?.start || advancedFilters.actualDateRange?.end) count++;
      if (advancedFilters.baselineAmountRange?.min !== undefined || advancedFilters.baselineAmountRange?.max !== undefined) count++;
      if (advancedFilters.plannedAmountRange?.min !== undefined || advancedFilters.plannedAmountRange?.max !== undefined) count++;
      if (advancedFilters.actualAmountRange?.min !== undefined || advancedFilters.actualAmountRange?.max !== undefined) count++;
      if (advancedFilters.hasActuals !== undefined) count++;
      if (advancedFilters.missingActuals !== undefined) count++;
      if (advancedFilters.hasInvoiceLink !== undefined) count++;
      if (advancedFilters.hasNotes !== undefined) count++;
      if (advancedFilters.createdFromBOE !== undefined) count++;
      if (advancedFilters.isOverdue !== undefined) count++;
    }
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="space-y-4 mb-6">
      {/* Main Header Row: Search, Filters, Presets, Actions */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Group */}
        <div className="flex-1 min-w-[280px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <div className={`relative ${searchFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendor, description, notes, invoice..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        {/* Filters Popover */}
        <div className="flex-shrink-0">
          <label className="block text-xs font-medium text-gray-700 mb-1">Filters</label>
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md border transition-colors
                    ${open || activeFilterCount > 0
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <FunnelIcon className="h-4 w-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </Popover.Button>
                
                <Transition
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1 scale-95"
                  enterTo="opacity-100 translate-y-0 scale-100"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0 scale-100"
                  leaveTo="opacity-0 translate-y-1 scale-95"
                >
                  <Popover.Panel className="absolute right-0 z-[100] mt-2 w-screen max-w-2xl transform origin-top-right">
                    <div className="bg-white rounded-lg shadow-2xl border-2 border-blue-400 p-6 ring-4 ring-blue-300/50">
                      {/* Quick Filters */}
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Quick Filters</h3>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                              filterType === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            onClick={() => setFilterType('all')}
                          >
                            Show All
                          </button>
                          <button
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                              filterType === 'currentMonthPlanned'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            onClick={() => setFilterType('currentMonthPlanned')}
                          >
                            Current Month Planned
                          </button>
                          <button
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                              filterType === 'emptyActuals'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            onClick={() => setFilterType('emptyActuals')}
                          >
                            Empty Actuals
                          </button>
                        </div>
                      </div>
                      
                      {/* Advanced Filters */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="max-h-[60vh] overflow-y-auto">
                          <AdvancedFilters
                            filters={advancedFilters || {}}
                            onFiltersChange={setAdvancedFilters}
                            onClearAll={() => setAdvancedFilters(undefined)}
                            vendorOptions={vendorOptions}
                            wbsElementOptions={wbsElementOptions}
                            costCategoryOptions={costCategoryOptions}
                            hideHeader={true}
                            autoExpand={true}
                          />
                        </div>
                      </div>
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>
        </div>

        {/* Presets */}
        <div className="flex-shrink-0">
          <label className="block text-xs font-medium text-gray-700 mb-1">Presets</label>
          <FilterPresetManager
            programId={programId}
            currentFilters={currentFilters}
            onApply={onApplyPreset}
          />
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          <label className="block text-xs font-medium text-gray-700 mb-1">Actions</label>
          <div className="flex gap-2">
            <button
              onClick={onAddEntry}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              Add Entry
            </button>
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-sm font-medium text-blue-900">
            {selectedRows.length} {selectedRows.length === 1 ? 'entry' : 'entries'} selected
          </span>
          <button
            onClick={onBulkEdit}
            className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
          >
            Bulk Edit
          </button>
          <button
            onClick={onBulkDelete}
            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default OrganizedHeader;

