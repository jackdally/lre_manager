import axios from 'axios';
import {
  BOETemplate,
  BOEVersion,
  BOEElement,
  BOEApproval,
  ManagementReserve,
  BOESummary,
  TimeAllocation,
  TimeAllocationSummary,
} from '../store/boeStore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// API Client
const boeApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for error handling
boeApi.interceptors.request.use(
  (config) => {
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
  approveBOE: async (programId: string, versionId: string): Promise<BOEVersion> => {
    const response = await boeApi.post(`/programs/${programId}/boe/approve/${versionId}`);
    return response.data as BOEVersion;
  },

  // Push BOE to ledger
  pushToLedger: async (programId: string, versionId: string): Promise<any> => {
    const response = await boeApi.post(`/programs/${programId}/boe/${versionId}/push-to-ledger`);
    return response.data;
  },
};

// BOE Elements API
export const boeElementsApi = {
  // Get elements for BOE version
  getElements: async (boeVersionId: string): Promise<BOEElement[]> => {
    const response = await boeApi.get(`/boe-versions/${boeVersionId}/elements`);
    return response.data as BOEElement[];
  },

  // Create new element
  createElement: async (boeVersionId: string, elementData: any): Promise<BOEElement> => {
    const response = await boeApi.post(`/boe-versions/${boeVersionId}/elements`, elementData);
    return response.data as BOEElement;
  },

  // Update element
  updateElement: async (elementId: string, elementData: any): Promise<BOEElement> => {
    const response = await boeApi.put(`/boe-elements/${elementId}`, elementData);
    return response.data as BOEElement;
  },

  // Delete element
  deleteElement: async (elementId: string): Promise<void> => {
    await boeApi.delete(`/boe-elements/${elementId}`);
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

// Time Allocation API
export const timeAllocationApi = {
  // Get time allocation summary for program
  getTimeAllocationSummary: async (programId: string): Promise<TimeAllocationSummary> => {
    const response = await boeApi.get(`/programs/${programId}/time-allocations`);
    return response.data as TimeAllocationSummary;
  },

  // Create new time allocation
  createTimeAllocation: async (programId: string, allocationData: any): Promise<TimeAllocation> => {
    const response = await boeApi.post(`/programs/${programId}/time-allocations`, allocationData);
    return response.data as TimeAllocation;
  },

  // Get time allocation by ID
  getTimeAllocation: async (allocationId: string): Promise<TimeAllocation> => {
    const response = await boeApi.get(`/time-allocations/${allocationId}`);
    return response.data as TimeAllocation;
  },

  // Update time allocation
  updateTimeAllocation: async (allocationId: string, allocationData: any): Promise<TimeAllocation> => {
    const response = await boeApi.put(`/time-allocations/${allocationId}`, allocationData);
    return response.data as TimeAllocation;
  },

  // Delete time allocation
  deleteTimeAllocation: async (allocationId: string): Promise<void> => {
    await boeApi.delete(`/time-allocations/${allocationId}`);
  },

  // Push time allocation to ledger
  pushToLedger: async (allocationId: string): Promise<any> => {
    const response = await boeApi.post(`/time-allocations/${allocationId}/push-to-ledger`);
    return response.data;
  },

  // Update actuals from ledger
  updateActuals: async (allocationId: string): Promise<any> => {
    const response = await boeApi.post(`/time-allocations/${allocationId}/update-actuals`);
    return response.data;
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

// WBS Template Integration API
export const wbsTemplateIntegrationApi = {
  // Get available WBS templates for import
  getAvailableTemplates: async (): Promise<any[]> => {
    const response = await boeApi.get('/boe/wbs-templates');
    return response.data as any[];
  },

  // Clear all elements from BOE
  clearElements: async (programId: string, boeVersionId: string): Promise<any> => {
    const response = await boeApi.post(`/programs/${programId}/boe/${boeVersionId}/clear-elements`);
    return response.data;
  },

  // Import WBS template into BOE
  importTemplate: async (programId: string, boeVersionId: string, wbsTemplateId: string): Promise<any> => {
    const response = await boeApi.post(`/programs/${programId}/boe/${boeVersionId}/import-wbs-template`, {
      wbsTemplateId
    });
    return response.data;
  },

  // Push BOE WBS to program WBS
  pushToProgramWBS: async (programId: string, boeVersionId: string): Promise<any> => {
    const response = await boeApi.post(`/programs/${programId}/boe/${boeVersionId}/push-to-program-wbs`);
    return response.data;
  },
};

// Export all APIs
export const boeApiService = {
  templates: boeTemplatesApi,
  versions: boeVersionsApi,
  elements: boeElementsApi,
  managementReserve: managementReserveApi,
  timeAllocation: timeAllocationApi,
  approvals: boeApprovalsApi,
  calculations: boeCalculationsApi,
  wbsTemplateIntegration: wbsTemplateIntegrationApi,
};

export default boeApiService; 