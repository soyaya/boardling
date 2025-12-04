/**
 * Unit Tests for Auth Store
 * 
 * Tests the authentication store (Zustand) functionality including:
 * - Login action updates state correctly
 * - Logout clears state
 * - Error handling
 * - Session restoration
 * 
 * Requirements: 2.3, 2.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/authService';
import type { User, AuthResponse } from '../../services/authService';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
    setUser: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn(),
    clearUser: vi.fn(),
  },
}));

describe('useAuthStore', () => {
  const mockUser: User = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset the store to initial state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Action', () => {
    it('should update state correctly on successful login', async () => {
      // Arrange
      const mockResponse: AuthResponse = {
        success: true,
        token: mockToken,
        user: mockUser,
      };
      
      vi.mocked(authService.login).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      // Act
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Assert
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set loading to true during login', async () => {
      // Arrange
      const mockResponse: AuthResponse = {
        success: true,
        token: mockToken,
        user: mockUser,
      };
      
      let resolveLogin: (value: AuthResponse) => void;
      const loginPromise = new Promise<AuthResponse>((resolve) => {
        resolveLogin = resolve;
      });
      
      vi.mocked(authService.login).mockReturnValue(loginPromise);

      const { result } = renderHook(() => useAuthStore());

      // Act
      act(() => {
        result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Assert - loading should be true while request is pending
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Complete the login
      act(() => {
        resolveLogin!(mockResponse);
      });

      // Assert - loading should be false after completion
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle login failure with error message', async () => {
      // Arrange
      const mockResponse: AuthResponse = {
        success: false,
        error: 'Invalid credentials',
      };
      
      vi.mocked(authService.login).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      // Act
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      });

      // Assert
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });

    it('should handle network errors during login', async () => {
      // Arrange
      vi.mocked(authService.login).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      // Act
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Assert
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Network error. Please try again.');
    });

    it('should clear previous errors on new login attempt', async () => {
      // Arrange
      const { result } = renderHook(() => useAuthStore());
      
      // Set initial error state
      act(() => {
        useAuthStore.setState({ error: 'Previous error' });
      });

      const mockResponse: AuthResponse = {
        success: true,
        token: mockToken,
        user: mockUser,
      };
      
      vi.mocked(authService.login).mockResolvedValue(mockResponse);

      // Act
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Assert
      expect(result.current.error).toBeNull();
    });
  });

  describe('Logout Action', () => {
    it('should clear all state on logout', async () => {
      // Arrange
      const { result } = renderHook(() => useAuthStore());
      
      // Set authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
      });

      vi.mocked(authService.logout).mockResolvedValue();

      // Act
      await act(async () => {
        await result.current.logout();
      });

      // Assert
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should call authService.logout', async () => {
      // Arrange
      const { result } = renderHook(() => useAuthStore());
      
      vi.mocked(authService.logout).mockResolvedValue();

      // Act
      await act(async () => {
        await result.current.logout();
      });

      // Assert
      expect(authService.logout).toHaveBeenCalledTimes(1);
    });

    it('should clear state even if logout API call fails', async () => {
      // Arrange
      const { result } = renderHook(() => useAuthStore());
      
      // Set authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
      });

      vi.mocked(authService.logout).mockRejectedValue(new Error('Network error'));

      // Act
      await act(async () => {
        await result.current.logout();
      });

      // Assert - state should still be cleared
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should clear any existing errors on logout', async () => {
      // Arrange
      const { result } = renderHook(() => useAuthStore());
      
      // Set state with error
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          isAuthenticated: true,
          loading: false,
          error: 'Some error',
        });
      });

      vi.mocked(authService.logout).mockResolvedValue();

      // Act
      await act(async () => {
        await result.current.logout();
      });

      // Assert
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle registration errors', async () => {
      // Arrange
      const mockResponse: AuthResponse = {
        success: false,
        error: 'Email already exists',
      };
      
      vi.mocked(authService.register).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      // Act
      await act(async () => {
        await result.current.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Assert
      expect(result.current.error).toBe('Email already exists');
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle network errors during registration', async () => {
      // Arrange
      vi.mocked(authService.register).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      // Act
      await act(async () => {
        await result.current.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Assert
      expect(result.current.error).toBe('Network error. Please try again.');
    });

    it('should clear errors with clearError action', () => {
      // Arrange
      const { result } = renderHook(() => useAuthStore());
      
      // Set error state
      act(() => {
        useAuthStore.setState({ error: 'Some error' });
      });

      // Act
      act(() => {
        result.current.clearError();
      });

      // Assert
      expect(result.current.error).toBeNull();
    });

    it('should handle password change errors', async () => {
      // Arrange
      const mockResponse: AuthResponse = {
        success: false,
        error: 'Current password is incorrect',
      };
      
      vi.mocked(authService.changePassword).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      // Act
      await act(async () => {
        await result.current.changePassword('oldpass', 'newpass');
      });

      // Assert
      expect(result.current.error).toBe('Current password is incorrect');
    });

    it('should handle forgot password errors', async () => {
      // Arrange
      const mockResponse: AuthResponse = {
        success: false,
        error: 'Email not found',
      };
      
      vi.mocked(authService.forgotPassword).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      // Act
      await act(async () => {
        await result.current.forgotPassword('test@example.com');
      });

      // Assert
      expect(result.current.error).toBe('Email not found');
    });
  });

  describe('Session Restoration', () => {
    it('should restore session with checkAuth when token is valid', () => {
      // Arrange
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);

      const { result } = renderHook(() => useAuthStore());

      // Act
      act(() => {
        result.current.checkAuth();
      });

      // Assert
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should clear session with checkAuth when token is invalid', () => {
      // Arrange
      vi.mocked(authService.isAuthenticated).mockReturnValue(false);
      vi.mocked(authService.getCurrentUser).mockReturnValue(null);

      const { result } = renderHook(() => useAuthStore());

      // Act
      act(() => {
        result.current.checkAuth();
      });

      // Assert
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle errors during checkAuth', () => {
      // Arrange
      vi.mocked(authService.isAuthenticated).mockImplementation(() => {
        throw new Error('Token validation error');
      });

      const { result } = renderHook(() => useAuthStore());

      // Act
      act(() => {
        result.current.checkAuth();
      });

      // Assert
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Authentication check failed');
    });

    it('should set loading to false after checkAuth completes', () => {
      // Arrange
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);

      const { result } = renderHook(() => useAuthStore());
      
      // Set loading to true initially
      act(() => {
        useAuthStore.setState({ loading: true });
      });

      // Act
      act(() => {
        result.current.checkAuth();
      });

      // Assert
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Register Action', () => {
    it('should handle successful registration', async () => {
      // Arrange
      const mockResponse: AuthResponse = {
        success: true,
        message: 'Registration successful',
      };
      
      vi.mocked(authService.register).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      // Act
      await act(async () => {
        const response = await result.current.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
        
        // Assert response
        expect(response.success).toBe(true);
      });

      // Assert state - user should not be authenticated after registration
      // (they need to login separately)
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Update User Action', () => {
    it('should update user data in state', () => {
      // Arrange
      const { result } = renderHook(() => useAuthStore());
      
      const updatedUser: User = {
        ...mockUser,
        name: 'Updated Name',
      };

      // Act
      act(() => {
        result.current.updateUser(updatedUser);
      });

      // Assert
      expect(result.current.user).toEqual(updatedUser);
      expect(authService.setUser).toHaveBeenCalledWith(updatedUser);
    });
  });

  describe('State Persistence', () => {
    it('should maintain state structure', () => {
      // Arrange
      const { result } = renderHook(() => useAuthStore());

      // Assert - check initial state structure
      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('register');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('checkAuth');
      expect(result.current).toHaveProperty('clearError');
      expect(result.current).toHaveProperty('updateUser');
    });

    it('should have correct initial state', () => {
      // Arrange
      const { result } = renderHook(() => useAuthStore());

      // Assert
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
      // Note: loading starts as true in the actual store for initial auth check
    });
  });
});
