/**
 * Authentication Store
 * 
 * Zustand store for managing authentication state across the application
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService, type User, type LoginCredentials, type RegisterData, type AuthResponse } from '../services/authService';

interface AuthState {
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
  checkAuth: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        loading: true, // Start with loading true to check auth on mount
        error: null,

        // Login action
        login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
          set({ loading: true, error: null });

          try {
            const response = await authService.login(credentials);

            if (response.success && response.user) {
              set({
                user: response.user,
                isAuthenticated: true,
                loading: false,
                error: null,
              });
            } else {
              set({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: response.error || 'Login failed',
              });
            }

            return response;
          } catch (error) {
            const errorMessage = 'Network error. Please try again.';
            set({
              user: null,
              isAuthenticated: false,
              loading: false,
              error: errorMessage,
            });

            return {
              success: false,
              error: errorMessage,
            };
          }
        },

        // Register action
        register: async (userData: RegisterData): Promise<AuthResponse> => {
          set({ loading: true, error: null });

          try {
            const response = await authService.register(userData);

            if (response.success) {
              // Check if backend returned token (auto-login)
              if (response.token && response.user) {
                set({
                  user: response.user,
                  isAuthenticated: true,
                  loading: false,
                  error: null,
                });
              } else {
                // No token - user needs to login manually
                set({
                  user: null,
                  isAuthenticated: false,
                  loading: false,
                  error: null,
                });
              }
            } else {
              set({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: response.error || 'Registration failed',
              });
            }

            return response;
          } catch (error) {
            const errorMessage = 'Network error. Please try again.';
            set({
              user: null,
              isAuthenticated: false,
              loading: false,
              error: errorMessage,
            });

            return {
              success: false,
              error: errorMessage,
            };
          }
        },

        // Logout action
        logout: async (): Promise<void> => {
          set({ loading: true });

          try {
            await authService.logout();
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            set({
              user: null,
              isAuthenticated: false,
              loading: false,
              error: null,
            });
          }
        },

        // Change password action
        changePassword: async (currentPassword: string, newPassword: string): Promise<AuthResponse> => {
          set({ loading: true, error: null });

          try {
            const response = await authService.changePassword(currentPassword, newPassword);

            set({
              loading: false,
              error: response.success ? null : (response.error || 'Password change failed'),
            });

            return response;
          } catch (error) {
            const errorMessage = 'Network error. Please try again.';
            set({
              loading: false,
              error: errorMessage,
            });

            return {
              success: false,
              error: errorMessage,
            };
          }
        },

        // Forgot password action
        forgotPassword: async (email: string): Promise<AuthResponse> => {
          set({ loading: true, error: null });

          try {
            const response = await authService.forgotPassword(email);

            set({
              loading: false,
              error: response.success ? null : (response.error || 'Failed to send reset email'),
            });

            return response;
          } catch (error) {
            const errorMessage = 'Network error. Please try again.';
            set({
              loading: false,
              error: errorMessage,
            });

            return {
              success: false,
              error: errorMessage,
            };
          }
        },

        // Reset password action
        resetPassword: async (resetToken: string, newPassword: string): Promise<AuthResponse> => {
          set({ loading: true, error: null });

          try {
            const response = await authService.resetPassword(resetToken, newPassword);

            set({
              loading: false,
              error: response.success ? null : (response.error || 'Password reset failed'),
            });

            return response;
          } catch (error) {
            const errorMessage = 'Network error. Please try again.';
            set({
              loading: false,
              error: errorMessage,
            });

            return {
              success: false,
              error: errorMessage,
            };
          }
        },

        // Clear error action
        clearError: () => {
          set({ error: null });
        },

        // Check authentication status
        checkAuth: () => {
          try {
            const isAuth = authService.isAuthenticated();
            const user = authService.getCurrentUser();

            set({
              isAuthenticated: isAuth,
              user: user,
              loading: false,
              error: null,
            });
          } catch (error) {
            console.error('Error checking authentication:', error);
            set({
              isAuthenticated: false,
              user: null,
              loading: false,
              error: 'Authentication check failed',
            });
          }
        },

        // Update user data
        updateUser: (user: User) => {
          authService.setUser(user);
          set({ user });
        },
      }),
      {
        name: 'boardling-auth-storage',
        partialize: (state) => ({
          // Only persist user and isAuthenticated
          // Token is handled by authService in localStorage
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// Selector hooks for common use cases
export const useAuth = () => {
  const { user, isAuthenticated, loading, error } = useAuthStore();
  return { user, isAuthenticated, loading, error };
};

export const useAuthActions = () => {
  const {
    login,
    register,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    clearError,
    checkAuth,
    updateUser,
  } = useAuthStore();

  return {
    login,
    register,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    clearError,
    checkAuth,
    updateUser,
  };
};