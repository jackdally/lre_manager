import React from 'react';
import { useSettingsStore } from '../../../../../store/settingsStore';
import Button from '../../../../common/Button';

const UserPreferencesTab: React.FC = () => {
  const userPreferences = useSettingsStore(state => state.userPreferences);
  const updateUserPreferences = useSettingsStore(state => state.updateUserPreferences);
  const currencies = useSettingsStore(state => state.currencies);
  const defaultCurrency = useSettingsStore(state => state.defaultCurrency);

  const handlePreferenceChange = (key: keyof typeof userPreferences, value: any) => {
    updateUserPreferences({ [key]: value });
  };

  const handleNotificationChange = (type: 'email' | 'inApp', value: boolean) => {
    updateUserPreferences({
      notifications: {
        ...userPreferences.notifications,
        [type]: value,
      },
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">User Preferences</h2>
        <p className="text-sm text-gray-600 mt-1">
          Customize your application experience and display settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Display Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={userPreferences.theme}
                onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <select
                value={userPreferences.currency}
                onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Format
              </label>
              <select
                value={userPreferences.dateFormat}
                onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MM-DD-YYYY">MM-DD-YYYY</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Zone
              </label>
              <select
                value={userPreferences.timeZone}
                onChange={(e) => handlePreferenceChange('timeZone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <input
                type="checkbox"
                checked={userPreferences.notifications.email}
                onChange={(e) => handleNotificationChange('email', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">In-App Notifications</label>
                <p className="text-sm text-gray-500">Show notifications within the application</p>
              </div>
              <input
                type="checkbox"
                checked={userPreferences.notifications.inApp}
                onChange={(e) => handleNotificationChange('inApp', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Current Settings Summary */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Settings</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Theme:</span>
              <span className="ml-2 font-medium capitalize">{userPreferences.theme}</span>
            </div>
            <div>
              <span className="text-gray-600">Currency:</span>
              <span className="ml-2 font-medium">{userPreferences.currency}</span>
            </div>
            <div>
              <span className="text-gray-600">Date Format:</span>
              <span className="ml-2 font-medium">{userPreferences.dateFormat}</span>
            </div>
            <div>
              <span className="text-gray-600">Time Zone:</span>
              <span className="ml-2 font-medium">{userPreferences.timeZone}</span>
            </div>
            <div>
              <span className="text-gray-600">Email Notifications:</span>
              <span className="ml-2 font-medium">{userPreferences.notifications.email ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div>
              <span className="text-gray-600">In-App Notifications:</span>
              <span className="ml-2 font-medium">{userPreferences.notifications.inApp ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              if (window.confirm('Are you sure you want to reset all preferences to default?')) {
                updateUserPreferences({
                  theme: 'system',
                  currency: 'USD',
                  dateFormat: 'MM/DD/YYYY',
                  timeZone: 'UTC',
                  notifications: {
                    email: true,
                    inApp: true,
                  },
                });
              }
            }}
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserPreferencesTab; 