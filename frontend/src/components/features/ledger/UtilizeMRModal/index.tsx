import React, { useState, useEffect } from 'react';

interface UtilizeMRModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  entry: any | null;
  onUtilized?: () => void;
}

const UtilizeMRModal: React.FC<UtilizeMRModalProps> = ({ isOpen, onClose, programId, entry, onUtilized }) => {
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entry) {
      setAmount(entry.actual_amount != null ? String(entry.actual_amount) : '');
    }
  }, [entry]);

  if (!isOpen || !entry) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const body: any = { amount: amount ? Number(amount) : undefined, reason };
      if (entry.riskId) body.riskId = entry.riskId;
      const res = await fetch(`/api/programs/${programId}/ledger/${entry.id}/utilize-mr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to utilize MR');
      }
      onClose();
      if (onUtilized) onUtilized();
    } catch (err: any) {
      setError(err.message || 'Failed to utilize MR');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Utilize MR</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
        </div>

        <div className="mb-4 p-3 rounded bg-gray-50 text-sm text-gray-700">
          <div><span className="font-medium">Ledger Entry:</span> {entry.expense_description}</div>
          <div><span className="font-medium">Actual Amount:</span> {entry.actual_amount != null ? entry.actual_amount : '--'}</div>
          {(!entry.risk && !entry.riskId) && (
            <div className="text-red-600 mt-1">No risk linked. Provide a reason and ensure a risk is linked before finalizing MR utilization.</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Reason for MR utilization"
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">
              {isSubmitting ? 'Processing...' : 'Utilize MR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UtilizeMRModal;


