import pool from '../db/db.js';
import { Pool as IndexerPool } from 'pg';
import { createActivityMetric, saveProcessedTransaction } from '../models/analytics.js';

// Create a separate pool for the indexer database
const indexerPool = new IndexerPool({
  host: process.env.INDEXER_DB_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.INDEXER_DB_PORT || process.env.DB_PORT || 5432,
  database: process.env.INDEXER_DB_NAME || process.env.DB_NAME || 'broadlypaywall',
  user: process.env.INDEXER_DB_USER || process.env.DB_USER || 'postgres',
  password: process.env.INDEXER_DB_PASS || process.env.DB_PASS || 'admin',
});

/**
 * Get all active wallets that need tracking
 */
async function getTrackedWallets() {
  const result = await pool.query(
    `SELECT w.id, w.address, w.type, w.project_id, w.created_at
     FROM wallets w
     WHERE w.is_active = true
     ORDER BY w.created_at DESC`
  );
  return result.rows;
}

/**
 * Get transactions for a specific address from the indexer database
 */
async function getAddressTransactions(address, sinceBlockHeight = 0) {
  try {
    // Query the indexer database for transactions involving this address
    const result = await indexerPool.query(
      `SELECT DISTINCT
        t.txid,
        t.block_height,
        t.timestamp,
        t.tx_type,
        t.is_shielded,
        t.fee,
        COALESCE(
          (SELECT SUM(o.value) FROM outputs o WHERE o.txid = t.txid AND o.address = $1),
          0
        ) as received_value,
        COALESCE(
          (SELECT SUM(i.value) FROM inputs i WHERE i.txid = t.txid AND i.address = $1),
          0
        ) as sent_value
       FROM transactions t
       LEFT JOIN outputs o ON t.txid = o.txid
       LEFT JOIN inputs i ON t.txid = i.txid
       WHERE (o.address = $1 OR i.address = $1)
       AND t.block_height > $2
       ORDER BY t.block_height DESC, t.timestamp DESC
       LIMIT 1000`,
      [address, sinceBlockHeight]
    );
    
    return result.rows;
  } catch (error) {
    console.error(`Error fetching transactions for address ${address}:`, error.message);
    return [];
  }
}

/**
 * Classify transaction type based on transaction data
 */
function classifyTransactionType(tx, address) {
  const received = parseFloat(tx.received_value || 0);
  const sent = parseFloat(tx.sent_value || 0);
  
  if (tx.tx_type === 'reward') {
    return { type: 'reward', subtype: 'mining' };
  }
  
  if (tx.is_shielded) {
    if (received > 0 && sent === 0) {
      return { type: 'shielded', subtype: 'pool_entry' };
    } else if (sent > 0 && received === 0) {
      return { type: 'shielded', subtype: 'pool_exit' };
    } else {
      return { type: 'shielded', subtype: 'internal' };
    }
  }
  
  if (received > 0 && sent === 0) {
    return { type: 'transfer', subtype: 'receive' };
  } else if (sent > 0 && received === 0) {
    return { type: 'transfer', subtype: 'send' };
  } else if (received > 0 && sent > 0) {
    return { type: 'transfer', subtype: 'self' };
  }
  
  return { type: 'transfer', subtype: 'unknown' };
}

/**
 * Process transactions for a wallet and update activity metrics
 */
async function processWalletTransactions(wallet) {
  try {
    // Get the last processed block height for this wallet
    const lastProcessedResult = await pool.query(
      `SELECT MAX(block_height) as last_block
       FROM processed_transactions
       WHERE wallet_id = $1`,
      [wallet.id]
    );
    
    const lastBlockHeight = lastProcessedResult.rows[0]?.last_block || 0;
    
    // Fetch new transactions from indexer
    const transactions = await getAddressTransactions(wallet.address, lastBlockHeight);
    
    if (transactions.length === 0) {
      return { wallet_id: wallet.id, processed: 0, message: 'No new transactions' };
    }
    
    console.log(`Processing ${transactions.length} transactions for wallet ${wallet.id} (${wallet.address})`);
    
    // Group transactions by date for activity metrics
    const dailyMetrics = {};
    let processedCount = 0;
    
    for (const tx of transactions) {
      try {
        const { type, subtype } = classifyTransactionType(tx, wallet.address);
        const received = parseFloat(tx.received_value || 0);
        const sent = parseFloat(tx.sent_value || 0);
        const netValue = received - sent;
        
        // Save processed transaction
        await saveProcessedTransaction({
          wallet_id: wallet.id,
          txid: tx.txid,
          block_height: tx.block_height,
          block_timestamp: tx.timestamp,
          tx_type: type,
          tx_subtype: subtype,
          value_zatoshi: Math.abs(netValue * 100000000), // Convert to zatoshi
          fee_zatoshi: (parseFloat(tx.fee || 0) * 100000000),
          is_shielded: tx.is_shielded || false,
          shielded_pool_entry: subtype === 'pool_entry',
          shielded_pool_exit: subtype === 'pool_exit'
        });
        
        // Aggregate daily metrics
        const activityDate = new Date(tx.timestamp).toISOString().split('T')[0];
        
        if (!dailyMetrics[activityDate]) {
          dailyMetrics[activityDate] = {
            transaction_count: 0,
            total_volume_zatoshi: 0,
            total_fees_paid: 0,
            transfers_count: 0,
            swaps_count: 0,
            bridges_count: 0,
            shielded_count: 0,
            is_active: false
          };
        }
        
        const metrics = dailyMetrics[activityDate];
        metrics.transaction_count++;
        metrics.total_volume_zatoshi += Math.abs(netValue * 100000000);
        metrics.total_fees_paid += (parseFloat(tx.fee || 0) * 100000000);
        metrics.is_active = true;
        
        // Count transaction types
        if (type === 'transfer') metrics.transfers_count++;
        if (type === 'swap') metrics.swaps_count++;
        if (type === 'bridge') metrics.bridges_count++;
        if (tx.is_shielded) metrics.shielded_count++;
        
        processedCount++;
      } catch (txError) {
        console.error(`Error processing transaction ${tx.txid}:`, txError.message);
        // Continue processing other transactions
      }
    }
    
    // Update activity metrics for each day
    for (const [activityDate, metrics] of Object.entries(dailyMetrics)) {
      try {
        await createActivityMetric(wallet.id, {
          activity_date: activityDate,
          ...metrics
        });
      } catch (metricsError) {
        console.error(`Error updating metrics for ${activityDate}:`, metricsError.message);
      }
    }
    
    return {
      wallet_id: wallet.id,
      address: wallet.address,
      processed: processedCount,
      days_updated: Object.keys(dailyMetrics).length,
      message: 'Successfully processed transactions'
    };
    
  } catch (error) {
    console.error(`Error processing wallet ${wallet.id}:`, error.message);
    throw error;
  }
}

/**
 * Sync all tracked wallets with the blockchain indexer
 */
async function syncAllWallets() {
  try {
    console.log('Starting wallet sync...');
    
    const wallets = await getTrackedWallets();
    console.log(`Found ${wallets.length} wallets to track`);
    
    const results = [];
    
    for (const wallet of wallets) {
      try {
        const result = await processWalletTransactions(wallet);
        results.push(result);
        
        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to process wallet ${wallet.id}:`, error.message);
        results.push({
          wallet_id: wallet.id,
          address: wallet.address,
          processed: 0,
          error: error.message
        });
      }
    }
    
    const totalProcessed = results.reduce((sum, r) => sum + (r.processed || 0), 0);
    
    console.log(`Wallet sync complete. Processed ${totalProcessed} transactions across ${wallets.length} wallets`);
    
    return {
      success: true,
      wallets_synced: wallets.length,
      total_transactions: totalProcessed,
      results
    };
    
  } catch (error) {
    console.error('Error in syncAllWallets:', error.message);
    throw error;
  }
}

/**
 * Get sync status for a specific wallet
 */
async function getWalletSyncStatus(walletId) {
  try {
    const result = await pool.query(
      `SELECT 
        w.id,
        w.address,
        w.type,
        w.is_active,
        COUNT(pt.id) as total_transactions,
        MAX(pt.block_height) as last_synced_block,
        MAX(pt.block_timestamp) as last_transaction_time,
        COUNT(DISTINCT DATE(pt.block_timestamp)) as active_days
       FROM wallets w
       LEFT JOIN processed_transactions pt ON w.id = pt.wallet_id
       WHERE w.id = $1
       GROUP BY w.id, w.address, w.type, w.is_active`,
      [walletId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Wallet not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error(`Error getting sync status for wallet ${walletId}:`, error.message);
    throw error;
  }
}

/**
 * Handle new block event from indexer
 */
async function handleNewBlock(blockHeight, blockData = {}) {
  try {
    console.log(`New block detected: ${blockHeight} (${blockData.transactionCount || 0} transactions)`);
    
    // Only sync if there are transactions in the block
    if (blockData.transactionCount > 0) {
      // Trigger a sync for all wallets
      const result = await syncAllWallets();
      return result;
    } else {
      console.log('No transactions in block, skipping sync');
      return { success: true, wallets_synced: 0, total_transactions: 0, skipped: true };
    }
  } catch (error) {
    console.error(`Error handling new block ${blockHeight}:`, error.message);
    throw error;
  }
}

/**
 * Handle transaction event from indexer
 */
async function handleNewTransaction(txData) {
  try {
    console.log(`New transaction detected: ${txData.txid}`);
    
    // Check if any tracked wallets are involved in this transaction
    const wallets = await getTrackedWallets();
    const affectedWallets = [];
    
    for (const wallet of wallets) {
      // Check if wallet address appears in transaction
      // This is a simplified check - in production you'd query the indexer
      if (txData.addresses && txData.addresses.includes(wallet.address)) {
        affectedWallets.push(wallet);
      }
    }
    
    if (affectedWallets.length > 0) {
      console.log(`Transaction affects ${affectedWallets.length} tracked wallets`);
      
      // Process only affected wallets
      for (const wallet of affectedWallets) {
        await processWalletTransactions(wallet);
      }
    }
    
    return { success: true, affected_wallets: affectedWallets.length };
  } catch (error) {
    console.error(`Error handling transaction ${txData.txid}:`, error.message);
    throw error;
  }
}

/**
 * Start continuous wallet tracking
 */
async function startWalletTracking(intervalMs = 60000) {
  console.log(`Starting wallet tracking service (interval: ${intervalMs}ms)`);
  
  // Initial sync
  try {
    await syncAllWallets();
  } catch (error) {
    console.error('Initial sync failed:', error.message);
  }
  
  // Set up periodic sync
  const intervalId = setInterval(async () => {
    try {
      await syncAllWallets();
    } catch (error) {
      console.error('Periodic sync failed:', error.message);
    }
  }, intervalMs);
  
  return intervalId;
}

/**
 * Stop wallet tracking
 */
function stopWalletTracking(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('Wallet tracking service stopped');
  }
}

export {
  getTrackedWallets,
  getAddressTransactions,
  processWalletTransactions,
  syncAllWallets,
  getWalletSyncStatus,
  handleNewBlock,
  handleNewTransaction,
  startWalletTracking,
  stopWalletTracking
};
