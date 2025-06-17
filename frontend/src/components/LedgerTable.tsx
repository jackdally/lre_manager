import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

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
}

interface LedgerTableProps {
  programId: string;
  showAll?: boolean;
  onChange?: () => void;
}

const PAGE_SIZE = 10;

// Required fields for a ledger entry
const requiredFields = ['vendor_name', 'expense_description', 'wbs_category', 'wbs_subcategory'];

function formatCurrency(val: number | undefined | null) {
  if (val == null) return '--';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val));
}

const LedgerTable: React.FC<LedgerTableProps> = ({ programId, showAll, onChange }) => {
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

  // For dropdowns
  const vendorOptions = Array.from(new Set(entries.map(e => e.vendor_name).filter(Boolean)));
  const wbsCategoryOptions = Array.from(new Set(entries.map(e => e.wbs_category).filter(Boolean)));
  const wbsSubcategoryOptions = Array.from(new Set(entries.map(e => e.wbs_subcategory).filter(Boolean)));

  const fetchEntries = useCallback(async () => {
    try {
      let res;
      if (showAll) {
        res = await axios.get(`http://localhost:4000/api/programs/${programId}/ledger`, {
          params: { page: 1, pageSize: 10000, search },
        });
      } else {
        res = await axios.get(`http://localhost:4000/api/programs/${programId}/ledger`, {
          params: { page, pageSize: PAGE_SIZE, search },
        });
      }
      setEntries(res.data.entries);
      setTotal(res.data.total);
    } catch (err) {
      // handle error
    }
  }, [programId, page, search, showAll]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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
      await axios.put(`http://localhost:4000/api/programs/${programId}/ledger/${rowId}`, { [field]: newValue });
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
      await axios.post(`http://localhost:4000/api/programs/${programId}/ledger`, { ...newEntry, id: undefined });
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
    await Promise.all(selectedRows.map(id => axios.put(`http://localhost:4000/api/programs/${programId}/ledger/${id}`, payload)));
    setShowBulkEditModal(false);
    setSelectedRows([]);
    fetchEntries();
    if (onChange) onChange();
  };

  // Bulk delete
  const handleBulkDelete = () => setShowBulkDeleteModal(true);
  const handleBulkDeleteConfirm = async () => {
    await Promise.all(selectedRows.map(id => axios.delete(`http://localhost:4000/api/programs/${programId}/ledger/${id}`)));
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
    await axios.put(`http://localhost:4000/api/programs/${programId}/ledger/${popover.rowId}`, {
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
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr key={entry.id} className={entry.id === newRowId ? 'bg-blue-50' : ''}>
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
                {/* At the end of the row, if this is the new row, show Save/Cancel icons */}
                {entry.id === newRowId ? (
                  <td className="px-2 py-1 flex gap-1">
                    <button className="btn btn-xs btn-success" onClick={handleSaveNewRow}>Save</button>
                    <button className="btn btn-xs btn-ghost" onClick={handleCancelNewRow}>Cancel</button>
                  </td>
                ) : null}
              </tr>
            ))}
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
    </div>
  );
};

export default LedgerTable; 