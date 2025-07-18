import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

interface ActualsUploadSession {
  id: string;
  filename: string;
  originalFilename?: string;
  description?: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  errorRecords: number;
  createdAt: string;
  updatedAt: string;
  programId?: string;
}

interface ActualsUploadTransaction {
  id: string;
  vendorName: string;
  description: string;
  amount: number;
  transactionDate: string;
  status: string;
  matchConfidence?: number;
  matchedLedgerEntry?: {
    id: string;
    vendor_name: string;
    expense_description: string;
  } | null;
}

const UploadSessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<ActualsUploadSession | null>(null);
  const [transactions, setTransactions] = useState<ActualsUploadTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/import/session/${id}/details`);
        if (!res.ok) throw new Error('Failed to fetch upload session details');
        const data = await res.json();
        console.log('Upload session details:', data);
        setSession(data.session);
        setTransactions(data.transactions);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!session) return <div className="p-8">Upload session not found.</div>;

  const programId = session.programId || (session as any).program?.id;

  // Sort transactions by status order: Matched, Confirmed, Rejected, Unmatched, Replaced
  const statusOrder = [
    'matched',
    'confirmed',
    'rejected',
    'unmatched',
    'replaced',
  ];
  const sortedTransactions = [...transactions].sort((a, b) => {
    const aIndex = statusOrder.indexOf(a.status.toLowerCase());
    const bIndex = statusOrder.indexOf(b.status.toLowerCase());
    // If not found, put at the end
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Upload Session Details</h1>
      <div className="mb-6 bg-gray-50 p-4 rounded shadow">
        <div><b>Filename:</b> {session.originalFilename || session.filename}</div>
        {session.description && <div><b>Description:</b> {session.description}</div>}
        <div><b>Status:</b> {session.status}</div>
        <div><b>Created:</b> {new Date(session.createdAt).toLocaleString()}</div>
        <div><b>Records:</b> {session.processedRecords} processed / {session.totalRecords} total</div>
        <div><b>Matched:</b> {session.matchedRecords} | <b>Unmatched:</b> {session.unmatchedRecords} | <b>Error:</b> {session.errorRecords}</div>
        {session.programId && <div><Link to={`/programs/${session.programId}`}>Back to Program</Link></div>}
      </div>
      <h2 className="text-xl font-semibold mb-2">Transactions</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-2 py-1 border">Vendor</th>
              <th className="px-2 py-1 border">Description</th>
              <th className="px-2 py-1 border">Amount</th>
              <th className="px-2 py-1 border">Date</th>
              <th className="px-2 py-1 border">Status</th>
              <th className="px-2 py-1 border">Matched Ledger</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map(tx => (
              <tr key={tx.id}>
                <td className="px-2 py-1 border">{tx.vendorName}</td>
                <td className="px-2 py-1 border">{tx.description}</td>
                <td className="px-2 py-1 border">${Number(tx.amount).toFixed(2)}</td>
                <td className="px-2 py-1 border">{tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : ''}</td>
                <td className="px-2 py-1 border">{tx.status}</td>
                <td className="px-2 py-1 border">
                  {(tx.matchedLedgerEntry && (tx.status === 'confirmed' || tx.status === 'added_to_ledger')) ? (
                    <div>
                      <Link to={`/programs/${programId}/ledger?highlight=${tx.matchedLedgerEntry.id}`} className="text-blue-600 underline hover:text-blue-800">
                        View Ledger
                      </Link>
                      <div className="text-xs text-gray-500">ID: {tx.matchedLedgerEntry.id}</div>
                    </div>
                  ) : (
                    <div>
                      <span>--</span>
                      <div className="text-xs text-gray-500">No match</div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UploadSessionDetails; 