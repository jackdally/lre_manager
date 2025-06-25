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
  importTransaction?: {
    id: string;
    vendorName: string;
    description: string;
    amount: number;
    transactionDate: string;
    status: string;
    importSession: {
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
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
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
  const [showPotentialModal, setShowPotentialModal] = useState(false);
  const [potentialIndex, setPotentialIndex] = useState(0);
  const [potentialMatchIds, setPotentialMatchIds] = useState<string[]>([]);
  const [loadingPotential, setLoadingPotential] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', undoId?: string } | null>(null);
  const [potentialLedgerEntryId, setPotentialLedgerEntryId] = useState<string | null>(null);
  const [potentialTab, setPotentialTab] = useState<'matched' | 'rejected'>('matched');
  const [potentialMatched, setPotentialMatched] = useState<any[]>([]);
  const [potentialRejected, setPotentialRejected] = useState<any[]>([]);
  const [entriesWithRejectedMatches, setEntriesWithRejectedMatches] = useState<Set<string>>(new Set());

  // Ref to track previous options to prevent unnecessary updates
  const prevOptionsRef = useRef<{ vendors: string[], categories: string[], subcategories: string[] } | null>(null);

  // For dropdowns - memoize to prevent unnecessary recalculations
  const vendorOptions = useMemo(() => Array.from(new Set(entries.map(e => e.vendor_name).filter(Boolean))), [entries]);
  const wbsCategoryOptions = useMemo(() => Array.from(new Set(entries.map(e => e.wbs_category).filter(Boolean))), [entries]);
  const wbsSubcategoryOptions = useMemo(() => Array.from(new Set(entries.map(e => e.wbs_subcategory).filter(Boolean))), [entries]);

  const location = useLocation();
  const highlightId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('highlight');
  }, [location.search]);
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      let res;
      if (showAll) {
        res = await axios.get(`/api/programs/${programId}/ledger`, {
          params: { page: 1, pageSize: 10000, search },
        });
      } else {
        res = await axios.get(`/api/programs/${programId}/ledger`, {
          params: { page, pageSize: PAGE_SIZE, search },
        });
      }
      const data = res.data as { entries: LedgerEntry[], total: number };
      setEntries(data.entries);
      setTotal(data.total);
      
      // Only call onOptionsUpdate if it exists and we have entries
      if (onOptionsUpdate && data.entries.length > 0) {
        const newVendors = Array.from(new Set(data.entries.map((e: LedgerEntry) => e.vendor_name).filter(Boolean)));
        const newCategories = Array.from(new Set(data.entries.map((e: LedgerEntry) => e.wbs_category).filter(Boolean)));
        const newSubcategories = Array.from(new Set(data.entries.map((e: LedgerEntry) => e.wbs_subcategory).filter(Boolean)));
        
        const newOptions = {
          vendors: newVendors,
          categories: newCategories,
          subcategories: newSubcategories,
        };
        
        // Only update if options have actually changed
        const prevOptions = prevOptionsRef.current;
        if (!prevOptions || 
            JSON.stringify(prevOptions.vendors) !== JSON.stringify(newOptions.vendors) ||
            JSON.stringify(prevOptions.categories) !== JSON.stringify(newOptions.categories) ||
            JSON.stringify(prevOptions.subcategories) !== JSON.stringify(newOptions.subcategories)) {
          prevOptionsRef.current = newOptions;
          onOptionsUpdate(newOptions);
        }
      }
    } catch (err) {
      // handle error
    }
  }, [programId, page, search, showAll, onOptionsUpdate]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    if (highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [entries, highlightId]);

  // Only fetch potential/rejected match IDs on mount or when programId changes
  useEffect(() => {
    let isMounted = true;
    const fetchPotentialMatchIds = async () => {
      const res = await fetch(`/api/programs/${programId}/ledger/potential-match-ids`);
      const ids = await res.json();
      if (isMounted) setPotentialMatchIds(ids);
    };
    const fetchEntriesWithRejectedMatches = async () => {
      try {
        const res = await fetch(`/api/programs/${programId}/ledger/rejected-match-ids`);
        if (res.ok) {
          const ids = await res.json();
          if (isMounted) setEntriesWithRejectedMatches(new Set(ids));
        }
      } catch (error) {
        console.error('Failed to fetch rejected match IDs:', error);
      }
    };
    fetchPotentialMatchIds();
    fetchEntriesWithRejectedMatches();
    return () => { isMounted = false; };
  }, [programId]);

  // Save cell edit
  const saveCellEdit = async (rowId: string, field: string, value: any) => {
    const entry = entries.find(e => e.id === rowId);
    if (!entry) return;
    const numberFields = ['baseline_amount', 'planned_amount', 'actual_amount'];
    // Only update if value has changed (robust check)
    let oldValue = entry[field as keyof LedgerEntry];
    let newValue = value;
    if (numberFields.includes(field)) {
      oldValue = oldValue === null || oldValue === undefined || oldValue === '' ? null : Number(oldValue);
      newValue = newValue === null || newValue === undefined || newValue === '' ? null : Number(newValue);
      if (oldValue === newValue) {
        setEditingCell(null);
        setCellEditValue('');
        return;
      }
    } else {
      const oldStr = oldValue === null || oldValue === undefined ? '' : String(oldValue);
      const newStr = newValue === null || newValue === undefined ? '' : String(newValue);
      if (oldStr === newStr) {
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
      setEditingCell(null);
      setCellEditValue('');
      return;
    }
    try {
      await axios.put(`/api/programs/${programId}/ledger/${rowId}`, { [field]: newValue });
      setEditingCell(null);
      setCellEditValue('');
      fetchEntries();
      if (onChange) onChange();
    } catch (err) {
      setEditingCell(null);
    }
  };

  // Handle cell click
  const handleCellClick = (rowId: string, field: string, value: any) => {
    setEditingCell({ rowId, field });
    setCellEditValue(value ?? '');
  };

  // Handle cell input change
  const handleCellInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setCellEditValue(e.target.value);
  };

  // Handle cell input blur or Enter
  const handleCellInputBlur = (rowId: string, field: string) => {
    saveCellEdit(rowId, field, cellEditValue);
  };
  const handleCellInputKeyDown = (e: React.KeyboardEvent, rowId: string, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveCellEdit(rowId, field, cellEditValue);
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
      await axios.post(`/api/programs/${programId}/ledger`, { ...newEntry, id: undefined });
      setNewRowId(null);
      fetchEntries();
      if (onChange) onChange();
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
    await Promise.all(selectedRows.map(id => axios.put(`/api/programs/${programId}/ledger/${id}`, payload)));
    setShowBulkEditModal(false);
    setSelectedRows([]);
    fetchEntries();
    if (onChange) onChange();
  };

  // Bulk delete
  const handleBulkDelete = () => setShowBulkDeleteModal(true);
  const handleBulkDeleteConfirm = async () => {
    await Promise.all(selectedRows.map(id => axios.delete(`/api/programs/ledger/${id}`)));
    setShowBulkDeleteModal(false);
    setSelectedRows([]);
    fetchEntries();
    if (onChange) onChange();
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
    await axios.put(`/api/programs/${programId}/ledger/${popover.rowId}`, {
      invoice_link_text: popoverText,
      invoice_link_url: popoverUrl,
    });
    handlePopoverClose();
    fetchEntries();
    if (onChange) onChange();
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
    setPotentialLedgerEntryId(entryId);
    setLoadingPotential(true);
    setShowPotentialModal(true);
    setPotentialTab('matched');
    try {
      const res = await fetch(`/api/programs/${programId}/ledger/${entryId}/potential-matches`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setPotentialMatched(data.matched || []);
      setPotentialRejected(data.rejected || []);
      setTimeout(() => {
      }, 100);
      // Track which entries have rejected matches
      if (data.rejected && data.rejected.length > 0) {
        setEntriesWithRejectedMatches(prev => new Set([...Array.from(prev), entryId]));
      }
      setPotentialIndex(0);
    } catch (e) {
      setPotentialMatched([]);
      setPotentialRejected([]);
    } finally {
      setLoadingPotential(false);
    }
  };

  // Filter entries based on filterType and dropdown filters
  let filteredEntries = entries;
  
  // Apply filterType filters first
  if (filterType === 'currentMonthPlanned') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthStr = `${year}-${month}`;
    filteredEntries = entries.filter(e => e.planned_date && e.planned_date.startsWith(currentMonthStr));
  } else if (filterType === 'emptyActuals') {
    filteredEntries = entries.filter(e => !e.actual_date || e.actual_amount == null);
  }
  
  // Apply dropdown filters
  if (vendorFilter) {
    filteredEntries = filteredEntries.filter(e => e.vendor_name === vendorFilter);
  }
  if (wbsCategoryFilter) {
    filteredEntries = filteredEntries.filter(e => e.wbs_category === wbsCategoryFilter);
  }
  if (wbsSubcategoryFilter) {
    filteredEntries = filteredEntries.filter(e => e.wbs_subcategory === wbsSubcategoryFilter);
  }

  // Before rendering the modal content, define currentMatches
  const filteredPotentialMatched = potentialMatched.filter(entry => entry.status !== 'replaced');
  const filteredPotentialRejected = potentialRejected.filter(entry => entry.status !== 'replaced');
  const currentMatches = potentialTab === 'matched' ? filteredPotentialMatched : filteredPotentialRejected;

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (potentialTab === 'rejected') {
    }
  }, [potentialTab, potentialRejected]);

  // Always sort entries by planned_date ascending before rendering
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      if (!a.planned_date && !b.planned_date) return 0;
      if (!a.planned_date) return 1;
      if (!b.planned_date) return -1;
      return new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime();
    });
  }, [filteredEntries]);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      {/* Quick Filters Bar */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Quick Filters</h2>
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
        setSearch={setSearch}
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
        setPotentialTab={setPotentialTab}
        fetchEntries={fetchEntries}
        formatCurrency={formatCurrency}
        highlightedRowRef={highlightedRowRef}
        programId={programId}
        filterType={filterType}
        vendorFilter={vendorFilter}
        wbsCategoryFilter={wbsCategoryFilter}
        wbsSubcategoryFilter={wbsSubcategoryFilter}
      />
    </div>
  );
};

export default LedgerTable; 