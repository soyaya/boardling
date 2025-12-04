/**
 * User Service Unit Tests
 * 
 * Tests for user profile management and settings functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';

// Mock authService
vi.mock('../../services/authService', () => ({
  authService: {
    authenticatedRequest: vi.fn(),
    getCurrentUser: vi.fn(),
    setUser: vi.fn()
  }
}));

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      const mockResponse = {
        ok: true,
        json: async () => ({ user: mockUser })
      };

      vi.mocked(authService.authenticatedRequest).mockResolvedValue(mockResponse as any);

      const result = await userService.getProfile();

      expect(result).toEqual(mockUser);
      expect(authService.authenticatedRequest).toHaveBeenCalledWith('/auth/me', {
        method: 'GET'
      });
    });

    it('should return null on error', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({ error: 'Not found' })
      };

      vi.mocked(authService.authenticatedRequest).mockResolvedValue(mockResponse as any);

      const result = await userService.getProfile();

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = '123';
      const profileData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const mockUpdatedUser = {
        id: userId,
        ...profileData,
        created_at: '2024-01-01',
        updated_at: '2024-01-02'
      };

      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, user: mockUpdatedUser })
      };

      vi.mocked(authService.authenticatedRequest).mockResolvedValue(mockResponse as any);

      const result = await userService.updateProfile(userId, profileData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedUser);
      expect(authService.setUser).toHaveBeenCalledWith(mockUpdatedUser);
    });

    it('should handle update errors', async () => {
      const userId = '123';
      const profileData = { name: 'Test' };

      const mockResponse = {
        ok: false,
        json: async () => ({ error: 'Validation failed' })
      };

      vi.mocked(authService.authenticatedRequest).mockResolvedValue(mockResponse as any);

      const result = await userService.updateProfile(userId, profileData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });
  });

  describe('getBalance', () => {
    it('should fetch user balance successfully', async () => {
      const mockBalance = {
        user_id: '123',
        total_received_zec: 10.5,
        total_withdrawn_zec: 2.0,
        available_balance_zec: 8.5
      };

      const mockResponse = {
        ok: true,
        json: async () => ({ balance: mockBalance })
      };

      vi.mocked(authService.authenticatedRequest).mockResolvedValue(mockResponse as any);

      const result = await userService.getBalance();

      expect(result).toEqual(mockBalance);
    });

    it('should return null on error', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({ error: 'Not found' })
      };

      vi.mocked(authService.authenticatedRequest).mockResolvedValue(mockResponse as any);

      const result = await userService.getBalance();

      expect(result).toBeNull();
    });
  });

  describe('getWithdrawalHistory', () => {
    it('should fetch withdrawal history successfully', async () => {
      const mockWithdrawals = [
        {
          id: '1',
          amount_zec: 5.0,
          fee_zec: 0.001,
          net_zec: 4.999,
          to_address: 't1abc123',
          status: 'sent',
          requested_at: '2024-01-01'
        }
      ];

      const mockResponse = {
        ok: true,
        json: async () => ({ withdrawals: mockWithdrawals })
      };

      vi.mocked(authService.authenticatedRequest).mockResolvedValue(mockResponse as any);

      const result = await userService.getWithdrawalHistory({ limit: 10 });

      expect(result).toEqual(mockWithdrawals);
      expect(authService.authenticatedRequest).toHaveBeenCalledWith(
        expect.stringContaining('/api/payments/withdrawals'),
        { method: 'GET' }
      );
    });

    it('should return empty array on error', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({ error: 'Failed' })
      };

      vi.mocked(authService.authenticatedRequest).mockResolvedValue(mockResponse as any);

      const result = await userService.getWithdrawalHistory();

      expect(result).toEqual([]);
    });
  });

  describe('getPaymentHistory', () => {
    it('should fetch payment history successfully', async () => {
      const mockHistory = [
        {
          id: '1',
          type: 'subscription',
          amount_zec: 10.0,
          status: 'paid',
          created_at: '2024-01-01'
        }
      ];

      const mockResponse = {
        ok: true,
        json: async () => ({ history: mockHistory })
      };

      vi.mocked(authService.authenticatedRequest).mockResolvedValue(mockResponse as any);

      const result = await userService.getPaymentHistory({ limit: 20 });

      expect(result).toEqual(mockHistory);
    });
  });

  describe('getPaymentPreferences', () => {
    it('should return default payment preferences', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);

      const result = await userService.getPaymentPreferences();

      expect(result).toEqual({
        preferred_address_type: 'unified',
        auto_withdraw_enabled: false,
        auto_withdraw_threshold: 1.0,
        notification_email: 'test@example.com'
      });
    });
  });

  describe('updatePaymentPreferences', () => {
    it('should update payment preferences successfully', async () => {
      const preferences = {
        preferred_address_type: 'shielded' as const,
        auto_withdraw_enabled: true,
        auto_withdraw_threshold: 5.0
      };

      const result = await userService.updatePaymentPreferences(preferences);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Payment preferences updated successfully');
    });
  });
});
