import React from 'react';
import { InformationCircleIcon, DocumentMagnifyingGlassIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import { LedgerEntry } from './index';

// Type for potential match objects
export interface PotentialMatch {
  id: string;
  vendorName: string;
  description: string;
  amount: number;
  transactionDate: string;
  status: string;
  actualsUploadSession?: {
    id: string;
    originalFilename: string;
    description: string;
    createdAt: string;
  } | null;
  matchConfidence?: number;
  confidence?: number;
}

interface LedgerTableTableProps {
  // Data
  sortedEntries: LedgerEntry[];
  total: number;
  page: number;
  showAll?: boolean;
  PAGE_SIZE: number;
  
  // State
  selectedRows: string[];
  editingCell: { rowId: string, field: string } | null;
  cellEditValue: any;
  highlightId: string | null;
  newRowId: string | null;
  popover: { rowId: string | null, anchorEl: HTMLElement | null };
  popoverText: string;
  popoverUrl: string;
  entriesWithRejectedMatches: Set<string>;
  potentialMatchIds: string[];
  showUploadModal: boolean;
  uploadModalData: any;
  showPotentialModal: boolean;
  potentialIndex: number;
  potentialLedgerEntryId: string | null;
  
  // Options
  wbsCategoryOptions: string[];
  wbsSubcategoryOptions: string[];
  vendorOptions: string[];
  
  // Handlers
  handleSelectAll: () => void;
  handleSelectRow: (id: string) => void;
  handleCellClick: (rowId: string, field: string, value: any) => void;
  handleCellInputChange: (e: React.ChangeEvent<any>) => void;
  handleCellInputBlur: (rowId: string, field: string) => void;
  handleCellInputKeyDown: (e: React.KeyboardEvent, rowId: string, field: string) => void;
  handlePopoverOpen: (rowId: string, text: string | null | undefined, url: string | null | undefined, event: React.MouseEvent) => void;
  handlePopoverClose: () => void;
  handlePopoverSave: () => void;
  handlePopoverKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleShowPotentialMatches: (entryId: string) => void;
  handleSaveNewRow: () => void;
  handleCancelNewRow: () => void;
  setPage: (page: number) => void;
  setShowUploadModal: (show: boolean) => void;
  setUploadModalData: (data: any) => void;
  setPopoverText: (text: string) => void;
  setPopoverUrl: (url: string) => void;
  setPotentialTab: (tab: 'matched' | 'rejected') => void;
  setPotentialIndex: (index: number | ((prev: number) => number)) => void;
  setPotentialLedgerEntryId: (id: string | null) => void;
  fetchEntries: () => void;
  setShowPotentialModal: (show: boolean) => void;
  
  // Utils
  formatCurrency: (val: any) => string;
  highlightedRowRef: React.RefObject<HTMLTableRowElement>;
  programId: string;
  // Add filter props
  filterType: 'all' | 'currentMonthPlanned' | 'emptyActuals';
  vendorFilter?: string;
  wbsCategoryFilter?: string;
  wbsSubcategoryFilter?: string;
  potentialTab: 'matched' | 'rejected';
  potentialMatched: PotentialMatch[];
  setPotentialMatched: (matches: PotentialMatch[] | ((prev: PotentialMatch[]) => PotentialMatch[])) => void;
  potentialRejected: PotentialMatch[];
  setPotentialRejected: (matches: PotentialMatch[] | ((prev: PotentialMatch[]) => PotentialMatch[])) => void;
  setToast: (toast: any) => void;
  setEntriesWithRejectedMatches: (set: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setPotentialMatchIds: (ids: string[] | ((prev: string[]) => string[])) => void;
}

const LedgerTableTable: React.FC<LedgerTableTableProps> = ({
  sortedEntries,
  total,
  page,
  showAll,
  PAGE_SIZE,
  selectedRows,
  editingCell,
  cellEditValue,
  highlightId,
  newRowId,
  popover,
  popoverText,
  popoverUrl,
  entriesWithRejectedMatches,
  potentialMatchIds,
  showUploadModal,
  uploadModalData,
  showPotentialModal,
  potentialIndex,
  potentialLedgerEntryId,
  wbsCategoryOptions,
  wbsSubcategoryOptions,
  vendorOptions,
  handleSelectAll,
  handleSelectRow,
  handleCellClick,
  handleCellInputChange,
  handleCellInputBlur,
  handleCellInputKeyDown,
  handlePopoverOpen,
  handlePopoverClose,
  handlePopoverSave,
  handlePopoverKeyDown,
  handleShowPotentialMatches,
  handleSaveNewRow,
  handleCancelNewRow,
  setPage,
  setShowUploadModal,
  setUploadModalData,
  setPopoverText,
  setPopoverUrl,
  setPotentialTab,
  setPotentialIndex,
  setPotentialLedgerEntryId,
  fetchEntries,
  formatCurrency,
  highlightedRowRef,
  programId,
  // Add filter props
  filterType,
  vendorFilter,
  wbsCategoryFilter,
  wbsSubcategoryFilter,
  setShowPotentialModal,
  potentialTab,
  potentialMatched,
  setPotentialMatched,
  potentialRejected,
  setPotentialRejected,
  setToast,
  setEntriesWithRejectedMatches,
  setPotentialMatchIds,
}) => {
  // Apply filtering to remove inappropriate statuses
  const filteredPotentialMatched = potentialMatched.filter(entry => 
    entry.status !== 'replaced' && entry.status !== 'rejected'
  );
  const filteredPotentialRejected = potentialRejected.filter(entry => 
    entry.status !== 'replaced'
  );
  const currentMatches = potentialTab === 'matched' ? filteredPotentialMatched : filteredPotentialRejected;

  // Function to refresh rejected match IDs from backend
  const refreshRejectedMatchIds = async () => {
    try {
      console.log('[DEBUG] Refreshing rejected match IDs...');
      const res = await fetch(`/api/programs/${programId}/ledger/rejected-match-ids`);
      if (res.ok) {
        const ids = await res.json();
        console.log('[DEBUG] Received rejected match IDs:', ids);
        setEntriesWithRejectedMatches(new Set(ids));
        console.log('[DEBUG] Updated entriesWithRejectedMatches state');
      } else {
        console.error('[DEBUG] Failed to fetch rejected match IDs:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Failed to refresh rejected match IDs:', error);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-2"><input type="checkbox" checked={selectedRows.length === sortedEntries.length && sortedEntries.length > 0} onChange={handleSelectAll} /></th>
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
            {sortedEntries.map((entry, idx) => {
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
                        
                        // Debug logging for this entry
                        if (hasRejectedMatches || hasPotentialMatch) {
                          console.log(`[DEBUG] Entry ${entry.id}: hasRejectedMatches=${hasRejectedMatches}, hasPotentialMatch=${hasPotentialMatch}`);
                        }
                        
                        // If entry HAS actuals
                        if (entry.actual_amount && entry.actual_date) {
                          // View Upload - if the actuals are tied to an upload transaction
                          if (entry.actualsUploadTransaction && (entry.actualsUploadTransaction.status === 'confirmed' || entry.actualsUploadTransaction.status === 'added_to_ledger')) {
                            return (
                              <button
                                className="flex items-center gap-1 text-blue-600 underline hover:text-blue-800 text-sm font-semibold"
                                aria-label="View Upload Details"
                                data-tooltip-id={`upload-tooltip-${entry.id}`}
                                onClick={() => { setUploadModalData(entry.actualsUploadTransaction); setShowUploadModal(true); }}
                              >
                                <DocumentMagnifyingGlassIcon className="h-4 w-4" /> View Upload
                              </button>
                            );
                          }
                          // Manual Update - if the actuals were entered without being tied to an upload transaction
                          else {
                            return (
                              <span className="flex items-center gap-1 text-gray-400 text-sm font-semibold">
                                <InformationCircleIcon className="h-4 w-4 text-gray-300" /> Manual Update
                              </span>
                            );
                          }
                        }
                        // If entry DOESN'T have actuals
                        else {
                          // Potential Match - if it has at least one potential match
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
                          // Rejected Matches - if it has no potential matches but has rejected matches
                          else if (hasRejectedMatches) {
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
                          // Nothing "--" - if it doesn't have a potential match or rejected matches
                          else {
                            return <span className="text-gray-300 text-sm font-semibold">--</span>;
                          }
                        }
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
                        const response = await fetch(`/api/import/transaction/${uploadModalData.id}/remove-match`, { method: 'POST' });
                        if (response.ok) {
                          setShowUploadModal(false);
                          // Refresh all data from backend to get updated state
                          fetchEntries();
                          // Refresh potential match IDs
                          const res = await fetch(`/api/programs/${programId}/ledger/potential-match-ids`);
                          const ids = await res.json();
                          // Refresh rejected match IDs
                          const rejectedRes = await fetch(`/api/programs/${programId}/ledger/rejected-match-ids`);
                          if (rejectedRes.ok) {
                            const rejectedIds = await rejectedRes.json();
                          }
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
                    <div><b className="text-gray-600">Vendor:</b> <span className="text-gray-900">{sortedEntries.find((e: LedgerEntry) => e.id === potentialLedgerEntryId)?.vendor_name || '--'}</span></div>
                    <div><b className="text-gray-600">Description:</b> <span className="text-gray-900">{sortedEntries.find((e: LedgerEntry) => e.id === potentialLedgerEntryId)?.expense_description || '--'}</span></div>
                    <div><b className="text-gray-600">Amount:</b> <span className="text-blue-700 font-semibold">{formatCurrency(sortedEntries.find((e: LedgerEntry) => e.id === potentialLedgerEntryId)?.planned_amount ?? 0)}</span></div>
                    <div><b className="text-gray-600">Date:</b> <span className="text-gray-900">{
                      (() => {
                        const plannedDate = sortedEntries.find((e: LedgerEntry) => e.id === potentialLedgerEntryId)?.planned_date;
                        if (!plannedDate) return '--';
                        const localDate = new Date(plannedDate + 'T00:00:00');
                        return localDate.toLocaleDateString();
                      })()
                    }</span></div>
                    <div><b className="text-gray-600">WBS Category:</b> <span className="text-gray-900">{sortedEntries.find((e: LedgerEntry) => e.id === potentialLedgerEntryId)?.wbs_category || '--'}</span></div>
                    <div><b className="text-gray-600">WBS Subcategory:</b> <span className="text-gray-900">{sortedEntries.find((e: LedgerEntry) => e.id === potentialLedgerEntryId)?.wbs_subcategory || '--'}</span></div>
                    {sortedEntries.find((e: LedgerEntry) => e.id === potentialLedgerEntryId)?.notes && (
                      <div><b className="text-gray-600">Notes:</b> <span className="text-gray-900">{sortedEntries.find((e: LedgerEntry) => e.id === potentialLedgerEntryId)?.notes}</span></div>
                    )}
                  </div>
                </div>
                {/* Divider and Potential/Rejected Match Section */}
                <div className={`flex-1 rounded-lg p-6 border ${potentialTab === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                  <h3 className={`text-lg font-bold mb-2 ${potentialTab === 'rejected' ? 'text-red-700' : 'text-blue-700'}`}>{potentialTab === 'matched' ? 'Potential Upload Match' : 'Rejected Match'}</h3>
                  <div className="mb-3 flex flex-col gap-2 text-base">
                    <div><b className="text-gray-600">Vendor:</b> <span className="text-gray-900">{currentMatches[potentialIndex].vendorName}</span></div>
                    <div><b className="text-gray-600">Description:</b> <span className="text-gray-900">{currentMatches[potentialIndex].description}</span></div>
                    <div><b className="text-gray-600">Amount:</b> <span className="text-blue-700 font-semibold">{formatCurrency(currentMatches[potentialIndex].amount)}</span></div>
                    <div><b className="text-gray-600">Date:</b> <span className="text-gray-900">{currentMatches[potentialIndex].transactionDate ? new Date(currentMatches[potentialIndex].transactionDate).toLocaleDateString() : ''}</span></div>
                    <div><b className="text-gray-600">Status:</b> <span className="text-gray-900 capitalize">{currentMatches[potentialIndex].status}</span></div>
                    <div><b className="text-gray-600">Upload Session:</b> <span className="text-gray-900">{currentMatches[potentialIndex].actualsUploadSession?.originalFilename}</span></div>
                    <div><b className="text-gray-600">Match Confidence:</b> <span className={`font-bold ${Number(currentMatches[potentialIndex].matchConfidence ?? currentMatches[potentialIndex].confidence ?? 0) >= 0.8 ? 'text-green-600' : Number(currentMatches[potentialIndex].matchConfidence ?? currentMatches[potentialIndex].confidence ?? 0) >= 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>{((Number(currentMatches[potentialIndex].matchConfidence ?? currentMatches[potentialIndex].confidence ?? 0)) * 100).toFixed(1)}%</span></div>
                  </div>
                  {potentialTab === 'rejected' && (
                    <button
                      className="mt-2 px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                      onClick={async () => {
                        const undoId = currentMatches[potentialIndex].id;
                        console.log('[UNDO REJECT] Starting undo for transaction:', undoId, 'ledgerEntry:', potentialLedgerEntryId);
                        try {
                          const res = await fetch(`/api/import/transaction/${undoId}/undo-reject`, { 
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ledgerEntryId: potentialLedgerEntryId })
                          });
                          if (!res.ok) throw new Error('Failed to undo rejection');
                          
                          console.log('[UNDO REJECT] API call successful, response status:', res.status);
                          
                          // Add a small delay to ensure backend processing is complete
                          await new Promise(resolve => setTimeout(resolve, 100));
                          
                          const undoneMatch = currentMatches[potentialIndex];
                          console.log('[UNDO REJECT] Moving match from rejected to potential:', undoneMatch);
                          
                          // Move from rejected to potential
                          setPotentialRejected(prev => prev.filter(m => m.id !== undoneMatch.id));
                          setPotentialMatched(prev => [...prev, undoneMatch]);
                          setPotentialIndex(0);
                          setPotentialTab('matched');
                          
                          // Update the rejected matches state for the upload column
                          setEntriesWithRejectedMatches(prev => {
                            const newSet = new Set(prev);
                            // Only remove from rejected if this was the last rejected match for this ledger entry
                            if (potentialLedgerEntryId) {
                              const remainingRejectedForEntry = potentialRejected.filter(m => 
                                (m as any).ledgerEntry?.id === potentialLedgerEntryId && m.id !== undoneMatch.id
                              );
                              if (remainingRejectedForEntry.length === 0) {
                                newSet.delete(potentialLedgerEntryId);
                              }
                            }
                            console.log('[UNDO REJECT] Updated rejected matches set:', Array.from(newSet));
                            return newSet;
                          });
                          
                          // Refresh potential match IDs
                          const refreshRes = await fetch(`/api/programs/${programId}/ledger/potential-match-ids`);
                          if (refreshRes.ok) {
                            const ids = await refreshRes.json();
                            setPotentialMatchIds(ids);
                            console.log('[UNDO REJECT] Refreshed potential match IDs:', ids);
                          }
                          
                          setToast({ message: 'Rejection undone successfully', type: 'success' });
                        } catch (error) {
                          console.error('[UNDO REJECT] Error:', error);
                          setToast({ message: 'Failed to undo rejection', type: 'error' });
                        }
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
                      try {
                        const response = await fetch(`/api/import/transaction/${currentMatches[potentialIndex].id}/confirm-match`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ledgerEntryId: potentialLedgerEntryId }),
                        });
                        if (response.ok) {
                          console.log('[CONFIRM MATCH] Confirmed match for transaction:', currentMatches[potentialIndex].id, 'ledgerEntry:', potentialLedgerEntryId);
                          
                          // Remove ALL potential matches for this ledger entry (not just the current one)
                          const newMatched = potentialMatched.filter(match => 
                            (match as any).ledgerEntry?.id !== potentialLedgerEntryId
                          );
                          setPotentialMatched(newMatched);
                          
                          // Remove this ledger entry from potential match IDs
                          if (potentialLedgerEntryId) {
                            setPotentialMatchIds(prev => prev.filter(id => String(id) !== String(potentialLedgerEntryId)));
                          }
                          
                          // Close modal immediately after confirming
                          setShowPotentialModal(false);
                          
                          setToast({ message: 'Match confirmed successfully.', type: 'success' });
                          
                          // Refresh entries to update the upload column badge
                          fetchEntries();
                        } else {
                          const error = await response.text();
                          console.error('Confirm match error:', error);
                          setToast({ message: 'Failed to confirm match.', type: 'error' });
                        }
                      } catch (error) {
                        console.error('Confirm match exception:', error);
                        setToast({ message: 'Failed to confirm match.', type: 'error' });
                      }
                    }}
                  >
                    <CheckCircleIcon className="h-5 w-5 inline mr-1" /> Confirm
                  </button>
                  <button
                    className="btn btn-ghost px-6 py-2 text-base font-semibold rounded shadow hover:bg-gray-200 transition"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/import/transaction/${currentMatches[potentialIndex].id}/reject`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ledgerEntryId: potentialLedgerEntryId })
                        });
                        
                        if (response.ok) {
                          const rejectedMatch = currentMatches[potentialIndex];
                          
                          // Remove the rejected match from potential matches
                          const newMatched = potentialMatched.filter(match => 
                            match.id !== rejectedMatch.id
                          );
                          setPotentialMatched(newMatched);
                          
                          // Add to rejected matches
                          setPotentialRejected(prev => [...prev, { ...rejectedMatch, status: 'rejected' }]);
                          
                          // Mark this ledger entry as having rejected matches
                          if (potentialLedgerEntryId) {
                            setEntriesWithRejectedMatches(prev => new Set([...Array.from(prev), potentialLedgerEntryId]));
                          }
                          
                          // If no more potential matches for this ledger entry, remove it from potential match IDs
                          if (newMatched.length === 0 && potentialLedgerEntryId) {
                            setPotentialMatchIds(prev => prev.filter(id => String(id) !== String(potentialLedgerEntryId)));
                          }
                          
                          // Close modal if no more matches, but ensure state updates are processed first
                          if (newMatched.length === 0) {
                            // Use setTimeout to ensure state updates are processed before closing modal
                            setTimeout(() => {
                              setShowPotentialModal(false);
                            }, 0);
                          } else {
                            // Adjust index if we're at the end
                            setPotentialIndex(i => Math.min(i, newMatched.length - 1));
                          }
                          
                          setToast({ message: 'Match rejected.', type: 'success', undoId: rejectedMatch.id });
                          
                          // Refresh rejected match IDs from backend to ensure upload column badge updates
                          await refreshRejectedMatchIds();
                        } else {
                          setToast({ message: 'Failed to reject match.', type: 'error' });
                        }
                        
                        // Refresh entries to ensure UI is updated
                        fetchEntries();
                      } catch (error) {
                        console.error('Reject match exception:', error);
                        setToast({ message: 'Failed to reject match.', type: 'error' });
                      }
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
                      onClick={() => setPotentialIndex((i: number) => Math.max(0, i - 1))}
                      aria-label="Previous potential match"
                    >
                      <span aria-hidden="true">&#8592;</span>
                      <span>Prev</span>
                    </button>
                    <span className="text-base font-semibold text-blue-700 whitespace-nowrap">{potentialIndex + 1} / {currentMatches.length}</span>
                    <button
                      className="btn btn-xs btn-outline border-blue-400 text-blue-700 font-bold px-4 py-1 rounded flex items-center gap-1"
                      disabled={potentialIndex === currentMatches.length - 1}
                      onClick={() => setPotentialIndex((i: number) => Math.min(currentMatches.length - 1, i + 1))}
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
    </>
  );
};

export default LedgerTableTable; 