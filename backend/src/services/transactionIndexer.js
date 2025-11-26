import pool from '../db/db.js';
import { processRPCTransactions } from './transactionProcessor.js';

/**
 * Enhanced transaction indexer that saves RPC data and processes for analytics
 */

/**
 * Save a complete transaction with inputs and outputs
 */
export async function saveCompleteTransaction(rawTx, block) {
  try {
    // Parse inputs and outputs
    const inputs = (rawTx.vin || []).map((vin, idx) => ({
      index: idx,
      prev_txid: vin.txid || null,
      prev_index: vin.vout || null,
      address: vin.address || null,
      value: vin.value || 0,
      script_sig: vin.scriptSig ? JSON.stringify(vin.scriptSig) : null
    }));

    const outputs = (rawTx.vout || []).map((vout, idx) => ({
      index: idx,
      address: vout.scriptPubKey?.addresses?.[0] || vout.address || null,
      value: vout.value ? Math.round(vout.value * 100000000) : 0, // Convert to zatoshi
      script_pubkey: vout.scriptPubKey ? JSON.stringify(vout.scriptPubKey) : null
    }));

    // Calculate values
    const valueIn = inputs.reduce((sum, input) => sum + (input.value || 0), 0);
    const valueOut = outputs.reduce((sum, output) => sum + (output.value || 0), 0);
    const fee = Math.max(0, valueIn - valueOut);

    // Save using the database function
    const result = await pool.query(
      'SELECT save_complete_transaction($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
      [
        rawTx.txid,
        block.hash,
        block.height,
        new Date(block.time * 1000),
        rawTx.size || 0,
        valueOut,
        valueIn,
        fee,
        rawTx.type || 'normal',
        JSON.stringify(rawTx),
        JSON.stringify(inputs),
        JSON.stringify(outputs)
      ]
    );

    return result.rows[0].save_complete_transaction;
  } catch (error) {
    console.error(`Error saving transaction ${rawTx.txid}:`, error.message);
    throw error;
  }
}

/**
 * Batch save multiple transactions
 */
export async function batchSaveTransactions(transactions, blockData) {
  const savedTransactions = [];
  
  for (const rawTx of transactions) {
    try {
      const txId = await saveCompleteTransaction(rawTx, blockData);
      savedTransactions.push({ txId, txid: rawTx.txid });
    } catch (error) {
      console.error(`Failed to save transaction ${rawTx.txid}:`, error.message);
    }
  }
  
  return savedTransactions;
}

/**
 * Process unprocessed transactions for analytics
 */
export async function processUnprocessedTransactions() {
  try {
    console.log('🔄 Processing unprocessed transactions for analytics...');
    
    // Get unprocessed transactions
    const result = await pool.query(`
      SELECT t.*, 
             array_agg(
               json_build_object(
                 'index', ti.input_index,
                 'prev_txid', ti.prev_txid,
                 'prev_index', ti.prev_output_index,
                 'address', ti.address,
                 'value', ti.value
               ) ORDER BY ti.input_index
             ) as inputs,
             array_agg(
               json_build_object(
                 'index', to2.output_index,
                 'address', to2.address,
                 'value', to2.value
               ) ORDER BY to2.output_index
             ) as outputs
      FROM transactions t
      LEFT JOIN transaction_inputs ti ON t.txid = ti.txid
      LEFT JOIN transaction_outputs to2 ON t.txid = to2.txid
      WHERE t.processed_for_analytics = false
      GROUP BY t.id, t.txid, t.block_hash, t.block_height, t.timestamp, 
               t.size, t.value_out, t.value_in, t.fee, t.tx_type, t.raw_data
      ORDER BY t.block_height ASC, t.timestamp ASC
      LIMIT 1000
    `);

    if (result.rows.length === 0) {
      console.log('✅ No unprocessed transactions found');
      return [];
    }

    console.log(`📊 Found ${result.rows.length} unprocessed transactions`);

    const processedResults = [];

    for (const txData of result.rows) {
      try {
        // Create block data object
        const blockData = {
          hash: txData.block_hash,
          height: txData.block_height,
          time: Math.floor(new Date(txData.timestamp).getTime() / 1000)
        };

        // Create raw transaction object
        const rawTx = {
          txid: txData.txid,
          size: txData.size,
          fee: txData.fee,
          type: txData.tx_type,
          valueIn: txData.value_in,
          valueOut: txData.value_out,
          vin: txData.inputs || [],
          vout: txData.outputs || []
        };

        // Process for analytics
        const analyticsResults = await processRPCTransactions([rawTx], blockData);
        
        // Mark as processed
        await pool.query(
          'UPDATE transactions SET processed_for_analytics = true WHERE txid = $1',
          [txData.txid]
        );

        processedResults.push({
          txid: txData.txid,
          analytics_results: analyticsResults
        });

      } catch (error) {
        console.error(`Error processing transaction ${txData.txid} for analytics:`, error.message);
      }
    }

    console.log(`✅ Successfully processed ${processedResults.length} transactions for analytics`);
    return processedResults;

  } catch (error) {
    console.error('❌ Error in processUnprocessedTransactions:', error);
    throw error;
  }
}

/**
 * Get transaction processing statistics
 */
export async function getTransactionStats() {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_transactions,
      COUNT(CASE WHEN processed_for_analytics THEN 1 END) as processed_transactions,
      COUNT(CASE WHEN NOT processed_for_analytics THEN 1 END) as unprocessed_transactions,
      MIN(timestamp) as earliest_transaction,
      MAX(timestamp) as latest_transaction
    FROM transactions
  `);

  return result.rows[0];
}

/**
 * Reprocess transactions for analytics (useful for testing or after algorithm changes)
 */
export async function reprocessTransactionsForAnalytics(limit = 100) {
  try {
    console.log(`🔄 Reprocessing up to ${limit} transactions for analytics...`);
    
    // Mark transactions as unprocessed
    await pool.query(`
      UPDATE transactions 
      SET processed_for_analytics = false 
      WHERE id IN (
        SELECT id FROM transactions 
        ORDER BY timestamp DESC 
        LIMIT $1
      )
    `, [limit]);

    // Process them
    return await processUnprocessedTransactions();
    
  } catch (error) {
    console.error('❌ Error in reprocessTransactionsForAnalytics:', error);
    throw error;
  }
}

export {
  saveCompleteTransaction,
  batchSaveTransactions,
  processUnprocessedTransactions,
  getTransactionStats,
  reprocessTransactionsForAnalytics
};