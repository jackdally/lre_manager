import axios from 'axios';
import { WBSTemplate, CostCategory, Vendor, Currency, ExchangeRate, FiscalYear } from '../store/settingsStore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export const settingsApi = {
  // WBS Templates
  getWbsTemplates: async (): Promise<WBSTemplate[]> => {
    const response = await axios.get(`${API_BASE_URL}/settings/wbs-templates`);
    return response.data as WBSTemplate[];
  },

  createWbsTemplate: async (template: Omit<WBSTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<WBSTemplate> => {
    const response = await axios.post(`${API_BASE_URL}/settings/wbs-templates`, template);
    return response.data as WBSTemplate;
  },

  updateWbsTemplate: async (id: string, template: Partial<WBSTemplate>): Promise<WBSTemplate> => {
    const response = await axios.put(`${API_BASE_URL}/settings/wbs-templates/${id}`, template);
    return response.data as WBSTemplate;
  },

  deleteWbsTemplate: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/settings/wbs-templates/${id}`);
  },

  setDefaultWbsTemplate: async (id: string): Promise<void> => {
    await axios.patch(`${API_BASE_URL}/settings/wbs-templates/${id}/set-default`);
  },

  // Cost Categories
  getCostCategories: async (): Promise<CostCategory[]> => {
    const response = await axios.get(`${API_BASE_URL}/cost-categories`);
    return response.data as CostCategory[];
  },

  getActiveCostCategories: async (): Promise<CostCategory[]> => {
    const response = await axios.get(`${API_BASE_URL}/cost-categories/active`);
    return response.data as CostCategory[];
  },

  createCostCategory: async (category: Omit<CostCategory, 'id'>): Promise<CostCategory> => {
    const response = await axios.post(`${API_BASE_URL}/cost-categories`, category);
    return response.data as CostCategory;
  },

  updateCostCategory: async (id: string, category: Partial<CostCategory>): Promise<CostCategory> => {
    const response = await axios.put(`${API_BASE_URL}/cost-categories/${id}`, category);
    return response.data as CostCategory;
  },

  deleteCostCategory: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/cost-categories/${id}`);
  },

  // Vendors
  getVendors: async (): Promise<Vendor[]> => {
    const response = await axios.get(`${API_BASE_URL}/vendors`);
    return (response.data as { vendors: Vendor[] }).vendors;
  },

  getActiveVendors: async (): Promise<Vendor[]> => {
    const response = await axios.get(`${API_BASE_URL}/vendors/active`);
    return (response.data as { vendors: Vendor[] }).vendors;
  },

  getVendor: async (id: string): Promise<Vendor> => {
    const response = await axios.get(`${API_BASE_URL}/vendors/${id}`);
    return response.data as Vendor;
  },

  createVendor: async (vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vendor> => {
    const response = await axios.post(`${API_BASE_URL}/vendors`, vendor);
    return response.data as Vendor;
  },

  updateVendor: async (id: string, vendor: Partial<Vendor>): Promise<Vendor> => {
    const response = await axios.put(`${API_BASE_URL}/vendors/${id}`, vendor);
    return response.data as Vendor;
  },

  deleteVendor: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/vendors/${id}`);
  },

  uploadVendors: async (file: File): Promise<{ message: string; count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE_URL}/vendors/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as { message: string; count: number };
  },

  importFromNetSuite: async (): Promise<{ message: string; count: number }> => {
    const response = await axios.post(`${API_BASE_URL}/vendors/import-netsuite`);
    return response.data as { message: string; count: number };
  },

  downloadVendorTemplate: async (): Promise<Blob> => {
    const response = await axios.get(`${API_BASE_URL}/vendors/template/download`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  // Currencies
  getCurrencies: async (): Promise<Currency[]> => {
    const response = await axios.get(`${API_BASE_URL}/currencies`);
    return (response.data as { currencies: Currency[] }).currencies;
  },

  getActiveCurrencies: async (): Promise<Currency[]> => {
    const response = await axios.get(`${API_BASE_URL}/currencies/active`);
    return (response.data as { currencies: Currency[] }).currencies;
  },

  getDefaultCurrency: async (): Promise<Currency> => {
    const response = await axios.get(`${API_BASE_URL}/currencies/default`);
    return (response.data as { currency: Currency }).currency;
  },

  getCurrency: async (id: string): Promise<Currency> => {
    const response = await axios.get(`${API_BASE_URL}/currencies/${id}`);
    return (response.data as { currency: Currency }).currency;
  },

  createCurrency: async (currency: Omit<Currency, 'id' | 'createdAt' | 'updatedAt'>): Promise<Currency> => {
    const response = await axios.post(`${API_BASE_URL}/currencies`, currency);
    return (response.data as { currency: Currency }).currency;
  },

  updateCurrency: async (id: string, currency: Partial<Currency>): Promise<Currency> => {
    const response = await axios.put(`${API_BASE_URL}/currencies/${id}`, currency);
    return (response.data as { currency: Currency }).currency;
  },

  deleteCurrency: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/currencies/${id}`);
  },

  // Exchange Rates
  getExchangeRates: async (currencyId: string, date?: string): Promise<ExchangeRate[]> => {
    const params = date ? { date } : {};
    const response = await axios.get(`${API_BASE_URL}/currencies/${currencyId}/exchange-rates`, { params });
    return (response.data as { exchangeRates: ExchangeRate[] }).exchangeRates;
  },

  createExchangeRate: async (currencyId: string, exchangeRate: Omit<ExchangeRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExchangeRate> => {
    const response = await axios.post(`${API_BASE_URL}/currencies/${currencyId}/exchange-rates`, exchangeRate);
    return (response.data as { exchangeRate: ExchangeRate }).exchangeRate;
  },

  updateExchangeRates: async (baseCurrency?: string): Promise<{ updated: number; created: number; errors: number; errorsList: string[] }> => {
    const response = await axios.post(`${API_BASE_URL}/currencies/update-rates`, { baseCurrency });
    return response.data as { updated: number; created: number; errors: number; errorsList: string[] };
  },

  // Fiscal Years
  getFiscalYears: async (): Promise<FiscalYear[]> => {
    const response = await axios.get(`${API_BASE_URL}/fiscal-years`);
    return (response.data as { fiscalYears: FiscalYear[] }).fiscalYears;
  },

  getActiveFiscalYears: async (): Promise<FiscalYear[]> => {
    const response = await axios.get(`${API_BASE_URL}/fiscal-years/active`);
    return (response.data as { fiscalYears: FiscalYear[] }).fiscalYears;
  },

  getFiscalYear: async (id: string): Promise<FiscalYear> => {
    const response = await axios.get(`${API_BASE_URL}/fiscal-years/${id}`);
    return (response.data as { fiscalYear: FiscalYear }).fiscalYear;
  },

  createFiscalYear: async (fiscalYear: Omit<FiscalYear, 'id' | 'createdAt' | 'updatedAt'>): Promise<FiscalYear> => {
    const response = await axios.post(`${API_BASE_URL}/fiscal-years`, fiscalYear);
    return (response.data as { fiscalYear: FiscalYear }).fiscalYear;
  },

  updateFiscalYear: async (id: string, fiscalYear: Partial<FiscalYear>): Promise<FiscalYear> => {
    const response = await axios.put(`${API_BASE_URL}/fiscal-years/${id}`, fiscalYear);
    return (response.data as { fiscalYear: FiscalYear }).fiscalYear;
  },

  deleteFiscalYear: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/fiscal-years/${id}`);
  },
}; 