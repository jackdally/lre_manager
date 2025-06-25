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
}

const SessionsList: React.FC<SessionsListProps> = ({
  sessions,
  sessionMatchCounts,
  onSessionClick,
  onCancelSession
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
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Upload Sessions</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Session
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
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {session.description || 'No description'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {session.originalFilename}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {getStatusIcon(session.status)} {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.processedRecords} / {session.totalRecords}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {counts ? (
                        <>
                          <div>✅ {counts.matched}</div>
                          <div>❌ {counts.unmatched}</div>
                          {counts.duplicates > 0 && <div>🔄 {counts.duplicates}</div>}
                        </>
                      ) : (
                        <>
                          <div>✅ {session.matchedRecords}</div>
                          <div>❌ {session.unmatchedRecords}</div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onSessionClick(session.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View Details
                    </button>
                    {session.status === 'processing' && (
                      <button
                        onClick={() => onCancelSession(session.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
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