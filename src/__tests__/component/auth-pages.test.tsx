/**
 * Component Tests for Authentication Pages
 * 
 * Tests for SignUp and SignIn components including:
 * - Form validation
 * - Form submission
 * - Error message display
 * - Loading states
 * 
 * Requirements: 1.4, 1.5, 2.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SignUp from '../../pages/SignUp';
import SignIn from '../../pages/SignIn';
import { useAuthStore } from '../../store/useAuthStore';
import type { AuthResponse } from '../../services/authService';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn().mockReturnValue(false),
    getCurrentUser: vi.fn().mockReturnValue(null),
    setUser: vi.fn(),
    clearToken: vi.fn(),
    clearUser: vi.fn(),
    getToken: vi.fn().mockReturnValue(null),
  },
}));

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
const mockLocation = {
  state: null,
  pathname: '/signin',
  search: '',
  hash: '',
  key: 'default',
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

describe('SignUp Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Reset auth store to unauthenticated state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });

  describe('Form Validation', () => {
    it('should have required attribute on name field', () => {
      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      const nameInput = screen.getByPlaceholderText('John Doe');
      expect(nameInput).toHaveAttribute('required');
    });

    it('should have email type on email field for browser validation', () => {
      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      const emailInput = screen.getByPlaceholderText('you@company.com');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should have minLength attribute on password field (Requirement 1.4)', () => {
      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      expect(passwordInputs[0]).toHaveAttribute('minLength', '8');
      expect(passwordInputs[0]).toHaveAttribute('required');
    });

    it('should show password mismatch error when passwords do not match', async () => {
      const user = userEvent.setup();
      
      // Mock register to prevent actual submission
      const mockRegister = vi.fn().mockResolvedValue({ success: false });
      useAuthStore.setState({ register: mockRegister } as any);

      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      // Fill in all fields with mismatched passwords
      await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
      await user.type(screen.getByPlaceholderText('you@company.com'), 'test@example.com');
      
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password456');
      
      const termsCheckbox = screen.getByRole('checkbox');
      await user.click(termsCheckbox);

      // Try to submit - this will trigger client-side validation
      const form = screen.getByRole('button', { name: /create account/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('should show password length hint below password field', () => {
      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should successfully submit registration form with valid data', async () => {
      const user = userEvent.setup();
      
      // Mock successful registration
      const mockRegister = vi.fn().mockResolvedValue({
        success: true,
        message: 'Registration successful',
      } as AuthResponse);

      useAuthStore.setState({
        register: mockRegister,
      } as any);

      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      // Fill in valid form data
      await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
      await user.type(screen.getByPlaceholderText('you@company.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Acme Corp'), 'Test Company');
      
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');

      // Check terms checkbox
      const termsCheckbox = screen.getByRole('checkbox');
      await user.click(termsCheckbox);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Should call register with correct data
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          company: 'Test Company',
          password: 'password123',
          confirmPassword: 'password123',
        });
      });

      // Should navigate to signin page (Requirement 1.5)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/signin', {
          state: {
            message: 'Registration successful! Please sign in with your credentials.',
            email: 'test@example.com',
          },
        });
      });
    });

    it('should not submit form when validation fails', async () => {
      const user = userEvent.setup();
      
      const mockRegister = vi.fn();
      useAuthStore.setState({
        register: mockRegister,
      } as any);

      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Should not call register
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('Error Message Display', () => {
    it('should display error message from auth store', async () => {
      const errorMessage = 'Email already registered';
      const mockClearError = vi.fn();
      
      useAuthStore.setState({
        error: errorMessage,
        loading: false,
        clearError: mockClearError,
      } as any);

      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      // Component clears error on mount, so we need to set it again
      useAuthStore.setState({
        error: errorMessage,
      });

      // Force a re-render by waiting
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
      
      expect(screen.getByText('Email Already Registered')).toBeInTheDocument();
    });

    it('should display network error message', async () => {
      const errorMessage = 'Network error. Please check your connection and try again.';
      const mockClearError = vi.fn();
      
      useAuthStore.setState({
        error: errorMessage,
        loading: false,
        clearError: mockClearError,
      } as any);

      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      // Component clears error on mount, so we need to set it again
      useAuthStore.setState({
        error: errorMessage,
      });

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should allow dismissing error message', async () => {
      const user = userEvent.setup();
      
      const mockClearError = vi.fn();
      useAuthStore.setState({
        error: 'Test error',
        loading: false,
        clearError: mockClearError,
      } as any);

      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      // Find and click dismiss button
      const dismissButton = screen.getByLabelText('Dismiss error');
      await user.click(dismissButton);

      expect(mockClearError).toHaveBeenCalled();
    });

    it('should show helpful actions for duplicate email error', async () => {
      useAuthStore.setState({
        error: 'Email already registered',
        loading: false,
      });

      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      // Should show action buttons
      expect(screen.getByText('Sign in instead')).toBeInTheDocument();
      expect(screen.getByText('Try different email')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      
      // Mock slow registration
      const mockRegister = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true });
          }, 100);
        });
      });

      useAuthStore.setState({
        register: mockRegister,
        loading: false,
      } as any);

      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      // Fill in valid form data
      await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
      await user.type(screen.getByPlaceholderText('you@company.com'), 'test@example.com');
      
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');

      const termsCheckbox = screen.getByRole('checkbox');
      await user.click(termsCheckbox);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText('Creating account...')).toBeInTheDocument();
      });

      // Button should be disabled
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when loading', () => {
      useAuthStore.setState({
        loading: true,
      });

      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      const submitButton = screen.getByRole('button', { name: /creating account/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to signin page when clicking sign in link', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      const signInLink = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInLink);

      expect(mockNavigate).toHaveBeenCalledWith('/signin');
    });

    it('should redirect to dashboard if already authenticated', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: '123',
          name: 'Test User',
          email: 'test@example.com',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      });

      render(
        <BrowserRouter>
          <SignUp />
        </BrowserRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});

describe('SignIn Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Reset auth store to unauthenticated state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });

  describe('Form Validation', () => {
    it('should have required attribute on email field', () => {
      render(
        <BrowserRouter>
          <SignIn />
        </BrowserRouter>
      );

      const emailInput = screen.getByPlaceholderText('you@example.com');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should have required attribute on password field', () => {
      render(
        <BrowserRouter>
          <SignIn />
        </BrowserRouter>
      );

      const passwordInput = screen.getByPlaceholderText('••••••••');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Submission', () => {
    it('should successfully submit login form with valid credentials', async () => {
      const user = userEvent.setup();
      
      // Mock successful login
      const mockLogin = vi.fn().mockResolvedValue({
        success: true,
        token: 'test-token',
        user: {
          id: '123',
          name: 'Test User',
          email: 'test@example.com',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      } as AuthResponse);

      useAuthStore.setState({
        login: mockLogin,
      } as any);

      render(
        <BrowserRouter>
          <SignIn />
        </BrowserRouter>
      );

      // Fill in credentials
      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Should call login with correct credentials (Requirement 2.3)
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should not submit form when validation fails', async () => {
      const user = userEvent.setup();
      
      const mockLogin = vi.fn();
      useAuthStore.setState({
        login: mockLogin,
      } as any);

      render(
        <BrowserRouter>
          <SignIn />
        </BrowserRouter>
      );

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Should not call login
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should handle remember me checkbox', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <SignIn />
        </BrowserRouter>
      );

      const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
      
      // Initially unchecked
      expect(rememberMeCheckbox).not.toBeChecked();

      // Click to check
      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).toBeChecked();

      // Click to uncheck
      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).not.toBeChecked();
    });
  });

  describe('Error Message Display', () => {
    it('should display error message from auth store', async () => {
      const errorMessage = 'Invalid credentials';
      
      useAuthStore.setState({
        error: errorMessage,
        loading: false,
      });

      render(
        <BrowserRouter>
          <SignIn />
        </BrowserRouter>
      );

      // Error should be displayed
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Sign In Failed')).toBeInTheDocument();
    });

    it('should display network error message', async () => {
      const errorMessage = 'Network error. Please check your connection and try again.';
      
      useAuthStore.setState({
        error: errorMessage,
        loading: false,
      });

      render(
        <BrowserRouter>
          <SignIn />
        </BrowserRouter>
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display success message from registration', () => {
      // Update mock location state
      mockLocation.state = {
        message: 'Registration successful! Please sign in.',
        email: 'test@example.com',
      };

      render(
        <BrowserRouter>
          <SignIn />
        </BrowserRouter>
      );

      expect(screen.getByText('Registration Successful')).toBeInTheDocument();
      expect(screen.getByText('Registration successful! Please sign in.')).toBeInTheDocument();
      
      // Reset mock location
      mockLocation.state = null;
    });
  });

  describe('Loading States', () => {
    it('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      
      // Mock slow login
      const mockLogin = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true });
          }, 100);
        });
      });

      useAuthStore.setState({
        login: mockLogin,
        loading: false,
      } as any);

      render(
        <BrowserRouter>
          <SignIn />
        </BrowserRouter>
      );

      // Fill in credentials
      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText('Signing in...')).toBeInTheDocument();
      });

      // Button should be disabled
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button during submission', async () => {
      const user = userEvent.setup();
      
      // Mock slow login
      const mockLogin = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true });
          }, 100);
        });
      });

      useAuthStore.setState({
        login: mockLogin,
        loading: false,
      } as any);

      render(
        <BrowserRouter>
          <SignIn />
        </BrowserRouter>
      );

      // Fill in credentials
      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to signup page when clicking sign up link', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <SignIn />
        </BrowserRouter>
      );

      const signUpLink = screen.getByRole('button', { name: /sign up/i });
      await user.click(signUpLink);

      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });

    it('should redirect to dashboard if already authenticated', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: '123',
          name: 'Test User',
          email: 'test@example.com',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      });

      render(
        <BrowserRouter>
          <SignIn />
        </BrowserRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('should pre-fill email from location state', () => {
      // Update mock location state
      mockLocation.state = {
        email: 'prefilled@example.com',
      };

      render(
        <BrowserRouter>
          <SignIn />
        </BrowserRouter>
      );

      const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
      expect(emailInput.value).toBe('prefilled@example.com');
      
      // Reset mock location
      mockLocation.state = null;
    });
  });
});
