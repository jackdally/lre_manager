import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../../layout';
import { riskOpportunityApi } from '../../../services/riskOpportunityApi';
import { InformationCircleIcon, CurrencyDollarIcon, ClockIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { boeVersionsApi } from '../../../services/boeApi';
import Modal from '../../common/Modal';
import { useManagementReserve } from '../../../hooks/useManagementReserve';
import { useBOEStore } from '../../../store/boeStore';
import { formatCurrency } from '../../../utils/currencyUtils';
import MRUtilizationHistory from './MRUtilizationHistory';
import RiskRegister from './RiskRegister';
import OpportunityRegister from './OpportunityRegister';
import RiskMatrix from './RiskMatrix';
import OpportunityMatrix from './OpportunityMatrix';
import { FinancialImpactSummary } from './shared/FinancialImpactSummary';
import { OpportunityBenefitSummary } from './shared/OpportunityBenefitSummary';
import { useRiskOpportunityStore } from '../../../store/riskOpportunityStore';
import DispositionInfoModal from './DispositionInfoModal';

type TabType = 'register' | 'analytics';
type RegisterView = 'risks' | 'opportunities';

const RiskOpportunityPage: React.FC = () => {
  const { id: programId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('register');
  const [registerView, setRegisterView] = useState<RegisterView>('risks');
  const [showMRRequestModal, setShowMRRequestModal] = useState(false);
  const [mrRequestReason, setMrRequestReason] = useState('');
  const [creatingMRVersion, setCreatingMRVersion] = useState(false);
  const [isMRExpanded, setIsMRExpanded] = useState(false);
  const [showDispositionInfoModal, setShowDispositionInfoModal] = useState(false);
  const { risks, opportunities, fetchRisks, fetchOpportunities } = useRiskOpportunityStore();
  
  // Check URL params for tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'analytics') {
      setActiveTab('analytics');
    }
  }, []);
  const [loading, setLoading] = useState(true);
  const [registerInitialized, setRegisterInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setCurrentBOE, setActiveTab: setBOEActiveTab } = useBOEStore();

  // Load risks and opportunities when register is initialized
  useEffect(() => {
    if (registerInitialized && programId) {
      fetchRisks(programId);
      fetchOpportunities(programId);
    }
  }, [registerInitialized, programId, fetchRisks, fetchOpportunities]);

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

  const handleRequestMoreMR = async () => {
    if (!programId || !mrRequestReason.trim()) {
      alert('Please provide a reason for requesting more MR');
      return;
    }

    if (!currentBOE?.id) {
      alert('No current BOE found. Please create a BOE first.');
      return;
    }

    setCreatingMRVersion(true);
    try {
      // Create a new BOE version specifically for MR adjustment
      const result = await boeVersionsApi.createVersion(programId, {
        creationMethod: 'version-from-current',
        changeSummary: `Request for additional Management Reserve: ${mrRequestReason}`,
      });

      if (result.boeVersion) {
        // Update the current BOE in the store
        setCurrentBOE(result.boeVersion);
        
        // Reload MR data to reflect the new version
        await loadBOE();
        if (result.boeVersion.id) {
          loadManagementReserve();
          loadMRUtilizationHistory();
        }
        
        // Set the MR tab as active in BOE store before navigating
        setBOEActiveTab('management-reserve');
        
        // Navigate to BOE page - user can then adjust MR in the MR section
        navigate(`/programs/${programId}/boe`);
      }
    } catch (error: any) {
      console.error('Error creating BOE version for MR:', error);
      alert(error.response?.data?.message || 'Failed to create new BOE version. Please try again.');
    } finally {
      setCreatingMRVersion(false);
      setShowMRRequestModal(false);
      setMrRequestReason('');
    }
  };

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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Risks & Opportunities</h1>
              <p className="text-gray-600">
                Manage program risks and opportunities, track assessments, monitor risk trends, and manage Management Reserve utilization.
              </p>
            </div>
            <button
              onClick={() => setShowDispositionInfoModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="View disposition status guide"
            >
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              Disposition Guide
            </button>
          </div>
        </div>

        {/* MR Overview Section - Collapsible, Above Tabs */}
        {managementReserve && (() => {
          const baselineMR = Number(managementReserve.baselineAmount || managementReserve.adjustedAmount || 0);
          const adjustedMR = Number(managementReserve.adjustedAmount || managementReserve.baselineAmount || 0);
          const utilizedMR = Number(managementReserve.utilizedAmount || 0);
          const availableMR = Number(managementReserve.remainingAmount || adjustedMR - utilizedMR);
          const utilizationPercentage = adjustedMR > 0 ? (utilizedMR / adjustedMR) * 100 : 0;
          
          return (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
              {/* Collapsible Header */}
              <div 
                className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 rounded-t-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => setIsMRExpanded(!isMRExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">Management Reserve</h3>
                      <div className="flex items-center space-x-6 mt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-blue-700">Available:</span>
                          <span className="text-lg font-bold text-blue-900">{formatCurrency(availableMR)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-blue-700">Utilized:</span>
                          <span className="text-lg font-bold text-blue-900">{formatCurrency(utilizedMR)}</span>
                          <span className="text-sm font-semibold text-blue-700">({utilizationPercentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMRRequestModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-700 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Request More MR
                    </button>
                    <Link
                      to={`/programs/${programId}/boe`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      View BOE
                    </Link>
                    {isMRExpanded ? (
                      <ChevronUpIcon className="h-5 w-5 text-blue-600" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Expanded Content */}
              {isMRExpanded && (
                <div className="p-6">
                  {/* MR Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-xs text-blue-700 font-medium mb-1">Baseline MR</p>
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(baselineMR)}</p>
                      <p className="text-xs text-blue-600 mt-1">Original calculated amount</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-xs text-purple-700 font-medium mb-1">Current MR</p>
                      <p className="text-2xl font-bold text-purple-900">{formatCurrency(adjustedMR)}</p>
                      {adjustedMR !== baselineMR && (
                        <p className="text-xs text-purple-600 mt-1">
                          {adjustedMR > baselineMR ? '+' : ''}{formatCurrency(adjustedMR - baselineMR)} from baseline
                        </p>
                      )}
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-xs text-green-700 font-medium mb-1">Available MR</p>
                      <p className="text-2xl font-bold text-green-900">{formatCurrency(availableMR)}</p>
                      <p className="text-xs text-green-600 mt-1">
                        {adjustedMR > 0 ? ((availableMR / adjustedMR) * 100).toFixed(1) : 0}% remaining
                      </p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-xs text-red-700 font-medium mb-1">Utilized MR</p>
                      <p className="text-2xl font-bold text-red-900">{formatCurrency(utilizedMR)}</p>
                      <p className="text-xs text-red-600 mt-1">{utilizationPercentage.toFixed(1)}% utilized</p>
                    </div>
                  </div>

                  {/* Utilization Progress Bar */}
                  {adjustedMR > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Utilization Progress</span>
                        <span className="text-sm font-semibold text-gray-900">{utilizationPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-3 rounded-full transition-all ${
                            utilizationPercentage < 50 ? 'bg-green-500' :
                            utilizationPercentage < 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, utilizationPercentage)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>0%</span>
                        <span className={utilizationPercentage > 80 ? 'font-semibold text-red-600' : ''}>
                          {utilizationPercentage > 80 && '⚠️ High utilization'}
                        </span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 mb-6">
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1">💡 Quick Tips</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Materialize risks from "Identified" or "In Progress" status to utilize MR</li>
                        <li>Click "Request More MR" to create a new BOE version for MR adjustment</li>
                        <li>MR utilization is tracked per risk and shown in history below</li>
                      </ul>
                    </div>
                    <div className="flex items-center space-x-3">
                      {availableMR < adjustedMR * 0.2 && adjustedMR > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                          <p className="text-xs font-medium text-yellow-800">
                            ⚠️ Low MR remaining - Consider requesting more
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MR Utilization History */}
                  {mrUtilizationHistory && mrUtilizationHistory.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
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
            </div>
          );
        })()}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('register')}
              className={`
                py-3 px-2 border-b-2 font-semibold text-base flex items-center gap-2
                ${activeTab === 'register'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>📋</span>
              Register
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`
                py-3 px-2 border-b-2 font-semibold text-base flex items-center gap-2
                ${activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>📊</span>
              Analytics
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'register' && (
            <div className="p-8 space-y-6">
              {/* View Switcher */}
              <div className="flex items-center space-x-4 border-b border-gray-200 pb-4">
                <button
                  onClick={() => setRegisterView('risks')}
                  className={`
                    px-4 py-2 font-medium text-sm rounded-lg transition-colors
                    ${registerView === 'risks'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  ⚠️ Risks ({risks.length})
                </button>
                <button
                  onClick={() => setRegisterView('opportunities')}
                  className={`
                    px-4 py-2 font-medium text-sm rounded-lg transition-colors
                    ${registerView === 'opportunities'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  ✨ Opportunities ({opportunities.length})
                </button>
              </div>

              {/* Content based on view */}
              {registerView === 'risks' && (
                <>
                  {/* Financial Impact Summary */}
                  {risks.length > 0 && (
                    <div className="mb-6">
                      <FinancialImpactSummary risks={risks} />
                    </div>
                  )}

                  {/* Risk Register - More Prominent */}
                  <div className="bg-white border-2 border-blue-200 rounded-lg shadow-lg p-6">
                    <RiskRegister 
                      programId={programId!}
                      onMRUpdate={() => {
                        if (currentBOE?.id) {
                          loadManagementReserve();
                          loadMRUtilizationHistory();
                        }
                      }}
                    />
                  </div>
                </>
              )}

              {registerView === 'opportunities' && (
                <>
                  {/* Opportunity Benefit Summary */}
                  {opportunities.length > 0 && (
                    <div className="mb-6">
                      <OpportunityBenefitSummary opportunities={opportunities} />
                    </div>
                  )}

                  {/* Opportunity Register - More Prominent */}
                  <div className="bg-white border-2 border-green-200 rounded-lg shadow-lg p-6">
                    <OpportunityRegister programId={programId!} />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'analytics' && programId && (
            <div className="p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Analytics & Visualization</h2>
                <p className="text-gray-600">
                  Analyze risk and opportunity distributions, trends, and financial impacts.
                </p>
              </div>

              {/* Risk Matrix */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Risk Matrix</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Visualize risk distribution across severity and probability ranges. Click on cells to filter.
                </p>
                <RiskMatrix programId={programId} />
              </div>

              {/* Opportunity Matrix */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Opportunity Matrix</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Visualize opportunity distribution across benefit severity and probability ranges. Click on cells to filter.
                </p>
                <OpportunityMatrix programId={programId} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Request More MR Modal */}
      <Modal
        isOpen={showMRRequestModal}
        onClose={() => {
          setShowMRRequestModal(false);
          setMrRequestReason('');
        }}
        title="Request More Management Reserve"
      >
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Creating New BOE Version</p>
                <p>
                  This will create a new BOE version from your current BOE. You'll be taken to the BOE page 
                  where you can adjust the Management Reserve amount. The new version will include all your 
                  current BOE elements and allocations.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="mr-reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Requesting More MR *
            </label>
            <textarea
              id="mr-reason"
              rows={4}
              value={mrRequestReason}
              onChange={(e) => setMrRequestReason(e.target.value)}
              placeholder="Explain why additional Management Reserve is needed. Include details about risk materialization, cost overruns, or other factors..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum 10 characters. This will be included in the BOE version change summary.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowMRRequestModal(false);
                setMrRequestReason('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={creatingMRVersion}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRequestMoreMR}
              disabled={creatingMRVersion || !mrRequestReason.trim() || mrRequestReason.trim().length < 10}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingMRVersion ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Creating Version...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 inline-block mr-2" />
                  Create BOE Version & Go to BOE
                </>
              )}
            </button>
          </div>
          </div>
        </Modal>

        {/* Disposition Info Modal */}
        <DispositionInfoModal
          isOpen={showDispositionInfoModal}
          onClose={() => setShowDispositionInfoModal(false)}
        />
      </Layout>
    );
  };

  export default RiskOpportunityPage;

