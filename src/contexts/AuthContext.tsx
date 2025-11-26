/**
 * Authentication Context
 * 
 * React Context provider for authentication state management.
 * This provides an alternative to the Zustand store for components
 * that prefer React Context patterns.
 */

import React, { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth, useAuthActions } from '../store/useAuthStore';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '../services/authService';

interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<AuthResponse>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<AuthResponse>;
  clearError: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();
  const actions = useAuthActions();

  // Initialize authentication state on mount (non-blocking)
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Use setTimeout to make auth check non-blocking
        setTimeout(() => {
          actions.checkAuth();
        }, 0);
      } catch (error) {
        console.error('Error during auth initialization:', error);
      }
    };

    initAuth();
  }, [actions]);

  // Listen for storage changes (for multi-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      try {
        if (e.key === 'boardling_auth_token' || e.key === 'boardling_user') {
          // Token or user data changed in another tab
          actions.checkAuth();
        }
      } catch (error) {
        console.error('Error during storage change handling:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [actions]);

  const contextValue: AuthContextType = {
    ...auth,
    ...actions,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 * 
 * @throws Error if used outside of AuthProvider
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Higher-order component for authentication
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => (
    <AuthProvider>
      <Component {...props} />
    </AuthProvider>
  );
};

export default AuthContext;