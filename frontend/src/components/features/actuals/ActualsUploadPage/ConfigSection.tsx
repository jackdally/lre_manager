import React from 'react';

interface ImportConfig {
  programCodeColumn: string;
  vendorColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  dateColumn: string;
  periodColumn?: string;
  categoryColumn?: string;
  subcategoryColumn?: string;
  invoiceColumn?: string;
  referenceColumn?: string;
  transactionIdColumn?: string;
  dateFormat?: string;
  amountTolerance?: number;
  matchThreshold?: number;
}

interface SavedConfig {
  id: string;
  name: string;
  description: string;
  columnMapping: ImportConfig;
  isDefault: boolean;
  isGlobal: boolean;
  program?: any;
  createdAt: string;
  updatedAt: string;
}

interface ConfigSectionProps {
  config: ImportConfig;
  setConfig: (config: ImportConfig) => void;
  savedConfigs: SavedConfig[];
  selectedConfigId: string;
  onConfigSelect: (configId: string) => void;
  onSaveConfig: () => void;
  onCopyConfig: () => void;
  showSaveConfig: boolean;
  setShowSaveConfig: (show: boolean) => void;
  showCopyConfig: boolean;
  setShowCopyConfig: (show: boolean) => void;
  configName: string;
  setConfigName: (name: string) => void;
  configDescription: string;
  setConfigDescription: (description: string) => void;
  isDefaultConfig: boolean;
  setIsDefaultConfig: (isDefault: boolean) => void;
  isGlobalConfig: boolean;
  setIsGlobalConfig: (isGlobal: boolean) => void;
  programs: any[];
  copyTargetProgramId: string;
  setCopyTargetProgramId: (programId: string) => void;
  copyConfigName: string;
  setCopyConfigName: (name: string) => void;
  copyConfigDescription: string;
  setCopyConfigDescription: (description: string) => void;
  copyIsDefault: boolean;
  setCopyIsDefault: (isDefault: boolean) => void;
  selectedConfigForCopy: SavedConfig | null;
  setSelectedConfigForCopy: (config: SavedConfig | null) => void;
  selectedConfigForSave: SavedConfig | null;
  setSelectedConfigForSave: (config: SavedConfig | null) => void;
}

const ConfigSection: React.FC<ConfigSectionProps> = ({
  config,
  setConfig,
  savedConfigs,
  selectedConfigId,
  onConfigSelect,
  onSaveConfig,
  onCopyConfig,
  showSaveConfig,
  setShowSaveConfig,
  showCopyConfig,
  setShowCopyConfig,
  configName,
  setConfigName,
  configDescription,
  setConfigDescription,
  isDefaultConfig,
  setIsDefaultConfig,
  isGlobalConfig,
  setIsGlobalConfig,
  programs,
  copyTargetProgramId,
  setCopyTargetProgramId,
  copyConfigName,
  setCopyConfigName,
  copyConfigDescription,
  setCopyConfigDescription,
  copyIsDefault,
  setCopyIsDefault,
  selectedConfigForCopy,
  setSelectedConfigForCopy,
  selectedConfigForSave,
  setSelectedConfigForSave
}) => {
  const handleConfigChange = (field: keyof ImportConfig, value: string | number) => {
    setConfig({ ...config, [field]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Column Mapping Configuration</h2>
      
      {/* Saved Configs Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Saved Configurations</h3>
        <div className="flex gap-2 mb-4">
          <select
            value={selectedConfigId}
            onChange={(e) => onConfigSelect(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a saved configuration...</option>
            {savedConfigs.map((savedConfig) => (
              <option key={savedConfig.id} value={savedConfig.id}>
                {savedConfig.name} {savedConfig.isDefault && '(Default)'} {savedConfig.isGlobal && '(Global)'}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowSaveConfig(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Config
          </button>
          <button
            onClick={() => setShowCopyConfig(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Copy Config
          </button>
        </div>
      </div>

      {/* Column Mapping Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program Code Column</label>
          <input
            type="text"
            value={config.programCodeColumn}
            onChange={(e) => handleConfigChange('programCodeColumn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Column</label>
          <input
            type="text"
            value={config.vendorColumn}
            onChange={(e) => handleConfigChange('vendorColumn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description Column</label>
          <input
            type="text"
            value={config.descriptionColumn}
            onChange={(e) => handleConfigChange('descriptionColumn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount Column</label>
          <input
            type="text"
            value={config.amountColumn}
            onChange={(e) => handleConfigChange('amountColumn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Column</label>
          <input
            type="text"
            value={config.dateColumn}
            onChange={(e) => handleConfigChange('dateColumn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
          <input
            type="text"
            value={config.dateFormat}
            onChange={(e) => handleConfigChange('dateFormat', e.target.value)}
            placeholder="MM/DD/YYYY"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Period Column (Optional)</label>
          <input
            type="text"
            value={config.periodColumn || ''}
            onChange={(e) => handleConfigChange('periodColumn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category Column (Optional)</label>
          <input
            type="text"
            value={config.categoryColumn || ''}
            onChange={(e) => handleConfigChange('categoryColumn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory Column (Optional)</label>
          <input
            type="text"
            value={config.subcategoryColumn || ''}
            onChange={(e) => handleConfigChange('subcategoryColumn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Column (Optional)</label>
          <input
            type="text"
            value={config.invoiceColumn || ''}
            onChange={(e) => handleConfigChange('invoiceColumn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference Column (Optional)</label>
          <input
            type="text"
            value={config.referenceColumn || ''}
            onChange={(e) => handleConfigChange('referenceColumn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID Column (Optional)</label>
          <input
            type="text"
            value={config.transactionIdColumn || ''}
            onChange={(e) => handleConfigChange('transactionIdColumn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount Tolerance</label>
          <input
            type="number"
            step="0.01"
            value={config.amountTolerance}
            onChange={(e) => handleConfigChange('amountTolerance', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Match Threshold</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={config.matchThreshold}
            onChange={(e) => handleConfigChange('matchThreshold', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Save Config Modal */}
      {showSaveConfig && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Save Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={configDescription}
                  onChange={(e) => setConfigDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefaultConfig"
                  checked={isDefaultConfig}
                  onChange={(e) => setIsDefaultConfig(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefaultConfig" className="ml-2 block text-sm text-gray-900">
                  Set as default for this program
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isGlobalConfig"
                  checked={isGlobalConfig}
                  onChange={(e) => setIsGlobalConfig(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isGlobalConfig" className="ml-2 block text-sm text-gray-900">
                  Make available globally
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={onSaveConfig}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveConfig(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Config Modal */}
      {showCopyConfig && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Copy Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Config to Copy</label>
                <select
                  value={selectedConfigForCopy?.id || ''}
                  onChange={(e) => {
                    const config = savedConfigs.find(c => c.id === e.target.value);
                    setSelectedConfigForCopy(config || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a configuration...</option>
                  {savedConfigs.map((savedConfig) => (
                    <option key={savedConfig.id} value={savedConfig.id}>
                      {savedConfig.name} {savedConfig.isDefault && '(Default)'} {savedConfig.isGlobal && '(Global)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Program</label>
                <select
                  value={copyTargetProgramId}
                  onChange={(e) => setCopyTargetProgramId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select target program...</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.code} - {program.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Name</label>
                <input
                  type="text"
                  value={copyConfigName}
                  onChange={(e) => setCopyConfigName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Description</label>
                <textarea
                  value={copyConfigDescription}
                  onChange={(e) => setCopyConfigDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="copyIsDefault"
                  checked={copyIsDefault}
                  onChange={(e) => setCopyIsDefault(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="copyIsDefault" className="ml-2 block text-sm text-gray-900">
                  Set as default for target program
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={onCopyConfig}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Copy
              </button>
              <button
                onClick={() => setShowCopyConfig(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigSection; 