/**
 * Error Handling Utilities
 * 
 * Provides helper functions for handling and formatting errors consistently.
 */

export interface ApiError {
  error: string;
  message: string;
  details?: any;
  timestamp?: string;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  details?: any;
}

/**
 * Extracts a user-friendly error message from various error types
 */
export const getErrorMessage = (error: unknown): string => {
  // Handle API response errors
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = error as ApiResponse;
    if (apiError.message) {
      return apiError.message;
    }
    if (apiError.error) {
      return apiError.error;
    }
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Default fallback
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Extracts validation errors from API response
 */
export const getValidationErrors = (error: unknown): Record<string, string> => {
  if (error && typeof error === 'object' && 'details' in error) {
    const apiError = error as ApiResponse;
    
    // Check for validation errors in details
    if (apiError.details && typeof apiError.details === 'object') {
      return apiError.details as Record<string, string>;
    }
  }
  
  return {};
};

/**
 * Checks if an error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('fetch') || 
           error.message.includes('network') || 
           error.message.includes('Network error');
  }
  
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = error as ApiResponse;
    return apiError.error === 'Network error';
  }
  
  return false;
};

/**
 * Checks if an error is an authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = error as ApiResponse;
    return !!(apiError.error?.includes('401') || 
           apiError.error?.includes('Unauthorized') ||
           apiError.message?.includes('session has expired'));
  }
  return false;
};

/**
 * Checks if an error is a validation error
 */
export const isValidationError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'details' in error) {
    const apiError = error as ApiResponse;
    return !!apiError.details && typeof apiError.details === 'object';
  }
  return false;
};

/**
 * Formats an error for logging
 */
export const formatErrorForLogging = (error: unknown, context?: string): string => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}] ` : '';
  
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = error as ApiResponse;
    return `${timestamp} ${contextStr}API Error: ${apiError.error} - ${getErrorMessage(error)}`;
  }
  
  if (error instanceof Error) {
    return `${timestamp} ${contextStr}${error.name}: ${error.message}\n${error.stack}`;
  }
  
  return `${timestamp} ${contextStr}${String(error)}`;
};
