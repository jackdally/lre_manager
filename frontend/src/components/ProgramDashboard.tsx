import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Layout from './Layout';

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

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <div className="text-lg font-bold mb-2">Monthly Financials</div>
                {/* Placeholder for chart */}
                <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400">[Chart Placeholder]</div>
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
              {/* Placeholder for table */}
              <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">[Ledger Table Placeholder]</div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProgramDashboard; 