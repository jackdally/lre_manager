import axios from 'axios';
import {
  BOETemplate,
  BOEVersion,
  BOEElement,
  BOEApproval,
  ManagementReserve,
  BOESummary,
} from '../store/boeStore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// API Client
const boeApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
boeApi.interceptors.request.use(
  (config) => {
    console.log(`BOE API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('BOE API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
boeApi.interceptors.response.use(
  (response) => {
    console.log(`BOE API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('BOE API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// BOE Templates API
export const boeTemplatesApi = {
  // Get all BOE templates
  getTemplates: async (): Promise<BOETemplate[]> => {
    const response = await boeApi.get('/boe-templates');
    return response.data as BOETemplate[];
  },

  // Create new BOE template
  createTemplate: async (template: any): Promise<BOETemplate> => {
    const response = await boeApi.post('/boe-templates', template);
    return response.data as BOETemplate;
  },

  // Get template by ID
  getTemplate: async (id: string): Promise<BOETemplate> => {
    const response = await boeApi.get(`/boe-templates/${id}`);
    return response.data as BOETemplate;
  },

  // Update template
  updateTemplate: async (id: string, template: any): Promise<BOETemplate> => {
    const response = await boeApi.put(`/boe-templates/${id}`, template);
    return response.data as BOETemplate;
  },

  // Delete template
  deleteTemplate: async (id: string): Promise<void> => {
    await boeApi.delete(`/boe-templates/${id}`);
  },
};

// BOE Versions API
export const boeVersionsApi = {
  // Get current BOE for program
  getCurrentBOE: async (programId: string): Promise<BOESummary> => {
    const response = await boeApi.get(`/programs/${programId}/boe`);
    return response.data as BOESummary;
  },

  // Create new BOE version
  createBOE: async (programId: string, boeData: any): Promise<BOEVersion> => {
    const response = await boeApi.post(`/programs/${programId}/boe`, boeData);
    return response.data as BOEVersion;
  },

  // Update BOE version
  updateBOE: async (programId: string, versionId: string, boeData: any): Promise<BOEVersion> => {
    const response = await boeApi.put(`/programs/${programId}/boe/${versionId}`, boeData);
    return response.data as BOEVersion;
  },

  // Submit BOE for approval
  submitForApproval: async (programId: string): Promise<BOEVersion> => {
    const response = await boeApi.post(`/programs/${programId}/boe/approve`);
    return response.data as BOEVersion;
  },

  // Approve BOE version
  approveBOE: async (programId: string, versionId: string, approvalData: any): Promise<BOEVersion> => {
    const response = await boeApi.post(`/programs/${programId}/boe/approve/${versionId}`, approvalData);
    return response.data as BOEVersion;
  },

  // Get BOE version by ID
  getBOEVersion: async (versionId: string): Promise<BOEVersion> => {
    const response = await boeApi.get(`/boe-versions/${versionId}`);
    return response.data as BOEVersion;
  },

  // Delete BOE version
  deleteBOE: async (programId: string, versionId: string): Promise<void> => {
    await boeApi.delete(`/programs/${programId}/boe/${versionId}`);
  },
};

// BOE Elements API
export const boeElementsApi = {
  // Create BOE element
  createElement: async (elementData: any): Promise<BOEElement> => {
    const response = await boeApi.post('/boe-elements', elementData);
    return response.data as BOEElement;
  },

  // Update BOE element
  updateElement: async (elementId: string, elementData: any): Promise<BOEElement> => {
    const response = await boeApi.put(`/boe-elements/${elementId}`, elementData);
    return response.data as BOEElement;
  },

  // Delete BOE element
  deleteElement: async (elementId: string): Promise<void> => {
    await boeApi.delete(`/boe-elements/${elementId}`);
  },

  // Get elements for BOE version
  getElements: async (boeVersionId: string): Promise<BOEElement[]> => {
    const response = await boeApi.get(`/boe-versions/${boeVersionId}/elements`);
    return response.data as BOEElement[];
  },

  // Bulk update elements
  bulkUpdateElements: async (boeVersionId: string, elements: any[]): Promise<BOEElement[]> => {
    const response = await boeApi.put(`/boe-versions/${boeVersionId}/elements/bulk`, { elements });
    return response.data as BOEElement[];
  },
};

// Management Reserve API
export const managementReserveApi = {
  // Get management reserve for BOE version
  getManagementReserve: async (boeVersionId: string): Promise<ManagementReserve> => {
    const response = await boeApi.get(`/boe-versions/${boeVersionId}/management-reserve`);
    return response.data as ManagementReserve;
  },

  // Update management reserve
  updateManagementReserve: async (boeVersionId: string, mrData: any): Promise<ManagementReserve> => {
    const response = await boeApi.put(`/boe-versions/${boeVersionId}/management-reserve`, mrData);
    return response.data as ManagementReserve;
  },

  // Calculate management reserve
  calculateManagementReserve: async (boeVersionId: string, method: string, customPercentage?: number): Promise<ManagementReserve> => {
    const response = await boeApi.post(`/boe-versions/${boeVersionId}/management-reserve/calculate`, {
      method,
      customPercentage,
    });
    return response.data as ManagementReserve;
  },
};

// BOE Approvals API
export const boeApprovalsApi = {
  // Get approvals for BOE version
  getApprovals: async (boeVersionId: string): Promise<BOEApproval[]> => {
    const response = await boeApi.get(`/boe-versions/${boeVersionId}/approvals`);
    return response.data as BOEApproval[];
  },

  // Create approval
  createApproval: async (boeVersionId: string, approvalData: any): Promise<BOEApproval> => {
    const response = await boeApi.post(`/boe-versions/${boeVersionId}/approvals`, approvalData);
    return response.data as BOEApproval;
  },

  // Update approval status
  updateApproval: async (approvalId: string, approvalData: any): Promise<BOEApproval> => {
    const response = await boeApi.put(`/boe-approvals/${approvalId}`, approvalData);
    return response.data as BOEApproval;
  },
};

// BOE Calculations API
export const boeCalculationsApi = {
  // Calculate BOE totals
  calculateTotals: async (boeVersionId: string): Promise<any> => {
    const response = await boeApi.post(`/boe-versions/${boeVersionId}/calculate`);
    return response.data;
  },

  // Validate BOE structure
  validateStructure: async (boeVersionId: string): Promise<any> => {
    const response = await boeApi.post(`/boe-versions/${boeVersionId}/validate`);
    return response.data;
  },
};

// Export all APIs
export const boeApiService = {
  templates: boeTemplatesApi,
  versions: boeVersionsApi,
  elements: boeElementsApi,
  managementReserve: managementReserveApi,
  approvals: boeApprovalsApi,
  calculations: boeCalculationsApi,
};

export default boeApiService; 