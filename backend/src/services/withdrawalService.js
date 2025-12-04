/**
 * Withdrawal Service
 * Handles withdrawal processing for user earnings
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import pool from '../db/db.js';
import { validateZcashAddress } from '../utils/zcashAddress.js';

/**
 * Platform withdrawal fee configuration
 * Fee is calculated as a percentage of the withdrawal amount
 */
const WITHDRAWAL_FEE_PERCENTAGE = 0.02; // 2% platform fee
const MIN_WITHDRAWAL_AMOUNT = 0.001; // Minimum 0.001 ZEC
const MAX_WITHDRAWAL_AMOUNT = 100; // Maximum 100 ZEC per withdrawal

/**
 * Calculate withdrawal fee and net amount
 * @param {number} amount_zec - Requested withdrawal amount
 * @returns {Object} - { fee_zec, net_zec }
 */
export function calculateWithdrawalFee(amount_zec) {
  const fee_zec = parseFloat((amount_zec * WITHDRAWAL_FEE_PERCENTAGE).toFixed(8));
  const net_zec = parseFloat((amount_zec - fee_zec).toFixed(8));
  
  return {
    fee_zec,
    net_zec
  };
}

/**
 * Validate withdrawal request
 * @param {string} userId - User UUID
 * @param {number} amount_zec - Requested withdrawal amount
 * @param {string} to_address - Destination Zcash address
 * @param {string} network - Network (mainnet or testnet)
 * @returns {Promise<Object>} - Validation result
 */
export async function validateWithdrawalRequest(userId, amount_zec, to_address, network = 'testnet') {
  const errors = [];

  // Validate amount
  if (!amount_zec || typeof amount_zec !== 'number' || amount_zec <= 0) {
    errors.push('Withdrawal amount must be a positive number');
  } else {
    if (amount_zec < MIN_WITHDRAWAL_AMOUNT) {
      errors.push(`Withdrawal amount must be at least ${MIN_WITHDRAWAL_AMOUNT} ZEC`);
    }
    if (amount_zec > MAX_WITHDRAWAL_AMOUNT) {
      errors.push(`Withdrawal amount cannot exceed ${MAX_WITHDRAWAL_AMOUNT} ZEC`);
    }
  }

  // Validate address format
  if (!to_address || typeof to_address !== 'string') {
    errors.push('Withdrawal address is required');
  } else {
    const addressValidation = validateZcashAddress(to_address, network);
    if (!addressValidation.valid) {
      errors.push(addressValidation.error || 'Invalid Zcash address format');
    }
  }

  // Check user balance
  const balanceResult = await pool.query(
    'SELECT balance_zec FROM users WHERE id = $1',
    [userId]
  );

  if (balanceResult.rows.length === 0) {
    errors.push('User not found');
  } else {
    const currentBalance = parseFloat(balanceResult.rows[0].balance_zec || 0);
    
    if (amount_zec > currentBalance) {
      errors.push(`Insufficient balance. Available: ${currentBalance} ZEC, Requested: ${amount_zec} ZEC`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    balance: balanceResult.rows.length > 0 ? parseFloat(balanceResult.rows[0].balance_zec || 0) : 0
  };
}

/**
 * Create a withdrawal request
 * @param {string} userId - User UUID
 * @param {number} amount_zec - Requested withdrawal amount
 * @param {string} to_address - Destination Zcash address
 * @param {string} network - Network (mainnet or testnet)
 * @returns {Promise<Object>} - Withdrawal details
 */
export async function createWithdrawal(userId, amount_zec, to_address, network = 'testnet') {
  // Validate withdrawal request
  const validation = await validateWithdrawalRequest(userId, amount_zec, to_address, network);
  
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  // Calculate fees
  const { fee_zec, net_zec } = calculateWithdrawalFee(amount_zec);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock user row for update
    const userResult = await client.query(
      'SELECT balance_zec FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const currentBalance = parseFloat(userResult.rows[0].balance_zec || 0);

    // Double-check balance (race condition protection)
    if (amount_zec > currentBalance) {
      throw new Error(`Insufficient balance. Available: ${currentBalance} ZEC`);
    }

    // Create withdrawal record
    const withdrawalResult = await client.query(
      `INSERT INTO withdrawals (
        user_id, amount_zec, fee_zec, net_zec, to_address, 
        status, requested_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING *`,
      [userId, amount_zec, fee_zec, net_zec, to_address]
    );

    // Deduct amount from user balance immediately (pending withdrawal)
    await client.query(
      `UPDATE users 
       SET balance_zec = balance_zec - $1,
           updated_at = NOW()
       WHERE id = $2`,
      [amount_zec, userId]
    );

    await client.query('COMMIT');

    const withdrawal = withdrawalResult.rows[0];

    return {
      withdrawal_id: withdrawal.id,
      user_id: withdrawal.user_id,
      amount_zec: parseFloat(withdrawal.amount_zec),
      fee_zec: parseFloat(withdrawal.fee_zec),
      net_zec: parseFloat(withdrawal.net_zec),
      to_address: withdrawal.to_address,
      status: withdrawal.status,
      requested_at: withdrawal.requested_at,
      previous_balance: currentBalance,
      new_balance: parseFloat((currentBalance - amount_zec).toFixed(8))
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Process a withdrawal (mark as processing and initiate blockchain transaction)
 * @param {string} withdrawalId - Withdrawal UUID
 * @returns {Promise<Object>} - Updated withdrawal details
 */
export async function processWithdrawal(withdrawalId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get withdrawal details
    const withdrawalResult = await client.query(
      'SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE',
      [withdrawalId]
    );

    if (withdrawalResult.rows.length === 0) {
      throw new Error('Withdrawal not found');
    }

    const withdrawal = withdrawalResult.rows[0];

    // Check if already processed
    if (withdrawal.status !== 'pending') {
      throw new Error(`Withdrawal is already ${withdrawal.status}`);
    }

    // Update status to processing
    await client.query(
      `UPDATE withdrawals 
       SET status = 'processing',
           updated_at = NOW()
       WHERE id = $1`,
      [withdrawalId]
    );

    await client.query('COMMIT');

    // In a real implementation, this would:
    // 1. Call Zcash RPC to create and send transaction
    // 2. Get transaction ID
    // 3. Update withdrawal with txid
    // For now, we'll return the withdrawal in processing state

    return {
      withdrawal_id: withdrawal.id,
      user_id: withdrawal.user_id,
      amount_zec: parseFloat(withdrawal.amount_zec),
      fee_zec: parseFloat(withdrawal.fee_zec),
      net_zec: parseFloat(withdrawal.net_zec),
      to_address: withdrawal.to_address,
      status: 'processing',
      requested_at: withdrawal.requested_at,
      message: 'Withdrawal is being processed. Transaction will be sent to the blockchain.'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Complete a withdrawal (mark as sent with transaction ID)
 * @param {string} withdrawalId - Withdrawal UUID
 * @param {string} txid - Blockchain transaction ID
 * @returns {Promise<Object>} - Completed withdrawal details
 */
export async function completeWithdrawal(withdrawalId, txid) {
  if (!txid || typeof txid !== 'string') {
    throw new Error('Transaction ID is required');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get withdrawal details
    const withdrawalResult = await client.query(
      'SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE',
      [withdrawalId]
    );

    if (withdrawalResult.rows.length === 0) {
      throw new Error('Withdrawal not found');
    }

    const withdrawal = withdrawalResult.rows[0];

    // Check if already completed
    if (withdrawal.status === 'sent') {
      throw new Error('Withdrawal is already completed');
    }

    if (withdrawal.status === 'failed') {
      throw new Error('Cannot complete a failed withdrawal');
    }

    // Update withdrawal status
    await client.query(
      `UPDATE withdrawals 
       SET status = 'sent',
           txid = $1,
           processed_at = NOW()
       WHERE id = $2`,
      [txid, withdrawalId]
    );

    await client.query('COMMIT');

    return {
      withdrawal_id: withdrawal.id,
      user_id: withdrawal.user_id,
      amount_zec: parseFloat(withdrawal.amount_zec),
      fee_zec: parseFloat(withdrawal.fee_zec),
      net_zec: parseFloat(withdrawal.net_zec),
      to_address: withdrawal.to_address,
      status: 'sent',
      txid: txid,
      requested_at: withdrawal.requested_at,
      processed_at: new Date(),
      message: 'Withdrawal completed successfully'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Fail a withdrawal (mark as failed and refund balance)
 * @param {string} withdrawalId - Withdrawal UUID
 * @param {string} reason - Failure reason
 * @returns {Promise<Object>} - Failed withdrawal details
 */
export async function failWithdrawal(withdrawalId, reason) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get withdrawal details
    const withdrawalResult = await client.query(
      'SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE',
      [withdrawalId]
    );

    if (withdrawalResult.rows.length === 0) {
      throw new Error('Withdrawal not found');
    }

    const withdrawal = withdrawalResult.rows[0];

    // Check if already completed or failed
    if (withdrawal.status === 'sent') {
      throw new Error('Cannot fail a completed withdrawal');
    }

    if (withdrawal.status === 'failed') {
      throw new Error('Withdrawal is already marked as failed');
    }

    // Update withdrawal status
    await client.query(
      `UPDATE withdrawals 
       SET status = 'failed',
           processed_at = NOW()
       WHERE id = $1`,
      [withdrawalId]
    );

    // Refund the amount to user balance
    await client.query(
      `UPDATE users 
       SET balance_zec = balance_zec + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [withdrawal.amount_zec, withdrawal.user_id]
    );

    await client.query('COMMIT');

    return {
      withdrawal_id: withdrawal.id,
      user_id: withdrawal.user_id,
      amount_zec: parseFloat(withdrawal.amount_zec),
      status: 'failed',
      reason: reason || 'Withdrawal processing failed',
      refunded: true,
      message: 'Withdrawal failed. Amount has been refunded to your balance.'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get withdrawal details
 * @param {string} withdrawalId - Withdrawal UUID
 * @returns {Promise<Object>} - Withdrawal details
 */
export async function getWithdrawal(withdrawalId) {
  const result = await pool.query(
    'SELECT * FROM withdrawals WHERE id = $1',
    [withdrawalId]
  );

  if (result.rows.length === 0) {
    throw new Error('Withdrawal not found');
  }

  const withdrawal = result.rows[0];

  return {
    withdrawal_id: withdrawal.id,
    user_id: withdrawal.user_id,
    amount_zec: parseFloat(withdrawal.amount_zec),
    fee_zec: parseFloat(withdrawal.fee_zec),
    net_zec: parseFloat(withdrawal.net_zec),
    to_address: withdrawal.to_address,
    status: withdrawal.status,
    txid: withdrawal.txid,
    requested_at: withdrawal.requested_at,
    processed_at: withdrawal.processed_at
  };
}

/**
 * Get user's withdrawal history
 * @param {string} userId - User UUID
 * @param {Object} options - Query options (limit, offset, status)
 * @returns {Promise<Array>} - List of withdrawals
 */
export async function getUserWithdrawals(userId, options = {}) {
  const {
    limit = 50,
    offset = 0,
    status = null
  } = options;

  let query = `
    SELECT * FROM withdrawals
    WHERE user_id = $1
  `;

  const params = [userId];

  if (status) {
    query += ` AND status = $${params.length + 1}`;
    params.push(status);
  }

  query += ` ORDER BY requested_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  return result.rows.map(row => ({
    withdrawal_id: row.id,
    amount_zec: parseFloat(row.amount_zec),
    fee_zec: parseFloat(row.fee_zec),
    net_zec: parseFloat(row.net_zec),
    to_address: row.to_address,
    status: row.status,
    txid: row.txid,
    requested_at: row.requested_at,
    processed_at: row.processed_at
  }));
}

/**
 * Get withdrawal statistics for a user
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} - Withdrawal statistics
 */
export async function getWithdrawalStats(userId) {
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total_withdrawals,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
      COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
      COUNT(*) FILTER (WHERE status = 'sent') as completed_count,
      COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
      COALESCE(SUM(amount_zec) FILTER (WHERE status = 'sent'), 0) as total_withdrawn_zec,
      COALESCE(SUM(fee_zec) FILTER (WHERE status = 'sent'), 0) as total_fees_zec,
      COALESCE(SUM(net_zec) FILTER (WHERE status = 'sent'), 0) as total_net_zec
     FROM withdrawals
     WHERE user_id = $1`,
    [userId]
  );

  const stats = result.rows[0];

  return {
    user_id: userId,
    total_withdrawals: parseInt(stats.total_withdrawals) || 0,
    pending_count: parseInt(stats.pending_count) || 0,
    processing_count: parseInt(stats.processing_count) || 0,
    completed_count: parseInt(stats.completed_count) || 0,
    failed_count: parseInt(stats.failed_count) || 0,
    total_withdrawn_zec: parseFloat(stats.total_withdrawn_zec) || 0,
    total_fees_zec: parseFloat(stats.total_fees_zec) || 0,
    total_net_zec: parseFloat(stats.total_net_zec) || 0
  };
}

export default {
  calculateWithdrawalFee,
  validateWithdrawalRequest,
  createWithdrawal,
  processWithdrawal,
  completeWithdrawal,
  failWithdrawal,
  getWithdrawal,
  getUserWithdrawals,
  getWithdrawalStats
};
