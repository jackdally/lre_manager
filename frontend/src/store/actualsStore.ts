import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import axios from 'axios';
import React from 'react';
import type { 
  ActualsUploadTransaction, 
  ActualsUploadSession, 
  ActualsUploadConfig,
  SavedConfig 
} from '../types/actuals';

// UI State interfaces
export interface ActualsUIState {
  loading: boolean;
  error: string | null;
  showErrorModal: boolean;
  activeTab: 'upload' | 'sessions' | 'matching';
  showAllDuplicates: boolean;
  
  // Modal state
  showMatchModal: boolean;
  modalTransaction: ActualsUploadTransaction | null;
  modalPotentialMatches: any[];
  modalRejectedMatches: any[];
  modalCurrentTab: 'potential' | 'rejected';
  modalCurrentIndex: number;
  
  // Add to Ledger Modal state
  showAddToLedgerModal: boolean;
  addToLedgerTransaction: ActualsUploadTransaction | null;
  
  // Upload state
  uploadLoading: boolean;
  uploadError: string | null;
  uploadResult: any;
  uploadProgress: number;
  uploadStatus: string;
  
  // Config state
  showSaveConfig: boolean;
  showCopyConfig: boolean;
  configName: string;
  configDescription: string;
  isDefaultConfig: boolean;
  isGlobalConfig: boolean;
  copyTargetProgramId: string;
  copyConfigName: string;
  copyConfigDescription: string;
  copyIsDefault: boolean;
  selectedConfigForCopy: SavedConfig | null;
  selectedConfigForSave: SavedConfig | null;
  
  // Replace upload state
  replaceMode: boolean;
  selectedSessionToReplace: string;
  preserveConfirmedMatches: boolean;
  preserveAllMatches: boolean;
  forceReplace: boolean;
  showReplaceOptions: boolean;
  showForceReplaceConfirm: boolean;
  pendingUploadData: {
    file: File;
    description: string;
    config: any;
  } | null;
  
  // Toast notifications
  toast: { message: string; type: 'success' | 'error'; undoId?: string } | null;
}

export interface ActualsFilters {
  search: string;
  statusFilter: 'all' | 'matched' | 'unmatched' | 'confirmed' | 'rejected';
  duplicateFilter: 'all' | 'duplicates' | 'non-duplicates';
}

interface ActualsStoreState {
  // Core data
  sessions: ActualsUploadSession[];
  currentSession: ActualsUploadSession | null;
  transactions: ActualsUploadTransaction[];
  savedConfigs: SavedConfig[];
  programs: any[];
  sessionMatchCounts: Record<string, { matched: number; unmatched: number; duplicates: number; allDispositioned: boolean }>;
  
  // UI state
  ui: ActualsUIState;
  
  // Filters
  filters: ActualsFilters;
  
  // Program context
  programId: string | null;
  
  // Actions
  // Initialization
  initialize: (programId: string) => void;
  
  // Data fetching
  loadSessions: () => Promise<void>;
  loadSessionDetails: (sessionId: string) => Promise<void>;
  loadSavedConfigs: () => Promise<void>;
  loadPrograms: () => Promise<void>;
  updateSessionMatchCounts: (sessionId: string) => Promise<void>;
  
  // Session operations
  cancelSession: (sessionId: string) => Promise<void>;
  forceSmartMatching: (programId: string) => Promise<void>;
  
  // Upload operations
  performUpload: (config: ActualsUploadConfig, file: File, description: string) => Promise<void>;
  performReplaceUpload: (config: ActualsUploadConfig, file: File, description: string, sessionId: string) => Promise<void>;
  
  // Config operations
  handleConfigSelect: (configId: string) => void;
  handleSaveConfig: (config: ActualsUploadConfig) => Promise<void>;
  handleCopyConfig: (config: ActualsUploadConfig, targetProgramId: string) => Promise<void>;
  
  // Transaction operations
  addToLedger: (transactionId: string, wbsElementId: string, costCategoryId?: string) => Promise<void>;
  handleIgnoreDuplicate: (transactionId: string) => Promise<void>;
  handleRejectDuplicate: (transactionId: string) => Promise<void>;
  handleAcceptAndReplaceOriginal: (transactionId: string, duplicateOfId: string | null | undefined) => Promise<void>;
  
  // Modal operations
  openMatchModal: (transaction: ActualsUploadTransaction) => Promise<void>;
  closeMatchModal: () => void;
  setModalTab: (tab: 'potential' | 'rejected') => void;
  setModalIndex: (index: number) => void;
  confirmMatch: (ledgerEntry: any) => Promise<void>;
  rejectMatch: (ledgerEntry: any) => Promise<void>;
  undoReject: (ledgerEntry: any) => Promise<void>;
  
  // Add to Ledger Modal operations
  openAddToLedgerModal: (transaction: ActualsUploadTransaction) => void;
  closeAddToLedgerModal: () => void;
  
  // UI actions
  setActiveTab: (tab: 'upload' | 'sessions' | 'matching') => void;
  setShowAllDuplicates: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setShowErrorModal: (show: boolean) => void;
  setToast: (toast: { message: string; type: 'success' | 'error'; undoId?: string } | null) => void;
  
  // Upload UI actions
  setUploadLoading: (loading: boolean) => void;
  setUploadError: (error: string | null) => void;
  setUploadResult: (result: any) => void;
  setUploadProgress: (progress: number) => void;
  setUploadStatus: (status: string) => void;
  
  // Config UI actions
  setShowSaveConfig: (show: boolean) => void;
  setShowCopyConfig: (show: boolean) => void;
  setConfigName: (name: string) => void;
  setConfigDescription: (description: string) => void;
  setIsDefaultConfig: (isDefault: boolean) => void;
  setIsGlobalConfig: (isGlobal: boolean) => void;
  setCopyTargetProgramId: (programId: string) => void;
  setCopyConfigName: (name: string) => void;
  setCopyConfigDescription: (description: string) => void;
  setCopyIsDefault: (isDefault: boolean) => void;
  setSelectedConfigForCopy: (config: SavedConfig | null) => void;
  setSelectedConfigForSave: (config: SavedConfig | null) => void;
  
  // Replace upload UI actions
  setReplaceMode: (mode: boolean) => void;
  setSelectedSessionToReplace: (sessionId: string) => void;
  setPreserveConfirmedMatches: (preserve: boolean) => void;
  setPreserveAllMatches: (preserve: boolean) => void;
  setForceReplace: (force: boolean) => void;
  setShowReplaceOptions: (show: boolean) => void;
  setShowForceReplaceConfirm: (show: boolean) => void;
  setPendingUploadData: (data: { file: File; description: string; config: any } | null) => void;
  
  // Filter actions
  setSearch: (search: string) => void;
  setStatusFilter: (filter: 'all' | 'matched' | 'unmatched' | 'confirmed' | 'rejected') => void;
  setDuplicateFilter: (filter: 'all' | 'duplicates' | 'non-duplicates') => void;
  
  // Utility actions
  clearError: () => void;
  clearToast: () => void;
  resetUI: () => void;
}

export const useActualsStore = create<ActualsStoreState>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        // Core data
        sessions: [],
        currentSession: null,
        transactions: [],
        savedConfigs: [],
        programs: [],
        sessionMatchCounts: {},
        
        // UI state
        ui: {
          loading: false,
          error: null,
          showErrorModal: false,
          activeTab: 'upload',
          showAllDuplicates: false,
          
          // Modal state
          showMatchModal: false,
          modalTransaction: null,
          modalPotentialMatches: [],
          modalRejectedMatches: [],
          modalCurrentTab: 'potential',
          modalCurrentIndex: 0,
          showAddToLedgerModal: false,
          addToLedgerTransaction: null,
          
          // Upload state
          uploadLoading: false,
          uploadError: null,
          uploadResult: null,
          uploadProgress: 0,
          uploadStatus: '',
          
          // Config state
          showSaveConfig: false,
          showCopyConfig: false,
          configName: '',
          configDescription: '',
          isDefaultConfig: false,
          isGlobalConfig: false,
          copyTargetProgramId: '',
          copyConfigName: '',
          copyConfigDescription: '',
          copyIsDefault: false,
          selectedConfigForCopy: null,
          selectedConfigForSave: null,
          
          // Replace upload state
          replaceMode: false,
          selectedSessionToReplace: '',
          preserveConfirmedMatches: true,
          preserveAllMatches: false,
          forceReplace: false,
          showReplaceOptions: false,
          showForceReplaceConfirm: false,
          pendingUploadData: null,
          
          // Toast notifications
          toast: null,
        },
        
        // Filters
        filters: {
          search: '',
          statusFilter: 'all',
          duplicateFilter: 'all',
        },
        
        // Program context
        programId: null,
        
        // Actions
        initialize: (programId: string) => {
          const currentState = get();
          if (currentState.programId !== programId) {
            set({ programId });
            get().loadSessions();
            get().loadSavedConfigs();
            get().loadPrograms();
          }
        },
        
        // Data fetching
        loadSessions: async () => {
          const { programId } = get();
          if (!programId) return;
          
          set({ ui: { ...get().ui, loading: true, error: null } });
          
          try {
            const response = await axios.get(`/api/import/${programId}/sessions`);
            set({ 
              sessions: response.data as ActualsUploadSession[],
              ui: { ...get().ui, loading: false }
            });
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to load sessions',
                showErrorModal: true,
              }
            });
          }
        },
        
        loadSessionDetails: async (sessionId: string) => {
          set({ ui: { ...get().ui, loading: true, error: null } });
          
          try {
            const [sessionResponse, transactionsResponse] = await Promise.all([
              axios.get(`/api/import/session/${sessionId}`),
              axios.get(`/api/import/session/${sessionId}/transactions`)
            ]);
            
            set({
              currentSession: sessionResponse.data as ActualsUploadSession,
              transactions: transactionsResponse.data as ActualsUploadTransaction[],
              ui: { ...get().ui, loading: false, activeTab: 'matching' }
            });
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to load session details',
                showErrorModal: true,
              }
            });
          }
        },
        
        loadSavedConfigs: async () => {
          const { programId } = get();
          if (!programId) return;
          
          try {
            const response = await axios.get(`/api/import/${programId}/config`);
            set({ savedConfigs: response.data as SavedConfig[] });
          } catch (error: any) {
            console.error('Failed to load saved configs:', error);
          }
        },
        
        loadPrograms: async () => {
          try {
            const response = await axios.get('/api/programs');
            set({ programs: response.data as any[] });
          } catch (error: any) {
            console.error('Failed to load programs:', error);
          }
        },
        
        updateSessionMatchCounts: async (sessionId: string) => {
          try {
            const response = await axios.get(`/api/import/session/${sessionId}/transactions`);
            const transactions = response.data as ActualsUploadTransaction[];
            
            let matched = 0;
            let unmatched = 0;
            let duplicates = 0;
            
            transactions.forEach((tx: ActualsUploadTransaction) => {
              if (tx.duplicateType && tx.duplicateType !== 'none') {
                duplicates++;
              } else if (tx.status === 'matched' || tx.status === 'confirmed' || tx.status === 'added_to_ledger') {
                matched++;
              } else if (tx.status === 'unmatched') {
                unmatched++;
              }
            });
            
            const allDispositioned = transactions.every((tx: ActualsUploadTransaction) => 
              tx.status !== 'unmatched' || (tx.duplicateType && tx.duplicateType !== 'none')
            );
            
            set({
              sessionMatchCounts: {
                ...get().sessionMatchCounts,
                [sessionId]: { matched, unmatched, duplicates, allDispositioned }
              }
            });
          } catch (error) {
            console.error('Failed to update session match counts:', error);
          }
        },
        
        // Session operations
        cancelSession: async (sessionId: string) => {
          try {
            await axios.post(`/api/import/session/${sessionId}/cancel`);
            get().loadSessions();
          } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to cancel session');
          }
        },
        
        forceSmartMatching: async (programId: string) => {
          try {
            const response = await axios.post(`/api/import/${programId}/force-smart-matching`);
            return response.data;
          } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to force smart matching');
          }
        },
        
        // Upload operations
        performUpload: async (config: ActualsUploadConfig, file: File, description: string) => {
          const { programId, ui } = get();
          if (!programId) return;
          
          set({ ui: { ...ui, uploadLoading: true, uploadError: null, uploadProgress: 0, uploadStatus: 'Processing file...' } });
          
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('description', description);
            formData.append('config', JSON.stringify(config));
            
            const response = await axios.post(`/api/import/${programId}/upload`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            set({
              ui: {
                ...ui,
                uploadLoading: false,
                uploadResult: response.data,
                uploadProgress: 100,
                uploadStatus: 'Complete'
              }
            });
            
            // Refresh sessions after upload
            get().loadSessions();
          } catch (error: any) {
            set({
              ui: {
                ...ui,
                uploadLoading: false,
                uploadError: error.response?.data?.message || 'Upload failed',
                uploadStatus: 'Failed'
              }
            });
            throw error;
          }
        },
        
        performReplaceUpload: async (config: ActualsUploadConfig, file: File, description: string, sessionId: string) => {
          const { programId, ui } = get();
          if (!programId) return;
          
          set({ ui: { ...ui, uploadLoading: true, uploadError: null, uploadProgress: 0, uploadStatus: 'Processing file...' } });
          
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('description', description);
            formData.append('config', JSON.stringify(config));
            formData.append('replaceSessionId', sessionId);
            formData.append('preserveConfirmedMatches', ui.preserveConfirmedMatches.toString());
            formData.append('preserveAllMatches', ui.preserveAllMatches.toString());
            formData.append('forceReplace', ui.forceReplace.toString());
            
            const response = await axios.post(`/api/import/${programId}/upload`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            set({
              ui: {
                ...ui,
                uploadLoading: false,
                uploadResult: response.data,
                uploadProgress: 100,
                uploadStatus: 'Complete'
              }
            });
            
            // Refresh sessions after upload
            get().loadSessions();
          } catch (error: any) {
            set({
              ui: {
                ...ui,
                uploadLoading: false,
                uploadError: error.response?.data?.message || 'Replace upload failed',
                uploadStatus: 'Failed'
              }
            });
            throw error;
          }
        },
        
        // Config operations
        handleConfigSelect: (configId: string) => {
          const { savedConfigs } = get();
          const selectedConfig = savedConfigs.find(c => c.id === configId);
          if (selectedConfig) {
            // This will be handled by the config component
            return selectedConfig.columnMapping;
          }
        },
        
        handleSaveConfig: async (config: ActualsUploadConfig) => {
          const { programId, ui } = get();
          if (!programId) return;
          
          try {
            const response = await axios.post(`/api/import/${programId}/config`, {
              name: ui.configName,
              description: ui.configDescription,
              columnMapping: config,
              isDefault: ui.isDefaultConfig,
              isGlobal: ui.isGlobalConfig
            });
            
            set({
              savedConfigs: [...get().savedConfigs, response.data as SavedConfig],
              ui: { ...ui, showSaveConfig: false }
            });
          } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to save config');
          }
        },
        
        handleCopyConfig: async (config: ActualsUploadConfig, targetProgramId: string) => {
          const { ui } = get();
          
          try {
            const response = await axios.post(`/api/import/${targetProgramId}/config`, {
              name: ui.copyConfigName,
              description: ui.copyConfigDescription,
              columnMapping: config,
              isDefault: ui.copyIsDefault,
              isGlobal: false
            });
            
            set({ ui: { ...ui, showCopyConfig: false } });
          } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to copy config');
          }
        },
        
        // Transaction operations
        addToLedger: async (transactionId: string, wbsElementId: string, costCategoryId?: string) => {
          try {
            await axios.post(`/api/import/transaction/${transactionId}/add-to-ledger`, {
              wbsElementId,
              costCategoryId
            });
            
            // Refresh session details
            const { currentSession } = get();
            if (currentSession) {
              get().loadSessionDetails(currentSession.id);
            }
          } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to add to ledger');
          }
        },
        
        handleIgnoreDuplicate: async (transactionId: string) => {
          try {
            await axios.post(`/api/import/transaction/${transactionId}/ignore-duplicate`);
            
            // Refresh session details
            const { currentSession } = get();
            if (currentSession) {
              get().loadSessionDetails(currentSession.id);
            }
          } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to ignore duplicate');
          }
        },
        
        handleRejectDuplicate: async (transactionId: string) => {
          try {
            await axios.post(`/api/import/transaction/${transactionId}/reject-duplicate`);
            
            // Refresh session details
            const { currentSession } = get();
            if (currentSession) {
              get().loadSessionDetails(currentSession.id);
            }
          } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to reject duplicate');
          }
        },
        
        handleAcceptAndReplaceOriginal: async (transactionId: string, duplicateOfId: string | null | undefined) => {
          try {
            await axios.post(`/api/import/transaction/${transactionId}/accept-replace-original`);
            
            // Refresh session details
            const { currentSession } = get();
            if (currentSession) {
              get().loadSessionDetails(currentSession.id);
            }
          } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to accept and replace original');
          }
        },
        
        // Modal operations
        openMatchModal: async (transaction: ActualsUploadTransaction) => {
          try {
            const [matchesRes, rejectedRes] = await Promise.all([
              axios.get(`/api/import/transaction/${transaction.id}/potential-matches`),
              axios.get(`/api/import/transaction/${transaction.id}/rejected-ledger-entries`)
            ]);
            
            const potentialMatches = matchesRes.data as any[];
            const rejectedMatches = rejectedRes.data as any[];
            
            set({
              ui: {
                ...get().ui,
                showMatchModal: true,
                modalTransaction: transaction,
                modalPotentialMatches: potentialMatches,
                modalRejectedMatches: rejectedMatches,
                modalCurrentTab: potentialMatches.length > 0 ? 'potential' : 'rejected',
                modalCurrentIndex: 0
              }
            });
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                error: error.response?.data?.message || 'Failed to load match data',
                showErrorModal: true
              }
            });
          }
        },
        
        closeMatchModal: () => {
          set({
            ui: {
              ...get().ui,
              showMatchModal: false,
              modalTransaction: null,
              modalPotentialMatches: [],
              modalRejectedMatches: [],
              modalCurrentTab: 'potential',
              modalCurrentIndex: 0
            }
          });
        },
        
        setModalTab: (tab: 'potential' | 'rejected') => {
          set({
            ui: {
              ...get().ui,
              modalCurrentTab: tab,
              modalCurrentIndex: 0
            }
          });
        },
        
        setModalIndex: (index: number) => {
          set({
            ui: {
              ...get().ui,
              modalCurrentIndex: index
            }
          });
        },
        
        confirmMatch: async (ledgerEntry: any) => {
          const { ui } = get();
          if (!ui.modalTransaction) return;
          
          try {
            await axios.post(`/api/import/transaction/${ui.modalTransaction.id}/confirm-match`, {
              ledgerEntryId: ledgerEntry.id
            });
            
            // Refresh modal data
            await get().openMatchModal(ui.modalTransaction);
            
            // Refresh session details
            const { currentSession } = get();
            if (currentSession) {
              get().loadSessionDetails(currentSession.id);
            }
          } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to confirm match');
          }
        },
        
        rejectMatch: async (ledgerEntry: any) => {
          const { ui } = get();
          if (!ui.modalTransaction) return;
          
          try {
            await axios.post(`/api/import/transaction/${ui.modalTransaction.id}/reject`, {
              ledgerEntryId: ledgerEntry.id
            });
            
            // Refresh modal data
            await get().openMatchModal(ui.modalTransaction);
            
            // Refresh session details
            const { currentSession } = get();
            if (currentSession) {
              get().loadSessionDetails(currentSession.id);
            }
          } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to reject match');
          }
        },
        
        undoReject: async (ledgerEntry: any) => {
          const { ui } = get();
          if (!ui.modalTransaction) return;
          
          try {
            await axios.post(`/api/import/transaction/${ui.modalTransaction.id}/undo-reject`, {
              ledgerEntryId: ledgerEntry.id
            });
            
            // Refresh modal data
            await get().openMatchModal(ui.modalTransaction);
            
            // Refresh session details
            const { currentSession } = get();
            if (currentSession) {
              get().loadSessionDetails(currentSession.id);
            }
          } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to undo reject');
          }
        },
        
        // Add to Ledger Modal operations
        openAddToLedgerModal: (transaction: ActualsUploadTransaction) => {
          set({
            ui: {
              ...get().ui,
              showAddToLedgerModal: true,
              addToLedgerTransaction: transaction
            }
          });
        },
        
        closeAddToLedgerModal: () => {
          set({
            ui: {
              ...get().ui,
              showAddToLedgerModal: false,
              addToLedgerTransaction: null
            }
          });
        },
        
        // UI actions
        setActiveTab: (tab: 'upload' | 'sessions' | 'matching') => {
          set({ ui: { ...get().ui, activeTab: tab } });
        },
        
        setShowAllDuplicates: (show: boolean) => {
          set({ ui: { ...get().ui, showAllDuplicates: show } });
        },
        
        setLoading: (loading: boolean) => {
          set({ ui: { ...get().ui, loading } });
        },
        
        setError: (error: string | null) => {
          set({ ui: { ...get().ui, error } });
        },
        
        setShowErrorModal: (show: boolean) => {
          set({ ui: { ...get().ui, showErrorModal: show } });
        },
        
        setToast: (toast: { message: string; type: 'success' | 'error'; undoId?: string } | null) => {
          set({ ui: { ...get().ui, toast } });
        },
        
        // Upload UI actions
        setUploadLoading: (loading: boolean) => {
          set({ ui: { ...get().ui, uploadLoading: loading } });
        },
        
        setUploadError: (error: string | null) => {
          set({ ui: { ...get().ui, uploadError: error } });
        },
        
        setUploadResult: (result: any) => {
          set({ ui: { ...get().ui, uploadResult: result } });
        },
        
        setUploadProgress: (progress: number) => {
          set({ ui: { ...get().ui, uploadProgress: progress } });
        },
        
        setUploadStatus: (status: string) => {
          set({ ui: { ...get().ui, uploadStatus: status } });
        },
        
        // Config UI actions
        setShowSaveConfig: (show: boolean) => {
          set({ ui: { ...get().ui, showSaveConfig: show } });
        },
        
        setShowCopyConfig: (show: boolean) => {
          set({ ui: { ...get().ui, showCopyConfig: show } });
        },
        
        setConfigName: (name: string) => {
          set({ ui: { ...get().ui, configName: name } });
        },
        
        setConfigDescription: (description: string) => {
          set({ ui: { ...get().ui, configDescription: description } });
        },
        
        setIsDefaultConfig: (isDefault: boolean) => {
          set({ ui: { ...get().ui, isDefaultConfig: isDefault } });
        },
        
        setIsGlobalConfig: (isGlobal: boolean) => {
          set({ ui: { ...get().ui, isGlobalConfig: isGlobal } });
        },
        
        setCopyTargetProgramId: (programId: string) => {
          set({ ui: { ...get().ui, copyTargetProgramId: programId } });
        },
        
        setCopyConfigName: (name: string) => {
          set({ ui: { ...get().ui, copyConfigName: name } });
        },
        
        setCopyConfigDescription: (description: string) => {
          set({ ui: { ...get().ui, copyConfigDescription: description } });
        },
        
        setCopyIsDefault: (isDefault: boolean) => {
          set({ ui: { ...get().ui, copyIsDefault: isDefault } });
        },
        
        setSelectedConfigForCopy: (config: SavedConfig | null) => {
          set({ ui: { ...get().ui, selectedConfigForCopy: config } });
        },
        
        setSelectedConfigForSave: (config: SavedConfig | null) => {
          set({ ui: { ...get().ui, selectedConfigForSave: config } });
        },
        
        // Replace upload UI actions
        setReplaceMode: (mode: boolean) => {
          set({ ui: { ...get().ui, replaceMode: mode } });
        },
        
        setSelectedSessionToReplace: (sessionId: string) => {
          set({ ui: { ...get().ui, selectedSessionToReplace: sessionId } });
        },
        
        setPreserveConfirmedMatches: (preserve: boolean) => {
          set({ ui: { ...get().ui, preserveConfirmedMatches: preserve } });
        },
        
        setPreserveAllMatches: (preserve: boolean) => {
          set({ ui: { ...get().ui, preserveAllMatches: preserve } });
        },
        
        setForceReplace: (force: boolean) => {
          set({ ui: { ...get().ui, forceReplace: force } });
        },
        
        setShowReplaceOptions: (show: boolean) => {
          set({ ui: { ...get().ui, showReplaceOptions: show } });
        },
        
        setShowForceReplaceConfirm: (show: boolean) => {
          set({ ui: { ...get().ui, showForceReplaceConfirm: show } });
        },
        
        setPendingUploadData: (data: { file: File; description: string; config: any } | null) => {
          set({ ui: { ...get().ui, pendingUploadData: data } });
        },
        
        // Filter actions
        setSearch: (search: string) => {
          set({ filters: { ...get().filters, search } });
        },
        
        setStatusFilter: (filter: 'all' | 'matched' | 'unmatched' | 'confirmed' | 'rejected') => {
          set({ filters: { ...get().filters, statusFilter: filter } });
        },
        
        setDuplicateFilter: (filter: 'all' | 'duplicates' | 'non-duplicates') => {
          set({ filters: { ...get().filters, duplicateFilter: filter } });
        },
        
        // Utility actions
        clearError: () => {
          set({ ui: { ...get().ui, error: null, showErrorModal: false } });
        },
        
        clearToast: () => {
          set({ ui: { ...get().ui, toast: null } });
        },
        
        resetUI: () => {
          const { ui } = get();
          set({
            ui: {
              ...ui,
              error: null,
              showErrorModal: false,
              showMatchModal: false,
              modalTransaction: null,
              modalPotentialMatches: [],
              modalRejectedMatches: [],
              modalCurrentTab: 'potential',
              modalCurrentIndex: 0,
              showAddToLedgerModal: false,
              addToLedgerTransaction: null,
              toast: null,
            }
          });
        },
      }),
      { name: 'actuals-store' }
    )
  )
);

// Selectors for better performance
export const useActualsSessions = () => useActualsStore(state => state.sessions);
export const useActualsCurrentSession = () => useActualsStore(state => state.currentSession);
export const useActualsTransactions = () => useActualsStore(state => state.transactions);
export const useActualsSavedConfigs = () => useActualsStore(state => state.savedConfigs);
export const useActualsPrograms = () => useActualsStore(state => state.programs);
export const useActualsSessionMatchCounts = () => useActualsStore(state => state.sessionMatchCounts);
export const useActualsUI = () => useActualsStore(state => state.ui);
export const useActualsFilters = () => useActualsStore(state => state.filters);
export const useActualsProgramId = () => useActualsStore(state => state.programId);

// Individual action selectors
export const useActualsInitialize = () => useActualsStore(state => state.initialize);
export const useActualsLoadSessions = () => useActualsStore(state => state.loadSessions);
export const useActualsLoadSessionDetails = () => useActualsStore(state => state.loadSessionDetails);
export const useActualsLoadSavedConfigs = () => useActualsStore(state => state.loadSavedConfigs);
export const useActualsLoadPrograms = () => useActualsStore(state => state.loadPrograms);
export const useActualsUpdateSessionMatchCounts = () => useActualsStore(state => state.updateSessionMatchCounts);

// Session operations
export const useActualsCancelSession = () => useActualsStore(state => state.cancelSession);
export const useActualsForceSmartMatching = () => useActualsStore(state => state.forceSmartMatching);

// Upload operations
export const useActualsPerformUpload = () => useActualsStore(state => state.performUpload);
export const useActualsPerformReplaceUpload = () => useActualsStore(state => state.performReplaceUpload);

// Config operations
export const useActualsHandleConfigSelect = () => useActualsStore(state => state.handleConfigSelect);
export const useActualsHandleSaveConfig = () => useActualsStore(state => state.handleSaveConfig);
export const useActualsHandleCopyConfig = () => useActualsStore(state => state.handleCopyConfig);

// Transaction operations
export const useActualsAddToLedger = () => useActualsStore(state => state.addToLedger);
export const useActualsHandleIgnoreDuplicate = () => useActualsStore(state => state.handleIgnoreDuplicate);
export const useActualsHandleRejectDuplicate = () => useActualsStore(state => state.handleRejectDuplicate);
export const useActualsHandleAcceptAndReplaceOriginal = () => useActualsStore(state => state.handleAcceptAndReplaceOriginal);

// Modal operations
export const useActualsOpenMatchModal = () => useActualsStore(state => state.openMatchModal);
export const useActualsCloseMatchModal = () => useActualsStore(state => state.closeMatchModal);
export const useActualsSetModalTab = () => useActualsStore(state => state.setModalTab);
export const useActualsSetModalIndex = () => useActualsStore(state => state.setModalIndex);
export const useActualsConfirmMatch = () => useActualsStore(state => state.confirmMatch);
export const useActualsRejectMatch = () => useActualsStore(state => state.rejectMatch);
export const useActualsUndoReject = () => useActualsStore(state => state.undoReject);

// Add to Ledger Modal operations
export const useActualsOpenAddToLedgerModal = () => useActualsStore(state => state.openAddToLedgerModal);
export const useActualsCloseAddToLedgerModal = () => useActualsStore(state => state.closeAddToLedgerModal);

// UI actions
export const useActualsSetActiveTab = () => useActualsStore(state => state.setActiveTab);
export const useActualsSetShowAllDuplicates = () => useActualsStore(state => state.setShowAllDuplicates);
export const useActualsSetLoading = () => useActualsStore(state => state.setLoading);
export const useActualsSetError = () => useActualsStore(state => state.setError);
export const useActualsSetShowErrorModal = () => useActualsStore(state => state.setShowErrorModal);
export const useActualsSetToast = () => useActualsStore(state => state.setToast);

// Upload UI actions
export const useActualsSetUploadLoading = () => useActualsStore(state => state.setUploadLoading);
export const useActualsSetUploadError = () => useActualsStore(state => state.setUploadError);
export const useActualsSetUploadResult = () => useActualsStore(state => state.setUploadResult);
export const useActualsSetUploadProgress = () => useActualsStore(state => state.setUploadProgress);
export const useActualsSetUploadStatus = () => useActualsStore(state => state.setUploadStatus);

// Config UI actions
export const useActualsSetShowSaveConfig = () => useActualsStore(state => state.setShowSaveConfig);
export const useActualsSetShowCopyConfig = () => useActualsStore(state => state.setShowCopyConfig);
export const useActualsSetConfigName = () => useActualsStore(state => state.setConfigName);
export const useActualsSetConfigDescription = () => useActualsStore(state => state.setConfigDescription);
export const useActualsSetIsDefaultConfig = () => useActualsStore(state => state.setIsDefaultConfig);
export const useActualsSetIsGlobalConfig = () => useActualsStore(state => state.setIsGlobalConfig);
export const useActualsSetCopyTargetProgramId = () => useActualsStore(state => state.setCopyTargetProgramId);
export const useActualsSetCopyConfigName = () => useActualsStore(state => state.setCopyConfigName);
export const useActualsSetCopyConfigDescription = () => useActualsStore(state => state.setCopyConfigDescription);
export const useActualsSetCopyIsDefault = () => useActualsStore(state => state.setCopyIsDefault);
export const useActualsSetSelectedConfigForCopy = () => useActualsStore(state => state.setSelectedConfigForCopy);
export const useActualsSetSelectedConfigForSave = () => useActualsStore(state => state.setSelectedConfigForSave);

// Replace upload UI actions
export const useActualsSetReplaceMode = () => useActualsStore(state => state.setReplaceMode);
export const useActualsSetSelectedSessionToReplace = () => useActualsStore(state => state.setSelectedSessionToReplace);
export const useActualsSetPreserveConfirmedMatches = () => useActualsStore(state => state.setPreserveConfirmedMatches);
export const useActualsSetPreserveAllMatches = () => useActualsStore(state => state.setPreserveAllMatches);
export const useActualsSetForceReplace = () => useActualsStore(state => state.setForceReplace);
export const useActualsSetShowReplaceOptions = () => useActualsStore(state => state.setShowReplaceOptions);
export const useActualsSetShowForceReplaceConfirm = () => useActualsStore(state => state.setShowForceReplaceConfirm);
export const useActualsSetPendingUploadData = () => useActualsStore(state => state.setPendingUploadData);

// Filter actions
export const useActualsSetSearch = () => useActualsStore(state => state.setSearch);
export const useActualsSetStatusFilter = () => useActualsStore(state => state.setStatusFilter);
export const useActualsSetDuplicateFilter = () => useActualsStore(state => state.setDuplicateFilter);

// Utility actions
export const useActualsClearError = () => useActualsStore(state => state.clearError);
export const useActualsClearToast = () => useActualsStore(state => state.clearToast);
export const useActualsResetUI = () => useActualsStore(state => state.resetUI); 