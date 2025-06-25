import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../../layout';
import LedgerTable from '../../ledger/LedgerTable';
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
  ComposedChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { addMonths, format, subMonths } from 'date-fns';
import html2canvas from 'html2canvas';

interface Program {
  id: string;
  code: string;
  name: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number;
  type: 'Annual' | 'Period of Performance';
  program_manager?: string;
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
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 0, borderTop: '2.5px dashed #16A34A', display: 'inline-block' }}></span>Cumulative Projected</span>
    </div>
  </div>
);

// Add LedgerEntry type for use in this file
interface LedgerEntry {
  id: string;
  vendor_name: string;
  expense_description: string;
  wbs_category: string;
  wbs_subcategory: string;
  baseline_date: string;
  baseline_amount: number;
  planned_date: string;
  planned_amount: number;
  actual_date: string | null;
  actual_amount: number | null;
  notes: string | null;
}

// Add a helper for currency formatting with negative sign before dollar
function formatCurrency(val: number | undefined | null) {
  if (val == null) return '--';
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(absVal);
  return (val < 0 ? '-' : '') + formatted;
}

// Helper for percent formatting with sign
function formatPercent(val: number | undefined | null, showPlus = false) {
  if (val == null || isNaN(val)) return '--';
  const sign = val > 0 ? (showPlus ? '+' : '') : (val < 0 ? '-' : '');
  return sign + Math.abs(val).toFixed(1) + '%';
}

const CATEGORY_COLORS = [
  '#2563EB', '#F59E42', '#10B981', '#F43F5E', '#6366F1', '#FBBF24', '#14B8A6', '#A21CAF', '#E11D48', '#64748B'
];

// Custom background for planned bar, centered behind actual bar, using xAxis scale
const PlannedBarBackground = (props: any) => {
  const { x, y, height, index, payload, xAxis } = props;
  const planned = payload.planned;
  let plannedWidth = 0;
  if (xAxis && xAxis.scale && typeof xAxis.scale === 'function') {
    plannedWidth = xAxis.scale(planned) - xAxis.scale(0);
  } else {
    plannedWidth = planned;
  }
  return (
    <rect
      x={x}
      y={y - 6}
      width={plannedWidth}
      height={height + 12}
      fill="#E5E7EB"
      rx={8}
      ry={8}
    />
  );
};

// Custom tooltip for bullet chart
const BulletChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const actual = payload.find((p: any) => p.dataKey === 'actual')?.value;
  const planned = payload[0]?.payload?.planned;
  return (
    <div style={{ background: 'white', border: '1px solid #ccc', borderRadius: 6, padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#2563EB', fontWeight: 500 }}>Actual: {formatCurrency(actual)}</div>
      <div style={{ color: '#6B7280', fontWeight: 500 }}>Planned: {formatCurrency(planned)}</div>
    </div>
  );
};

// Custom tooltip for main chart
const MainChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload || {};
  const baseline = data.baseline;
  const planned = data.planned;
  const actual = data.actual;
  const cumBaseline = data.cumBaseline;
  const cumPlanned = data.cumPlanned;
  const cumActual = data.cumActual;
  const cumProjected = data.cumEACCombined;
  return (
    <div style={{ background: 'white', border: '1px solid #ccc', borderRadius: 8, padding: 16, minWidth: 220 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#9CA3AF' }}>Baseline : {formatCurrency(baseline)}</div>
      <div style={{ color: '#F59E42' }}>Planned : {formatCurrency(planned)}</div>
      <div style={{ color: '#93C5FD' }}>Actual : {formatCurrency(actual)}</div>
      <div style={{ height: 8 }} />
      <div style={{ color: '#4B5563' }}>Cumulative Baseline : {formatCurrency(cumBaseline)}</div>
      <div style={{ color: '#D97706' }}>Cumulative Planned : {formatCurrency(cumPlanned)}</div>
      {cumActual != null ? (
        <div style={{ color: '#2563EB', fontWeight: 600 }}>Cumulative Actual : {formatCurrency(cumActual)}</div>
      ) : cumProjected != null ? (
        <div style={{ color: '#16A34A', fontWeight: 600 }}>Cumulative Projected : {formatCurrency(cumProjected)}</div>
      ) : null}
    </div>
  );
};

const CustomYAxisLabel = ({ viewBox, axis }: any) => {
  const { y, height, x, width } = viewBox;
  const label = axis === 'left' ? 'Monthly ($)' : 'Cumulative ($)';
  // For left axis, use a fixed x position; for right, to the right
  const xPos = axis === 'left' ? 24 : x + width + 48;
  const yPos = y + height / 2;
  const rotation = axis === 'left' ? -90 : 90;
  return (
    <text
      x={xPos}
      y={yPos}
      textAnchor="middle"
      fontSize={16}
      fontWeight={600}
      fill="#6B7280"
      transform={`rotate(${rotation},${xPos},${yPos})`}
      style={{ pointerEvents: 'none' }}
    >
      {label}
    </text>
  );
};

// Helper to format ISO or YYYY-MM-DD as MM/DD/YYYY
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A';
  // Extract only the date part if it's an ISO string
  const datePart = dateStr.split('T')[0];
  const [y, m, d] = datePart.split('-');
  return `${m}/${d}/${y}`;
};

// Helper to get YYYY-MM from ISO or YYYY-MM-DD string
const getYearMonth = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  const datePart = dateStr.split('T')[0];
  const [y, m] = datePart.split('-');
  return `${y}-${m}`;
};

// --- Types for API responses ---
interface SummaryType {
  actualsToDate: number;
  etc: number;
  eac: number;
  vac: number;
  scheduleVariance: number;
  schedulePerformanceIndex: number;
  costVariance: number;
  costPerformanceIndex: number;
  project_baseline_total: number;
  baselineToDate: number;
  project_planned_total: number;
  plannedToDate: number;
}

interface FullSummaryType {
  month: string;
  baseline: number;
  planned: number;
  actual: number;
  cumBaseline: number;
  cumPlanned: number;
  cumActual: number;
  cumEACCombined: number;
}

interface TopRowSummaryType {
  actualsToDate: number;
  eac: number;
  vac: number;
}

interface LedgerEntriesResponse {
  entries: LedgerEntry[];
}

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
  const [summary, setSummary] = useState<SummaryType | null>(null);
  const [fullSummary, setFullSummary] = useState<FullSummaryType[]>([]);
  const [filledSummary, setFilledSummary] = useState<any[]>([]);
  const [outOfWindowWarning, setOutOfWindowWarning] = useState<string | null>(null);
  const [topRowSummary, setTopRowSummary] = useState<TopRowSummaryType | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [missingActuals, setMissingActuals] = useState<LedgerEntry[]>([]);
  const [missingModalOpen, setMissingModalOpen] = useState(false);
  const [categoryChartType, setCategoryChartType] = useState<'bullet' | 'donut'>('bullet');
  const chartRef = useRef<HTMLDivElement>(null);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280); // 17.5rem = 280px

  useEffect(() => {
    const fetchProgram = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<Program>(`/api/programs/${id}`);
        setProgram(response.data);
      } catch (err: any) {
        setError('Failed to load program.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProgram();
  }, [id]);

  const fetchSummary = useCallback(async () => {
    if (!program || !program.id) return;
    try {
      const res = await axios.get<SummaryType>(`/api/programs/${program.id}/ledger/summary`, {
        params: { month: selectedMonth },
      });
      setSummary(res.data);
    } catch (err) {
      setSummary(null);
    }
  }, [program, selectedMonth]);

  const fetchFullSummary = useCallback(async () => {
    if (!program || !program.id) return;
    try {
      const res = await axios.get<FullSummaryType[]>(`/api/programs/${program.id}/ledger/summary-full`);
      setFullSummary(res.data as FullSummaryType[]);
    } catch (err) {
      setFullSummary([]);
    }
  }, [program]);

  const fetchTopRowSummary = useCallback(async () => {
    if (!program || !program.id) return;
    try {
      const res = await axios.get<TopRowSummaryType>(`/api/programs/${program.id}/ledger/summary`, {
        params: { month: selectedMonth },
      });
      setTopRowSummary(res.data);
    } catch (err) {
      setTopRowSummary(null);
    }
  }, [program, selectedMonth]);

  const fetchLedgerEntries = useCallback(async () => {
    if (!program || !program.id) return;
    try {
      const res = await axios.get<LedgerEntriesResponse>(`/api/programs/${program.id}/ledger`, {
        params: { page: 1, pageSize: 10000 }
      });
      setLedgerEntries((res.data as LedgerEntriesResponse).entries);
    } catch (err) {
      setLedgerEntries([]);
    }
  }, [program]);

  useEffect(() => {
    fetchSummary();
    fetchFullSummary();
    fetchTopRowSummary();
    fetchLedgerEntries();
  }, [fetchSummary, fetchFullSummary, fetchTopRowSummary, fetchLedgerEntries]);

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
      startMonth = getYearMonth(program.startDate);
      endMonth = getYearMonth(program.endDate);
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
    // Build the full list of months for the chart
    const months: any[] = [];
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    let current = new Date(startYear, startMonthNum - 1, 1); // JS months are 0-based
    const [endYear, endMonthNum] = endMonth.split('-').map(Number);
    const end = new Date(endYear, endMonthNum, 1); // first day of month after endMonth
    let lastCumBaseline = 0, lastCumPlanned = 0, lastCumActual = 0;
    let idx = 0;
    let lastActualsForEAC = 0;
    let eacProjection = 0;
    // First, collect all month strings for the chart
    const allMonthStrs: string[] = [];
    let tempCurrent = new Date(current);
    while (tempCurrent < end) {
      allMonthStrs.push(format(tempCurrent, 'yyyy-MM'));
      tempCurrent = addMonths(tempCurrent, 1);
    }
    const selectedIdx = allMonthStrs.findIndex(m => m === selectedMonth);
    while (current < end) {
      const monthStr: string = format(current, 'yyyy-MM');
      let cumActual: number | null = null;
      let cumEACCombinedLocal: number | null = null;
      if (monthMap[monthStr]) {
        if (idx < selectedIdx) {
          cumActual = monthMap[monthStr].cumActual;
          cumEACCombinedLocal = null;
          lastActualsForEAC = monthMap[monthStr].cumActual;
        } else if (idx === selectedIdx) {
          cumActual = monthMap[monthStr].cumActual;
          cumEACCombinedLocal = monthMap[monthStr].cumActual;
          lastActualsForEAC = monthMap[monthStr].cumActual;
          eacProjection = monthMap[monthStr].cumActual;
        } else {
          cumActual = null;
          eacProjection += monthMap[monthStr].planned || 0;
          cumEACCombinedLocal = eacProjection;
        }
        months.push({ ...monthMap[monthStr], cumEACCombined: cumEACCombinedLocal, cumActual });
        lastCumBaseline = monthMap[monthStr].cumBaseline;
        lastCumPlanned = monthMap[monthStr].cumPlanned;
        lastCumActual = monthMap[monthStr].cumActual;
      } else {
        if (idx < selectedIdx) {
          cumActual = lastCumActual;
          cumEACCombinedLocal = null;
          lastActualsForEAC = lastCumActual;
        } else if (idx === selectedIdx) {
          cumActual = lastCumActual;
          cumEACCombinedLocal = lastCumActual;
          lastActualsForEAC = lastCumActual;
          eacProjection = lastCumActual;
        } else {
          cumActual = null;
          eacProjection += 0;
          cumEACCombinedLocal = eacProjection;
        }
        months.push({
          month: monthStr,
          baseline: 0,
          planned: 0,
          actual: 0,
          cumBaseline: lastCumBaseline,
          cumPlanned: lastCumPlanned,
          cumActual,
          cumEACCombined: cumEACCombinedLocal,
        });
      }
      current = addMonths(current, 1);
      idx++;
    }
    setFilledSummary(months);
    setOutOfWindowWarning(warning);
  }, [program, fullSummary, selectedMonth]);

  // Compute missing actuals for selectedMonth
  useEffect(() => {
    if (!ledgerEntries || !selectedMonth) {
      setMissingActuals([]);
      return;
    }
    const [year, month] = selectedMonth.split('-').map(Number);
    // JS months are 0-based, so month-1
    const lastDay = new Date(year, month, 0); // 0th day of next month = last day of this month
    // Format lastDay as YYYY-MM-DD string
    const lastDayStr = lastDay.toISOString().slice(0, 10);
    const missing = ledgerEntries.filter(entry => {
      if (!entry.planned_date) return false;
      // Compare planned_date and lastDayStr as strings
      if (entry.planned_date > lastDayStr) return false;
      // Missing if either actual_date or actual_amount is not set
      return !entry.actual_date || entry.actual_amount == null;
    });
    setMissingActuals(missing);
  }, [ledgerEntries, selectedMonth]);

  // Aggregate per-category planned and actuals for the selected month
  const categoryData = React.useMemo(() => {
    if (!ledgerEntries || ledgerEntries.length === 0) return [];
    const cutoff = new Date(selectedMonth + '-31');
    const map: Record<string, { category: string, planned: number, actual: number }> = {};
    ledgerEntries.forEach(entry => {
      if (!entry.wbs_category) return;
      if (!map[entry.wbs_category]) {
        map[entry.wbs_category] = { category: entry.wbs_category, planned: 0, actual: 0 };
      }
      // Planned: sum all planned amounts regardless of date
      map[entry.wbs_category].planned += Number(entry.planned_amount) || 0;
      // Actual: only sum if actual_date is on or before the selected month
      if (entry.actual_date && new Date(entry.actual_date) <= cutoff) {
        map[entry.wbs_category].actual += Number(entry.actual_amount) || 0;
      }
    });
    // Sort alphabetically by category name
    return Object.values(map).sort((a, b) => a.category.localeCompare(b.category));
  }, [ledgerEntries, selectedMonth]);

  // For donut chart: percent of total actuals by category
  const totalActuals = categoryData.reduce((sum, c) => sum + c.actual, 0);

  // 1. Define a function to refresh all relevant data:
  const refreshAll = () => {
    fetchSummary();
    fetchFullSummary();
    fetchTopRowSummary();
    fetchLedgerEntries();
  };

  // Export chart as PNG
  const handleExportPng = async () => {
    if (chartRef.current && program && program.code && selectedMonth) {
      const canvas = await html2canvas(chartRef.current, { background: '#fff', useCORS: true });
      const link = document.createElement('a');
      // Format month as 'MMM yyyy'
      const [year, month] = selectedMonth.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      link.download = `${program.code} - ${monthLabel} Monthly Financials.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  useEffect(() => {
    // Listen for sidebar open/close events by checking the sidebar element's width
    const sidebar = document.getElementById('main-sidebar');
    if (!sidebar) return;
    const updateSidebarWidth = () => {
      const width = sidebar.getBoundingClientRect().width;
      setSidebarWidth(width);
    };
    updateSidebarWidth();
    const resizeObserver = new window.ResizeObserver(updateSidebarWidth);
    resizeObserver.observe(sidebar);
    window.addEventListener('resize', updateSidebarWidth);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSidebarWidth);
    };
  }, []);

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Program Dashboard</h1>
        <p className="text-gray-500 mb-8">Dashboard for Program ID: <span className="font-mono">{id}</span></p>

        {/* Actuals Missing Flag */}
        {missingActuals.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded border border-yellow-300 font-semibold text-center flex items-center justify-center gap-4">
            <span>Actuals Missing: Some planned entries for the selected or previous months do not have actuals entered.</span>
            <button
              className="px-3 py-1 rounded bg-yellow-200 border border-yellow-400 text-yellow-900 font-semibold hover:bg-yellow-300"
              onClick={() => setMissingModalOpen(true)}
            >
              View Missing Entries
            </button>
          </div>
        )}
        {/* Modal for missing actuals */}
        {missingModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: 12, padding: 32, minWidth: 400, maxWidth: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 18 }}>Missing Actuals Entries</span>
                <button onClick={() => setMissingModalOpen(false)} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {missingActuals.length === 0 ? (
                  <div className="text-gray-500">No missing entries.</div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-2">Vendor</th>
                        <th className="px-2 py-2">Description</th>
                        <th className="px-2 py-2">Planned Date</th>
                        <th className="px-2 py-2">Planned Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missingActuals.map(entry => (
                        <tr key={entry.id}>
                          <td className="px-2 py-1">{entry.vendor_name}</td>
                          <td className="px-2 py-1">{entry.expense_description}</td>
                          <td className="px-2 py-1">{entry.planned_date}</td>
                          <td className="px-2 py-1">{formatCurrency(entry.planned_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
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
                <div className="text-xs text-gray-500 mt-2">Program Manager: {program.program_manager || '--'}</div>
              </div>
              {/* Type and Dates */}
              <div className="flex flex-col justify-center items-start min-w-[180px] px-8">
                <div className="text-xs text-gray-400 mb-1">Type</div>
                <div className="font-semibold text-gray-700 mb-2">{program.type}</div>
                <div className="text-xs text-gray-400 mb-1">Dates</div>
                {program.type === 'Period of Performance' ? (
                  <div className="text-sm text-gray-700">{formatDate(program.startDate)} - {formatDate(program.endDate)}</div>
                ) : (
                  <div className="text-sm text-gray-700">N/A</div>
                )}
              </div>
              {/* Program Description - take up more space */}
              <div className="flex flex-col justify-center px-8 flex-1 max-w-2xl">
                <div className="text-gray-600 text-sm line-clamp-3">{program.description}</div>
              </div>
              {/* Financial Info (Budget, % Spent, VAC%) all the way right */}
              <div className="flex flex-row items-stretch min-w-[340px] ml-auto">
                {/* Budget fills vertical space */}
                <div className="flex flex-col justify-center items-center px-6 border-l border-r border-gray-200">
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-gray-400 text-sm mb-1 font-bold">Budget</div>
                    <div className="font-bold text-4xl text-gray-900 whitespace-nowrap" style={{ position: 'relative', cursor: 'pointer' }}>
                      {program.totalBudget ? formatCurrency(program.totalBudget) : '--'}
                    </div>
                  </div>
                </div>
                {/* % Spent and VAC% stacked */}
                <div className="flex flex-col justify-center items-center px-6">
                  {/* % Spent */}
                  <div className="flex flex-col items-center mb-2">
                    <div className="text-gray-400 text-sm mb-1 font-bold">% Spent</div>
                    <div className="font-bold text-2xl text-gray-900">
                      {topRowSummary && topRowSummary.eac ?
                        formatPercent((topRowSummary.actualsToDate / topRowSummary.eac) * 100) : '--'}
                    </div>
                  </div>
                  {/* VAC% */}
                  <div className="flex flex-col items-center mt-2">
                    <div className="text-gray-400 text-sm mb-1 font-bold">VAC%</div>
                    <div className={`font-bold text-2xl ${topRowSummary && topRowSummary.vac < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {topRowSummary && program.totalBudget ?
                        formatPercent((topRowSummary.vac / program.totalBudget) * 100, true) : '--'}
                    </div>
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
                    onClick={() => setDropdownOpen(o => !o)}
                  >
                    See previous reporting months
                  </button>
                  {dropdownOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-white bg-opacity-95 border border-gray-200 rounded shadow-lg z-10 max-h-64 overflow-y-auto">
                      {(filledSummary as any[])
                        .filter(m => {
                          if (!program || !program.startDate || !program.endDate) return true;
                          const [mYear, mMonth] = m.month.split('-').map(Number);
                          const [startYear, startMonth] = program.startDate.split('-').map(Number);
                          const [endYear, endMonth] = program.endDate.split('-').map(Number);
                          const afterOrAtStart = (mYear > startYear) || (mYear === startYear && mMonth >= startMonth);
                          const beforeOrAtEnd = (mYear < endYear) || (mYear === endYear && mMonth <= endMonth);
                          const now = new Date();
                          const nowYear = now.getFullYear();
                          const nowMonth = now.getMonth() + 1;
                          const notFuture = (mYear < nowYear) || (mYear === nowYear && mMonth <= nowMonth);
                          return afterOrAtStart && beforeOrAtEnd && notFuture;
                        })
                        .sort((a, b) => {
                          // Sort in descending order (most recent first)
                          return b.month.localeCompare(a.month);
                        })
                        .map(m => {
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
                {/* Actuals to Date */}
                <div className={`rounded-xl shadow p-4 transition-colors ${missingActuals.length > 0 ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-white'}`}
                  style={missingActuals.length > 0 ? { opacity: 0.6 } : {}}>
                  <div className={`text-sm mb-1 ${missingActuals.length > 0 ? 'text-gray-400' : 'text-gray-500'}`}>{missingActuals.length > 0 ? <span style={{ fontSize: '1.5em', verticalAlign: 'middle' }}>⚠️</span> : ''} Actuals to Date</div>
                  <div className={`font-bold text-2xl ${missingActuals.length > 0 ? 'text-gray-500' : 'text-gray-900'}`}>{formatCurrency(summary.actualsToDate)}</div>
                </div>
                {/* ETC (Future Planned) */}
                <div className={`rounded-xl shadow p-4 transition-colors ${missingActuals.length > 0 ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-white'}`}
                  style={missingActuals.length > 0 ? { opacity: 0.6 } : {}}>
                  <div className={`text-sm mb-1 ${missingActuals.length > 0 ? 'text-gray-400' : 'text-gray-500'}`}>{missingActuals.length > 0 ? <span style={{ fontSize: '1.5em', verticalAlign: 'middle' }}>⚠️</span> : ''} ETC (Future Planned)</div>
                  <div className={`font-bold text-2xl ${missingActuals.length > 0 ? 'text-gray-500' : 'text-gray-900'}`}>{formatCurrency(summary.etc)}</div>
                </div>
                {/* EAC (Actuals + ETC) */}
                <div className={`rounded-xl shadow p-4 transition-colors ${missingActuals.length > 0 ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-white'}`}
                  style={missingActuals.length > 0 ? { opacity: 0.6 } : {}}>
                  <div className={`text-sm mb-1 ${missingActuals.length > 0 ? 'text-gray-400' : 'text-gray-500'}`}>{missingActuals.length > 0 ? <span style={{ fontSize: '1.5em', verticalAlign: 'middle' }}>⚠️</span> : ''} EAC (Actuals + ETC)</div>
                  <div className={`font-bold text-2xl ${missingActuals.length > 0 ? 'text-gray-500' : 'text-gray-900'}`}>{formatCurrency(summary.eac)}</div>
                </div>
                {/* VAC (Budget - EAC) */}
                <div className={`rounded-xl shadow p-4 transition-colors ${missingActuals.length > 0 ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-white'}`}
                  style={missingActuals.length > 0 ? { opacity: 0.6 } : {}}>
                  <div className={`text-sm mb-1 ${missingActuals.length > 0 ? 'text-gray-400' : 'text-gray-500'}`}>{missingActuals.length > 0 ? <span style={{ fontSize: '1.5em', verticalAlign: 'middle' }}>⚠️</span> : ''} VAC (Budget - EAC)</div>
                  <div className={`font-bold text-2xl ${missingActuals.length > 0 ? 'text-gray-500' : summary.vac < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(summary.vac)}</div>
                </div>
              </div>
            )}

            {/* Additional Metrics Section */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Schedule Variance (SV) */}
                <div className={`rounded-xl shadow p-4 transition-colors ${missingActuals.length > 0 ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-white'}`}
                  style={missingActuals.length > 0 ? { opacity: 0.6 } : {}}>
                  <div className={`text-sm mb-1 ${missingActuals.length > 0 ? 'text-gray-400' : 'text-gray-500'}`}>{missingActuals.length > 0 ? <span style={{ fontSize: '1.5em', verticalAlign: 'middle' }}>⚠️</span> : ''} Schedule Variance (SV)</div>
                  <div className="text-xs text-gray-400 mb-2">Actuals to Date - Baseline to Date</div>
                  <div className={`font-semibold text-lg ${missingActuals.length > 0 ? 'text-gray-500' : summary.scheduleVariance > 0 ? 'text-blue-600' : 'text-yellow-600'}`}>{formatCurrency(summary.scheduleVariance)}</div>
                  <div className="text-xs text-gray-400 mt-1">SPI: {summary.schedulePerformanceIndex?.toFixed(2)}</div>
                </div>
                {/* Cost Variance (CV) */}
                <div className={`rounded-xl shadow p-4 transition-colors ${missingActuals.length > 0 ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-white'}`}
                  style={missingActuals.length > 0 ? { opacity: 0.6 } : {}}>
                  <div className={`text-sm mb-1 ${missingActuals.length > 0 ? 'text-gray-400' : 'text-gray-500'}`}>{missingActuals.length > 0 ? <span style={{ fontSize: '1.5em', verticalAlign: 'middle' }}>⚠️</span> : ''} Cost Variance (CV)</div>
                  <div className="text-xs text-gray-400 mb-2">Planned to Date - Actuals to Date</div>
                  <div className={`font-semibold text-lg ${missingActuals.length > 0 ? 'text-gray-500' : summary.costVariance > 0 ? 'text-blue-600' : 'text-yellow-600'}`}>{formatCurrency(summary.costVariance)}</div>
                  <div className="text-xs text-gray-400 mt-1">CPI: {summary.costPerformanceIndex?.toFixed(2)}</div>
                </div>
                {/* Project Baseline */}
                <div className="bg-white rounded-xl shadow p-4">
                  <div className="text-sm text-gray-500 mb-1">Project Baseline</div>
                  <div className="text-xs text-gray-400 mb-2">All baseline amounts</div>
                  <div className="font-semibold text-lg text-gray-900 text-right">{formatCurrency(summary.project_baseline_total)}</div>
                  <div className="text-xs text-gray-400 mt-1">Baseline to Date: {formatCurrency(summary.baselineToDate)}</div>
                </div>
                {/* Project Planned */}
                <div className="bg-white rounded-xl shadow p-4">
                  <div className="text-sm text-gray-500 mb-1">Project Planned</div>
                  <div className="text-xs text-gray-400 mb-2">All planned amounts</div>
                  <div className="font-semibold text-lg text-gray-900 text-right">{formatCurrency(summary.project_planned_total)}</div>
                  <div className="text-xs text-gray-400 mt-1">Planned to Date: {formatCurrency(summary.plannedToDate)}</div>
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
                {/* Export as PNG and Full Screen Buttons */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
                  <button
                    onClick={handleExportPng}
                    style={{
                      background: '#3B82F6',
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
                    Export as PNG
                  </button>
                  <button
                    onClick={() => setFullScreenOpen(true)}
                    style={{
                      background: '#3B82F6',
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
                    Full Screen
                  </button>
                </div>
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
                <div ref={chartRef} className="w-full h-72">
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
                            tick={(props) => {
                              const { x, y, payload, index } = props;
                              // Show all if <=12, every 3rd if <=36, every 6th if more
                              const total = filledSummary.length;
                              let show = true;
                              if (total > 36) {
                                show = index % 6 === 0;
                              } else if (total > 12) {
                                show = index % 3 === 0;
                              }
                              if (!show) return <g />;
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
                            label={(props: any) => <CustomYAxisLabel {...props} axis="left" />}
                            domain={['auto', 'auto']}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                            label={(props: any) => <CustomYAxisLabel {...props} axis="right" />}
                            domain={[0, 'dataMax']}
                          />
                          <Tooltip content={<MainChartTooltip />} />
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
                            name="Cumulative Projected"
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
                {/* Full Screen Modal */}
                {fullScreenOpen && (
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: sidebarWidth,
                      width: `calc(100vw - ${sidebarWidth}px)` ,
                      height: '100vh',
                      background: 'rgba(0,0,0,0.35)',
                      zIndex: 2000,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 32,
                    }}
                  >
                    <div
                      style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: 32,
                        minWidth: 900,
                        minHeight: 600,
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        position: 'relative',
                        width: '100%',
                        height: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Modal Header: Export left, Close right */}
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <button
                          onClick={handleExportPng}
                          style={{
                            background: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            borderRadius: 5,
                            padding: '3px 10px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontSize: 12,
                            opacity: 0.85,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                            marginRight: 8
                          }}
                        >
                          Export as PNG
                        </button>
                        <button
                          onClick={() => setFullScreenOpen(false)}
                          style={{
                            fontSize: 28,
                            background: 'none',
                            border: 'none',
                            color: '#6B7280',
                            cursor: 'pointer',
                            fontWeight: 700,
                            zIndex: 10,
                            marginLeft: 8
                          }}
                          aria-label="Close Full Screen"
                        >
                          &times;
                        </button>
                      </div>
                      <div style={{ flex: 1, width: '100%', height: '100%' }}>
                        {filledSummary && filledSummary.length > 0 ? (
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
                                tick={(props) => {
                                  const { x, y, payload, index } = props;
                                  // Show all if <=12, every 3rd if <=36, every 6th if more
                                  const total = filledSummary.length;
                                  let show = true;
                                  if (total > 36) {
                                    show = index % 6 === 0;
                                  } else if (total > 12) {
                                    show = index % 3 === 0;
                                  }
                                  if (!show) return <g />;
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
                                label={(props: any) => <CustomYAxisLabel {...props} axis="left" />}
                                domain={['auto', 'auto']}
                              />
                              <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                                label={(props: any) => <CustomYAxisLabel {...props} axis="right" />}
                                domain={[0, 'dataMax']}
                              />
                              <Tooltip content={<MainChartTooltip />} />
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
                                name="Cumulative Projected"
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
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">No data</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                <div className="flex w-full justify-between items-center mb-2">
                  <div className="text-lg font-bold">Category Breakdown</div>
                  <button
                    className="px-3 py-1 rounded bg-blue-100 border border-blue-300 text-blue-900 font-semibold hover:bg-blue-200 text-sm"
                    onClick={() => setCategoryChartType(type => type === 'bullet' ? 'donut' : 'bullet')}
                  >
                    {categoryChartType === 'bullet' ? 'Show Donut Chart' : 'Show Bullet Chart'}
                  </button>
                </div>
                <div className="w-full h-72">
                  {categoryData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No data</div>
                  ) : categoryChartType === 'bullet' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={categoryData}
                        margin={{ left: 40, right: 40, top: 20, bottom: 20 }}
                        barGap={-20}
                        barCategoryGap="20%"
                      >
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="category" width={120} />
                        <Tooltip content={<BulletChartTooltip />} />
                        <Bar
                          dataKey="planned"
                          barSize={30}
                          fill="#E5E7EB"
                          radius={[0, 0, 0, 0]}
                          isAnimationActive={false}
                        />
                        <Bar
                          dataKey="actual"
                          barSize={14}
                          fill="#2563EB"
                          radius={[8, 8, 8, 8]}
                          label={{ position: 'right', formatter: (v: number) => v > 0 ? `$${v.toLocaleString()}` : '' }}
                          isAnimationActive={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="actual"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          isAnimationActive={false}
                        >
                          {categoryData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, 'Actual']}
                          labelFormatter={(name: string) => {
                            const cat = categoryData.find(c => c.category === name);
                            if (!cat) return name;
                            const planned = cat.planned;
                            return `${name} (Planned: $${planned.toLocaleString()})`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Ledger/Transactions Table Section */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-lg font-bold mb-4">Ledger / Transactions</div>
              {program && program.id && <LedgerTable programId={program.id} onChange={refreshAll} />}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProgramDashboard; 