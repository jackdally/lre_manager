import React from 'react';

interface ActualsUploadSession {
  id: string;
  filename: string;
  originalFilename: string;
  description: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  errorRecords: number;
  createdAt: string;
  updatedAt: string;
}

interface ReplaceUploadSectionProps {
  replaceMode: boolean;
  selectedSessionToReplace: string;
  showReplaceOptions: boolean;
  preserveConfirmedMatches: boolean;
  preserveAllMatches: boolean;
  forceReplace: boolean;
  sessions: ActualsUploadSession[];
  onReplaceModeChange: (checked: boolean) => void;
  onSessionToReplaceChange: (sessionId: string) => void;
  onPreserveConfirmedMatchesChange: (checked: boolean) => void;
  onPreserveAllMatchesChange: (checked: boolean) => void;
  onForceReplaceChange: (checked: boolean) => void;
}

const ReplaceUploadSection: React.FC<ReplaceUploadSectionProps> = ({
  replaceMode,
  selectedSessionToReplace,
  showReplaceOptions,
  preserveConfirmedMatches,
  preserveAllMatches,
  forceReplace,
  sessions,
  onReplaceModeChange,
  onSessionToReplaceChange,
  onPreserveConfirmedMatchesChange,
  onPreserveAllMatchesChange,
  onForceReplaceChange
}) => {
  return (
    <>
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
            onChange={(e) => onReplaceModeChange(e.target.checked)}
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
                onChange={(e) => onSessionToReplaceChange(e.target.value)}
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
                      onChange={(e) => onPreserveConfirmedMatchesChange(e.target.checked)}
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
                      onChange={(e) => onPreserveAllMatchesChange(e.target.checked)}
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
                      onChange={(e) => onForceReplaceChange(e.target.checked)}
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
    </>
  );
};

export default ReplaceUploadSection; 