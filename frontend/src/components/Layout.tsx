import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  // Extract program id from URL if present
  const match = location.pathname.match(/\/programs\/([a-f0-9-]+)/i);
  const programId = match ? match[1] : null;
  const insideProgram = Boolean(programId);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#151c28] text-white flex flex-col">
        <div className="h-16 flex items-center px-6 font-bold text-lg tracking-wide border-b border-[#232b3b]">
          Navigation
        </div>
        <nav className="flex-1 py-4 px-2">
          {!insideProgram ? (
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base bg-[#232b3b]"
            >
              <span className="text-xl">📁</span>
              Programs
            </Link>
          ) : (
            <>
              <Link
                to="/"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base bg-[#232b3b]"
              >
                <span className="text-xl">⬅️</span>
                Go Back to Program Selection
              </Link>
              <Link
                to={`/programs/${programId}/dashboard`}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base mt-2"
              >
                <span className="text-xl">🏠</span>
                Program Home
              </Link>
              <Link
                to={`/programs/${programId}/ledger`}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base mt-2"
              >
                <span className="text-xl">📒</span>
                Ledger
              </Link>
              <Link
                to={`/programs/${programId}/boe`}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base mt-2"
              >
                <span className="text-xl">📊</span>
                BOE
              </Link>
              <Link
                to={`/programs/${programId}/risks`}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base mt-2"
              >
                <span className="text-xl">⚠️</span>
                Risks & Opportunities
              </Link>
              {insideProgram && (
                <Link
                  to={`/programs/${programId}/settings`}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base mt-2"
                >
                  <span className="text-xl">⚙️</span>
                  Program Settings
                </Link>
              )}
            </>
          )}
        </nav>
      </aside>
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-primary-700 font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v-2a4 4 0 014-4h10a4 4 0 014 4v2M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 010 7.75" /></svg>
              LRE Manager
            </span>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Program Manager Dashboard
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 p-10 bg-gray-50 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 