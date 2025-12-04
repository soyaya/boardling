/**
 * Toast Notification Component
 * 
 * Displays temporary notification messages for success, error, warning, and info states.
 * Auto-dismisses after a configurable duration.
 */

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
    }
  };

  const getMessageColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
    }
  };

  return (
    <div
      className={`${getStyles()} border rounded-lg shadow-lg p-4 flex items-start space-x-3 min-w-[320px] max-w-md animate-slideIn`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-semibold ${getTitleColor()} mb-1`}>
          {title}
        </h4>
        {message && (
          <p className={`text-sm ${getMessageColor()}`}>
            {message}
          </p>
        )}
      </div>

      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
