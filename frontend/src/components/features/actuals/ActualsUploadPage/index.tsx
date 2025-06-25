import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../../layout';
import { useActuals } from '../../../../hooks/useActuals';
import { useActualsConfig } from '../../../../hooks/useActualsConfig';
import { useActualsUpload } from '../../../../hooks/useActualsUpload';
import { useActualsTransactions } from '../../../../hooks/useActualsTransactions';
import { ImportTransaction } from '../../../../types/actuals';

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

const ActualsUploadPage: React.FC = () => {
  const { id: programId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'upload' | 'sessions' | 'matching'>('upload');

  // Use our hooks for data management
  const {
    sessions,
    currentSession,
    transactions,
    savedConfigs,
    programs,
    loading,
    error,
    sessionMatchCounts,
    loadSessions,
    loadSavedConfigs,
    loadPrograms,
    loadSessionDetails,
    updateSessionMatchCounts,
    setCurrentSession,
    setTransactions,
    setError
  } = useActuals(programId!);

  const {
    config,
    setConfig,
    selectedConfigId,
    setSelectedConfigId,
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
    setSelectedConfigForSave,
    handleConfigSelect,
    handleSaveConfig,
    handleCopyConfig,
    resetConfigForm,
    resetCopyForm
  } = useActualsConfig(programId!, savedConfigs);

  const {
    file,
    setFile,
    description,
    setDescription,
    loading: uploadLoading,
    setLoading: setUploadLoading,
    error: uploadError,
    setError: setUploadError,
    uploadResult,
    setUploadResult,
    replaceMode,
    setReplaceMode,
    selectedSessionToReplace,
    setSelectedSessionToReplace,
    preserveConfirmedMatches,
    setPreserveConfirmedMatches,
    preserveAllMatches,
    setPreserveAllMatches,
    forceReplace,
    setForceReplace,
    showReplaceOptions,
    setShowReplaceOptions,
    showForceReplaceConfirm,
    setShowForceReplaceConfirm,
    pendingUploadData,
    setPendingUploadData,
    performUpload,
    handleFileChange: hookHandleFileChange,
    handleReplaceModeChange,
    handleSessionToReplaceChange,
    resetUploadForm
  } = useActualsUpload(programId!);

  const {
    potentialMatchesMap,
    setPotentialMatchesMap,
    rejectedLedgerEntries,
    setRejectedLedgerEntries,
    confirmMatch,
    addToLedger,
    handleReviewMatch,
    handleModalConfirm,
    handleModalReject,
    handleModalUndoReject,
    fetchBatchData,
    handleIgnoreDuplicate,
    handleRejectDuplicate,
    handleAcceptAndReplaceOriginal,
    handleForceSmartMatching,
    cancelSession
  } = useActualsTransactions();

  // Modal state
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [modalTransaction, setModalTransaction] = useState<ImportTransaction | null>(null);
  const [modalMatches, setModalMatches] = useState<any[]>([]);
  const [modalMatchIndex, setModalMatchIndex] = useState(0);
  const [modalMatch, setModalMatch] = useState<any>(null);
  const [showAllDuplicates, setShowAllDuplicates] = useState(false);

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file) return;
    
    try {
      await performUpload(config);
      // Refresh sessions after upload
      await loadSessions();
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  // Handle replace upload
  const handleReplaceUpload = async () => {
    if (!file) return;
    
    try {
      await performUpload(config);
      // Refresh sessions after upload
      await loadSessions();
    } catch (err) {
      console.error('Replace upload failed:', err);
    }
  };

  // Handle session click
  const handleSessionClick = async (sessionId: string) => {
    await loadSessionDetails(sessionId);
    setActiveTab('matching');
  };

  // Handle session cancellation
  const handleSessionCancel = async (sessionId: string) => {
    try {
      await cancelSession(sessionId);
      await loadSessions();
    } catch (err) {
      console.error('Failed to cancel session:', err);
    }
  };

  // Handle match review
  const handleReviewMatchClick = async (transaction: ImportTransaction, matches: any[]) => {
    try {
      const result = await handleReviewMatch(transaction, matches);
      if (result) {
        setModalTransaction(transaction);
        setModalMatches(result.potentialMatches);
        setModalMatchIndex(0);
        setModalMatch(result.potentialMatches[0] || null);
        setShowMatchModal(true);
      }
    } catch (err) {
      console.error('Failed to load match data:', err);
    }
  };

  // Handle modal close
  const handleCloseMatchModal = () => {
    setShowMatchModal(false);
    setModalTransaction(null);
    setModalMatches([]);
    setModalMatchIndex(0);
    setModalMatch(null);
  };

  // Handle modal confirm
  const handleModalConfirmClick = async () => {
    if (modalTransaction && modalMatch) {
      try {
        await handleModalConfirm(modalTransaction, modalMatch);
        handleCloseMatchModal();
        // Refresh session details
        if (currentSession) {
          await loadSessionDetails(currentSession.id);
        }
      } catch (err) {
        console.error('Failed to confirm match:', err);
      }
    }
  };

  // Handle modal reject
  const handleModalRejectClick = async (ledgerEntry: any) => {
    if (modalTransaction) {
      try {
        await handleModalReject(modalTransaction, ledgerEntry);
        // Refresh session details
        if (currentSession) {
          await loadSessionDetails(currentSession.id);
        }
      } catch (err) {
        console.error('Failed to reject match:', err);
      }
    }
  };

  // Handle modal undo reject
  const handleModalUndoRejectClick = async (ledgerEntry: any) => {
    if (modalTransaction) {
      try {
        await handleModalUndoReject(modalTransaction, ledgerEntry);
        // Refresh session details
        if (currentSession) {
          await loadSessionDetails(currentSession.id);
        }
      } catch (err) {
        console.error('Failed to undo reject:', err);
      }
    }
  };

  // Load batch data when transactions change
  useEffect(() => {
    if (transactions.length > 0 && activeTab === 'matching') {
      fetchBatchData(transactions);
    }
  }, [transactions, activeTab]);

  // Update session match counts when sessions change
  useEffect(() => {
    if (activeTab === 'sessions' && sessions.length > 0) {
      sessions.forEach(session => {
        if (!sessionMatchCounts[session.id]) {
          updateSessionMatchCounts(session.id);
        }
      });
    }
  }, [activeTab, sessions]);

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
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upload
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
              onReplaceModeChange={handleReplaceModeChange}
              onSessionToReplaceChange={handleSessionToReplaceChange}
              onPreserveConfirmedMatchesChange={setPreserveConfirmedMatches}
              onPreserveAllMatchesChange={setPreserveAllMatches}
              onForceReplaceChange={setForceReplace}
            />

            <ConfigSection
              config={config}
              setConfig={setConfig}
              savedConfigs={savedConfigs}
              selectedConfigId={selectedConfigId}
              onConfigSelect={handleConfigSelect}
              onSaveConfig={handleSaveConfig}
              onCopyConfig={handleCopyConfig}
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
              progress={uploadLoading ? 50 : 100}
              status={uploadLoading ? 'Processing file...' : 'Complete'}
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
            onForceSmartMatching={() => handleForceSmartMatching(programId!)}
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
              potentialMatchesMap={potentialMatchesMap}
              onReviewMatch={handleReviewMatchClick}
              onAddToLedger={addToLedger}
              onIgnoreDuplicate={handleIgnoreDuplicate}
              onRejectDuplicate={handleRejectDuplicate}
              onAcceptAndReplaceOriginal={handleAcceptAndReplaceOriginal}
              showAllDuplicates={showAllDuplicates}
              onToggleShowAllDuplicates={() => setShowAllDuplicates(!showAllDuplicates)}
            />
          </div>
        )}

        {/* Match Review Modal */}
        {showMatchModal && modalTransaction && (
          <TransactionMatchModal
            isOpen={showMatchModal}
            onClose={handleCloseMatchModal}
            transaction={modalTransaction}
            potentialLedgerEntries={modalMatches}
            rejectedLedgerEntries={rejectedLedgerEntries}
            onConfirm={handleModalConfirmClick}
            onReject={handleModalRejectClick}
            onUndoReject={handleModalUndoRejectClick}
            sessionFilename={currentSession?.originalFilename}
          />
        )}
      </div>
    </Layout>
  );
};

export default ActualsUploadPage; 