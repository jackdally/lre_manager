import axios from 'axios';
import {
  BOETemplate,
  BOEVersion,
  BOEElement,
  BOEApproval,
  ManagementReserve,
  BOEElementAllocation,
  BOEElementAllocationSummary,
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
    // Don't log 404 errors for MR endpoints (these are expected when no MR exists)
    const isMR404Error = error.response?.status === 404 && 
      error.config?.url?.includes('/management-reserve');
    
    if (!isMR404Error) {
      console.error('BOE API Response Error:', error.response?.data || error.message);
    }
    
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
  getCurrentBOE: async (programId: string): Promise<any> => {
    const response = await boeApi.get(`/programs/${programId}/boe`);
    return response.data;
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

  // Delete BOE version (draft only)
  deleteBOE: async (programId: string, versionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await boeApi.delete(`/programs/${programId}/boe/${versionId}`);
    return response.data as { success: boolean; message: string };
  },

  // Approve BOE version
  approveBOE: async (programId: string, versionId: string, approvalData?: any): Promise<BOEVersion> => {
    const response = await boeApi.post(`/programs/${programId}/boe/approve/${versionId}`, approvalData);
    return response.data as BOEVersion;
  },

  // Push BOE to ledger
  pushToLedger: async (programId: string, versionId: string): Promise<any> => {
    const response = await boeApi.post(`/programs/${programId}/boe/${versionId}/push-to-ledger`);
    return response.data;
  },

  // Get all BOE versions for a program
  getAllVersions: async (programId: string): Promise<BOEVersion[]> => {
    const response = await boeApi.get(`/programs/${programId}/boe-versions`);
    return response.data as BOEVersion[];
  },

  // Get version history for a specific BOE version
  getVersionHistory: async (versionId: string): Promise<any> => {
    const response = await boeApi.get(`/boe-versions/${versionId}/history`);
    return response.data;
  },

  // Compare two BOE versions
  compareVersions: async (baseVersionId: string, compareVersionId: string): Promise<any> => {
    const response = await boeApi.get(`/boe-versions/${baseVersionId}/compare/${compareVersionId}`);
    return response.data;
  },

  // Rollback to a previous BOE version
  rollbackVersion: async (versionId: string, rollbackData: any): Promise<any> => {
    const response = await boeApi.post(`/boe-versions/${versionId}/rollback`, rollbackData);
    return response.data;
  },

  // Update comments for a BOE version
  updateComments: async (versionId: string, commentData: any): Promise<BOEVersion> => {
    const response = await boeApi.put(`/boe-versions/${versionId}/comments`, commentData);
    return response.data as BOEVersion;
  },

  // Create new BOE version from current BOE
  createVersion: async (programId: string, versionData: any): Promise<any> => {
    const response = await boeApi.post(`/programs/${programId}/boe/create-version`, versionData);
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
    try {
      const response = await boeApi.get(`/boe-versions/${boeVersionId}/management-reserve`);
      return response.data as ManagementReserve;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        // Return null instead of throwing for 404s
        return null as any;
      }
      throw error;
    }
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

  // Utilize management reserve
  utilizeManagementReserve: async (boeVersionId: string, amount: number, reason: string, description?: string): Promise<ManagementReserve> => {
    const response = await boeApi.post(`/boe-versions/${boeVersionId}/management-reserve/utilize`, {
      amount,
      reason,
      description,
    });
    return response.data as ManagementReserve;
  },

  // Get management reserve history
  getManagementReserveHistory: async (boeVersionId: string): Promise<any[]> => {
    try {
      const response = await boeApi.get(`/boe-versions/${boeVersionId}/management-reserve/history`);
      return response.data as any[];
    } catch (error: any) {
      if (error?.response?.status === 404) {
        // Return empty array instead of throwing for 404s
        return [];
      }
      throw error;
    }
  },

  // Get management reserve utilization
  getManagementReserveUtilization: async (boeVersionId: string): Promise<any> => {
    const response = await boeApi.get(`/boe-versions/${boeVersionId}/management-reserve/utilization`);
    return response.data as any;
  },

  // Calculate MR with breakdown information
  calculateMRWithBreakdown: async (boeVersionId: string, calculationData: {
    method: string;
    customPercentage?: number;
    projectComplexity?: string;
    riskFactors?: string[];
  }): Promise<{
    amount: number;
    percentage: number;
    breakdown: {
      basePercentage: number;
      complexityAdjustment: number;
      riskAdjustment: number;
      finalPercentage: number;
      roAdjustment?: number;
    };
  }> => {
    const response = await boeApi.post(`/boe-versions/${boeVersionId}/management-reserve/calculate-breakdown`, calculationData);
    return response.data as {
      amount: number;
      percentage: number;
      breakdown: {
        basePercentage: number;
        complexityAdjustment: number;
        riskAdjustment: number;
        finalPercentage: number;
        roAdjustment?: number;
      };
    };
  },

  // R&O Integration placeholder endpoints (for future use)
  getRiskMatrix: async (boeVersionId: string): Promise<any> => {
    const response = await boeApi.get(`/boe-versions/${boeVersionId}/management-reserve/risk-matrix`);
    return response.data;
  },

  calculateRODrivenMR: async (boeVersionId: string, riskMatrixData: any): Promise<ManagementReserve> => {
    const response = await boeApi.post(`/boe-versions/${boeVersionId}/management-reserve/calculate-ro-driven`, riskMatrixData);
    return response.data as ManagementReserve;
  },
};



// Element Allocation API
export const elementAllocationApi = {
  // Get element allocations for a BOE version
  getElementAllocations: async (boeVersionId: string): Promise<BOEElementAllocation[]> => {
    const response = await boeApi.get(`/boe-versions/${boeVersionId}/element-allocations`);
    return response.data as BOEElementAllocation[];
  },

  // Get element allocation summary for a BOE version
  getElementAllocationSummary: async (boeVersionId: string): Promise<BOEElementAllocationSummary> => {
    const response = await boeApi.get(`/boe-versions/${boeVersionId}/element-allocations/summary`);
    return response.data as BOEElementAllocationSummary;
  },

  // Create new element allocation
  createElementAllocation: async (boeElementId: string, allocationData: any): Promise<BOEElementAllocation> => {
    const response = await boeApi.post(`/boe-elements/${boeElementId}/allocations`, allocationData);
    return response.data as BOEElementAllocation;
  },

  // Get element allocation by ID
  getElementAllocation: async (allocationId: string): Promise<BOEElementAllocation> => {
    const response = await boeApi.get(`/element-allocations/${allocationId}`);
    return response.data as BOEElementAllocation;
  },

  // Update element allocation
  updateElementAllocation: async (allocationId: string, allocationData: any): Promise<BOEElementAllocation> => {
    const response = await boeApi.put(`/element-allocations/${allocationId}`, allocationData);
    return response.data as BOEElementAllocation;
  },

  // Delete element allocation
  deleteElementAllocation: async (allocationId: string): Promise<void> => {
    await boeApi.delete(`/element-allocations/${allocationId}`);
  },

  // Push element allocation to ledger
  pushToLedger: async (allocationId: string): Promise<any> => {
    const response = await boeApi.post(`/element-allocations/${allocationId}/push-to-ledger`);
    return response.data;
  },

  // Update actuals from ledger
  updateActuals: async (allocationId: string): Promise<any> => {
    const response = await boeApi.post(`/element-allocations/${allocationId}/update-actuals`);
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
  elementAllocations: elementAllocationApi,
  approvals: boeApprovalsApi,
  calculations: boeCalculationsApi,
  wbsTemplateIntegration: wbsTemplateIntegrationApi,
};

export default boeApiService; 