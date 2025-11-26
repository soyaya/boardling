/**
 * Authentication Error Hook
 * 
 * Custom hook for handling authentication errors and automatic logout
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthActions } from '../store/useAuthStore';

interface UseAuthErrorOptions {
  redirectTo?: string;
  onError?: (error: string) => void;
}

export const useAuthError = (options: UseAuthErrorOptions = {}) => {
  const { redirectTo = '/signin', onError } = options;
  const navigate = useNavigate();
  const { logout, clearError } = useAuthActions();

  const handleAuthError = async (error: any) => {
    // Check if it's an authentication error
    if (
      error?.status === 401 || 
      error?.message?.includes('Unauthorized') ||
      error?.message?.includes('Invalid token') ||
      error?.message?.includes('Token expired')
    ) {
      // Clear authentication state
      await logout();
      
      // Call custom error handler if provided
      if (onError) {
        onError('Your session has expired. Please sign in again.');
      }
      
      // Redirect to sign-in page
      navigate(redirectTo, { replace: true });
    }
  };

  return {
    handleAuthError,
    clearError,
  };
};

/**
 * Hook for automatic token validation on app focus
 */
export const useTokenValidation = () => {
  const { checkAuth } = useAuthActions();

  useEffect(() => {
    // Check auth status when the app gains focus
    const handleFocus = () => {
      checkAuth();
    };

    // Check auth status when the page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuth();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAuth]);
};