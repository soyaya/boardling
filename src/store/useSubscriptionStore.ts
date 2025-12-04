/**
 * Subscription Store
 * 
 * Manages subscription state using Zustand.
 */

import { create } from 'zustand';
import { subscriptionService } from '../services/subscriptionService';
import type { SubscriptionStatus } from '../services/subscriptionService';

interface SubscriptionState {
  subscription: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchSubscription: () => Promise<void>;
  upgrade: (durationMonths: number) => Promise<boolean>;
  cancel: () => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  loading: false,
  error: null,

  /**
   * Fetch current subscription status
   */
  fetchSubscription: async () => {
    set({ loading: true, error: null });

    try {
      const subscription = await subscriptionService.getStatus();
      
      if (subscription) {
        set({ subscription, loading: false });
      } else {
        set({ 
          error: 'Failed to fetch subscription status',
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      });
    }
  },

  /**
   * Upgrade subscription
   */
  upgrade: async (durationMonths: number) => {
    set({ loading: true, error: null });

    try {
      const success = await subscriptionService.upgrade(durationMonths);
      
      if (success) {
        // Refresh subscription status
        await get().fetchSubscription();
        return true;
      } else {
        set({ 
          error: 'Failed to upgrade subscription',
          loading: false 
        });
        return false;
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      });
      return false;
    }
  },

  /**
   * Cancel subscription
   */
  cancel: async () => {
    set({ loading: true, error: null });

    try {
      const success = await subscriptionService.cancel();
      
      if (success) {
        // Refresh subscription status
        await get().fetchSubscription();
        return true;
      } else {
        set({ 
          error: 'Failed to cancel subscription',
          loading: false 
        });
        return false;
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      });
      return false;
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set({
      subscription: null,
      loading: false,
      error: null,
    });
  },
}));

export default useSubscriptionStore;
