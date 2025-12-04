/**
 * Success Alert Component
 * 
 * Displays success messages with optional actions and dismissal.
 * Used for confirming successful operations.
 */

import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessAlertProps {
  title: string;
  message?: string;
  onDismiss?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  className?: string;
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({
  title,
  message,
  onDismiss,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`bg-green-50 border-l-4 border-green-500 rounded-r-lg shadow-sm p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-green-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-green-800 mb-1">{title}</h3>
          {message && (
            <p className="text-sm text-green-700 leading-relaxed">{message}</p>
          )}

          {actions && actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
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
            className="flex-shrink-0 text-green-400 hover:text-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
            aria-label="Dismiss success message"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessAlert;
