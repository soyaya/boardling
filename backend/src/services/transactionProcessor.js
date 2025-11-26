import { parseTransaction } from '../../indexer/parser/txParser.js';
import { saveProcessedTransaction, createActivityMetric } from '../models/analytics.js';
import pool from '../db/db.js';

// Enhanced transaction types for better classification
const TRANSACTION_TYPES = {
  TRANSFER: 'transfer',
  SWAP: 'swap', 
  BRIDGE: 'bridge',
  SHIELDED: 'shielded',
  CONTRACT: 'contract',
  MINT: 'mint',
  BURN: 'burn'
};

const TRANSACTION_SUBTYPES = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing', 
  SELF: 'self',
  MULTI_PARTY: 'multi_party'
};

const COUNTERPARTY_TYPES = {
  EXCHANGE: 'exchange',
  DEFI: 'defi',
  WALLET: 'wallet',
  CONTRACT: 'contract',
  UNKNOWN: 'unknown'
};

// Known exchange and DeFi addresses (would be populated from a database in production)
const KNOWN_ADDRESSES = {
  exchanges: new Set([
    // Add known exchange addresses here
  ]),
  defi: new Set([
    // Add known DeFi protocol addresses here  
  ]),
  bridges: new Set([
    // Add known bridge addresses here
  ])
};

// =====================================================
// ENHANCED TRANSACTION PROCESSING FOR ANALYTICS
// =====================================================

/**
 * Enhanced transaction parser that extends the basic parser
 * with behavioral metadata for analytics
 */
function parseTransactionForAnalytics(rawTx, block, walletAddress) {
  // Use existing parser as base
  const { tx, inputs, outputs } = parseTransaction(rawTx, block);
  
  // Enhanced classification
  const counterpartyAddress = findCounterpartyAddress(inputs, outputs, walletAddress);
  
  const enhancedTx = {
    ...tx,
    // Determine transaction type based on patterns
    tx_type: classifyTransactionType(rawTx, inputs, outputs),
    tx_subtype: classifyTransactionSubtype(rawTx, inputs, outputs, walletAddress),
    
    // Value analysis
    value_zatoshi: calculateWalletValue(inputs, outputs, walletAddress),
    fee_zatoshi: tx.fee || 0,
    
    // Behavioral context
    counterparty_address: counterpartyAddress,
    counterparty_type: classifyCounterpartyType(counterpartyAddress),
    
    // Privacy analysis
    is_shielded: isShieldedTransaction(inputs, outputs),
    shielded_pool_entry: isShieldedPoolEntry(inputs, outputs, walletAddress),
    shielded_pool_exit: isShieldedPoolExit(inputs, outputs, walletAddress),
    
    // Additional metadata
    input_count: inputs.length,
    output_count: outputs.length,
    complexity_score: calculateTransactionComplexity(inputs, outputs, rawTx)
  };
  
  return { enhancedTx, inputs, outputs };
}

/**
 * Classify transaction type based on patterns
 */
function classifyTransactionType(rawTx, inputs, outputs) {
  // Check for shielded transactions first
  if (hasShieldedInputsOrOutputs(inputs, outputs)) {
    return TRANSACTION_TYPES.SHIELDED;
  }
  
  // Check for contract interactions
  if (rawTx.type === 'contract' || hasContractPattern(outputs)) {
    return TRANSACTION_TYPES.CONTRACT;
  }
  
  // Check for mint/burn patterns (zero-value inputs/outputs)
  if (hasMintPattern(inputs, outputs)) {
    return TRANSACTION_TYPES.MINT;
  }
  
  if (hasBurnPattern(inputs, outputs)) {
    return TRANSACTION_TYPES.BURN;
  }
  
  // Check for bridge patterns (known bridge addresses or specific patterns)
  if (hasBridgePattern(outputs)) {
    return TRANSACTION_TYPES.BRIDGE;
  }
  
  // Check for swap patterns (DEX interactions or value ratios)
  if (hasSwapPattern(inputs, outputs)) {
    return TRANSACTION_TYPES.SWAP;
  }
  
  // Default to transfer
  return TRANSACTION_TYPES.TRANSFER;
}

/**
 * Classify transaction subtype (incoming, outgoing, self, multi_party)
 */
function classifyTransactionSubtype(rawTx, inputs, outputs, walletAddress) {
  const walletInputs = inputs.filter(input => input.address === walletAddress);
  const walletOutputs = outputs.filter(output => output.address === walletAddress);
  
  const hasWalletInput = walletInputs.length > 0;
  const hasWalletOutput = walletOutputs.length > 0;
  
  if (hasWalletInput && hasWalletOutput) {
    // Check if it's a self-transaction (only wallet address involved)
    const allAddresses = new Set([
      ...inputs.map(i => i.address).filter(addr => addr),
      ...outputs.map(o => o.address).filter(addr => addr)
    ]);
    
    if (allAddresses.size === 1 && allAddresses.has(walletAddress)) {
      return TRANSACTION_SUBTYPES.SELF;
    }
    return TRANSACTION_SUBTYPES.MULTI_PARTY;
  }
  
  if (hasWalletInput && !hasWalletOutput) {
    return TRANSACTION_SUBTYPES.OUTGOING;
  }
  
  if (!hasWalletInput && hasWalletOutput) {
    return TRANSACTION_SUBTYPES.INCOMING;
  }
  
  return 'unknown';
}

/**
 * Calculate the net value change for the wallet
 */
function calculateWalletValue(inputs, outputs, walletAddress) {
  const inputValue = inputs
    .filter(input => input.address === walletAddress)
    .reduce((sum, input) => sum + (input.value || 0), 0);
    
  const outputValue = outputs
    .filter(output => output.address === walletAddress)
    .reduce((sum, output) => sum + (output.value || 0), 0);
    
  return outputValue - inputValue; // Positive = received, Negative = sent
}

/**
 * Find the primary counterparty address and classify its type
 */
function findCounterpartyAddress(inputs, outputs, walletAddress) {
  // Find addresses that are not the wallet address
  const otherAddresses = [
    ...inputs.map(i => i.address),
    ...outputs.map(o => o.address)
  ].filter(addr => addr && addr !== walletAddress);
  
  if (otherAddresses.length === 0) {
    return null;
  }
  
  // Return the most frequent address, or first if all equal
  const addressCounts = {};
  otherAddresses.forEach(addr => {
    addressCounts[addr] = (addressCounts[addr] || 0) + 1;
  });
  
  return Object.keys(addressCounts).reduce((a, b) => 
    addressCounts[a] > addressCounts[b] ? a : b
  );
}

/**
 * Classify counterparty type based on known addresses and patterns
 */
function classifyCounterpartyType(address) {
  if (!address) {
    return COUNTERPARTY_TYPES.UNKNOWN;
  }
  
  // Check known address lists
  if (KNOWN_ADDRESSES.exchanges.has(address)) {
    return COUNTERPARTY_TYPES.EXCHANGE;
  }
  
  if (KNOWN_ADDRESSES.defi.has(address)) {
    return COUNTERPARTY_TYPES.DEFI;
  }
  
  if (KNOWN_ADDRESSES.bridges.has(address)) {
    return COUNTERPARTY_TYPES.CONTRACT;
  }
  
  // Pattern-based classification
  if (address.length > 50) {
    // Longer addresses might be contracts
    return COUNTERPARTY_TYPES.CONTRACT;
  }
  
  // Default to wallet
  return COUNTERPARTY_TYPES.WALLET;
}

/**
 * Check if transaction involves shielded inputs or outputs
 */
function hasShieldedInputsOrOutputs(inputs, outputs) {
  // Zcash shielded addresses start with 'z' or 'u'
  const isShieldedAddress = (addr) => addr && (addr.startsWith('z') || addr.startsWith('u'));
  
  return inputs.some(input => isShieldedAddress(input.address)) ||
         outputs.some(output => isShieldedAddress(output.address));
}

/**
 * Check if this is a shielded pool entry (transparent to shielded)
 */
function isShieldedPoolEntry(inputs, outputs, walletAddress) {
  const isTransparent = (addr) => addr && addr.startsWith('t');
  const isShielded = (addr) => addr && (addr.startsWith('z') || addr.startsWith('u'));
  
  const hasTransparentInput = inputs.some(input => 
    input.address === walletAddress && isTransparent(input.address)
  );
  
  const hasShieldedOutput = outputs.some(output => isShielded(output.address));
  
  return hasTransparentInput && hasShieldedOutput;
}

/**
 * Check if this is a shielded pool exit (shielded to transparent)
 */
function isShieldedPoolExit(inputs, outputs, walletAddress) {
  const isTransparent = (addr) => addr && addr.startsWith('t');
  const isShielded = (addr) => addr && (addr.startsWith('z') || addr.startsWith('u'));
  
  const hasShieldedInput = inputs.some(input => isShielded(input.address));
  
  const hasTransparentOutput = outputs.some(output => 
    output.address === walletAddress && isTransparent(output.address)
  );
  
  return hasShieldedInput && hasTransparentOutput;
}

/**
 * Check if transaction is fully shielded
 */
function isShieldedTransaction(inputs, outputs) {
  return hasShieldedInputsOrOutputs(inputs, outputs);
}

/**
 * Check for contract interaction patterns
 */
function hasContractPattern(outputs) {
  // This would need to be enhanced with known contract addresses
  // For now, check for specific patterns that indicate contract calls
  return outputs.some(output => 
    output.value === 0 || // Zero-value outputs often indicate contract calls
    (output.address && output.address.length > 50) // Longer addresses might be contracts
  );
}

/**
 * Check for bridge transaction patterns
 */
function hasBridgePattern(outputs) {
  // This would need known bridge addresses
  // For now, check for patterns like multiple small outputs
  return outputs.length > 3 && outputs.some(output => output.value < 1000000); // < 0.01 ZEC
}

/**
 * Check for swap transaction patterns
 */
function hasSwapPattern(inputs, outputs) {
  // Pattern 1: Single input, two outputs (one change, one swap result)
  if (inputs.length === 1 && outputs.length === 2) {
    const totalInput = inputs.reduce((sum, input) => sum + (input.value || 0), 0);
    const totalOutput = outputs.reduce((sum, output) => sum + (output.value || 0), 0);
    
    // Check if there's a significant value difference (swap fee)
    const valueDiff = Math.abs(totalInput - totalOutput);
    return valueDiff > 0 && valueDiff < totalInput * 0.05; // Less than 5% difference
  }
  
  // Pattern 2: Multiple inputs/outputs with known DEX addresses
  const allAddresses = [
    ...inputs.map(i => i.address),
    ...outputs.map(o => o.address)
  ].filter(addr => addr);
  
  return allAddresses.some(addr => KNOWN_ADDRESSES.defi.has(addr));
}

/**
 * Check for mint transaction patterns
 */
function hasMintPattern(inputs, outputs) {
  // Mint typically has no inputs or very small inputs, and creates new value
  const totalInputValue = inputs.reduce((sum, input) => sum + (input.value || 0), 0);
  const totalOutputValue = outputs.reduce((sum, output) => sum + (output.value || 0), 0);
  
  return totalInputValue === 0 || (totalOutputValue > totalInputValue * 2);
}

/**
 * Check for burn transaction patterns  
 */
function hasBurnPattern(inputs, outputs) {
  // Burn typically has inputs but no outputs or very small outputs
  const totalInputValue = inputs.reduce((sum, input) => sum + (input.value || 0), 0);
  const totalOutputValue = outputs.reduce((sum, output) => sum + (output.value || 0), 0);
  
  return totalInputValue > 0 && (totalOutputValue === 0 || totalOutputValue < totalInputValue * 0.1);
}

// =====================================================
// TRANSACTION PROCESSING PIPELINE
// =====================================================

/**
 * Process a transaction for a specific wallet and update analytics
 */
async function processTransactionForWallet(rawTx, block, walletId, walletAddress) {
  try {
    // Parse transaction with analytics enhancements
    const { enhancedTx } = parseTransactionForAnalytics(rawTx, block, walletAddress);
    
    // Save processed transaction
    const processedTx = await saveProcessedTransaction({
      wallet_id: walletId,
      txid: enhancedTx.txid,
      block_height: enhancedTx.block_height,
      block_timestamp: enhancedTx.timestamp,
      tx_type: enhancedTx.tx_type,
      tx_subtype: enhancedTx.tx_subtype,
      value_zatoshi: enhancedTx.value_zatoshi,
      fee_zatoshi: enhancedTx.fee_zatoshi,
      counterparty_address: enhancedTx.counterparty_address,
      counterparty_type: enhancedTx.counterparty_type,
      is_shielded: enhancedTx.is_shielded,
      shielded_pool_entry: enhancedTx.shielded_pool_entry,
      shielded_pool_exit: enhancedTx.shielded_pool_exit
    });
    
    // Update daily activity metrics
    await updateDailyActivityMetrics(walletId, enhancedTx);
    
    return processedTx;
  } catch (error) {
    console.error(`Error processing transaction ${rawTx.txid} for wallet ${walletId}:`, error);
    throw error;
  }
}

/**
 * Update daily activity metrics based on processed transaction
 */
async function updateDailyActivityMetrics(walletId, transaction) {
  const activityDate = transaction.timestamp.toISOString().split('T')[0];
  
  // Get existing metrics for the day
  const existingResult = await pool.query(
    'SELECT * FROM wallet_activity_metrics WHERE wallet_id = $1 AND activity_date = $2',
    [walletId, activityDate]
  );
  
  let metrics = existingResult.rows[0] || {
    transaction_count: 0,
    total_volume_zatoshi: 0,
    total_fees_paid: 0,
    transfers_count: 0,
    swaps_count: 0,
    bridges_count: 0,
    shielded_count: 0,
    is_active: false,
    sequence_complexity_score: 0
  };
  
  // Update metrics based on transaction
  metrics.transaction_count += 1;
  metrics.total_volume_zatoshi += Math.abs(transaction.value_zatoshi);
  metrics.total_fees_paid += transaction.fee_zatoshi;
  metrics.is_active = true;
  
  // Update transaction type counts
  switch (transaction.tx_type) {
    case 'transfer':
      metrics.transfers_count += 1;
      break;
    case 'swap':
      metrics.swaps_count += 1;
      break;
    case 'bridge':
      metrics.bridges_count += 1;
      break;
    case 'shielded':
      metrics.shielded_count += 1;
      break;
  }
  
  // Calculate complexity score (simple heuristic)
  const typeCount = [
    metrics.transfers_count > 0 ? 1 : 0,
    metrics.swaps_count > 0 ? 1 : 0,
    metrics.bridges_count > 0 ? 1 : 0,
    metrics.shielded_count > 0 ? 1 : 0
  ].reduce((a, b) => a + b, 0);
  
  metrics.sequence_complexity_score = typeCount * 25; // 0-100 scale
  
  // Save updated metrics
  await createActivityMetric(walletId, {
    activity_date: activityDate,
    ...metrics
  });
}

/**
 * Batch process transactions for multiple wallets
 */
async function batchProcessTransactions(transactions, walletAddressMap) {
  const results = [];
  
  for (const { rawTx, block } of transactions) {
    // Find wallets that are involved in this transaction
    const involvedWallets = findInvolvedWallets(rawTx, walletAddressMap);
    
    for (const { walletId, address } of involvedWallets) {
      try {
        const result = await processTransactionForWallet(rawTx, block, walletId, address);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process transaction ${rawTx.txid} for wallet ${walletId}:`, error);
      }
    }
  }
  
  return results;
}

/**
 * Find wallets involved in a transaction
 */
function findInvolvedWallets(rawTx, walletAddressMap) {
  const involvedWallets = [];
  const { inputs, outputs } = parseTransaction(rawTx, {});
  
  // Check inputs
  inputs.forEach(input => {
    if (input.address && walletAddressMap.has(input.address)) {
      involvedWallets.push({
        walletId: walletAddressMap.get(input.address),
        address: input.address
      });
    }
  });
  
  // Check outputs
  outputs.forEach(output => {
    if (output.address && walletAddressMap.has(output.address)) {
      involvedWallets.push({
        walletId: walletAddressMap.get(output.address),
        address: output.address
      });
    }
  });
  
  // Remove duplicates
  const uniqueWallets = new Map();
  involvedWallets.forEach(wallet => {
    uniqueWallets.set(wallet.walletId, wallet);
  });
  
  return Array.from(uniqueWallets.values());
}

/**
 * Calculate transaction complexity score based on various factors
 */
function calculateTransactionComplexity(inputs, outputs, rawTx) {
  let complexity = 0;
  
  // Base complexity from input/output count
  complexity += Math.min(inputs.length * 5, 25);
  complexity += Math.min(outputs.length * 5, 25);
  
  // Shielded transaction complexity
  if (hasShieldedInputsOrOutputs(inputs, outputs)) {
    complexity += 20;
  }
  
  // Multi-party transaction complexity
  const uniqueAddresses = new Set([
    ...inputs.map(i => i.address),
    ...outputs.map(o => o.address)
  ].filter(addr => addr));
  
  if (uniqueAddresses.size > 2) {
    complexity += Math.min((uniqueAddresses.size - 2) * 10, 30);
  }
  
  return Math.min(complexity, 100);
}

/**
 * Create a wallet address map for efficient lookup
 */
async function createWalletAddressMap() {
  const result = await pool.query(`
    SELECT w.id, w.address 
    FROM wallets w 
    WHERE w.is_active = true
  `);
  
  const addressMap = new Map();
  result.rows.forEach(row => {
    addressMap.set(row.address, row.id);
  });
  
  return addressMap;
}

/**
 * Process transactions from RPC data and update analytics
 */
async function processRPCTransactions(rpcTransactions, blockData) {
  try {
    console.log(`Processing ${rpcTransactions.length} transactions from RPC...`);
    
    // Create wallet address map for efficient lookup
    const walletAddressMap = await createWalletAddressMap();
    
    if (walletAddressMap.size === 0) {
      console.log('No active wallets found, skipping transaction processing');
      return [];
    }
    
    const processedTransactions = [];
    
    for (const rawTx of rpcTransactions) {
      try {
        // Find wallets involved in this transaction
        const involvedWallets = findInvolvedWallets(rawTx, walletAddressMap);
        
        if (involvedWallets.length === 0) {
          continue; // Skip transactions not involving tracked wallets
        }
        
        // Process transaction for each involved wallet
        for (const { walletId, address } of involvedWallets) {
          const processedTx = await processTransactionForWallet(
            rawTx, 
            blockData, 
            walletId, 
            address
          );
          processedTransactions.push(processedTx);
        }
        
      } catch (error) {
        console.error(`Error processing transaction ${rawTx.txid}:`, error.message);
      }
    }
    
    console.log(`Successfully processed ${processedTransactions.length} wallet transactions`);
    return processedTransactions;
    
  } catch (error) {
    console.error('Error in processRPCTransactions:', error);
    throw error;
  }
}

// Export all functions and constants
export {
  parseTransactionForAnalytics,
  processTransactionForWallet,
  batchProcessTransactions,
  createWalletAddressMap,
  processRPCTransactions,
  TRANSACTION_TYPES,
  TRANSACTION_SUBTYPES,
  COUNTERPARTY_TYPES
};