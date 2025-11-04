import axios from 'axios';

export interface MonthlyReminder {
  id: string;
  programId: string;
  month: string; // Format: YYYY-MM
  isDismissed: boolean;
  dismissedAt?: string;
  dismissedBy?: string;
  emailSent: boolean;
  emailSentAt?: string;
  inAppNotificationShown: boolean;
  inAppNotificationShownAt?: string;
  createdAt: string;
  updatedAt: string;
  program?: {
    id: string;
    name: string;
    code: string;
  };
}

export const monthlyRemindersApi = {
  getPendingReminders: async (programId: string): Promise<MonthlyReminder[]> => {
    const response = await axios.get<MonthlyReminder[]>(`/api/programs/${programId}/monthly-reminders`);
    return response.data;
  },

  dismissReminder: async (programId: string, reminderId: string, dismissedBy?: string): Promise<MonthlyReminder> => {
    const response = await axios.post<MonthlyReminder>(
      `/api/programs/${programId}/monthly-reminders/${reminderId}/dismiss`,
      { dismissedBy }
    );
    return response.data;
  },
};
