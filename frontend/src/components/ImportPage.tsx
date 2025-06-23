import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from './Layout';

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

interface ImportSession {
  id: string;
  filename: string;
  originalFilename: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  totalRecords: number;
  processedRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  errorRecords: number;
  createdAt: string;
  updatedAt: string;
}

interface ImportTransaction {
  id: string;
  vendorName: string;
  description: string;
  amount: number;
  transactionDate: string;
  programCode: string;
  category?: string;
  subcategory?: string;
  invoiceNumber?: string;
  referenceNumber?: string;
  status: 'unmatched' | 'matched' | 'confirmed' | 'rejected' | 'added_to_ledger';
  matchConfidence?: number;
  suggestedMatches?: any[];
  matchedLedgerEntry?: any;
}

interface Program {
  id: string;
  code: string;
  name: string;
  description: string;
}

const ImportPage: React.FC = () => {
  const { id: programId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'upload' | 'sessions' | 'matching'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<ImportConfig>({
    programCodeColumn: 'Program Code',
    vendorColumn: 'Vendor Name',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    dateColumn: 'Transaction Date',
    periodColumn: 'Period',
    categoryColumn: 'Category',
    subcategoryColumn: 'Subcategory',
    invoiceColumn: 'Invoice Number',
    referenceColumn: 'Reference Number',
    dateFormat: 'MM/DD/YYYY',
    amountTolerance: 0.01,
    matchThreshold: 0.7
  });
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ImportSession | null>(null);
  const [transactions, setTransactions] = useState<ImportTransaction[]>([]);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Configuration management states
  const [showSaveConfig, setShowSaveConfig] = useState(false);
  const [showCopyConfig, setShowCopyConfig] = useState(false);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');
  const [isDefaultConfig, setIsDefaultConfig] = useState(false);
  const [isGlobalConfig, setIsGlobalConfig] = useState(false);
  const [copyTargetProgramId, setCopyTargetProgramId] = useState('');
  const [copyConfigName, setCopyConfigName] = useState('');
  const [copyConfigDescription, setCopyConfigDescription] = useState('');
  const [copyIsDefault, setCopyIsDefault] = useState(false);
  const [selectedConfigForCopy, setSelectedConfigForCopy] = useState<SavedConfig | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedConfigForSave, setSelectedConfigForSave] = useState<SavedConfig | null>(null);

  useEffect(() => {
    if (programId) {
      loadSessions();
      loadSavedConfigs();
      loadPrograms();
    }
  }, [programId]);

  const loadSessions = async () => {
    try {
      const response = await fetch(`/api/import/${programId}/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const loadSavedConfigs = async () => {
    try {
      const response = await fetch(`/api/import/${programId}/config`);
      if (response.ok) {
        const data = await response.json();
        setSavedConfigs(data);
        
        // Set default config if available
        const defaultConfig = data.find((c: SavedConfig) => c.isDefault);
        if (defaultConfig) {
          setConfig(defaultConfig.columnMapping);
          setSelectedConfigId(defaultConfig.id);
        }
      }
    } catch (err) {
      console.error('Failed to load saved configs:', err);
    }
  };

  const loadPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (err) {
      console.error('Failed to load programs:', err);
    }
  };

  const handleConfigSelect = async (configId: string) => {
    if (!configId) {
      // Reset to default config when "Select a saved configuration..." is chosen
      setConfig({
        programCodeColumn: 'Program Code',
        vendorColumn: 'Vendor Name',
        descriptionColumn: 'Description',
        amountColumn: 'Amount',
        dateColumn: 'Transaction Date',
        periodColumn: 'Period',
        categoryColumn: 'Category',
        subcategoryColumn: 'Subcategory',
        invoiceColumn: 'Invoice Number',
        referenceColumn: 'Reference Number',
        dateFormat: 'MM/DD/YYYY',
        amountTolerance: 0.01,
        matchThreshold: 0.7
      });
      setSelectedConfigId('');
      return;
    }

    // Find the config in the already loaded savedConfigs
    const savedConfig = savedConfigs.find(c => c.id === configId);
    if (savedConfig) {
      setConfig(savedConfig.columnMapping);
      setSelectedConfigId(configId);
    } else {
      console.error('Configuration not found:', configId);
    }
  };

  const handleSaveConfig = async () => {
    if (!configName.trim()) {
      setError('Configuration name is required');
      return;
    }

    try {
      const method = selectedConfigForSave ? 'PUT' : 'POST';
      const url = selectedConfigForSave 
        ? `/api/import/config/${selectedConfigForSave.id}`
        : `/api/import/${programId}/config`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: configName,
          description: configDescription,
          columnMapping: config,
          isDefault: isDefaultConfig,
          isGlobal: isGlobalConfig
        })
      });

      if (response.ok) {
        const savedConfig = await response.json();
        
        // Update the saved configs list
        if (selectedConfigForSave) {
          // Update existing config
          setSavedConfigs(savedConfigs.map(c => 
            c.id === selectedConfigForSave.id ? savedConfig : c
          ));
        } else {
          // Add new config
          setSavedConfigs([...savedConfigs, savedConfig]);
        }
        
        setShowSaveConfig(false);
        setConfigName('');
        setConfigDescription('');
        setIsDefaultConfig(false);
        setIsGlobalConfig(false);
        setSelectedConfigForSave(null);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Failed to save configuration');
    }
  };

  const handleCopyConfig = async () => {
    if (!selectedConfigForCopy || !copyTargetProgramId.trim()) {
      setError('Please select a configuration and target program');
      return;
    }

    try {
      const response = await fetch(`/api/import/config/${selectedConfigForCopy.id}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetProgramId: copyTargetProgramId,
          name: copyConfigName || `${selectedConfigForCopy.name} (Copy)`,
          description: copyConfigDescription || selectedConfigForCopy.description,
          isDefault: copyIsDefault
        })
      });

      if (response.ok) {
        setShowCopyConfig(false);
        setSelectedConfigForCopy(null);
        setCopyTargetProgramId('');
        setCopyConfigName('');
        setCopyConfigDescription('');
        setCopyIsDefault(false);
        setError(null);
        // Show success message
        alert('Configuration copied successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to copy configuration');
      }
    } catch (err) {
      setError('Failed to copy configuration');
    }
  };

  const handleUpload = async () => {
    if (!file || !programId) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      formData.append('config', JSON.stringify(config));

      const response = await fetch(`/api/import/${programId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setDescription('');
        setFile(null);
        await loadSessions();
        setActiveTab('sessions');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (sessionId: string) => {
    try {
      console.log('Loading session details for:', sessionId);
      const [sessionResponse, transactionsResponse] = await Promise.all([
        fetch(`/api/import/session/${sessionId}`),
        fetch(`/api/import/session/${sessionId}/transactions`)
      ]);

      if (sessionResponse.ok && transactionsResponse.ok) {
        const sessionData = await sessionResponse.json();
        const transactionsData = await transactionsResponse.json();
        
        console.log('Session data:', sessionData);
        console.log('Transactions data:', transactionsData);
        
        setCurrentSession(sessionData);
        setTransactions(transactionsData);
        setActiveTab('matching');
      } else {
        console.error('Failed to load session details:', {
          sessionStatus: sessionResponse.status,
          transactionsStatus: transactionsResponse.status
        });
      }
    } catch (err) {
      console.error('Failed to load session details:', err);
    }
  };

  const confirmMatch = async (transactionId: string, ledgerEntryId: string) => {
    try {
      const response = await fetch(`/api/import/transaction/${transactionId}/confirm-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledgerEntryId })
      });

      if (response.ok) {
        // Reload transactions
        if (currentSession) {
          await loadSessionDetails(currentSession.id);
        }
      }
    } catch (err) {
      console.error('Failed to confirm match:', err);
    }
  };

  const addToLedger = async (transactionId: string, wbsCategory: string, wbsSubcategory: string) => {
    try {
      const response = await fetch(`/api/import/transaction/${transactionId}/add-to-ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wbsCategory, wbsSubcategory })
      });

      if (response.ok) {
        // Reload transactions
        if (currentSession) {
          await loadSessionDetails(currentSession.id);
        }
      }
    } catch (err) {
      console.error('Failed to add to ledger:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-yellow-600';
    }
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'matched': return 'text-blue-600';
      case 'added_to_ledger': return 'text-purple-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Actuals</h1>
        <p className="text-gray-600">Upload and process NetSuite transaction exports to match with existing ledger entries</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upload Sessions
          </button>
          {currentSession && (
            <button
              onClick={() => setActiveTab('matching')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'matching'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transaction Matching
            </button>
          )}
        </nav>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upload NetSuite Actuals</h2>
          
          <div className="space-y-6">
            {/* Saved Configurations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saved Configuration
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedConfigId}
                  onChange={(e) => handleConfigSelect(e.target.value)}
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
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Save Current Config
                </button>
                <button
                  onClick={() => setShowCopyConfig(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Copy Config
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File (Excel or CSV)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for this upload (e.g., Q1 2024 Actuals)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Column Mapping */}
            <div>
              <h3 className="text-lg font-medium mb-3">Column Mapping</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Code Column
                  </label>
                  <input
                    type="text"
                    value={config.programCodeColumn}
                    onChange={(e) => setConfig({...config, programCodeColumn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Column
                  </label>
                  <input
                    type="text"
                    value={config.vendorColumn}
                    onChange={(e) => setConfig({...config, vendorColumn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description Column
                  </label>
                  <input
                    type="text"
                    value={config.descriptionColumn}
                    onChange={(e) => setConfig({...config, descriptionColumn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Column
                  </label>
                  <input
                    type="text"
                    value={config.amountColumn}
                    onChange={(e) => setConfig({...config, amountColumn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Column
                  </label>
                  <input
                    type="text"
                    value={config.dateColumn}
                    onChange={(e) => setConfig({...config, dateColumn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period Column
                  </label>
                  <input
                    type="text"
                    value={config.periodColumn || ''}
                    onChange={(e) => setConfig({...config, periodColumn: e.target.value})}
                    placeholder="e.g., Period"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Format
                  </label>
                  <select
                    value={config.dateFormat}
                    onChange={(e) => setConfig({...config, dateFormat: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploading and Processing...' : 'Upload and Process Actuals'}
            </button>
          </div>
        </div>
      )}

      {/* Save Configuration Modal */}
      {showSaveConfig && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Save Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overwrite Existing Configuration (Optional)
                  </label>
                  <select
                    value={selectedConfigForSave?.id || ''}
                    onChange={(e) => {
                      const config = savedConfigs.find(c => c.id === e.target.value);
                      setSelectedConfigForSave(config || null);
                      if (config) {
                        setConfigName(config.name);
                        setConfigDescription(config.description);
                        setIsDefaultConfig(config.isDefault);
                        setIsGlobalConfig(config.isGlobal);
                      } else {
                        setConfigName('');
                        setConfigDescription('');
                        setIsDefaultConfig(false);
                        setIsGlobalConfig(false);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Create new configuration...</option>
                    {savedConfigs.map((savedConfig) => (
                      <option key={savedConfig.id} value={savedConfig.id}>
                        {savedConfig.name} {savedConfig.isDefault && '(Default)'} {savedConfig.isGlobal && '(Global)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Configuration Name *
                  </label>
                  <input
                    type="text"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="e.g., Standard NetSuite Export"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={configDescription}
                    onChange={(e) => setConfigDescription(e.target.value)}
                    placeholder="Optional description of this configuration"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefaultConfig}
                    onChange={(e) => setIsDefaultConfig(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                    Set as default configuration
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isGlobal"
                    checked={isGlobalConfig}
                    onChange={(e) => setIsGlobalConfig(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isGlobal" className="ml-2 block text-sm text-gray-900">
                    Make this configuration global (available to all programs)
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowSaveConfig(false);
                    setConfigName('');
                    setConfigDescription('');
                    setIsDefaultConfig(false);
                    setIsGlobalConfig(false);
                    setSelectedConfigForSave(null);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {selectedConfigForSave ? 'Update Configuration' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Configuration Modal */}
      {showCopyConfig && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Copy Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Configuration to Copy
                  </label>
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
                        {savedConfig.name} {savedConfig.isGlobal && '(Global)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Program *
                  </label>
                  <select
                    value={copyTargetProgramId}
                    onChange={(e) => setCopyTargetProgramId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a target program...</option>
                    {programs
                      .filter(program => program.id !== programId) // Exclude current program
                      .map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.code} - {program.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Configuration Name
                  </label>
                  <input
                    type="text"
                    value={copyConfigName}
                    onChange={(e) => setCopyConfigName(e.target.value)}
                    placeholder="Leave blank to use original name + (Copy)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={copyConfigDescription}
                    onChange={(e) => setCopyConfigDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCopyConfig(false);
                    setSelectedConfigForCopy(null);
                    setCopyTargetProgramId('');
                    setCopyConfigName('');
                    setCopyConfigDescription('');
                    setCopyIsDefault(false);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopyConfig}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Copy Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold">Upload Sessions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matched
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.originalFilename}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.processedRecords} / {session.totalRecords}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.matchedRecords} matched, {session.unmatchedRecords} unmatched
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {session.status === 'completed' && (
                        <button
                          onClick={() => loadSessionDetails(session.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Review Matches
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Matching Tab */}
      {activeTab === 'matching' && currentSession && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Transaction Matching</h2>
            <p className="text-sm text-gray-600 mt-1">
              {currentSession.originalFilename} - {currentSession.matchedRecords} matched, {currentSession.unmatchedRecords} unmatched
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.vendorName || 'Unknown Vendor'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.description || 'No description'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {`${Number(transaction.amount).toFixed(2)} - ${transaction.transactionDate || 'No date'}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionStatusColor(transaction.status || 'unmatched')}`}>
                        {transaction.status || 'unmatched'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.matchConfidence ? `${(transaction.matchConfidence * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {transaction.status === 'matched' && transaction.suggestedMatches && Array.isArray(transaction.suggestedMatches) && (
                        <div className="space-y-2">
                          {transaction.suggestedMatches.slice(0, 3).map((match, index) => (
                            <button
                              key={index}
                              onClick={() => confirmMatch(transaction.id, match?.id || '')}
                              className="block text-blue-600 hover:text-blue-900 text-xs"
                            >
                              Confirm: {match?.vendorName || 'Unknown Vendor'} ({(Number(match?.confidence ?? 0) * 100).toFixed(1)}%)
                            </button>
                          ))}
                        </div>
                      )}
                      {transaction.status === 'unmatched' && (
                        <button
                          onClick={() => {
                            // This would open a modal to select WBS category/subcategory
                            const wbsCategory = prompt('Enter WBS Category:');
                            const wbsSubcategory = prompt('Enter WBS Subcategory:');
                            if (wbsCategory && wbsSubcategory) {
                              addToLedger(transaction.id, wbsCategory, wbsSubcategory);
                            }
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Add to Ledger
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ImportPage; 