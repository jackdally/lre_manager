import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../layout';
import { riskOpportunityApi } from '../../../services/riskOpportunityApi';
import { InformationCircleIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { boeVersionsApi } from '../../../services/boeApi';
import { useManagementReserve } from '../../../hooks/useManagementReserve';
import { useBOEStore } from '../../../store/boeStore';
import { formatCurrency } from '../../../utils/currencyUtils';
import MRUtilizationHistory from './MRUtilizationHistory';

type TabType = 'risks' | 'opportunities' | 'mr';

const RiskOpportunityPage: React.FC = () => {
  const { id: programId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('risks');
  
  // Check URL params for tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'mr') {
      setActiveTab('mr');
    }
  }, []);
  const [loading, setLoading] = useState(true);
  const [registerInitialized, setRegisterInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setCurrentBOE } = useBOEStore();

  // Load BOE to get MR data
  const loadBOE = async () => {
    if (!programId) return;
    try {
      const boeData = await boeVersionsApi.getCurrentBOE(programId);
      if (boeData.currentBOE) {
        setCurrentBOE(boeData.currentBOE);
      }
    } catch (err) {
      console.error('Error loading BOE:', err);
    }
  };

  const { currentBOE } = useBOEStore();
  const {
    managementReserve,
    mrUtilizationHistory,
    loadManagementReserve,
    loadMRUtilizationHistory,
  } = useManagementReserve(currentBOE?.id);

  useEffect(() => {
    if (!programId) return;

    const checkRegisterStatus = async () => {
      try {
        setLoading(true);
        await loadBOE();
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

  useEffect(() => {
    if (currentBOE?.id) {
      loadManagementReserve();
      loadMRUtilizationHistory();
    }
  }, [currentBOE?.id, loadManagementReserve, loadMRUtilizationHistory]);

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
            <button
              onClick={() => setActiveTab('mr')}
              className={`
                py-3 px-2 border-b-2 font-semibold text-base flex items-center gap-2
                ${activeTab === 'mr'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>💰</span>
              Management Reserve
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'risks' && (
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Risk Management</h2>
                <p className="text-gray-600 mb-6">
                  Manage program risks and utilize Management Reserve when risks materialize.
                </p>
              </div>

              {/* MR Utilization Section - Risks Only */}
              {managementReserve && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-blue-900">Management Reserve Utilization (Risks Only)</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700">Available MR</p>
                      <p className="text-xl font-bold text-blue-900">
                        {formatCurrency(managementReserve.remainingAmount || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-blue-100 border border-blue-300 rounded p-3 mb-3">
                    <p className="text-sm font-semibold text-blue-900 mb-1">⚠️ Important: MR Utilization is for Risks Only</p>
                    <p className="text-sm text-blue-800">
                      <strong>Risks (threats):</strong> When a risk materializes, you can request MR utilization to cover the cost impact. 
                      The utilization is linked directly to the specific risk entry.
                    </p>
                    <p className="text-sm text-blue-800 mt-2">
                      <strong>Opportunities (benefits):</strong> Opportunities are tracked separately and do NOT utilize MR. 
                      They represent potential cost savings or benefits that are tracked independently.
                    </p>
                  </div>
                  <p className="text-sm text-blue-800">
                    When a risk materializes, you can request MR utilization directly from the risk entry. 
                    The utilization will be linked to the specific risk and tracked in the history below.
                  </p>
                </div>
              )}

              {/* Risk List Placeholder */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Risk Register</h3>
                <p className="text-gray-600 mb-4">
                  The full risk management interface will be implemented in a future release. 
                  Once available, you'll be able to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                  <li>Create and manage risks</li>
                  <li>Assess probability and cost impact</li>
                  <li>Request MR utilization when risks materialize</li>
                  <li>Track risk response strategies</li>
                </ul>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> MR utilization functionality is available now. 
                    Once risks can be created, you'll be able to utilize MR directly from each risk entry.
                  </p>
                </div>
              </div>

              {/* MR Utilization History */}
              {managementReserve && mrUtilizationHistory && mrUtilizationHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-gray-600" />
                    MR Utilization History
                  </h3>
                  <MRUtilizationHistory
                    utilizationHistory={mrUtilizationHistory}
                    managementReserve={managementReserve}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'opportunities' && (
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Opportunity Management</h2>
                <p className="text-gray-600 mb-6">
                  Track potential benefits and cost savings that could improve your program outcomes.
                </p>
              </div>

              {/* Opportunity Information */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-800 space-y-3">
                    <div>
                      <p className="font-semibold text-base mb-2">What are Opportunities?</p>
                      <p>
                        Opportunities are potential positive events or conditions that could benefit your program, such as:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                        <li>Early delivery leading to cost savings</li>
                        <li>Technology improvements reducing costs</li>
                        <li>Favorable market conditions</li>
                        <li>Vendor discounts or rebates</li>
                      </ul>
                    </div>
                    <div className="bg-green-100 border border-green-300 rounded p-3">
                      <p className="font-semibold mb-1">💡 Important: Opportunities Do NOT Use MR</p>
                      <p>
                        Opportunities are tracked separately from Management Reserve. They represent potential benefits 
                        and are not funded from MR. Opportunities provide visibility into potential cost savings or 
                        benefits but do not affect your MR balance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coming Soon Message */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Opportunity Register</h3>
                <p className="text-gray-600 mb-4">
                  The full opportunity management interface will be implemented in a future release. 
                  Once available, you'll be able to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                  <li>Create and manage opportunities</li>
                  <li>Assess probability and benefit amount</li>
                  <li>Track opportunity realization and actual benefits</li>
                  <li>Monitor opportunity trends and success rates</li>
                </ul>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Note:</strong> Opportunities are tracked independently from risks and do not utilize Management Reserve. 
                    They provide visibility into potential program benefits.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'mr' && (
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Management Reserve</h2>
                <p className="text-gray-600 mb-6">
                  View and manage Management Reserve utilization linked to materialized risks.
                </p>
              </div>

              {/* MR Summary */}
              {managementReserve && (() => {
                const baselineMR = Number(managementReserve.baselineAmount || managementReserve.adjustedAmount || 0);
                const utilizedMR = Number(managementReserve.utilizedAmount || 0);
                const availableMR = baselineMR - utilizedMR;
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-gray-600 mb-1">Baseline MR</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(baselineMR)}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Available MR</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(availableMR)}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <p className="text-sm text-gray-600 mb-1">Utilized MR</p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(utilizedMR)}
                        </p>
                      </div>
                    </div>
                    {utilizedMR > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-1">
                          Utilization: {baselineMR > 0 ? ((utilizedMR / baselineMR) * 100).toFixed(1) : 0}%
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full transition-all"
                            style={{ 
                              width: `${baselineMR > 0 ? ((utilizedMR / baselineMR) * 100) : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* MR Utilization History */}
              {managementReserve && mrUtilizationHistory && (
                <MRUtilizationHistory
                  utilizationHistory={mrUtilizationHistory}
                  managementReserve={managementReserve}
                />
              )}

              {!managementReserve && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Management Reserve</h3>
                  <p className="text-gray-600">
                    Management Reserve information will appear here once a BOE has been baselined.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RiskOpportunityPage;

