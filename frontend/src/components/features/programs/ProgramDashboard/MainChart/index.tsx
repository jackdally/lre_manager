import React, { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { FullSummaryType } from '../types';
import { MainChartTooltip } from '../ChartTooltips';

interface MainChartProps {
  filledSummary: FullSummaryType[];
  sidebarWidth: number;
  selectedMonth: string;
}

// Custom Y-axis label component
const CustomYAxisLabel = ({ viewBox, axis }: any) => {
  const { y, height, x, width } = viewBox;
  const label = axis === 'left' ? 'Monthly ($)' : 'Cumulative ($)';
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

export const MainChart: React.FC<MainChartProps> = ({
  filledSummary,
  sidebarWidth,
  selectedMonth
}) => {
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  const handleExportPng = async () => {
    const element = document.getElementById('main-chart-container');
    if (element) {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(element, {
        background: 'white',
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = 'program-dashboard-chart.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  // Calculate cumProjected for the chart
  const cutoffIndex = filledSummary.findIndex(item => item.month === selectedMonth);
  const cutoff = cutoffIndex === -1 ? filledSummary.length - 1 : cutoffIndex;
  const cumActualAtCutoff = cutoff >= 0 ? filledSummary[cutoff].cumActual : 0;
  let projectedSum = 0;
  const chartData = filledSummary.map((item, idx) => {
    if (idx < cutoff) {
      return { ...item, cumProjected: item.cumActual };
    } else if (idx === cutoff) {
      return { ...item, cumProjected: item.cumActual };
    } else {
      projectedSum += item.planned;
      return { ...item, cumProjected: cumActualAtCutoff + projectedSum, cumActual: null };
    }
  });

  const renderChart = (isFullScreen = false) => (
    <ResponsiveContainer width="100%" height={isFullScreen ? "100%" : 400}>
      <ComposedChart 
        data={chartData} 
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
        <Tooltip content={<MainChartTooltip selectedMonth={selectedMonth} />} />
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
          dataKey="cumProjected"
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
  );

  return (
    <>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex w-full justify-between items-center mb-4">
          <div className="text-lg font-bold">Program Performance Overview</div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-blue-100 border border-blue-300 text-blue-900 font-semibold hover:bg-blue-200 text-sm"
              onClick={() => setLegendOpen(true)}
            >
              Show Legend
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-100 border border-gray-300 text-gray-900 font-semibold hover:bg-gray-200 text-sm"
              onClick={() => setFullScreenOpen(true)}
            >
              Full Screen
            </button>
          </div>
        </div>
        <div id="main-chart-container" className="w-full h-96">
          {filledSummary && filledSummary.length > 0 ? (
            renderChart()
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No data</div>
          )}
        </div>
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
                renderChart(true)
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
          </div>
        </div>
      )}
    </>
  );
}; 