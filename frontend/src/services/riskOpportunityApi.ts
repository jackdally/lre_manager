import axios from 'axios';

export interface Risk {
  id: string;
  title: string;
  description?: string | null;
  costImpactMin: number;
  costImpactMostLikely: number;
  costImpactMax: number;
  probability: number; // 0-100
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const riskOpportunityApi = {
  initializeRegister: async (programId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post<{ success: boolean; message: string }>(`/api/programs/${programId}/risk-opportunity/initialize`);
    return response.data;
  },

  getRegisterStatus: async (programId: string): Promise<{ initialized: boolean }> => {
    const response = await axios.get<{ initialized: boolean }>(`/api/programs/${programId}/risk-opportunity/status`);
    return response.data;
  },

  // Get risks for a program (for MR calculation)
  // Note: This will be implemented when full R&O system is built
  // For now, we'll need to add this endpoint to the backend
  getRisks: async (programId: string): Promise<Risk[]> => {
    try {
      // TODO: Add GET /api/programs/:id/risks endpoint in backend
      // For now, return empty array - risks will be fetched via BOE calculation endpoint
      return [];
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Utilize MR for a risk
  utilizeMRForRisk: async (
    riskId: string,
    amount: number,
    reason: string
  ): Promise<{ risk: Risk; managementReserve: any }> => {
    const response = await axios.post(`/api/risks/${riskId}/utilize-mr`, {
      amount,
      reason,
    });
    return response.data;
  },
};

