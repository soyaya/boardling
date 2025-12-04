/**
 * User Service
 * 
 * Handles user profile management and settings API calls
 */

import { authService } from './authService';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company?: string;
  subscription_status?: 'free' | 'premium' | 'enterprise';
  subscription_expires_at?: string | null;
  balance_zec?: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  company?: string;
}

export interface PaymentPreferences {
  preferred_address_type?: 'transparent' | 'shielded' | 'unified';
  auto_withdraw_enabled?: boolean;
  auto_withdraw_threshold?: number;
  notification_email?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

class UserService {
  constructor() {
    // Base URL is handled by authService
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile | null> {
    try {
      const response = await authService.authenticatedRequest('/auth/me', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      return data.user || null;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: UpdateProfileData): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await authService.authenticatedRequest(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to update profile',
          message: data.message
        };
      }

      // Update the user in auth store
      if (data.user) {
        authService.setUser(data.user);
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        data: data.user
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  /**
   * Get user balance
   */
  async getBalance(): Promise<any> {
    try {
      const response = await authService.authenticatedRequest('/api/payments/balance', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      return data.balance || null;
    } catch (error) {
      console.error('Get balance error:', error);
      return null;
    }
  }

  /**
   * Get payment preferences
   * Note: This is a placeholder - backend endpoint needs to be implemented
   */
  async getPaymentPreferences(): Promise<PaymentPreferences | null> {
    try {
      // For now, return default preferences
      // TODO: Implement backend endpoint
      return {
        preferred_address_type: 'unified',
        auto_withdraw_enabled: false,
        auto_withdraw_threshold: 1.0,
        notification_email: authService.getCurrentUser()?.email
      };
    } catch (error) {
      console.error('Get payment preferences error:', error);
      return null;
    }
  }

  /**
   * Update payment preferences
   * Note: This is a placeholder - backend endpoint needs to be implemented
   */
  async updatePaymentPreferences(preferences: PaymentPreferences): Promise<ApiResponse> {
    try {
      // TODO: Implement backend endpoint
      // For now, just return success
      console.log('Payment preferences to save:', preferences);
      
      return {
        success: true,
        message: 'Payment preferences updated successfully'
      };
    } catch (error) {
      console.error('Update payment preferences error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  /**
   * Get withdrawal history
   */
  async getWithdrawalHistory(options: { limit?: number; offset?: number; status?: string } = {}): Promise<any[]> {
    try {
      const { limit = 50, offset = 0, status } = options;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(status && { status })
      });

      const response = await authService.authenticatedRequest(`/api/payments/withdrawals?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch withdrawal history');
      }

      const data = await response.json();
      return data.withdrawals || [];
    } catch (error) {
      console.error('Get withdrawal history error:', error);
      return [];
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(options: { limit?: number; offset?: number; type?: string } = {}): Promise<any[]> {
    try {
      const { limit = 50, offset = 0, type } = options;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(type && { type })
      });

      const response = await authService.authenticatedRequest(`/api/payments/history?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Get payment history error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
