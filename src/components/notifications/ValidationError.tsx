/**
 * Validation Error Component
 * 
 * Displays inline validation errors for form fields with proper styling and accessibility.
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ValidationErrorProps {
  message: string;
  className?: string;
}

const ValidationError: React.FC<ValidationErrorProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div 
      className={`flex items-start space-x-1 mt-1 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
};

export default ValidationError;
