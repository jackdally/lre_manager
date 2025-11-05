import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../../layout';
import { programSetupApi } from '../../../../services/programSetupApi';
import {
  useActualsSessions,
  useActualsCurrentSession,
  useActualsTransactions,
  useActualsSavedConfigs,
  useActualsPrograms,
  useActualsSessionMatchCounts,
  useActualsUI,
  useActualsInitialize,
  useActualsLoadSessionDetails,
  useActualsCancelSession,
  useActualsForceSmartMatching,
  useActualsPerformUpload,
  useActualsPerformReplaceUpload,
  useActualsHandleConfigSelect,
  useActualsHandleSaveConfig,
  useActualsHandleCopyConfig,
  useActualsSetActiveTab,
  useActualsSetShowAllDuplicates,
  useActualsSetLoading,
  useActualsSetError,
  useActualsSetShowErrorModal,
  useActualsSetToast,
  useActualsSetUploadLoading,
  useActualsSetUploadError,
  useActualsSetUploadResult,
  useActualsSetUploadProgress,
  useActualsSetUploadStatus,
  useActualsSetShowSaveConfig,
  useActualsSetShowCopyConfig,
  useActualsSetConfigName,
  useActualsSetConfigDescription,
  useActualsSetIsDefaultConfig,
  useActualsSetIsGlobalConfig,
  useActualsSetCopyTargetProgramId,
  useActualsSetCopyConfigName,
  useActualsSetCopyConfigDescription,
  useActualsSetCopyIsDefault,
  useActualsSetSelectedConfigForCopy,
  useActualsSetSelectedConfigForSave,
  useActualsSetReplaceMode,
  useActualsSetSelectedSessionToReplace,
  useActualsSetPreserveConfirmedMatches,
  useActualsSetPreserveAllMatches,
  useActualsSetForceReplace,
  useActualsSetShowReplaceOptions,
  useActualsSetShowForceReplaceConfirm,
  useActualsSetPendingUploadData,
  useActualsUpdateSessionMatchCounts,
  useActualsClearError,
  useActualsClearToast,
  useActualsResetUI,
  useActualsCloseAddToLedgerModal
} from '../../../../store/actualsStore';
import { ActualsUploadConfig } from '../../../../types/actuals';

// Import the extracted components
import FileUploadSection from './FileUploadSection';
import ConfigSection from './ConfigSection';
import ReplaceUploadSection from './ReplaceUploadSection';
import UploadActions from './UploadActions';
import ProgramSelector from './ProgramSelector';
import UploadProgress from './UploadProgress';
import SessionsList from './SessionsList';
import TransactionMatchingTable from './TransactionMatchingTable';
import TransactionMatchModal from '../TransactionMatchModal/index';
import AddToLedgerModal from '../AddToLedgerModal/index';

const ActualsUploadPage: React.FC = () => {
  const { id: programId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Local state for file upload (not managed by store yet)
  const [file, setFile] = useState<File | null>(null);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<ActualsUploadConfig>({
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
    transactionIdColumn: 'Transaction ID',
    dateFormat: 'MM/DD/YYYY',
    amountTolerance: 0.01,
    matchThreshold: 0.7
  });
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');

  // Get state from store
  const sessions = useActualsSessions();
  const currentSession = useActualsCurrentSession();
  const transactions = useActualsTransactions();
  const savedConfigs = useActualsSavedConfigs();
  const programs = useActualsPrograms();
  const sessionMatchCounts = useActualsSessionMatchCounts();
  const ui = useActualsUI();

  // Get actions from store
  const initialize = useActualsInitialize();
  const loadSessionDetails = useActualsLoadSessionDetails();
  const cancelSession = useActualsCancelSession();
  const forceSmartMatching = useActualsForceSmartMatching();
  const performUpload = useActualsPerformUpload();
  const performReplaceUpload = useActualsPerformReplaceUpload();
  const handleConfigSelect = useActualsHandleConfigSelect();
  const handleSaveConfig = useActualsHandleSaveConfig();
  const handleCopyConfig = useActualsHandleCopyConfig();
  const setActiveTab = useActualsSetActiveTab();
  const setShowAllDuplicates = useActualsSetShowAllDuplicates();
  const setLoading = useActualsSetLoading();
  const setError = useActualsSetError();
  const setShowErrorModal = useActualsSetShowErrorModal();
  const setToast = useActualsSetToast();
  const setUploadLoading = useActualsSetUploadLoading();
  const setUploadError = useActualsSetUploadError();
  const setUploadResult = useActualsSetUploadResult();
  const setUploadProgress = useActualsSetUploadProgress();
  const setUploadStatus = useActualsSetUploadStatus();
  const setShowSaveConfig = useActualsSetShowSaveConfig();
  const setShowCopyConfig = useActualsSetShowCopyConfig();
  const setConfigName = useActualsSetConfigName();
  const setConfigDescription = useActualsSetConfigDescription();
  const setIsDefaultConfig = useActualsSetIsDefaultConfig();
  const setIsGlobalConfig = useActualsSetIsGlobalConfig();
  const setCopyTargetProgramId = useActualsSetCopyTargetProgramId();
  const setCopyConfigName = useActualsSetCopyConfigName();
  const setCopyConfigDescription = useActualsSetCopyConfigDescription();
  const setCopyIsDefault = useActualsSetCopyIsDefault();
  const setSelectedConfigForCopy = useActualsSetSelectedConfigForCopy();
  const setSelectedConfigForSave = useActualsSetSelectedConfigForSave();
  const setReplaceMode = useActualsSetReplaceMode();
  const setSelectedSessionToReplace = useActualsSetSelectedSessionToReplace();
  const setPreserveConfirmedMatches = useActualsSetPreserveConfirmedMatches();
  const setPreserveAllMatches = useActualsSetPreserveAllMatches();
  const setForceReplace = useActualsSetForceReplace();
  const setShowReplaceOptions = useActualsSetShowReplaceOptions();
  const setShowForceReplaceConfirm = useActualsSetShowForceReplaceConfirm();
  const setPendingUploadData = useActualsSetPendingUploadData();
  const updateSessionMatchCounts = useActualsUpdateSessionMatchCounts();
  const clearError = useActualsClearError();
  const clearToast = useActualsClearToast();
  const resetUI = useActualsResetUI();
  const closeAddToLedgerModal = useActualsCloseAddToLedgerModal();

  const {
    activeTab,
    loading,
    error,
    showErrorModal,
    uploadLoading,
    uploadError,
    uploadResult,
    uploadProgress,
    uploadStatus,
    showSaveConfig,
    showCopyConfig,
    configName,
    configDescription,
    isDefaultConfig,
    isGlobalConfig,
    copyTargetProgramId,
    copyConfigName,
    copyConfigDescription,
    copyIsDefault,
    selectedConfigForCopy,
    selectedConfigForSave,
    replaceMode,
    selectedSessionToReplace,
    preserveConfirmedMatches,
    preserveAllMatches,
    forceReplace,
    showReplaceOptions,
    showForceReplaceConfirm,
    pendingUploadData,
    showAddToLedgerModal,
    addToLedgerTransaction,
    toast
  } = ui;

  // Check setup status before allowing access
  useEffect(() => {
    const checkSetupStatus = async () => {
      if (!programId) {
        setCheckingSetup(false);
        return;
      }

      try {
        const setupStatus = await programSetupApi.getSetupStatus(programId);
        if (!setupStatus.setupComplete) {
          navigate(`/programs/${programId}/setup`);
          return;
        }
      } catch (error) {
        // If setup status check fails, continue to page (might be old program without setup status)
        console.warn('Could not check setup status, continuing to actuals page:', error);
      } finally {
        setCheckingSetup(false);
      }
    };

    checkSetupStatus();
  }, [programId, navigate]);

  // Initialize store when component mounts (after setup check)
  useEffect(() => {
    if (programId && !checkingSetup) {
      initialize(programId);
    }
  }, [programId, checkingSetup, initialize]);

  // Update session match counts when sessions change
  useEffect(() => {
    if (activeTab === 'sessions' && sessions.length > 0) {
      sessions.forEach(session => {
        if (!sessionMatchCounts[session.id]) {
          updateSessionMatchCounts(session.id);
        }
      });
    }
  }, [activeTab, sessions, sessionMatchCounts, updateSessionMatchCounts]);

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  // Handle config change
  const handleConfigChange = (newConfig: ActualsUploadConfig) => {
    setConfig(newConfig);
  };

  // Handle config select
  const handleConfigSelectWrapper = (configId: string) => {
    setSelectedConfigId(configId);
    const selectedConfig = savedConfigs.find(c => c.id === configId);
    if (selectedConfig) {
      setConfig(selectedConfig.columnMapping);
    }
  };

  // Handle save config
  const handleSaveConfigWrapper = async () => {
    if (!configName.trim()) return;

    try {
      await handleSaveConfig(config);
      setConfigName('');
      setConfigDescription('');
      setIsDefaultConfig(false);
      setIsGlobalConfig(false);
      setShowSaveConfig(false);
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  // Handle copy config
  const handleCopyConfigWrapper = async () => {
    if (!copyConfigName.trim() || !copyTargetProgramId) return;

    try {
      await handleCopyConfig(config, copyTargetProgramId);
      setCopyConfigName('');
      setCopyConfigDescription('');
      setCopyIsDefault(false);
      setCopyTargetProgramId('');
      setShowCopyConfig(false);
    } catch (err) {
      console.error('Failed to copy config:', err);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file) return;

    try {
      await performUpload(config, file, description);
      // Clear form after successful upload
      setFile(null);
      setDescription('');
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  // Handle replace upload
  const handleReplaceUpload = async () => {
    if (!file) return;

    try {
      await performReplaceUpload(config, file, description, selectedSessionToReplace);
      // Clear form after successful upload
      setFile(null);
      setDescription('');
    } catch (err) {
      console.error('Replace upload failed:', err);
    }
  };

  // Handle session click
  const handleSessionClick = async (sessionId: string) => {
    await loadSessionDetails(sessionId);
  };

  // Handle session cancellation
  const handleSessionCancel = async (sessionId: string) => {
    try {
      await cancelSession(sessionId);
    } catch (err) {
      console.error('Failed to cancel session:', err);
    }
  };

  // Handle clear all uploads
  const handleClearAllUploads = async () => {
    console.log('Clear all uploads clicked, programId:', programId);
    if (!programId) {
      console.log('No programId, returning');
      return;
    }

    if (!window.confirm('Are you sure you want to clear all upload data for this program? This action cannot be undone.')) {
      console.log('User cancelled the operation');
      return;
    }

    try {
      console.log('Starting clear operation...');
      setLoading(true);
      const url = `/api/import/${programId}/clear-all`;
      console.log('Making request to:', url);

      const response = await fetch(url, {
        method: 'DELETE',
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`Failed to clear upload data: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Success result:', result);
      setToast({ message: `Cleared ${result.deletedSessions} sessions and ${result.deletedFiles} files`, type: 'success' });

      // Refresh the sessions list
      console.log('Refreshing sessions...');
      initialize(programId);
    } catch (err: any) {
      console.error('Failed to clear upload data:', err);
      setError(err.message || 'Failed to clear upload data');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking setup status
  if (checkingSetup) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Actuals Upload</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload and process NetSuite export files for program actuals
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Upload
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Upload Sessions
            </button>
            {currentSession && (
              <button
                onClick={() => setActiveTab('matching')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'matching'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Transaction Matching
              </button>
            )}
          </nav>
          <div className="flex justify-end mt-2">
            <button
              onClick={handleClearAllUploads}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md border border-red-200 hover:border-red-300 transition-colors"
              disabled={loading}
            >
              {loading ? 'Clearing...' : 'Clear All Uploads'}
            </button>
          </div>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <FileUploadSection
              file={file}
              description={description}
              onFileChange={handleFileChange}
              onDescriptionChange={handleDescriptionChange}
            />

            <ReplaceUploadSection
              replaceMode={replaceMode}
              selectedSessionToReplace={selectedSessionToReplace}
              preserveConfirmedMatches={preserveConfirmedMatches}
              preserveAllMatches={preserveAllMatches}
              forceReplace={forceReplace}
              showReplaceOptions={showReplaceOptions}
              sessions={sessions}
              onReplaceModeChange={setReplaceMode}
              onSessionToReplaceChange={setSelectedSessionToReplace}
              onPreserveConfirmedMatchesChange={setPreserveConfirmedMatches}
              onPreserveAllMatchesChange={setPreserveAllMatches}
              onForceReplaceChange={setForceReplace}
            />

            <ConfigSection
              config={config}
              setConfig={handleConfigChange}
              savedConfigs={savedConfigs}
              selectedConfigId={selectedConfigId}
              onConfigSelect={handleConfigSelectWrapper}
              onSaveConfig={handleSaveConfigWrapper}
              onCopyConfig={handleCopyConfigWrapper}
              showSaveConfig={showSaveConfig}
              setShowSaveConfig={setShowSaveConfig}
              showCopyConfig={showCopyConfig}
              setShowCopyConfig={setShowCopyConfig}
              configName={configName}
              setConfigName={setConfigName}
              configDescription={configDescription}
              setConfigDescription={setConfigDescription}
              isDefaultConfig={isDefaultConfig}
              setIsDefaultConfig={setIsDefaultConfig}
              isGlobalConfig={isGlobalConfig}
              setIsGlobalConfig={setIsGlobalConfig}
              programs={programs}
              copyTargetProgramId={copyTargetProgramId}
              setCopyTargetProgramId={setCopyTargetProgramId}
              copyConfigName={copyConfigName}
              setCopyConfigName={setCopyConfigName}
              copyConfigDescription={copyConfigDescription}
              setCopyConfigDescription={setCopyConfigDescription}
              copyIsDefault={copyIsDefault}
              setCopyIsDefault={setCopyIsDefault}
              selectedConfigForCopy={selectedConfigForCopy}
              setSelectedConfigForCopy={setSelectedConfigForCopy}
              selectedConfigForSave={selectedConfigForSave}
              setSelectedConfigForSave={setSelectedConfigForSave}
            />

            <UploadActions
              selectedFile={file}
              selectedProgramId={programId!}
              isUploading={uploadLoading}
              onUpload={handleUpload}
              onReplaceUpload={handleReplaceUpload}
              canUpload={!!file && !!description}
              canReplace={replaceMode && !!selectedSessionToReplace}
            />

            <UploadProgress
              isUploading={uploadLoading}
              uploadResult={uploadResult}
              uploadError={uploadError}
              progress={uploadProgress}
              status={uploadStatus}
            />
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <SessionsList
            sessions={sessions}
            sessionMatchCounts={sessionMatchCounts}
            onSessionClick={handleSessionClick}
            onCancelSession={handleSessionCancel}
            onForceSmartMatching={() => forceSmartMatching(programId!)}
            loading={loading}
            error={error}
          />
        )}

        {/* Matching Tab */}
        {activeTab === 'matching' && currentSession && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Transaction Matching</h2>
              <p className="text-sm text-gray-600 mt-1">
                Session: {currentSession.description || currentSession.originalFilename}
              </p>
            </div>

            <TransactionMatchingTable
              transactions={transactions}
              currentSession={currentSession}
              programId={programId!}
            />
          </div>
        )}

        {/* Match Review Modal */}
        <TransactionMatchModal
          sessionFilename={currentSession?.originalFilename}
          programId={programId!}
        />

        {/* Add to Ledger Modal */}
        {showAddToLedgerModal && addToLedgerTransaction && (
          <AddToLedgerModal
            transaction={addToLedgerTransaction}
            onClose={closeAddToLedgerModal}
          />
        )}
      </div>
    </Layout>
  );
};

export default ActualsUploadPage; 