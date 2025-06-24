import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from './Layout';
import TransactionMatchModal from './TransactionMatchModal';

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
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'replaced';
  totalRecords: number;
  processedRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  errorRecords: number;
  createdAt: string;
  updatedAt: string;
  replacedBySessionId?: string | null;
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
  status: 'unmatched' | 'matched' | 'confirmed' | 'rejected' | 'added_to_ledger' | 'replaced';
  matchConfidence?: number;
  suggestedMatches?: any[];
  matchedLedgerEntry?: any;
  duplicateType?: 'none' | 'different_info';
  duplicateOfId?: string | null;
  preservedFromSessionId?: string | null;
  rejectedMatches?: any[];
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

  // Add state for the match review modal
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [modalTransaction, setModalTransaction] = useState<ImportTransaction | null>(null);
  const [modalMatches, setModalMatches] = useState<any[]>([]);
  const [modalMatchIndex, setModalMatchIndex] = useState(0);
  const [modalMatch, setModalMatch] = useState<any>(null);
  const [rejectedLedgerEntries, setRejectedLedgerEntries] = useState<any[]>([]);

  // Add state for showAllDuplicates toggle
  const [showAllDuplicates, setShowAllDuplicates] = useState(false);

  // Add state for replace upload feature
  const [replaceMode, setReplaceMode] = useState(false);
  const [selectedSessionToReplace, setSelectedSessionToReplace] = useState<string>('');
  const [preserveConfirmedMatches, setPreserveConfirmedMatches] = useState(true);
  const [preserveAllMatches, setPreserveAllMatches] = useState(false);
  const [forceReplace, setForceReplace] = useState(false);
  const [showReplaceOptions, setShowReplaceOptions] = useState(false);

  // Add state for force replace confirmation modal
  const [showForceReplaceConfirm, setShowForceReplaceConfirm] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<{
    file: File;
    description: string;
    config: any;
  } | null>(null);

  // Add state for potential matches
  const [potentialMatchesMap, setPotentialMatchesMap] = useState<{ [transactionId: string]: any[] }>({});

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

    // If force replace is enabled, show confirmation modal first
    if (replaceMode && forceReplace) {
      setPendingUploadData({ file, description, config });
      setShowForceReplaceConfirm(true);
      return;
    }

    await performUpload();
  };

  const performUpload = async () => {
    if (!file || !programId) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      formData.append('config', JSON.stringify(config));

      let endpoint = `/api/import/${programId}/upload`;
      
      if (replaceMode && selectedSessionToReplace) {
        endpoint = `/api/import/${programId}/replace-upload`;
        formData.append('replaceSessionId', selectedSessionToReplace);
        formData.append('preserveConfirmedMatches', preserveConfirmedMatches.toString());
        formData.append('preserveAllMatches', preserveAllMatches.toString());
        formData.append('forceReplace', forceReplace.toString());
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setDescription('');
        setFile(null);
        setReplaceMode(false);
        setSelectedSessionToReplace('');
        setPreserveConfirmedMatches(true);
        setPreserveAllMatches(false);
        setForceReplace(false);
        setShowReplaceOptions(false);
        setShowForceReplaceConfirm(false);
        setPendingUploadData(null);
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
      const [sessionResponse, transactionsResponse] = await Promise.all([
        fetch(`/api/import/session/${sessionId}`),
        fetch(`/api/import/session/${sessionId}/transactions`)
      ]);

      if (sessionResponse.ok && transactionsResponse.ok) {
        const sessionData = await sessionResponse.json();
        const transactionsData = await transactionsResponse.json();
        
        setCurrentSession(sessionData);
        setTransactions(transactionsData);
        setActiveTab('matching');
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
      case 'replaced': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  // Helper for currency formatting
  const formatCurrency = (amount: number | string | undefined) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return '';
    return Number(amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  // Handler to open the modal
  const handleReviewMatch = async (transaction: ImportTransaction, matches: any[]) => {
    setModalTransaction(transaction);
    setModalMatchIndex(0);
    
    // Fetch fresh potential matches from backend (this filters out rejected entries)
    try {
      const matchesRes = await fetch(`/api/import/transaction/${transaction.id}/potential-matches`);
      if (matchesRes.ok) {
        const freshMatches = await matchesRes.json();
        setModalMatches(freshMatches);
      } else {
        setModalMatches(matches);
      }
      
      // Fetch rejected matches for this transaction
      const rejectedRes = await fetch(`/api/import/transaction/${transaction.id}/rejected-ledger-entries`);
      if (rejectedRes.ok) {
        const rejectedMatches = await rejectedRes.json();
        setRejectedLedgerEntries(rejectedMatches);
      } else {
        setRejectedLedgerEntries(transaction.rejectedMatches || []);
      }
      
      setShowMatchModal(true);
    } catch (error) {
      setModalMatches(matches);
      setRejectedLedgerEntries(transaction.rejectedMatches || []);
      setShowMatchModal(true);
    }
  };

  useEffect(() => {
    if (modalMatches.length > 0) {
      setModalMatch(modalMatches[modalMatchIndex]);
    }
  }, [modalMatchIndex, modalMatches]);

  const handleNextMatch = () => {
    if (modalMatchIndex < modalMatches.length - 1) {
      setModalMatchIndex(modalMatchIndex + 1);
    }
  };
  const handlePrevMatch = () => {
    if (modalMatchIndex > 0) {
      setModalMatchIndex(modalMatchIndex - 1);
    }
  };

  // Handler to close the modal
  const handleCloseMatchModal = () => {
    setShowMatchModal(false);
    setModalTransaction(null);
    setModalMatch(null);
  };

  // Handler for confirm/reject inside modal
  const handleModalConfirm = async () => {
    if (modalTransaction && modalMatch) {
      await confirmMatch(modalTransaction.id, modalMatch.id);
      handleCloseMatchModal();
      if (currentSession) await loadSessionDetails(currentSession.id);
    }
  };

  const handleModalReject = async (ledgerEntry: any) => {
    if (modalTransaction) {
      await fetch(`/api/import/transaction/${modalTransaction.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledgerEntryId: ledgerEntry.id })
      });
      
      // Refresh rejected ledger entries
      const res = await fetch(`/api/import/transaction/${modalTransaction.id}/rejected-ledger-entries`);
      const newRejected = res.ok ? await res.json() : [];
      setRejectedLedgerEntries(newRejected);
      
      // Refresh potential matches (backend now filters out rejected entries)
      const matchesRes = await fetch(`/api/import/transaction/${modalTransaction.id}/potential-matches`);
      if (matchesRes.ok) {
        const newMatches = await matchesRes.json();
        setModalMatches(newMatches);
        
        // Adjust modal match index after the list has been updated
        if (newMatches.length === 0) {
          // Check if there are rejected matches to show
          if (newRejected.length > 0) {
            // Don't close the modal - it will auto-switch to rejected tab
          } else {
            handleCloseMatchModal();
          }
        } else if (modalMatchIndex >= newMatches.length) {
          // If current index is now out of bounds, move to the last item
          const newIndex = newMatches.length - 1;
          setModalMatchIndex(newIndex);
          setModalMatch(newMatches[newIndex]);
        } else {
          // Index is still valid, just update the current match
          setModalMatch(newMatches[modalMatchIndex]);
        }
      } else {
        // If no more potential matches, close modal
        handleCloseMatchModal();
      }
      if (currentSession) await loadSessionDetails(currentSession.id);
    }
  };

  const handleModalUndoReject = async (ledgerEntry: any) => {
    if (modalTransaction) {
      await fetch(`/api/import/transaction/${modalTransaction.id}/undo-reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledgerEntryId: ledgerEntry.id })
      });
      
      // Refresh rejected ledger entries
      const res = await fetch(`/api/import/transaction/${modalTransaction.id}/rejected-ledger-entries`);
      const newRejected = res.ok ? await res.json() : [];
      setRejectedLedgerEntries(newRejected);
      
      // Refresh potential matches after undo (backend now includes the restored entry)
      const matchesRes = await fetch(`/api/import/transaction/${modalTransaction.id}/potential-matches`);
      if (matchesRes.ok) {
        const newMatches = await matchesRes.json();
        setModalMatches(newMatches);
      }
      
      if (currentSession) await loadSessionDetails(currentSession.id);
    }
  };

  // After loading transactions, fetch potential matches for each transaction
  useEffect(() => {
    if (transactions.length > 0) {
      const fetchBatchData = async () => {
        try {
          const transactionIds = transactions.map(t => t.id);
          
          // Fetch potential matches for all transactions in one request
          const potentialMatchesRes = await fetch('/api/import/transactions/potential-matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionIds })
          });
          
          if (potentialMatchesRes.ok) {
            const potentialMatchesData = await potentialMatchesRes.json();
            setPotentialMatchesMap(potentialMatchesData);
          }
          
          // Fetch rejected matches for all transactions in one request
          const rejectedMatchesRes = await fetch('/api/import/transactions/rejected-ledger-entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionIds })
          });
          
          if (rejectedMatchesRes.ok) {
            const rejectedMatchesData = await rejectedMatchesRes.json();
            // Update transactions with rejected matches data
            const updatedTransactions = transactions.map(transaction => ({
              ...transaction,
              rejectedMatches: rejectedMatchesData[transaction.id] || []
            }));
            setTransactions(updatedTransactions);
          }
        } catch (error) {
          console.error('Error fetching batch data:', error);
        }
      };
      
      fetchBatchData();
    }
  }, [transactions.length > 0 ? transactions.map(t => t.id).join(',') : null]);

  // Filter transactions for display
  const displayedTransactions = showAllDuplicates
    ? transactions
    : transactions.filter(t => t.duplicateType !== 'none' ? false : true);

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
          <h2 className="text-xl font-semibold mb-4">Upload NetSuite Export</h2>
          
          {/* File Upload Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">File Upload</h3>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
            <div className="flex items-center gap-4">
              <label htmlFor="file-upload" className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors font-semibold shadow-sm">
                Choose File
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {file && <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>}
            </div>
          </div>

          {/* Description Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
            <label htmlFor="upload-description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              id="upload-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this upload"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Replace Upload Section */}
          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
              <span className="font-semibold">Note:</span> When you replace an upload, the original upload and its transactions are never deleted. You can always view previous uploads and preserved transactions in the Upload Sessions tab.
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Replace Options</h3>
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="replaceMode"
                checked={replaceMode}
                onChange={(e) => {
                  setReplaceMode(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedSessionToReplace('');
                    setShowReplaceOptions(false);
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="replaceMode" className="ml-2 block text-sm font-medium text-gray-900">
                Replace existing upload
              </label>
            </div>
            {replaceMode && (
              <div className="ml-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select session to replace
                  </label>
                  <select
                    value={selectedSessionToReplace}
                    onChange={(e) => {
                      setSelectedSessionToReplace(e.target.value);
                      setShowReplaceOptions(!!e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a session...</option>
                    {sessions
                      .filter(session => session.status === 'completed')
                      .map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.description ? session.description : 'No description'} — {session.originalFilename} — {new Date(session.createdAt).toLocaleDateString()}
                        </option>
                      ))}
                  </select>
                </div>
                {showReplaceOptions && (
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Preservation Options</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="preserveConfirmedMatches"
                          checked={preserveConfirmedMatches}
                          onChange={(e) => setPreserveConfirmedMatches(e.target.checked)}
                          disabled={forceReplace}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="preserveConfirmedMatches" className="ml-2 block text-sm text-gray-900">
                          Preserve confirmed matches
                          <span className="ml-1 text-xs text-gray-500" title="Copies confirmed and added-to-ledger transactions from the previous upload into the new session. The original upload remains visible for audit.">
                            (copies confirmed/added-to-ledger; original upload is preserved)
                          </span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="preserveAllMatches"
                          checked={preserveAllMatches}
                          onChange={(e) => setPreserveAllMatches(e.target.checked)}
                          disabled={forceReplace || preserveConfirmedMatches}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="preserveAllMatches" className="ml-2 block text-sm text-gray-900">
                          Preserve all matches
                          <span className="ml-1 text-xs text-gray-500" title="Copies all matched, confirmed, and added-to-ledger transactions from the previous upload into the new session. The original upload remains visible for audit.">
                            (copies matched/confirmed/added-to-ledger; original upload is preserved)
                          </span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="forceReplace"
                          checked={forceReplace}
                          onChange={(e) => {
                            setForceReplace(e.target.checked);
                            if (e.target.checked) {
                              setPreserveConfirmedMatches(false);
                              setPreserveAllMatches(false);
                            }
                          }}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label htmlFor="forceReplace" className="ml-2 block text-sm text-red-700 font-medium">
                          Force replace
                          <span className="ml-1 text-xs text-gray-500" title="No transactions are preserved. The new session will only contain transactions from the new file. The original upload is still preserved for audit.">
                            (no transactions preserved; original upload is preserved)
                          </span>
                        </label>
                      </div>
                    </div>
                    {forceReplace && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700">
                          ⚠️ Warning: This will not copy any transactions from the previous upload. The original upload will still be visible for audit/history.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Saved Configurations */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Configuration</h3>
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
          </div>

          {/* Column Mapping */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Column Mapping</h3>
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

          <div className="flex justify-end mt-10">
            <button
              type="button"
              onClick={handleUpload}
              disabled={loading || !file}
              className={`px-6 py-3 rounded-md font-semibold shadow-sm transition-colors ${loading || !file ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              aria-busy={loading}
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
                  <tr key={session.id} className={`hover:bg-gray-50 ${session.status === 'replaced' ? 'bg-gray-100 opacity-70' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.originalFilename}
                          {session.status === 'replaced' && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-gray-300 text-gray-700 border border-gray-400">Replaced</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.description}
                        </div>
                        {session.status === 'replaced' && session.replacedBySessionId && (
                          <div className="mt-1 text-xs text-blue-700">
                            <button
                              className="underline hover:text-blue-900"
                              onClick={() => loadSessionDetails(session.replacedBySessionId!)}
                            >
                              View Replacement Session
                            </button>
                          </div>
                        )}
                        {session.status !== 'replaced' && session.replacedBySessionId && (
                          <div className="mt-1 text-xs text-blue-700">
                            <button
                              className="underline hover:text-blue-900"
                              onClick={() => loadSessionDetails(session.replacedBySessionId!)}
                            >
                              View Replacement Session
                            </button>
                          </div>
                        )}
                        {/* If this session is a replacement, show link to original */}
                        {sessions.some(s => s.replacedBySessionId === session.id) && (
                          <div className="mt-1 text-xs text-blue-700">
                            <button
                              className="underline hover:text-blue-900"
                              onClick={() => {
                                const original = sessions.find(s => s.replacedBySessionId === session.id);
                                if (original) loadSessionDetails(original.id);
                              }}
                            >
                              View Original Session
                            </button>
                          </div>
                        )}
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
                      {session.status === 'replaced' && (
                        <span className="text-gray-400">Replaced</span>
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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Transaction Matching</h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentSession.originalFilename} - {currentSession.matchedRecords} matched, {currentSession.unmatchedRecords} unmatched
              </p>
            </div>
            <button
              className={`px-4 py-2 rounded-md font-semibold border transition-colors ${showAllDuplicates ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400'}`}
              onClick={() => setShowAllDuplicates(v => !v)}
            >
              {showAllDuplicates ? 'Hide Duplicates' : 'Show All'}
            </button>
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
                {displayedTransactions.map((transaction: ImportTransaction) => {
                  const potentialMatches = potentialMatchesMap[transaction.id] || [];
                  const rejectedMatches = transaction.rejectedMatches || [];
                  const hasPotentialMatches = potentialMatches.length > 0;
                  const hasRejectedMatches = rejectedMatches.length > 0;
                  return (
                    <tr key={transaction.id} className={`hover:bg-gray-50 ${transaction.duplicateType === 'different_info' ? 'bg-yellow-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.vendorName || 'Unknown Vendor'}
                            {transaction.preservedFromSessionId && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800 border border-blue-300 cursor-pointer"
                                title="View original session"
                                onClick={() => loadSessionDetails(transaction.preservedFromSessionId!)}
                              >
                                Preserved from previous upload
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.description || 'No description'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {`${Number(transaction.amount).toFixed(2)} - ${transaction.transactionDate || 'No date'}`}
                          </div>
                          {transaction.duplicateType === 'different_info' && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded bg-yellow-200 text-yellow-900 border border-yellow-400">
                              Duplicate: Different Info
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                          ${transaction.status === 'rejected' || (transaction.status === 'matched' && (!potentialMatchesMap[transaction.id] || potentialMatchesMap[transaction.id].length === 0) && transaction.rejectedMatches && transaction.rejectedMatches.length > 0)
                            ? 'text-red-600 bg-red-100'
                          : transaction.status === 'confirmed'
                            ? 'text-green-700 bg-green-100'
                          : transaction.status === 'unmatched'
                            ? 'text-gray-700 bg-gray-200'
                          : transaction.status === 'matched'
                            ? 'text-blue-700 bg-blue-100'
                          : 'text-gray-700 bg-gray-200' 
                        }`}>
                          {
                            (transaction.status === 'matched' && (!potentialMatchesMap[transaction.id] || potentialMatchesMap[transaction.id].length === 0) && transaction.rejectedMatches && transaction.rejectedMatches.length > 0)
                              ? 'rejected'
                            : transaction.status || 'unmatched'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.matchConfidence ? `${(transaction.matchConfidence * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(() => {
                          if (transaction.status === 'matched' && hasPotentialMatches) {
                            return (
                              <button
                                onClick={() => handleReviewMatch(transaction, potentialMatches)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Review Match
                              </button>
                            );
                          }
                          if ((!hasPotentialMatches && hasRejectedMatches && transaction.status === 'matched')) {
                            return (
                              <button
                                onClick={() => handleReviewMatch(transaction, [])}
                                className="text-red-600 hover:text-red-900"
                              >
                                Review Rejected Matches
                              </button>
                            );
                          }
                          return null;
                        })()}
                        {transaction.status === 'unmatched' && (
                          <button
                            onClick={() => {
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
                        {(transaction.status === 'confirmed' || transaction.status === 'rejected' || transaction.status === 'added_to_ledger') && (
                          <span className="text-gray-400">{transaction.status}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Match Review Modal */}
          {showMatchModal && modalTransaction && (
            <TransactionMatchModal
              isOpen={showMatchModal}
              onClose={handleCloseMatchModal}
              transaction={modalTransaction}
              potentialLedgerEntries={modalMatches}
              rejectedLedgerEntries={rejectedLedgerEntries}
              onConfirm={handleModalConfirm}
              onReject={handleModalReject}
              onUndoReject={handleModalUndoReject}
            />
          )}
        </div>
      )}

      {/* Force Replace Confirmation Modal */}
      {showForceReplaceConfirm && pendingUploadData && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 border-2 border-red-200">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Force Replace Confirmation</h3>
              <p className="text-lg text-gray-700 mb-4">
                Are you sure you want to force replace this upload?
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h4 className="text-lg font-semibold text-red-800 mb-3">⚠️ This action will:</h4>
              <ul className="text-red-700 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Mark <strong>ALL transactions</strong> in the original upload as <strong>REPLACED</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Remove/reverse</strong> any actuals that were added to ledger entries from confirmed matches</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Clear</strong> any invoice numbers and notes that were added to ledger entries</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Create a <strong>new upload session</strong> with only the transactions from the new file</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">📋 Audit Trail:</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• The original upload will be preserved and marked as "replaced"</li>
                <li>• All reversals will be logged with detailed audit notes</li>
                <li>• You can always view the original upload and see what was reversed</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => {
                  setShowForceReplaceConfirm(false);
                  setPendingUploadData(null);
                }}
                className="px-6 py-3 text-base font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={performUpload}
                disabled={loading}
                className="px-6 py-3 text-base font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Yes, Force Replace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ImportPage; 