import React, { useEffect, useState } from 'react';

interface SummaryKpisProps {
    programId: string;
}

interface KpiResponse {
    totalRecords: number;
    currentAccountingMonth: string;
    inMonthCount: number;
    withActualsCount: number;
    missingActualsCount: number;
}

const Card: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 min-w-[160px]">
        <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
);

export const SummaryKpis: React.FC<SummaryKpisProps> = ({ programId }) => {
    const [data, setData] = useState<KpiResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/programs/${programId}/ledger/summary`);
                if (!res.ok) throw new Error('Failed to load summary');
                const json = (await res.json()) as KpiResponse;
                if (mounted) setData(json);
            } catch (e: any) {
                if (mounted) setError(e.message || 'Failed to load summary');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        run();
        return () => {
            mounted = false;
        };
    }, [programId]);

    if (loading && !data) return <div className="mb-4 text-sm text-gray-500">Loading summary…</div>;
    if (error) return <div className="mb-4 text-sm text-red-600">{error}</div>;
    if (!data) return null;

    return (
        <div className="mb-6 flex flex-wrap gap-3">
            <Card label="Total Records" value={data.totalRecords} />
            <Card label="Accounting Month" value={data.currentAccountingMonth} />
            <Card label="In Month (Planned)" value={data.inMonthCount} />
            <Card label="With Actuals" value={data.withActualsCount} />
            <Card label="Missing Actuals" value={data.missingActualsCount} />
        </div>
    );
};

export default SummaryKpis;


