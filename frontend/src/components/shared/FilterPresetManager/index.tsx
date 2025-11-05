import React, { useEffect, useState } from 'react';

interface FilterPresetManagerProps<T> {
    programId: string;
    currentFilters: T;
    onApply: (filters: T) => void;
}

type Preset<T> = { name: string; filters: T };

function getKey(programId: string) {
    return `ledgerFilterPresets:${programId}`;
}

const FilterPresetManager = <T extends unknown>({ programId, currentFilters, onApply }: FilterPresetManagerProps<T>) => {
    const [presets, setPresets] = useState<Preset<T>[]>([]);
    const [selected, setSelected] = useState<string>('');
    const [newName, setNewName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                // Load local cache first
                let local: Preset<T>[] = [];
                try {
                    const raw = localStorage.getItem(getKey(programId));
                    if (raw) local = JSON.parse(raw);
                } catch { }

                // Load server presets
                const res = await fetch(`/api/programs/${programId}/filter-presets`);
                if (res.ok) {
                    const server = await res.json();
                    // Server returns array with { id, name, filters }
                    const serverPresets: Preset<T>[] = (server || []).map((p: any) => ({ name: p.name, filters: p.filters }));
                    // Merge by name, server wins
                    const mergedByName: Record<string, Preset<T>> = {};
                    [...local, ...serverPresets].forEach(p => { mergedByName[p.name] = p; });
                    const merged = Object.values(mergedByName);
                    if (mounted) setPresets(merged);
                    // Update local cache
                    try { localStorage.setItem(getKey(programId), JSON.stringify(merged)); } catch { }
                } else {
                    if (mounted) setPresets(local);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [programId]);

    const savePresets = (list: Preset<T>[]) => {
        setPresets(list);
        try { localStorage.setItem(getKey(programId), JSON.stringify(list)); } catch { }
    };

    const handleSave = async () => {
        const name = newName.trim();
        if (!name) return;
        const nextPreset = { name, filters: currentFilters } as Preset<T>;
        // Try server first
        try {
            await fetch(`/api/programs/${programId}/filter-presets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, filters: currentFilters })
            });
        } catch { }
        const next = presets.filter(p => p.name !== name).concat([nextPreset]);
        savePresets(next);
        setNewName('');
        setSelected(name);
    };

    const handleApply = () => {
        const p = presets.find(p => p.name === selected);
        if (p) onApply(p.filters);
    };

    const handleDelete = async () => {
        if (!selected) return;
        try {
            // We don't have presetId on client; delete by name server-side is not exposed,
            // so attempt to refetch list and find id by name first
            const res = await fetch(`/api/programs/${programId}/filter-presets`);
            if (res.ok) {
                const server = await res.json();
                const match = (server || []).find((p: any) => p.name === selected);
                if (match?.id) {
                    await fetch(`/api/programs/${programId}/filter-presets/${match.id}`, { method: 'DELETE' });
                }
            }
        } catch { }
        const next = presets.filter(p => p.name !== selected);
        savePresets(next);
        setSelected('');
    };

    return (
        <div className="flex items-center gap-2">
            <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
            >
                <option value="">Select preset...</option>
                {presets.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                ))}
            </select>
            <button
                className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleApply}
                disabled={!selected || loading}
            >
                Apply
            </button>
            <button
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDelete}
                disabled={!selected}
            >
                Delete
            </button>
            <div className="flex gap-2 items-center border-l border-gray-300 pl-2 ml-2">
                <input
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Preset name"
                />
                <button
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSave}
                    disabled={!newName.trim()}
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default FilterPresetManager;


