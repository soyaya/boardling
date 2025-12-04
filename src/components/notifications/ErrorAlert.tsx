/**
 * Error Alert Component
 * 
 * Displays prominent error messages with optional actions and dismissal.
 * Used for page-level or section-level error notifications.
 */

import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  title: string;
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  className?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title,
  message,
  onDismiss,
  onRetry,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-800 mb-1">{title}</h3>
          <p className="text-sm text-red-700 leading-relaxed">{message}</p>

          {(onRetry || actions) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </button>
              )}
              
              {actions?.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    action.variant === 'primary'
                      ? 'text-red-700 bg-red-100 hover:bg-red-200'
                      : 'text-red-700 bg-white hover:bg-red-50 border border-red-200'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
            aria-label="Dismiss error"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
