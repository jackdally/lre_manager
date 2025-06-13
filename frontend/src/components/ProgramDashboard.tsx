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
import { addMonths, format, subMonths } from 'date-fns';

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

// Custom legend for bars and lines
const CustomLegend = () => (
  <div style={{ marginTop: 12, marginBottom: 8 }}>
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: 16, marginBottom: 6 }}>
      <span style={{ fontWeight: 600, color: '#6B7280', marginRight: 8 }}>Bars:</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 8, background: '#9CA3AF', display: 'inline-block', borderRadius: 2 }}></span>Baseline</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 8, background: '#FCD34D', display: 'inline-block', borderRadius: 2 }}></span>Planned</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 8, background: '#93C5FD', display: 'inline-block', borderRadius: 2 }}></span>Actual</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: 16 }}>
      <span style={{ fontWeight: 600, color: '#6B7280', marginRight: 8 }}>Lines:</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 0, borderTop: '3.75px solid #4B5563', display: 'inline-block' }}></span>Cumulative Baseline</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 0, borderTop: '3px dashed #D97706', display: 'inline-block' }}></span>Cumulative Planned</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 0, borderTop: '3.75px solid #2563EB', display: 'inline-block' }}></span>Cumulative Actual</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 0, borderTop: '2.5px dashed #16A34A', display: 'inline-block' }}></span>Cumulative EAC Combined</span>
    </div>
  </div>
);

const ProgramDashboard: React.FC = () => {
  const { id } = useParams();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const getPrevUtcMonth = () => {
    const now = new Date();
    const utcYear = now.getUTCFullYear();
    const utcMonth = now.getUTCMonth();
    let prevMonth = utcMonth - 1;
    let prevYear = utcYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    return `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
  };
  const [selectedMonth, setSelectedMonth] = useState(getPrevUtcMonth);
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [fullSummary, setFullSummary] = useState<any[]>([]);
  const [filledSummary, setFilledSummary] = useState<any[]>([]);
  const [outOfWindowWarning, setOutOfWindowWarning] = useState<string | null>(null);
  const [topRowSummary, setTopRowSummary] = useState<any>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
      } catch (err) {
        setFullSummary([]);
      }
    };
    fetchFullSummary();
  }, [program]);

  useEffect(() => {
    if (!program || !program.startDate || !program.endDate) {
      // Add cumEACCombined and cumActual to fullSummary
      const selectedIdx = fullSummary.findIndex(m => m.month === selectedMonth);
      let lastActuals = selectedIdx >= 0 ? fullSummary[selectedIdx]?.cumActual : 0;
      let lastPlanned = selectedIdx >= 0 ? fullSummary[selectedIdx]?.cumPlanned : 0;
      let cumEACCombined = 0;
      const newSummary = fullSummary.map((m, idx) => {
        const cumActual = idx <= selectedIdx ? m.cumActual : null;
        if (idx <= selectedIdx) {
          cumEACCombined = m.cumActual;
        } else {
          cumEACCombined = lastActuals + (m.cumPlanned - lastPlanned);
        }
        return { ...m, cumEACCombined, cumActual };
      });
      setFilledSummary(newSummary);
      setOutOfWindowWarning(null);
      return;
    }
    if (!fullSummary || fullSummary.length === 0) {
      setFilledSummary([]);
      setOutOfWindowWarning(null);
      return;
    }

    // Get program window
    let startMonth: string, endMonth: string;
    if (program.type === 'Period of Performance') {
      startMonth = format(new Date(program.startDate), 'yyyy-MM');
      endMonth = format(new Date(program.endDate), 'yyyy-MM');
    } else {
      // For Annual programs, use the selected year
      const selectedYear = selectedMonth.split('-')[0];
      startMonth = `${selectedYear}-01`;
      endMonth = `${selectedYear}-12`;
    }

    let warning: string | null = null;
    const hasEarlyExpenses = fullSummary.some(d => d.month < startMonth);
    if (hasEarlyExpenses) {
      warning = `Warning: There are ledger entries before the project start month (${startMonth}).`;
    }

    // Only include months from startMonth onward in the chart
    const filteredSummary = fullSummary.filter(d => d.month >= startMonth && d.month <= endMonth);

    // Find min/max in ledger data (after filtering)
    const monthsInData = filteredSummary.map(d => d.month);
    const minDataMonth = monthsInData.length > 0 ? monthsInData.reduce((a, b) => (a < b ? a : b)) : startMonth;
    const maxDataMonth = monthsInData.length > 0 ? monthsInData.reduce((a, b) => (a > b ? a : b)) : endMonth;

    // Check for out-of-window data
    if (monthsInData.length > 0 && (minDataMonth < startMonth || maxDataMonth > endMonth)) {
      warning = `Warning: There are ledger entries outside the program window (${startMonth} to ${endMonth}).`;
    }
    setOutOfWindowWarning(warning);

    // Fill missing months
    const monthMap: Record<string, any> = {};
    filteredSummary.forEach(d => { monthMap[d.month] = d; });
    const months: any[] = [];
    // Robust month start/end logic
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    let current = new Date(startYear, startMonthNum - 1, 1); // JS months are 0-based
    const [endYear, endMonthNum] = endMonth.split('-').map(Number);
    const end = new Date(endYear, endMonthNum, 1); // first day of month after endMonth
    let lastCumBaseline = 0, lastCumPlanned = 0, lastCumActual = 0;
    // For cumEACCombined/cumActual
    const selectedIdx = months.length > 0 ? months.findIndex((m: any) => m.month === selectedMonth) : -1;
    let lastActuals = selectedIdx >= 0 && months[selectedIdx] ? months[selectedIdx].cumActual : 0;
    let lastPlanned = selectedIdx >= 0 && months[selectedIdx] ? months[selectedIdx].cumPlanned : 0;
    let cumEACCombined = 0;
    while (current < end) {
      const monthStr: string = format(current, 'yyyy-MM');
      const idx: number = months.length;
      let cumActual: number | null;
      if (monthMap[monthStr]) {
        cumActual = idx <= selectedIdx ? monthMap[monthStr].cumActual : null;
        if (idx <= selectedIdx) {
          cumEACCombined = monthMap[monthStr].cumActual;
        } else {
          cumEACCombined = lastActuals + (monthMap[monthStr].cumPlanned - lastPlanned);
        }
        months.push({ ...monthMap[monthStr], cumEACCombined, cumActual });
        lastCumBaseline = monthMap[monthStr].cumBaseline;
        lastCumPlanned = monthMap[monthStr].cumPlanned;
        lastCumActual = monthMap[monthStr].cumActual;
      } else {
        cumActual = idx <= selectedIdx ? lastCumActual : null;
        if (idx <= selectedIdx) {
          cumEACCombined = lastCumActual;
        } else {
          cumEACCombined = lastActuals + (lastCumPlanned - lastPlanned);
        }
        months.push({
          month: monthStr,
          baseline: 0,
          planned: 0,
          actual: 0,
          cumBaseline: lastCumBaseline,
          cumPlanned: lastCumPlanned,
          cumActual: lastCumActual,
          cumEACCombined,
        });
      }
      current = addMonths(current, 1);
    }
    setFilledSummary(months);
    setOutOfWindowWarning(warning);
  }, [program, fullSummary, selectedMonth]);

  // Find the most recently closed accounting month (last full month before today)
  const now = new Date();
  const lastClosedMonth = format(subMonths(now, 1), 'yyyy-MM');

  // Check if actuals for the latest accounting month are missing
  const latestMonthData = filledSummary.find(m => m.month === lastClosedMonth);
  const actualsMissing = !latestMonthData || !latestMonthData.actual || latestMonthData.actual === 0;

  // Fetch summary for the last closed month for the top row
  useEffect(() => {
    const fetchTopRowSummary = async () => {
      if (!program || !program.id) return;
      try {
        const res = await axios.get(`http://localhost:4000/api/programs/${program.id}/ledger/summary`, {
          params: { month: lastClosedMonth },
        });
        setTopRowSummary(res.data);
      } catch (err) {
        setTopRowSummary(null);
      }
    };
    fetchTopRowSummary();
  }, [program, lastClosedMonth]);

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Program Dashboard</h1>
        <p className="text-gray-500 mb-8">Dashboard for Program ID: <span className="font-mono">{id}</span></p>

        {actualsMissing && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded border border-yellow-300 font-semibold text-center">
            Actuals for Latest Accounting Month not filled in yet
          </div>
        )}

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
                {/* Budget and EAC grouped with horizontal divider */}
                <div className="flex flex-col justify-center items-center px-6 border-l border-r border-gray-200">
                  <div className="flex flex-col items-center w-32">
                    <div className="text-gray-400 text-sm mb-1 font-bold">Budget</div>
                    <div className="font-bold text-3xl text-gray-900" style={{ position: 'relative', cursor: 'pointer' }}
                      title={topRowSummary && program.totalBudget ? `% of Budget Spent: ${Math.round((topRowSummary.actualsToDate / program.totalBudget) * 100)}%` : ''}
                    >
                      ${program.totalBudget ? Math.round(program.totalBudget).toLocaleString() : '--'}
                    </div>
                  </div>
                  <div className="w-full border-t border-gray-200 my-2"></div>
                  <div className="flex flex-col items-center w-32">
                    <div className="text-gray-400 text-sm mb-1 font-bold">EAC</div>
                    <div className="font-bold text-3xl text-gray-900" style={{ position: 'relative', cursor: 'pointer' }}
                      title={topRowSummary && topRowSummary.eac ? `% of EAC Spent: ${Math.round((topRowSummary.actualsToDate / topRowSummary.eac) * 100)}%` : ''}
                    >
                      {topRowSummary && topRowSummary.eac ? `$${Math.round(topRowSummary.eac).toLocaleString()}` : '--'}
                    </div>
                  </div>
                </div>
                {/* VAC with vertical divider */}
                <div className="flex flex-col justify-center items-center px-6">
                  <div className="text-gray-400 text-sm mb-1 font-bold">VAC</div>
                  <div className={`font-bold text-3xl ${topRowSummary && topRowSummary.vac < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {topRowSummary && typeof topRowSummary.vac === 'number' ? `$${Math.round(topRowSummary.vac).toLocaleString()}` : '--'}
                  </div>
                </div>
              </div>
            </div>

            {/* Reporting Month Header and Month Selector */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-gray-900">
                  Reporting Month: {selectedMonth ? (() => {
                    const [year, month] = selectedMonth.split('-').map(Number);
                    return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                  })() : ''}
                </span>
                <div className="relative">
                  <button
                    className="px-4 py-1 rounded bg-white bg-opacity-60 border border-gray-300 text-sm text-gray-700 font-semibold hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    onClick={() => setDropdownOpen(true)}
                  >
                    See previous reporting months
                  </button>
                  {dropdownOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-white bg-opacity-95 border border-gray-200 rounded shadow-lg z-10 max-h-64 overflow-y-auto">
                      {(filledSummary as any[])
                        .filter(m => {
                          // Only months within project window, inclusive, compare year and month only
                          if (!program || !program.startDate || !program.endDate) return true;
                          const [mYear, mMonth] = m.month.split('-').map(Number);
                          const [startYear, startMonth] = program.startDate.split('-').map(Number);
                          const [endYear, endMonth] = program.endDate.split('-').map(Number);
                          const afterStart = (mYear > startYear) || (mYear === startYear && mMonth >= startMonth);
                          const beforeEnd = (mYear < endYear) || (mYear === endYear && mMonth <= endMonth);
                          return afterStart && beforeEnd;
                        })
                        .map((m: any) => {
                          const [year, month] = m.month.split('-').map(Number);
                          const label = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                          return (
                            <div
                              key={m.month}
                              className={`px-4 py-2 cursor-pointer hover:bg-blue-100 ${m.month === selectedMonth ? 'bg-blue-50 font-bold' : ''}`}
                              onClick={() => {
                                setSelectedMonth(m.month);
                                setDropdownOpen(false);
                              }}
                            >
                              {label}
                            </div>
                          );
                        })
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Summary Metrics as Boxes */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow p-4">
                  <div className="text-sm text-gray-500 mb-1">Actuals to Date</div>
                  <div className="font-bold text-2xl text-gray-900">${summary.actualsToDate?.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                  <div className="text-sm text-gray-500 mb-1">ETC (Future Planned)</div>
                  <div className="font-bold text-2xl text-gray-900">${summary.etc?.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                  <div className="text-sm text-gray-500 mb-1">EAC (Actuals + ETC)</div>
                  <div className="font-bold text-2xl text-gray-900">${summary.eac?.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                  <div className="text-sm text-gray-500 mb-1">VAC (Budget - EAC)</div>
                  <div className={`font-bold text-2xl ${summary.vac < 0 ? 'text-red-600' : 'text-green-600'}`}>${summary.vac?.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Additional Metrics Section */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow p-4">
                  <div className="text-sm text-gray-500 mb-1">Schedule Variance (SV)</div>
                  <div className="text-xs text-gray-400 mb-2">Actuals to Date - Baseline to Date</div>
                  <div className={`font-semibold text-lg ${summary.scheduleVariance > 0 ? 'text-blue-600' : 'text-yellow-600'}`}>${summary.scheduleVariance?.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1">SPI: {summary.schedulePerformanceIndex?.toFixed(2)}</div>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                  <div className="text-sm text-gray-500 mb-1">Cost Variance (CV)</div>
                  <div className="text-xs text-gray-400 mb-2">Planned to Date - Actuals to Date</div>
                  <div className={`font-semibold text-lg ${summary.costVariance > 0 ? 'text-blue-600' : 'text-yellow-600'}`}>${summary.costVariance?.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1">CPI: {summary.costPerformanceIndex?.toFixed(2)}</div>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                  <div className="text-sm text-gray-500 mb-1">Project Baseline</div>
                  <div className="text-xs text-gray-400 mb-2">All baseline amounts</div>
                  <div className="font-semibold text-lg text-gray-900">${summary.project_baseline_total?.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1">Baseline to Date: ${summary.baselineToDate?.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                  <div className="text-sm text-gray-500 mb-1">Project Planned</div>
                  <div className="text-xs text-gray-400 mb-2">All planned amounts</div>
                  <div className="font-semibold text-lg text-gray-900">${summary.project_planned_total?.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1">Planned to Date: ${summary.plannedToDate?.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Charts Section */}
            {outOfWindowWarning && (
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded border border-yellow-300 font-semibold">
                {outOfWindowWarning}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <div className="text-lg font-bold mb-2">Monthly Financials</div>
                {/* Legend Details Button */}
                <div style={{ width: '100%', position: 'relative', minHeight: 32 }}>
                  <button
                    onClick={() => setLegendOpen(true)}
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      marginTop: '-48px', marginLeft: '-12px',
                      background: '#3B82F6', // faded blue
                      color: 'white',
                      border: 'none',
                      borderRadius: 5,
                      padding: '3px 10px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontSize: 12,
                      opacity: 0.85,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                    }}
                  >
                    Legend Details
                  </button>
                </div>
                {/* Full project chart: clustered bars + cumulative lines */}
                <div className="w-full h-72">
                  {filledSummary && filledSummary.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart 
                          data={filledSummary} 
                          margin={{ top: 20, right: 60, left: 40, bottom: 40 }}
                          barCategoryGap="10%"
                          barGap={0}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="month" 
                            type="category"
                            interval={0}
                            tick={({ x, y, payload }) => {
                              const [year, month] = payload.value.split('-').map(Number);
                              const date = new Date(year, month - 1, 1);
                              const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                              return (
                                <text x={x} y={y + 12} textAnchor="middle" fontSize={12}>
                                  {label}
                                </text>
                              );
                            }}
                            padding={{ left: 0, right: 0 }}
                            label={{
                              value: 'Month',
                              position: 'insideBottom',
                              offset: -8,
                              fontSize: 14,
                              fill: '#6B7280'
                            }}
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                            label={{
                              value: 'Monthly ($)',
                              angle: -90,
                              position: 'insideLeft',
                              offset: 10,
                              fontSize: 14,
                              fill: '#6B7280'
                            }}
                            domain={['auto', 'auto']}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                            label={{
                              value: 'Cumulative ($)',
                              angle: 90,
                              position: 'insideRight',
                              offset: 10,
                              fontSize: 14,
                              fill: '#6B7280'
                            }}
                            domain={[0, 'dataMax']}
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `$${value?.toLocaleString()}`,
                              name
                            ]}
                            labelFormatter={(label) => {
                              const [year, month] = label.split('-').map(Number);
                              const date = new Date(year, month - 1, 1);
                              return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                            }}
                          />
                          <Bar 
                            yAxisId="left" 
                            dataKey="baseline" 
                            fill="#9CA3AF" 
                            name="Baseline"
                            opacity={0.6}
                          />
                          <Bar 
                            yAxisId="left" 
                            dataKey="planned" 
                            fill="#FCD34D" 
                            name="Planned"
                            opacity={0.6}
                          />
                          <Bar 
                            yAxisId="left" 
                            dataKey="actual" 
                            fill="#93C5FD" 
                            name="Actual"
                            opacity={0.6}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cumBaseline"
                            stroke="#4B5563"
                            name="Cumulative Baseline"
                            strokeWidth={3.75}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cumPlanned"
                            stroke="#D97706"
                            name="Cumulative Planned"
                            strokeWidth={3}
                            strokeDasharray="6 4"
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cumEACCombined"
                            stroke="#16A34A"
                            name="Cumulative EAC Combined"
                            strokeWidth={2.5}
                            strokeDasharray="6 4"
                            dot={false}
                            isAnimationActive={false}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cumActual"
                            stroke="#2563EB"
                            name="Cumulative Actual"
                            strokeWidth={3.75}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No data</div>
                  )}
                </div>
                {/* Legend Modal */}
                {legendOpen && (
                  <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                  }}>
                    <div style={{
                      background: 'white', borderRadius: 12, padding: 32, minWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.12)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontWeight: 700, fontSize: 18 }}>Legend Details</span>
                        <button onClick={() => setLegendOpen(false)} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
                      </div>
                      <CustomLegend />
                    </div>
                  </div>
                )}
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