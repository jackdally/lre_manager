import React, { useState } from 'react';
import { useSettingsStore } from '../../../../store/settingsStore';
import Layout from '../../../layout';
import WBSTemplatesTab from './WBSTemplatesTab';
import CostCategoriesTab from './CostCategoriesTab';
import VendorsTab from './VendorsTab';
import CurrenciesTab from './CurrenciesTab';
import FiscalYearsTab from './FiscalYearsTab';
import UserPreferencesTab from './UserPreferencesTab';

type TabType = 'wbs' | 'cost-categories' | 'vendors' | 'currencies' | 'fiscal-years' | 'preferences';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('wbs');
  const { isLoading, error } = useSettingsStore();

  const tabs = [
    { id: 'wbs' as TabType, name: 'WBS Templates', icon: '📋' },
    { id: 'cost-categories' as TabType, name: 'Cost Categories', icon: '🏷️' },
    { id: 'vendors' as TabType, name: 'Vendors', icon: '🏢' },
    { id: 'currencies' as TabType, name: 'Currencies', icon: '💰' },
    { id: 'fiscal-years' as TabType, name: 'Fiscal Years', icon: '📅' },
    { id: 'preferences' as TabType, name: 'User Preferences', icon: '⚙️' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'wbs':
        return <WBSTemplatesTab />;
      case 'cost-categories':
        return <CostCategoriesTab />;
      case 'vendors':
        return <VendorsTab />;
      case 'currencies':
        return <CurrenciesTab />;
      case 'fiscal-years':
        return <FiscalYearsTab />;
      case 'preferences':
        return <UserPreferencesTab />;
      default:
        return <WBSTemplatesTab />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage global application settings, templates, and configurations.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage; 