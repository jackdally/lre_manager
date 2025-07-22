import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBOEStore } from '../../../store/boeStore';
import Layout from '../../layout';
import BOEOverview from './BOEOverview';
import BOEDetails from './BOEDetails';
import BOEApproval from './BOEApproval';
import BOEHistory from './BOEHistory';

interface BOEPageProps {
  programId?: string;
}

const BOEPage: React.FC<BOEPageProps> = ({ programId: propProgramId }) => {
  const { id: urlProgramId } = useParams<{ id: string }>();
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
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Basis of Estimate (BOE)</h1>
          <p className="mt-2 text-gray-600">
            Manage and track project estimates, costs, and management reserve
          </p>
        </div>

        {/* Error Display */}
        {boeError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{boeError}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>📊</span>
              Overview
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>📋</span>
              Details
            </button>
            <button
              onClick={() => setActiveTab('approval')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${activeTab === 'approval'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>✅</span>
              Approval
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>📚</span>
              History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'overview' && <BOEOverview programId={programId} />}
          {activeTab === 'details' && <BOEDetails programId={programId} />}
          {activeTab === 'approval' && <BOEApproval programId={programId} />}
          {activeTab === 'history' && <BOEHistory programId={programId} />}
        </div>
      </div>
    </Layout>
  );
};

export default BOEPage; 