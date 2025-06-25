import React from 'react';
import { InformationCircleIcon, DocumentMagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import { LedgerEntry } from './index';

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
  fetchEntries: () => void;
  
  // Utils
  formatCurrency: (val: any) => string;
  highlightedRowRef: React.RefObject<HTMLTableRowElement>;
  programId: string;
  // Add filter props
  filterType: 'all' | 'currentMonthPlanned' | 'emptyActuals';
  vendorFilter?: string;
  wbsCategoryFilter?: string;
  wbsSubcategoryFilter?: string;
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
  fetchEntries,
  formatCurrency,
  highlightedRowRef,
  programId,
  // Add filter props
  filterType,
  vendorFilter,
  wbsCategoryFilter,
  wbsSubcategoryFilter,
}) => {
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
              <div><b className="text-gray-600">Amount:</b> <span className="text-green-700 font-semibold">{formatCurrency(uploadModalData.amount)}</span></div>
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
    </>
  );
};

export default LedgerTableTable; 