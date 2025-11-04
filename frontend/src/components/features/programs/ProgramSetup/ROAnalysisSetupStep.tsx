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
    navigate(`/programs/${programId}/risk-opportunity`);
  };

  return (
    <div className="space-y-6">
      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Risk & Opportunity Analysis (Optional)</p>
            <p className="mb-2">
              This step allows you to enter risks and opportunities with cost impacts and probabilities. 
              This data can be used to calculate a more accurate Management Reserve in the next step.
            </p>
            <p>
              <strong>Note:</strong> This step is optional. You can skip it and proceed directly to Finalizing your MR.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Benefits of R&O Analysis:</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li>More accurate Management Reserve calculation based on actual risk data</li>
          <li>Better visibility into program risks and opportunities</li>
          <li>Data-driven decision making for budget adjustments</li>
          <li>Improved risk management throughout the program lifecycle</li>
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

