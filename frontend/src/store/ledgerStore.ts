import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import axios from 'axios';
import React from 'react';
import type { LedgerEntry } from '../types/ledger';
import type { ActualsUploadTransaction, ActualsUploadSession, PotentialMatchData, RejectedMatchData } from '../types/actuals';

export type MatchStatus = 'potential' | 'confirmed' | 'rejected';

interface Match {
  ledgerEntryId: string;
  transactionId: string;
  status: MatchStatus;
}

// Enhanced interfaces for the LedgerTable component
export interface LedgerFilters {
  filterType: 'all' | 'currentMonthPlanned' | 'emptyActuals';
  vendorFilter?: string;
  wbsCategoryFilter?: string;
  wbsSubcategoryFilter?: string;
  search: string;
}

export interface LedgerUIState {
  loading: boolean;
  searchLoading: boolean;
  error: string | null;
  showErrorModal: boolean;
  page: number;
  selectedRows: string[];
  editingCell: { rowId: string; field: string } | null;
  cellEditValue: any;
  highlightId: string | null;
  newRowId: string | null;
  popover: { rowId: string | null; anchorEl: HTMLElement | null };
  popoverText: string;
  popoverUrl: string;
  showBulkEditModal: boolean;
  showBulkDeleteModal: boolean;
  bulkEditFields: Partial<LedgerEntry>;
  clearedFields: Record<string, boolean>;
  showUploadModal: boolean;
  uploadModalData: any;
  potentialMatchIds: string[];
  entriesWithRejectedMatches: Set<string>;
  toast: { message: string; type: 'success' | 'error'; undoId?: string } | null;
}

export interface LedgerDropdownOptions {
  vendors: string[];
  categories: string[];
  subcategories: string[];
}

interface LedgerStoreState {
  // Original state (keeping for backward compatibility)
  ledgerEntries: LedgerEntry[];
  actualsTransactions: ActualsUploadTransaction[];
  actualsSessions: ActualsUploadSession[];
  potentialMatches: PotentialMatchData[];
  rejectedMatches: RejectedMatchData[];
  matches: Match[];
  loading: boolean;
  error: string | null;

  // Enhanced state for LedgerTable
  entries: LedgerEntry[];
  total: number;
  dropdownOptions: LedgerDropdownOptions;
  filters: LedgerFilters;
  ui: LedgerUIState;
  programId: string | null;
  showAll: boolean;

  // Original actions (keeping for backward compatibility)
  setLedgerEntries: (entries: LedgerEntry[]) => void;
  setActualsTransactions: (txs: ActualsUploadTransaction[]) => void;
  setActualsSessions: (sessions: ActualsUploadSession[]) => void;
  setPotentialMatches: (matches: PotentialMatchData[]) => void;
  setRejectedMatches: (matches: RejectedMatchData[]) => void;
  setMatches: (matches: Match[]) => void;
  updateLedgerEntry: (id: string, update: Partial<LedgerEntry>) => void;
  updateMatchStatus: (ledgerEntryId: string, transactionId: string, status: MatchStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Enhanced actions for LedgerTable
  // Initialization
  initialize: (programId: string, showAll?: boolean) => void;
  
  // Data fetching
  fetchEntries: () => Promise<void>;
  fetchDropdownOptions: () => Promise<void>;
  refreshPotentialMatchIds: () => Promise<void>;
  refreshRejectedMatchIds: () => Promise<void>;
  
  // Filter actions
  setFilterType: (type: 'all' | 'currentMonthPlanned' | 'emptyActuals') => void;
  setVendorFilter: (vendor: string | undefined) => void;
  setWbsCategoryFilter: (cat: string | undefined) => void;
  setWbsSubcategoryFilter: (subcat: string | undefined) => void;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setShowAll: (showAll: boolean) => void;
  
  // UI actions
  setSearchLoading: (searchLoading: boolean) => void;
  setShowErrorModal: (show: boolean) => void;
  setSelectedRows: (rows: string[]) => void;
  setEditingCell: (cell: { rowId: string; field: string } | null) => void;
  setCellEditValue: (value: any) => void;
  setHighlightId: (id: string | null) => void;
  setNewRowId: (id: string | null) => void;
  setPopover: (popover: { rowId: string | null; anchorEl: HTMLElement | null }) => void;
  setPopoverText: (text: string) => void;
  setPopoverUrl: (url: string) => void;
  setShowBulkEditModal: (show: boolean) => void;
  setShowBulkDeleteModal: (show: boolean) => void;
  setBulkEditFields: (fields: Partial<LedgerEntry>) => void;
  setClearedFields: (fields: Record<string, boolean>) => void;
  setShowUploadModal: (show: boolean) => void;
  setUploadModalData: (data: any) => void;
  setPotentialMatchIds: (ids: string[]) => void;
  setEntriesWithRejectedMatches: (entries: Set<string>) => void;
  setToast: (toast: { message: string; type: 'success' | 'error'; undoId?: string } | null) => void;
  
  // Row selection
  selectRow: (id: string) => void;
  selectAll: () => void;
  
  // Cell editing
  startCellEdit: (rowId: string, field: string, value: any) => void;
  saveCellEdit: (rowId: string, field: string, value: any) => Promise<void>;
  cancelCellEdit: () => void;
  
  // Entry operations
  addEntry: () => void;
  saveNewEntry: () => Promise<void>;
  cancelNewEntry: () => void;
  updateEntry: (id: string, updates: Partial<LedgerEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  bulkUpdateEntries: (ids: string[], updates: Partial<LedgerEntry>) => Promise<void>;
  bulkDeleteEntries: (ids: string[]) => Promise<void>;
  
  // Bulk edit
  startBulkEdit: () => void;
  updateBulkEditField: (field: string, value: any) => void;
  toggleBulkEditClear: (field: string) => void;
  saveBulkEdit: () => Promise<void>;
  
  // Popover operations
  openPopover: (rowId: string, text: string, url: string, anchorEl: HTMLElement) => void;
  closePopover: () => void;
  savePopover: () => Promise<void>;
  
  // Match operations
  confirmMatch: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  rejectMatch: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  undoReject: (transactionId: string, ledgerEntryId: string) => Promise<{ success: boolean; error?: string }>;
  removeMatch: (transactionId: string) => Promise<void>;
  
  // Utility actions
  clearError: () => void;
  clearToast: () => void;
  resetUI: () => void;
}

// Constants
const PAGE_SIZE = 10;
const requiredFields = ['vendor_name', 'expense_description', 'wbs_category', 'wbs_subcategory'];

// Helper functions
const formatCurrency = (val: number | string | undefined | null) => {
  if (val === undefined || val === null || isNaN(Number(val))) return '--';
  return Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

export const useLedgerStore = create<LedgerStoreState>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        // Original state
        ledgerEntries: [],
        actualsTransactions: [],
        actualsSessions: [],
        potentialMatches: [],
        rejectedMatches: [],
        matches: [],
        loading: false,
        error: null,

        // Enhanced state
        entries: [],
        total: 0,
        dropdownOptions: { vendors: [], categories: [], subcategories: [] },
        filters: {
          filterType: 'all',
          vendorFilter: undefined,
          wbsCategoryFilter: undefined,
          wbsSubcategoryFilter: undefined,
          search: '',
        },
        ui: {
          loading: false,
          searchLoading: false,
          error: null,
          showErrorModal: false,
          page: 1,
          selectedRows: [],
          editingCell: null,
          cellEditValue: '',
          highlightId: null,
          newRowId: null,
          popover: { rowId: null, anchorEl: null },
          popoverText: '',
          popoverUrl: '',
          showBulkEditModal: false,
          showBulkDeleteModal: false,
          bulkEditFields: {},
          clearedFields: {},
          showUploadModal: false,
          uploadModalData: null,
          potentialMatchIds: [],
          entriesWithRejectedMatches: new Set(),
          toast: null,
        },
        programId: null,
        showAll: false,

        // Original actions (keeping for backward compatibility)
        setLedgerEntries: (entries: LedgerEntry[]) => set({ ledgerEntries: entries }),
        setActualsTransactions: (txs: ActualsUploadTransaction[]) => set({ actualsTransactions: txs }),
        setActualsSessions: (sessions: ActualsUploadSession[]) => set({ actualsSessions: sessions }),
        setPotentialMatches: (matches: PotentialMatchData[]) => set({ potentialMatches: matches }),
        setRejectedMatches: (matches: RejectedMatchData[]) => set({ rejectedMatches: matches }),
        setMatches: (matches: Match[]) => set({ matches }),
        updateLedgerEntry: (id: string, update: Partial<LedgerEntry>) =>
          set((state) => ({
            ledgerEntries: state.ledgerEntries.map((entry) =>
              entry.id === id ? { ...entry, ...update } : entry
            ),
          })),
        updateMatchStatus: (ledgerEntryId: string, transactionId: string, status: MatchStatus) =>
          set((state) => ({
            matches: state.matches.map((m) =>
              m.ledgerEntryId === ledgerEntryId && m.transactionId === transactionId
                ? { ...m, status }
                : m
            ),
          })),
        setLoading: (loading: boolean) => set({ loading }),
        setError: (error: string | null) => set({ error }),

        // Enhanced actions
        // Initialization
        initialize: (programId: string, showAll = false) => {
          const currentState = get();
          
          if (currentState.programId !== programId || currentState.showAll !== showAll) {
            set({ programId, showAll });
            get().fetchEntries();
            get().fetchDropdownOptions(); // Fetch all dropdown options
            // Only refresh potential match IDs if we have entries
            setTimeout(() => {
              const state = get();
              if (state.entries.length > 0) {
                get().refreshPotentialMatchIds();
                get().refreshRejectedMatchIds();
              }
            }, 100);
          }
        },

        // Data fetching
        fetchEntries: async () => {
          const { programId, filters, ui, showAll } = get();
          if (!programId) return;

          set({ ui: { ...ui, loading: true, error: null } });

          try {
            const params = new URLSearchParams({
              page: ui.page.toString(),
              limit: showAll ? '1000' : PAGE_SIZE.toString(),
              showAll: showAll ? 'true' : 'false',
            });

            if (filters.search) params.append('search', filters.search);
            if (filters.filterType !== 'all') params.append('filterType', filters.filterType);
            if (filters.vendorFilter) params.append('vendorFilter', filters.vendorFilter);
            if (filters.wbsCategoryFilter) params.append('wbsCategoryFilter', filters.wbsCategoryFilter);
            if (filters.wbsSubcategoryFilter) params.append('wbsSubcategoryFilter', filters.wbsSubcategoryFilter);

            const response = await axios.get(`/api/programs/${programId}/ledger?${params}`);
            
            if (response.data) {
              const { entries: newEntries, total: newTotal } = response.data as { entries: LedgerEntry[]; total: number };
              
              // Don't update dropdown options from filtered results
              set({
                entries: newEntries,
                total: newTotal,
                ui: { ...ui, loading: false },
              });
            }
          } catch (error: any) {
            set({
              ui: {
                ...ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to fetch entries',
                showErrorModal: true,
              },
            });
          }
        },

        // Fetch dropdown options separately (all unique values, not filtered)
        fetchDropdownOptions: async () => {
          const { programId } = get();
          if (!programId) return;

          try {
            const response = await axios.get(`/api/programs/${programId}/ledger/dropdown-options`);
            if (response.data) {
              const { vendors, categories, subcategories } = response.data as {
                vendors: string[];
                categories: string[];
                subcategories: string[];
              };
              set({ dropdownOptions: { vendors, categories, subcategories } });
            }
          } catch (error) {
            console.error('Failed to fetch dropdown options:', error);
          }
        },

        refreshPotentialMatchIds: async () => {
          const { programId } = get();
          if (!programId) return;

          try {
            const res = await axios.get(`/api/programs/${programId}/ledger/potential-match-ids`);
            if (res.data) {
              const ids = res.data as string[];
              const currentUI = get().ui;
              set({ ui: { ...currentUI, potentialMatchIds: ids } });
            }
          } catch (error) {
            console.error('Failed to refresh potential match IDs:', error);
          }
        },

        refreshRejectedMatchIds: async () => {
          const { programId } = get();
          if (!programId) return;

          try {
            const res = await axios.get(`/api/programs/${programId}/ledger/rejected-match-ids`);
            if (res.data) {
              const ids = res.data as string[];
              set({ ui: { ...get().ui, entriesWithRejectedMatches: new Set(ids) } });
            }
          } catch (error) {
            console.error('Failed to refresh rejected match IDs:', error);
          }
        },

        // Filter actions
        setFilterType: (type) => {
          const currentFilters = get().filters;
          if (currentFilters.filterType !== type) {
            set({ filters: { ...currentFilters, filterType: type } });
            get().fetchEntries();
          }
        },

        setVendorFilter: (vendor) => {
          const currentFilters = get().filters;
          if (currentFilters.vendorFilter !== vendor) {
            set({ filters: { ...currentFilters, vendorFilter: vendor } });
            get().fetchEntries();
          }
        },

        setWbsCategoryFilter: (cat) => {
          const currentFilters = get().filters;
          if (currentFilters.wbsCategoryFilter !== cat) {
            set({ filters: { ...currentFilters, wbsCategoryFilter: cat } });
            get().fetchEntries();
          }
        },

        setWbsSubcategoryFilter: (subcat) => {
          const currentFilters = get().filters;
          if (currentFilters.wbsSubcategoryFilter !== subcat) {
            set({ filters: { ...currentFilters, wbsSubcategoryFilter: subcat } });
            get().fetchEntries();
          }
        },

        setSearch: (search) => {
          const currentFilters = get().filters;
          if (currentFilters.search !== search) {
            set({ filters: { ...currentFilters, search } });
            // Debounced search will be handled in the component
          }
        },

        setPage: (page) => {
          const currentUI = get().ui;
          if (currentUI.page !== page) {
            set({ ui: { ...currentUI, page } });
            get().fetchEntries();
          }
        },

        setShowAll: (showAll) => {
          const currentShowAll = get().showAll;
          if (currentShowAll !== showAll) {
            set({ showAll });
            get().fetchEntries();
          }
        },

        // UI actions
        setSearchLoading: (searchLoading) => set({ ui: { ...get().ui, searchLoading } }),
        setShowErrorModal: (showErrorModal) => set({ ui: { ...get().ui, showErrorModal } }),
        setSelectedRows: (selectedRows) => set({ ui: { ...get().ui, selectedRows } }),
        setEditingCell: (editingCell) => set({ ui: { ...get().ui, editingCell } }),
        setCellEditValue: (cellEditValue) => set({ ui: { ...get().ui, cellEditValue } }),
        setHighlightId: (highlightId) => set({ ui: { ...get().ui, highlightId } }),
        setNewRowId: (newRowId) => set({ ui: { ...get().ui, newRowId } }),
        setPopover: (popover) => set({ ui: { ...get().ui, popover } }),
        setPopoverText: (popoverText) => set({ ui: { ...get().ui, popoverText } }),
        setPopoverUrl: (popoverUrl) => set({ ui: { ...get().ui, popoverUrl } }),
        setShowBulkEditModal: (showBulkEditModal) => set({ ui: { ...get().ui, showBulkEditModal } }),
        setShowBulkDeleteModal: (showBulkDeleteModal) => set({ ui: { ...get().ui, showBulkDeleteModal } }),
        setBulkEditFields: (bulkEditFields) => set({ ui: { ...get().ui, bulkEditFields } }),
        setClearedFields: (clearedFields) => set({ ui: { ...get().ui, clearedFields } }),
        setShowUploadModal: (showUploadModal) => set({ ui: { ...get().ui, showUploadModal } }),
        setUploadModalData: (uploadModalData) => set({ ui: { ...get().ui, uploadModalData } }),
        setPotentialMatchIds: (potentialMatchIds) => set({ ui: { ...get().ui, potentialMatchIds } }),
        setEntriesWithRejectedMatches: (entriesWithRejectedMatches) => set({ ui: { ...get().ui, entriesWithRejectedMatches } }),
        setToast: (toast) => set({ ui: { ...get().ui, toast } }),

        // Row selection
        selectRow: (id) => {
          const { ui } = get();
          const newSelectedRows = ui.selectedRows.includes(id)
            ? ui.selectedRows.filter(rowId => rowId !== id)
            : [...ui.selectedRows, id];
          set({ ui: { ...ui, selectedRows: newSelectedRows } });
        },

        selectAll: () => {
          const { entries, ui } = get();
          const newSelectedRows = ui.selectedRows.length === entries.length ? [] : entries.map(e => e.id);
          set({ ui: { ...ui, selectedRows: newSelectedRows } });
        },

        // Cell editing
        startCellEdit: (rowId, field, value) => {
          set({ ui: { ...get().ui, editingCell: { rowId, field }, cellEditValue: value ?? '' } });
        },

        saveCellEdit: async (rowId, field, value) => {
          const { entries, programId, ui } = get();
          if (!programId) return;

          const entry = entries.find(e => e.id === rowId);
          if (!entry) return;

          const numberFields = ['baseline_amount', 'planned_amount', 'actual_amount'];
          let oldValue = entry[field as keyof LedgerEntry];
          let newValue = value;

          // Check if value actually changed
          if (numberFields.includes(field)) {
            oldValue = oldValue === null || oldValue === undefined || oldValue === '' ? null : Number(oldValue);
            newValue = newValue === null || newValue === undefined || newValue === '' ? null : Number(newValue);
            if (oldValue === newValue) {
              set({ ui: { ...ui, editingCell: null, cellEditValue: '' } });
              return;
            }
          } else {
            const oldStr = oldValue === null || oldValue === undefined ? '' : String(oldValue);
            const newStr = newValue === null || newValue === undefined ? '' : String(newValue);
            if (oldStr === newStr) {
              set({ ui: { ...ui, editingCell: null, cellEditValue: '' } });
              return;
            }
            if (!requiredFields.includes(field) && (newValue === '' || newValue === undefined)) {
              newValue = null;
            }
          }

          // Prevent clearing required fields
          if (requiredFields.includes(field) && (newValue === '' || newValue === null || newValue === undefined)) {
            set({ ui: { ...ui, editingCell: null, cellEditValue: '' } });
            return;
          }

          try {
            // Update local state immediately
            const updatedEntries = entries.map(entry =>
              entry.id === rowId ? { ...entry, [field]: newValue } : entry
            );
            set({ entries: updatedEntries });

            // Call API
            await axios.put(`/api/programs/${programId}/ledger/${rowId}`, { [field]: newValue });

            set({ ui: { ...ui, editingCell: null, cellEditValue: '' } });
          } catch (error: any) {
            // Revert on error
            const revertedEntries = entries.map(entry =>
              entry.id === rowId ? { ...entry, [field]: oldValue } : entry
            );
            set({ 
              entries: revertedEntries,
              ui: { 
                ...ui, 
                editingCell: null, 
                cellEditValue: '',
                error: error.response?.data?.message || 'Failed to save changes',
                showErrorModal: true
              }
            });
            
            // Also set a toast for immediate feedback
            set({ ui: { ...get().ui, toast: { message: error.response?.data?.message || 'Failed to save changes', type: 'error' } } });
          }
        },

        cancelCellEdit: () => {
          set({ ui: { ...get().ui, editingCell: null, cellEditValue: '' } });
        },

        // Entry operations
        addEntry: () => {
          const { entries, ui } = get();
          if (ui.newRowId) return; // Only one new row at a time

          const tempId = 'new-' + Date.now();
          const newEntry: LedgerEntry = {
            id: tempId,
            vendor_name: '',
            expense_description: '',
            wbs_category: '',
            wbs_subcategory: '',
            baseline_date: '',
            baseline_amount: 0,
            planned_date: '',
            planned_amount: 0,
            actual_date: '',
            actual_amount: 0,
            notes: '',
            invoice_number: '',
            invoice_link_text: '',
            invoice_link_url: '',
            program: { id: '', code: '', name: '' }
          };

          set({
            entries: [newEntry, ...entries],
            ui: { ...ui, newRowId: tempId, editingCell: { rowId: tempId, field: 'wbs_category' } }
          });
        },

        saveNewEntry: async () => {
          const { entries, ui, programId } = get();
          if (!programId || !ui.newRowId) return;

          const newEntry = entries.find(e => e.id === ui.newRowId);
          if (!newEntry) return;

          try {
            const { id, program, ...entryData } = newEntry;
            await axios.post(`/api/programs/${programId}/ledger`, entryData);
            
            set({ ui: { ...ui, newRowId: null, editingCell: null, cellEditValue: '' } });
            get().fetchEntries();
          } catch (error: any) {
            set({ ui: { ...ui, error: 'Error creating entry', showErrorModal: true } });
          }
        },

        cancelNewEntry: () => {
          const { entries, ui } = get();
          if (!ui.newRowId) return;

          set({
            entries: entries.filter(e => e.id !== ui.newRowId),
            ui: { ...ui, newRowId: null, editingCell: null, cellEditValue: '' }
          });
        },

        updateEntry: async (id, updates) => {
          const { programId } = get();
          if (!programId) return;

          await axios.put(`/api/programs/${programId}/ledger/${id}`, updates);
          get().fetchEntries();
        },

        deleteEntry: async (id) => {
          const { programId } = get();
          if (!programId) return;

          await axios.delete(`/api/programs/${programId}/ledger/${id}`);
          get().fetchEntries();
        },

        bulkUpdateEntries: async (ids, updates) => {
          const { programId } = get();
          if (!programId) return;

          // TODO: Implement bulk update endpoint in backend
          // For now, update entries one by one
          for (const id of ids) {
            await axios.put(`/api/programs/${programId}/ledger/${id}`, updates);
          }
          get().fetchEntries();
        },

        bulkDeleteEntries: async (ids) => {
          const { programId, ui } = get();
          if (!programId) return;

          try {
            // Delete entries one by one using the correct endpoint
            for (const id of ids) {
              await axios.delete(`/api/programs/ledger/${id}`);
            }
            
            // Clear selected rows and close modal after successful deletion
            set({
              ui: {
                ...ui,
                selectedRows: [],
                showBulkDeleteModal: false
              }
            });
            
            // Refresh the entries list
            get().fetchEntries();
          } catch (error) {
            console.error('Bulk delete failed:', error);
            throw error;
          }
        },

        // Bulk edit
        startBulkEdit: () => {
          set({ ui: { ...get().ui, showBulkEditModal: true, bulkEditFields: {}, clearedFields: {} } });
        },

        updateBulkEditField: (field, value) => {
          const { ui } = get();
          set({
            ui: {
              ...ui,
              bulkEditFields: { ...ui.bulkEditFields, [field]: value },
              clearedFields: { ...ui.clearedFields, [field]: false }
            }
          });
        },

        toggleBulkEditClear: (field) => {
          const { ui } = get();
          const newCleared = !ui.clearedFields[field];
          set({
            ui: {
              ...ui,
              clearedFields: { ...ui.clearedFields, [field]: newCleared },
              bulkEditFields: { ...ui.bulkEditFields, [field]: '' }
            }
          });
        },

        saveBulkEdit: async () => {
          const { ui } = get();
          const payload: any = {};
          
          Object.entries(ui.bulkEditFields).forEach(([field, value]) => {
            if (ui.clearedFields[field]) {
              payload[field] = null;
            } else if (value !== '' && value !== undefined) {
              payload[field] = value;
            }
          });

          try {
            await get().bulkUpdateEntries(ui.selectedRows, payload);
            set({
              ui: {
                ...ui,
                showBulkEditModal: false,
                selectedRows: [],
                bulkEditFields: {},
                clearedFields: {}
              }
            });
          } catch (error) {
            console.error('Bulk edit failed:', error);
          }
        },

        // Popover operations
        openPopover: (rowId, text, url, anchorEl) => {
          set({
            ui: {
              ...get().ui,
              popover: { rowId, anchorEl },
              popoverText: text || '',
              popoverUrl: url || ''
            }
          });
        },

        closePopover: () => {
          set({
            ui: {
              ...get().ui,
              popover: { rowId: null, anchorEl: null },
              popoverText: '',
              popoverUrl: ''
            }
          });
        },

        savePopover: async () => {
          const { ui, programId } = get();
          if (!programId || !ui.popover.rowId) return;

          try {
            // TODO: Implement invoice-link endpoint in backend
            // For now, update the entry with invoice link fields
            await axios.put(`/api/programs/${programId}/ledger/${ui.popover.rowId}`, {
              invoice_link_text: ui.popoverText,
              invoice_link_url: ui.popoverUrl
            });
            get().closePopover();
          } catch (error) {
            console.error('Popover save failed:', error);
          }
        },

        // Match operations
        confirmMatch: async (transactionId, ledgerEntryId) => {
          const { programId, entries, ui } = get();
          if (!programId) return { success: false, error: 'No program ID' };

          try {
            await axios.post(`/api/import/transaction/${transactionId}/confirm-match`, {
              ledgerEntryId
            });
            
            // Fetch the updated ledger entry to get the actual data
            const updatedEntryResponse = await axios.get(`/api/programs/${programId}/ledger?limit=1000&showAll=true`);
            const responseData = updatedEntryResponse.data as { entries: LedgerEntry[]; total: number };
            const updatedEntry = responseData.entries.find((entry: LedgerEntry) => entry.id === ledgerEntryId);
            
            if (!updatedEntry) {
              throw new Error('Updated ledger entry not found');
            }
            
            // Update local state with the actual data from the backend
            const updatedEntries = entries.map(entry => {
              if (entry.id === ledgerEntryId) {
                return {
                  ...entry,
                  actual_amount: updatedEntry.actual_amount,
                  actual_date: updatedEntry.actual_date,
                  invoice_link_text: updatedEntry.invoice_link_text,
                  invoice_link_url: updatedEntry.invoice_link_url,
                  actualsUploadTransaction: {
                    id: transactionId,
                    vendorName: updatedEntry.actualsUploadTransaction?.vendorName || '',
                    description: updatedEntry.actualsUploadTransaction?.description || '',
                    amount: updatedEntry.actual_amount,
                    transactionDate: updatedEntry.actual_date,
                    status: 'confirmed',
                    actualsUploadSession: updatedEntry.actualsUploadTransaction?.actualsUploadSession || undefined
                  }
                } as LedgerEntry;
              }
              return entry;
            });

            set({
              entries: updatedEntries,
              ui: {
                ...ui,
                potentialMatchIds: ui.potentialMatchIds.filter(id => String(id) !== String(ledgerEntryId)),
                entriesWithRejectedMatches: new Set([...Array.from(ui.entriesWithRejectedMatches)].filter(id => id !== ledgerEntryId))
              }
            });

            return { success: true };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        rejectMatch: async (transactionId, ledgerEntryId) => {
          const { programId, ui } = get();
          if (!programId) return { success: false, error: 'No program ID' };

          try {
            await axios.post(`/api/import/transaction/${transactionId}/reject`, {
              ledgerEntryId
            });
            
            // Update local state
            set({
              ui: {
                ...ui,
                potentialMatchIds: ui.potentialMatchIds.filter(id => String(id) !== String(ledgerEntryId)),
                entriesWithRejectedMatches: new Set([...Array.from(ui.entriesWithRejectedMatches), ledgerEntryId])
              }
            });

            return { success: true };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        undoReject: async (transactionId, ledgerEntryId) => {
          const { programId, ui } = get();
          if (!programId) return { success: false, error: 'No program ID' };

          try {
            await axios.post(`/api/import/transaction/${transactionId}/undo-reject`, {
              ledgerEntryId
            });
            
            // Update local state
            const newRejectedMatches = new Set([...Array.from(ui.entriesWithRejectedMatches)].filter(id => id !== ledgerEntryId));
            const newPotentialMatchIds = ui.potentialMatchIds.includes(ledgerEntryId) 
              ? ui.potentialMatchIds 
              : [...ui.potentialMatchIds, ledgerEntryId];

            set({
              ui: {
                ...ui,
                potentialMatchIds: newPotentialMatchIds,
                entriesWithRejectedMatches: newRejectedMatches
              }
            });

            return { success: true };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        removeMatch: async (transactionId) => {
          const { programId, entries, ui } = get();
          if (!programId) return;

          try {
            await axios.post(`/api/import/transaction/${transactionId}/remove-match`);
            
            // Update local state to remove the actualsUploadTransaction
            const updatedEntries = entries.map(entry => {
              if (entry.actualsUploadTransaction?.id === transactionId) {
                return {
                  ...entry,
                  actualsUploadTransaction: undefined,
                  actual_amount: null,
                  actual_date: null
                };
              }
              return entry;
            });

            set({ entries: updatedEntries });
          } catch (error) {
            console.error('Remove match failed:', error);
          }
        },

        // Utility actions
        clearError: () => set({ ui: { ...get().ui, error: null, showErrorModal: false } }),
        clearToast: () => set({ ui: { ...get().ui, toast: null } }),
        resetUI: () => {
          const { ui } = get();
          set({
            ui: {
              ...ui,
              selectedRows: [],
              editingCell: null,
              cellEditValue: '',
              highlightId: null,
              newRowId: null,
              popover: { rowId: null, anchorEl: null },
              popoverText: '',
              popoverUrl: '',
              showBulkEditModal: false,
              showBulkDeleteModal: false,
              bulkEditFields: {},
              clearedFields: {},
              showUploadModal: false,
              uploadModalData: null,
              toast: null,
            }
          });
        },
      }),
      { name: 'ledger-store' }
    )
  )
);

// Selectors for better performance
export const useLedgerEntries = () => useLedgerStore(state => state.entries);
export const useLedgerTotal = () => useLedgerStore(state => state.total);
export const useLedgerFilters = () => useLedgerStore(state => state.filters);
export const useLedgerUI = () => useLedgerStore(state => state.ui);
export const useLedgerDropdownOptions = () => useLedgerStore(state => state.dropdownOptions);
export const useLedgerProgramId = () => useLedgerStore(state => state.programId);
export const useLedgerShowAll = () => useLedgerStore(state => state.showAll);

// Individual action selectors - each action is a stable reference
export const useLedgerInitialize = () => useLedgerStore(state => state.initialize);
export const useLedgerFetchEntries = () => useLedgerStore(state => state.fetchEntries);
export const useLedgerFetchDropdownOptions = () => useLedgerStore(state => state.fetchDropdownOptions);
export const useLedgerRefreshPotentialMatchIds = () => useLedgerStore(state => state.refreshPotentialMatchIds);
export const useLedgerRefreshRejectedMatchIds = () => useLedgerStore(state => state.refreshRejectedMatchIds);

// Filter actions
export const useLedgerSetFilterType = () => useLedgerStore(state => state.setFilterType);
export const useLedgerSetVendorFilter = () => useLedgerStore(state => state.setVendorFilter);
export const useLedgerSetWbsCategoryFilter = () => useLedgerStore(state => state.setWbsCategoryFilter);
export const useLedgerSetWbsSubcategoryFilter = () => useLedgerStore(state => state.setWbsSubcategoryFilter);
export const useLedgerSetSearch = () => useLedgerStore(state => state.setSearch);
export const useLedgerSetPage = () => useLedgerStore(state => state.setPage);
export const useLedgerSetShowAll = () => useLedgerStore(state => state.setShowAll);

// Row selection actions
export const useLedgerSelectRow = () => useLedgerStore(state => state.selectRow);
export const useLedgerSelectAll = () => useLedgerStore(state => state.selectAll);

// Cell editing actions
export const useLedgerStartCellEdit = () => useLedgerStore(state => state.startCellEdit);
export const useLedgerSaveCellEdit = () => useLedgerStore(state => state.saveCellEdit);
export const useLedgerCancelCellEdit = () => useLedgerStore(state => state.cancelCellEdit);
export const useLedgerSetCellEditValue = () => useLedgerStore(state => state.setCellEditValue);

// Entry operations
export const useLedgerAddEntry = () => useLedgerStore(state => state.addEntry);
export const useLedgerSaveNewEntry = () => useLedgerStore(state => state.saveNewEntry);
export const useLedgerCancelNewEntry = () => useLedgerStore(state => state.cancelNewEntry);
export const useLedgerUpdateEntry = () => useLedgerStore(state => state.updateEntry);
export const useLedgerDeleteEntry = () => useLedgerStore(state => state.deleteEntry);
export const useLedgerBulkUpdateEntries = () => useLedgerStore(state => state.bulkUpdateEntries);
export const useLedgerBulkDeleteEntries = () => useLedgerStore(state => state.bulkDeleteEntries);

// Bulk edit actions
export const useLedgerStartBulkEdit = () => useLedgerStore(state => state.startBulkEdit);
export const useLedgerUpdateBulkEditField = () => useLedgerStore(state => state.updateBulkEditField);
export const useLedgerToggleBulkEditClear = () => useLedgerStore(state => state.toggleBulkEditClear);
export const useLedgerSaveBulkEdit = () => useLedgerStore(state => state.saveBulkEdit);

// Popover actions
export const useLedgerOpenPopover = () => useLedgerStore(state => state.openPopover);
export const useLedgerClosePopover = () => useLedgerStore(state => state.closePopover);
export const useLedgerSavePopover = () => useLedgerStore(state => state.savePopover);
export const useLedgerSetPopoverText = () => useLedgerStore(state => state.setPopoverText);
export const useLedgerSetPopoverUrl = () => useLedgerStore(state => state.setPopoverUrl);

// Match actions
export const useLedgerConfirmMatch = () => useLedgerStore(state => state.confirmMatch);
export const useLedgerRejectMatch = () => useLedgerStore(state => state.rejectMatch);
export const useLedgerUndoReject = () => useLedgerStore(state => state.undoReject);
export const useLedgerRemoveMatch = () => useLedgerStore(state => state.removeMatch);

// UI actions
export const useLedgerSetToast = () => useLedgerStore(state => state.setToast);
export const useLedgerSetShowUploadModal = () => useLedgerStore(state => state.setShowUploadModal);
export const useLedgerSetUploadModalData = () => useLedgerStore(state => state.setUploadModalData);
export const useLedgerSetShowBulkDeleteModal = () => useLedgerStore(state => state.setShowBulkDeleteModal);
export const useLedgerSetShowBulkEditModal = () => useLedgerStore(state => state.setShowBulkEditModal);
export const useLedgerSetSelectedRows = () => useLedgerStore(state => state.setSelectedRows);
export const useLedgerSetEntriesWithRejectedMatches = () => useLedgerStore(state => state.setEntriesWithRejectedMatches);
export const useLedgerSetPotentialMatchIds = () => useLedgerStore(state => state.setPotentialMatchIds);
export const useLedgerSetShowErrorModal = () => useLedgerStore(state => state.setShowErrorModal);
export const useLedgerClearError = () => useLedgerStore(state => state.clearError);
export const useLedgerClearToast = () => useLedgerStore(state => state.clearToast);
export const useLedgerResetUI = () => useLedgerStore(state => state.resetUI);
export const useLedgerSetHighlightId = () => useLedgerStore(state => state.setHighlightId);

// Legacy selector for backward compatibility (but with useMemo to prevent infinite loops)
export const useLedgerActions = () => {
  const initialize = useLedgerInitialize();
  const fetchEntries = useLedgerFetchEntries();
  const setFilterType = useLedgerSetFilterType();
  const setVendorFilter = useLedgerSetVendorFilter();
  const setWbsCategoryFilter = useLedgerSetWbsCategoryFilter();
  const setWbsSubcategoryFilter = useLedgerSetWbsSubcategoryFilter();
  const setSearch = useLedgerSetSearch();
  const setPage = useLedgerSetPage();
  const setShowAll = useLedgerSetShowAll();
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

  return React.useMemo(() => ({
    initialize,
    fetchEntries,
    setFilterType,
    setVendorFilter,
    setWbsCategoryFilter,
    setWbsSubcategoryFilter,
    setSearch,
    setPage,
    setShowAll,
    selectRow,
    selectAll,
    startCellEdit,
    saveCellEdit,
    cancelCellEdit,
    setCellEditValue,
    addEntry,
    saveNewEntry,
    cancelNewEntry,
    updateEntry,
    deleteEntry,
    bulkUpdateEntries,
    bulkDeleteEntries,
    startBulkEdit,
    updateBulkEditField,
    toggleBulkEditClear,
    saveBulkEdit,
    openPopover,
    closePopover,
    savePopover,
    setPopoverText,
    setPopoverUrl,
    confirmMatch,
    rejectMatch,
    undoReject,
    removeMatch,
    setToast,
    setShowUploadModal,
    setUploadModalData,
    setShowBulkDeleteModal,
    setShowBulkEditModal,
    setSelectedRows,
    setEntriesWithRejectedMatches,
    setPotentialMatchIds,
    setShowErrorModal,
    clearError,
    clearToast,
    resetUI,
  }), [
    initialize,
    fetchEntries,
    setFilterType,
    setVendorFilter,
    setWbsCategoryFilter,
    setWbsSubcategoryFilter,
    setSearch,
    setPage,
    setShowAll,
    selectRow,
    selectAll,
    startCellEdit,
    saveCellEdit,
    cancelCellEdit,
    setCellEditValue,
    addEntry,
    saveNewEntry,
    cancelNewEntry,
    updateEntry,
    deleteEntry,
    bulkUpdateEntries,
    bulkDeleteEntries,
    startBulkEdit,
    updateBulkEditField,
    toggleBulkEditClear,
    saveBulkEdit,
    openPopover,
    closePopover,
    savePopover,
    setPopoverText,
    setPopoverUrl,
    confirmMatch,
    rejectMatch,
    undoReject,
    removeMatch,
    setToast,
    setShowUploadModal,
    setUploadModalData,
    setShowBulkDeleteModal,
    setShowBulkEditModal,
    setSelectedRows,
    setEntriesWithRejectedMatches,
    setPotentialMatchIds,
    setShowErrorModal,
    clearError,
    clearToast,
    resetUI,
  ]);
}; 