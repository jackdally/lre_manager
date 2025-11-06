import React, { useEffect, useState } from 'react';
import RiskFormModal from '../../riskOpportunity/RiskFormModal';
import type { Risk } from '../../../../store/riskOpportunityStore';

interface LinkToRiskModalProps {
    isOpen: boolean;
    onClose: () => void;
    programId: string;
    entry: any | null;
    onLinked?: () => void;
}

interface RiskWithMetadata {
    risk: Risk;
    sharedWithCount: number;
    isFromAllocation: boolean;
}

const LinkToRiskModal: React.FC<LinkToRiskModalProps> = ({ isOpen, onClose, programId, entry, onLinked }) => {
    const [linkedRisks, setLinkedRisks] = useState<RiskWithMetadata[]>([]);
    const [loadingRisks, setLoadingRisks] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    // Search state
    const [search, setSearch] = useState<string>('');
    const [searchResults, setSearchResults] = useState<Risk[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [selectedRiskIds, setSelectedRiskIds] = useState<Set<string>>(new Set());
    
    // Risk creation modal
    const [showRiskFormModal, setShowRiskFormModal] = useState(false);
    const [newRisk, setNewRisk] = useState<Risk | null>(null);
    

    // Load linked risks when modal opens
    useEffect(() => {
        if (isOpen && entry) {
            loadLinkedRisks();
        }
    }, [isOpen, entry]);

    const loadLinkedRisks = async () => {
        if (!entry) return;
        setLoadingRisks(true);
        try {
            const res = await fetch(`/api/programs/${programId}/ledger/${entry.id}/risks`);
            if (res.ok) {
                const data = await res.json();
                setLinkedRisks(data.risks || []);
            }
        } catch (err) {
            console.error('Failed to load linked risks:', err);
        } finally {
            setLoadingRisks(false);
        }
    };

    // Search risks
    useEffect(() => {
        let handle: any;
        if (!programId) return;
        if (!search) { 
            setSearchResults([]); 
            setSelectedRiskIds(new Set());
            return; 
        }
        setLoadingSearch(true);
        handle = setTimeout(async () => {
            try {
                const res = await fetch(`/api/programs/${programId}/risks?search=${encodeURIComponent(search)}&sortBy=createdAt&sortOrder=DESC`);
                if (res.ok) {
                    const data = await res.json();
                    const risks = Array.isArray(data) ? data : [];
                    // Filter out already linked risks
                    const linkedRiskIds = new Set(linkedRisks.map(r => r.risk.id));
                    setSearchResults(risks.filter((r: Risk) => !linkedRiskIds.has(r.id)));
                }
            } finally {
                setLoadingSearch(false);
            }
        }, 300);
        return () => { if (handle) clearTimeout(handle); };
    }, [search, programId, linkedRisks]);

    if (!isOpen || !entry) return null;

    const isFromAllocation = !!entry.boeElementAllocationId;

    const handleLinkSelected = async () => {
        if (selectedRiskIds.size === 0) return;
        
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);
        
        try {
            const riskIds = Array.from(selectedRiskIds);
            const res = await fetch(`/api/programs/${programId}/ledger/${entry.id}/link-risk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ riskIds })
            });
            
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to link risks');
            }
            
            const data = await res.json();
            setSuccessMessage(data.message || 'Risks linked successfully');
            setSelectedRiskIds(new Set());
            setSearch('');
            await loadLinkedRisks();
            if (onLinked) onLinked();
        } catch (err: any) {
            setError(err.message || 'Failed to link risks');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnlinkRisk = async (riskId: string) => {
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);
        
        try {
            const res = await fetch(`/api/programs/${programId}/ledger/${entry.id}/risks/${riskId}`, {
                method: 'DELETE'
            });
            
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to unlink risk');
            }
            
            const data = await res.json();
            setSuccessMessage(data.message || 'Risk unlinked successfully');
            await loadLinkedRisks();
            if (onLinked) onLinked();
        } catch (err: any) {
            setError(err.message || 'Failed to unlink risk');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleRiskSelection = (riskId: string) => {
        const newSelected = new Set(selectedRiskIds);
        if (newSelected.has(riskId)) {
            newSelected.delete(riskId);
        } else {
            newSelected.add(riskId);
        }
        setSelectedRiskIds(newSelected);
    };

    const handleRiskCreated = async (createdRisk: Risk) => {
        setNewRisk(createdRisk);
        setShowRiskFormModal(false);
        
        // Automatically link the newly created risk
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);
        
        try {
            const res = await fetch(`/api/programs/${programId}/ledger/${entry.id}/link-risk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ riskIds: [createdRisk.id] })
            });
            
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to link newly created risk');
            }
            
            const data = await res.json();
            setSuccessMessage(data.message || 'Risk created and linked successfully');
            setSearch('');
            await loadLinkedRisks();
            if (onLinked) onLinked();
        } catch (err: any) {
            setError(err.message || 'Failed to link newly created risk');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getUnlinkConfirmationMessage = (risk: RiskWithMetadata) => {
        if (!isFromAllocation || risk.sharedWithCount === 0) {
            return `Are you sure you want to unlink "${risk.risk.title}" from this entry?`;
        }
        return `This will unlink "${risk.risk.title}" from this entry and ${risk.sharedWithCount} other entries in the allocation. Continue?`;
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Manage Risks</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
                    </div>

                    {/* Entry Info */}
                    <div className="mb-4 p-3 rounded bg-gray-50">
                        <div className="text-sm text-gray-700"><span className="font-medium">Ledger Entry:</span> {entry.expense_description}</div>
                        <div className="text-sm text-gray-700"><span className="font-medium">Vendor:</span> {entry.vendor_name}</div>
                        {isFromAllocation && (
                            <div className="text-sm text-blue-700 mt-1">
                                <span className="font-medium">⚠️ Note:</span> Changes apply to all entries in this allocation
                            </div>
                        )}
                    </div>

                    {/* Linked Risks Section */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                            Linked Risks ({linkedRisks.length})
                        </h3>
                        {loadingRisks ? (
                            <div className="text-sm text-gray-500 p-4">Loading risks...</div>
                        ) : linkedRisks.length === 0 ? (
                            <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded">
                                No risks linked to this entry
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {linkedRisks.map((riskWithMeta) => (
                                    <div key={riskWithMeta.risk.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{riskWithMeta.risk.title}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {riskWithMeta.risk.severity} · {riskWithMeta.risk.probability}% probability
                                                {riskWithMeta.sharedWithCount > 0 && (
                                                    <span className="ml-2 text-blue-600">
                                                        · Shared with {riskWithMeta.sharedWithCount} other {riskWithMeta.sharedWithCount === 1 ? 'entry' : 'entries'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (window.confirm(getUnlinkConfirmationMessage(riskWithMeta))) {
                                                    handleUnlinkRisk(riskWithMeta.risk.id);
                                                }
                                            }}
                                            disabled={isSubmitting}
                                            className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded disabled:opacity-50"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Search & Link Section */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Search & Link Risks</h3>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                            placeholder="Search by title or description"
                        />
                        
                        {search && (
                            <div className="mt-2 max-h-60 overflow-auto border border-gray-200 rounded">
                                {loadingSearch && <div className="p-2 text-xs text-gray-500">Searching…</div>}
                                {!loadingSearch && searchResults.length === 0 && (
                                    <div className="p-2 text-xs text-gray-500">No risks found</div>
                                )}
                                {!loadingSearch && searchResults.map(risk => (
                                    <label
                                        key={risk.id}
                                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedRiskIds.has(risk.id)}
                                            onChange={() => handleToggleRiskSelection(risk.id)}
                                            className="mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{risk.title}</div>
                                            <div className="text-xs text-gray-500">
                                                {risk.wbsElement?.code || ''} · Sev {risk.severity} · Prob {risk.probability}%
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                        
                        {selectedRiskIds.size > 0 && (
                            <button
                                type="button"
                                onClick={handleLinkSelected}
                                disabled={isSubmitting}
                                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                            >
                                Link Selected ({selectedRiskIds.size})
                            </button>
                        )}
                    </div>

                    {/* Create New Risk */}
                    <div className="mb-6 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setShowRiskFormModal(true)}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                        >
                            Create New Risk
                        </button>
                        <p className="mt-2 text-xs text-gray-500">Opens full risk creation form. The new risk will be automatically linked after creation.</p>
                    </div>

                    {/* Messages */}
                    {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
                    {successMessage && <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded">{successMessage}</div>}

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Risk Creation Modal */}
            {showRiskFormModal && (
                <RiskFormModal
                    isOpen={showRiskFormModal}
                    onClose={() => setShowRiskFormModal(false)}
                    programId={programId}
                    risk={null}
                    onSave={handleRiskCreated}
                />
            )}
        </>
    );
};

export default LinkToRiskModal;
