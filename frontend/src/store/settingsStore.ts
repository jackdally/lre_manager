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
  wbsTemplatesLoaded: boolean; // Add flag to track if templates have been loaded
  
  // Cost Categories
  costCategories: CostCategory[];
  selectedCostCategory: CostCategory | null;
  costCategoriesLoaded: boolean; // Add flag to track if categories have been loaded
  
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
  
  // Cost Category API actions
  fetchCostCategories: () => Promise<void>;
  createCostCategoryApi: (category: Omit<CostCategory, 'id'>) => Promise<CostCategory>;
  updateCostCategoryApi: (id: string, category: Partial<CostCategory>) => Promise<CostCategory>;
  deleteCostCategoryApi: (id: string) => Promise<void>;
  resetCostCategoriesLoaded: () => void;
  
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
  resetWbsTemplatesLoaded: () => void;
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
      wbsTemplatesLoaded: false, // Initialize the new flag
      costCategories: [],
      selectedCostCategory: null,
      costCategoriesLoaded: false, // Initialize the new flag
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
        if (state.isLoading || state.wbsTemplatesLoaded) return; // Prevent multiple simultaneous requests or unnecessary calls
        
        set({ isLoading: true, error: null });
        try {
          const templates = await settingsApi.getWbsTemplates();
          set({ wbsTemplates: templates, isLoading: false, wbsTemplatesLoaded: true });
          // Set default template if available
          const defaultTemplate = templates.find(t => t.isDefault);
          if (defaultTemplate) {
            set({ selectedWbsTemplate: defaultTemplate });
          }
        } catch (error) {
          console.error('Error fetching WBS templates:', error);
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

      // Cost Category API actions
      fetchCostCategories: async () => {
        const state = get();
        if (state.isLoading || state.costCategoriesLoaded) return; // Prevent multiple simultaneous requests or unnecessary calls
        
        set({ isLoading: true, error: null });
        try {
          const categories = await settingsApi.getCostCategories();
          set({ costCategories: categories, isLoading: false, costCategoriesLoaded: true });
        } catch (error) {
          console.error('Error fetching cost categories:', error);
          set({ error: 'Failed to fetch cost categories', isLoading: false });
        }
      },

      createCostCategoryApi: async (category: Omit<CostCategory, 'id'>) => {
        set({ isLoading: true, error: null });
        try {
          const newCategory = await settingsApi.createCostCategory(category);
          set((state) => ({ 
            costCategories: [...state.costCategories, newCategory],
            isLoading: false 
          }));
          return newCategory;
        } catch (error) {
          set({ error: 'Failed to create cost category', isLoading: false });
          throw error;
        }
      },

      updateCostCategoryApi: async (id: string, category: Partial<CostCategory>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedCategory = await settingsApi.updateCostCategory(id, category);
          set((state) => ({
            costCategories: state.costCategories.map(c => 
              c.id === id ? updatedCategory : c
            ),
            isLoading: false
          }));
          return updatedCategory;
        } catch (error) {
          set({ error: 'Failed to update cost category', isLoading: false });
          throw error;
        }
      },

      deleteCostCategoryApi: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await settingsApi.deleteCostCategory(id);
          set((state) => ({
            costCategories: state.costCategories.filter(c => c.id !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to delete cost category', isLoading: false });
          throw error;
        }
      },

      resetCostCategoriesLoaded: () => set({ costCategoriesLoaded: false }),

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
        wbsTemplatesLoaded: false, // Reset the new flag
        costCategories: [],
        selectedCostCategory: null,
        costCategoriesLoaded: false, // Reset the new flag
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
      
      // Reset WBS templates loaded flag to force refresh
      resetWbsTemplatesLoaded: () => set({ wbsTemplatesLoaded: false }),
    }),
    {
      name: 'settings-store',
    }
  )
); 