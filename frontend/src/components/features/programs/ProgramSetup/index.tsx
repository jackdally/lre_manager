import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../../layout';
import SetupProgress from './SetupProgress';
import BOESetupStep from './BOESetupStep';
import InitialMRSetupStep from './InitialMRSetupStep';
import BaselineSetupStep from './BaselineSetupStep';
import RiskOpportunitySetupStep from './RiskOpportunitySetupStep';
import ROAnalysisSetupStep from './ROAnalysisSetupStep';
import FinalMRSetupStep from './FinalMRSetupStep';
import BOEApprovalSetupStep from './BOEApprovalSetupStep';
import { programSetupApi, SetupStatus } from '../../../../services/programSetupApi';

interface Program {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  optional?: boolean;
}

const ProgramSetup: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<Program | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Program ID is required');
      setLoading(false);
      return;
    }

    fetchProgramAndSetupStatus();
  }, [id]);

  const fetchProgramAndSetupStatus = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch program and setup status in parallel
      const [programResponse, setupStatusResponse] = await Promise.all([
        axios.get<Program>(`/api/programs/${id}`),
        programSetupApi.getSetupStatus(id),
      ]);

      setProgram(programResponse.data);
      setSetupStatus(setupStatusResponse);

      // If setup is complete, redirect to dashboard
      if (setupStatusResponse.setupComplete) {
        navigate(`/programs/${id}/dashboard`);
        return;
      }
    } catch (err: any) {
      console.error('Error fetching program setup data:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load program setup');
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async () => {
    // Refresh setup status after step completion
    if (id) {
      try {
        setLoading(true); // Show loading state to prevent jumpy UI
        const updatedStatus = await programSetupApi.getSetupStatus(id);
        setSetupStatus(updatedStatus);
        
        // If setup is now complete, redirect to dashboard
        if (updatedStatus.setupComplete) {
          navigate(`/programs/${id}/dashboard`);
        }
      } catch (err: any) {
        console.error('Error refreshing setup status:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getSetupSteps = (): SetupStep[] => {
    if (!setupStatus) return [];

    return [
      {
        id: 'boe',
        title: 'Create Basis of Estimate (BOE)',
        description: 'Build your program budget estimate with cost breakdowns',
        completed: setupStatus.boeCreated,
      },
      {
        id: 'initial-mr',
        title: 'Set Initial Management Reserve',
        description: 'Establish your initial MR using Standard, Risk-Based, or Custom calculation',
        completed: setupStatus.initialMRSet,
      },
      {
        id: 'risk-opportunity',
        title: 'Initialize Risk & Opportunity Register',
        description: 'Set up your risk and opportunity management framework',
        completed: setupStatus.riskOpportunityRegisterCreated,
      },
      {
        id: 'ro-analysis',
        title: 'Analyze Risks & Opportunities',
        description: 'Enter risks and opportunities with cost impacts and probabilities (Optional)',
        completed: setupStatus.roAnalysisComplete !== null,
        optional: true,
      },
      {
        id: 'final-mr',
        title: 'Finalize Management Reserve',
        description: 'Set final MR based on R&O analysis or adjust from Initial MR',
        completed: setupStatus.finalMRSet,
      },
      {
        id: 'approval',
        title: 'Submit BOE for Approval',
        description: 'Submit your BOE with final MR for approval',
        completed: setupStatus.boeApproved,
      },
      {
        id: 'baseline',
        title: 'Baseline Budget to Ledger',
        description: 'Push approved BOE to the ledger as baseline budget entries',
        completed: setupStatus.boeBaselined,
      },
    ];
  };

  const getCurrentStep = (): string | null => {
    if (!setupStatus) return null;

    // Step 1: Create BOE (only requires creation, not approval)
    if (!setupStatus.boeCreated) {
      return 'boe';
    }
    // Step 2: Set Initial MR
    if (!setupStatus.initialMRSet) {
      return 'initial-mr';
    }
    // Step 3: Initialize R&O Register
    if (!setupStatus.riskOpportunityRegisterCreated) {
      return 'risk-opportunity';
    }
    // Step 4: R&O Analysis (optional - can be skipped)
    if (setupStatus.roAnalysisComplete === null) {
      return 'ro-analysis';
    }
    // Step 5: Finalize MR
    if (!setupStatus.finalMRSet) {
      return 'final-mr';
    }
    // Step 6: Submit BOE for Approval
    if (!setupStatus.boeApproved) {
      return 'approval';
    }
    // Step 7: Baseline to Ledger
    if (!setupStatus.boeBaselined) {
      return 'baseline';
    }
    return null; // All steps complete
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading program setup...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Setup</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Return to Program Directory
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!program || !setupStatus) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Program not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  const steps = getSetupSteps();
  const currentStep = getCurrentStep();

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Program Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{program.name}</h1>
          <p className="text-gray-600">Program Code: {program.code}</p>
        </div>

        {/* Setup Progress */}
        <SetupProgress steps={steps} />

        {/* Current Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {currentStep === 'boe' && (
            <BOESetupStep programId={id!} onStepComplete={handleStepComplete} />
          )}
          {currentStep === 'initial-mr' && (
            <InitialMRSetupStep programId={id!} onStepComplete={handleStepComplete} />
          )}
          {currentStep === 'risk-opportunity' && (
            <RiskOpportunitySetupStep programId={id!} onStepComplete={handleStepComplete} />
          )}
          {currentStep === 'ro-analysis' && (
            <ROAnalysisSetupStep programId={id!} onStepComplete={handleStepComplete} />
          )}
          {currentStep === 'final-mr' && (
            <FinalMRSetupStep programId={id!} onStepComplete={handleStepComplete} />
          )}
          {currentStep === 'approval' && (
            <BOEApprovalSetupStep programId={id!} onStepComplete={handleStepComplete} />
          )}
          {currentStep === 'baseline' && (
            <BaselineSetupStep programId={id!} onStepComplete={handleStepComplete} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProgramSetup;

