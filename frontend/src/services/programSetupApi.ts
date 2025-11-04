import axios from 'axios';

export interface SetupStatus {
  programId: string;
  boeCreated: boolean;
  boeApproved: boolean;
  boeBaselined: boolean;
  riskOpportunityRegisterCreated: boolean;
  setupComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export const programSetupApi = {
  /**
   * Get setup status for a program
   */
  getSetupStatus: async (programId: string): Promise<SetupStatus> => {
    const response = await axios.get(`/api/programs/${programId}/setup-status`);
    return response.data as SetupStatus;
  },

  /**
   * Update setup status for a program
   */
  updateSetupStatus: async (
    programId: string,
    updates: {
      boeCreated?: boolean;
      boeApproved?: boolean;
      boeBaselined?: boolean;
      riskOpportunityRegisterCreated?: boolean;
    }
  ): Promise<SetupStatus> => {
    const response = await axios.put(`/api/programs/${programId}/setup-status`, updates);
    return response.data as SetupStatus;
  },
};

