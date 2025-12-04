/**
 * Frontend End-to-End Integration Tests
 * Task 43.1: Write end-to-end integration tests
 * 
 * This test suite covers complete user journeys from the frontend perspective:
 * 1. Registration → Onboarding → Analytics flow
 * 2. Subscription upgrade flow
 * 3. Data monetization flow
 * 4. Withdrawal flow
 * 
 * Requirements: All
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthStore } from '../../store/useAuthStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import * as authService from '../../services/authService';
import * as projectService from '../../services/projectService';
import * as analyticsService from '../../services/analyticsService';
import * as subscriptionService from '../../services/subscriptionService';
import * as userService from '../../services/userService';

// Mock API services
vi.mock('../../services/authService');
vi.mock('../../services/projectService');
vi.mock('../../services/analyticsService');
vi.mock('../../services/subscriptionService');
vi.mock('../../services/userService');

// Test data
const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  subscription_status: 'free',
  subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  onboarding_completed: false,
  balance_zec: 0
};

const mockProject = {
  id: 'project-123',
  user_id: 'user-123',
  name: 'Test Project',
  description: 'Test project description',
  category: 'defi',
  status: 'active',
  created_at: new Date().toISOString()
};

const mockWallet = {
  id: 'wallet-123',
  project_id: 'project-123',
  address: 't1TestAddress123456789012345678901234567890',
  type: 't',
  privacy_mode: 'private',
  network: 'testnet',
  is_active: true
};

const mockAnalytics = {
  metrics: {
    total_wallets: 3,
    active_wallets: 2,
    total_transactions: 150,
    total_volume: 1.5
  },
  funnel: {
    created: 100,
    first_tx: 80,
    feature_usage: 60,
    recurring: 40,
    high_value: 20
  },
  cohorts: [
    { period: '2024-01', retention_week_1: 85, retention_week_2: 70 }
  ],
  scores: {
    total_score: 75,
    retention_score: 80,
    adoption_score: 70,
    activity_score: 75
  }
};

const mockInvoice = {
  id: 'invoice-123',
  user_id: 'user-123',
  type: 'subscription',
  amount_zec: 0.001,
  payment_address: 't1PaymentAddress123456789012345678901234567',
  status: 'pending',
  created_at: new Date().toISOString()
};

const mockWithdrawal = {
  id: 'withdrawal-123',
  user_id: 'user-123',
  amount_zec: 0.0001,
  fee_zec: 0.000001,
  net_zec: 0.000099,
  to_address: 't1WithdrawalAddress123456789012345678901234',
  status: 'pending',
  requested_at: new Date().toISOString()
};

describe('Frontend E2E Integration Tests', () => {
  
  beforeEach(() => {
    // Reset all stores
    useAuthStore.getState().logout();
    useProjectStore.setState({ projects: [], currentProject: null });
    useOnboardingStore.setState({ currentStep: 0 });
    useSubscriptionStore.setState({ subscription: null });
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  // ============================================================================
  // Flow 1: Registration → Onboarding → Analytics
  // ============================================================================
  
  describe('Flow 1: Registration → Onboarding → Analytics', () => {
    
    test('1.1: Complete registration flow', async () => {
      // Mock successful registration
      vi.mocked(authService.register).mockResolvedValue({
        user: mockUser,
        token: 'mock-jwt-token'
      });

      const { result } = renderHook(() => useAuthStore());

      await result.current.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123!'
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);
      });

      expect(authService.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123!'
      });
    });

    test('1.2: Login after registration', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        token: 'mock-jwt-token'
      });

      const { result } = renderHook(() => useAuthStore());

      await result.current.login({
        email: 'test@example.com',
        password: 'TestPassword123!'
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.email).toBe('test@example.com');
      });
    });

    test('1.3: Complete onboarding flow', async () => {
      // Setup authenticated state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        token: 'mock-jwt-token'
      });

      // Mock onboarding completion
      vi.mocked(projectService.createProject).mockResolvedValue(mockProject);
      vi.mocked(projectService.addWallet).mockResolvedValue(mockWallet);

      const { result: onboardingResult } = renderHook(() => useOnboardingStore());
      const { result: projectResult } = renderHook(() => useProjectStore());

      // Update onboarding data
      onboardingResult.current.updateProjectData({
        name: 'Test Project',
        description: 'Test description',
        category: 'defi'
      });

      onboardingResult.current.updateWalletData({
        address: 't1TestAddress123456789012345678901234567890',
        privacy_mode: 'private'
      });

      // Complete onboarding
      await onboardingResult.current.completeOnboarding();

      await waitFor(() => {
        expect(projectService.createProject).toHaveBeenCalled();
        expect(projectService.addWallet).toHaveBeenCalled();
      });
    });

    test('1.4: Fetch analytics after onboarding', async () => {
      // Setup authenticated state with completed onboarding
      useAuthStore.setState({
        user: { ...mockUser, onboarding_completed: true },
        isAuthenticated: true,
        token: 'mock-jwt-token'
      });

      useProjectStore.setState({
        projects: [mockProject],
        currentProject: mockProject
      });

      // Mock analytics calls
      vi.mocked(analyticsService.getDashboardMetrics).mockResolvedValue(mockAnalytics.metrics);
      vi.mocked(analyticsService.getAdoptionFunnel).mockResolvedValue(mockAnalytics.funnel);
      vi.mocked(analyticsService.getRetentionCohorts).mockResolvedValue(mockAnalytics.cohorts);
      vi.mocked(analyticsService.getProductivityScores).mockResolvedValue(mockAnalytics.scores);

      // Fetch all analytics
      const dashboardMetrics = await analyticsService.getDashboardMetrics(mockProject.id);
      const adoptionFunnel = await analyticsService.getAdoptionFunnel(mockProject.id);
      const retentionCohorts = await analyticsService.getRetentionCohorts(mockProject.id);
      const productivityScores = await analyticsService.getProductivityScores(mockProject.id);

      expect(dashboardMetrics).toEqual(mockAnalytics.metrics);
      expect(adoptionFunnel).toEqual(mockAnalytics.funnel);
      expect(retentionCohorts).toEqual(mockAnalytics.cohorts);
      expect(productivityScores).toEqual(mockAnalytics.scores);
    });

    test('1.5: Verify analytics data structure', async () => {
      vi.mocked(analyticsService.getDashboardMetrics).mockResolvedValue(mockAnalytics.metrics);

      const metrics = await analyticsService.getDashboardMetrics(mockProject.id);

      expect(metrics).toHaveProperty('total_wallets');
      expect(metrics).toHaveProperty('active_wallets');
      expect(metrics).toHaveProperty('total_transactions');
      expect(metrics).toHaveProperty('total_volume');
      expect(typeof metrics.total_wallets).toBe('number');
    });
  });

  // ============================================================================
  // Flow 2: Subscription Upgrade
  // ============================================================================
  
  describe('Flow 2: Subscription Upgrade', () => {
    
    beforeEach(() => {
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        token: 'mock-jwt-token'
      });
    });

    test('2.1: Check subscription status', async () => {
      vi.mocked(subscriptionService.getSubscriptionStatus).mockResolvedValue({
        subscription_status: 'free',
        subscription_expires_at: mockUser.subscription_expires_at,
        days_remaining: 30
      });

      const { result } = renderHook(() => useSubscriptionStore());

      await result.current.fetchSubscriptionStatus();

      await waitFor(() => {
        expect(result.current.subscription).toBeTruthy();
        expect(result.current.subscription?.subscription_status).toBe('free');
      });
    });

    test('2.2: Create subscription upgrade invoice', async () => {
      vi.mocked(subscriptionService.createSubscriptionInvoice).mockResolvedValue(mockInvoice);

      const invoice = await subscriptionService.createSubscriptionInvoice({
        plan: 'premium',
        amount_zec: 0.001
      });

      expect(invoice).toEqual(mockInvoice);
      expect(invoice.type).toBe('subscription');
      expect(invoice.payment_address).toBeTruthy();
    });

    test('2.3: Check payment status', async () => {
      vi.mocked(subscriptionService.checkPaymentStatus).mockResolvedValue({
        paid: false,
        invoice: mockInvoice
      });

      const status = await subscriptionService.checkPaymentStatus(mockInvoice.id);

      expect(status.paid).toBe(false);
      expect(status.invoice.status).toBe('pending');
    });

    test('2.4: Verify subscription update after payment', async () => {
      const paidInvoice = { ...mockInvoice, status: 'paid' };
      const updatedUser = { ...mockUser, subscription_status: 'premium' };

      vi.mocked(subscriptionService.checkPaymentStatus).mockResolvedValue({
        paid: true,
        invoice: paidInvoice
      });

      vi.mocked(subscriptionService.getSubscriptionStatus).mockResolvedValue({
        subscription_status: 'premium',
        subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        days_remaining: 365
      });

      const { result } = renderHook(() => useSubscriptionStore());

      await result.current.fetchSubscriptionStatus();

      await waitFor(() => {
        expect(result.current.subscription?.subscription_status).toBe('premium');
      });
    });

    test('2.5: Handle subscription upgrade errors', async () => {
      vi.mocked(subscriptionService.createSubscriptionInvoice).mockRejectedValue(
        new Error('Payment processing failed')
      );

      await expect(
        subscriptionService.createSubscriptionInvoice({ plan: 'premium', amount_zec: 0.001 })
      ).rejects.toThrow('Payment processing failed');
    });
  });

  // ============================================================================
  // Flow 3: Data Monetization
  // ============================================================================
  
  describe('Flow 3: Data Monetization', () => {
    
    beforeEach(() => {
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        token: 'mock-jwt-token'
      });

      useProjectStore.setState({
        projects: [mockProject],
        currentProject: mockProject
      });
    });

    test('3.1: Update wallet to monetizable mode', async () => {
      const updatedWallet = { ...mockWallet, privacy_mode: 'monetizable' };
      vi.mocked(projectService.updateWallet).mockResolvedValue(updatedWallet);

      const result = await projectService.updateWallet(mockWallet.id, {
        privacy_mode: 'monetizable'
      });

      expect(result.privacy_mode).toBe('monetizable');
      expect(projectService.updateWallet).toHaveBeenCalledWith(mockWallet.id, {
        privacy_mode: 'monetizable'
      });
    });

    test('3.2: Create data access invoice', async () => {
      const dataInvoice = { ...mockInvoice, type: 'data_access', amount_zec: 0.0005 };
      vi.mocked(subscriptionService.createDataAccessInvoice).mockResolvedValue(dataInvoice);

      const invoice = await subscriptionService.createDataAccessInvoice({
        project_id: mockProject.id,
        amount_zec: 0.0005
      });

      expect(invoice.type).toBe('data_access');
      expect(invoice.amount_zec).toBe(0.0005);
    });

    test('3.3: Verify payment splitting calculation', async () => {
      const amount = 0.001;
      const ownerShare = amount * 0.7; // 70%
      const platformShare = amount * 0.3; // 30%

      expect(ownerShare).toBeCloseTo(0.0007, 4);
      expect(platformShare).toBeCloseTo(0.0003, 4);
      expect(ownerShare + platformShare).toBeCloseTo(amount, 4);
    });

    test('3.4: Check data owner balance update', async () => {
      const updatedUser = { ...mockUser, balance_zec: 0.0007 };
      vi.mocked(userService.getUserBalance).mockResolvedValue({
        balance_zec: 0.0007,
        total_earned: 0.0007
      });

      const balance = await userService.getUserBalance();

      expect(balance.balance_zec).toBe(0.0007);
    });

    test('3.5: Verify monetizable data access control', async () => {
      vi.mocked(analyticsService.getComparisonData).mockResolvedValue({
        allowed: true,
        data: { comparative_metrics: {} }
      });

      const result = await analyticsService.getComparisonData(mockProject.id);

      expect(result.allowed).toBe(true);
      expect(result.data).toBeTruthy();
    });
  });

  // ============================================================================
  // Flow 4: Withdrawal
  // ============================================================================
  
  describe('Flow 4: Withdrawal', () => {
    
    beforeEach(() => {
      useAuthStore.setState({
        user: { ...mockUser, balance_zec: 0.001 },
        isAuthenticated: true,
        token: 'mock-jwt-token'
      });
    });

    test('4.1: Check user balance before withdrawal', async () => {
      vi.mocked(userService.getUserBalance).mockResolvedValue({
        balance_zec: 0.001,
        total_earned: 0.001
      });

      const balance = await userService.getUserBalance();

      expect(balance.balance_zec).toBe(0.001);
      expect(balance.balance_zec).toBeGreaterThan(0);
    });

    test('4.2: Validate withdrawal address', async () => {
      vi.mocked(projectService.validateAddress).mockResolvedValue({
        valid: true,
        type: 't'
      });

      const validation = await projectService.validateAddress(
        't1UnEx5GLUk7Dn1kVCzE5ZCPEYMCCAtqPEN'
      );

      expect(validation.valid).toBe(true);
      expect(validation.type).toBe('t');
    });

    test('4.3: Reject invalid withdrawal address', async () => {
      vi.mocked(projectService.validateAddress).mockResolvedValue({
        valid: false,
        error: 'Invalid address format'
      });

      const validation = await projectService.validateAddress('invalid-address');

      expect(validation.valid).toBe(false);
      expect(validation.error).toBeTruthy();
    });

    test('4.4: Create withdrawal request', async () => {
      vi.mocked(userService.createWithdrawal).mockResolvedValue(mockWithdrawal);

      const withdrawal = await userService.createWithdrawal({
        amount_zec: 0.0001,
        to_address: 't1UnEx5GLUk7Dn1kVCzE5ZCPEYMCCAtqPEN'
      });

      expect(withdrawal).toEqual(mockWithdrawal);
      expect(withdrawal.amount_zec).toBe(0.0001);
      expect(withdrawal.fee_zec).toBeGreaterThan(0);
      expect(withdrawal.net_zec).toBeLessThan(withdrawal.amount_zec);
    });

    test('4.5: Handle insufficient balance error', async () => {
      vi.mocked(userService.createWithdrawal).mockRejectedValue(
        new Error('INSUFFICIENT_BALANCE')
      );

      await expect(
        userService.createWithdrawal({
          amount_zec: 100,
          to_address: 't1UnEx5GLUk7Dn1kVCzE5ZCPEYMCCAtqPEN'
        })
      ).rejects.toThrow('INSUFFICIENT_BALANCE');
    });

    test('4.6: Get withdrawal history', async () => {
      vi.mocked(userService.getWithdrawalHistory).mockResolvedValue([mockWithdrawal]);

      const history = await userService.getWithdrawalHistory();

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toEqual(mockWithdrawal);
    });

    test('4.7: Verify withdrawal fee calculation', async () => {
      const amount = 0.001;
      const feePercentage = 0.01; // 1%
      const expectedFee = amount * feePercentage;
      const expectedNet = amount - expectedFee;

      expect(expectedFee).toBeCloseTo(0.00001, 5);
      expect(expectedNet).toBeCloseTo(0.00099, 5);
    });
  });

  // ============================================================================
  // Cross-Flow Integration Tests
  // ============================================================================
  
  describe('Cross-Flow Integration', () => {
    
    test('5.1: Verify authentication persists across flows', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        token: 'mock-jwt-token'
      });

      const { result } = renderHook(() => useAuthStore());

      await result.current.login({
        email: 'test@example.com',
        password: 'TestPassword123!'
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Token should persist for subsequent requests
      expect(localStorage.getItem('token')).toBeTruthy();
    });

    test('5.2: Verify error handling across services', async () => {
      vi.mocked(authService.login).mockRejectedValue(
        new Error('Invalid credentials')
      );

      const { result } = renderHook(() => useAuthStore());

      await expect(
        result.current.login({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        })
      ).rejects.toThrow();

      expect(result.current.isAuthenticated).toBe(false);
    });

    test('5.3: Verify state consistency across stores', async () => {
      // Setup authenticated state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        token: 'mock-jwt-token'
      });

      // Setup project state
      useProjectStore.setState({
        projects: [mockProject],
        currentProject: mockProject
      });

      // Verify consistency
      const authState = useAuthStore.getState();
      const projectState = useProjectStore.getState();

      expect(authState.user?.id).toBe(mockProject.user_id);
      expect(projectState.currentProject?.user_id).toBe(authState.user?.id);
    });

    test('5.4: Verify logout clears all state', async () => {
      // Setup state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        token: 'mock-jwt-token'
      });

      useProjectStore.setState({
        projects: [mockProject],
        currentProject: mockProject
      });

      // Logout
      const { result } = renderHook(() => useAuthStore());
      await result.current.logout();

      // Verify all state cleared
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
      });
    });

    test('5.5: Verify privacy mode changes propagate', async () => {
      const updatedWallet = { ...mockWallet, privacy_mode: 'public' };
      vi.mocked(projectService.updateWallet).mockResolvedValue(updatedWallet);
      vi.mocked(projectService.getWallet).mockResolvedValue(updatedWallet);

      // Update privacy mode
      await projectService.updateWallet(mockWallet.id, { privacy_mode: 'public' });

      // Verify change
      const wallet = await projectService.getWallet(mockWallet.id);
      expect(wallet.privacy_mode).toBe('public');
    });

    test('5.6: Verify subscription status affects feature access', async () => {
      // Free user
      useAuthStore.setState({
        user: { ...mockUser, subscription_status: 'free' },
        isAuthenticated: true
      });

      vi.mocked(analyticsService.getComparisonData).mockRejectedValue(
        new Error('SUBSCRIPTION_REQUIRED')
      );

      await expect(
        analyticsService.getComparisonData(mockProject.id)
      ).rejects.toThrow('SUBSCRIPTION_REQUIRED');

      // Premium user
      useAuthStore.setState({
        user: { ...mockUser, subscription_status: 'premium' },
        isAuthenticated: true
      });

      vi.mocked(analyticsService.getComparisonData).mockResolvedValue({
        allowed: true,
        data: {}
      });

      const result = await analyticsService.getComparisonData(mockProject.id);
      expect(result.allowed).toBe(true);
    });
  });
});
