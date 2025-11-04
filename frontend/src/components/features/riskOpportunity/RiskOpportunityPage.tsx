import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../layout';
import { riskOpportunityApi } from '../../../services/riskOpportunityApi';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

type TabType = 'risks' | 'opportunities';

const RiskOpportunityPage: React.FC = () => {
  const { id: programId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('risks');
  const [loading, setLoading] = useState(true);
  const [registerInitialized, setRegisterInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) return;

    const checkRegisterStatus = async () => {
      try {
        setLoading(true);
        const status = await riskOpportunityApi.getRegisterStatus(programId);
        setRegisterInitialized(status.initialized);
      } catch (err: any) {
        console.error('Error checking register status:', err);
        setError('Failed to check register status');
      } finally {
        setLoading(false);
      }
    };

    checkRegisterStatus();
  }, [programId]);

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!registerInitialized) {
    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <InformationCircleIcon className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Register Not Initialized</h3>
                <p className="text-yellow-800 mb-4">
                  The Risk & Opportunity register has not been initialized for this program. Please complete the program setup to initialize the register.
                </p>
                <Link
                  to={`/programs/${programId}/setup`}
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors"
                >
                  Go to Program Setup
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Risks & Opportunities</h1>
          <p className="text-gray-600">
            Manage program risks and opportunities, track assessments, and monitor risk trends.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('risks')}
              className={`
                py-3 px-2 border-b-2 font-semibold text-base flex items-center gap-2
                ${activeTab === 'risks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>⚠️</span>
              Risk Management
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`
                py-3 px-2 border-b-2 font-semibold text-base flex items-center gap-2
                ${activeTab === 'opportunities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>✨</span>
              Opportunity Management
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'risks' && (
            <div className="p-8">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Risk Management</h2>
                <p className="text-gray-600 mb-6">
                  Risk management functionality will be implemented in a future release.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                  <p className="text-sm text-blue-800">
                    <strong>Coming Soon:</strong> You'll be able to create and manage risks, assess probability and impact, 
                    track risk responses, and link risks to Management Reserve utilization.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'opportunities' && (
            <div className="p-8">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Opportunity Management</h2>
                <p className="text-gray-600 mb-6">
                  Opportunity management functionality will be implemented in a future release.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto">
                  <p className="text-sm text-green-800">
                    <strong>Coming Soon:</strong> You'll be able to create and manage opportunities, assess probability and benefit, 
                    track opportunity realization, and link opportunities to Management Reserve credits.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RiskOpportunityPage;

