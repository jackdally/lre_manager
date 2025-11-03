import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface SetupProgressProps {
  steps: SetupStep[];
}

const SetupProgress: React.FC<SetupProgressProps> = ({ steps }) => {
  const completedCount = steps.filter(step => step.completed).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Program Setup</h2>
          <span className="text-sm font-medium text-gray-600">
            {completedCount} of {steps.length} steps completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-start p-4 rounded-lg border-2 transition-colors ${
              step.completed
                ? 'bg-green-50 border-green-200'
                : index === completedCount
                ? 'bg-blue-50 border-blue-300'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex-shrink-0 mr-4">
              {step.completed ? (
                <CheckCircleIconSolid className="h-6 w-6 text-green-600" />
              ) : (
                <div
                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                    index === completedCount
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  <span className="text-xs font-semibold">{index + 1}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3
                className={`font-semibold mb-1 ${
                  step.completed ? 'text-green-800' : index === completedCount ? 'text-blue-800' : 'text-gray-600'
                }`}
              >
                {step.title}
              </h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetupProgress;

