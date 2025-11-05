import axios from 'axios';
import type { Risk, Opportunity, RiskCategory, RiskOpportunityFilters } from '../store/riskOpportunityStore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export const riskOpportunityApi = {
  // Register initialization
  initializeRegister: async (programId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post<{ success: boolean; message: string }>(`${API_BASE_URL}/programs/${programId}/risk-opportunity/initialize`);
    return response.data;
  },

  getRegisterStatus: async (programId: string): Promise<{ initialized: boolean }> => {
    const response = await axios.get<{ initialized: boolean }>(`${API_BASE_URL}/programs/${programId}/risk-opportunity/status`);
    return response.data;
  },

  // Risk Categories
  getRiskCategories: async (): Promise<RiskCategory[]> => {
    const response = await axios.get<RiskCategory[]>(`${API_BASE_URL}/risk-categories`);
    return response.data;
  },

  getAllRiskCategories: async (): Promise<RiskCategory[]> => {
    const response = await axios.get<RiskCategory[]>(`${API_BASE_URL}/risk-categories/all`);
    return response.data;
  },

  createRiskCategory: async (categoryData: {
    code: string;
    name: string;
    description?: string;
    isActive?: boolean;
  }): Promise<RiskCategory> => {
    const response = await axios.post<RiskCategory>(`${API_BASE_URL}/risk-categories`, categoryData);
    return response.data;
  },

  updateRiskCategory: async (id: string, category: Partial<RiskCategory>): Promise<RiskCategory> => {
    const response = await axios.put<RiskCategory>(`${API_BASE_URL}/risk-categories/${id}`, category);
    return response.data;
  },

  deleteRiskCategory: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/risk-categories/${id}`);
  },

  // Risk CRUD
  getRisks: async (programId: string, filters?: RiskOpportunityFilters): Promise<Risk[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.disposition) params.append('disposition', filters.disposition);
    if (filters?.owner) params.append('owner', filters.owner);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/programs/${programId}/risks${queryString ? `?${queryString}` : ''}`;
    const response = await axios.get<Risk[]>(url);
    return response.data;
  },

  getRisk: async (riskId: string): Promise<Risk> => {
    const response = await axios.get<Risk>(`${API_BASE_URL}/risks/${riskId}`);
    return response.data;
  },

  createRisk: async (programId: string, riskData: Partial<Risk>): Promise<Risk> => {
    const response = await axios.post<Risk>(`${API_BASE_URL}/programs/${programId}/risks`, riskData);
    return response.data;
  },

  updateRisk: async (riskId: string, updates: Partial<Risk>): Promise<Risk> => {
    const response = await axios.put<Risk>(`${API_BASE_URL}/risks/${riskId}`, updates);
    return response.data;
  },

  deleteRisk: async (riskId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/risks/${riskId}`);
  },

  updateRiskDisposition: async (
    riskId: string,
    disposition: string,
    reason: string,
    dispositionDate?: Date
  ): Promise<Risk> => {
    const response = await axios.post<Risk>(`${API_BASE_URL}/risks/${riskId}/disposition`, {
      disposition,
      reason,
      dispositionDate,
    });
    return response.data;
  },

  addRiskNote: async (riskId: string, note: string, createdBy?: string): Promise<void> => {
    await axios.post(`${API_BASE_URL}/risks/${riskId}/notes`, { note, createdBy });
  },

  getRiskNotes: async (riskId: string): Promise<any[]> => {
    const response = await axios.get<any[]>(`${API_BASE_URL}/risks/${riskId}/notes`);
    return response.data;
  },

  getRiskMatrix: async (programId: string): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/programs/${programId}/risks/matrix`);
    return response.data;
  },

  // Opportunity CRUD
  getOpportunities: async (programId: string, filters?: RiskOpportunityFilters): Promise<Opportunity[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.severity) params.append('benefitSeverity', filters.severity); // Map severity to benefitSeverity for opportunities
    if (filters?.disposition) params.append('disposition', filters.disposition);
    if (filters?.owner) params.append('owner', filters.owner);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/programs/${programId}/opportunities${queryString ? `?${queryString}` : ''}`;
    const response = await axios.get<Opportunity[]>(url);
    return response.data;
  },

  getOpportunity: async (opportunityId: string): Promise<Opportunity> => {
    const response = await axios.get<Opportunity>(`${API_BASE_URL}/opportunities/${opportunityId}`);
    return response.data;
  },

  createOpportunity: async (programId: string, opportunityData: Partial<Opportunity>): Promise<Opportunity> => {
    const response = await axios.post<Opportunity>(`${API_BASE_URL}/programs/${programId}/opportunities`, opportunityData);
    return response.data;
  },

  updateOpportunity: async (opportunityId: string, updates: Partial<Opportunity>): Promise<Opportunity> => {
    const response = await axios.put<Opportunity>(`${API_BASE_URL}/opportunities/${opportunityId}`, updates);
    return response.data;
  },

  deleteOpportunity: async (opportunityId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/opportunities/${opportunityId}`);
  },

  updateOpportunityDisposition: async (
    opportunityId: string,
    disposition: string,
    reason: string,
    dispositionDate?: Date
  ): Promise<Opportunity> => {
    const response = await axios.post<Opportunity>(`${API_BASE_URL}/opportunities/${opportunityId}/disposition`, {
      disposition,
      reason,
      dispositionDate,
    });
    return response.data;
  },

  addOpportunityNote: async (opportunityId: string, note: string, createdBy?: string): Promise<void> => {
    await axios.post(`${API_BASE_URL}/opportunities/${opportunityId}/notes`, { note, createdBy });
  },

  getOpportunityNotes: async (opportunityId: string): Promise<any[]> => {
    const response = await axios.get<any[]>(`${API_BASE_URL}/opportunities/${opportunityId}/notes`);
    return response.data;
  },

  getOpportunityMatrix: async (programId: string): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/programs/${programId}/opportunities/matrix`);
    return response.data;
  },

  // MR Utilization
  utilizeMRForRisk: async (
    riskId: string,
    amount: number,
    reason: string
  ): Promise<{ risk: Risk; managementReserve: any }> => {
    const response = await axios.post(`${API_BASE_URL}/risks/${riskId}/utilize-mr`, {
      amount,
      reason,
    });
    return response.data as { risk: Risk; managementReserve: any };
  },
};
