import express from 'express';
import { 
  syncAllWallets, 
  getWalletSyncStatus,
  processWalletTransactions,
  getTrackedWallets
} from '../services/walletTrackingService.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkProjectOwnership } from '../middleware/authorization.js';

const router = express.Router();

/**
 * @route   POST /api/wallet-tracking/sync
 * @desc    Manually trigger sync for all tracked wallets
 * @access  Private (Admin only)
 */
router.post('/sync', authenticateToken, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: 'Only administrators can trigger manual sync'
      });
    }
    
    const result = await syncAllWallets();
    
    res.json({
      success: true,
      message: 'Wallet sync completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/wallet-tracking/sync/:walletId
 * @desc    Manually trigger sync for a specific wallet
 * @access  Private (Wallet owner)
 */
router.post('/sync/:walletId', authenticateToken, async (req, res, next) => {
  try {
    const { walletId } = req.params;
    
    // Get wallet and verify ownership
    const walletResult = await req.app.locals.pool.query(
      `SELECT w.*, p.user_id 
       FROM wallets w
       JOIN projects p ON w.project_id = p.id
       WHERE w.id = $1`,
      [walletId]
    );
    
    if (walletResult.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Wallet not found'
      });
    }
    
    const wallet = walletResult.rows[0];
    
    // Check ownership
    if (wallet.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: 'You do not have permission to sync this wallet'
      });
    }
    
    const result = await processWalletTransactions(wallet);
    
    res.json({
      success: true,
      message: 'Wallet sync completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/wallet-tracking/status/:walletId
 * @desc    Get sync status for a specific wallet
 * @access  Private (Wallet owner)
 */
router.get('/status/:walletId', authenticateToken, async (req, res, next) => {
  try {
    const { walletId } = req.params;
    
    // Get wallet and verify ownership
    const walletResult = await req.app.locals.pool.query(
      `SELECT w.*, p.user_id 
       FROM wallets w
       JOIN projects p ON w.project_id = p.id
       WHERE w.id = $1`,
      [walletId]
    );
    
    if (walletResult.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Wallet not found'
      });
    }
    
    const wallet = walletResult.rows[0];
    
    // Check ownership
    if (wallet.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: 'You do not have permission to view this wallet status'
      });
    }
    
    const status = await getWalletSyncStatus(walletId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/wallet-tracking/tracked
 * @desc    Get list of all tracked wallets
 * @access  Private (Admin only)
 */
router.get('/tracked', authenticateToken, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: 'Only administrators can view all tracked wallets'
      });
    }
    
    const wallets = await getTrackedWallets();
    
    res.json({
      success: true,
      count: wallets.length,
      data: wallets
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/wallet-tracking/health
 * @desc    Get health status of wallet tracking service
 * @access  Private (Admin only)
 */
router.get('/health', authenticateToken, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: 'Only administrators can view service health'
      });
    }
    
    const wallets = await getTrackedWallets();
    
    // Get recent sync statistics
    const statsResult = await req.app.locals.pool.query(
      `SELECT 
        COUNT(DISTINCT wallet_id) as wallets_with_data,
        COUNT(*) as total_transactions,
        MAX(block_timestamp) as last_transaction_time,
        MAX(processed_at) as last_sync_time
       FROM processed_transactions
       WHERE processed_at >= NOW() - INTERVAL '24 hours'`
    );
    
    const stats = statsResult.rows[0];
    
    res.json({
      success: true,
      data: {
        total_tracked_wallets: wallets.length,
        wallets_with_recent_data: parseInt(stats.wallets_with_data || 0),
        transactions_last_24h: parseInt(stats.total_transactions || 0),
        last_transaction_time: stats.last_transaction_time,
        last_sync_time: stats.last_sync_time,
        service_status: 'operational'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/wallet-tracking/events/start
 * @desc    Start indexer event listener (if available)
 * @access  Private (Admin only)
 */
router.post('/events/start', authenticateToken, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: 'Only administrators can manage event listeners'
      });
    }
    
    res.json({
      success: true,
      message: 'Event listener management is handled at application startup',
      note: 'Indexer events are automatically connected when the indexer is running in the same process'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/wallet-tracking/events/status
 * @desc    Get indexer event listener status
 * @access  Private (Admin only)
 */
router.get('/events/status', authenticateToken, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: 'Only administrators can view event listener status'
      });
    }
    
    res.json({
      success: true,
      data: {
        event_listener_enabled: process.env.ENABLE_INDEXER_EVENTS === 'true',
        sync_interval_ms: parseInt(process.env.WALLET_SYNC_INTERVAL_MS || '300000'),
        note: 'Event-based sync is triggered when new blocks are processed by the indexer'
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
