/**
 * Subscription Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { subscriptionService } from '../../services/subscriptionService';
import { apiClient } from '../../services/apiClient';

// Mock the apiClient
vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('SubscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should return subscription status on success', async () => {
      const mockStatus = {
        userId: 'user-123',
        status: 'free',
        expiresAt: '2025-01-30T00:00:00Z',
        isActive: true,
        isExpired: false,
        daysRemaining: 30,
        isPremium: false,
        onboardingCompleted: true,
        balance: 0,
        memberSince: '2024-12-01T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: { subscription: mockStatus },
      });

      const result = await subscriptionService.getStatus();

      expect(result).toEqual(mockStatus);
      expect(apiClient.get).toHaveBeenCalledWith('/api/subscriptions/status');
    });

    it('should return null on failure', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        error: 'Failed to fetch',
      });

      const result = await subscriptionService.getStatus();

      expect(result).toBeNull();
    });
  });

  describe('upgrade', () => {
    it('should upgrade subscription successfully', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { subscription: { status: 'premium' } },
      });

      const result = await subscriptionService.upgrade(3);

      expect(result).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/subscriptions/upgrade',
        { durationMonths: 3 }
      );
    });

    it('should return false on upgrade failure', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: false,
        error: 'Upgrade failed',
      });

      const result = await subscriptionService.upgrade(1);

      expect(result).toBe(false);
    });
  });

  describe('calculatePrice', () => {
    it('should calculate monthly price correctly', () => {
      const price = subscriptionService.calculatePrice(1);
      expect(price).toBe(0.1);
    });

    it('should apply 5% discount for 3 months', () => {
      const price = subscriptionService.calculatePrice(3);
      expect(price).toBe(0.285); // 0.1 * 3 * 0.95
    });

    it('should apply 10% discount for 6 months', () => {
      const price = subscriptionService.calculatePrice(6);
      expect(price).toBe(0.54); // 0.1 * 6 * 0.9
    });

    it('should apply 20% discount for 12 months', () => {
      const price = subscriptionService.calculatePrice(12);
      expect(price).toBe(0.96); // 0.1 * 12 * 0.8
    });
  });

  describe('getPlans', () => {
    it('should return all subscription plans', () => {
      const plans = subscriptionService.getPlans();

      expect(plans).toHaveLength(4);
      expect(plans[0].id).toBe('monthly');
      expect(plans[1].id).toBe('quarterly');
      expect(plans[2].id).toBe('biannual');
      expect(plans[3].id).toBe('annual');
    });

    it('should mark biannual plan as popular', () => {
      const plans = subscriptionService.getPlans();
      const biannual = plans.find(p => p.id === 'biannual');

      expect(biannual?.popular).toBe(true);
    });

    it('should include correct features for each plan', () => {
      const plans = subscriptionService.getPlans();

      plans.forEach(plan => {
        expect(plan.features).toBeDefined();
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });
  });

  describe('cancel', () => {
    it('should cancel subscription successfully', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { subscription: { status: 'free' } },
      });

      const result = await subscriptionService.cancel();

      expect(result).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith('/api/subscriptions/cancel');
    });
  });

  describe('checkPremiumAccess', () => {
    it('should return true for premium users', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: { hasPremium: true },
      });

      const result = await subscriptionService.checkPremiumAccess();

      expect(result).toBe(true);
    });

    it('should return false for free users', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: { hasPremium: false },
      });

      const result = await subscriptionService.checkPremiumAccess();

      expect(result).toBe(false);
    });
  });
});
