/**
 * Subscription Routes
 * Handles subscription management, status checking, and upgrades
 */

import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import {
  getSubscriptionDetails,
  upgradeToPremium,
  updateSubscriptionStatus,
  checkSubscriptionStatus
} from '../services/subscriptionService.js';

const router = express.Router();

/**
 * Get current subscription status
 * GET /api/subscriptions/status
 */
router.get('/status', authenticateJWT, async (req, res) => {
  try {
    const details = await getSubscriptionDetails(req.user.id);
    
    res.json({
      success: true,
      subscription: details
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get subscription status'
    });
  }
});

/**
 * Upgrade to premium subscription
 * POST /api/subscriptions/upgrade
 */
router.post('/upgrade', authenticateJWT, async (req, res) => {
  try {
    const { durationMonths = 1 } = req.body;
    
    // Validate duration
    if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 12) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Duration must be between 1 and 12 months'
      });
    }
    
    // In a real implementation, this would be called after payment is confirmed
    // For now, we'll allow direct upgrade for testing
    const updated = await upgradeToPremium(req.user.id, durationMonths);
    
    res.json({
      success: true,
      message: 'Subscription upgraded successfully',
      subscription: updated
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to upgrade subscription'
    });
  }
});

/**
 * Cancel subscription (downgrade to free)
 * POST /api/subscriptions/cancel
 */
router.post('/cancel', authenticateJWT, async (req, res) => {
  try {
    // Set subscription to free with no expiration
    const updated = await updateSubscriptionStatus(req.user.id, 'free', null);
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: updated
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to cancel subscription'
    });
  }
});

/**
 * Get subscription history (placeholder)
 * GET /api/subscriptions/history
 */
router.get('/history', authenticateJWT, async (req, res) => {
  try {
    // In a real implementation, this would fetch payment history from invoices table
    // For now, return empty array
    res.json({
      success: true,
      history: []
    });
  } catch (error) {
    console.error('Get subscription history error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get subscription history'
    });
  }
});

/**
 * Check if user has premium access
 * GET /api/subscriptions/check-premium
 */
router.get('/check-premium', authenticateJWT, async (req, res) => {
  try {
    const status = await checkSubscriptionStatus(req.user.id);
    
    res.json({
      success: true,
      hasPremium: status.isPremium,
      isActive: status.isActive,
      status: status.status
    });
  } catch (error) {
    console.error('Check premium access error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to check premium access'
    });
  }
});

export default router;
