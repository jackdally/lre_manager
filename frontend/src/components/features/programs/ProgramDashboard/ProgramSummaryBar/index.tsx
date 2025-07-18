import React from 'react';
import { Program, TopRowSummaryType } from '../types';
import { formatCurrency, formatPercent, formatDate } from '../utils';

interface ProgramSummaryBarProps {
  program: Program;
  topRowSummary: TopRowSummaryType | null;
}

export const ProgramSummaryBar: React.FC<ProgramSummaryBarProps> = ({
  program,
  topRowSummary
}) => {
  return (
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
          <span className={`px-3 py-1 rounded text-xs font-medium ${program.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
            {program.status}
          </span>
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
  );
}; 