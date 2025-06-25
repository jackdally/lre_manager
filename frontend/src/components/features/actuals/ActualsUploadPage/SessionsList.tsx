import React from 'react';
import { formatCurrency } from '../../../../utils/formatters';

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
  confirmedRecords?: number;
  rejectedRecords?: number;
  replacedRecords?: number;
  addedToLedgerRecords?: number;
  createdAt: string;
  updatedAt: string;
  replacedBySessionId?: string | null;
}

interface SessionsListProps {
  sessions: ImportSession[];
  sessionMatchCounts: Record<string, { matched: number; unmatched: number; duplicates: number; allDispositioned: boolean }>;
  onSessionClick: (sessionId: string) => void;
  onCancelSession: (sessionId: string) => void;
  onForceSmartMatching?: () => void;
  loading?: boolean;
  error?: string | null;
}

const SessionsList: React.FC<SessionsListProps> = ({
  sessions,
  sessionMatchCounts,
  onSessionClick,
  onCancelSession,
  onForceSmartMatching,
  loading,
  error
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      case 'replaced': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'failed': return '❌';
      case 'cancelled': return '🚫';
      case 'replaced': return '🔄';
      default: return '❓';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Upload Sessions</h2>
        {onForceSmartMatching && (
          <div className="flex items-center gap-3">
            <button
              onClick={onForceSmartMatching}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              Force Smart Matching
            </button>
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>
        )}
      </div>
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
                Matches
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
            {sessions.map((session) => {
              const counts = sessionMatchCounts[session.id];
              return (
                <tr key={session.id} className={`hover:bg-gray-50 ${(session.status === 'replaced' || session.status === 'cancelled') ? 'bg-gray-100 opacity-70' : ''}`}>
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
                            onClick={() => onSessionClick(session.replacedBySessionId!)}
                          >
                            View Replacement Session
                          </button>
                        </div>
                      )}
                      {session.status !== 'replaced' && session.replacedBySessionId && (
                        <div className="mt-1 text-xs text-blue-700">
                          <button
                            className="underline hover:text-blue-900"
                            onClick={() => onSessionClick(session.replacedBySessionId!)}
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
                              if (original) onSessionClick(original.id);
                            }}
                          >
                            View Original Session
                          </button>
                        </div>
                      )}
                      <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        {/* Inline status summary for this session */}
                        <span className="font-semibold text-green-700">{session.confirmedRecords || 0} confirmed</span>,
                        <span className="font-semibold text-green-700">{session.addedToLedgerRecords || 0} added to ledger</span>,
                        <span className="font-semibold text-red-600">{session.rejectedRecords || 0} rejected</span>,
                        <span className="font-semibold text-orange-600">{session.replacedRecords || 0} replaced</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      session.status === 'completed' && (session.matchedRecords > 0 || session.unmatchedRecords > 0)
                        ? 'text-blue-700 bg-blue-100'
                        : session.status === 'completed'
                          ? 'text-green-700 bg-green-100'
                          : session.status === 'pending'
                            ? 'text-yellow-800 bg-yellow-100'
                          : session.status === 'processing'
                            ? 'text-purple-700 bg-purple-100'
                          : session.status === 'failed'
                            ? 'text-red-700 bg-red-100'
                          : session.status === 'cancelled'
                            ? 'text-gray-500 bg-gray-200'
                          : session.status === 'replaced'
                            ? 'text-yellow-800 bg-yellow-100'
                          : getStatusColor(session.status)
                    }`}>
                      {session.status === 'completed' && (session.matchedRecords > 0 || session.unmatchedRecords > 0)
                        ? 'in review'
                        : session.status === 'completed'
                          ? 'completed'
                          : session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.processedRecords} / {session.totalRecords}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(() => {
                      const counts = sessionMatchCounts[session.id] || { matched: session.matchedRecords, unmatched: session.unmatchedRecords, duplicates: 0, allDispositioned: false };
                      const parts = [];
                      if (counts.allDispositioned) {
                        return (
                          <span className="font-semibold text-green-700 flex items-center">
                            All transactions dispositioned
                            <svg className="ml-1 w-4 h-4 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        );
                      }
                      if (counts.matched > 0) parts.push(`${counts.matched} matched`);
                      if (counts.unmatched > 0) parts.push(`${counts.unmatched} unmatched`);
                      if (counts.duplicates > 0) parts.push(`${counts.duplicates} duplicate${counts.duplicates > 1 ? 's' : ''}`);
                      return <span>{parts.join(', ')}</span>;
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {session.status === 'completed' && (
                      <button
                        onClick={() => onSessionClick(session.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Review Matches
                      </button>
                    )}
                    {(session.status === 'pending' || session.status === 'processing') && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to cancel this session?')) {
                            onCancelSession(session.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 ml-2"
                      >
                        Cancel
                      </button>
                    )}
                    {session.status === 'replaced' && (
                      <button
                        onClick={() => onSessionClick(session.id)}
                        className="text-gray-400 underline hover:text-blue-600 cursor-pointer"
                        style={{ padding: 0, background: 'none', border: 'none' }}
                      >
                        Replaced
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sessions.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          No upload sessions found.
        </div>
      )}
    </div>
  );
};

export default SessionsList; 