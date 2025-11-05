import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { riskOpportunityApi } from '../services/riskOpportunityApi';

export interface Risk {
  id: string;
  programId: string;
  title: string;
  description?: string | null;
  categoryId?: string;
  category?: {
    id: string;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
    isSystem: boolean;
  };
  costImpactMin: number;
  costImpactMostLikely: number;
  costImpactMax: number;
  probability: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: string;
  disposition: 'Identified' | 'In Progress' | 'Mitigated' | 'Realized' | 'Retired' | 'Transferred' | 'Accepted';
  dispositionDate?: Date | null;
  dispositionReason?: string | null;
  owner?: string | null;
  identifiedDate?: Date | null;
  targetMitigationDate?: Date | null;
  actualMitigationDate?: Date | null;
  mitigationStrategy?: string | null;
  wbsElementId?: string;
  wbsElement?: {
    id: string;
    code: string;
    name: string;
  };
  materializedAt?: Date | null;
  mrUtilizedAmount: number;
  mrUtilizationDate?: Date | null;
  mrUtilizationReason?: string | null;
  notes?: Array<{
    id: string;
    note: string;
    createdAt: Date;
    createdBy?: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  // Calculated fields
  riskScore?: number;
  expectedValue?: number;
}

export interface Opportunity {
  id: string;
  programId: string;
  title: string;
  description?: string | null;
  categoryId?: string;
  category?: {
    id: string;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
    isSystem: boolean;
  };
  benefitMin: number;
  benefitMostLikely: number;
  benefitMax: number;
  probability: number;
  benefitSeverity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: string;
  disposition: 'Identified' | 'In Progress' | 'Realized' | 'Retired' | 'Deferred' | 'Lost';
  dispositionDate?: Date | null;
  dispositionReason?: string | null;
  owner?: string | null;
  identifiedDate?: Date | null;
  targetRealizationDate?: Date | null;
  actualRealizationDate?: Date | null;
  realizationStrategy?: string | null;
  actualBenefit?: number | null;
  wbsElementId?: string;
  wbsElement?: {
    id: string;
    code: string;
    name: string;
  };
  notes?: Array<{
    id: string;
    note: string;
    createdAt: Date;
    createdBy?: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  // Calculated fields
  opportunityScore?: number;
  expectedBenefit?: number;
}

export interface RiskCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskOpportunityFilters {
  category?: string;
  severity?: string;
  disposition?: string;
  owner?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface RiskOpportunityUIState {
  loading: boolean;
  error: string | null;
  selectedRisk: Risk | null;
  selectedOpportunity: Opportunity | null;
  showRiskFormModal: boolean;
  showOpportunityFormModal: boolean;
  showRiskDetailModal: boolean;
  showOpportunityDetailModal: boolean;
  showDispositionModal: boolean;
  dispositionType: 'risk' | 'opportunity' | null;
}

interface RiskOpportunityStoreState {
  // State
  risks: Risk[];
  opportunities: Opportunity[];
  riskCategories: RiskCategory[];
  filters: RiskOpportunityFilters;
  ui: RiskOpportunityUIState;
  programId: string | null;

  // Actions
  setProgramId: (programId: string | null) => void;
  
  // Risk actions
  fetchRisks: (programId: string, filters?: RiskOpportunityFilters) => Promise<void>;
  createRisk: (programId: string, riskData: Partial<Risk>) => Promise<Risk>;
  updateRisk: (riskId: string, updates: Partial<Risk>) => Promise<Risk>;
  deleteRisk: (riskId: string) => Promise<void>;
  updateRiskDisposition: (riskId: string, disposition: string, reason: string, dispositionDate?: Date) => Promise<Risk>;
  addRiskNote: (riskId: string, note: string, createdBy?: string) => Promise<void>;
  materializeRisk: (riskId: string, amount: number, reason: string) => Promise<Risk>;
  
  // Opportunity actions
  fetchOpportunities: (programId: string, filters?: RiskOpportunityFilters) => Promise<void>;
  createOpportunity: (programId: string, opportunityData: Partial<Opportunity>) => Promise<Opportunity>;
  updateOpportunity: (opportunityId: string, updates: Partial<Opportunity>) => Promise<Opportunity>;
  deleteOpportunity: (opportunityId: string) => Promise<void>;
  updateOpportunityDisposition: (opportunityId: string, disposition: string, reason: string, dispositionDate?: Date) => Promise<Opportunity>;
  addOpportunityNote: (opportunityId: string, note: string, createdBy?: string) => Promise<void>;
  
  // Category actions
  fetchRiskCategories: () => Promise<void>;
  createRiskCategory: (categoryData: {
    code: string;
    name: string;
    description?: string;
    isActive?: boolean;
  }) => Promise<RiskCategory>;
  
  // UI actions
  setFilters: (filters: Partial<RiskOpportunityFilters>) => void;
  setSelectedRisk: (risk: Risk | null) => void;
  setSelectedOpportunity: (opportunity: Opportunity | null) => void;
  setShowRiskFormModal: (show: boolean) => void;
  setShowOpportunityFormModal: (show: boolean) => void;
  setShowRiskDetailModal: (show: boolean) => void;
  setShowOpportunityDetailModal: (show: boolean) => void;
  setShowDispositionModal: (show: boolean, type?: 'risk' | 'opportunity') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRiskOpportunityStore = create<RiskOpportunityStoreState>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        // Initial state
        risks: [],
        opportunities: [],
        riskCategories: [],
        filters: {},
        ui: {
          loading: false,
          error: null,
          selectedRisk: null,
          selectedOpportunity: null,
          showRiskFormModal: false,
          showOpportunityFormModal: false,
          showRiskDetailModal: false,
          showOpportunityDetailModal: false,
          showDispositionModal: false,
          dispositionType: null,
        },
        programId: null,

        // Basic setters
        setProgramId: (programId) => set({ programId }),

        // Risk actions
        fetchRisks: async (programId, filters = {}) => {
          set({ ui: { ...get().ui, loading: true, error: null } });
          try {
            const risks = await riskOpportunityApi.getRisks(programId, filters);
            set({ risks, ui: { ...get().ui, loading: false } });
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to fetch risks',
              },
            });
            throw error;
          }
        },

        createRisk: async (programId, riskData) => {
          set({ ui: { ...get().ui, loading: true, error: null } });
          try {
            const newRisk = await riskOpportunityApi.createRisk(programId, riskData);
            set({
              risks: [...get().risks, newRisk],
              ui: { ...get().ui, loading: false },
            });
            return newRisk;
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to create risk',
              },
            });
            throw error;
          }
        },

        updateRisk: async (riskId, updates) => {
          set({ ui: { ...get().ui, loading: true, error: null } });
          try {
            const updatedRisk = await riskOpportunityApi.updateRisk(riskId, updates);
            set({
              risks: get().risks.map((r) => (r.id === riskId ? updatedRisk : r)),
              ui: {
                ...get().ui,
                selectedRisk: get().ui.selectedRisk?.id === riskId ? updatedRisk : get().ui.selectedRisk,
                loading: false,
              },
            });
            return updatedRisk;
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to update risk',
              },
            });
            throw error;
          }
        },

        deleteRisk: async (riskId) => {
          set({ ui: { ...get().ui, loading: true, error: null } });
          try {
            await riskOpportunityApi.deleteRisk(riskId);
            set({
              risks: get().risks.filter((r) => r.id !== riskId),
              ui: {
                ...get().ui,
                selectedRisk: get().ui.selectedRisk?.id === riskId ? null : get().ui.selectedRisk,
                loading: false,
              },
            });
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to delete risk',
              },
            });
            throw error;
          }
        },

        updateRiskDisposition: async (riskId, disposition, reason, dispositionDate) => {
          set({ ui: { ...get().ui, loading: true, error: null } });
          try {
            const updatedRisk = await riskOpportunityApi.updateRiskDisposition(riskId, disposition, reason, dispositionDate);
            set({
              risks: get().risks.map((r) => (r.id === riskId ? updatedRisk : r)),
              ui: {
                ...get().ui,
                selectedRisk: get().ui.selectedRisk?.id === riskId ? updatedRisk : get().ui.selectedRisk,
                loading: false,
              },
            });
            return updatedRisk;
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to update risk disposition',
              },
            });
            throw error;
          }
        },

        addRiskNote: async (riskId, note, createdBy) => {
          set({ ui: { ...get().ui, loading: true, error: null } });
          try {
            await riskOpportunityApi.addRiskNote(riskId, note, createdBy);
            // Refresh risk to get updated notes
            const risk = await riskOpportunityApi.getRisk(riskId);
            set({
              risks: get().risks.map((r) => (r.id === riskId ? risk : r)),
              ui: {
                ...get().ui,
                selectedRisk: get().ui.selectedRisk?.id === riskId ? risk : get().ui.selectedRisk,
                loading: false,
              },
            });
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to add note',
              },
            });
            throw error;
          }
        },

        materializeRisk: async (riskId, amount, reason) => {
          set({ ui: { ...get().ui, loading: true, error: null } });
          try {
            const result = await riskOpportunityApi.utilizeMRForRisk(riskId, amount, reason);
            const updatedRisk = result.risk;
            set({
              risks: get().risks.map((r) => (r.id === riskId ? updatedRisk : r)),
              ui: {
                ...get().ui,
                selectedRisk: get().ui.selectedRisk?.id === riskId ? updatedRisk : get().ui.selectedRisk,
                loading: false,
              },
            });
            return updatedRisk;
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to materialize risk',
              },
            });
            throw error;
          }
        },

        // Opportunity actions
        fetchOpportunities: async (programId, filters = {}) => {
          set({ ui: { ...get().ui, loading: true, error: null } });
          try {
            const opportunities = await riskOpportunityApi.getOpportunities(programId, filters);
            set({ opportunities, ui: { ...get().ui, loading: false } });
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to fetch opportunities',
              },
            });
            throw error;
          }
        },

        createOpportunity: async (programId, opportunityData) => {
          set({ ui: { ...get().ui, loading: true, error: null } });
          try {
            const newOpportunity = await riskOpportunityApi.createOpportunity(programId, opportunityData);
            set({
              opportunities: [...get().opportunities, newOpportunity],
              ui: { ...get().ui, loading: false },
            });
            return newOpportunity;
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to create opportunity',
              },
            });
            throw error;
          }
        },

        updateOpportunity: async (opportunityId, updates) => {
          set({ ui: { ...get().ui, loading: true, error: null } });
          try {
            const updatedOpportunity = await riskOpportunityApi.updateOpportunity(opportunityId, updates);
            set({
              opportunities: get().opportunities.map((o) => (o.id === opportunityId ? updatedOpportunity : o)),
              ui: {
                ...get().ui,
                selectedOpportunity: get().ui.selectedOpportunity?.id === opportunityId ? updatedOpportunity : get().ui.selectedOpportunity,
                loading: false,
              },
            });
            return updatedOpportunity;
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to update opportunity',
              },
            });
            throw error;
          }
        },

        deleteOpportunity: async (opportunityId) => {
          set({ ui: { ...get().ui, loading: true, error: null } });
          try {
            await riskOpportunityApi.deleteOpportunity(opportunityId);
            set({
              opportunities: get().opportunities.filter((o) => o.id !== opportunityId),
              ui: {
                ...get().ui,
                selectedOpportunity: get().ui.selectedOpportunity?.id === opportunityId ? null : get().ui.selectedOpportunity,
                loading: false,
              },
            });
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to delete opportunity',
              },
            });
            throw error;
          }
        },

        updateOpportunityDisposition: async (opportunityId, disposition, reason, dispositionDate) => {
          set({ ui: { ...get().ui, loading: true, error: null } });
          try {
            const updatedOpportunity = await riskOpportunityApi.updateOpportunityDisposition(opportunityId, disposition, reason, dispositionDate);
            set({
              opportunities: get().opportunities.map((o) => (o.id === opportunityId ? updatedOpportunity : o)),
              ui: {
                ...get().ui,
                selectedOpportunity: get().ui.selectedOpportunity?.id === opportunityId ? updatedOpportunity : get().ui.selectedOpportunity,
                loading: false,
              },
            });
            return updatedOpportunity;
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to update opportunity disposition',
              },
            });
            throw error;
          }
        },

        addOpportunityNote: async (opportunityId, note, createdBy) => {
          set({ ui: { ...get().ui, loading: true, error: null } });
          try {
            await riskOpportunityApi.addOpportunityNote(opportunityId, note, createdBy);
            // Refresh opportunity to get updated notes
            const opportunity = await riskOpportunityApi.getOpportunity(opportunityId);
            set({
              opportunities: get().opportunities.map((o) => (o.id === opportunityId ? opportunity : o)),
              ui: {
                ...get().ui,
                selectedOpportunity: get().ui.selectedOpportunity?.id === opportunityId ? opportunity : get().ui.selectedOpportunity,
                loading: false,
              },
            });
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                loading: false,
                error: error.response?.data?.message || 'Failed to add note',
              },
            });
            throw error;
          }
        },

        // Category actions
        fetchRiskCategories: async () => {
          try {
            const categories = await riskOpportunityApi.getRiskCategories();
            set({ riskCategories: categories });
          } catch (error: any) {
            console.error('Failed to fetch risk categories:', error);
          }
        },

        createRiskCategory: async (categoryData: {
          code: string;
          name: string;
          description?: string;
          isActive?: boolean;
        }) => {
          try {
            const newCategory = await riskOpportunityApi.createRiskCategory(categoryData);
            set({
              riskCategories: [...get().riskCategories, newCategory],
            });
            return newCategory;
          } catch (error: any) {
            set({
              ui: {
                ...get().ui,
                error: error.response?.data?.error || 'Failed to create category',
              },
            });
            throw error;
          }
        },

        // UI actions
        setFilters: (newFilters) =>
          set({
            filters: { ...get().filters, ...newFilters },
          }),

        setSelectedRisk: (risk) =>
          set({
            ui: { ...get().ui, selectedRisk: risk },
          }),

        setSelectedOpportunity: (opportunity) =>
          set({
            ui: { ...get().ui, selectedOpportunity: opportunity },
          }),

        setShowRiskFormModal: (show) =>
          set({
            ui: { ...get().ui, showRiskFormModal: show },
          }),

        setShowOpportunityFormModal: (show) =>
          set({
            ui: { ...get().ui, showOpportunityFormModal: show },
          }),

        setShowRiskDetailModal: (show) =>
          set({
            ui: { ...get().ui, showRiskDetailModal: show },
          }),

        setShowOpportunityDetailModal: (show) =>
          set({
            ui: { ...get().ui, showOpportunityDetailModal: show },
          }),

        setShowDispositionModal: (show, type) =>
          set({
            ui: {
              ...get().ui,
              showDispositionModal: show,
              dispositionType: type || null,
            },
          }),

        setLoading: (loading) =>
          set({
            ui: { ...get().ui, loading },
          }),

        setError: (error) =>
          set({
            ui: { ...get().ui, error },
          }),
      }),
      { name: 'RiskOpportunityStore' }
    )
  )
);

