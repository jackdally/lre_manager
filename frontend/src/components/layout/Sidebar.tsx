import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BackArrow } from '../common/icons';

const Sidebar: React.FC = () => {
  const location = useLocation();
  // Extract program id from URL if present
  const match = location.pathname.match(/\/programs\/([a-f0-9-]+)/i);
  const programId = match ? match[1] : null;
  const insideProgram = Boolean(programId);

  // Sidebar open/collapsed state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <aside
      id="main-sidebar"
      style={{
        width: sidebarOpen ? '17.5rem' : '56px',
        transition: 'width 0.2s',
        overflow: 'hidden',
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="bg-[#151c28] text-white"
    >
      <div
        className="border-b border-[#232b3b] relative flex items-center justify-center"
        style={{ height: 64, width: '100%' }}
      >
        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen((open) => !open)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 22,
            cursor: 'pointer',
            zIndex: 10,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            position: 'absolute',
            left: sidebarOpen ? 'calc(100% - 48px)' : '8px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
        <span
          style={{
            marginLeft: sidebarOpen ? 0 : 36,
            fontWeight: 700,
            fontSize: 20,
            width: '100%',
            textAlign: 'center',
            display: sidebarOpen ? 'block' : 'none',
          }}
        >
          Navigation
        </span>
      </div>
      <nav
        className="flex-1"
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 16,
          gap: 16,
        }}
      >
        {!insideProgram ? (
          <>
            <Link
              to="/"
              className={`$${sidebarOpen ? 'flex-row' : 'flex-col'} flex items-center justify-center gap-2 px-0 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base bg-[#232b3b]`}
              style={{ width: '100%', background: '#232b3b' }}
            >
              <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>📁</span>
              {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>Programs</span>}
            </Link>
            <Link
              to="/settings"
              className={`flex ${sidebarOpen ? 'flex-row' : 'flex-col'} items-center justify-center gap-2 px-0 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base`}
              style={{ width: '100%' }}
            >
              <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>⚙️</span>
              {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>Settings</span>}
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/"
              className={`flex ${sidebarOpen ? 'flex-row' : 'flex-col'} items-center justify-center gap-2 px-0 py-2 rounded-md transition-colors font-medium text-base`}
              style={{ width: '100%', background: '#232b3b', color: '#fff' }}
            >
              <BackArrow />
              <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>📁</span>
              {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>Back to Directory</span>}
            </Link>
            <Link
              to={`/programs/${programId}/dashboard`}
              className={`flex ${sidebarOpen ? 'flex-row' : 'flex-col'} items-center justify-center gap-2 px-0 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base`}
              style={{ width: '100%' }}
            >
              <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>🏠</span>
              {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>Program Home</span>}
            </Link>
            <Link
              to={`/programs/${programId}/ledger`}
              className={`flex ${sidebarOpen ? 'flex-row' : 'flex-col'} items-center justify-center gap-2 px-0 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base`}
              style={{ width: '100%' }}
            >
              <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>📒</span>
              {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>Ledger</span>}
            </Link>
            <Link
              to={`/programs/${programId}/actuals`}
              className={`flex ${sidebarOpen ? 'flex-row' : 'flex-col'} items-center justify-center gap-2 px-0 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base`}
              style={{ width: '100%' }}
            >
              <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>📥</span>
              {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>Upload Actuals</span>}
            </Link>
            <Link
              to={`/programs/${programId}/boe`}
              className={`flex ${sidebarOpen ? 'flex-row' : 'flex-col'} items-center justify-center gap-2 px-0 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base`}
              style={{ width: '100%' }}
            >
              <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>📊</span>
              {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>BOE</span>}
            </Link>
            <Link
              to={`/programs/${programId}/risks`}
              className={`flex ${sidebarOpen ? 'flex-row' : 'flex-col'} items-center justify-center gap-2 px-0 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base`}
              style={{ width: '100%' }}
            >
              <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>⚠️</span>
              {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>Risks & Opportunities</span>}
            </Link>
            <Link
              to={`/programs/${programId}/settings`}
              className={`flex ${sidebarOpen ? 'flex-row' : 'flex-col'} items-center justify-center gap-2 px-0 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base`}
              style={{ width: '100%' }}
            >
              <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>⚙️</span>
              {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>Program Settings</span>}
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar; 