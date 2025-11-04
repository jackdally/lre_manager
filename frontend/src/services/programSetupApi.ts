import axios from 'axios';

export interface SetupStatus {
  programId: string;
  boeCreated: boolean;
  boeApproved: boolean;
  boeBaselined: boolean;
  riskOpportunityRegisterCreated: boolean;
  initialMRSet: boolean;
  roAnalysisComplete: boolean | null;
  finalMRSet: boolean;
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
      initialMRSet?: boolean;
      roAnalysisComplete?: boolean | null;
      finalMRSet?: boolean;
    }
  ): Promise<SetupStatus> => {
    const response = await axios.put(`/api/programs/${programId}/setup-status`, updates);
    return response.data as SetupStatus;
  },

  /**
   * Mark Initial MR as set
   */
  markInitialMRSet: async (programId: string): Promise<SetupStatus> => {
    const response = await axios.post(`/api/programs/${programId}/setup-status/initial-mr`);
    return response.data as SetupStatus;
  },

  /**
   * Mark R&O Analysis as complete
   */
  markROAnalysisComplete: async (programId: string): Promise<SetupStatus> => {
    const response = await axios.post(`/api/programs/${programId}/setup-status/ro-analysis-complete`);
    return response.data as SetupStatus;
  },

  /**
   * Mark R&O Analysis as skipped
   */
  markROAnalysisSkipped: async (programId: string): Promise<SetupStatus> => {
    const response = await axios.post(`/api/programs/${programId}/setup-status/ro-analysis-skipped`);
    return response.data as SetupStatus;
  },

  /**
   * Mark Final MR as set
   */
  markFinalMRSet: async (programId: string): Promise<SetupStatus> => {
    const response = await axios.post(`/api/programs/${programId}/setup-status/final-mr`);
    return response.data as SetupStatus;
  },
};

