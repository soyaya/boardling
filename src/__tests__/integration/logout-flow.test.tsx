/**
 * Integration Test for Logout Flow
 * 
 * Tests the complete logout flow including:
 * - Logout button click
 * - State clearing
 * - Redirect to sign-in page
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAuthStore } from '../../store/useAuthStore';
import type { User } from '../../services/authService';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    logout: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: vi.fn().mockReturnValue(true),
    getCurrentUser: vi.fn().mockReturnValue({
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }),
    setUser: vi.fn(),
    clearToken: vi.fn(),
    clearUser: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Logout Flow Integration', () => {
  const mockUser: User = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Set authenticated state
    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      error: null,
    });
  });

  it('should display user information in the TopBar', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TopBar />
        </AuthProvider>
      </BrowserRouter>
    );

    // User initials should be displayed
    expect(screen.getByText('TU')).toBeInTheDocument();
  });

  it('should show profile menu when clicking avatar', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TopBar />
        </AuthProvider>
      </BrowserRouter>
    );

    // Click on the avatar
    const avatar = screen.getByText('TU');
    fireEvent.click(avatar);

    // Profile menu should be visible
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });
  });

  it('should handle logout when clicking Sign Out button', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TopBar />
        </AuthProvider>
      </BrowserRouter>
    );

    // Open profile menu
    const avatar = screen.getByText('TU');
    fireEvent.click(avatar);

    // Wait for menu to appear
    await waitFor(() => {
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    // Click Sign Out
    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);

    // Should navigate to sign-in page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/signin', { replace: true });
    });

    // Auth state should be cleared
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
