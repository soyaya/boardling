/**
 * Onboarding Routes
 * Handles user onboarding flow including project and wallet creation
 */

import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import {
  completeOnboarding,
  isOnboardingCompleted,
  getOnboardingStatus,
  resetOnboarding
} from '../services/onboardingService.js';

const router = express.Router();

/**
 * Complete onboarding - Create project and wallet in single transaction
 * POST /api/onboarding/complete
 */
router.post('/complete', authenticateJWT, async (req, res) => {
  const userId = req.user.id;
  const onboardingData = req.body;

  try {
    // Validate request body
    if (!onboardingData || typeof onboardingData !== 'object') {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request body'
      });
    }

    // Check if user has already completed onboarding
    const alreadyCompleted = await isOnboardingCompleted(userId);
    if (alreadyCompleted) {
      return res.status(409).json({
        error: 'ALREADY_EXISTS',
        message: 'User has already completed onboarding'
      });
    }

    // Complete onboarding
    const result = await completeOnboarding(userId, onboardingData);

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        project: result.project,
        wallet: result.wallet
      }
    });

  } catch (error) {
    console.error('Onboarding completion error:', error);

    // Handle specific error types
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to complete onboarding',
      details: error.message
    });
  }
});

/**
 * Get onboarding status
 * GET /api/onboarding/status
 */
router.get('/status', authenticateJWT, async (req, res) => {
  const userId = req.user.id;

  try {
    const status = await getOnboardingStatus(userId);

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Get onboarding status error:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get onboarding status'
    });
  }
});

/**
 * Check if onboarding is completed
 * GET /api/onboarding/check
 */
router.get('/check', authenticateJWT, async (req, res) => {
  const userId = req.user.id;

  try {
    const completed = await isOnboardingCompleted(userId);

    res.json({
      success: true,
      onboarding_completed: completed
    });

  } catch (error) {
    console.error('Check onboarding error:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to check onboarding status'
    });
  }
});

/**
 * Sync wallet data after onboarding
 * POST /api/onboarding/sync-wallet
 */
router.post('/sync-wallet', authenticateJWT, async (req, res) => {
  const userId = req.user.id;

  try {
    // Import wallet tracking service
    const { syncAllWallets, getTrackedWallets } = await import('../services/walletTrackingService.js');
    
    // Get user's wallets
    const allWallets = await getTrackedWallets();
    
    // Filter to only user's wallets (via projects)
    const { pool } = await import('../config/appConfig.js');
    const projectsResult = await pool.query(
      'SELECT id FROM projects WHERE user_id = $1',
      [userId]
    );
    const projectIds = projectsResult.rows.map(p => p.id);
    
    const userWallets = allWallets.filter(w => projectIds.includes(w.project_id));
    
    if (userWallets.length === 0) {
      return res.json({
        success: true,
        message: 'No wallets to sync',
        wallets_synced: 0,
        total_transactions: 0
      });
    }

    // Sync user's wallets
    const { processWalletTransactions } = await import('../services/walletTrackingService.js');
    const results = [];
    
    for (const wallet of userWallets) {
      try {
        const result = await processWalletTransactions(wallet);
        results.push(result);
      } catch (error) {
        console.error(`Failed to sync wallet ${wallet.id}:`, error.message);
        results.push({
          wallet_id: wallet.id,
          address: wallet.address,
          processed: 0,
          error: error.message
        });
      }
    }

    const totalProcessed = results.reduce((sum, r) => sum + (r.processed || 0), 0);

    res.json({
      success: true,
      message: 'Wallet sync completed',
      wallets_synced: userWallets.length,
      total_transactions: totalProcessed,
      results
    });

  } catch (error) {
    console.error('Sync wallet error:', error);

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to sync wallet data',
      details: error.message
    });
  }
});

/**
 * Reset onboarding status (for testing/admin purposes)
 * POST /api/onboarding/reset
 */
router.post('/reset', authenticateJWT, async (req, res) => {
  const userId = req.user.id;

  try {
    await resetOnboarding(userId);

    res.json({
      success: true,
      message: 'Onboarding status reset successfully'
    });

  } catch (error) {
    console.error('Reset onboarding error:', error);

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to reset onboarding status'
    });
  }
});

export default router;
