import React, { useEffect, useCallback, useMemo } from 'react';
import { InformationCircleIcon, DocumentMagnifyingGlassIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import { useSearchParams } from 'react-router-dom';
import LedgerBulkEditModal from './BulkEditModal';
import LedgerBulkDeleteModal from './BulkDeleteModal';
import LedgerErrorModal from './ErrorModal';
import LedgerTableHeader from './Header';
import LedgerTableTable from './Table';

// Import custom hooks
import { usePotentialMatchModal } from '../../../../hooks/usePotentialMatchModal';
import { useDebouncedApi } from '../../../../hooks/useDebouncedApi';
import { usePerformanceMonitor } from '../../../../hooks/usePerformanceMonitor';

// Import Zustand store
import { 
  useLedgerStore, 
  useLedgerEntries, 
  useLedgerTotal, 
  useLedgerFilters, 
  useLedgerUI, 
  useLedgerDropdownOptions, 
  useLedgerProgramId, 
  useLedgerShowAll,
  useLedgerInitialize,
  useLedgerFetchEntries,
  useLedgerSetFilterType,
  useLedgerSetVendorFilter,
  useLedgerSetWbsElementFilter,
  useLedgerSetSearch,
  useLedgerSetPage,
  useLedgerSetShowAll,
  useLedgerSelectRow,
  useLedgerSelectAll,
  useLedgerStartCellEdit,
  useLedgerSaveCellEdit,
  useLedgerCancelCellEdit,
  useLedgerSetCellEditValue,
  useLedgerAddEntry,
  useLedgerSaveNewEntry,
  useLedgerCancelNewEntry,
  useLedgerUpdateEntry,
  useLedgerDeleteEntry,
  useLedgerBulkUpdateEntries,
  useLedgerBulkDeleteEntries,
  useLedgerStartBulkEdit,
  useLedgerUpdateBulkEditField,
  useLedgerToggleBulkEditClear,
  useLedgerSaveBulkEdit,
  useLedgerOpenPopover,
  useLedgerClosePopover,
  useLedgerSavePopover,
  useLedgerSetPopoverText,
  useLedgerSetPopoverUrl,
  useLedgerConfirmMatch,
  useLedgerRejectMatch,
  useLedgerUndoReject,
  useLedgerRemoveMatch,
  useLedgerSetToast,
  useLedgerSetShowUploadModal,
  useLedgerSetUploadModalData,
  useLedgerSetShowBulkDeleteModal,
  useLedgerSetShowBulkEditModal,
  useLedgerSetSelectedRows,
  useLedgerSetEntriesWithRejectedMatches,
  useLedgerSetPotentialMatchIds,
  useLedgerSetShowErrorModal,
  useLedgerClearError,
  useLedgerClearToast,
  useLedgerResetUI,
  useLedgerSetHighlightId
} from '../../../../store/ledgerStore';

interface LedgerTableProps {
  programId: string;
  showAll?: boolean;
  onChange?: () => void;
  onOptionsUpdate?: (options: { vendors: string[], wbsElements: Array<{ id: string; code: string; name: string; description: string; level: number; parentId?: string; }> }) => void;
  filterType: 'all' | 'currentMonthPlanned' | 'emptyActuals';
  vendorFilter?: string;
  wbsElementFilter?: string;
  setFilterType: (type: 'all' | 'currentMonthPlanned' | 'emptyActuals') => void;
  setVendorFilter: (vendor: string | undefined) => void;
  setWbsElementFilter: (elementId: string | undefined) => void;
}

const PAGE_SIZE = 10;

// Robust currency formatter for both numbers and strings
const formatCurrency = (val: number | string | undefined | null) => {
  if (val === undefined || val === null || isNaN(Number(val))) return '--';
  return Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const LedgerTable: React.FC<LedgerTableProps> = ({ 
  programId, 
  showAll, 
  onChange, 
  onOptionsUpdate, 
  filterType, 
  vendorFilter, 
  wbsElementFilter, 
  setFilterType, 
  setVendorFilter, 
  setWbsElementFilter 
}) => {
  // Zustand store state
  const entries = useLedgerEntries();
  const total = useLedgerTotal();
  const filters = useLedgerFilters();
  const ui = useLedgerUI();
  const dropdownOptions = useLedgerDropdownOptions();
  const storeProgramId = useLedgerProgramId();
  const storeShowAll = useLedgerShowAll();

  // Zustand store actions - use individual hooks to avoid stale closures
  const initialize = useLedgerInitialize();
  const fetchEntries = useLedgerFetchEntries();
  const setFilterTypeAction = useLedgerSetFilterType();
  const setVendorFilterAction = useLedgerSetVendorFilter();
  const setWbsElementFilterAction = useLedgerSetWbsElementFilter();
  const setSearch = useLedgerSetSearch();
  const setPage = useLedgerSetPage();
  const setShowAllAction = useLedgerSetShowAll();
  const selectRow = useLedgerSelectRow();
  const selectAll = useLedgerSelectAll();
  const startCellEdit = useLedgerStartCellEdit();
  const saveCellEdit = useLedgerSaveCellEdit();
  const cancelCellEdit = useLedgerCancelCellEdit();
  const setCellEditValue = useLedgerSetCellEditValue();
  const addEntry = useLedgerAddEntry();
  const saveNewEntry = useLedgerSaveNewEntry();
  const cancelNewEntry = useLedgerCancelNewEntry();
  const updateEntry = useLedgerUpdateEntry();
  const deleteEntry = useLedgerDeleteEntry();
  const bulkUpdateEntries = useLedgerBulkUpdateEntries();
  const bulkDeleteEntries = useLedgerBulkDeleteEntries();
  const startBulkEdit = useLedgerStartBulkEdit();
  const updateBulkEditField = useLedgerUpdateBulkEditField();
  const toggleBulkEditClear = useLedgerToggleBulkEditClear();
  const saveBulkEdit = useLedgerSaveBulkEdit();
  const openPopover = useLedgerOpenPopover();
  const closePopover = useLedgerClosePopover();
  const savePopover = useLedgerSavePopover();
  const setPopoverText = useLedgerSetPopoverText();
  const setPopoverUrl = useLedgerSetPopoverUrl();
  const confirmMatch = useLedgerConfirmMatch();
  const rejectMatch = useLedgerRejectMatch();
  const undoReject = useLedgerUndoReject();
  const removeMatch = useLedgerRemoveMatch();
  const setToast = useLedgerSetToast();
  const setShowUploadModal = useLedgerSetShowUploadModal();
  const setUploadModalData = useLedgerSetUploadModalData();
  const setShowBulkDeleteModal = useLedgerSetShowBulkDeleteModal();
  const setShowBulkEditModal = useLedgerSetShowBulkEditModal();
  const setSelectedRows = useLedgerSetSelectedRows();
  const setEntriesWithRejectedMatches = useLedgerSetEntriesWithRejectedMatches();
  const setPotentialMatchIds = useLedgerSetPotentialMatchIds();
  const setShowErrorModal = useLedgerSetShowErrorModal();
  const clearError = useLedgerClearError();
  const clearToast = useLedgerClearToast();
  const resetUI = useLedgerResetUI();
  const setHighlightId = useLedgerSetHighlightId();

  // Get URL search parameters for highlighting
  const [searchParams] = useSearchParams();

  // Custom hooks
  const potentialMatchModal = usePotentialMatchModal(programId);
  const debouncedApiResult = useDebouncedApi({ delay: 300 });
  const { debouncedCall } = debouncedApiResult || { debouncedCall: () => {} };
  const performanceMonitor = usePerformanceMonitor();

  // Wrapper functions to handle type conversion
  const handleSetEntriesWithRejectedMatches = useCallback((set: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (typeof set === 'function') {
      setEntriesWithRejectedMatches(set(ui.entriesWithRejectedMatches));
    } else {
      setEntriesWithRejectedMatches(set);
    }
  }, [setEntriesWithRejectedMatches, ui.entriesWithRejectedMatches]);

  const handleSetPotentialMatchIds = useCallback((ids: string[] | ((prev: string[]) => string[])) => {
    if (typeof ids === 'function') {
      setPotentialMatchIds(ids(ui.potentialMatchIds));
    } else {
      setPotentialMatchIds(ids);
    }
  }, [setPotentialMatchIds, ui.potentialMatchIds]);

  // Initialize store when component mounts or programId changes
  useEffect(() => {
    initialize(programId, showAll);
  }, [programId, showAll, initialize]);

  // Handle highlight URL parameter
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setHighlightId(highlightId);
      console.log(`[LedgerTable] Setting highlight ID from URL: ${highlightId}`);
    }
  }, [searchParams, setHighlightId]);

  // Sync external filter state with store - only on mount and when props change
  useEffect(() => {
    // Only update if the store doesn't match the props
    if (filters.filterType !== filterType) {
      setFilterTypeAction(filterType);
    }
    if (filters.vendorFilter !== vendorFilter) {
      setVendorFilterAction(vendorFilter);
    }
    if (filters.wbsElementFilter !== wbsElementFilter) {
      setWbsElementFilterAction(wbsElementFilter);
    }
  }, [filterType, vendorFilter, wbsElementFilter]); // Remove store filters from dependencies to prevent loops

  // Sync store state with parent component - only when dropdown options actually change
  useEffect(() => {
    if (onOptionsUpdate && dropdownOptions.vendors.length > 0) {
      onOptionsUpdate({
        vendors: dropdownOptions.vendors,
        wbsElements: dropdownOptions.wbsElements
      });
    }
  }, [dropdownOptions.vendors, dropdownOptions.wbsElements, onOptionsUpdate]);

  // Handle search with debouncing
  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    if (newSearch.trim() === '') {
      // If search is empty, fetch immediately
      fetchEntries();
    } else {
      // Debounce the search
      if (debouncedCall) {
        debouncedCall(fetchEntries);
      } else {
        fetchEntries();
      }
    }
  }, [fetchEntries, debouncedCall, setSearch]);

  // Handle cell input change
  const handleCellInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setCellEditValue(e.target.value);
  }, [setCellEditValue]);

  // Handle cell input blur or Enter
  const handleCellInputBlur = useCallback(async (rowId: string, field: string, currentValue?: string) => {
    const valueToSave = currentValue !== undefined ? currentValue : ui.cellEditValue;
    try {
      await saveCellEdit(rowId, field, valueToSave);
    } catch (error) {
      console.error('Cell edit failed:', error);
      // Error is already handled in the store
    }
  }, [saveCellEdit, ui.cellEditValue]);

  const handleCellInputKeyDown = useCallback(async (e: React.KeyboardEvent, rowId: string, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentValue = (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
      try {
        await saveCellEdit(rowId, field, currentValue);
      } catch (error) {
        console.error('Cell edit failed:', error);
        // Error is already handled in the store
      }
    } else if (e.key === 'Escape') {
      cancelCellEdit();
    }
  }, [saveCellEdit, cancelCellEdit]);

  // Handle add entry change
  const handleAddChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // This would need to be handled in the store if we want to track new entry state
  }, []);

  // Enhanced match operations with immediate UI updates
  const handleConfirmMatch = useCallback(async (transactionId: string, ledgerEntryId: string) => {
    try {
      // Always use the store's confirmMatch method for immediate UI updates
      const result = await confirmMatch(transactionId, ledgerEntryId);
      
      if (result.success) {
        setToast({ message: 'Match confirmed successfully.', type: 'success' });
        onChange?.();
        
        // Close the modal if it's open
        if (potentialMatchModal?.closeModal) {
          potentialMatchModal.closeModal();
        }
      } else {
        setToast({ message: result.error || 'Failed to confirm match.', type: 'error' });
      }
      
      return result;
    } catch (error) {
      setToast({ message: 'Failed to confirm match.', type: 'error' });
      return { success: false, error: 'Failed to confirm match.' };
    }
  }, [onChange, potentialMatchModal, confirmMatch, setToast]);

  const handleRejectMatch = useCallback(async (transactionId: string, ledgerEntryId: string) => {
    try {
      // Use the potential match modal's rejectMatch method if available
      if (potentialMatchModal?.rejectMatch) {
        const result = await potentialMatchModal.rejectMatch(transactionId, ledgerEntryId);
        
        if (result.success) {
          setToast({ message: 'Match rejected.', type: 'success' });
          onChange?.();
        } else {
          setToast({ message: result.error || 'Failed to reject match.', type: 'error' });
        }
        
        return result;
      } else {
        // Fallback to store actions
        const result = await rejectMatch(transactionId, ledgerEntryId);
        
        if (result.success) {
          setToast({ message: 'Match rejected.', type: 'success' });
          onChange?.();
        } else {
          setToast({ message: result.error || 'Failed to reject match.', type: 'error' });
        }
        
        return result;
      }
    } catch (error) {
      console.error('Reject match failed:', error);
      setToast({ message: 'Failed to reject match.', type: 'error' });
      return { success: false, error: 'Failed to reject match.' };
    }
  }, [onChange, potentialMatchModal, rejectMatch, setToast]);

  const handleUndoReject = useCallback(async (transactionId: string, ledgerEntryId: string) => {
    try {
      // Use the potential match modal's undoReject method if available
      if (potentialMatchModal?.undoReject) {
        const result = await potentialMatchModal.undoReject(transactionId, ledgerEntryId);
        
        if (result.success) {
          setToast({ message: 'Rejection undone successfully', type: 'success' });
          onChange?.();
        } else {
          setToast({ message: result.error || 'Failed to undo rejection', type: 'error' });
        }
        
        return result;
      } else {
        // Fallback to store actions
        const result = await undoReject(transactionId, ledgerEntryId);
        
        if (result.success) {
          setToast({ message: 'Rejection undone successfully', type: 'success' });
          onChange?.();
        } else {
          setToast({ message: result.error || 'Failed to undo rejection', type: 'error' });
        }
        
        return result;
      }
    } catch (error) {
      console.error('Undo reject failed:', error);
      setToast({ message: 'Failed to undo rejection', type: 'error' });
      return { success: false, error: 'Failed to undo rejection' };
    }
  }, [onChange, potentialMatchModal, undoReject, setToast]);

  // Handle show potential matches
  const handleShowPotentialMatches = useCallback(async (entryId: string) => {
    try {
      // Use the potential match modal's openModal method which handles the API call
      if (potentialMatchModal?.openModal) {
        await potentialMatchModal.openModal(entryId);
      }
    } catch (error) {
      console.error('Failed to fetch potential matches:', error);
      setToast({ message: 'Failed to fetch potential matches', type: 'error' });
    }
  }, [onChange, potentialMatchModal, setToast]);

  // Auto-clear toast
  useEffect(() => {
    if (ui.toast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [ui.toast, clearToast]);





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
            className={`btn px-4 py-2 rounded-md ${filters.filterType === 'all' ? 'btn-primary' : 'btn-ghost border border-gray-300 bg-gray-100 text-gray-700'}`}
            onClick={() => setFilterTypeAction('all')}
          >
            Show All
          </button>
          <button
            className={`btn px-4 py-2 rounded-md ${filters.filterType === 'currentMonthPlanned' ? 'btn-primary' : 'btn-ghost border border-gray-300 bg-gray-100 text-gray-700'}`}
            onClick={() => setFilterTypeAction('currentMonthPlanned')}
          >
            Show Current Month Planned Expenses
          </button>
          <button
            className={`btn px-4 py-2 rounded-md ${filters.filterType === 'emptyActuals' ? 'btn-primary' : 'btn-ghost border border-gray-300 bg-gray-100 text-gray-700'}`}
            onClick={() => setFilterTypeAction('emptyActuals')}
          >
            Show Empty Actuals
          </button>
        </div>
      </div>

      <LedgerTableHeader
        search={filters.search}
        setSearch={handleSearchChange}
        setPage={setPage}
        onAddEntry={addEntry}
        selectedRows={ui.selectedRows}
        onBulkEdit={startBulkEdit}
        onBulkDelete={() => setShowBulkDeleteModal(true)}
        vendorFilter={filters.vendorFilter}
        setVendorFilter={setVendorFilterAction}
        wbsElementFilter={filters.wbsElementFilter}
        setWbsElementFilter={setWbsElementFilterAction}
        vendorOptions={dropdownOptions.vendors}
        wbsElementOptions={dropdownOptions.wbsElements}
      />

      {ui.showErrorModal && ui.error && (
        <LedgerErrorModal
          show={ui.showErrorModal}
          error={ui.error}
          onClose={() => setShowErrorModal(false)}
        />
      )}

      {ui.showBulkEditModal && (
        <LedgerBulkEditModal
          show={ui.showBulkEditModal}
          selectedCount={ui.selectedRows.length}
          bulkEditFields={ui.bulkEditFields}
          clearedFields={ui.clearedFields}
          wbsElementOptions={dropdownOptions.wbsElements}
          vendorOptions={dropdownOptions.vendors}
          isCleared={(field: string) => ui.clearedFields[field]}
          handleBulkEditFieldChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            updateBulkEditField(name, value);
          }}
          handleBulkEditClearToggle={(field: string) => {
            toggleBulkEditClear(field);
          }}
          handleBulkEditSave={saveBulkEdit}
          onCancel={() => setShowBulkEditModal(false)}
        />
      )}

      {ui.showBulkDeleteModal && (
        <LedgerBulkDeleteModal
          show={ui.showBulkDeleteModal}
          selectedCount={ui.selectedRows.length}
          onConfirm={async () => {
            try {
              await bulkDeleteEntries(ui.selectedRows);
              // Store now handles clearing selected rows and closing modal
            } catch (error) {
              console.error('Bulk delete failed:', error);
            }
          }}
          onCancel={() => setShowBulkDeleteModal(false)}
        />
      )}

      <LedgerTableTable
        sortedEntries={entries}
        total={total}
        page={ui.page}
        showAll={storeShowAll}
        PAGE_SIZE={PAGE_SIZE}
        selectedRows={ui.selectedRows}
        editingCell={ui.editingCell}
        cellEditValue={ui.cellEditValue}
        highlightId={ui.highlightId}
        newRowId={ui.newRowId}
        popover={ui.popover}
        popoverText={ui.popoverText}
        popoverUrl={ui.popoverUrl}
        entriesWithRejectedMatches={ui.entriesWithRejectedMatches}
        showUploadModal={ui.showUploadModal}
        uploadModalData={ui.uploadModalData}
        showPotentialModal={potentialMatchModal?.isOpen || false}
        potentialIndex={potentialMatchModal?.currentIndex || 0}
        potentialLedgerEntryId={potentialMatchModal?.ledgerEntryId || null}
        loadingPotential={potentialMatchModal?.isLoading || false}
        loading={ui.loading}
        searchLoading={ui.searchLoading}
        dropdownOptions={dropdownOptions}
        vendorOptions={dropdownOptions.vendors}
        handleSelectAll={selectAll}
        handleSelectRow={selectRow}
        handleCellClick={startCellEdit}
        handleCellInputChange={handleCellInputChange}
        handleCellInputBlur={handleCellInputBlur}
        handleCellInputKeyDown={handleCellInputKeyDown}
        handlePopoverOpen={(rowId: string, text: string | null | undefined, url: string | null | undefined, event: React.MouseEvent) => {
          openPopover(rowId, text || '', url || '', event.currentTarget as HTMLElement);
        }}
        handlePopoverClose={closePopover}
        handlePopoverSave={savePopover}
        handlePopoverKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            savePopover();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            closePopover();
          }
        }}
        handleShowPotentialMatches={handleShowPotentialMatches}
        handleSaveNewRow={saveNewEntry}
        handleCancelNewRow={cancelNewEntry}
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
        highlightedRowRef={React.useRef<HTMLTableRowElement | null>(null)}
        programId={programId}
        filterType={filters.filterType}
        vendorFilter={filters.vendorFilter}
        wbsElementFilter={filters.wbsElementFilter}
        setShowPotentialModal={potentialMatchModal?.closeModal || (() => {})}
        potentialTab={potentialMatchModal?.currentTab || 'matched'}
        potentialMatched={potentialMatchModal?.potentialMatches || []}
        setPotentialMatched={potentialMatchModal?.setPotentialMatches || (() => {})}
        potentialRejected={potentialMatchModal?.rejectedMatches || []}
        setPotentialRejected={potentialMatchModal?.setRejectedMatches || (() => {})}
        setToast={setToast}
        setEntriesWithRejectedMatches={handleSetEntriesWithRejectedMatches}
        setPotentialMatchIds={handleSetPotentialMatchIds}
        confirmMatch={handleConfirmMatch}
        rejectMatch={handleRejectMatch}
        undoReject={handleUndoReject}
      />

      {/* View Upload Modal */}
      {ui.showUploadModal && ui.uploadModalData && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative border-2 border-green-200">
            <button 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold" 
              onClick={() => setShowUploadModal(false)} 
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-extrabold mb-4 text-green-700 flex items-center gap-2">
              <DocumentMagnifyingGlassIcon className="h-6 w-6 text-green-500" /> Upload Details
            </h2>
            <div className="mb-3 flex flex-col gap-2 text-base">
              <div><b className="text-gray-600">Vendor:</b> <span className="text-gray-900">{ui.uploadModalData.vendorName}</span></div>
              <div><b className="text-gray-600">Description:</b> <span className="text-gray-900">{ui.uploadModalData.description}</span></div>
              <div><b className="text-gray-600">Amount:</b> <span className="text-green-700 font-semibold">{formatCurrency(ui.uploadModalData.amount)}</span></div>
              <div><b className="text-gray-600">Date:</b> <span className="text-gray-900">{ui.uploadModalData.transactionDate ? new Date(ui.uploadModalData.transactionDate).toLocaleDateString() : ''}</span></div>
              <div><b className="text-gray-600">Status:</b> <span className="text-gray-900 capitalize">{ui.uploadModalData.status}</span></div>
              <div><b className="text-gray-600">Upload Session:</b> <span className="text-gray-900">{ui.uploadModalData.actualsUploadSession?.originalFilename}</span></div>
              {ui.uploadModalData.actualsUploadSession?.description && (
                <div><b className="text-gray-600">Session Description:</b> <span className="text-gray-900">{ui.uploadModalData.actualsUploadSession.description}</span></div>
              )}
              <div><b className="text-gray-600">Uploaded:</b> <span className="text-gray-900">{ui.uploadModalData.actualsUploadSession?.createdAt ? new Date(ui.uploadModalData.actualsUploadSession.createdAt).toLocaleString() : ''}</span></div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end items-center mt-6 gap-4">
              {ui.uploadModalData.status === 'confirmed' && (
                <button
                  className="btn btn-error px-6 py-2 text-base font-semibold rounded shadow hover:bg-red-700 transition mb-2 sm:mb-0"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to remove this match? This will revert the actuals and restore potential matches.')) {
                      try {
                        await removeMatch(ui.uploadModalData.id);
                        setShowUploadModal(false);
                      } catch (error) {
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

      {/* Toast Notification */}
      {ui.toast && (
        <div className={`fixed top-4 right-4 z-[10000] p-4 rounded-lg shadow-lg ${
          ui.toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {ui.toast.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <XCircleIcon className="h-5 w-5" />
            )}
            <span>{ui.toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerTable; 