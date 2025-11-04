import React, { useState, useEffect } from 'react';
import { riskOpportunityApi } from '../../../../services/riskOpportunityApi';
import { programSetupApi } from '../../../../services/programSetupApi';
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface RiskOpportunitySetupStepProps {
  programId: string;
  onStepComplete: () => void;
}

const RiskOpportunitySetupStep: React.FC<RiskOpportunitySetupStepProps> = ({ programId, onStepComplete }) => {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    checkRegisterStatus();
  }, [programId]);

  const checkRegisterStatus = async () => {
    try {
      setLoading(true);
      const status = await riskOpportunityApi.getRegisterStatus(programId);
      setIsInitialized(status.initialized);
      
      // If already initialized, mark step as complete
      if (status.initialized) {
        await handleStepComplete();
      }
    } catch (err: any) {
      console.error('Error checking register status:', err);
      // Don't show error for status check - just assume not initialized
      setIsInitialized(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async () => {
    try {
      // Refresh setup status to ensure it's marked as complete
      await programSetupApi.getSetupStatus(programId);
      onStepComplete();
    } catch (err: any) {
      console.error('Error completing step:', err);
      setError('Failed to complete step');
    }
  };

  const handleInitializeRegister = async () => {
    try {
      setInitializing(true);
      setError(null);

      const result = await riskOpportunityApi.initializeRegister(programId);
      
      if (result.success) {
        setIsInitialized(true);
        await handleStepComplete();
      } else {
        setError(result.message || 'Failed to initialize register');
      }
    } catch (err: any) {
      console.error('Error initializing register:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to initialize Risk & Opportunity register';
      setError(errorMessage);
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Checking register status...</p>
      </div>
    );
  }

  if (isInitialized) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Register Initialized</h3>
              <p className="text-green-800">
                Your Risk & Opportunity register has been successfully initialized. You can now add risks and opportunities through the Risks & Opportunities tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Initialize Risk & Opportunity Register</h3>
        <p className="text-blue-800 mb-4">
          Set up your Risk & Opportunity management framework to track program risks and opportunities. This will create the register structure that you can use to manage risks and opportunities throughout your program.
        </p>
      </div>

      {/* Information Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-2">What is the Risk & Opportunity Register?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Track potential risks that could impact your program budget or schedule</li>
              <li>Identify opportunities that could benefit your program</li>
              <li>Assess probability and impact of risks and opportunities</li>
              <li>Link risks to Management Reserve utilization</li>
              <li>Monitor risk trends and analysis over time</li>
            </ul>
            <p className="mt-3 text-gray-600">
              <strong>Note:</strong> This creates the register framework. You can add specific risks and opportunities later through the Risks & Opportunities tab.
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleInitializeRegister}
          disabled={initializing}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {initializing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Initializing...
            </>
          ) : (
            'Create Risk & Opportunity Register'
          )}
        </button>
      </div>
    </div>
  );
};

export default RiskOpportunitySetupStep;

