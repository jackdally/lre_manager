import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { settingsApi } from '../services/settingsApi';

// Types for settings
export interface WBSTemplate {
  id: string;
  name: string;
  description: string;
  structure: WBSElement[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WBSElement {
  id: string;
  code: string;
  name: string;
  description: string;
  level: number;
  parentId?: string;
  children?: WBSElement[];
}

export interface CostCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  parentId?: string;
  children?: CostCategory[];
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  categories: string[];
  performanceRating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
}

export interface FiscalYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  dateFormat: string;
  timeZone: string;
  notifications: {
    email: boolean;
    inApp: boolean;
  };
}

export interface SettingsState {
  // WBS Templates
  wbsTemplates: WBSTemplate[];
  selectedWbsTemplate: WBSTemplate | null;
  
  // Cost Categories
  costCategories: CostCategory[];
  selectedCostCategory: CostCategory | null;
  
  // Vendors
  vendors: Vendor[];
  selectedVendor: Vendor | null;
  
  // Currencies
  currencies: Currency[];
  defaultCurrency: Currency | null;
  
  // Fiscal Years
  fiscalYears: FiscalYear[];
  activeFiscalYear: FiscalYear | null;
  
  // User Preferences
  userPreferences: UserPreferences;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  // WBS Templates
  setWbsTemplates: (templates: WBSTemplate[]) => void;
  addWbsTemplate: (template: WBSTemplate) => void;
  updateWbsTemplate: (id: string, template: Partial<WBSTemplate>) => void;
  deleteWbsTemplate: (id: string) => void;
  setSelectedWbsTemplate: (template: WBSTemplate | null) => void;
  
  // WBS Template API actions
  fetchWbsTemplates: () => Promise<void>;
  createWbsTemplate: (template: Omit<WBSTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<WBSTemplate>;
  updateWbsTemplateApi: (id: string, template: Partial<WBSTemplate>) => Promise<WBSTemplate>;
  deleteWbsTemplateApi: (id: string) => Promise<void>;
  setDefaultWbsTemplate: (id: string) => Promise<void>;
  
  // Cost Categories
  setCostCategories: (categories: CostCategory[]) => void;
  addCostCategory: (category: CostCategory) => void;
  updateCostCategory: (id: string, category: Partial<CostCategory>) => void;
  deleteCostCategory: (id: string) => void;
  setSelectedCostCategory: (category: CostCategory | null) => void;
  
  // Vendors
  setVendors: (vendors: Vendor[]) => void;
  addVendor: (vendor: Vendor) => void;
  updateVendor: (id: string, vendor: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;
  setSelectedVendor: (vendor: Vendor | null) => void;
  
  // Currencies
  setCurrencies: (currencies: Currency[]) => void;
  setDefaultCurrency: (currency: Currency) => void;
  
  // Fiscal Years
  setFiscalYears: (fiscalYears: FiscalYear[]) => void;
  setActiveFiscalYear: (fiscalYear: FiscalYear) => void;
  
  // User Preferences
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  
  // General
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Default user preferences
const defaultUserPreferences: UserPreferences = {
  theme: 'system',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  timeZone: 'UTC',
  notifications: {
    email: true,
    inApp: true,
  },
};

// Default currencies
const defaultCurrencies: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1, isDefault: true },
  { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.85, isDefault: false },
  { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.73, isDefault: false },
];

// Default WBS Templates
const defaultWBSTemplates: WBSTemplate[] = [
  {
    id: '1',
    name: 'Standard Project WBS',
    description: 'A standard work breakdown structure for typical projects',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    structure: [
      {
        id: '1.1',
        code: '1.0',
        name: 'Project Management',
        description: 'Project management and oversight activities',
        level: 1,
        children: [
          {
            id: '1.1.1',
            code: '1.1',
            name: 'Planning',
            description: 'Project planning and scheduling',
            level: 2,
            children: [],
          },
          {
            id: '1.1.2',
            code: '1.2',
            name: 'Monitoring & Control',
            description: 'Project monitoring and control activities',
            level: 2,
            children: [],
          },
        ],
      },
      {
        id: '1.2',
        code: '2.0',
        name: 'Technical Development',
        description: 'Technical development and implementation',
        level: 1,
        children: [
          {
            id: '1.2.1',
            code: '2.1',
            name: 'Design',
            description: 'System design and architecture',
            level: 2,
            children: [],
          },
          {
            id: '1.2.2',
            code: '2.2',
            name: 'Implementation',
            description: 'System implementation and coding',
            level: 2,
            children: [],
          },
          {
            id: '1.2.3',
            code: '2.3',
            name: 'Testing',
            description: 'System testing and validation',
            level: 2,
            children: [],
          },
        ],
      },
      {
        id: '1.3',
        code: '3.0',
        name: 'Integration & Deployment',
        description: 'System integration and deployment activities',
        level: 1,
        children: [
          {
            id: '1.3.1',
            code: '3.1',
            name: 'Integration',
            description: 'System integration activities',
            level: 2,
            children: [],
          },
          {
            id: '1.3.2',
            code: '3.2',
            name: 'Deployment',
            description: 'System deployment and go-live',
            level: 2,
            children: [],
          },
        ],
      },
    ],
  },
];

export const useSettingsStore = create<SettingsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      wbsTemplates: [],
      selectedWbsTemplate: null,
      costCategories: [],
      selectedCostCategory: null,
      vendors: [],
      selectedVendor: null,
      currencies: defaultCurrencies,
      defaultCurrency: defaultCurrencies.find(c => c.isDefault) || null,
      fiscalYears: [],
      activeFiscalYear: null,
      userPreferences: defaultUserPreferences,
      isLoading: false,
      error: null,

      // WBS Template actions
      setWbsTemplates: (templates) => set({ wbsTemplates: templates }),
      addWbsTemplate: (template) => set((state) => ({ 
        wbsTemplates: [...state.wbsTemplates, template] 
      })),
      updateWbsTemplate: (id, template) => set((state) => ({
        wbsTemplates: state.wbsTemplates.map(t => 
          t.id === id ? { ...t, ...template } : t
        )
      })),
      deleteWbsTemplate: (id) => set((state) => ({
        wbsTemplates: state.wbsTemplates.filter(t => t.id !== id)
      })),
      setSelectedWbsTemplate: (template) => set({ selectedWbsTemplate: template }),

      // WBS Template API actions
      fetchWbsTemplates: async () => {
        const state = get();
        if (state.isLoading) return; // Prevent multiple simultaneous requests
        
        set({ isLoading: true, error: null });
        try {
          const templates = await settingsApi.getWbsTemplates();
          set({ wbsTemplates: templates, isLoading: false });
          // Set default template if available
          const defaultTemplate = templates.find(t => t.isDefault);
          if (defaultTemplate) {
            set({ selectedWbsTemplate: defaultTemplate });
          }
        } catch (error) {
          set({ error: 'Failed to fetch WBS templates', isLoading: false });
        }
      },

      createWbsTemplate: async (template: Omit<WBSTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
        set({ isLoading: true, error: null });
        try {
          const newTemplate = await settingsApi.createWbsTemplate(template);
          set((state) => ({ 
            wbsTemplates: [...state.wbsTemplates, newTemplate],
            isLoading: false 
          }));
          return newTemplate;
        } catch (error) {
          set({ error: 'Failed to create WBS template', isLoading: false });
          throw error;
        }
      },

      updateWbsTemplateApi: async (id: string, template: Partial<WBSTemplate>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedTemplate = await settingsApi.updateWbsTemplate(id, template);
          set((state) => ({
            wbsTemplates: state.wbsTemplates.map(t => 
              t.id === id ? updatedTemplate : t
            ),
            isLoading: false
          }));
          return updatedTemplate;
        } catch (error) {
          set({ error: 'Failed to update WBS template', isLoading: false });
          throw error;
        }
      },

      deleteWbsTemplateApi: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await settingsApi.deleteWbsTemplate(id);
          set((state) => ({
            wbsTemplates: state.wbsTemplates.filter(t => t.id !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to delete WBS template', isLoading: false });
          throw error;
        }
      },

      setDefaultWbsTemplate: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await settingsApi.setDefaultWbsTemplate(id);
          // Update all templates to reflect the new default
          set((state) => ({
            wbsTemplates: state.wbsTemplates.map(t => ({
              ...t,
              isDefault: t.id === id
            })),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to set default template', isLoading: false });
          throw error;
        }
      },

      // Cost Category actions
      setCostCategories: (categories) => set({ costCategories: categories }),
      addCostCategory: (category) => set((state) => ({ 
        costCategories: [...state.costCategories, category] 
      })),
      updateCostCategory: (id, category) => set((state) => ({
        costCategories: state.costCategories.map(c => 
          c.id === id ? { ...c, ...category } : c
        )
      })),
      deleteCostCategory: (id) => set((state) => ({
        costCategories: state.costCategories.filter(c => c.id !== id)
      })),
      setSelectedCostCategory: (category) => set({ selectedCostCategory: category }),

      // Vendor actions
      setVendors: (vendors) => set({ vendors }),
      addVendor: (vendor) => set((state) => ({ 
        vendors: [...state.vendors, vendor] 
      })),
      updateVendor: (id, vendor) => set((state) => ({
        vendors: state.vendors.map(v => 
          v.id === id ? { ...v, ...vendor } : v
        )
      })),
      deleteVendor: (id) => set((state) => ({
        vendors: state.vendors.filter(v => v.id !== id)
      })),
      setSelectedVendor: (vendor) => set({ selectedVendor: vendor }),

      // Currency actions
      setCurrencies: (currencies) => set({ currencies }),
      setDefaultCurrency: (currency) => set((state) => ({
        currencies: state.currencies.map(c => ({ ...c, isDefault: c.code === currency.code })),
        defaultCurrency: currency
      })),

      // Fiscal Year actions
      setFiscalYears: (fiscalYears) => set({ fiscalYears }),
      setActiveFiscalYear: (fiscalYear) => set({ activeFiscalYear: fiscalYear }),

      // User Preferences actions
      updateUserPreferences: (preferences) => set((state) => ({
        userPreferences: { ...state.userPreferences, ...preferences }
      })),

      // General actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      reset: () => set({
        wbsTemplates: [],
        selectedWbsTemplate: null,
        costCategories: [],
        selectedCostCategory: null,
        vendors: [],
        selectedVendor: null,
        currencies: defaultCurrencies,
        defaultCurrency: defaultCurrencies.find(c => c.isDefault) || null,
        fiscalYears: [],
        activeFiscalYear: null,
        userPreferences: defaultUserPreferences,
        isLoading: false,
        error: null,
      }),
    }),
    {
      name: 'settings-store',
    }
  )
); 