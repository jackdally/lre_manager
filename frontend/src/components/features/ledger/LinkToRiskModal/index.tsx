import React, { useEffect, useState } from 'react';

interface LinkToRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  entry: any | null;
  onLinked?: () => void;
}

const LinkToRiskModal: React.FC<LinkToRiskModalProps> = ({ isOpen, onClose, programId, entry, onLinked }) => {
  const [riskId, setRiskId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState('Medium');
  const [newProbability, setNewProbability] = useState<number>(50);

  useEffect(() => {
    let handle: any;
    if (!programId) return;
    if (!search) { setResults([]); return; }
    setLoadingSearch(true);
    handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/programs/${programId}/risks?search=${encodeURIComponent(search)}&sortBy=createdAt&sortOrder=DESC`);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
        }
      } finally {
        setLoadingSearch(false);
      }
    }, 300);
    return () => { if (handle) clearTimeout(handle); };
  }, [search, programId]);

  if (!isOpen || !entry) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/programs/${programId}/ledger/${entry.id}/link-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskId: riskId || null })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to link risk');
      }
      onClose();
      if (onLinked) onLinked();
    } catch (err: any) {
      setError(err.message || 'Failed to link risk');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Link to Risk</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
        </div>

        <div className="mb-4 p-3 rounded bg-gray-50">
          <div className="text-sm text-gray-700"><span className="font-medium">Ledger Entry:</span> {entry.expense_description}</div>
          <div className="text-sm text-gray-700"><span className="font-medium">Vendor:</span> {entry.vendor_name}</div>
          {entry.risk && (
            <div className="text-sm text-green-700 mt-1"><span className="font-medium">Currently Linked Risk:</span> {entry.risk.title || entry.risk.id}</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk ID</label>
            <input
              type="text"
              value={riskId}
              onChange={(e) => setRiskId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter existing Risk ID"
            />
            <p className="mt-1 text-xs text-gray-500">Enter an existing Risk ID to link. Leave blank to unlink.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search risks</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by title or description"
            />
            <div className="mt-2 max-h-40 overflow-auto border border-gray-200 rounded">
              {loadingSearch && <div className="p-2 text-xs text-gray-500">Searching…</div>}
              {!loadingSearch && results.length === 0 && search && (
                <div className="p-2 text-xs text-gray-500">No risks found</div>
              )}
              {!loadingSearch && results.map(r => (
                <button
                  type="button"
                  key={r.id}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                  onClick={() => setRiskId(r.id)}
                >
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-gray-500">{r.wbsElement?.code || ''} · Sev {r.severity} · Prob {r.probability}%</div>
                </button>
              ))}
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Link'}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t">
          <div className="text-sm font-medium mb-2">Create new risk</div>
          <div className="space-y-2">
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Risk title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            <div className="flex gap-2">
              <select className="px-3 py-2 border rounded-md" value={newSeverity} onChange={e => setNewSeverity(e.target.value)}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <input
                type="number"
                className="px-3 py-2 border rounded-md w-28"
                value={newProbability}
                onChange={e => setNewProbability(Number(e.target.value))}
                min={0}
                max={100}
              />
              <button
                type="button"
                className="ml-auto px-3 py-2 bg-gray-800 text-white rounded-md disabled:opacity-50"
                disabled={!newTitle || isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  setError(null);
                  try {
                    const res = await fetch(`/api/programs/${programId}/risks`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: newTitle,
                        severity: newSeverity,
                        probability: newProbability,
                        costImpactMin: 0,
                        costImpactMostLikely: 0,
                        costImpactMax: 0,
                      })
                    });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      throw new Error(data.message || 'Failed to create risk');
                    }
                    const created = await res.json();
                    setRiskId(created.id);
                    setNewTitle('');
                  } catch (e: any) {
                    setError(e.message || 'Failed to create risk');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                Create and select
              </button>
            </div>
            <p className="text-xs text-gray-500">Defaults impact to 0; you can edit full details later.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkToRiskModal;


