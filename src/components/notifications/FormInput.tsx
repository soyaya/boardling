/**
 * Form Input Component with Validation
 * 
 * Reusable form input component with built-in validation error display and highlighting.
 * Provides consistent styling and accessibility features.
 */

import React, { type InputHTMLAttributes } from 'react';
import { type LucideIcon } from 'lucide-react';
import ValidationError from './ValidationError';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: LucideIcon;
  helperText?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  icon: Icon,
  helperText,
  className = '',
  ...inputProps
}) => {
  const hasError = !!error;
  const inputId = inputProps.id || inputProps.name || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={className}>
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
        {inputProps.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
        <input
          id={inputId}
          className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
            hasError
              ? 'border-red-300 focus:ring-red-500 bg-red-50'
              : 'border-gray-200 focus:ring-black'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...inputProps}
        />
      </div>

      {error && <ValidationError message={error} />}
      
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="mt-1 text-xs text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FormInput;
