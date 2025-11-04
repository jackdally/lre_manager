import React from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface EnhancedErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  details?: string[];
  recoverySuggestions?: string[];
  onDismiss?: () => void;
  onAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Enhanced Error Message Component
 * 
 * Provides better error messages with:
 * - Clear context and explanation
 * - Actionable recovery suggestions
 * - Visual hierarchy with icons
 * - Optional action buttons
 */
const EnhancedErrorMessage: React.FC<EnhancedErrorMessageProps> = ({
  title,
  message,
  type = 'error',
  details = [],
  recoverySuggestions = [],
  onDismiss,
  onAction,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-400" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
    }
  };

  const getContainerClasses = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getTitleClasses = () => {
    switch (type) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-red-800';
    }
  };

  const getTextClasses = () => {
    switch (type) {
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-red-700';
    }
  };

  return (
    <div className={`p-4 border rounded-lg ${getContainerClasses()}`}>
      <div className="flex">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${getTitleClasses()} mb-2`}>
              {title}
            </h3>
          )}
          
          <div className={`text-sm ${getTextClasses()}`}>
            <p className="mb-2">{message}</p>

            {details.length > 0 && (
              <div className="mt-3">
                <p className="font-medium mb-1">Details:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </div>
            )}

            {recoverySuggestions.length > 0 && (
              <div className="mt-3">
                <p className="font-medium mb-1">What you can do:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {recoverySuggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            {onAction && (
              <button
                onClick={onAction.onClick}
                className={`text-sm font-medium underline ${
                  type === 'error'
                    ? 'text-red-600 hover:text-red-500'
                    : type === 'warning'
                    ? 'text-yellow-600 hover:text-yellow-500'
                    : 'text-blue-600 hover:text-blue-500'
                }`}
              >
                {onAction.label} →
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`text-sm ${
                  type === 'error'
                    ? 'text-red-600 hover:text-red-500'
                    : type === 'warning'
                    ? 'text-yellow-600 hover:text-yellow-500'
                    : 'text-blue-600 hover:text-blue-500'
                } underline`}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedErrorMessage;

