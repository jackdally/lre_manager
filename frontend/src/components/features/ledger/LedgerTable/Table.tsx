import React, { useCallback, useState } from 'react';
import { InformationCircleIcon, DocumentMagnifyingGlassIcon, XCircleIcon, CheckCircleIcon, ClockIcon, EllipsisVerticalIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import type { LedgerEntry } from '../../../../types/ledger';
import { PotentialMatchData, RejectedMatchData } from '../../../../types/actuals';
import { useLedgerUI } from '../../../../store/ledgerStore';
import { Vendor } from '../../../../store/settingsStore';
import LedgerMatchModal from './LedgerMatchModal';
import LinkToRiskModal from '../LinkToRiskModal';
import UtilizeMRModal from '../UtilizeMRModal';
import RiskLinkIndicator from '../RiskLinkIndicator';


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
  loadingPotential: boolean;
  loading?: boolean;
  searchLoading?: boolean;
  
  // Options
  vendorOptions: Vendor[];
  dropdownOptions: {
    vendors: Vendor[];
    wbsElements: Array<{
      id: string;
      code: string;
      name: string;
      description: string;
      level: number;
      parentId?: string;
    }>;
    costCategories: Array<{
      id: string;
      code: string;
      name: string;
      description: string;
      isActive: boolean;
    }>;
  };
  
  // Handlers
  handleSelectAll: () => void;
  handleSelectRow: (id: string) => void;
  handleCellClick: (rowId: string, field: string, value: any) => void;
  handleCellInputChange: (e: React.ChangeEvent<any>) => void;
  handleCellInputBlur: (rowId: string, field: string, value?: string) => void;
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
  searchTerm?: string;
  // Add filter props
  filterType: 'all' | 'currentMonthPlanned' | 'emptyActuals';
  vendorFilter?: string;
  wbsElementFilter?: string;
  potentialTab: 'matched' | 'rejected';
  potentialMatched: PotentialMatchData[];
  setPotentialMatched: (matches: PotentialMatchData[] | ((prev: PotentialMatchData[]) => PotentialMatchData[])) => void;
  potentialRejected: RejectedMatchData[];
  setPotentialRejected: (matches: RejectedMatchData[] | ((prev: RejectedMatchData[]) => RejectedMatchData[])) => void;
  setToast: (toast: any) => void;
  setEntriesWithRejectedMatches: (set: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setPotentialMatchIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  // Add hook action methods
  confirmMatch: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  rejectMatch: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  undoReject: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Audit Trail
  onAuditTrailClick?: (entryId: string, entry: LedgerEntry) => void;
  
  // Edit Modal
  onEditEntry?: (entry: LedgerEntry) => void;
}

// Row Actions Menu Component
interface RowActionsMenuProps {
  entry: LedgerEntry;
  onEdit: () => void;
  onAuditTrail: () => void;
  hasPotentialMatch: boolean;
  hasRejectedMatches: boolean;
  hasActuals: boolean;
  actualsUploadTransaction?: any;
  onShowPotentialMatches: () => void;
  onViewUpload: () => void;
  setPotentialTab: (tab: 'matched' | 'rejected') => void;
  onLinkRisk: () => void;
  onUtilizeMR: () => void;
}

const RowActionsMenu: React.FC<RowActionsMenuProps> = ({
  entry,
  onEdit,
  onAuditTrail,
  hasPotentialMatch,
  hasRejectedMatches,
  hasActuals,
  actualsUploadTransaction,
  onShowPotentialMatches,
  onViewUpload,
  setPotentialTab,
  onLinkRisk,
  onUtilizeMR,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Row actions"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Entry
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAuditTrail();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <ClockIcon className="h-4 w-4" />
              View Audit Trail
            </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLinkRisk();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 flex items-center gap-2"
                  >
                    Link to Risk
                  </button>

                  {hasActuals && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUtilizeMR();
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                    >
                      Utilize MR
                    </button>
                  )}

            {actualsUploadTransaction && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewUpload();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <DocumentMagnifyingGlassIcon className="h-4 w-4" />
                View Upload Details
              </button>
            )}

            {!hasActuals && hasPotentialMatch && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowPotentialMatches();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 flex items-center gap-2"
              >
                <InformationCircleIcon className="h-4 w-4" />
                Review Potential Match
              </button>
            )}

            {!hasActuals && !hasPotentialMatch && hasRejectedMatches && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowPotentialMatches();
                  setPotentialTab('rejected');
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
              >
                <XCircleIcon className="h-4 w-4" />
                View Rejected Matches
              </button>
            )}

            <div className="border-t border-gray-200 my-1"></div>

            <div className="px-4 py-2 text-xs text-gray-500">
              Double-click row to edit
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LedgerTableTable: React.FC<Omit<LedgerTableTableProps, 'potentialMatchIds'> & { /* remove potentialMatchIds prop */ }> = (props) => {
  const { entriesWithRejectedMatches, ...rest } = props;
  const { potentialMatchIds } = useLedgerUI();
  
  // Debug logging for potential match IDs
  React.useEffect(() => {
  
  }, [potentialMatchIds]);
  
  // Remove the problematic refresh function and useEffect that causes recursive calls
  // The store already handles refreshing potential match IDs properly
  
  // Destructure all other props from rest
  const {
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
    showUploadModal,
    uploadModalData,
    showPotentialModal,
    potentialIndex,
    potentialLedgerEntryId,
    loadingPotential,
    loading = false,
    searchLoading = false,
    vendorOptions,
    dropdownOptions,
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
    searchTerm,
    filterType,
    vendorFilter,
    wbsElementFilter,
    setShowPotentialModal,
    potentialTab,
    potentialMatched,
    setPotentialMatched,
    potentialRejected,
    setPotentialRejected,
    setToast,
    setEntriesWithRejectedMatches,
    setPotentialMatchIds,
    confirmMatch,
    rejectMatch,
    undoReject,
    onEditEntry,
  } = rest;
  const [showLinkRiskModal, setShowLinkRiskModal] = useState(false);
  const [linkRiskEntry, setLinkRiskEntry] = useState<any | null>(null);
  const [showUtilizeMRModal, setShowUtilizeMRModal] = useState(false);
  const [utilizeMREntry, setUtilizeMREntry] = useState<any | null>(null);
  // Filtered matches for the modal
  const filteredPotentialMatched = potentialMatched.filter(entry => entry.status !== 'replaced' && entry.status !== 'rejected');
  const filteredPotentialRejected = potentialRejected.filter(entry => entry.status !== 'replaced');
  const currentMatches = potentialTab === 'matched' ? filteredPotentialMatched : filteredPotentialRejected;

  // Function to refresh rejected match IDs from backend
  const highlight = (text: string) => {
    if (!searchTerm) return text;
    try {
      const re = new RegExp(`(${searchTerm.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'ig');
      return text.split(re).map((part, i) => re.test(part) ? <mark key={i} className="bg-yellow-200">{part}</mark> : part);
    } catch {
      return text;
    }
  };
  const refreshRejectedMatchIds = async () => {
    try {
      const res = await fetch(`/api/programs/${programId}/ledger/rejected-match-ids`);
      if (res.ok) {
        const ids = await res.json();
        setEntriesWithRejectedMatches(new Set(ids));
      } else {
        setToast({ message: 'Failed to refresh rejected match data', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error while refreshing data', type: 'error' });
    }
  };

  // Remove the problematic useEffect - the store handles potential match IDs refresh

  // Excel-like navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    const rows = sortedEntries.length;
    const cols = 15; // Number of columns in the table (added Matches column)
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (rowIndex > 0) {
          const targetRow = sortedEntries[rowIndex - 1];
          const targetCell = document.querySelector(`tr[data-row-id="${targetRow.id}"] td:nth-child(${colIndex + 1})`) as HTMLElement;
          targetCell?.click();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (rowIndex < rows - 1) {
          const targetRow = sortedEntries[rowIndex + 1];
          const targetCell = document.querySelector(`tr[data-row-id="${targetRow.id}"] td:nth-child(${colIndex + 1})`) as HTMLElement;
          targetCell?.click();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (colIndex > 0) {
          const targetCell = document.querySelector(`tr[data-row-id="${sortedEntries[rowIndex].id}"] td:nth-child(${colIndex})`) as HTMLElement;
          targetCell?.click();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (colIndex < cols - 1) {
          const targetCell = document.querySelector(`tr[data-row-id="${sortedEntries[rowIndex].id}"] td:nth-child(${colIndex + 2})`) as HTMLElement;
          targetCell?.click();
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab: move to previous cell
          if (colIndex > 0) {
            const targetCell = document.querySelector(`tr[data-row-id="${sortedEntries[rowIndex].id}"] td:nth-child(${colIndex})`) as HTMLElement;
            targetCell?.click();
          } else if (rowIndex > 0) {
            const targetRow = sortedEntries[rowIndex - 1];
            const targetCell = document.querySelector(`tr[data-row-id="${targetRow.id}"] td:nth-child(${cols})`) as HTMLElement;
            targetCell?.click();
          }
        } else {
          // Tab: move to next cell
          if (colIndex < cols - 1) {
            const targetCell = document.querySelector(`tr[data-row-id="${sortedEntries[rowIndex].id}"] td:nth-child(${colIndex + 2})`) as HTMLElement;
            targetCell?.click();
          } else if (rowIndex < rows - 1) {
            const targetRow = sortedEntries[rowIndex + 1];
            const targetCell = document.querySelector(`tr[data-row-id="${targetRow.id}"] td:nth-child(1)`) as HTMLElement;
            targetCell?.click();
          }
        }
        break;
    }
  }, [sortedEntries]);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="bg-gray-50">
              <th className="px-2 py-2 sticky left-0 bg-gray-50 z-20"><input type="checkbox" checked={selectedRows.length === sortedEntries.length && sortedEntries.length > 0} onChange={handleSelectAll} /></th>
              <th className="px-2 py-2">WBS Element</th>
              <th className="px-2 py-2">Vendor</th>
              <th className="px-2 py-2 w-64 max-w-xl">Description</th>
              <th className="px-2 py-2">Cost Category</th>
              <th className="px-2 py-2 w-28 max-w-[7rem]">Invoice Link</th>
              <th className="px-2 py-2 text-right">Baseline Date</th>
              <th className="px-2 py-2 text-right">Baseline Amount</th>
              <th className="px-2 py-2 text-right">Planned Date</th>
              <th className="px-2 py-2 text-right">Planned Amount</th>
              <th className="px-2 py-2 text-right">Actual Date</th>
              <th className="px-2 py-2 text-right">Actual Amount</th>
              <th className="px-2 py-2">Notes</th>
              <th className="px-2 py-2">Risk</th>
              <th className="px-2 py-2 text-center">Matches</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={15} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Loading entries...</span>
                  </div>
                </td>
              </tr>
            )}
            {searchLoading && !loading && (
              <tr>
                <td colSpan={15} className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600 text-sm">Searching...</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && !searchLoading && sortedEntries.length === 0 && (
              <tr>
                <td colSpan={15} className="px-4 py-8 text-center text-gray-500">
                  No entries found.
                </td>
              </tr>
            )}
            {!loading && !searchLoading && sortedEntries.map((entry, idx) => {
              return (
                <tr
                  key={entry.id}
                  data-row-id={entry.id}
                  ref={entry.id === highlightId ? highlightedRowRef : null}
                  className={`cursor-pointer hover:bg-gray-50 ${
                    entry.id === highlightId
                      ? 'bg-yellow-200 animate-pulse'
                      : entry.id === newRowId
                      ? 'bg-blue-50'
                      : 'bg-white'
                  }`}
                  onDoubleClick={() => onEditEntry && onEditEntry(entry)}
                  title="Double-click to edit"
                >
                  <td className="px-2 py-1 sticky left-0 bg-white z-10" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedRows.includes(entry.id)} onChange={() => handleSelectRow(entry.id)} />
                  </td>
                  {/* WBS Element */}
                  <td className="px-2 py-1">
                    {entry.wbsElement ? `${entry.wbsElement.code} - ${entry.wbsElement.name}` : '--'}
                  </td>
                  {/* Vendor */}
                  <td className="px-2 py-1">
                    {searchTerm ? highlight(entry.vendor_name || '') : entry.vendor_name}
                  </td>
                  {/* Description */}
                  <td className="px-2 py-1 w-64 max-w-xl">
                    {searchTerm ? highlight(entry.expense_description || '') : entry.expense_description}
                  </td>
                  {/* Cost Category */}
                  <td className="px-2 py-1">
                    {entry.costCategory ? `${entry.costCategory.code} - ${entry.costCategory.name}` : '--'}
                  </td>
                  {/* Invoice Link (popover edit) */}
                  <td className="px-2 py-1 w-28 max-w-[7rem] relative" onClick={e => { e.stopPropagation(); handlePopoverOpen(entry.id, entry.invoice_link_text ?? '', entry.invoice_link_url ?? '', e); }} onKeyDown={(e) => handleKeyDown(e, idx, 6)} tabIndex={0}>
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
                  <td className="px-2 py-1 text-right">
                    {entry.baseline_date || '--'}
                  </td>
                  {/* Baseline Amount */}
                  <td className="px-2 py-1 text-right">
                    {formatCurrency(entry.baseline_amount)}
                  </td>
                  {/* Planned Date */}
                  <td className="px-2 py-1 text-right">
                    {entry.planned_date || '--'}
                  </td>
                  {/* Planned Amount */}
                  <td className="px-2 py-1 text-right">
                    {formatCurrency(entry.planned_amount)}
                  </td>
                  {/* Actual Date */}
                  <td className="px-2 py-1 text-right">
                    {entry.actual_date || '--'}
                  </td>
                  {/* Actual Amount */}
                  <td className="px-2 py-1 text-right">
                    {formatCurrency(entry.actual_amount)}
                  </td>
                  {/* Notes */}
                  <td className="px-2 py-1">
                    {entry.notes || '--'}
                  </td>
                  {/* Risk */}
                  <td className="px-2 py-1">
                    <RiskLinkIndicator risk={entry.risk as any} />
                  </td>
                  {/* Matches Column */}
                  <td className="px-2 py-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {(() => {
                        const hasPotentialMatch = potentialMatchIds.some(id => String(id).trim() === String(entry.id).trim());
                        const hasRejectedMatches = entriesWithRejectedMatches.has(entry.id);
                        const hasActuals = entry.actual_amount !== null && entry.actual_amount !== undefined && entry.actual_date !== null && entry.actual_date !== undefined;
                        
                        // 1. If an entry has a confirmed match (actualsUploadTransaction), show "View Upload"
                        if (entry.actualsUploadTransaction) {
                          return (
                            <button
                              className="px-3 py-2 rounded-md border-2 border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-600 transition-colors font-semibold shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadModalData(entry.actualsUploadTransaction);
                                setShowUploadModal(true);
                              }}
                              title="View Upload Details"
                            >
                              <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                            </button>
                          );
                        }
                        // 2. If an entry has no actuals entered, but has potential matches
                        if (!hasActuals && hasPotentialMatch) {
                          return (
                            <button
                              className="px-3 py-2 rounded-md border-2 border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-600 transition-colors font-semibold shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowPotentialMatches(entry.id);
                              }}
                              title="Review Potential Match - Top Match Available"
                            >
                              <InformationCircleIcon className="h-5 w-5" />
                            </button>
                          );
                        }
                        // 3. If an entry has no actuals entered, and all potential matches have been rejected
                        if (!hasActuals && !hasPotentialMatch && hasRejectedMatches) {
                          return (
                            <button
                              className="px-3 py-2 rounded-md border-2 border-red-500 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-600 transition-colors font-semibold shadow-sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleShowPotentialMatches(entry.id);
                                setPotentialTab('rejected');
                              }}
                              title="View Rejected Matches"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          );
                        }
                        // Otherwise show nothing
                        return null;
                      })()}
                    </div>
                  </td>
                  {/* Actions Column */}
                  <td className="px-2 py-1">
                    <RowActionsMenu
                      entry={entry}
                      onEdit={() => onEditEntry && onEditEntry(entry)}
                      onAuditTrail={() => {
                        if (props.onAuditTrailClick) {
                          props.onAuditTrailClick(entry.id, entry);
                        }
                      }}
                      hasPotentialMatch={potentialMatchIds.some(id => String(id).trim() === String(entry.id).trim())}
                      hasRejectedMatches={entriesWithRejectedMatches.has(entry.id)}
                      hasActuals={entry.actual_amount !== null && entry.actual_amount !== undefined && entry.actual_date !== null && entry.actual_date !== undefined}
                      actualsUploadTransaction={entry.actualsUploadTransaction}
                      onShowPotentialMatches={() => handleShowPotentialMatches(entry.id)}
                      onViewUpload={() => {
                        setUploadModalData(entry.actualsUploadTransaction);
                        setShowUploadModal(true);
                      }}
                      setPotentialTab={setPotentialTab}
                      onLinkRisk={() => { setLinkRiskEntry(entry); setShowLinkRiskModal(true); }}
                      onUtilizeMR={() => { setUtilizeMREntry(entry); setShowUtilizeMRModal(true); }}
                    />
                  </td>
                  {/* Upload Column - Legacy (keeping for now) */}
                  <td className="px-2 py-1 hidden">
                    <div className="flex items-center justify-center">
                      {(() => {
                        // FIX #3: Clean potential match check without hardcoded fallback
                        const hasPotentialMatch = potentialMatchIds.some(id => String(id).trim() === String(entry.id).trim());
                        const hasRejectedMatches = entriesWithRejectedMatches.has(entry.id);
                        const hasActuals = entry.actual_amount !== null && entry.actual_amount !== undefined && entry.actual_date !== null && entry.actual_date !== undefined;
                        // 4. If an entry had a match confirmed, show "View Upload"
                        if (entry.actualsUploadTransaction) {
                          return (
                            <button
                              className="flex items-center gap-1 text-blue-600 underline hover:text-blue-800 text-sm font-semibold"
                              aria-label="View Upload Details"
                              data-tooltip-id={`upload-tooltip-${entry.id}`}
                              onClick={() => { 
                                setUploadModalData(entry.actualsUploadTransaction); 
                                setShowUploadModal(true); 
                              }}
                            >
                              <DocumentMagnifyingGlassIcon className="h-4 w-4" /> View Upload
                            </button>
                          );
                        }
                        // 1. If an entry was manually updated (actuals fields filled out with no match confirmed)
                        if (hasActuals) {
                          return (
                            <span className="flex items-center gap-1 text-gray-400 text-sm font-semibold">
                              <InformationCircleIcon className="h-4 w-4 text-gray-300" /> Manual Update
                            </span>
                          );
                        }
                        // 2. If an entry has no actuals entered, but has potential matches
                        if (!hasActuals && hasPotentialMatch) {
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
                        // 3. If an entry has no actuals entered, and all potential matches have been rejected
                        if (!hasActuals && !hasPotentialMatch && hasRejectedMatches) {
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
                        // Otherwise show "--"
                        return <span className="text-gray-300 text-sm font-semibold">--</span>;
                      })()}
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
      {showPotentialModal && (
        <LedgerMatchModal
          isOpen={showPotentialModal}
          onClose={() => setShowPotentialModal(false)}
          ledgerEntry={sortedEntries.find((e: LedgerEntry) => e.id === potentialLedgerEntryId) || null}
          currentTab={potentialTab}
          currentIndex={potentialIndex}
          potentialMatches={potentialMatched}
          rejectedMatches={potentialRejected}
          onTabChange={setPotentialTab}
          onIndexChange={setPotentialIndex}
          onConfirm={confirmMatch}
          onReject={rejectMatch}
          onUndoReject={undoReject}
          setPotentialMatchIds={setPotentialMatchIds}
          setEntriesWithRejectedMatches={setEntriesWithRejectedMatches}
          setPotentialMatched={setPotentialMatched}
          setPotentialRejected={setPotentialRejected}
          setToast={setToast}
          formatCurrency={formatCurrency}
          ledgerEntryId={potentialLedgerEntryId || ''}
          programId={programId}
        />
      )}

      {showLinkRiskModal && linkRiskEntry && (
        <LinkToRiskModal
          isOpen={showLinkRiskModal}
          onClose={() => { setShowLinkRiskModal(false); setLinkRiskEntry(null); }}
          programId={programId}
          entry={linkRiskEntry}
          onLinked={() => fetchEntries()}
        />
      )}

      {showUtilizeMRModal && utilizeMREntry && (
        <UtilizeMRModal
          isOpen={showUtilizeMRModal}
          onClose={() => { setShowUtilizeMRModal(false); setUtilizeMREntry(null); }}
          programId={programId}
          entry={utilizeMREntry}
          onUtilized={() => fetchEntries()}
        />
      )}
    </>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: Omit<LedgerTableTableProps, 'potentialMatchIds'>, nextProps: Omit<LedgerTableTableProps, 'potentialMatchIds'>) => {
  // Compare all other props except potentialMatchIds
  return (
    prevProps.sortedEntries === nextProps.sortedEntries &&
    prevProps.total === nextProps.total &&
    prevProps.page === nextProps.page &&
    prevProps.showAll === nextProps.showAll &&
    prevProps.PAGE_SIZE === nextProps.PAGE_SIZE &&
    prevProps.selectedRows === nextProps.selectedRows &&
    prevProps.editingCell === nextProps.editingCell &&
    prevProps.cellEditValue === nextProps.cellEditValue &&
    prevProps.highlightId === nextProps.highlightId &&
    prevProps.newRowId === nextProps.newRowId &&
    prevProps.popover === nextProps.popover &&
    prevProps.popoverText === nextProps.popoverText &&
    prevProps.popoverUrl === nextProps.popoverUrl &&
    prevProps.entriesWithRejectedMatches === nextProps.entriesWithRejectedMatches &&
    prevProps.showUploadModal === nextProps.showUploadModal &&
    prevProps.uploadModalData === nextProps.uploadModalData &&
    prevProps.showPotentialModal === nextProps.showPotentialModal &&
    prevProps.potentialIndex === nextProps.potentialIndex &&
    prevProps.potentialLedgerEntryId === nextProps.potentialLedgerEntryId &&
    prevProps.loadingPotential === nextProps.loadingPotential &&
    prevProps.loading === nextProps.loading &&
    prevProps.searchLoading === nextProps.searchLoading &&
    prevProps.vendorOptions === nextProps.vendorOptions &&
    prevProps.dropdownOptions === nextProps.dropdownOptions &&
    prevProps.handleSelectAll === nextProps.handleSelectAll &&
    prevProps.handleSelectRow === nextProps.handleSelectRow &&
    prevProps.handleCellClick === nextProps.handleCellClick &&
    prevProps.handleCellInputChange === nextProps.handleCellInputChange &&
    prevProps.handleCellInputBlur === nextProps.handleCellInputBlur &&
    prevProps.handleCellInputKeyDown === nextProps.handleCellInputKeyDown &&
    prevProps.handlePopoverOpen === nextProps.handlePopoverOpen &&
    prevProps.handlePopoverClose === nextProps.handlePopoverClose &&
    prevProps.handlePopoverSave === nextProps.handlePopoverSave &&
    prevProps.handlePopoverKeyDown === nextProps.handlePopoverKeyDown &&
    prevProps.handleShowPotentialMatches === nextProps.handleShowPotentialMatches &&
    prevProps.handleSaveNewRow === nextProps.handleSaveNewRow &&
    prevProps.handleCancelNewRow === nextProps.handleCancelNewRow &&
    prevProps.setPage === nextProps.setPage &&
    prevProps.setShowUploadModal === nextProps.setShowUploadModal &&
    prevProps.setUploadModalData === nextProps.setUploadModalData &&
    prevProps.setPopoverText === nextProps.setPopoverText &&
    prevProps.setPopoverUrl === nextProps.setPopoverUrl &&
    prevProps.setPotentialTab === nextProps.setPotentialTab &&
    prevProps.setPotentialIndex === nextProps.setPotentialIndex &&
    prevProps.setPotentialLedgerEntryId === nextProps.setPotentialLedgerEntryId &&
    prevProps.fetchEntries === nextProps.fetchEntries &&
    prevProps.formatCurrency === nextProps.formatCurrency &&
    prevProps.highlightedRowRef === nextProps.highlightedRowRef &&
    prevProps.programId === nextProps.programId &&
    prevProps.filterType === nextProps.filterType &&
    prevProps.vendorFilter === nextProps.vendorFilter &&
    prevProps.wbsElementFilter === nextProps.wbsElementFilter &&
    prevProps.setShowPotentialModal === nextProps.setShowPotentialModal &&
    prevProps.potentialTab === nextProps.potentialTab &&
    prevProps.potentialMatched === nextProps.potentialMatched &&
    prevProps.setPotentialMatched === nextProps.setPotentialMatched &&
    prevProps.potentialRejected === nextProps.potentialRejected &&
    prevProps.setPotentialRejected === nextProps.setPotentialRejected &&
    prevProps.setToast === nextProps.setToast &&
    prevProps.setEntriesWithRejectedMatches === nextProps.setEntriesWithRejectedMatches &&
    prevProps.setPotentialMatchIds === nextProps.setPotentialMatchIds &&
    prevProps.confirmMatch === nextProps.confirmMatch &&
    prevProps.rejectMatch === nextProps.rejectMatch &&
    prevProps.undoReject === nextProps.undoReject
  );
};

export default LedgerTableTable; 