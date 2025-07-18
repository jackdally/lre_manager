import axios from 'axios';
import { WBSTemplate } from '../store/settingsStore';

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
}; 