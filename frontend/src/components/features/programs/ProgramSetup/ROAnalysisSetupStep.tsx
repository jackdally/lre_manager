import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { programSetupApi } from '../../../../services/programSetupApi';
import { CheckCircleIcon, InformationCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface ROAnalysisSetupStepProps {
  programId: string;
  onStepComplete: () => void;
}

const ROAnalysisSetupStep: React.FC<ROAnalysisSetupStepProps> = ({ programId, onStepComplete }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompleteAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      await programSetupApi.markROAnalysisComplete(programId);
      onStepComplete();
    } catch (err: any) {
      console.error('Error marking R&O analysis as complete:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to complete R&O analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      setError(null);
      await programSetupApi.markROAnalysisSkipped(programId);
      onStepComplete();
    } catch (err: any) {
      console.error('Error skipping R&O analysis:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to skip R&O analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToROPage = () => {
    navigate(`/programs/${programId}/risks`);
  };

  return (
    <div className="space-y-6">
      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 space-y-3">
            <div>
              <p className="font-semibold text-base mb-2">Risk & Opportunity Analysis (Optional)</p>
              <p>
                This step is <strong>completely optional</strong>. You can skip it and proceed directly to Finalizing 
                your Management Reserve using your Initial MR estimate.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">What is R&O Analysis?</p>
              <p>
                Risk & Opportunity analysis involves identifying specific risks (threats) and opportunities 
                (potential benefits) for your program, along with their:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li>Cost impact estimates (min, most likely, max)</li>
                <li>Probability of occurrence (0-100%)</li>
                <li>Severity levels (Low, Medium, High, Critical)</li>
              </ul>
            </div>
            <div className="bg-blue-100 border border-blue-300 rounded p-3">
              <p className="font-semibold mb-2">💡 Why Perform R&O Analysis?</p>
              <p className="mb-2">
                If you enter risk data, you can use the <strong>R&O-Driven calculation method</strong> in the next step 
                to automatically calculate your Final MR based on actual risk data. This provides:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>More accurate MR calculation using severity-weighted expected values</li>
                <li>Data-driven budget adjustments instead of standard percentages</li>
                <li>Better visibility into program risks for proactive management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-green-900 mb-3">Benefits of Completing R&O Analysis:</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-green-800">
          <li><strong>R&O-Driven MR Calculation:</strong> Automatically calculate Final MR based on actual risk data with severity weighting</li>
          <li><strong>Risk Visibility:</strong> Track and monitor risks throughout the program lifecycle</li>
          <li><strong>Informed Decisions:</strong> Make budget adjustments based on quantitative risk analysis</li>
          <li><strong>Opportunity Tracking:</strong> Identify and track potential cost savings or benefits</li>
        </ul>
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <button
          onClick={handleSkip}
          disabled={loading}
          className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
        >
          Skip R&O Analysis
        </button>
        <button
          onClick={handleGoToROPage}
          disabled={loading}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Go to R&O Page
          <ArrowRightIcon className="h-5 w-5 ml-2" />
        </button>
        <button
          onClick={handleCompleteAnalysis}
          disabled={loading}
          className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Complete R&O Analysis
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ROAnalysisSetupStep;

