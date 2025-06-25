import React, { useState } from 'react';
import { Program, FullSummaryType } from '../types';

interface MonthSelectorProps {
  selectedMonth: string | null;
  onMonthChange: (month: string) => void;
  filledSummary: FullSummaryType[];
  program: Program | null;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  onMonthChange,
  filledSummary,
  program
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getMonthLabel = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    return new Date(year, monthNum - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const filteredMonths = filledSummary
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
    .sort((a, b) => b.month.localeCompare(a.month));

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
      <div className="flex items-center gap-4">
        <span className="text-2xl font-bold text-gray-900">
          Reporting Month: {selectedMonth ? getMonthLabel(selectedMonth) : ''}
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
              {filteredMonths.map(m => (
                <div
                  key={m.month}
                  className={`px-4 py-2 cursor-pointer hover:bg-blue-100 ${m.month === selectedMonth ? 'bg-blue-50 font-bold' : ''}`}
                  onClick={() => {
                    onMonthChange(m.month);
                    setDropdownOpen(false);
                  }}
                >
                  {getMonthLabel(m.month)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 