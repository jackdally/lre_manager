import axios from 'axios';

export const riskOpportunityApi = {
  initializeRegister: async (programId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post<{ success: boolean; message: string }>(`/api/programs/${programId}/risk-opportunity/initialize`);
    return response.data;
  },

  getRegisterStatus: async (programId: string): Promise<{ initialized: boolean }> => {
    const response = await axios.get<{ initialized: boolean }>(`/api/programs/${programId}/risk-opportunity/status`);
    return response.data;
  },
};

