import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export const riskOpportunityApi = {
  initializeRegister: async (programId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post<{ success: boolean; message: string }>(`${API_BASE_URL}/programs/${programId}/risk-opportunity/initialize`);
    return response.data;
  },

  getRegisterStatus: async (programId: string): Promise<{ initialized: boolean }> => {
    const response = await axios.get<{ initialized: boolean }>(`${API_BASE_URL}/programs/${programId}/risk-opportunity/status`);
    return response.data;
  },
};

