import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { monthlyRemindersApi, MonthlyReminder } from '../../services/monthlyRemindersApi';
import { XMarkIcon, ExclamationTriangleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface MonthlyActualsReminderProps {
  programId: string;
}

const MonthlyActualsReminder: React.FC<MonthlyActualsReminderProps> = ({ programId }) => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<MonthlyReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<string | null>(null);

  const loadReminders = useCallback(async () => {
    if (!programId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const pendingReminders = await monthlyRemindersApi.getPendingReminders(programId);
      setReminders(pendingReminders);
    } catch (error) {
      console.error('Error loading monthly reminders:', error);
      // Don't show error to user, just don't show reminders
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    if (programId) {
      loadReminders();
    }
  }, [loadReminders, programId]);

  const handleDismiss = async (reminderId: string) => {
    try {
      setDismissing(reminderId);
      await monthlyRemindersApi.dismissReminder(programId, reminderId);
      // Remove dismissed reminder from list
      setReminders(reminders.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error('Error dismissing reminder:', error);
      // Don't show error, just leave reminder in list
    } finally {
      setDismissing(null);
    }
  };

  const handleGoToUploads = () => {
    navigate(`/programs/${programId}/actuals`);
  };

  const formatMonth = (monthString: string): string => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return null; // Don't show loading state, just wait
  }

  if (reminders.length === 0) {
    return null; // No reminders to show
  }

  // Show the most recent reminder
  const latestReminder = reminders[0];

  return (
    <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-6 w-6 text-blue-600 mt-0.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Monthly Actuals Reminder
          </h3>
          <p className="text-blue-800 mb-4">
            Missing actuals detected for <strong>{formatMonth(latestReminder.month)}</strong>. 
            Please upload actuals data to ensure accurate program tracking and reporting.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoToUploads}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Go to Upload Actuals
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </button>
            <button
              onClick={() => handleDismiss(latestReminder.id)}
              disabled={dismissing === latestReminder.id}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors disabled:opacity-50"
            >
              {dismissing === latestReminder.id ? 'Dismissing...' : 'Dismiss'}
            </button>
          </div>
          {reminders.length > 1 && (
            <p className="text-sm text-blue-700 mt-3">
              + {reminders.length - 1} more reminder{reminders.length - 1 > 1 ? 's' : ''} for other months
            </p>
          )}
        </div>
        <button
          onClick={() => handleDismiss(latestReminder.id)}
          disabled={dismissing === latestReminder.id}
          className="flex-shrink-0 ml-4 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
          aria-label="Dismiss reminder"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default MonthlyActualsReminder;

