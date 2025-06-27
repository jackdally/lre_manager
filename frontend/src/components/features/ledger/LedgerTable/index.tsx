import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { InformationCircleIcon, DocumentMagnifyingGlassIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import LedgerBulkEditModal from './BulkEditModal';
import LedgerBulkDeleteModal from './BulkDeleteModal';
import LedgerErrorModal from './ErrorModal';
import LedgerTableHeader from './Header';
import LedgerTableTable from './Table';

// Import custom hooks
import { usePotentialMatchModal } from '../../../../hooks/usePotentialMatchModal';
import { useDebouncedApi } from '../../../../hooks/useDebouncedApi';
import { useMatchOperations } from '../../../../hooks/useMatchOperations';
import { useApiCache } from '../../../../hooks/useApiCache';
import { useVirtualScroll } from '../../../../hooks/useVirtualScroll';
import { usePerformanceMonitor } from '../../../../hooks/usePerformanceMonitor';
import { useLedgerOperations } from '../../../../hooks/useLedgerOperations';

export interface LedgerEntry {
  id: string;
  vendor_name: string;
  expense_description: string;
  wbs_category: string;
  wbs_subcategory: string;
  baseline_date: string;
  baseline_amount: number;
  planned_date: string;
  planned_amount: number;
  actual_date: string | null;
  actual_amount: number | null;
  notes: string | null;
  invoice_number?: string | null;
  invoice_link_text?: string | null;
  invoice_link_url?: string | null;
  actualsUploadTransaction?: {
    id: string;
    vendorName: string;
    description: string;
    amount: number;
    transactionDate: string;
    status: string;
    actualsUploadSession: {
      id: string;
      originalFilename: string;
      description: string;
      createdAt: string;
    } | null;
  };
}

interface LedgerTableProps {
  programId: string;
  showAll?: boolean;
  onChange?: () => void;
  onOptionsUpdate?: (options: { vendors: string[], categories: string[], subcategories: string[] }) => void;
  filterType: 'all' | 'currentMonthPlanned' | 'emptyActuals';
  vendorFilter?: string;
  wbsCategoryFilter?: string;
  wbsSubcategoryFilter?: string;
  setFilterType: (type: 'all' | 'currentMonthPlanned' | 'emptyActuals') => void;
  setVendorFilter: (vendor: string | undefined) => void;
  setWbsCategoryFilter: (cat: string | undefined) => void;
  setWbsSubcategoryFilter: (subcat: string | undefined) => void;
}

const PAGE_SIZE = 10;

// Required fields for a ledger entry
const requiredFields = ['vendor_name', 'expense_description', 'wbs_category', 'wbs_subcategory'];

// Robust currency formatter for both numbers and strings
const formatCurrency = (val: number | string | undefined | null) => {
  if (val === undefined || val === null || isNaN(Number(val))) return '--';
  return Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const LedgerTable: React.FC<LedgerTableProps> = ({ programId, showAll, onChange, onOptionsUpdate, filterType, vendorFilter, wbsCategoryFilter, wbsSubcategoryFilter, setFilterType, setVendorFilter, setWbsCategoryFilter, setWbsSubcategoryFilter }) => {
  console.log('🔄 LedgerTable component rendering');
  
  // Use custom hooks for better state management
  const potentialMatchModal = usePotentialMatchModal(programId);
  const debouncedApiResult = useDebouncedApi({ delay: 300 });
  const { debouncedCall } = debouncedApiResult || { debouncedCall: () => {} };
  const matchOperations = useMatchOperations({
    onSuccess: (operation) => {
      console.log(`🔄 Match operation ${operation} completed successfully - this might cause scroll issues`);
      // Refresh data after successful operation
      potentialMatchModal?.refreshData?.();
      fetchEntries();
    },
    onError: (operation, error) => {
      console.error(`Match operation ${operation} failed:`, error);
      setToast({ message: `Failed to ${operation} match: ${error.message}`, type: 'error' });
    }
  });

  // API caching for better performance
  const apiCache = useApiCache<{ entries: LedgerEntry[], total: number }>({
    ttl: 2 * 60 * 1000, // 2 minutes cache
    maxSize: 50,
  });

  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<LedgerEntry>>({});
  const [editingCell, setEditingCell] = useState<{ rowId: string, field: string } | null>(null);
  const [cellEditValue, setCellEditValue] = useState<any>('');
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [newRowId, setNewRowId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkEditFields, setBulkEditFields] = useState<Partial<LedgerEntry>>({});
  const [clearedFields, setClearedFields] = useState<{ [field: string]: boolean }>({});
  const [popover, setPopover] = useState<{ rowId: string | null, anchorEl: HTMLElement | null }>({ rowId: null, anchorEl: null });
  const [popoverText, setPopoverText] = useState('');
  const [popoverUrl, setPopoverUrl] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalData, setUploadModalData] = useState<any>(null);
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [potentialMatchIds, setPotentialMatchIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', undoId?: string } | null>(null);
  const [entriesWithRejectedMatches, setEntriesWithRejectedMatches] = useState<Set<string>>(new Set());
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<{ vendors: string[], categories: string[], subcategories: string[] }>({ vendors: [], categories: [], subcategories: [] });

  // Debug effect to track entries changes
  useEffect(() => {
    console.log('🔄 Entries state changed, count:', entries.length);
  }, [entries]);

  // Debug the onChange prop
  const debugOnChange = useCallback(() => {
    console.log('🔄 Parent onChange called - this might cause scroll to top');
    onChange?.();
  }, [onChange]);

  // Virtual scrolling for large datasets
  const virtualScroll = useVirtualScroll(entries, {
    itemHeight: 48, // Approximate row height
    containerHeight: 600, // Container height
    overscan: 10, // Render 10 items outside visible area
  });

  // Performance monitoring
  const performanceMonitor = usePerformanceMonitor();

  // Ref to track previous options to prevent unnecessary updates
  const prevOptionsRef = useRef<{ vendors: string[], categories: string[], subcategories: string[] } | null>(null);

  const location = useLocation();

  // Helper functions for refreshing match IDs
  const refreshPotentialMatchIds = useCallback(async () => {
    try {
      const res = await fetch(`/api/programs/${programId}/ledger/potential-match-ids`);
      if (res.ok) {
        const ids = await res.json();
        setPotentialMatchIds(ids);
      }
    } catch (error) {
      console.error('Failed to refresh potential match IDs:', error);
    }
  }, [programId]);

  const refreshRejectedMatchIds = useCallback(async () => {
    try {
      const res = await fetch(`/api/programs/${programId}/ledger/rejected-match-ids`);
      if (res.ok) {
        const ids = await res.json();
        setEntriesWithRejectedMatches(new Set(ids));
      }
    } catch (error) {
      console.error('Failed to refresh rejected match IDs:', error);
    }
  }, [programId]);

  // Cache invalidation on data changes
  const invalidateCache = useCallback(() => {
    // Invalidate all ledger-related cache entries
    if (apiCache?.invalidatePattern) {
      apiCache.invalidatePattern(/^ledger-/);
    } else if (apiCache?.invalidate) {
      apiCache.invalidate();
    }
  }, [apiCache]);

  const fetchEntries = useCallback(async () => {
    console.log('🔄 fetchEntries called - this might cause scroll issues');
    performanceMonitor?.startTimer?.('fetchEntries');
    setLoading(true);
    setError(null);
    
    try {
      // Create cache key based on request parameters
      const cacheKey = `ledger-${programId}-${page}-${search}-${showAll}`;
      
      // Check cache first
      const cachedData = apiCache?.get?.(cacheKey);
      if (cachedData) {
        performanceMonitor?.recordCacheHit?.();
        console.log('🔄 Using cached data - should not cause scroll');
        setEntries(cachedData.entries);
        setTotal(cachedData.total);
        setLoading(false);
        performanceMonitor?.endTimer?.('fetchEntries');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
        showAll: showAll ? 'true' : 'false'
      });

      if (search) params.append('search', search);
      if (filterType !== 'all') params.append('filterType', filterType);
      if (vendorFilter) params.append('vendorFilter', vendorFilter);
      if (wbsCategoryFilter) params.append('wbsCategoryFilter', wbsCategoryFilter);
      if (wbsSubcategoryFilter) params.append('wbsSubcategoryFilter', wbsSubcategoryFilter);

      const response = await axios.get(`/api/programs/${programId}/ledger?${params}`);
      
      if (response.data) {
        const { entries: newEntries, total: newTotal } = response.data;
        
        // Cache the result
        apiCache?.set?.(cacheKey, { entries: newEntries, total: newTotal });
        
        setEntries(newEntries);
        setTotal(newTotal);
        
        // Highlight new row if it exists
        if (newRowId && newEntries.some(entry => entry.id === newRowId)) {
          setTimeout(() => {
            const row = document.getElementById(`row-${newRowId}`);
            if (row) {
              row.scrollIntoView({ behavior: 'smooth', block: 'center' });
              row.classList.add('bg-yellow-100');
              setTimeout(() => row.classList.remove('bg-yellow-100'), 3000);
            }
          }, 100);
          setNewRowId(null);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch entries:', error);
      setError(error.response?.data?.message || 'Failed to fetch entries');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      performanceMonitor?.endTimer?.('fetchEntries');
    }
  }, [programId, page, search, showAll, filterType, vendorFilter, wbsCategoryFilter, wbsSubcategoryFilter, apiCache, performanceMonitor, newRowId]);

  // Debounced search
  const debouncedSearch = useCallback(
    debouncedCall ? debouncedCall(fetchEntries) : fetchEntries,
    [fetchEntries, debouncedCall]
  );

  // Initial data loading
  useEffect(() => {
    console.log('🔄 Initial data loading useEffect triggered - this might cause scroll issues');
    fetchEntries();
    refreshPotentialMatchIds();
    refreshRejectedMatchIds();
  }, [fetchEntries, refreshPotentialMatchIds, refreshRejectedMatchIds]);

  // Update dropdown options when entries change
  useEffect(() => {
    console.log('🔄 Dropdown options useEffect triggered - this might cause scroll issues');
    if (entries.length > 0) {
      const vendors = [...new Set(entries.map(entry => entry.vendor_name).filter(Boolean))].sort();
      const categories = [...new Set(entries.map(entry => entry.wbs_category).filter(Boolean))].sort();
      const subcategories = [...new Set(entries.map(entry => entry.wbs_subcategory).filter(Boolean))].sort();
      
      const newOptions = { vendors, categories, subcategories };
      
      // Only update if options have actually changed
      if (JSON.stringify(prevOptionsRef.current) !== JSON.stringify(newOptions)) {
        console.log('🔄 Updating dropdown options - this might cause scroll issues');
        setDropdownOptions(newOptions);
        prevOptionsRef.current = newOptions;
        onOptionsUpdate?.(newOptions);
      }
    }
  }, [entries, onOptionsUpdate]);

  useEffect(() => {
    if (highlightId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId]);

  // Enhanced save cell edit with cache invalidation
  const saveCellEdit = useCallback(async (rowId: string, field: string, value: any) => {
    console.log('🔵 saveCellEdit called:', { rowId, field, value });
    
    const entry = entries.find(e => e.id === rowId);
    if (!entry) {
      console.log('❌ Entry not found:', rowId);
      return;
    }
    
    const numberFields = ['baseline_amount', 'planned_amount', 'actual_amount'];
    // Only update if value has changed (robust check)
    let oldValue = entry[field as keyof LedgerEntry];
    let newValue = value;
    if (numberFields.includes(field)) {
      oldValue = oldValue === null || oldValue === undefined || oldValue === '' ? null : Number(oldValue);
      newValue = newValue === null || newValue === undefined || newValue === '' ? null : Number(newValue);
      if (oldValue === newValue) {
        console.log('🟡 No change detected for number field, skipping');
        setEditingCell(null);
        setCellEditValue('');
        return;
      }
    } else {
      const oldStr = oldValue === null || oldValue === undefined ? '' : String(oldValue);
      const newStr = newValue === null || newValue === undefined ? '' : String(newValue);
      if (oldStr === newStr) {
        console.log('🟡 No change detected for string field, skipping');
        setEditingCell(null);
        setCellEditValue('');
        return;
      }
      // For non-required fields, treat empty string as null
      if (!requiredFields.includes(field) && (newValue === '' || newValue === undefined)) {
        newValue = null;
      }
    }
    // Prevent clearing required fields
    if (requiredFields.includes(field) && (newValue === '' || newValue === null || newValue === undefined)) {
      console.log('❌ Cannot clear required field:', field);
      setEditingCell(null);
      setCellEditValue('');
      return;
    }
    
    console.log('🟢 Proceeding with save:', { oldValue, newValue });
    
    try {
      // Update local state immediately to preserve editing state
      console.log('🟢 Updating local state...');
      setEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === rowId 
            ? { ...entry, [field]: newValue }
            : entry
        )
      );
      
      // Call API with skipRefresh to prevent full re-render
      console.log('🟢 Calling API with skipRefresh...');
      await ledgerOperations.updateEntry(rowId, { [field]: newValue }, true);
      
      console.log('✅ Cell edit saved successfully');
      console.log('🔄 About to clear editing state...');
      setEditingCell(null);
      setCellEditValue('');
      console.log('🔄 Editing state cleared');
    } catch (err) {
      console.error('❌ Cell edit failed:', err);
      // Revert local state on error
      setEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === rowId 
            ? { ...entry, [field]: oldValue }
            : entry
        )
      );
      setEditingCell(null);
      setCellEditValue('');
    }
  }, [entries, ledgerOperations]);

  // Handle cell click
  const handleCellClick = (rowId: string, field: string, value: any) => {
    console.log('🔵 Cell clicked:', { rowId, field, value });
    setEditingCell({ rowId, field });
    setCellEditValue(value ?? '');
  };

  // Handle cell input change
  const handleCellInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    console.log('🔵 Cell input changed:', e.target.value);
    console.log('🔵 Setting cellEditValue to:', e.target.value);
    setCellEditValue(e.target.value);
  };

  // Handle cell input blur or Enter
  const handleCellInputBlur = (rowId: string, field: string, currentValue?: string) => {
    const valueToSave = currentValue !== undefined ? currentValue : cellEditValue;
    console.log('🔵 Cell input blur:', { rowId, field, cellEditValue, valueToSave });
    saveCellEdit(rowId, field, valueToSave);
  };
  const handleCellInputKeyDown = (e: React.KeyboardEvent, rowId: string, field: string) => {
    console.log('🔵 Cell key down:', { key: e.key, rowId, field, cellEditValue });
    if (e.key === 'Enter') {
      e.preventDefault();
      // Use the current input value instead of the stale state
      const currentValue = (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
      console.log('🔵 Enter pressed, current value from target:', currentValue);
      saveCellEdit(rowId, field, currentValue);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setCellEditValue('');
    }
  };

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEntry = () => {
    if (newRowId) return; // Only one new row at a time
    const tempId = 'new-' + Date.now();
    setEntries([{ id: tempId, vendor_name: '', expense_description: '', wbs_category: '', wbs_subcategory: '', baseline_date: '', baseline_amount: 0, planned_date: '', planned_amount: 0, actual_date: '', actual_amount: 0, notes: '', invoice_number: '', invoice_link_text: '', invoice_link_url: '' }, ...entries]);
    setEditingCell({ rowId: tempId, field: 'wbs_category' });
    setNewRowId(tempId);
  };

  const handleSaveNewRow = async () => {
    const newEntry = entries.find(e => e.id === newRowId);
    if (!newEntry) return;
    try {
      await ledgerOperations.createEntry({ ...newEntry, id: undefined } as Omit<LedgerEntry, 'id'>);
      setNewRowId(null);
    } catch (err: any) {
      setError('Error creating entry');
      setShowErrorModal(true);
    }
  };

  const handleCancelNewRow = () => {
    setEntries(entries.filter(e => e.id !== newRowId));
    setNewRowId(null);
    setEditingCell(null);
    setCellEditValue('');
  };

  // Checkbox handlers
  const handleSelectRow = (id: string) => {
    setSelectedRows(selectedRows.includes(id)
      ? selectedRows.filter(rowId => rowId !== id)
      : [...selectedRows, id]);
  };
  const handleSelectAll = () => {
    if (selectedRows.length === entries.length) setSelectedRows([]);
    else setSelectedRows(entries.map(e => e.id));
  };

  // Bulk edit
  const handleBulkEdit = () => {
    setBulkEditFields({});
    setClearedFields({});
    setShowBulkEditModal(true);
  };
  const handleBulkEditFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBulkEditFields(prev => ({ ...prev, [name]: value }));
    setClearedFields(prev => ({ ...prev, [name]: false }));
  };
  const handleBulkEditClearToggle = (field: string) => {
    setClearedFields(prev => ({ ...prev, [field]: !prev[field] }));
    setBulkEditFields(prev => ({ ...prev, [field]: '' }));
  };
  const handleBulkEditSave = async () => {
    const payload: any = {};
    Object.entries(bulkEditFields).forEach(([field, value]) => {
      if (clearedFields[field]) {
        payload[field] = null;
      } else if (value !== '' && value !== undefined) {
        payload[field] = value;
      }
      // else: skip field
    });
    
    try {
      await ledgerOperations.bulkUpdateEntries(selectedRows, payload);
      setShowBulkEditModal(false);
      setSelectedRows([]);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Bulk edit failed:', error);
    }
  };

  // Bulk delete
  const handleBulkDelete = () => setShowBulkDeleteModal(true);
  const handleBulkDeleteConfirm = async () => {
    try {
      await ledgerOperations.bulkDeleteEntries(selectedRows);
      setShowBulkDeleteModal(false);
      setSelectedRows([]);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Bulk delete failed:', error);
    }
  };

  // Helper to determine if a field is cleared
  const isCleared = (field: string) => clearedFields[field];

  // Popover open handler
  const handlePopoverOpen = (rowId: string, text: string | null | undefined, url: string | null | undefined, event: React.MouseEvent) => {
    setPopover({ rowId, anchorEl: event.currentTarget as HTMLElement });
    setPopoverText(text || '');
    setPopoverUrl(url || '');
  };

  // Popover close handler
  const handlePopoverClose = () => {
    setPopover({ rowId: null, anchorEl: null });
    setPopoverText('');
    setPopoverUrl('');
  };

  // Popover save handler
  const handlePopoverSave = async () => {
    if (!popover.rowId) return;
    try {
      await ledgerOperations.updateInvoiceLink(popover.rowId, popoverText, popoverUrl);
      handlePopoverClose();
    } catch (error) {
      // Error handling is done in the hook
      console.error('Popover save failed:', error);
    }
  };

  const handlePopoverKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePopoverSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handlePopoverClose();
    }
  };

  const handleShowPotentialMatches = async (entryId: string) => {
    console.log('🔄 handleShowPotentialMatches called - this might cause scroll issues');
    setIsLoadingMatches(true);
    try {
      const response = await axios.get(`/api/programs/${programId}/ledger/${entryId}/potential-matches`);
      setPotentialMatches(response.data as any[]);
      setUploadModalData({ entryId, matches: response.data });
      setShowUploadModal(true);
    } catch (error) {
      console.error('Failed to fetch potential matches:', error);
      setToast({ message: 'Failed to fetch potential matches', type: 'error' });
    } finally {
      setIsLoadingMatches(false);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle search input change with debouncing
  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    if (newSearch.trim() === '') {
      // If search is empty, fetch immediately
      fetchEntries();
    } else {
      // Debounce the search
      debouncedSearch(newSearch);
    }
  }, [fetchEntries, debouncedSearch]);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      {/* Quick Filters Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Quick Filters</h2>
          {process.env.NODE_ENV === 'development' && performanceMonitor?.logPerformanceReport && (
            <button
              onClick={performanceMonitor.logPerformanceReport}
              className="btn btn-xs btn-outline text-xs"
              title="View performance metrics"
            >
              📊 Performance
            </button>
          )}
        </div>
        <div className="flex gap-4">
          <button
            className={`btn px-4 py-2 rounded-md ${filterType === 'all' ? 'btn-primary' : 'btn-ghost border border-gray-300 bg-gray-100 text-gray-700'}`}
            onClick={() => setFilterType('all')}
          >
            Show All
          </button>
          <button
            className={`btn px-4 py-2 rounded-md ${filterType === 'currentMonthPlanned' ? 'btn-primary' : 'btn-ghost border border-gray-300 bg-gray-100 text-gray-700'}`}
            onClick={() => setFilterType('currentMonthPlanned')}
          >
            Show Current Month Planned Expenses
          </button>
          <button
            className={`btn px-4 py-2 rounded-md ${filterType === 'emptyActuals' ? 'btn-primary' : 'btn-ghost border border-gray-300 bg-gray-100 text-gray-700'}`}
            onClick={() => setFilterType('emptyActuals')}
          >
            Show Empty Actuals
          </button>
        </div>
      </div>
      <LedgerTableHeader
        search={search}
        setSearch={handleSearchChange}
        setPage={setPage}
        onAddEntry={handleAddEntry}
        selectedRows={selectedRows}
        onBulkEdit={handleBulkEdit}
        onBulkDelete={handleBulkDelete}
        vendorFilter={vendorFilter}
        setVendorFilter={setVendorFilter}
        wbsCategoryFilter={wbsCategoryFilter}
        setWbsCategoryFilter={setWbsCategoryFilter}
        wbsSubcategoryFilter={wbsSubcategoryFilter}
        setWbsSubcategoryFilter={setWbsSubcategoryFilter}
        vendorOptions={vendorOptions}
        wbsCategoryOptions={wbsCategoryOptions}
        wbsSubcategoryOptions={wbsSubcategoryOptions}
      />
      {showErrorModal && error && (
        <LedgerErrorModal
          show={showErrorModal}
          error={error}
          onClose={() => setShowErrorModal(false)}
        />
      )}
      {showBulkEditModal && (
        <LedgerBulkEditModal
          show={showBulkEditModal}
          selectedCount={selectedRows.length}
          bulkEditFields={bulkEditFields}
          clearedFields={clearedFields}
          wbsCategoryOptions={wbsCategoryOptions}
          wbsSubcategoryOptions={wbsSubcategoryOptions}
          vendorOptions={vendorOptions}
          isCleared={isCleared}
          handleBulkEditFieldChange={handleBulkEditFieldChange}
          handleBulkEditClearToggle={handleBulkEditClearToggle}
          handleBulkEditSave={handleBulkEditSave}
          onCancel={() => setShowBulkEditModal(false)}
        />
      )}
      {showBulkDeleteModal && (
        <LedgerBulkDeleteModal
          show={showBulkDeleteModal}
          selectedCount={selectedRows.length}
          onConfirm={handleBulkDeleteConfirm}
          onCancel={() => setShowBulkDeleteModal(false)}
        />
      )}
      <LedgerTableTable
        sortedEntries={sortedEntries}
        total={total}
        page={page}
        showAll={showAll}
        PAGE_SIZE={PAGE_SIZE}
        selectedRows={selectedRows}
        editingCell={editingCell}
        cellEditValue={cellEditValue}
        highlightId={highlightId}
        newRowId={newRowId}
        popover={popover}
        popoverText={popoverText}
        popoverUrl={popoverUrl}
        entriesWithRejectedMatches={entriesWithRejectedMatches}
        potentialMatchIds={potentialMatchIds}
        showUploadModal={showUploadModal}
        uploadModalData={uploadModalData}
        showPotentialModal={potentialMatchModal?.isOpen || false}
        potentialIndex={potentialMatchModal?.currentIndex || 0}
        potentialLedgerEntryId={potentialMatchModal?.ledgerEntryId || null}
        loadingPotential={potentialMatchModal?.isLoading || false}
        loading={loading}
        searchLoading={searchLoading}
        wbsCategoryOptions={wbsCategoryOptions}
        wbsSubcategoryOptions={wbsSubcategoryOptions}
        vendorOptions={vendorOptions}
        handleSelectAll={handleSelectAll}
        handleSelectRow={handleSelectRow}
        handleCellClick={handleCellClick}
        handleCellInputChange={handleCellInputChange}
        handleCellInputBlur={handleCellInputBlur}
        handleCellInputKeyDown={handleCellInputKeyDown}
        handlePopoverOpen={handlePopoverOpen}
        handlePopoverClose={handlePopoverClose}
        handlePopoverSave={handlePopoverSave}
        handlePopoverKeyDown={handlePopoverKeyDown}
        handleShowPotentialMatches={handleShowPotentialMatches}
        handleSaveNewRow={handleSaveNewRow}
        handleCancelNewRow={handleCancelNewRow}
        setPage={setPage}
        setShowUploadModal={setShowUploadModal}
        setUploadModalData={setUploadModalData}
        setPopoverText={setPopoverText}
        setPopoverUrl={setPopoverUrl}
        setPotentialTab={potentialMatchModal?.switchTab || (() => {})}
        setPotentialIndex={(index: number | ((prev: number) => number)) => {
          if (typeof index === 'function' && potentialMatchModal?.setIndex) {
            const currentIndex = potentialMatchModal.currentIndex || 0;
            const newIndex = index(currentIndex);
            potentialMatchModal.setIndex(newIndex);
          } else if (typeof index === 'number' && potentialMatchModal?.setIndex) {
            potentialMatchModal.setIndex(index);
          }
        }}
        setPotentialLedgerEntryId={() => {}}
        fetchEntries={fetchEntries}
        formatCurrency={formatCurrency}
        highlightedRowRef={highlightedRowRef}
        programId={programId}
        filterType={filterType}
        vendorFilter={vendorFilter}
        wbsCategoryFilter={wbsCategoryFilter}
        wbsSubcategoryFilter={wbsSubcategoryFilter}
        setShowPotentialModal={potentialMatchModal?.closeModal || (() => {})}
        potentialTab={potentialMatchModal?.currentTab || 'matched'}
        potentialMatched={potentialMatchModal?.potentialMatches || []}
        setPotentialMatched={() => {}}
        potentialRejected={potentialMatchModal?.rejectedMatches || []}
        setPotentialRejected={() => {}}
        setToast={setToast}
        setEntriesWithRejectedMatches={setEntriesWithRejectedMatches}
        setPotentialMatchIds={setPotentialMatchIds}
        confirmMatch={ledgerOperations.confirmMatch}
        rejectMatch={ledgerOperations.rejectMatch}
        undoReject={ledgerOperations.undoReject}
      />

      {/* View Upload Modal - Moved to parent component */}
      {showUploadModal && uploadModalData && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative border-2 border-green-200">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold" onClick={() => setShowUploadModal(false)} aria-label="Close">&times;</button>
            <h2 className="text-2xl font-extrabold mb-4 text-green-700 flex items-center gap-2">
              <DocumentMagnifyingGlassIcon className="h-6 w-6 text-green-500" /> Upload Details
            </h2>
            <div className="mb-3 flex flex-col gap-2 text-base">
              <div><b className="text-gray-600">Vendor:</b> <span className="text-gray-900">{uploadModalData.vendorName}</span></div>
              <div><b className="text-gray-600">Description:</b> <span className="text-gray-900">{uploadModalData.description}</span></div>
              <div><b className="text-gray-600">Amount:</b> <span className="text-green-700 font-semibold">{formatCurrency(uploadModalData.amount)}</span></div>
              <div><b className="text-gray-600">Date:</b> <span className="text-gray-900">{uploadModalData.transactionDate ? new Date(uploadModalData.transactionDate).toLocaleDateString() : ''}</span></div>
              <div><b className="text-gray-600">Status:</b> <span className="text-gray-900 capitalize">{uploadModalData.status}</span></div>
              <div><b className="text-gray-600">Upload Session:</b> <span className="text-gray-900">{uploadModalData.actualsUploadSession?.originalFilename}</span></div>
              {uploadModalData.actualsUploadSession?.description && (
                <div><b className="text-gray-600">Session Description:</b> <span className="text-gray-900">{uploadModalData.actualsUploadSession.description}</span></div>
              )}
              <div><b className="text-gray-600">Uploaded:</b> <span className="text-gray-900">{uploadModalData.actualsUploadSession?.createdAt ? new Date(uploadModalData.actualsUploadSession.createdAt).toLocaleString() : ''}</span></div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end items-center mt-6 gap-4">
              {uploadModalData.status === 'confirmed' && (
                <button
                  className="btn btn-error px-6 py-2 text-base font-semibold rounded shadow hover:bg-red-700 transition mb-2 sm:mb-0"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to remove this match? This will revert the actuals and restore potential matches.')) {
                      try {
                        await ledgerOperations.removeMatch(uploadModalData.id);
                        setShowUploadModal(false);
                        // Update the specific entry in local state to remove the actualsUploadTransaction
                        setEntries(prevEntries => 
                          prevEntries.map(entry => {
                            // Find the entry that had this upload transaction and remove the actualsUploadTransaction
                            if (entry.actualsUploadTransaction?.id === uploadModalData.id) {
                              return {
                                ...entry,
                                actualsUploadTransaction: undefined,
                                actual_amount: null,
                                actual_date: null
                              };
                            }
                            return entry;
                          })
                        );
                      } catch (error) {
                        // Error handling is done in the hook
                        console.error('Remove match failed:', error);
                      }
                    }
                  }}
                >
                  Remove Match
                </button>
              )}
              <button
                className="btn btn-ghost px-6 py-2 text-base font-semibold rounded shadow hover:bg-gray-100 transition"
                onClick={() => setShowUploadModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerTable;