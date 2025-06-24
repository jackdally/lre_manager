import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { InformationCircleIcon, DocumentMagnifyingGlassIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';

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
  filterType?: 'all' | 'currentMonthPlanned' | 'emptyActuals';
  vendorFilter?: string;
  wbsCategoryFilter?: string;
  wbsSubcategoryFilter?: string;
  onOptionsUpdate?: (options: { vendors: string[], categories: string[], subcategories: string[] }) => void;
}

const PAGE_SIZE = 10;

// Required fields for a ledger entry
const requiredFields = ['vendor_name', 'expense_description', 'wbs_category', 'wbs_subcategory'];

function formatCurrency(val: number | undefined | null) {
  if (val == null) return '--';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val));
}

const LedgerTable: React.FC<LedgerTableProps> = ({ programId, showAll, onChange, filterType = 'all', vendorFilter, wbsCategoryFilter, wbsSubcategoryFilter, onOptionsUpdate }) => {
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
      console.log('DEBUG: potential-matches API response', data);
      setPotentialMatched(data.matched || []);
      setPotentialRejected(data.rejected || []);
      setTimeout(() => {
        console.log('DEBUG: potentialRejected after fetch', data.rejected || []);
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
  const currentMatches = potentialTab === 'matched' ? potentialMatched : potentialRejected;

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
      console.log('DEBUG: currentMatches in rejected tab', potentialRejected);
    }
  }, [potentialTab, potentialRejected]);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Ledger</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search vendor..."
            className="input input-bordered input-sm"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <button className="btn btn-primary btn-sm" onClick={handleAddEntry}>Add Entry</button>
          {selectedRows.length > 0 && (
            <>
              <button className="btn btn-primary btn-sm" onClick={handleBulkEdit}>Bulk Edit</button>
              <button className="btn btn-error btn-sm ml-2" onClick={handleBulkDelete}>Delete</button>
            </>
          )}
        </div>
      </div>
      {showErrorModal && error && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <h3 className="text-lg font-bold mb-2 text-red-600">Error</h3>
            <div className="mb-4 text-gray-800">{error}</div>
            <button className="btn btn-error" onClick={() => setShowErrorModal(false)}>Close</button>
          </div>
        </div>
      )}
      {showBulkEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl w-full text-left">
            <h3 className="text-2xl font-bold mb-4 text-blue-600">Bulk Edit</h3>
            <div className="mb-2 text-sm text-gray-600 flex flex-wrap gap-4 items-center">
              <span><span className="inline-block align-middle">🗑️</span> = Clear field for all selected rows</span>
              <span><span className="inline-block align-middle w-4 h-4 rounded bg-green-100 border border-green-400 mr-1" style={{ display: 'inline-block', verticalAlign: 'middle' }}></span> = Field will be updated</span>
            </div>
            <div className="mb-4 text-gray-800">Update fields for {selectedRows.length} selected rows. Leave blank to skip a field.</div>
            <form onSubmit={e => { e.preventDefault(); handleBulkEditSave(); }}>
              <div className="grid grid-cols-4 gap-x-6 gap-y-4 mb-6 items-center">
                <div>
                  <label className="block font-medium text-left mb-1">WBS Category</label>
                  <div className="flex items-center gap-2">
                    <select
                      name="wbs_category"
                      className={`input input-xs w-full rounded-md ${isCleared('wbs_category') ? 'bg-green-100 border-green-400' : bulkEditFields.wbs_category ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                      value={isCleared('wbs_category') ? '' : bulkEditFields.wbs_category || ''}
                      onChange={handleBulkEditFieldChange}
                    >
                      <option value="">-- Select --</option>
                      {wbsCategoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-left mb-1">WBS Subcategory</label>
                  <div className="flex items-center gap-2">
                    <select
                      name="wbs_subcategory"
                      className={`input input-xs w-full rounded-md ${isCleared('wbs_subcategory') ? 'bg-green-100 border-green-400' : bulkEditFields.wbs_subcategory ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                      value={isCleared('wbs_subcategory') ? '' : bulkEditFields.wbs_subcategory || ''}
                      onChange={handleBulkEditFieldChange}
                    >
                      <option value="">-- Select --</option>
                      {wbsSubcategoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-left mb-1">Vendor</label>
                  <div className="flex items-center gap-2">
                    <select
                      name="vendor_name"
                      className={`input input-xs w-full rounded-md ${isCleared('vendor_name') ? 'bg-green-100 border-green-400' : bulkEditFields.vendor_name ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                      value={isCleared('vendor_name') ? '' : bulkEditFields.vendor_name || ''}
                      onChange={handleBulkEditFieldChange}
                    >
                      <option value="">-- Select --</option>
                      {vendorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
                <div></div>
                <div>
                  <label className="block font-medium text-left mb-1">Invoice Link Text</label>
                  <div className="flex items-center gap-2">
                    <input
                      name="invoice_link_text"
                      type="text"
                      className={`input input-xs w-full rounded-md ${isCleared('invoice_link_text') ? 'bg-green-100 border-green-400' : bulkEditFields.invoice_link_text ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                      value={isCleared('invoice_link_text') ? '' : bulkEditFields.invoice_link_text || ''}
                      onChange={handleBulkEditFieldChange}
                    />
                    <button type="button" className={`ml-1 ${isCleared('invoice_link_text') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('invoice_link_text')}>🗑️</button>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-left mb-1">Invoice Link URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      name="invoice_link_url"
                      type="text"
                      className={`input input-xs w-full rounded-md ${isCleared('invoice_link_url') ? 'bg-green-100 border-green-400' : bulkEditFields.invoice_link_url ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                      value={isCleared('invoice_link_url') ? '' : bulkEditFields.invoice_link_url || ''}
                      onChange={handleBulkEditFieldChange}
                    />
                    <button type="button" className={`ml-1 ${isCleared('invoice_link_url') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('invoice_link_url')}>🗑️</button>
                  </div>
                </div>
                <div></div>
                <div></div>
                <div>
                  <label className="block font-medium text-left mb-1">Baseline Date</label>
                  <div className="flex items-center gap-2">
                    <input
                      name="baseline_date"
                      type="date"
                      className={`input input-xs w-full rounded-md ${isCleared('baseline_date') ? 'bg-green-100 border-green-400' : bulkEditFields.baseline_date ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                      value={isCleared('baseline_date') ? '' : bulkEditFields.baseline_date || ''}
                      onChange={handleBulkEditFieldChange}
                    />
                    <button type="button" className={`ml-1 ${isCleared('baseline_date') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('baseline_date')}>🗑️</button>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-left mb-1">Baseline Amount</label>
                  <div className="flex items-center gap-2">
                    <input
                      name="baseline_amount"
                      type="number"
                      className={`input input-xs w-full rounded-md ${isCleared('baseline_amount') ? 'bg-green-100 border-green-400' : bulkEditFields.baseline_amount ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                      value={isCleared('baseline_amount') ? '' : bulkEditFields.baseline_amount ?? ''}
                      onChange={handleBulkEditFieldChange}
                    />
                    <button type="button" className={`ml-1 ${isCleared('baseline_amount') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('baseline_amount')}>🗑️</button>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-left mb-1">Planned Date</label>
                  <div className="flex items-center gap-2">
                    <input
                      name="planned_date"
                      type="date"
                      className={`input input-xs w-full rounded-md ${isCleared('planned_date') ? 'bg-green-100 border-green-400' : bulkEditFields.planned_date ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                      value={isCleared('planned_date') ? '' : bulkEditFields.planned_date || ''}
                      onChange={handleBulkEditFieldChange}
                    />
                    <button type="button" className={`ml-1 ${isCleared('planned_date') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('planned_date')}>🗑️</button>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-left mb-1">Planned Amount</label>
                  <div className="flex items-center gap-2">
                    <input
                      name="planned_amount"
                      type="number"
                      className={`input input-xs w-full rounded-md ${isCleared('planned_amount') ? 'bg-green-100 border-green-400' : bulkEditFields.planned_amount ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                      value={isCleared('planned_amount') ? '' : bulkEditFields.planned_amount ?? ''}
                      onChange={handleBulkEditFieldChange}
                    />
                    <button type="button" className={`ml-1 ${isCleared('planned_amount') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('planned_amount')}>🗑️</button>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-left mb-1">Actual Date</label>
                  <div className="flex items-center gap-2">
                    <input
                      name="actual_date"
                      type="date"
                      className={`input input-xs w-full rounded-md ${isCleared('actual_date') ? 'bg-green-100 border-green-400' : bulkEditFields.actual_date ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                      value={isCleared('actual_date') ? '' : bulkEditFields.actual_date || ''}
                      onChange={handleBulkEditFieldChange}
                    />
                    <button type="button" className={`ml-1 ${isCleared('actual_date') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('actual_date')}>🗑️</button>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-left mb-1">Actual Amount</label>
                  <div className="flex items-center gap-2">
                    <input
                      name="actual_amount"
                      type="number"
                      className={`input input-xs w-full rounded-md ${isCleared('actual_amount') ? 'bg-green-100 border-green-400' : bulkEditFields.actual_amount ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                      value={isCleared('actual_amount') ? '' : bulkEditFields.actual_amount ?? ''}
                      onChange={handleBulkEditFieldChange}
                    />
                    <button type="button" className={`ml-1 ${isCleared('actual_amount') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500`} title="Clear" onClick={() => handleBulkEditClearToggle('actual_amount')}>🗑️</button>
                  </div>
                </div>
                <div></div>
                <div></div>
                <div className="col-span-4 flex items-start gap-2">
                  <label className="w-32 font-medium mt-2 text-left">Notes</label>
                  <textarea
                    name="notes"
                    className={`input input-xs w-full min-h-24 rounded-md ${isCleared('notes') ? 'bg-green-100 border-green-400' : bulkEditFields.notes ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                    value={isCleared('notes') ? '' : bulkEditFields.notes || ''}
                    onChange={handleBulkEditFieldChange}
                    style={{ marginLeft: 0 }}
                  />
                  <button type="button" className={`ml-1 ${isCleared('notes') ? 'text-green-600' : 'text-gray-400'} hover:text-red-500 mt-2`} title="Clear" onClick={() => handleBulkEditClearToggle('notes')}>🗑️</button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowBulkEditModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <h3 className="text-lg font-bold mb-2 text-red-600">Confirm Delete</h3>
            <div className="mb-4 text-gray-800">Are you sure you want to delete {selectedRows.length} selected row(s)? This action cannot be undone.</div>
            <button className="btn btn-error mr-2" onClick={handleBulkDeleteConfirm}>Delete</button>
            <button className="btn btn-ghost" onClick={() => setShowBulkDeleteModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-2"><input type="checkbox" checked={selectedRows.length === entries.length && entries.length > 0} onChange={handleSelectAll} /></th>
              <th className="px-2 py-2">WBS Category</th>
              <th className="px-2 py-2">WBS Subcategory</th>
              <th className="px-2 py-2">Vendor</th>
              <th className="px-2 py-2 w-64 max-w-xl">Description</th>
              <th className="px-2 py-2 w-28 max-w-[7rem]">Invoice Link</th>
              <th className="px-2 py-2 text-right">Baseline Date</th>
              <th className="px-2 py-2 text-right">Baseline Amount</th>
              <th className="px-2 py-2 text-right">Planned Date</th>
              <th className="px-2 py-2 text-right">Planned Amount</th>
              <th className="px-2 py-2 text-right">Actual Date</th>
              <th className="px-2 py-2 text-right">Actual Amount</th>
              <th className="px-2 py-2">Notes</th>
              <th className="px-2 py-2">Upload</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry, idx) => {
              return (
                <tr
                  key={entry.id}
                  ref={entry.id === highlightId ? highlightedRowRef : null}
                  className={
                    entry.id === highlightId
                      ? 'bg-yellow-200 animate-pulse'
                      : entry.id === newRowId
                      ? 'bg-blue-50'
                      : ''
                  }
                >
                  <td className="px-2 py-1"><input type="checkbox" checked={selectedRows.includes(entry.id)} onChange={() => handleSelectRow(entry.id)} /></td>
                  {/* WBS Category (dropdown) */}
                  <td className="px-2 py-1" onClick={() => handleCellClick(entry.id, 'wbs_category', entry.wbs_category)}>
                    {editingCell && editingCell.rowId === entry.id && editingCell.field === 'wbs_category' ? (
                      <select
                        className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                        value={cellEditValue}
                        onChange={handleCellInputChange}
                        onBlur={() => handleCellInputBlur(entry.id, 'wbs_category')}
                        onKeyDown={e => handleCellInputKeyDown(e, entry.id, 'wbs_category')}
                        autoFocus
                      >
                        <option value="">-- Select --</option>
                        {wbsCategoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      entry.wbs_category
                    )}
                  </td>
                  {/* WBS Subcategory (dropdown) */}
                  <td className="px-2 py-1" onClick={() => handleCellClick(entry.id, 'wbs_subcategory', entry.wbs_subcategory)}>
                    {editingCell && editingCell.rowId === entry.id && editingCell.field === 'wbs_subcategory' ? (
                      <select
                        className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                        value={cellEditValue}
                        onChange={handleCellInputChange}
                        onBlur={() => handleCellInputBlur(entry.id, 'wbs_subcategory')}
                        onKeyDown={e => handleCellInputKeyDown(e, entry.id, 'wbs_subcategory')}
                        autoFocus
                      >
                        <option value="">-- Select --</option>
                        {wbsSubcategoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      entry.wbs_subcategory
                    )}
                  </td>
                  {/* Vendor (dropdown) */}
                  <td className="px-2 py-1" onClick={() => handleCellClick(entry.id, 'vendor_name', entry.vendor_name)}>
                    {editingCell && editingCell.rowId === entry.id && editingCell.field === 'vendor_name' ? (
                      <select
                        className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                        value={cellEditValue}
                        onChange={handleCellInputChange}
                        onBlur={() => handleCellInputBlur(entry.id, 'vendor_name')}
                        onKeyDown={e => handleCellInputKeyDown(e, entry.id, 'vendor_name')}
                        autoFocus
                      >
                        <option value="">-- Select --</option>
                        {vendorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      entry.vendor_name
                    )}
                  </td>
                  {/* Description (textarea) */}
                  <td className="px-2 py-1 w-64 max-w-xl" onClick={() => handleCellClick(entry.id, 'expense_description', entry.expense_description)}>
                    {editingCell && editingCell.rowId === entry.id && editingCell.field === 'expense_description' ? (
                      <textarea
                        className={`input input-xs w-full min-h-24 rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                        value={cellEditValue}
                        onChange={handleCellInputChange}
                        onBlur={() => handleCellInputBlur(entry.id, 'expense_description')}
                        onKeyDown={e => handleCellInputKeyDown(e, entry.id, 'expense_description')}
                        autoFocus
                      />
                    ) : (
                      entry.expense_description
                    )}
                  </td>
                  {/* Invoice Link (popover edit) */}
                  <td className="px-2 py-1 w-28 max-w-[7rem] relative" onClick={e => { e.stopPropagation(); handlePopoverOpen(entry.id, entry.invoice_link_text ?? '', entry.invoice_link_url ?? '', e); }}>
                    {entry.invoice_link_text && entry.invoice_link_url ? (
                      <a href={entry.invoice_link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{entry.invoice_link_text}</a>
                    ) : (
                      <span className="text-gray-400 italic">(add link)</span>
                    )}
                    {popover.rowId === entry.id && popover.anchorEl && (
                      <div className="absolute z-50 bg-white border rounded shadow-lg p-4 top-8 left-0 w-64" style={{ minWidth: 220 }} onClick={e => e.stopPropagation()}>
                        <div className="mb-2">
                          <label className="block text-xs font-semibold mb-1">Link Text</label>
                          <input
                            className="input input-xs w-full border mb-2"
                            value={popoverText}
                            onChange={e => setPopoverText(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            onKeyDown={handlePopoverKeyDown}
                          />
                          <label className="block text-xs font-semibold mb-1">Link URL</label>
                          <input
                            className="input input-xs w-full border"
                            value={popoverUrl}
                            onChange={e => setPopoverUrl(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            onKeyDown={handlePopoverKeyDown}
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <button className="btn btn-xs btn-primary" onClick={e => { e.stopPropagation(); handlePopoverSave(); }}>Save</button>
                          <button className="btn btn-xs btn-ghost" onClick={e => { e.stopPropagation(); handlePopoverClose(); }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </td>
                  {/* Baseline Date */}
                  <td className="px-2 py-1 text-right" onClick={() => handleCellClick(entry.id, 'baseline_date', entry.baseline_date)}>
                    {editingCell && editingCell.rowId === entry.id && editingCell.field === 'baseline_date' ? (
                      <input
                        type="date"
                        className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                        value={cellEditValue}
                        onChange={handleCellInputChange}
                        onBlur={() => handleCellInputBlur(entry.id, 'baseline_date')}
                        onKeyDown={e => handleCellInputKeyDown(e, entry.id, 'baseline_date')}
                        autoFocus
                      />
                    ) : (
                      entry.baseline_date
                    )}
                  </td>
                  {/* Baseline Amount */}
                  <td className="px-2 py-1 text-right" onClick={() => handleCellClick(entry.id, 'baseline_amount', entry.baseline_amount)}>
                    {editingCell && editingCell.rowId === entry.id && editingCell.field === 'baseline_amount' ? (
                      <input
                        type="number"
                        className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                        value={cellEditValue}
                        onChange={handleCellInputChange}
                        onBlur={() => handleCellInputBlur(entry.id, 'baseline_amount')}
                        onKeyDown={e => handleCellInputKeyDown(e, entry.id, 'baseline_amount')}
                        autoFocus
                      />
                    ) : (
                      formatCurrency(entry.baseline_amount)
                    )}
                  </td>
                  {/* Planned Date */}
                  <td className="px-2 py-1 text-right" onClick={() => handleCellClick(entry.id, 'planned_date', entry.planned_date)}>
                    {editingCell && editingCell.rowId === entry.id && editingCell.field === 'planned_date' ? (
                      <input
                        type="date"
                        className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                        value={cellEditValue}
                        onChange={handleCellInputChange}
                        onBlur={() => handleCellInputBlur(entry.id, 'planned_date')}
                        onKeyDown={e => handleCellInputKeyDown(e, entry.id, 'planned_date')}
                        autoFocus
                      />
                    ) : (
                      entry.planned_date
                    )}
                  </td>
                  {/* Planned Amount */}
                  <td className="px-2 py-1 text-right" onClick={() => handleCellClick(entry.id, 'planned_amount', entry.planned_amount)}>
                    {editingCell && editingCell.rowId === entry.id && editingCell.field === 'planned_amount' ? (
                      <input
                        type="number"
                        className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                        value={cellEditValue}
                        onChange={handleCellInputChange}
                        onBlur={() => handleCellInputBlur(entry.id, 'planned_amount')}
                        onKeyDown={e => handleCellInputKeyDown(e, entry.id, 'planned_amount')}
                        autoFocus
                      />
                    ) : (
                      formatCurrency(entry.planned_amount)
                    )}
                  </td>
                  {/* Actual Date */}
                  <td className="px-2 py-1 text-right" onClick={() => handleCellClick(entry.id, 'actual_date', entry.actual_date)}>
                    {editingCell && editingCell.rowId === entry.id && editingCell.field === 'actual_date' ? (
                      <input
                        type="date"
                        className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                        value={cellEditValue}
                        onChange={handleCellInputChange}
                        onBlur={() => handleCellInputBlur(entry.id, 'actual_date')}
                        onKeyDown={e => handleCellInputKeyDown(e, entry.id, 'actual_date')}
                        autoFocus
                      />
                    ) : (
                      entry.actual_date || ''
                    )}
                  </td>
                  {/* Actual Amount */}
                  <td className="px-2 py-1 text-right" onClick={() => handleCellClick(entry.id, 'actual_amount', entry.actual_amount)}>
                    {editingCell && editingCell.rowId === entry.id && editingCell.field === 'actual_amount' ? (
                      <input
                        type="number"
                        className={`input input-xs w-full rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                        value={cellEditValue}
                        onChange={handleCellInputChange}
                        onBlur={() => handleCellInputBlur(entry.id, 'actual_amount')}
                        onKeyDown={e => handleCellInputKeyDown(e, entry.id, 'actual_amount')}
                        autoFocus
                      />
                    ) : (
                      formatCurrency(entry.actual_amount)
                    )}
                  </td>
                  {/* Notes (textarea) */}
                  <td className="px-2 py-1" onClick={() => handleCellClick(entry.id, 'notes', entry.notes)}>
                    {editingCell && editingCell.rowId === entry.id && editingCell.field === 'notes' ? (
                      <textarea
                        className={`input input-xs w-full min-h-24 rounded-md ${cellEditValue ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'} border`}
                        value={cellEditValue}
                        onChange={handleCellInputChange}
                        onBlur={() => handleCellInputBlur(entry.id, 'notes')}
                        onKeyDown={e => handleCellInputKeyDown(e, entry.id, 'notes')}
                        autoFocus
                      />
                    ) : (
                      entry.notes
                    )}
                  </td>
                  <td className="px-2 py-1 align-middle text-left">
                    <div className="flex flex-col items-start gap-1 min-h-[32px]">
                      {(() => {
                        const hasRejectedMatches = entriesWithRejectedMatches.has(entry.id);
                        const hasPotentialMatch = potentialMatchIds.map(String).includes(String(entry.id));
                        // View Upload
                        if (entry.importTransaction && (entry.importTransaction.status === 'confirmed' || entry.importTransaction.status === 'added_to_ledger')) {
                          return (
                            <button
                              className="flex items-center gap-1 text-blue-600 underline hover:text-blue-800 text-sm font-semibold"
                              aria-label="View Upload Details"
                              data-tooltip-id={`upload-tooltip-${entry.id}`}
                              onClick={() => { setUploadModalData(entry.importTransaction); setShowUploadModal(true); }}
                            >
                              <DocumentMagnifyingGlassIcon className="h-4 w-4" /> View Upload
                            </button>
                          );
                        }
                        // Manual Update (with matches or rejected)
                        if (entry.actual_amount && entry.actual_date && !entry.importTransaction) {
                          if (hasPotentialMatch || hasRejectedMatches) {
                            return (
                              <button
                                className="flex items-center gap-1 text-gray-500 underline hover:text-yellow-600 text-sm font-semibold"
                                aria-label="View Upload Matches (Manual Update)"
                                onClick={async () => {
                                  await handleShowPotentialMatches(entry.id);
                                  if (hasPotentialMatch) {
                                    setPotentialTab('matched');
                                  } else {
                                    setPotentialTab('rejected');
                                  }
                                }}
                              >
                                <InformationCircleIcon className="h-4 w-4 text-gray-400" /> Manual Update
                              </button>
                            );
                          } else {
                            return (
                              <span className="flex items-center gap-1 text-gray-400 text-sm font-semibold"><InformationCircleIcon className="h-4 w-4 text-gray-300" /> Manual Update</span>
                            );
                          }
                        }
                        // Only Rejected Matches
                        if (!entry.actual_amount && !entry.actual_date && hasRejectedMatches && !hasPotentialMatch) {
                          return (
                            <button
                              className="flex items-center gap-1 text-red-600 underline hover:text-red-800 text-sm font-semibold"
                              aria-label="View Rejected Matches"
                              onClick={async () => {
                                await handleShowPotentialMatches(entry.id);
                                setPotentialTab('rejected');
                              }}
                            >
                              <XCircleIcon className="h-4 w-4" /> Rejected Matches
                            </button>
                          );
                        }
                        // Both Potential Match and Rejected Matches (stacked)
                        if (hasPotentialMatch && hasRejectedMatches) {
                          return (
                            <div className="flex flex-col items-start gap-1">
                              <button
                                className="flex items-center gap-1 text-yellow-600 underline hover:text-yellow-800 text-sm font-semibold"
                                aria-label="Review Potential Match"
                                data-tooltip-id={`potential-tooltip-${entry.id}`}
                                onClick={() => handleShowPotentialMatches(entry.id)}
                              >
                                <InformationCircleIcon className="h-4 w-4" /> Potential Match
                              </button>
                              <button
                                className="flex items-center gap-1 text-red-600 underline hover:text-red-800 text-sm font-semibold"
                                aria-label="View Rejected Matches"
                                onClick={async () => {
                                  await handleShowPotentialMatches(entry.id);
                                  setPotentialTab('rejected');
                                }}
                              >
                                <XCircleIcon className="h-4 w-4" /> Rejected Matches
                              </button>
                            </div>
                          );
                        }
                        // Only Potential Match
                        if (hasPotentialMatch) {
                          return (
                            <button
                              className="flex items-center gap-1 text-yellow-600 underline hover:text-yellow-800 text-sm font-semibold"
                              aria-label="Review Potential Match"
                              data-tooltip-id={`potential-tooltip-${entry.id}`}
                              onClick={() => handleShowPotentialMatches(entry.id)}
                            >
                              <InformationCircleIcon className="h-4 w-4" /> Potential Match
                            </button>
                          );
                        }
                        // Default: --
                        return <span className="text-gray-300 text-sm font-semibold">--</span>;
                      })()}
                      <Tooltip id={`upload-tooltip-${entry.id}`}>View details of the upload that set these actuals</Tooltip>
                      <Tooltip id={`potential-tooltip-${entry.id}`}>Review and confirm a potential match from an upload</Tooltip>
                    </div>
                  </td>
                  {/* At the end of the row, if this is the new row, show Save/Cancel icons */}
                  {entry.id === newRowId ? (
                    <td className="px-2 py-1 flex gap-1">
                      <button className="btn btn-xs btn-success" onClick={handleSaveNewRow}>Save</button>
                      <button className="btn btn-xs btn-ghost" onClick={handleCancelNewRow}>Cancel</button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {!showAll && (
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-xs" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span className="px-2">Page {page} of {Math.ceil(total / PAGE_SIZE) || 1}</span>
          <button className="btn btn-xs" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
      {/* Upload Info Modal */}
      {showUploadModal && uploadModalData && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative border-2 border-green-200">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold" onClick={() => setShowUploadModal(false)} aria-label="Close">&times;</button>
            <h2 className="text-2xl font-extrabold mb-4 text-green-700 flex items-center gap-2">
              <DocumentMagnifyingGlassIcon className="h-6 w-6 text-green-500" /> Upload Details
            </h2>
            <div className="mb-3 flex flex-col gap-2 text-base">
              <div><b className="text-gray-600">Vendor:</b> <span className="text-gray-900">{uploadModalData.vendorName}</span></div>
              <div><b className="text-gray-600">Description:</b> <span className="text-gray-900">{uploadModalData.description}</span></div>
              <div><b className="text-gray-600">Amount:</b> <span className="text-green-700 font-semibold">${Number(uploadModalData.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div><b className="text-gray-600">Date:</b> <span className="text-gray-900">{uploadModalData.transactionDate ? new Date(uploadModalData.transactionDate).toLocaleDateString() : ''}</span></div>
              <div><b className="text-gray-600">Status:</b> <span className="text-gray-900 capitalize">{uploadModalData.status}</span></div>
              <div><b className="text-gray-600">Upload Session:</b> <span className="text-gray-900">{uploadModalData.importSession?.originalFilename}</span></div>
              {uploadModalData.importSession?.description && (
                <div><b className="text-gray-600">Session Description:</b> <span className="text-gray-900">{uploadModalData.importSession.description}</span></div>
              )}
              <div><b className="text-gray-600">Uploaded:</b> <span className="text-gray-900">{uploadModalData.importSession?.createdAt ? new Date(uploadModalData.importSession.createdAt).toLocaleString() : ''}</span></div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end items-center mt-6 gap-4">
              {uploadModalData.status === 'confirmed' && (
                <button
                  className="btn btn-error px-6 py-2 text-base font-semibold rounded shadow hover:bg-red-700 transition mb-2 sm:mb-0"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to remove this match? This will revert the actuals and restore potential matches.')) {
                      try {
                        const response = await fetch(`/api/import/transaction/${uploadModalData.id}/remove-match`, { method: 'POST' });
                        if (response.ok) {
                          // Find the ledger entry that was matched to this transaction
                          const matchedEntry = entries.find(entry => entry.importTransaction?.id === uploadModalData.id);
                          if (matchedEntry) {
                            // Add this entry back to potential matches
                            setPotentialMatchIds(prev => [...prev, matchedEntry.id]);
                            // Remove from rejected matches if it was there
                            setEntriesWithRejectedMatches(prev => {
                              const newSet = new Set(Array.from(prev));
                              newSet.delete(matchedEntry.id);
                              return newSet;
                            });
                          }
                          setShowUploadModal(false);
                          fetchEntries();
                        } else {
                          console.error('Failed to remove match');
                        }
                      } catch (error) {
                        console.error('Error removing match:', error);
                      }
                    }
                  }}
                >
                  Remove Match
                </button>
              )}
              <button className="btn btn-primary px-6 py-2 text-base font-semibold rounded shadow hover:bg-green-700 transition" onClick={() => setShowUploadModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showPotentialModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full min-w-[320px] relative border-2 border-blue-200 overflow-x-hidden px-8">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold" onClick={() => setShowPotentialModal(false)} aria-label="Close">&times;</button>
            <h2 className="text-2xl font-extrabold mb-4 text-blue-700 flex items-center gap-2">
              <InformationCircleIcon className="h-6 w-6 text-yellow-500" />
              {currentMatches.length > 1 ? 'Multiple Potential Matches' : 'Potential Match'}
            </h2>
            <div className="flex gap-4 mb-4 border-b border-blue-200">
              <button
                className={`px-4 py-2 font-bold border-b-2 transition ${potentialTab === 'matched' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
                onClick={() => { setPotentialTab('matched'); setPotentialIndex(0); }}
              >
                Potential Matches
              </button>
              <button
                className={`px-4 py-2 font-bold border-b-2 transition ${potentialTab === 'rejected' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
                onClick={() => { setPotentialTab('rejected'); setPotentialIndex(0); }}
              >
                Rejected
              </button>
            </div>
            {currentMatches.length === 0 && (
              <div className="flex-1 flex items-center justify-center min-h-[120px] text-gray-500 text-lg font-semibold py-8">
                {potentialTab === 'matched'
                  ? 'No potential matches for this ledger entry.'
                  : 'No rejected matches for this ledger entry.'}
              </div>
            )}
            {currentMatches.length > 0 && currentMatches[potentialIndex] && (
              <div className="flex flex-col sm:flex-row gap-10 mb-6">
                {/* Ledger Entry Section */}
                <div className="flex-1 bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Ledger Entry</h3>
                  <div className="flex flex-col gap-1 text-base">
                    <div><b className="text-gray-600">Vendor:</b> <span className="text-gray-900">{entries.find(e => e.id === potentialLedgerEntryId)?.vendor_name || '--'}</span></div>
                    <div><b className="text-gray-600">Description:</b> <span className="text-gray-900">{entries.find(e => e.id === potentialLedgerEntryId)?.expense_description || '--'}</span></div>
                    <div><b className="text-gray-600">Amount:</b> <span className="text-blue-700 font-semibold">${Number(entries.find(e => e.id === potentialLedgerEntryId)?.planned_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div><b className="text-gray-600">Date:</b> <span className="text-gray-900">{
                      (() => {
                        const plannedDate = entries.find(e => e.id === potentialLedgerEntryId)?.planned_date;
                        if (!plannedDate) return '--';
                        // Force local time by appending T00:00:00
                        const localDate = new Date(plannedDate + 'T00:00:00');
                        return localDate.toLocaleDateString();
                      })()
                    }</span></div>
                    <div><b className="text-gray-600">WBS Category:</b> <span className="text-gray-900">{entries.find(e => e.id === potentialLedgerEntryId)?.wbs_category || '--'}</span></div>
                    <div><b className="text-gray-600">WBS Subcategory:</b> <span className="text-gray-900">{entries.find(e => e.id === potentialLedgerEntryId)?.wbs_subcategory || '--'}</span></div>
                    {entries.find(e => e.id === potentialLedgerEntryId)?.notes && (
                      <div><b className="text-gray-600">Notes:</b> <span className="text-gray-900">{entries.find(e => e.id === potentialLedgerEntryId)?.notes}</span></div>
                    )}
                  </div>
                </div>
                {/* Divider and Potential/Rejected Match Section */}
                <div className={`flex-1 rounded-lg p-6 border ${potentialTab === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                  <h3 className={`text-lg font-bold mb-2 ${potentialTab === 'rejected' ? 'text-red-700' : 'text-blue-700'}`}>{potentialTab === 'matched' ? 'Potential Upload Match' : 'Rejected Match'}</h3>
                  <div className="mb-3 flex flex-col gap-2 text-base">
                    <div><b className="text-gray-600">Vendor:</b> <span className="text-gray-900">{currentMatches[potentialIndex].vendorName}</span></div>
                    <div><b className="text-gray-600">Description:</b> <span className="text-gray-900">{currentMatches[potentialIndex].description}</span></div>
                    <div><b className="text-gray-600">Amount:</b> <span className="text-blue-700 font-semibold">${Number(currentMatches[potentialIndex].amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div><b className="text-gray-600">Date:</b> <span className="text-gray-900">{currentMatches[potentialIndex].transactionDate ? new Date(currentMatches[potentialIndex].transactionDate).toLocaleDateString() : ''}</span></div>
                    <div><b className="text-gray-600">Status:</b> <span className="text-gray-900 capitalize">{currentMatches[potentialIndex].status}</span></div>
                    <div><b className="text-gray-600">Upload Session:</b> <span className="text-gray-900">{currentMatches[potentialIndex].importSession?.originalFilename}</span></div>
                    <div><b className="text-gray-600">Match Confidence:</b> <span className={`font-bold ${Number(currentMatches[potentialIndex].matchConfidence ?? currentMatches[potentialIndex].confidence ?? 0) >= 0.8 ? 'text-green-600' : Number(currentMatches[potentialIndex].matchConfidence ?? currentMatches[potentialIndex].confidence ?? 0) >= 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>{((Number(currentMatches[potentialIndex].matchConfidence ?? currentMatches[potentialIndex].confidence ?? 0)) * 100).toFixed(1)}%</span></div>
                  </div>
                  {potentialTab === 'rejected' && (
                    <button
                      className="mt-2 px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                      onClick={async () => {
                        const undoId = currentMatches[potentialIndex].id;
                        try {
                          const res = await fetch(`/api/import/transaction/${undoId}/undo-reject`, { method: 'POST' });
                          if (!res.ok) throw new Error('Failed to undo rejection');
                          // Move match back to matched and refresh modal state
                          const undoneMatch = potentialRejected[potentialIndex];
                          const newRejected = potentialRejected.filter((_, i) => i !== potentialIndex);
                          const newMatched = [...potentialMatched, { ...undoneMatch, status: 'matched' }];
                          setPotentialRejected(newRejected);
                          setPotentialMatched(newMatched);
                          // Remove this entry from the rejected matches set if there are no more rejected matches
                          if (newRejected.length === 0 && potentialLedgerEntryId) {
                            setEntriesWithRejectedMatches(prev => {
                              const newSet = new Set(Array.from(prev));
                              newSet.delete(potentialLedgerEntryId);
                              return newSet;
                            });
                          }
                          // Add this entry to potentialMatchIds if there is at least one matched item
                          if (newMatched.length > 0 && potentialLedgerEntryId) {
                            setPotentialMatchIds(prev => {
                              if (!prev.includes(potentialLedgerEntryId)) {
                                return [...prev, potentialLedgerEntryId];
                              }
                              return prev;
                            });
                          } else if (newMatched.length === 0 && potentialLedgerEntryId) {
                            // If there are no more matched items, remove from potentialMatchIds
                            setPotentialMatchIds(prev => prev.filter(id => String(id) !== String(potentialLedgerEntryId)));
                          }
                        } catch (err) {
                          setToast({ message: 'Failed to undo rejection.', type: 'error' });
                        }
                        fetchEntries();
                      }}
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              {potentialTab === 'matched' && (
                <div className="flex gap-3">
                  <button
                    className="btn btn-primary px-6 py-2 text-base font-semibold rounded shadow hover:bg-blue-700 transition"
                    onClick={async () => {
                      console.log('Confirm button clicked for transaction:', currentMatches[potentialIndex]);
                      try {
                        const response = await fetch(`/api/import/transaction/${currentMatches[potentialIndex].id}/confirm-match`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ledgerEntryId: potentialLedgerEntryId }),
                        });
                        console.log('Confirm match response:', response.status, response.statusText);
                        if (response.ok) {
                          const result = await response.json();
                          console.log('Confirm match result:', result);
                        } else {
                          const error = await response.text();
                          console.error('Confirm match error:', error);
                        }
                        setShowPotentialModal(false);
                        fetchEntries();
                      } catch (error) {
                        console.error('Confirm match exception:', error);
                      }
                    }}
                  >
                    <CheckCircleIcon className="h-5 w-5 inline mr-1" /> Confirm
                  </button>
                  <button
                    className="btn btn-ghost px-6 py-2 text-base font-semibold rounded shadow hover:bg-gray-200 transition"
                    onClick={async () => {
                      await fetch(`/api/import/transaction/${currentMatches[potentialIndex].id}/reject`, { method: 'POST' });
                      // Move the rejected match to the rejected tab immediately, regardless of tab
                      const rejectedMatch = potentialMatched[potentialIndex];
                      const newMatched = potentialMatched.filter((_, i) => i !== potentialIndex);
                      setPotentialMatched(newMatched);
                      setPotentialRejected(prev => [...prev, { ...rejectedMatch, status: 'rejected' }]);
                      // Add this entry to the rejected matches set
                      setEntriesWithRejectedMatches(prev => new Set([...Array.from(prev), potentialLedgerEntryId!]));
                      // If there are no more matched items, remove from potentialMatchIds and ensure Upload column updates
                      if (newMatched.length === 0 && potentialLedgerEntryId) {
                        setPotentialMatchIds(prev => prev.filter(id => String(id) !== String(potentialLedgerEntryId)));
                        setEntriesWithRejectedMatches(prev => new Set([...Array.from(prev), potentialLedgerEntryId!]));
                      }
                      // If you are on the rejected tab, update the index if needed
                      if ((potentialTab as 'matched' | 'rejected') === 'rejected') {
                        setPotentialIndex(i => Math.max(0, i - (i === newMatched.length ? 1 : 0)));
                      }
                      // If there are no more matches, close the modal (only if on matched tab)
                      if (newMatched.length === 0 && (potentialTab as 'matched' | 'rejected') === 'matched') {
                        setShowPotentialModal(false);
                      } else if (newMatched.length > 0 && (potentialTab as 'matched' | 'rejected') === 'matched') {
                        // Move to the next match
                        setPotentialIndex(i => Math.min(i, newMatched.length - 1));
                      }
                      setToast({ message: 'Match rejected.', type: 'success', undoId: rejectedMatch.id });
                      fetchEntries();
                    }}
                  >
                    <XCircleIcon className="h-5 w-5 inline mr-1" /> Reject
                  </button>
                </div>
              )}
              {currentMatches.length > 1 && (
                <div className="flex items-center justify-center mt-4 mx-4">
                  <div className="flex flex-nowrap items-center gap-3 bg-blue-50 px-4 py-2 rounded shadow border border-blue-200">
                    <button
                      className="btn btn-xs btn-outline border-blue-400 text-blue-700 font-bold px-4 py-1 rounded flex items-center gap-1"
                      disabled={potentialIndex === 0}
                      onClick={() => setPotentialIndex(i => Math.max(0, i - 1))}
                      aria-label="Previous potential match"
                    >
                      <span aria-hidden="true">&#8592;</span>
                      <span>Prev</span>
                    </button>
                    <span className="text-base font-semibold text-blue-700 whitespace-nowrap">{potentialIndex + 1} / {currentMatches.length}</span>
                    <button
                      className="btn btn-xs btn-outline border-blue-400 text-blue-700 font-bold px-4 py-1 rounded flex items-center gap-1"
                      disabled={potentialIndex === currentMatches.length - 1}
                      onClick={() => setPotentialIndex(i => Math.min(currentMatches.length - 1, i + 1))}
                      aria-label="Next potential match"
                    >
                      <span>Next</span>
                      <span aria-hidden="true">&#8594;</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white border border-gray-300 shadow-lg rounded-lg px-6 py-3 flex items-center gap-4 animate-fade-in">
          <span className={`font-semibold ${toast.message === 'Match rejected.' ? 'text-red-600' : toast.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>{toast.message}</span>
          {toast.undoId && (
            <button
              className="ml-2 px-3 py-1 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
              onClick={async () => {
                await fetch(`/api/import/transaction/${toast.undoId}/undo-reject`, { method: 'POST' });
                setToast(null);
                fetchEntries();
              }}
            >
              Undo
            </button>
          )}
          <button className="ml-2 text-gray-400 hover:text-gray-600 text-xl font-bold" onClick={() => setToast(null)} aria-label="Close">&times;</button>
        </div>
      )}
    </div>
  );
};

export default LedgerTable; 