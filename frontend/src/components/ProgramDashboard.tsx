import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Layout from './Layout';
import LedgerTable from './LedgerTable';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart
} from 'recharts';
import { addMonths, format } from 'date-fns';

interface Program {
  id: number;
  code: string;
  name: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number;
  type: 'Annual' | 'Period of Performance';
}

const ProgramDashboard: React.FC = () => {
  const { id } = useParams();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [fullSummary, setFullSummary] = useState<any[]>([]);
  const [filledSummary, setFilledSummary] = useState<any[]>([]);
  const [outOfWindowWarning, setOutOfWindowWarning] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgram = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:4000/api/programs/${id}`);
        setProgram(response.data);
      } catch (err: any) {
        setError('Failed to load program.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProgram();
  }, [id]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!program || !program.id) return;
      setSummaryLoading(true);
      try {
        const res = await axios.get(`http://localhost:4000/api/programs/${program.id}/ledger/summary`, {
          params: { month: selectedMonth },
        });
        setSummary(res.data);
      } catch (err) {
        setSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, [program, selectedMonth]);

  useEffect(() => {
    const fetchFullSummary = async () => {
      if (!program || !program.id) return;
      try {
        const res = await axios.get(`http://localhost:4000/api/programs/${program.id}/ledger/summary-full`);
        setFullSummary(res.data);
        console.log('Full Summary Data:', res.data);
      } catch (err) {
        setFullSummary([]);
      }
    };
    fetchFullSummary();
  }, [program]);

  useEffect(() => {
    if (!program || !program.startDate || !program.endDate) {
      setFilledSummary(fullSummary);
      setOutOfWindowWarning(null);
      return;
    }
    if (!fullSummary || fullSummary.length === 0) {
      setFilledSummary([]);
      setOutOfWindowWarning(null);
      return;
    }
    // Get program window
    const startMonth = format(new Date(program.startDate), 'yyyy-MM');
    const endMonth = format(new Date(program.endDate), 'yyyy-MM');
    // Find min/max in ledger data
    const monthsInData = fullSummary.map(d => d.month);
    const minDataMonth = monthsInData.reduce((a, b) => (a < b ? a : b));
    const maxDataMonth = monthsInData.reduce((a, b) => (a > b ? a : b));
    // Check for out-of-window data
    let warning = null;
    if (minDataMonth < startMonth || maxDataMonth > endMonth) {
      warning = `Warning: There are ledger entries outside the program window (${startMonth} to ${endMonth}).`;
    }
    setOutOfWindowWarning(warning);
    // Fill missing months
    const monthMap: Record<string, any> = {};
    fullSummary.forEach(d => { monthMap[d.month] = d; });
    const months = [];
    let current = new Date(startMonth + '-01');
    const end = new Date(endMonth + '-01');
    let lastCumBaseline = 0, lastCumPlanned = 0, lastCumActual = 0;
    while (current <= end) {
      const monthStr = format(current, 'yyyy-MM');
      if (monthMap[monthStr]) {
        months.push(monthMap[monthStr]);
        lastCumBaseline = monthMap[monthStr].cumBaseline;
        lastCumPlanned = monthMap[monthStr].cumPlanned;
        lastCumActual = monthMap[monthStr].cumActual;
      } else {
        months.push({
          month: monthStr,
          baseline: 0,
          planned: 0,
          actual: 0,
          cumBaseline: lastCumBaseline,
          cumPlanned: lastCumPlanned,
          cumActual: lastCumActual,
        });
      }
      current = addMonths(current, 1);
    }
    setFilledSummary(months);
  }, [program, fullSummary]);

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Program Dashboard</h1>
        <p className="text-gray-500 mb-8">Dashboard for Program ID: <span className="font-mono">{id}</span></p>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-lg text-gray-500">Loading...</div>
        ) : error ? (
          <div className="flex items-center justify-center h-40 text-lg text-red-500">{error}</div>
        ) : program && (
          <>
            {/* Redesigned Program Summary Bar */}
            <div className="bg-white rounded-xl shadow flex flex-row items-stretch mb-8 min-h-[160px]">
              {/* Logo fills left height */}
              <div className="flex items-center justify-center bg-gray-50 rounded-l-xl p-6 min-w-[160px]">
                <img src="/tomorrow-logo.png" alt="Program" className="h-28 w-28 object-contain" />
              </div>
              {/* Name, Code, Status vertical stack */}
              <div className="flex flex-col justify-center px-8 min-w-[180px]">
                <div className="text-2xl font-bold text-gray-900 mb-1">{program.name}</div>
                <div className="text-primary-700 font-semibold mb-2">{program.code}</div>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded text-xs font-medium ${program.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{program.status}</span>
                </div>
              </div>
              {/* Type and Dates */}
              <div className="flex flex-col justify-center items-start min-w-[180px] px-8">
                <div className="text-xs text-gray-400 mb-1">Type</div>
                <div className="font-semibold text-gray-700 mb-2">{program.type}</div>
                <div className="text-xs text-gray-400 mb-1">Dates</div>
                {program.type === 'Period of Performance' ? (
                  <div className="text-sm text-gray-700">{program.startDate ? new Date(program.startDate).toLocaleDateString() : 'N/A'} - {program.endDate ? new Date(program.endDate).toLocaleDateString() : 'N/A'}</div>
                ) : (
                  <div className="text-sm text-gray-700">N/A</div>
                )}
              </div>
              {/* Program Description - take up more space */}
              <div className="flex flex-col justify-center px-8 flex-1 max-w-2xl">
                <div className="text-gray-600 text-sm line-clamp-3">{program.description}</div>
              </div>
              {/* Financial Info (Budget, ETC, EAC, VAC) all the way right */}
              <div className="flex flex-row items-stretch min-w-[340px]">
                {/* Budget */}
                <div className="flex flex-col justify-center items-center px-6 border-r border-gray-100">
                  <div className="text-gray-400 text-sm mb-1">Budget</div>
                  <div className="font-bold text-3xl text-gray-900">${program.totalBudget?.toLocaleString()}</div>
                </div>
                {/* ETC, EAC, VAC */}
                <div className="flex flex-col justify-center items-center px-6">
                  <div className="flex flex-row gap-8">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400">ETC</span>
                      <span className="font-semibold text-gray-700">--</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400">EAC</span>
                      <span className="font-semibold text-gray-700">--</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400">VAC</span>
                      <span className="font-semibold text-gray-700">--</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Month Selector and Summary Metrics */}
            <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Select Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="input input-bordered"
                />
              </div>
              {summaryLoading ? (
                <div className="text-gray-500">Loading summary...</div>
              ) : summary && (
                <div className="flex flex-wrap gap-6 items-end">
                  <div>
                    <div className="text-xs text-gray-500">Actuals to Date</div>
                    <div className="font-bold text-lg text-gray-900">${summary.actualsToDate?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">ETC</div>
                    <div className="font-bold text-lg text-gray-900">${summary.etc?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">EAC</div>
                    <div className="font-bold text-lg text-gray-900">${summary.eac?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">VAC</div>
                    <div className="font-bold text-lg text-gray-900">${summary.vac?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Monthly Cash Flow</div>
                    <div className="font-bold text-lg text-gray-900">${summary.monthlyCashFlow?.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Charts Section */}
            {outOfWindowWarning && (
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded border border-yellow-300 font-semibold">
                {outOfWindowWarning}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <div className="text-lg font-bold mb-2">Monthly Financials</div>
                {/* Full project chart: clustered bars + cumulative lines */}
                <div className="w-full h-72">
                  {filledSummary && filledSummary.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={filledSummary} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 12 }}
                          label={{ value: "Monthly ($)", angle: -90, position: "insideLeft" }}
                          domain={['auto', 'auto']}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 12 }}
                          label={{ value: "Cumulative ($)", angle: 90, position: "insideRight" }}
                          domain={[0, 'dataMax']}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="baseline" fill="#6366f1" name="Baseline" />
                        <Bar yAxisId="left" dataKey="planned" fill="#3b82f6" name="Planned" />
                        <Bar yAxisId="left" dataKey="actual" fill="#10b981" name="Actual" />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="cumBaseline"
                          stroke="#6366f1"
                          name="Cumulative Baseline"
                          strokeWidth={2}
                          dot={true}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="cumPlanned"
                          stroke="#3b82f6"
                          name="Cumulative Planned"
                          strokeWidth={2}
                          dot={true}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="cumActual"
                          stroke="#10b981"
                          name="Cumulative Actual"
                          strokeWidth={2}
                          dot={true}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No data</div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <div className="text-lg font-bold mb-2">Category Breakdown</div>
                {/* Placeholder for chart */}
                <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400">[Chart Placeholder]</div>
              </div>
            </div>

            {/* Ledger/Transactions Table Section */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-lg font-bold mb-4">Ledger / Transactions</div>
              {program && program.id && <LedgerTable programId={program.id} />}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProgramDashboard; 