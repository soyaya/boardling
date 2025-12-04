/**
 * Network Error Component
 * 
 * Specialized error component for network-related failures.
 * Provides retry functionality and helpful guidance.
 */

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface NetworkErrorProps {
  onRetry?: () => void;
  message?: string;
  className?: string;
}

const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  message = 'Unable to connect to the server. Please check your internet connection and try again.',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <WifiOff className="w-8 h-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Connection Error
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      )}
    </div>
  );
};

export default NetworkError;
