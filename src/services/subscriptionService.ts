/**
 * Subscription Service
 * 
 * Handles subscription management, status checking, and upgrade flows.
 */

import { apiClient } from './apiClient';

export interface SubscriptionStatus {
  userId: string;
  status: 'free' | 'premium' | 'enterprise';
  expiresAt: string | null;
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  isPremium: boolean;
  onboardingCompleted: boolean;
  balance: number;
  memberSince: string;
}

export interface SubscriptionUpgradeRequest {
  durationMonths: number;
}

export interface PaymentHistory {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

class SubscriptionService {
  /**
   * Get current subscription status
   */
  async getStatus(): Promise<SubscriptionStatus | null> {
    try {
      const response = await apiClient.get<{ subscription: SubscriptionStatus }>(
        '/api/subscriptions/status'
      );

      if (response.success && response.data) {
        return response.data.subscription;
      }

      return null;
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return null;
    }
  }

  /**
   * Upgrade to premium subscription
   */
  async upgrade(durationMonths: number = 1): Promise<boolean> {
    try {
      const response = await apiClient.post<{ subscription: SubscriptionStatus }>(
        '/api/subscriptions/upgrade',
        { durationMonths }
      );

      return response.success;
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      return false;
    }
  }

  /**
   * Cancel subscription (downgrade to free)
   */
  async cancel(): Promise<boolean> {
    try {
      const response = await apiClient.post('/api/subscriptions/cancel');
      return response.success;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  /**
   * Get subscription payment history
   */
  async getHistory(): Promise<PaymentHistory[]> {
    try {
      const response = await apiClient.get<{ history: PaymentHistory[] }>(
        '/api/subscriptions/history'
      );

      if (response.success && response.data) {
        return response.data.history;
      }

      return [];
    } catch (error) {
      console.error('Failed to get subscription history:', error);
      return [];
    }
  }

  /**
   * Check if user has premium access
   */
  async checkPremiumAccess(): Promise<boolean> {
    try {
      const response = await apiClient.get<{ hasPremium: boolean }>(
        '/api/subscriptions/check-premium'
      );

      if (response.success && response.data) {
        return response.data.hasPremium;
      }

      return false;
    } catch (error) {
      console.error('Failed to check premium access:', error);
      return false;
    }
  }

  /**
   * Calculate subscription price based on duration
   */
  calculatePrice(durationMonths: number): number {
    // Base price per month in ZEC
    const basePrice = 0.1;
    
    // Apply discounts for longer subscriptions
    let discount = 0;
    if (durationMonths >= 12) {
      discount = 0.2; // 20% off for annual
    } else if (durationMonths >= 6) {
      discount = 0.1; // 10% off for 6 months
    } else if (durationMonths >= 3) {
      discount = 0.05; // 5% off for 3 months
    }

    const totalPrice = basePrice * durationMonths * (1 - discount);
    return Math.round(totalPrice * 100000000) / 100000000; // Round to 8 decimals
  }

  /**
   * Get subscription plan details
   */
  getPlans() {
    return [
      {
        id: 'monthly',
        name: 'Monthly',
        duration: 1,
        price: this.calculatePrice(1),
        pricePerMonth: this.calculatePrice(1),
        discount: 0,
        features: [
          'Unlimited wallet tracking',
          'Advanced analytics',
          'Retention cohorts',
          'Productivity scoring',
          'Email support',
        ],
      },
      {
        id: 'quarterly',
        name: 'Quarterly',
        duration: 3,
        price: this.calculatePrice(3),
        pricePerMonth: this.calculatePrice(3) / 3,
        discount: 5,
        features: [
          'All Monthly features',
          '5% discount',
          'Priority support',
          'Custom reports',
        ],
        popular: false,
      },
      {
        id: 'biannual',
        name: 'Semi-Annual',
        duration: 6,
        price: this.calculatePrice(6),
        pricePerMonth: this.calculatePrice(6) / 6,
        discount: 10,
        features: [
          'All Quarterly features',
          '10% discount',
          'API access',
          'Data export',
        ],
        popular: true,
      },
      {
        id: 'annual',
        name: 'Annual',
        duration: 12,
        price: this.calculatePrice(12),
        pricePerMonth: this.calculatePrice(12) / 12,
        discount: 20,
        features: [
          'All Semi-Annual features',
          '20% discount',
          'Dedicated support',
          'Custom integrations',
        ],
        popular: false,
      },
    ];
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;
