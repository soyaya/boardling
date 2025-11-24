import express from 'express';
import { pool } from '../config/appConfig.js';
import { sendMany, waitForOperation, validateAddress } from '../config/zcash.js';
import { calculateFee } from '../config/fees.js';
import { config } from '../config/appConfig.js';
import { optionalApiKey, authenticateApiKey, requirePermission } from '../middleware/auth.js';

const router = express.Router();

/**
 * Create withdrawal request
 * POST /api/withdraw/create
 */
router.post('/create', optionalApiKey, async (req, res) => {
  const { user_id, to_address, amount_zec } = req.body;

  // Validation
  if (!user_id || !to_address || !amount_zec) {
    return res.status(400).json({ 
      error: 'Missing required fields: user_id, to_address, amount_zec' 
    });
  }

  if (typeof amount_zec !== 'number' || amount_zec <= 0) {
    return res.status(400).json({ 
      error: 'amount_zec must be a positive number' 
    });
  }

  try {
    // Validate user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate Zcash address
    const addressValidation = await validateAddress(to_address);
    if (!addressValidation.isvalid) {
      return res.status(400).json({ error: 'Invalid Zcash address' });
    }

    // Calculate fees
    const feeCalculation = calculateFee(amount_zec);

    // Check user balance
    const balanceResult = await pool.query(
      'SELECT available_balance_zec FROM user_balances WHERE id = $1',
      [user_id]
    );

    if (balanceResult.rows.length === 0 || 
        parseFloat(balanceResult.rows[0].available_balance_zec) < amount_zec) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        available_balance: balanceResult.rows[0]?.available_balance_zec || 0,
        requested_amount: amount_zec
      });
    }

    // Create withdrawal request
    const result = await pool.query(
      `INSERT INTO withdrawals (user_id, amount_zec, fee_zec, net_zec, to_address, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [user_id, feeCalculation.amount, feeCalculation.fee, feeCalculation.net, to_address]
    );

    const withdrawal = result.rows[0];

    res.status(201).json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        user_id: withdrawal.user_id,
        amount_zec: parseFloat(withdrawal.amount_zec),
        fee_zec: parseFloat(withdrawal.fee_zec),
        net_zec: parseFloat(withdrawal.net_zec),
        to_address: withdrawal.to_address,
        status: withdrawal.status,
        requested_at: withdrawal.requested_at
      },
      fee_breakdown: feeCalculation.feeBreakdown
    });

  } catch (error) {
    console.error('Withdrawal creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create withdrawal',
      details: error.message 
    });
  }
});

/**
 * Process withdrawal (admin endpoint)
 * POST /api/withdraw/process/:id
 */
router.post('/process/:id', authenticateApiKey, requirePermission('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    // Get and lock withdrawal
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const wResult = await client.query(
        'SELECT * FROM withdrawals WHERE id = $1 AND status = $2 FOR UPDATE',
        [id, 'pending']
      );

      const withdrawal = wResult.rows[0];
      if (!withdrawal) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Withdrawal not found or already processed' 
        });
      }

      // Mark as processing
      await client.query(
        "UPDATE withdrawals SET status='processing' WHERE id=$1",
        [id]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Build recipients array
    const recipients = [
      {
        address: withdrawal.to_address,
        amount: parseFloat(withdrawal.net_zec),
      }
    ];

    // Add platform treasury fee if configured
    if (config.platformTreasuryAddress) {
      recipients.push({
        address: config.platformTreasuryAddress,
        amount: parseFloat(withdrawal.fee_zec),
        memo: withdrawal.to_address.startsWith('z') 
          ? Buffer.from(`Fee from withdrawal ${withdrawal.id} | User ${withdrawal.user_id}`, 'utf8').toString('hex')
          : undefined,
      });
    }

    // Send transaction
    const opid = await sendMany(recipients, 1, 0.0001);

    // Wait for completion
    const status = await waitForOperation(opid);

    if (status.status === 'success') {
      const txid = status.result?.txid || status.txid;
      
      await pool.query(
        `UPDATE withdrawals 
         SET status='sent', txid=$1, processed_at=NOW() 
         WHERE id=$2`,
        [txid, id]
      );

      console.log(`Withdrawal ${id} completed: ${withdrawal.net_zec} ZEC sent to ${withdrawal.to_address}`);
      if (config.platformTreasuryAddress) {
        console.log(`Fee ${withdrawal.fee_zec} ZEC sent to treasury: ${config.platformTreasuryAddress}`);
      }

      res.json({
        success: true,
        txid,
        user_received: parseFloat(withdrawal.net_zec),
        platform_fee: parseFloat(withdrawal.fee_zec),
        treasury_address: config.platformTreasuryAddress
      });

    } else {
      await pool.query("UPDATE withdrawals SET status='failed' WHERE id=$1", [id]);
      
      res.status(500).json({ 
        error: 'Transaction failed', 
        details: status.error || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Withdrawal processing error:', error);
    
    // Mark as failed
    await pool.query("UPDATE withdrawals SET status='failed' WHERE id=$1", [id]);
    
    res.status(500).json({ 
      error: 'Failed to process withdrawal',
      details: error.message 
    });
  }
});

/**
 * Get withdrawal details
 * GET /api/withdraw/:id
 */
router.get('/:id', optionalApiKey, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT w.*, u.email, u.name 
       FROM withdrawals w 
       JOIN users u ON w.user_id = u.id 
       WHERE w.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const withdrawal = result.rows[0];
    res.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        user_id: withdrawal.user_id,
        user_email: withdrawal.email,
        user_name: withdrawal.name,
        amount_zec: parseFloat(withdrawal.amount_zec),
        fee_zec: parseFloat(withdrawal.fee_zec),
        net_zec: parseFloat(withdrawal.net_zec),
        to_address: withdrawal.to_address,
        status: withdrawal.status,
        txid: withdrawal.txid,
        requested_at: withdrawal.requested_at,
        processed_at: withdrawal.processed_at
      }
    });

  } catch (error) {
    console.error('Get withdrawal error:', error);
    res.status(500).json({ 
      error: 'Failed to get withdrawal',
      details: error.message 
    });
  }
});

/**
 * List user withdrawals
 * GET /api/withdraw/user/:user_id
 */
router.get('/user/:user_id', optionalApiKey, async (req, res) => {
  const { user_id } = req.params;
  const { status, limit = 50, offset = 0 } = req.query;

  try {
    let query = 'SELECT * FROM withdrawals WHERE user_id = $1';
    const params = [user_id];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${++paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY requested_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      withdrawals: result.rows.map(withdrawal => ({
        id: withdrawal.id,
        amount_zec: parseFloat(withdrawal.amount_zec),
        fee_zec: parseFloat(withdrawal.fee_zec),
        net_zec: parseFloat(withdrawal.net_zec),
        to_address: withdrawal.to_address,
        status: withdrawal.status,
        txid: withdrawal.txid,
        requested_at: withdrawal.requested_at,
        processed_at: withdrawal.processed_at
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });

  } catch (error) {
    console.error('List withdrawals error:', error);
    res.status(500).json({ 
      error: 'Failed to list withdrawals',
      details: error.message 
    });
  }
});

/**
 * Get fee estimate
 * POST /api/withdraw/fee-estimate
 */
router.post('/fee-estimate', optionalApiKey, (req, res) => {
  const { amount_zec } = req.body;

  if (!amount_zec || typeof amount_zec !== 'number' || amount_zec <= 0) {
    return res.status(400).json({ 
      error: 'amount_zec must be a positive number' 
    });
  }

  try {
    const feeCalculation = calculateFee(amount_zec);
    res.json({
      success: true,
      ...feeCalculation
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

export default router;