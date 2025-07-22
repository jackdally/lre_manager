import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBOEStore } from '../../../store/boeStore';
import BOEOverview from './BOEOverview';
import BOEDetails from './BOEDetails';
import BOEApproval from './BOEApproval';
import BOEHistory from './BOEHistory';

interface BOEPageProps {
  programId?: string;
}

const BOEPage: React.FC<BOEPageProps> = ({ programId: propProgramId }) => {
  const { programId: urlProgramId } = useParams<{ programId: string }>();
  const programId = propProgramId || urlProgramId;
  
  const {
    currentBOE,
    boeLoading,
    boeError,
    activeTab,
    setActiveTab,
    setCurrentBOE,
    setBOELoading,
    setBOEError,
  } = useBOEStore();

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!programId) {
      setBOEError('Program ID is required');
      return;
    }

    const loadBOE = async () => {
      try {
        setBOELoading(true);
        setBOEError(null);
        
        // TODO: Replace with actual API call
        // const boeData = await boeApiService.versions.getCurrentBOE(programId);
        // setCurrentBOE(boeData.currentBOE || null);
        
        // For now, simulate loading
        setTimeout(() => {
          setBOELoading(false);
          setIsInitialized(true);
        }, 1000);
      } catch (error) {
        console.error('Error loading BOE:', error);
        setBOEError(error instanceof Error ? error.message : 'Failed to load BOE');
        setBOELoading(false);
      }
    };

    loadBOE();
  }, [programId, setCurrentBOE, setBOELoading, setBOEError]);



  if (!programId) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>Program ID is required to view BOE.</p>
        </div>
      </div>
    );
  }

  if (boeLoading && !isInitialized) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading BOE...</span>
          </div>
        </div>
      </div>
    );
  }

  if (boeError) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <h4>Error Loading BOE</h4>
          <p>{boeError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row mb-3">
        <div className="col">
          <h2>Basis of Estimate (BOE)</h2>
          <p className="text-muted">
            Manage and track project estimates, costs, and management reserve
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'approval' ? 'active' : ''}`}
                onClick={() => setActiveTab('approval')}
              >
                Approval
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                History
              </button>
            </li>
          </ul>

          <div className="tab-content">
            {activeTab === 'overview' && <BOEOverview programId={programId} />}
            {activeTab === 'details' && <BOEDetails programId={programId} />}
            {activeTab === 'approval' && <BOEApproval programId={programId} />}
            {activeTab === 'history' && <BOEHistory programId={programId} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOEPage; 