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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isDefault: boolean;
  isActive: boolean;
  decimalPlaces: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRate {
  id: string;
  baseCurrencyId: string;
  targetCurrencyId: string;
  rate: number;
  effectiveDate: string;
  expiresAt?: string;
  isManual: boolean;
  source?: string;
  createdAt: string;
  updatedAt: string;
  baseCurrency?: Currency;
  targetCurrency?: Currency;
}

export interface FiscalYear {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isDefault: boolean;
  type: 'calendar' | 'fiscal' | 'custom';
  numberOfPeriods: number;
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'custom';
  createdAt: string;
  updatedAt: string;
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
  vendorsLoaded: boolean; // Add flag to track if vendors have been loaded
  
  // Currencies
  currencies: Currency[];
  defaultCurrency: Currency | null;
  currenciesLoaded: boolean; // Add flag to track if currencies have been loaded
  
  // Fiscal Years
  fiscalYears: FiscalYear[];
  activeFiscalYear: FiscalYear | null;
  fiscalYearsLoaded: boolean; // Add flag to track if fiscal years have been loaded
  
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
  
  // Vendor API actions
  fetchVendors: () => Promise<void>;
  createVendorApi: (vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Vendor>;
  updateVendorApi: (id: string, vendor: Partial<Vendor>) => Promise<Vendor>;
  deleteVendorApi: (id: string) => Promise<void>;
  uploadVendorsApi: (file: File) => Promise<{ message: string; count: number; total?: number; skipped?: number; errors?: number; errorsList?: string[] }>;
  importFromNetSuiteApi: () => Promise<{ message: string; count: number }>;
  downloadVendorTemplateApi: () => Promise<Blob>;
  
  // Currencies
  setCurrencies: (currencies: Currency[]) => void;
  setDefaultCurrency: (currency: Currency) => void;
  
  // Currency API actions
  fetchCurrencies: () => Promise<void>;
  createCurrencyApi: (currency: Omit<Currency, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Currency>;
  updateCurrencyApi: (id: string, currency: Partial<Currency>) => Promise<Currency>;
  deleteCurrencyApi: (id: string) => Promise<void>;
  updateExchangeRatesApi: (baseCurrency?: string) => Promise<{ updated: number; created: number; errors: number; errorsList: string[] }>;
  
  // Fiscal Years
  setFiscalYears: (fiscalYears: FiscalYear[]) => void;
  setActiveFiscalYear: (fiscalYear: FiscalYear) => void;
  
  // Fiscal Year API actions
  fetchFiscalYears: () => Promise<void>;
  createFiscalYearApi: (fiscalYear: Omit<FiscalYear, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FiscalYear>;
  updateFiscalYearApi: (id: string, fiscalYear: Partial<FiscalYear>) => Promise<FiscalYear>;
  deleteFiscalYearApi: (id: string) => Promise<void>;
  
  // User Preferences
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  
  // General
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  resetWbsTemplatesLoaded: () => void;
  resetCurrenciesLoaded: () => void;
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
  { 
    id: '1', 
    code: 'USD', 
    name: 'US Dollar', 
    symbol: '$', 
    isDefault: true, 
    isActive: true, 
    decimalPlaces: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: '2', 
    code: 'EUR', 
    name: 'Euro', 
    symbol: '€', 
    isDefault: false, 
    isActive: true, 
    decimalPlaces: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: '3', 
    code: 'GBP', 
    name: 'British Pound', 
    symbol: '£', 
    isDefault: false, 
    isActive: true, 
    decimalPlaces: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
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
      vendorsLoaded: false, // Initialize the new flag
      currencies: [],
      defaultCurrency: null,
      currenciesLoaded: false, // Initialize the new flag
      fiscalYears: [],
      activeFiscalYear: null,
      fiscalYearsLoaded: false, // Initialize the new flag
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

      // Vendor API actions
      fetchVendors: async () => {
        const state = get();
        if (state.isLoading || state.vendorsLoaded) return; // Prevent multiple simultaneous requests or unnecessary calls
        
        set({ isLoading: true, error: null });
        try {
          const vendors = await settingsApi.getVendors();
          set({ vendors, isLoading: false, vendorsLoaded: true });
        } catch (error) {
          console.error('Error fetching vendors:', error);
          set({ error: 'Failed to fetch vendors', isLoading: false });
        }
      },

      createVendorApi: async (vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => {
        set({ isLoading: true, error: null });
        try {
          const newVendor = await settingsApi.createVendor(vendor);
          set((state) => ({ 
            vendors: [...state.vendors, newVendor],
            isLoading: false 
          }));
          return newVendor;
        } catch (error) {
          set({ error: 'Failed to create vendor', isLoading: false });
          throw error;
        }
      },

      updateVendorApi: async (id: string, vendor: Partial<Vendor>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedVendor = await settingsApi.updateVendor(id, vendor);
          set((state) => ({
            vendors: state.vendors.map(v => 
              v.id === id ? updatedVendor : v
            ),
            isLoading: false
          }));
          return updatedVendor;
        } catch (error) {
          set({ error: 'Failed to update vendor', isLoading: false });
          throw error;
        }
      },

      deleteVendorApi: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await settingsApi.deleteVendor(id);
          set((state) => ({
            vendors: state.vendors.filter(v => v.id !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to delete vendor', isLoading: false });
          throw error;
        }
      },

      uploadVendorsApi: async (file: File) => {
        set({ isLoading: true, error: null });
        try {
          const result = await settingsApi.uploadVendors(file);
          set({ isLoading: false });
          return result;
        } catch (error) {
          set({ error: 'Failed to upload vendors', isLoading: false });
          throw error;
        }
      },

      importFromNetSuiteApi: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = await settingsApi.importFromNetSuite();
          set({ isLoading: false });
          return result;
        } catch (error) {
          set({ error: 'Failed to import vendors from NetSuite', isLoading: false });
          throw error;
        }
      },

      downloadVendorTemplateApi: async () => {
        set({ isLoading: true, error: null });
        try {
          const blob = await settingsApi.downloadVendorTemplate();
          set({ isLoading: false });
          return blob;
        } catch (error) {
          set({ error: 'Failed to download vendor template', isLoading: false });
          throw error;
        }
      },

      // Currency actions
      setCurrencies: (currencies) => set({ currencies }),
      setDefaultCurrency: (currency) => set((state) => ({
        currencies: state.currencies.map(c => ({ ...c, isDefault: c.code === currency.code })),
        defaultCurrency: currency
      })),

      // Currency API actions
      fetchCurrencies: async () => {
        const state = get();
        if (state.isLoading || state.currenciesLoaded) return; // Prevent multiple simultaneous requests or unnecessary calls
        
        set({ isLoading: true, error: null });
        try {
          const currencies = await settingsApi.getCurrencies();
          set({ currencies, isLoading: false, currenciesLoaded: true });
        } catch (error) {
          console.error('Error fetching currencies:', error);
          set({ error: 'Failed to fetch currencies', isLoading: false });
        }
      },

      createCurrencyApi: async (currency: Omit<Currency, 'id' | 'createdAt' | 'updatedAt'>) => {
        set({ isLoading: true, error: null });
        try {
          const newCurrency = await settingsApi.createCurrency(currency);
          set((state) => ({ 
            currencies: [...state.currencies, newCurrency],
            isLoading: false 
          }));
          return newCurrency;
        } catch (error) {
          set({ error: 'Failed to create currency', isLoading: false });
          throw error;
        }
      },

      updateCurrencyApi: async (id: string, currency: Partial<Currency>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedCurrency = await settingsApi.updateCurrency(id, currency);
          set((state) => ({
            currencies: state.currencies.map(c => 
              c.id === id ? updatedCurrency : c
            ),
            isLoading: false
          }));
          return updatedCurrency;
        } catch (error) {
          set({ error: 'Failed to update currency', isLoading: false });
          throw error;
        }
      },

      deleteCurrencyApi: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await settingsApi.deleteCurrency(id);
          set((state) => ({
            currencies: state.currencies.filter(c => c.id !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to delete currency', isLoading: false });
          throw error;
        }
      },

      updateExchangeRatesApi: async (baseCurrency?: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await settingsApi.updateExchangeRates(baseCurrency);
          set({ isLoading: false });
          return result;
        } catch (error) {
          set({ error: 'Failed to update exchange rates', isLoading: false });
          throw error;
        }
      },

      // Fiscal Year actions
      setFiscalYears: (fiscalYears) => set({ fiscalYears }),
      setActiveFiscalYear: (fiscalYear) => set({ activeFiscalYear: fiscalYear }),

      // Fiscal Year API actions
      fetchFiscalYears: async () => {
        const state = get();
        if (state.isLoading || state.fiscalYearsLoaded) return; // Prevent multiple simultaneous requests or unnecessary calls
        
        set({ isLoading: true, error: null });
        try {
          const fiscalYears = await settingsApi.getFiscalYears();
          set({ fiscalYears, isLoading: false, fiscalYearsLoaded: true });
        } catch (error) {
          console.error('Error fetching fiscal years:', error);
          set({ error: 'Failed to fetch fiscal years', isLoading: false });
        }
      },

      createFiscalYearApi: async (fiscalYear: Omit<FiscalYear, 'id' | 'createdAt' | 'updatedAt'>) => {
        set({ isLoading: true, error: null });
        try {
          const newFiscalYear = await settingsApi.createFiscalYear(fiscalYear);
          set((state) => ({ 
            fiscalYears: [...state.fiscalYears, newFiscalYear],
            isLoading: false 
          }));
          return newFiscalYear;
        } catch (error) {
          set({ error: 'Failed to create fiscal year', isLoading: false });
          throw error;
        }
      },

      updateFiscalYearApi: async (id: string, fiscalYear: Partial<FiscalYear>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedFiscalYear = await settingsApi.updateFiscalYear(id, fiscalYear);
          set((state) => ({
            fiscalYears: state.fiscalYears.map(fy => 
              fy.id === id ? updatedFiscalYear : fy
            ),
            isLoading: false
          }));
          return updatedFiscalYear;
        } catch (error) {
          set({ error: 'Failed to update fiscal year', isLoading: false });
          throw error;
        }
      },

      deleteFiscalYearApi: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await settingsApi.deleteFiscalYear(id);
          set((state) => ({
            fiscalYears: state.fiscalYears.filter(fy => fy.id !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to delete fiscal year', isLoading: false });
          throw error;
        }
      },

      // User Preferences
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
        vendorsLoaded: false, // Reset the new flag
        currencies: [],
        defaultCurrency: null,
        currenciesLoaded: false, // Reset the new flag
        fiscalYears: [],
        activeFiscalYear: null,
        fiscalYearsLoaded: false, // Reset the new flag
        userPreferences: defaultUserPreferences,
        isLoading: false,
        error: null,
      }),
      
      // Reset WBS templates loaded flag to force refresh
      resetWbsTemplatesLoaded: () => set({ wbsTemplatesLoaded: false }),
      resetCurrenciesLoaded: () => set({ currenciesLoaded: false }),
    }),
    {
      name: 'settings-store',
    }
  )
); 