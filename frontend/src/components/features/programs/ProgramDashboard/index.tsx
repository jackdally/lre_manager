import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../../layout';
import { programSetupApi } from '../../../../services/programSetupApi';
import LedgerTable from '../../ledger/LedgerTable/LedgerTable';
import { ProgramSummaryBar } from './ProgramSummaryBar';
import { SummaryMetrics } from './SummaryMetrics';
import { AdditionalMetrics } from './AdditionalMetrics';
import { MainChart } from './MainChart';
import { CategoryBreakdown } from './CategoryBreakdown';
import { MissingActualsAlert } from './MissingActualsAlert';
import { MonthSelector } from './MonthSelector';
import MonthlyActualsReminder from '../../../common/MonthlyActualsReminder';
import { Program, SummaryType, FullSummaryType, TopRowSummaryType, LedgerEntry, CategoryDataItem } from './types';
import { getYearMonth, CATEGORY_COLORS } from './utils';

const ProgramDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<Program | null>(null);
  const [summary, setSummary] = useState<SummaryType | null>(null);
  const [topRowSummary, setTopRowSummary] = useState<TopRowSummaryType | null>(null);
  const [filledSummary, setFilledSummary] = useState<FullSummaryType[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDataItem[]>([]);
  const [missingActuals, setMissingActuals] = useState<LedgerEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(250);

  // LedgerTable filter state
  const [filterType, setFilterType] = useState<'all' | 'currentMonthPlanned' | 'emptyActuals'>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('');
  const [wbsElementFilter, setWbsElementFilter] = useState<string>('');
  const [costCategoryFilter, setCostCategoryFilter] = useState<string>('');

  // Filter handlers
  const handleSetVendorFilter = (v: string | undefined) => setVendorFilter(v ?? '');
  const handleSetWbsElementFilter = (v: string | undefined) => setWbsElementFilter(v ?? '');
  const handleSetCostCategoryFilter = (v: string | undefined) => setCostCategoryFilter(v ?? '');

  const getPrevUtcMonth = () => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return prevMonth.toISOString().slice(0, 7);
  };

    const fetchProgram = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);

      // Check setup status first - if not complete, redirect to setup page
      try {
        const setupStatus = await programSetupApi.getSetupStatus(id);
        if (!setupStatus.setupComplete) {
          navigate(`/programs/${id}/setup`);
          return;
        }
      } catch (setupError) {
        // If setup status check fails, continue to dashboard (might be old program without setup status)
        console.warn('Could not check setup status, continuing to dashboard:', setupError);
      }

      // Fetch program details
      const programResponse = await axios.get<Program>(`/api/programs/${id}`);
      const programData = programResponse.data;
      setProgram(programData);

      // Set initial month if not set
      if (!selectedMonth) {
        setSelectedMonth(getPrevUtcMonth());
      }

      // Fetch summary data - use the correct endpoint
      const summaryResponse = await axios.get(`/api/programs/${id}/ledger/summary?month=${selectedMonth}`);
      const summaryData = summaryResponse.data as SummaryType;
      setSummary(summaryData);

      // Fetch full summary for charts
      const fullSummaryResponse = await axios.get(`/api/programs/${id}/ledger/summary-full`);
      const fullSummaryData = fullSummaryResponse.data as FullSummaryType[];
      setFilledSummary(fullSummaryData);

      // Create top row summary from the main summary
      setTopRowSummary({
        actualsToDate: summaryData.actualsToDate,
        eac: summaryData.eac,
        vac: summaryData.vac
      });

      // For now, we'll create a simple category breakdown from the ledger data
      // In a real implementation, you'd have a dedicated endpoint for this
      const ledgerResponse = await axios.get(`/api/programs/${id}/ledger?page=1&pageSize=10000`);
      const ledgerData = (ledgerResponse.data as { entries: LedgerEntry[] }).entries;
      
      // Create category breakdown from ledger data
      const categoryMap = new Map<string, { actual: number; planned: number }>();
      ledgerData.forEach((entry: any) => {
        if (entry.wbsElement && entry.wbsElement.name) {
          if (!categoryMap.has(entry.wbsElement.name)) {
            categoryMap.set(entry.wbsElement.name, { actual: 0, planned: 0 });
          }
          const category = categoryMap.get(entry.wbsElement.name)!;
          category.actual += entry.actual_amount || 0;
          category.planned += entry.planned_amount || 0;
        }
      });

      const categoryDataWithColors = Array.from(categoryMap.entries()).map(([name, data], index) => ({
        name,
        actual: data.actual,
        planned: data.planned,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }));
      setCategoryData(categoryDataWithColors);

      // For missing actuals, we'll filter the ledger data
      const selectedDate = new Date(selectedMonth + '-01T00:00:00Z'); // Always UTC
      const endOfMonth = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth() + 1, 0)); // Last day of month, UTC
      const missingActualsData = ledgerData.filter((entry: any) => {
        if (!entry.planned_date || !entry.planned_amount) return false;
        // Parse planned_date as UTC
        const plannedDate = new Date(entry.planned_date + 'T00:00:00Z');
        // Only include if plannedDate is on or before the end of the selected month
        return (
          plannedDate <= endOfMonth &&
          (!entry.actual_date || !entry.actual_amount)
        );
      });
      setMissingActuals(missingActualsData);

    } catch (err) {
      console.error('Error fetching program data:', err);
      setError('Failed to load program data');
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = () => {
    fetchProgram();
  };

  useEffect(() => {
    fetchProgram();
  }, [id, selectedMonth]);

  useEffect(() => {
    const updateSidebarWidth = () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        setSidebarWidth(sidebar.clientWidth);
      }
    };

    updateSidebarWidth();
    window.addEventListener('resize', updateSidebarWidth);
    return () => window.removeEventListener('resize', updateSidebarWidth);
  }, []);



  if (loading) {
  return (
    <Layout>
          <div className="flex items-center justify-center h-40 text-lg text-gray-500">Loading...</div>
      </Layout>
    );
  }

  if (error) {
                          return (
      <Layout>
        <div className="flex items-center justify-center h-40 text-lg text-red-500">{error}</div>
      </Layout>
    );
  }

  if (!program) {
                              return (
      <Layout>
        <div className="flex items-center justify-center h-40 text-lg text-gray-500">Program not found</div>
      </Layout>
    );
  }

                                  return (
    <Layout>
      <div className="p-6">
        {/* Monthly Actuals Reminder */}
        {id && <MonthlyActualsReminder programId={id} />}
        
        {/* Missing Actuals Alert */}
        <MissingActualsAlert missingActuals={missingActuals} />

        {/* Program Summary Bar */}
        <ProgramSummaryBar program={program} topRowSummary={topRowSummary} />

        {/* Month Selector */}
        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          filledSummary={filledSummary}
          program={program}
        />

        {/* Summary Metrics */}
        <SummaryMetrics 
          summary={summary} 
          missingActualsCount={missingActuals.length} 
        />

        {/* Additional Metrics */}
        <AdditionalMetrics 
          summary={summary} 
          missingActualsCount={missingActuals.length} 
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Main Chart */}
          <MainChart 
            filledSummary={filledSummary} 
            sidebarWidth={sidebarWidth} 
            selectedMonth={selectedMonth!} 
          />

          {/* Category Breakdown */}
          <CategoryBreakdown categoryData={categoryData} />
            </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-xl shadow">
          
          <LedgerTable 
            programId={id!}
            showAll={false}
            filterType={filterType}
            vendorFilter={vendorFilter}
            wbsElementFilter={wbsElementFilter}
            costCategoryFilter={costCategoryFilter}
            setFilterType={setFilterType}
            setVendorFilter={handleSetVendorFilter}
            setWbsElementFilter={handleSetWbsElementFilter}
            setCostCategoryFilter={handleSetCostCategoryFilter}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ProgramDashboard; 