import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { CategoryDataItem } from '../types';

// Custom tooltip for percent bar chart
const PercentBarTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const percent = data.planned > 0 ? Math.min(100, (data.actual / data.planned) * 100) : 0;
  return (
    <div style={{ background: 'white', border: '1px solid #ccc', borderRadius: 6, padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{data.name}</div>
      <div style={{ color: '#2563EB', fontWeight: 500 }}>Actual: {data.actual?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</div>
      <div style={{ color: '#F59E42', fontWeight: 500 }}>Planned: {data.planned?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</div>
      <div style={{ color: '#374151', fontWeight: 500 }}>Percent Spent: {data.planned > 0 ? percent.toFixed(0) + '%' : '--'}</div>
    </div>
  );
};

interface CategoryBreakdownProps {
  categoryData: CategoryDataItem[];
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ categoryData }) => {
  if (categoryData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center h-full">
        <div className="text-lg font-bold mb-4">Category Breakdown</div>
        <div className="w-full h-72 flex items-center justify-center text-gray-400">No data</div>
      </div>
    );
  }

  // Prepare data for percent bar chart
  const percentData = categoryData.map(cat => ({
    ...cat,
    percent: cat.planned > 0 ? Math.min(100, (cat.actual / cat.planned) * 100) : 0
  }));

  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center h-full flex-1">
      <div className="flex w-full justify-between items-center mb-2">
        <div className="text-lg font-bold">Category Breakdown</div>
      </div>
      <div className="w-full h-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={percentData}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 160, bottom: 0 }}
            barCategoryGap="30%"
            barGap={0}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 14, fill: '#374151', fontWeight: 500 }}
            />
            <Tooltip content={<PercentBarTooltip />} />
            {/* Filled percent bar (actual/planned) */}
            <Bar
              dataKey="percent"
              fill="#2563EB"
              barSize={18}
              radius={[14, 14, 14, 14]}
              isAnimationActive={false}
              label={({ x, y, width, height, value }) => (
                <text
                  x={x + width + 8}
                  y={y + height / 2 + 2}
                  fontSize="13"
                  fontWeight="bold"
                  fill="#374151"
                >
                  {value > 0 ? `${value.toFixed(0)}%` : '--'}
                </text>
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 