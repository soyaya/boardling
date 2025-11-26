/**
 * Authentication Components Index
 * 
 * Centralized exports for all authentication-related components
 */

export { default as ProtectedRoute } from './ProtectedRoute';
export { default as AuthStatus } from './AuthStatus';

// Re-export auth context and hooks for convenience
export { AuthProvider, useAuthContext } from '../../contexts/AuthContext';
export { useAuth, useAuthActions, useAuthStore } from '../../store/useAuthStore';
export { useAuthError, useTokenValidation } from '../../hooks/useAuthError';