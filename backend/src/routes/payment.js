/**
 * Payment Routes
 * Handles payment processing for subscriptions and data access
 */

import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import {
  createSubscriptionInvoice,
  checkInvoicePayment,
  processSubscriptionPayment,
  createDataAccessInvoice,
  processDataAccessPayment,
  getUserBalance,
  getPaymentHistory,
  checkDataAccess,
  getDataOwnerEarnings,
  getDataAccessBuyers,
  getMonetizableDataPackages
} from '../services/paymentService.js';
import {
  createWithdrawal,
  getUserWithdrawals,
  getWithdrawal,
  getWithdrawalStats
} from '../services/withdrawalService.js';

const router = express.Router();

/**
 * Create payment invoice for subscription
 * POST /api/payments/invoice
 */
router.post('/invoice', authenticateJWT, async (req, res) => {
  try {
    const { plan_type, duration_months = 1, payment_method = 'auto', network = 'testnet', description } = req.body;

    // Validate plan type
    if (!plan_type || !['premium', 'enterprise'].includes(plan_type)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid plan_type. Must be "premium" or "enterprise"'
      });
    }

    // Create subscription invoice
    const invoice = await createSubscriptionInvoice(
      req.user.id,
      plan_type,
      duration_months,
      { payment_method, network, description }
    );

    res.status(201).json({
      success: true,
      message: 'Subscription invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Create subscription invoice error:', error);

    if (error.message.includes('Invalid plan type') || error.message.includes('Duration must be')) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create subscription invoice'
    });
  }
});

/**
 * Get invoice details
 * GET /api/payments/invoice/:id
 */
router.get('/invoice/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    const invoiceStatus = await checkInvoicePayment(id);

    res.json({
      success: true,
      invoice: invoiceStatus
    });
  } catch (error) {
    console.error('Get invoice error:', error);

    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Invoice not found'
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get invoice details'
    });
  }
});

/**
 * Check payment status for an invoice
 * POST /api/payments/check/:id
 */
router.post('/check/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    const invoiceStatus = await checkInvoicePayment(id);

    // If payment is detected but not yet processed, process it
    // In a real implementation, this would be done by a background job
    // For now, we'll check if there's payment info in the request body
    if (!invoiceStatus.paid && req.body.payment_detected) {
      const { amount_zec, txid } = req.body;
      
      if (amount_zec && txid) {
        // Process the payment
        const result = await processSubscriptionPayment(id, { amount_zec, txid });
        
        return res.json({
          success: true,
          paid: true,
          message: 'Payment processed successfully',
          result
        });
      }
    }

    res.json({
      success: true,
      paid: invoiceStatus.paid,
      invoice: invoiceStatus
    });
  } catch (error) {
    console.error('Check payment error:', error);

    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Invoice not found'
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to check payment status'
    });
  }
});

/**
 * Get user balance
 * GET /api/payments/balance
 */
router.get('/balance', authenticateJWT, async (req, res) => {
  try {
    const balance = await getUserBalance(req.user.id);

    res.json({
      success: true,
      balance
    });
  } catch (error) {
    console.error('Get balance error:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get user balance'
    });
  }
});

/**
 * Get payment history
 * GET /api/payments/history
 */
router.get('/history', authenticateJWT, async (req, res) => {
  try {
    const { limit = 50, offset = 0, type } = req.query;

    const history = await getPaymentHistory(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      type
    });

    res.json({
      success: true,
      history,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: history.length
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get payment history'
    });
  }
});

/**
 * Create data access invoice
 * POST /api/payments/data-access
 */
router.post('/data-access', authenticateJWT, async (req, res) => {
  try {
    const { data_owner_id, data_package_id, amount_zec, payment_method = 'auto', network = 'testnet', description } = req.body;

    // Validate required fields
    if (!data_owner_id || !data_package_id || !amount_zec) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: data_owner_id, data_package_id, amount_zec'
      });
    }

    // Create data access invoice
    const invoice = await createDataAccessInvoice(
      req.user.id,
      data_owner_id,
      data_package_id,
      amount_zec,
      { payment_method, network, description }
    );

    res.status(201).json({
      success: true,
      message: 'Data access invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Create data access invoice error:', error);

    if (error.message.includes('Amount must be')) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create data access invoice'
    });
  }
});

/**
 * Process data access payment (internal/webhook endpoint)
 * POST /api/payments/process-data-access/:id
 */
router.post('/process-data-access/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount_zec, txid } = req.body;

    if (!amount_zec || !txid) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: amount_zec, txid'
      });
    }

    const result = await processDataAccessPayment(id, { amount_zec, txid });

    res.json({
      success: true,
      message: 'Data access payment processed successfully',
      result
    });
  } catch (error) {
    console.error('Process data access payment error:', error);

    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Invoice not found'
      });
    }

    if (error.message.includes('already paid')) {
      return res.status(409).json({
        error: 'ALREADY_PAID',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process data access payment'
    });
  }
});

/**
 * Check if user has access to data package
 * GET /api/payments/data-access/check/:packageId
 */
router.get('/data-access/check/:packageId', authenticateJWT, async (req, res) => {
  try {
    const { packageId } = req.params;

    const accessStatus = await checkDataAccess(req.user.id, packageId);

    res.json({
      success: true,
      access: accessStatus
    });
  } catch (error) {
    console.error('Check data access error:', error);

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to check data access'
    });
  }
});

/**
 * Get data owner earnings summary
 * GET /api/payments/earnings
 */
router.get('/earnings', authenticateJWT, async (req, res) => {
  try {
    const { data_type, start_date, end_date } = req.query;

    const earnings = await getDataOwnerEarnings(req.user.id, {
      data_type,
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null
    });

    res.json({
      success: true,
      earnings
    });
  } catch (error) {
    console.error('Get earnings error:', error);

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get earnings summary'
    });
  }
});

/**
 * Get list of buyers for a data package
 * GET /api/payments/data-access/buyers/:packageId
 */
router.get('/data-access/buyers/:packageId', authenticateJWT, async (req, res) => {
  try {
    const { packageId } = req.params;

    const buyers = await getDataAccessBuyers(req.user.id, packageId);

    res.json({
      success: true,
      buyers,
      count: buyers.length
    });
  } catch (error) {
    console.error('Get data access buyers error:', error);

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get data access buyers'
    });
  }
});

/**
 * Get monetizable data packages for current user
 * GET /api/payments/monetizable-packages
 */
router.get('/monetizable-packages', authenticateJWT, async (req, res) => {
  try {
    const packages = await getMonetizableDataPackages(req.user.id);

    res.json({
      success: true,
      packages,
      count: packages.length
    });
  } catch (error) {
    console.error('Get monetizable packages error:', error);

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get monetizable data packages'
    });
  }
});

/**
 * Webhook endpoint for payment notifications (placeholder)
 * POST /api/payments/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    // In a real implementation, this would:
    // 1. Verify webhook signature
    // 2. Parse payment notification
    // 3. Process payment automatically
    // 4. Update invoice and subscription status

    const { invoice_id, amount_zec, txid, type } = req.body;

    if (!invoice_id || !amount_zec || !txid) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required webhook fields'
      });
    }

    // Process based on invoice type
    if (type === 'subscription') {
      await processSubscriptionPayment(invoice_id, { amount_zec, txid });
    } else if (type === 'data_access') {
      await processDataAccessPayment(invoice_id, { amount_zec, txid });
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Webhook processing error:', error);

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process webhook'
    });
  }
});

/**
 * Request a withdrawal
 * POST /api/payments/withdraw
 */
router.post('/withdraw', authenticateJWT, async (req, res) => {
  try {
    const { amount_zec, to_address, network = 'testnet' } = req.body;

    // Validate required fields
    if (!amount_zec || !to_address) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: amount_zec, to_address'
      });
    }

    // Validate amount is a number
    const amount = parseFloat(amount_zec);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Amount must be a positive number'
      });
    }

    // Create withdrawal
    const withdrawal = await createWithdrawal(req.user.id, amount, to_address, network);

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      withdrawal
    });
  } catch (error) {
    console.error('Create withdrawal error:', error);

    // Handle validation errors
    if (error.message.includes('Insufficient balance') || 
        error.message.includes('Invalid Zcash address') ||
        error.message.includes('must be at least') ||
        error.message.includes('cannot exceed')) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.message
      });
    }

    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create withdrawal request'
    });
  }
});

/**
 * Get user's withdrawal history
 * GET /api/payments/withdrawals
 */
router.get('/withdrawals', authenticateJWT, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    const withdrawals = await getUserWithdrawals(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      status
    });

    res.json({
      success: true,
      withdrawals,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: withdrawals.length
      }
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get withdrawal history'
    });
  }
});

/**
 * Get specific withdrawal details
 * GET /api/payments/withdrawals/:id
 */
router.get('/withdrawals/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    const withdrawal = await getWithdrawal(id);

    // Verify the withdrawal belongs to the requesting user
    if (withdrawal.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: 'You do not have permission to access this withdrawal'
      });
    }

    res.json({
      success: true,
      withdrawal
    });
  } catch (error) {
    console.error('Get withdrawal error:', error);

    if (error.message === 'Withdrawal not found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Withdrawal not found'
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get withdrawal details'
    });
  }
});

/**
 * Get withdrawal statistics for current user
 * GET /api/payments/withdrawals/stats
 */
router.get('/withdrawals-stats', authenticateJWT, async (req, res) => {
  try {
    const stats = await getWithdrawalStats(req.user.id);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get withdrawal stats error:', error);

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get withdrawal statistics'
    });
  }
});

export default router;
