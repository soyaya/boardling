import pool from '../db/db.js';

// =====================================================
// SHIELDED TRANSACTION ANALYZER SERVICE
// =====================================================
// Analyzes shielded pool activities and privacy-focused behaviors
// Tracks z-address activities, transparent-to-shielded movements,
// and generates privacy-focused behavioral insights
// =====================================================

/**
 * Shielded address patterns for Zcash
 */
const SHIELDED_ADDRESS_PATTERNS = {
  SAPLING: /^zs[a-zA-Z0-9]{76}$/,  // Sapling shielded addresses
  SPROUT: /^zc[a-zA-Z0-9]{95}$/,   // Legacy Sprout addresses (95 chars after zc)
  UNIFIED: /^u[a-zA-Z0-9]{100,}$/  // Unified addresses (can contain shielded receivers)
};

/**
 * Privacy behavior classifications
 */
const PRIVACY_BEHAVIORS = {
  FULL_PRIVACY: 'full_privacy',           // Only shielded transactions
  MIXED_PRIVACY: 'mixed_privacy',         // Mix of shielded and transparent
  ENTRY_FOCUSED: 'entry_focused',         // Primarily transparent to shielded
  EXIT_FOCUSED: 'exit_focused',           // Primarily shielded to transparent
  TRANSPARENT_ONLY: 'transparent_only'    // No shielded activity
};

/**
 * Shielded pool activity types
 */
const SHIELDED_ACTIVITY_TYPES = {
  T_TO_Z: 'transparent_to_shielded',      // Shielding transaction
  Z_TO_T: 'shielded_to_transparent',      // Deshielding transaction
  Z_TO_Z: 'internal_shielded',            // Fully shielded transfer
  MIXED: 'mixed_transaction'              // Complex transaction with multiple types
};

// =====================================================
// CORE SHIELDED ANALYSIS FUNCTIONS
// =====================================================

/**
 * Analyze shielded transactions for a specific wallet
 */
async function analyzeWalletShieldedActivity(walletId, analysisDate = null) {
  try {
    const targetDate = analysisDate || new Date().toISOString().split('T')[0];
    
    console.log(`Analyzing shielded activity for wallet ${walletId} on ${targetDate}`);
    
    // Get all processed transactions for the wallet on the target date
    const transactionsResult = await pool.query(`
      SELECT 
        pt.*,
        w.address as wallet_address,
        w.type as wallet_type
      FROM processed_transactions pt
      JOIN wallets w ON pt.wallet_id = w.id
      WHERE pt.wallet_id = $1 
      AND DATE(pt.block_timestamp) = $2
      ORDER BY pt.block_timestamp ASC
    `, [walletId, targetDate]);
    
    const transactions = transactionsResult.rows;
    
    if (transactions.length === 0) {
      console.log(`No transactions found for wallet ${walletId} on ${targetDate}`);
      return null;
    }
    
    // Analyze shielded activity patterns
    const shieldedMetrics = await calculateShieldedMetrics(transactions);
    
    // Calculate privacy score
    const privacyScore = calculatePrivacyScore(shieldedMetrics, transactions);
    
    // Analyze behavior patterns
    const behaviorAnalysis = analyzeBehaviorPatterns(transactions);
    
    // Save or update shielded pool metrics
    const metrics = {
      wallet_id: walletId,
      analysis_date: targetDate,
      ...shieldedMetrics,
      privacy_score: privacyScore,
      ...behaviorAnalysis
    };
    
    await saveShieldedPoolMetrics(metrics);
    
    console.log(`Shielded analysis completed for wallet ${walletId}: Privacy Score ${privacyScore}`);
    return metrics;
    
  } catch (error) {
    console.error(`Error analyzing shielded activity for wallet ${walletId}:`, error);
    throw error;
  }
}

/**
 * Calculate comprehensive shielded activity metrics
 */
async function calculateShieldedMetrics(transactions) {
  const metrics = {
    shielded_tx_count: 0,
    transparent_to_shielded_count: 0,
    shielded_to_transparent_count: 0,
    internal_shielded_count: 0,
    shielded_volume_zatoshi: 0,
    avg_shielded_duration_hours: 0
  };
  
  let totalShieldedDuration = 0;
  let shieldedSessions = 0;
  let lastShieldedEntry = null;
  
  for (const tx of transactions) {
    // Count shielded transactions
    if (tx.is_shielded) {
      metrics.shielded_tx_count++;
      metrics.shielded_volume_zatoshi += Math.abs(tx.value_zatoshi || 0);
      
      // Track shielded pool entries and exits for duration calculation
      if (tx.shielded_pool_entry) {
        metrics.transparent_to_shielded_count++;
        lastShieldedEntry = new Date(tx.block_timestamp);
      }
      
      if (tx.shielded_pool_exit) {
        metrics.shielded_to_transparent_count++;
        
        // Calculate duration if we have an entry timestamp
        if (lastShieldedEntry) {
          const exitTime = new Date(tx.block_timestamp);
          const durationMs = exitTime - lastShieldedEntry;
          const durationHours = durationMs / (1000 * 60 * 60);
          
          totalShieldedDuration += durationHours;
          shieldedSessions++;
          lastShieldedEntry = null;
        }
      }
      
      // Count internal shielded transactions
      if (!tx.shielded_pool_entry && !tx.shielded_pool_exit && tx.is_shielded) {
        metrics.internal_shielded_count++;
      }
    }
  }
  
  // Calculate average shielded duration
  if (shieldedSessions > 0) {
    metrics.avg_shielded_duration_hours = totalShieldedDuration / shieldedSessions;
  }
  
  return metrics;
}

/**
 * Calculate privacy score based on shielded activity patterns
 */
function calculatePrivacyScore(metrics, transactions) {
  let score = 0;
  const totalTx = transactions.length;
  
  if (totalTx === 0) return 0;
  
  // Base score from shielded transaction ratio (0-40 points)
  const shieldedRatio = metrics.shielded_tx_count / totalTx;
  score += Math.round(shieldedRatio * 40);
  
  // Bonus for internal shielded transactions (0-20 points)
  if (metrics.internal_shielded_count > 0) {
    const internalRatio = metrics.internal_shielded_count / metrics.shielded_tx_count;
    score += Math.round(internalRatio * 20);
  }
  
  // Bonus for balanced entry/exit behavior (0-20 points)
  const entryExitBalance = Math.min(
    metrics.transparent_to_shielded_count,
    metrics.shielded_to_transparent_count
  );
  if (entryExitBalance > 0) {
    score += Math.min(entryExitBalance * 5, 20);
  }
  
  // Bonus for longer shielded durations (0-20 points)
  if (metrics.avg_shielded_duration_hours > 0) {
    if (metrics.avg_shielded_duration_hours >= 24) score += 20;      // 1+ days
    else if (metrics.avg_shielded_duration_hours >= 12) score += 15; // 12+ hours
    else if (metrics.avg_shielded_duration_hours >= 6) score += 10;  // 6+ hours
    else if (metrics.avg_shielded_duration_hours >= 1) score += 5;   // 1+ hours
  }
  
  return Math.min(score, 100);
}

/**
 * Analyze behavior patterns in shielded transactions
 */
function analyzeBehaviorPatterns(transactions) {
  const patterns = {
    behavior_type: PRIVACY_BEHAVIORS.TRANSPARENT_ONLY,
    shielded_sequences: [],
    privacy_consistency: 0,
    typical_flow_pattern: null
  };
  
  const shieldedTx = transactions.filter(tx => tx.is_shielded);
  const totalTx = transactions.length;
  
  if (shieldedTx.length === 0) {
    return patterns;
  }
  
  // Determine primary behavior type
  const shieldedRatio = shieldedTx.length / totalTx;
  const entryCount = shieldedTx.filter(tx => tx.shielded_pool_entry).length;
  const exitCount = shieldedTx.filter(tx => tx.shielded_pool_exit).length;
  const internalCount = shieldedTx.filter(tx => 
    !tx.shielded_pool_entry && !tx.shielded_pool_exit && tx.is_shielded
  ).length;
  
  if (shieldedRatio >= 0.8) {
    patterns.behavior_type = PRIVACY_BEHAVIORS.FULL_PRIVACY;
  } else if (entryCount > exitCount * 2) {
    patterns.behavior_type = PRIVACY_BEHAVIORS.ENTRY_FOCUSED;
  } else if (exitCount > entryCount * 2) {
    patterns.behavior_type = PRIVACY_BEHAVIORS.EXIT_FOCUSED;
  } else if (shieldedRatio > 0.2) {
    patterns.behavior_type = PRIVACY_BEHAVIORS.MIXED_PRIVACY;
  }
  
  // Analyze shielded sequences
  patterns.shielded_sequences = identifyShieldedSequences(transactions);
  
  // Calculate privacy consistency (how regularly shielded transactions occur)
  patterns.privacy_consistency = calculatePrivacyConsistency(transactions);
  
  // Identify typical flow pattern
  patterns.typical_flow_pattern = identifyTypicalFlowPattern(
    entryCount, exitCount, internalCount
  );
  
  return patterns;
}

/**
 * Identify sequences of shielded transactions
 */
function identifyShieldedSequences(transactions) {
  const sequences = [];
  let currentSequence = null;
  
  for (const tx of transactions) {
    if (tx.is_shielded) {
      if (!currentSequence) {
        currentSequence = {
          start_time: tx.block_timestamp,
          transactions: [],
          types: new Set()
        };
      }
      
      currentSequence.transactions.push({
        txid: tx.txid,
        type: getShieldedActivityType(tx),
        timestamp: tx.block_timestamp,
        value: tx.value_zatoshi
      });
      
      currentSequence.types.add(getShieldedActivityType(tx));
      
    } else if (currentSequence) {
      // End current sequence
      currentSequence.end_time = currentSequence.transactions[
        currentSequence.transactions.length - 1
      ].timestamp;
      currentSequence.duration_minutes = calculateDurationMinutes(
        currentSequence.start_time, 
        currentSequence.end_time
      );
      currentSequence.complexity = currentSequence.types.size;
      
      sequences.push(currentSequence);
      currentSequence = null;
    }
  }
  
  // Handle case where sequence continues to end of transactions
  if (currentSequence) {
    currentSequence.end_time = currentSequence.transactions[
      currentSequence.transactions.length - 1
    ].timestamp;
    currentSequence.duration_minutes = calculateDurationMinutes(
      currentSequence.start_time, 
      currentSequence.end_time
    );
    currentSequence.complexity = currentSequence.types.size;
    sequences.push(currentSequence);
  }
  
  return sequences;
}

/**
 * Get shielded activity type for a transaction
 */
function getShieldedActivityType(tx) {
  if (tx.shielded_pool_entry) return SHIELDED_ACTIVITY_TYPES.T_TO_Z;
  if (tx.shielded_pool_exit) return SHIELDED_ACTIVITY_TYPES.Z_TO_T;
  if (tx.is_shielded) return SHIELDED_ACTIVITY_TYPES.Z_TO_Z;
  return SHIELDED_ACTIVITY_TYPES.MIXED;
}

/**
 * Calculate privacy consistency score
 */
function calculatePrivacyConsistency(transactions) {
  if (transactions.length < 2) return 0;
  
  const timeSpan = new Date(transactions[transactions.length - 1].block_timestamp) - 
                   new Date(transactions[0].block_timestamp);
  const hours = timeSpan / (1000 * 60 * 60);
  
  if (hours === 0) return 100;
  
  const shieldedTx = transactions.filter(tx => tx.is_shielded);
  const shieldedFrequency = shieldedTx.length / Math.max(hours, 1);
  
  // Normalize to 0-100 scale (higher frequency = higher consistency)
  return Math.min(Math.round(shieldedFrequency * 10), 100);
}

/**
 * Identify typical flow pattern
 */
function identifyTypicalFlowPattern(entryCount, exitCount, internalCount) {
  const total = entryCount + exitCount + internalCount;
  
  if (total === 0) return 'no_shielded_activity';
  
  const entryRatio = entryCount / total;
  const exitRatio = exitCount / total;
  const internalRatio = internalCount / total;
  
  if (internalRatio > 0.6) return 'privacy_focused';
  if (entryRatio > 0.6) return 'accumulation_focused';
  if (exitRatio > 0.6) return 'spending_focused';
  if (Math.abs(entryRatio - exitRatio) < 0.2) return 'balanced_flow';
  
  return 'mixed_pattern';
}

/**
 * Calculate duration in minutes between two timestamps
 */
function calculateDurationMinutes(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end - start) / (1000 * 60));
}

// =====================================================
// SHIELDED POOL COMPARISON FUNCTIONS
// =====================================================

/**
 * Compare shielded vs transparent user behavior
 */
async function compareShieldedVsTransparentUsers(projectId, timeRange = 30) {
  try {
    console.log(`Comparing shielded vs transparent users for project ${projectId}`);
    
    const endDate = new Date();
    const startDate = new Date(endDate - timeRange * 24 * 60 * 60 * 1000);
    
    // Get shielded users (wallets with shielded activity)
    const shieldedUsersResult = await pool.query(`
      SELECT DISTINCT w.id, w.address, w.type
      FROM wallets w
      JOIN processed_transactions pt ON w.id = pt.wallet_id
      WHERE w.project_id = $1
      AND pt.is_shielded = true
      AND pt.block_timestamp >= $2
      AND pt.block_timestamp <= $3
    `, [projectId, startDate, endDate]);
    
    // Get transparent-only users
    const transparentUsersResult = await pool.query(`
      SELECT DISTINCT w.id, w.address, w.type
      FROM wallets w
      JOIN processed_transactions pt ON w.id = pt.wallet_id
      WHERE w.project_id = $1
      AND w.id NOT IN (
        SELECT DISTINCT wallet_id 
        FROM processed_transactions 
        WHERE is_shielded = true
        AND block_timestamp >= $2
        AND block_timestamp <= $3
      )
      AND pt.block_timestamp >= $2
      AND pt.block_timestamp <= $3
    `, [projectId, startDate, endDate]);
    
    const shieldedUsers = shieldedUsersResult.rows;
    const transparentUsers = transparentUsersResult.rows;
    
    // Calculate metrics for each group
    const shieldedMetrics = await calculateGroupMetrics(
      shieldedUsers.map(u => u.id), 
      startDate, 
      endDate
    );
    
    const transparentMetrics = await calculateGroupMetrics(
      transparentUsers.map(u => u.id), 
      startDate, 
      endDate
    );
    
    // Calculate retention rates
    const shieldedRetention = await calculateGroupRetention(
      shieldedUsers.map(u => u.id), 
      timeRange
    );
    
    const transparentRetention = await calculateGroupRetention(
      transparentUsers.map(u => u.id), 
      timeRange
    );
    
    const comparison = {
      analysis_period: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        days: timeRange
      },
      shielded_users: {
        count: shieldedUsers.length,
        metrics: shieldedMetrics,
        retention: shieldedRetention
      },
      transparent_users: {
        count: transparentUsers.length,
        metrics: transparentMetrics,
        retention: transparentRetention
      },
      comparison_insights: generateComparisonInsights(
        shieldedMetrics, 
        transparentMetrics, 
        shieldedRetention, 
        transparentRetention
      )
    };
    
    console.log(`Comparison completed: ${shieldedUsers.length} shielded vs ${transparentUsers.length} transparent users`);
    return comparison;
    
  } catch (error) {
    console.error(`Error comparing shielded vs transparent users:`, error);
    throw error;
  }
}

/**
 * Calculate metrics for a group of wallets
 */
async function calculateGroupMetrics(walletIds, startDate, endDate) {
  if (walletIds.length === 0) {
    return {
      avg_transactions_per_user: 0,
      avg_volume_per_user: 0,
      avg_active_days: 0,
      avg_session_duration_hours: 0
    };
  }
  
  // First get basic metrics
  const basicResult = await pool.query(`
    SELECT 
      COUNT(pt.id) as total_transactions,
      SUM(ABS(pt.value_zatoshi)) as total_volume,
      COUNT(DISTINCT DATE(pt.block_timestamp)) as total_active_days,
      COUNT(DISTINCT pt.wallet_id) as active_wallets
    FROM processed_transactions pt
    WHERE pt.wallet_id = ANY($1)
    AND pt.block_timestamp >= $2
    AND pt.block_timestamp <= $3
  `, [walletIds, startDate, endDate]);
  
  // Calculate session duration separately
  const sessionResult = await pool.query(`
    WITH wallet_sessions AS (
      SELECT 
        wallet_id,
        EXTRACT(EPOCH FROM (MAX(block_timestamp) - MIN(block_timestamp))) / 3600 as session_duration_hours
      FROM processed_transactions
      WHERE wallet_id = ANY($1)
      AND block_timestamp >= $2
      AND block_timestamp <= $3
      GROUP BY wallet_id
    )
    SELECT AVG(session_duration_hours) as avg_session_duration_hours
    FROM wallet_sessions
  `, [walletIds, startDate, endDate]);
  
  const basicData = basicResult.rows[0];
  const sessionData = sessionResult.rows[0];
  const userCount = walletIds.length;
  
  return {
    avg_transactions_per_user: Math.round(basicData.total_transactions / userCount * 100) / 100,
    avg_volume_per_user: Math.round(basicData.total_volume / userCount),
    avg_active_days: Math.round(basicData.total_active_days / userCount * 100) / 100,
    avg_session_duration_hours: Math.round((sessionData.avg_session_duration_hours || 0) * 100) / 100
  };
}

/**
 * Calculate retention rate for a group of wallets
 */
async function calculateGroupRetention(walletIds, timeRange) {
  if (walletIds.length === 0) {
    return {
      week_1: 0,
      week_2: 0,
      week_3: 0,
      week_4: 0
    };
  }
  
  const endDate = new Date();
  const retention = {};
  
  for (let week = 1; week <= 4; week++) {
    const weekStart = new Date(endDate - (week * 7 * 24 * 60 * 60 * 1000));
    const weekEnd = new Date(endDate - ((week - 1) * 7 * 24 * 60 * 60 * 1000));
    
    const result = await pool.query(`
      SELECT COUNT(DISTINCT wallet_id) as active_wallets
      FROM processed_transactions
      WHERE wallet_id = ANY($1)
      AND block_timestamp >= $2
      AND block_timestamp < $3
    `, [walletIds, weekStart, weekEnd]);
    
    const activeWallets = result.rows[0].active_wallets;
    retention[`week_${week}`] = Math.round((activeWallets / walletIds.length) * 100 * 100) / 100;
  }
  
  return retention;
}

/**
 * Generate insights from shielded vs transparent comparison
 */
function generateComparisonInsights(shieldedMetrics, transparentMetrics, shieldedRetention, transparentRetention) {
  const insights = [];
  
  // Transaction frequency comparison
  const txFrequencyDiff = shieldedMetrics.avg_transactions_per_user - transparentMetrics.avg_transactions_per_user;
  if (Math.abs(txFrequencyDiff) > 0.5) {
    insights.push({
      type: 'transaction_frequency',
      message: txFrequencyDiff > 0 
        ? `Shielded users are ${Math.round(txFrequencyDiff * 100) / 100}x more active in transactions`
        : `Transparent users are ${Math.round(Math.abs(txFrequencyDiff) * 100) / 100}x more active in transactions`,
      impact: Math.abs(txFrequencyDiff) > 2 ? 'high' : 'medium'
    });
  }
  
  // Volume comparison
  const volumeDiff = (shieldedMetrics.avg_volume_per_user - transparentMetrics.avg_volume_per_user) / transparentMetrics.avg_volume_per_user;
  if (Math.abs(volumeDiff) > 0.2) {
    insights.push({
      type: 'transaction_volume',
      message: volumeDiff > 0 
        ? `Shielded users transact ${Math.round(volumeDiff * 100)}% higher volumes`
        : `Transparent users transact ${Math.round(Math.abs(volumeDiff) * 100)}% higher volumes`,
      impact: Math.abs(volumeDiff) > 0.5 ? 'high' : 'medium'
    });
  }
  
  // Retention comparison
  const retentionDiff = shieldedRetention.week_4 - transparentRetention.week_4;
  if (Math.abs(retentionDiff) > 5) {
    insights.push({
      type: 'retention',
      message: retentionDiff > 0 
        ? `Shielded users show ${Math.round(retentionDiff)}% better 4-week retention`
        : `Transparent users show ${Math.round(Math.abs(retentionDiff))}% better 4-week retention`,
      impact: Math.abs(retentionDiff) > 15 ? 'high' : 'medium'
    });
  }
  
  // Session duration comparison
  const sessionDiff = shieldedMetrics.avg_session_duration_hours - transparentMetrics.avg_session_duration_hours;
  if (Math.abs(sessionDiff) > 1) {
    insights.push({
      type: 'engagement',
      message: sessionDiff > 0 
        ? `Shielded users have ${Math.round(sessionDiff * 100) / 100} hours longer average sessions`
        : `Transparent users have ${Math.round(Math.abs(sessionDiff) * 100) / 100} hours longer average sessions`,
      impact: Math.abs(sessionDiff) > 5 ? 'high' : 'medium'
    });
  }
  
  return insights;
}

// =====================================================
// DATABASE OPERATIONS
// =====================================================

/**
 * Save shielded pool metrics to database
 */
async function saveShieldedPoolMetrics(metrics) {
  try {
    const result = await pool.query(`
      INSERT INTO shielded_pool_metrics (
        wallet_id, analysis_date, shielded_tx_count,
        transparent_to_shielded_count, shielded_to_transparent_count,
        internal_shielded_count, avg_shielded_duration_hours,
        shielded_volume_zatoshi, privacy_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (wallet_id, analysis_date) 
      DO UPDATE SET
        shielded_tx_count = EXCLUDED.shielded_tx_count,
        transparent_to_shielded_count = EXCLUDED.transparent_to_shielded_count,
        shielded_to_transparent_count = EXCLUDED.shielded_to_transparent_count,
        internal_shielded_count = EXCLUDED.internal_shielded_count,
        avg_shielded_duration_hours = EXCLUDED.avg_shielded_duration_hours,
        shielded_volume_zatoshi = EXCLUDED.shielded_volume_zatoshi,
        privacy_score = EXCLUDED.privacy_score,
        created_at = NOW()
      RETURNING *
    `, [
      metrics.wallet_id,
      metrics.analysis_date,
      metrics.shielded_tx_count,
      metrics.transparent_to_shielded_count,
      metrics.shielded_to_transparent_count,
      metrics.internal_shielded_count,
      metrics.avg_shielded_duration_hours,
      metrics.shielded_volume_zatoshi,
      metrics.privacy_score
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error saving shielded pool metrics:', error);
    throw error;
  }
}

/**
 * Get shielded pool metrics for a wallet
 */
async function getWalletShieldedMetrics(walletId, days = 30) {
  try {
    const result = await pool.query(`
      SELECT * FROM shielded_pool_metrics
      WHERE wallet_id = $1
      AND analysis_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY analysis_date DESC
    `, [walletId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting wallet shielded metrics:', error);
    throw error;
  }
}

/**
 * Get project-wide shielded analytics
 */
async function getProjectShieldedAnalytics(projectId, days = 30) {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(spm.analysis_date) as date,
        COUNT(DISTINCT spm.wallet_id) as active_shielded_wallets,
        AVG(spm.privacy_score) as avg_privacy_score,
        SUM(spm.shielded_tx_count) as total_shielded_transactions,
        SUM(spm.transparent_to_shielded_count) as total_shielding_transactions,
        SUM(spm.shielded_to_transparent_count) as total_deshielding_transactions,
        SUM(spm.internal_shielded_count) as total_internal_shielded,
        SUM(spm.shielded_volume_zatoshi) as total_shielded_volume
      FROM shielded_pool_metrics spm
      JOIN wallets w ON spm.wallet_id = w.id
      WHERE w.project_id = $1
      AND spm.analysis_date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(spm.analysis_date)
      ORDER BY date DESC
    `, [projectId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting project shielded analytics:', error);
    throw error;
  }
}

// =====================================================
// BATCH PROCESSING FUNCTIONS
// =====================================================

/**
 * Analyze shielded activity for all wallets in a project
 */
async function analyzeProjectShieldedActivity(projectId, analysisDate = null) {
  try {
    const targetDate = analysisDate || new Date().toISOString().split('T')[0];
    
    console.log(`Starting shielded analysis for project ${projectId} on ${targetDate}`);
    
    // Get all wallets for the project
    const walletsResult = await pool.query(`
      SELECT id, address, type
      FROM wallets
      WHERE project_id = $1 AND is_active = true
    `, [projectId]);
    
    const wallets = walletsResult.rows;
    console.log(`Found ${wallets.length} wallets to analyze`);
    
    const results = [];
    let processedCount = 0;
    
    for (const wallet of wallets) {
      try {
        const metrics = await analyzeWalletShieldedActivity(wallet.id, targetDate);
        if (metrics) {
          results.push(metrics);
        }
        processedCount++;
        
        if (processedCount % 10 === 0) {
          console.log(`Processed ${processedCount}/${wallets.length} wallets`);
        }
      } catch (error) {
        console.error(`Error analyzing wallet ${wallet.id}:`, error.message);
      }
    }
    
    console.log(`Shielded analysis completed for project ${projectId}: ${results.length} wallets analyzed`);
    return results;
    
  } catch (error) {
    console.error(`Error analyzing project shielded activity:`, error);
    throw error;
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Check if an address is a shielded address
 */
function isShieldedAddress(address) {
  if (!address) return false;
  
  return Object.values(SHIELDED_ADDRESS_PATTERNS).some(pattern => 
    pattern.test(address)
  );
}

/**
 * Get shielded address type
 */
function getShieldedAddressType(address) {
  if (!address) return null;
  
  if (SHIELDED_ADDRESS_PATTERNS.SAPLING.test(address)) return 'sapling';
  if (SHIELDED_ADDRESS_PATTERNS.SPROUT.test(address)) return 'sprout';
  if (SHIELDED_ADDRESS_PATTERNS.UNIFIED.test(address)) return 'unified';
  
  return null;
}

/**
 * Calculate shielded transaction percentage for a wallet
 */
async function calculateWalletShieldedPercentage(walletId, days = 30) {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(*) FILTER (WHERE is_shielded = true) as shielded_transactions
      FROM processed_transactions
      WHERE wallet_id = $1
      AND block_timestamp >= CURRENT_DATE - INTERVAL '${days} days'
    `, [walletId]);
    
    const data = result.rows[0];
    const totalTx = parseInt(data.total_transactions) || 0;
    const shieldedTx = parseInt(data.shielded_transactions) || 0;
    
    if (totalTx === 0) return 0;
    
    return Math.round((shieldedTx / totalTx) * 100 * 100) / 100;
  } catch (error) {
    console.error('Error calculating wallet shielded percentage:', error);
    throw error;
  }
}

// Export all functions
export {
  analyzeWalletShieldedActivity,
  compareShieldedVsTransparentUsers,
  analyzeProjectShieldedActivity,
  getWalletShieldedMetrics,
  getProjectShieldedAnalytics,
  calculateWalletShieldedPercentage,
  isShieldedAddress,
  getShieldedAddressType,
  SHIELDED_ADDRESS_PATTERNS,
  PRIVACY_BEHAVIORS,
  SHIELDED_ACTIVITY_TYPES
};