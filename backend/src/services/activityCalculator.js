import pool from '../db/db.js';
import { createActivityMetric } from '../models/analytics.js';

/**
 * Wallet Activity Metrics Calculator
 * Processes raw transaction data into meaningful daily activity metrics
 */

/**
 * Calculate daily activity metrics for a specific wallet and date
 */
async function calculateDailyMetrics(walletId, targetDate) {
  try {
    const dateStr = targetDate instanceof Date ? 
      targetDate.toISOString().split('T')[0] : 
      targetDate;

    console.log(`Calculating daily metrics for wallet ${walletId} on ${dateStr}`);

    // Get all processed transactions for the wallet on the target date
    const transactionsResult = await pool.query(`
      SELECT 
        pt.*,
        DATE(pt.block_timestamp) as tx_date
      FROM processed_transactions pt
      WHERE pt.wallet_id = $1 
      AND DATE(pt.block_timestamp) = $2
      ORDER BY pt.block_timestamp ASC
    `, [walletId, dateStr]);

    const transactions = transactionsResult.rows;

    if (transactions.length === 0) {
      console.log(`No transactions found for wallet ${walletId} on ${dateStr}`);
      return null;
    }

    // Calculate basic metrics
    const metrics = {
      transaction_count: transactions.length,
      unique_days_active: 1, // This is for a single day
      total_volume_zatoshi: 0,
      total_fees_paid: 0,
      transfers_count: 0,
      swaps_count: 0,
      bridges_count: 0,
      shielded_count: 0,
      is_active: true,
      is_returning: false,
      sequence_complexity_score: 0
    };

    // Process each transaction
    let totalAbsoluteVolume = 0;
    const transactionTypes = new Set();
    const timeGaps = [];
    let previousTimestamp = null;

    transactions.forEach((tx, index) => {
      // Volume calculation (absolute value for activity measurement)
      const absValue = Math.abs(tx.value_zatoshi || 0);
      totalAbsoluteVolume += absValue;
      
      // Fee accumulation
      metrics.total_fees_paid += tx.fee_zatoshi || 0;

      // Transaction type counting
      switch (tx.tx_type) {
        case 'transfer':
          metrics.transfers_count++;
          break;
        case 'swap':
          metrics.swaps_count++;
          break;
        case 'bridge':
          metrics.bridges_count++;
          break;
        case 'shielded':
          metrics.shielded_count++;
          break;
      }

      transactionTypes.add(tx.tx_type);

      // Calculate time gaps between transactions
      if (previousTimestamp) {
        const gap = new Date(tx.block_timestamp) - new Date(previousTimestamp);
        timeGaps.push(gap / (1000 * 60)); // Convert to minutes
      }
      previousTimestamp = tx.block_timestamp;
    });

    metrics.total_volume_zatoshi = totalAbsoluteVolume;

    // Calculate sequence complexity score
    metrics.sequence_complexity_score = calculateSequenceComplexity(
      transactions, 
      transactionTypes, 
      timeGaps
    );

    // Determine if this is a returning user (has previous activity)
    const previousActivityResult = await pool.query(`
      SELECT COUNT(*) as prev_count
      FROM wallet_activity_metrics
      WHERE wallet_id = $1 
      AND activity_date < $2
      AND is_active = true
    `, [walletId, dateStr]);

    metrics.is_returning = parseInt(previousActivityResult.rows[0].prev_count) > 0;

    // Calculate days since wallet creation
    const walletResult = await pool.query(
      'SELECT created_at FROM wallets WHERE id = $1',
      [walletId]
    );

    if (walletResult.rows[0]) {
      const daysSinceCreation = Math.floor(
        (new Date(dateStr) - new Date(walletResult.rows[0].created_at)) / (1000 * 60 * 60 * 24)
      );
      metrics.days_since_creation = Math.max(0, daysSinceCreation);
    }

    console.log(`Calculated metrics for wallet ${walletId}:`, {
      transactions: metrics.transaction_count,
      volume: metrics.total_volume_zatoshi,
      complexity: metrics.sequence_complexity_score,
      is_returning: metrics.is_returning
    });

    return metrics;

  } catch (error) {
    console.error(`Error calculating daily metrics for wallet ${walletId}:`, error);
    throw error;
  }
}

/**
 * Calculate sequence complexity based on transaction patterns
 */
function calculateSequenceComplexity(transactions, transactionTypes, timeGaps) {
  let complexity = 0;

  // Base complexity from transaction count
  complexity += Math.min(transactions.length * 5, 30);

  // Complexity from transaction type diversity
  complexity += transactionTypes.size * 10;

  // Complexity from timing patterns
  if (timeGaps.length > 0) {
    const avgGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
    
    // Rapid transactions (< 5 minutes apart) increase complexity
    const rapidTransactions = timeGaps.filter(gap => gap < 5).length;
    complexity += rapidTransactions * 5;

    // Very spaced out transactions (> 60 minutes) suggest planned activity
    const spacedTransactions = timeGaps.filter(gap => gap > 60).length;
    complexity += spacedTransactions * 3;
  }

  // Complexity from shielded transactions
  const shieldedCount = transactions.filter(tx => tx.is_shielded).length;
  complexity += shieldedCount * 15;

  // Complexity from multi-party transactions
  const multiPartyCount = transactions.filter(tx => tx.tx_subtype === 'multi_party').length;
  complexity += multiPartyCount * 8;

  return Math.min(complexity, 100);
}

/**
 * Calculate and save daily metrics for a wallet
 */
async function processWalletDailyMetrics(walletId, targetDate) {
  try {
    const metrics = await calculateDailyMetrics(walletId, targetDate);
    
    if (!metrics) {
      return null; // No activity on this date
    }

    // Save the calculated metrics
    const savedMetrics = await createActivityMetric(walletId, {
      activity_date: targetDate,
      ...metrics
    });

    return savedMetrics;

  } catch (error) {
    console.error(`Error processing daily metrics for wallet ${walletId}:`, error);
    throw error;
  }
}

/**
 * Batch process daily metrics for multiple wallets
 */
async function batchProcessDailyMetrics(walletIds, targetDate) {
  const results = [];
  
  console.log(`Processing daily metrics for ${walletIds.length} wallets on ${targetDate}`);

  for (const walletId of walletIds) {
    try {
      const result = await processWalletDailyMetrics(walletId, targetDate);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.error(`Failed to process metrics for wallet ${walletId}:`, error.message);
    }
  }

  console.log(`Successfully processed metrics for ${results.length} wallets`);
  return results;
}

/**
 * Calculate weekly aggregated metrics for a wallet
 */
async function calculateWeeklyMetrics(walletId, weekStartDate) {
  try {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const result = await pool.query(`
      SELECT 
        COUNT(*) as active_days,
        SUM(transaction_count) as total_transactions,
        SUM(total_volume_zatoshi) as total_volume,
        SUM(total_fees_paid) as total_fees,
        SUM(transfers_count) as total_transfers,
        SUM(swaps_count) as total_swaps,
        SUM(bridges_count) as total_bridges,
        SUM(shielded_count) as total_shielded,
        AVG(sequence_complexity_score) as avg_complexity,
        COUNT(CASE WHEN is_returning THEN 1 END) as returning_days
      FROM wallet_activity_metrics
      WHERE wallet_id = $1
      AND activity_date BETWEEN $2 AND $3
      AND is_active = true
    `, [walletId, weekStartDate, weekEndDate]);

    return result.rows[0];

  } catch (error) {
    console.error(`Error calculating weekly metrics for wallet ${walletId}:`, error);
    throw error;
  }
}

/**
 * Calculate monthly aggregated metrics for a wallet
 */
async function calculateMonthlyMetrics(walletId, year, month) {
  try {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    const result = await pool.query(`
      SELECT 
        COUNT(*) as active_days,
        SUM(transaction_count) as total_transactions,
        SUM(total_volume_zatoshi) as total_volume,
        SUM(total_fees_paid) as total_fees,
        SUM(transfers_count) as total_transfers,
        SUM(swaps_count) as total_swaps,
        SUM(bridges_count) as total_bridges,
        SUM(shielded_count) as total_shielded,
        AVG(sequence_complexity_score) as avg_complexity,
        COUNT(CASE WHEN is_returning THEN 1 END) as returning_days,
        MAX(activity_date) as last_active_date,
        MIN(activity_date) as first_active_date
      FROM wallet_activity_metrics
      WHERE wallet_id = $1
      AND EXTRACT(YEAR FROM activity_date) = $2
      AND EXTRACT(MONTH FROM activity_date) = $3
      AND is_active = true
    `, [walletId, year, month]);

    return result.rows[0];

  } catch (error) {
    console.error(`Error calculating monthly metrics for wallet ${walletId}:`, error);
    throw error;
  }
}

/**
 * Get activity trend for a wallet over time
 */
async function getWalletActivityTrend(walletId, days = 30) {
  try {
    const result = await pool.query(`
      SELECT 
        activity_date,
        transaction_count,
        total_volume_zatoshi,
        sequence_complexity_score,
        is_active,
        is_returning
      FROM wallet_activity_metrics
      WHERE wallet_id = $1
      AND activity_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY activity_date ASC
    `, [walletId]);

    return result.rows;

  } catch (error) {
    console.error(`Error getting activity trend for wallet ${walletId}:`, error);
    throw error;
  }
}

/**
 * Process all unprocessed transactions into daily metrics
 */
async function processAllUnprocessedMetrics() {
  try {
    console.log('🔄 Processing all unprocessed transactions into daily metrics...');

    // Get all dates with processed transactions that don't have activity metrics
    const result = await pool.query(`
      SELECT DISTINCT 
        pt.wallet_id,
        DATE(pt.block_timestamp) as activity_date
      FROM processed_transactions pt
      LEFT JOIN wallet_activity_metrics wam ON (
        pt.wallet_id = wam.wallet_id AND 
        DATE(pt.block_timestamp) = wam.activity_date
      )
      WHERE wam.id IS NULL
      ORDER BY activity_date ASC, pt.wallet_id
    `);

    console.log(`Found ${result.rows.length} wallet-date combinations to process`);

    const processedResults = [];

    for (const row of result.rows) {
      try {
        const metrics = await processWalletDailyMetrics(row.wallet_id, row.activity_date);
        if (metrics) {
          processedResults.push(metrics);
        }
      } catch (error) {
        console.error(`Failed to process metrics for wallet ${row.wallet_id} on ${row.activity_date}:`, error.message);
      }
    }

    console.log(`✅ Successfully processed ${processedResults.length} daily metrics`);
    return processedResults;

  } catch (error) {
    console.error('❌ Error in processAllUnprocessedMetrics:', error);
    throw error;
  }
}

export {
  calculateDailyMetrics,
  processWalletDailyMetrics,
  batchProcessDailyMetrics,
  calculateWeeklyMetrics,
  calculateMonthlyMetrics,
  getWalletActivityTrend,
  processAllUnprocessedMetrics
};