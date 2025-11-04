import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BackArrow } from '../common/icons';
import { programSetupApi, SetupStatus } from '../../services/programSetupApi';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Extract program id from URL if present
  const match = location.pathname.match(/\/programs\/([a-f0-9-]+)/i);
  const programId = match ? match[1] : null;
  const insideProgram = Boolean(programId);

  // Sidebar open/collapsed state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [loadingSetupStatus, setLoadingSetupStatus] = useState(false);

  // Load setup status when inside a program
  useEffect(() => {
    if (programId) {
      loadSetupStatus();
    } else {
      setSetupStatus(null);
    }
  }, [programId]);

  const loadSetupStatus = async () => {
    if (!programId) return;
    
    try {
      setLoadingSetupStatus(true);
      const status = await programSetupApi.getSetupStatus(programId);
      setSetupStatus(status);
    } catch (error) {
      console.error('Error loading setup status:', error);
      // If setup status check fails, assume setup is complete (for old programs)
      setSetupStatus(null);
    } finally {
      setLoadingSetupStatus(false);
    }
  };

  const getSetupProgress = (): { completed: number; total: number; percentage: number } => {
    if (!setupStatus) {
      return { completed: 4, total: 4, percentage: 100 }; // Assume complete if no status
    }

    let completed = 0;
    if (setupStatus.boeCreated && setupStatus.boeApproved) completed++;
    if (setupStatus.boeBaselined) completed++;
    if (setupStatus.riskOpportunityRegisterCreated) completed++;
    // Always count "complete" as a step
    completed++; // Setup complete itself is a step

    return {
      completed: setupStatus.setupComplete ? 3 : completed,
      total: 3,
      percentage: setupStatus.setupComplete ? 100 : Math.round((completed / 3) * 100),
    };
  };

  const isSetupComplete = setupStatus?.setupComplete ?? true; // Default to true for old programs
  const progress = getSetupProgress();

  const getNavLinkClassName = (enabled: boolean = true) => {
    const baseClass = `flex ${sidebarOpen ? 'flex-row' : 'flex-col'} items-center justify-center gap-2 px-0 py-2 rounded-md transition-colors font-medium text-base`;
    const hoverClass = enabled ? 'hover:bg-[#232b3b]' : '';
    const disabledClass = !enabled ? 'opacity-50 cursor-not-allowed' : '';
    return `${baseClass} ${hoverClass} ${disabledClass}`;
  };

  const handleDisabledLinkClick = (e: React.MouseEvent, setupPath?: string) => {
    e.preventDefault();
    if (setupPath && programId) {
      navigate(setupPath);
    }
  };

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

      {/* Setup Progress Indicator */}
      {insideProgram && setupStatus && !isSetupComplete && sidebarOpen && (
        <div
          className="mx-4 mb-2 mt-4 p-3 rounded-md bg-yellow-900/30 border border-yellow-700/50"
          style={{ width: 'calc(100% - 32px)' }}
        >
          <div className="text-xs font-medium text-yellow-200 mb-2">Setup Progress</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="text-xs text-yellow-300">
            {progress.completed} of {progress.total} steps complete
          </div>
          <Link
            to={`/programs/${programId}/setup`}
            className="text-xs text-yellow-400 hover:text-yellow-300 underline mt-1 block"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            Complete Setup →
          </Link>
        </div>
      )}

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
            className={`${sidebarOpen ? 'flex-row' : 'flex-col'} flex items-center justify-center gap-2 px-0 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base bg-[#232b3b]`}
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
            <Link
              to="/docs"
              className={`flex ${sidebarOpen ? 'flex-row' : 'flex-col'} items-center justify-center gap-2 px-0 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base`}
              style={{ width: '100%' }}
            >
              <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>📚</span>
              {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>Documentation</span>}
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

            {/* Setup Link - Show if setup incomplete */}
            {!isSetupComplete && (
              <Link
                to={`/programs/${programId}/setup`}
                className={`flex ${sidebarOpen ? 'flex-row' : 'flex-col'} items-center justify-center gap-2 px-0 py-2 rounded-md hover:bg-[#232b3b] transition-colors font-medium text-base bg-yellow-900/30 border border-yellow-700/50`}
                style={{ width: '100%' }}
              >
                <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>⚙️</span>
                {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>Complete Setup</span>}
              </Link>
            )}

            {/* Dashboard Link - Disabled if setup incomplete */}
            {isSetupComplete ? (
              <Link
                to={`/programs/${programId}/dashboard`}
                className={getNavLinkClassName()}
                style={{ width: '100%' }}
              >
                <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>🏠</span>
                {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>Program Home</span>}
              </Link>
            ) : (
              <div
                className={getNavLinkClassName(false)}
                style={{ width: '100%' }}
                onClick={(e) => handleDisabledLinkClick(e, `/programs/${programId}/setup`)}
                title="Complete setup to access Program Home"
              >
                <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>🏠</span>
                {sidebarOpen && (
                  <span style={{ textAlign: 'left', width: '100%' }}>
                    Program Home <span className="text-xs text-gray-400">(Setup Required)</span>
                  </span>
                )}
              </div>
            )}

            {/* Ledger Link - Disabled if BOE not baselined */}
            {isSetupComplete ? (
              <Link
                to={`/programs/${programId}/ledger`}
                className={getNavLinkClassName()}
                style={{ width: '100%' }}
              >
                <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>📒</span>
                {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>Ledger</span>}
              </Link>
            ) : (
              <div
                className={getNavLinkClassName(false)}
                style={{ width: '100%' }}
                onClick={(e) => handleDisabledLinkClick(e, `/programs/${programId}/setup`)}
                title="Complete setup to access Ledger"
              >
                <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>📒</span>
                {sidebarOpen && (
                  <span style={{ textAlign: 'left', width: '100%' }}>
                    Ledger <span className="text-xs text-gray-400">(Setup Required)</span>
                  </span>
                )}
              </div>
            )}

            {/* Upload Actuals - Disabled if setup not complete */}
            {isSetupComplete ? (
              <Link
                to={`/programs/${programId}/actuals`}
                className={getNavLinkClassName()}
                style={{ width: '100%' }}
              >
                <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>📥</span>
                {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>Upload Actuals</span>}
              </Link>
            ) : (
              <div
                className={getNavLinkClassName(false)}
                style={{ width: '100%' }}
                onClick={(e) => handleDisabledLinkClick(e, `/programs/${programId}/setup`)}
                title="Complete setup to access Upload Actuals"
              >
                <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>📥</span>
                {sidebarOpen && (
                  <span style={{ textAlign: 'left', width: '100%' }}>
                    Upload Actuals <span className="text-xs text-gray-400">(Setup Required)</span>
                  </span>
                )}
              </div>
            )}

            {/* BOE Link - Always available (needed for setup) */}
            <Link
              to={`/programs/${programId}/boe`}
              className={getNavLinkClassName()}
              style={{ width: '100%' }}
            >
              <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>📊</span>
              {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>BOE</span>}
            </Link>

            {/* Risks & Opportunities - Disabled if R&O register not initialized */}
            {isSetupComplete || (setupStatus?.riskOpportunityRegisterCreated) ? (
              <Link
                to={`/programs/${programId}/risks`}
                className={getNavLinkClassName()}
                style={{ width: '100%' }}
              >
                <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>⚠️</span>
                {sidebarOpen && <span style={{ textAlign: 'left', width: '100%' }}>Risks & Opportunities</span>}
              </Link>
            ) : (
              <div
                className={getNavLinkClassName(false)}
                style={{ width: '100%' }}
                onClick={(e) => handleDisabledLinkClick(e, `/programs/${programId}/setup`)}
                title="Initialize Risk & Opportunity register in setup"
              >
                <span className="text-xl" style={sidebarOpen ? { paddingLeft: 20 } : {}}>⚠️</span>
                {sidebarOpen && (
                  <span style={{ textAlign: 'left', width: '100%' }}>
                    Risks & Opportunities <span className="text-xs text-gray-400">(Setup Required)</span>
                  </span>
                )}
              </div>
            )}

            {/* Program Settings - Always available */}
            <Link
              to={`/programs/${programId}/settings`}
              className={getNavLinkClassName()}
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
