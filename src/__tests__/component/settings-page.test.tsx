/**
 * Settings Page Component Tests
 * 
 * Tests for the Settings page and its components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Settings from '../../pages/Settings';
import { ProfileSettings } from '../../components/settings/ProfileSettings';
import { PasswordChange } from '../../components/settings/PasswordChange';
import { WithdrawalHistory } from '../../components/settings/WithdrawalHistory';

// Mock the stores and services
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    updateUser: vi.fn(),
    changePassword: vi.fn()
  }))
}));

vi.mock('../../services/userService', () => ({
  userService: {
    updateProfile: vi.fn(),
    getPaymentPreferences: vi.fn(),
    updatePaymentPreferences: vi.fn(),
    getWithdrawalHistory: vi.fn(() => Promise.resolve([]))
  }
}));

vi.mock('../../components/subscription/SubscriptionPanel', () => ({
  SubscriptionPanel: () => <div>Subscription Panel</div>
}));

describe('Settings Page', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render settings page with navigation tabs', () => {
    renderWithRouter(<Settings />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Manage your account, privacy, and preferences')).toBeInTheDocument();
    
    // Check navigation tabs
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Privacy & Wallets')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Withdrawals')).toBeInTheDocument();
  });

  it('should switch between tabs', async () => {
    renderWithRouter(<Settings />);

    // Click on Profile tab
    const profileTab = screen.getByText('Profile');
    fireEvent.click(profileTab);

    await waitFor(() => {
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });

    // Click on Billing tab
    const billingTab = screen.getByText('Billing');
    fireEvent.click(billingTab);

    await waitFor(() => {
      expect(screen.getByText('Subscription Panel')).toBeInTheDocument();
    });
  });

  it('should display profile tab by default', () => {
    renderWithRouter(<Settings />);

    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });
});

describe('ProfileSettings Component', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should render profile form with user data', () => {
    renderWithRouter(<ProfileSettings />);

    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toHaveValue('Test User');
    expect(screen.getByLabelText(/Email Address/i)).toHaveValue('test@example.com');
  });

  it('should enable save button when form is changed', async () => {
    renderWithRouter(<ProfileSettings />);

    const nameInput = screen.getByLabelText(/Full Name/i);
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });

    // Initially disabled
    expect(saveButton).toBeDisabled();

    // Change name
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

    // Should be enabled
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });
});

describe('PasswordChange Component', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should render password change form', () => {
    renderWithRouter(<PasswordChange />);

    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
  });

  it('should toggle password visibility', () => {
    renderWithRouter(<PasswordChange />);

    const currentPasswordInput = screen.getByLabelText(/Current Password/i);
    const toggleButtons = screen.getAllByRole('button', { name: '' });

    // Initially password type
    expect(currentPasswordInput).toHaveAttribute('type', 'password');

    // Click toggle
    fireEvent.click(toggleButtons[0]);

    // Should be text type
    expect(currentPasswordInput).toHaveAttribute('type', 'text');
  });

  it('should validate password requirements', async () => {
    renderWithRouter(<PasswordChange />);

    const currentPasswordInput = screen.getByLabelText(/Current Password/i);
    const newPasswordInput = screen.getByLabelText(/New Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);
    const submitButton = screen.getByRole('button', { name: /Change Password/i });

    // Fill in weak password
    fireEvent.change(currentPasswordInput, { target: { value: 'oldpass123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'weak' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });
});

describe('WithdrawalHistory Component', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should render withdrawal history', async () => {
    renderWithRouter(<WithdrawalHistory />);

    await waitFor(() => {
      expect(screen.getByText('Withdrawal History')).toBeInTheDocument();
    });
  });

  it('should display empty state when no withdrawals', async () => {
    renderWithRouter(<WithdrawalHistory />);

    await waitFor(() => {
      expect(screen.getByText('No withdrawals found')).toBeInTheDocument();
    });
  });

  it('should have status filter dropdown', async () => {
    renderWithRouter(<WithdrawalHistory />);

    await waitFor(() => {
      const filterSelect = screen.getByRole('combobox');
      expect(filterSelect).toBeInTheDocument();
      expect(screen.getByText('All Status')).toBeInTheDocument();
    });
  });
});
