import pool from '../db/db.js';

/**
 * Adoption Stage Monitoring Service
 * 
 * Tracks wallet progression through adoption stages:
 * - created: Wallet exists in system
 * - first_tx: First transaction completed
 * - feature_usage: Used specific app features
 * - recurring: Multiple transactions over time
 * - high_value: High-value transactions or sustained activity
 */

// Define adoption stages in order
const ADOPTION_STAGES = [
  'created',
  'first_tx', 
  'feature_usage',
  'recurring',
  'high_value'
];

// Stage criteria thresholds
const STAGE_CRITERIA = {
  created: {
    description: 'Wallet exists in system',
    autoAchieve: true
  },
  first_tx: {
    description: 'First transaction completed',
    minTransactions: 1
  },
  feature_usage: {
    description: 'Used specific app features',
    minFeatureTypes: 2, // Different transaction types or features
    minTransactions: 3
  },
  recurring: {
    description: 'Multiple transactions over time',
    minTransactions: 5,
    minActiveDays: 3,
    minTimeSpanDays: 7
  },
  high_value: {
    description: 'High-value transactions or sustained activity',
    minTransactions: 10,
    minActiveDays: 7,
    minTimeSpanDays: 30,
    minTotalVolume: 1000000 // 0.01 ZEC in zatoshi
  }
};

/**
 * Initialize adoption tracking for a new wallet
 */
async function initializeWalletAdoption(walletId) {
  try {
    // Check if wallet already has adoption tracking
    const existingResult = await pool.query(
      'SELECT COUNT(*) as count FROM wallet_adoption_stages WHERE wallet_id = $1',
      [walletId]
    );

    if (existingResult.rows[0].count > 0) {
      return { success: true, message: 'Adoption tracking already initialized' };
    }

    // Get wallet creation time
    const walletResult = await pool.query(
      'SELECT created_at FROM wallets WHERE id = $1',
      [walletId]
    );

    if (!walletResult.rows[0]) {
      throw new Error('Wallet not found');
    }

    const walletCreatedAt = walletResult.rows[0].created_at;

    // Initialize with 'created' stage achieved
    await pool.query(
      `INSERT INTO wallet_adoption_stages (wallet_id, stage_name, achieved_at, time_to_achieve_hours, conversion_probability)
       VALUES ($1, 'created', $2, 0, 1.0)`,
      [walletId, walletCreatedAt]
    );

    // Initialize other stages as not achieved
    for (const stage of ADOPTION_STAGES.slice(1)) {
      await pool.query(
        `INSERT INTO wallet_adoption_stages (wallet_id, stage_name, achieved_at, time_to_achieve_hours, conversion_probability)
         VALUES ($1, $2, NULL, NULL, NULL)`,
        [walletId, stage]
      );
    }

    return { success: true, message: 'Adoption tracking initialized' };
  } catch (error) {
    throw new Error(`Failed to initialize adoption tracking: ${error.message}`);
  }
}

/**
 * Check and update adoption stages for a wallet based on current activity
 */
async function updateWalletAdoptionStages(walletId) {
  try {
    // Get wallet creation time
    const walletResult = await pool.query(
      'SELECT created_at FROM wallets WHERE id = $1',
      [walletId]
    );

    if (!walletResult.rows[0]) {
      throw new Error('Wallet not found');
    }

    const walletCreatedAt = new Date(walletResult.rows[0].created_at);

    // Get current adoption stages
    const stagesResult = await pool.query(
      'SELECT stage_name, achieved_at FROM wallet_adoption_stages WHERE wallet_id = $1',
      [walletId]
    );

    const currentStages = {};
    stagesResult.rows.forEach(row => {
      currentStages[row.stage_name] = row.achieved_at;
    });

    // Get wallet activity data for analysis
    const activityData = await getWalletActivityData(walletId);
    
    const updates = [];

    // Check each stage (skip 'created' as it's auto-achieved)
    for (const stage of ADOPTION_STAGES.slice(1)) {
      if (!currentStages[stage]) { // Stage not yet achieved
        const achieved = await checkStageAchievement(stage, activityData, walletCreatedAt);
        
        if (achieved) {
          const timeToAchieve = Math.round((achieved.achievedAt - walletCreatedAt) / (1000 * 60 * 60)); // hours
          
          await pool.query(
            `UPDATE wallet_adoption_stages 
             SET achieved_at = $1, time_to_achieve_hours = $2, conversion_probability = $3
             WHERE wallet_id = $4 AND stage_name = $5`,
            [achieved.achievedAt, timeToAchieve, achieved.probability, walletId, stage]
          );

          updates.push({
            stage,
            achieved_at: achieved.achievedAt,
            time_to_achieve_hours: timeToAchieve,
            conversion_probability: achieved.probability
          });
        }
      }
    }

    return { success: true, updates };
  } catch (error) {
    throw new Error(`Failed to update adoption stages: ${error.message}`);
  }
}

/**
 * Get comprehensive wallet activity data for stage analysis
 */
async function getWalletActivityData(walletId) {
  const [transactionsResult, activityResult] = await Promise.all([
    // Get processed transactions
    pool.query(
      `SELECT 
         COUNT(*) as total_transactions,
         COUNT(DISTINCT tx_type) as unique_tx_types,
         COUNT(DISTINCT feature_used) as unique_features,
         COUNT(DISTINCT DATE(block_timestamp)) as active_days,
         SUM(value_zatoshi) as total_volume,
         MIN(block_timestamp) as first_tx_date,
         MAX(block_timestamp) as last_tx_date
       FROM processed_transactions 
       WHERE wallet_id = $1`,
      [walletId]
    ),
    
    // Get activity metrics
    pool.query(
      `SELECT 
         COUNT(*) as total_activity_days,
         COUNT(CASE WHEN is_active THEN 1 END) as active_days,
         SUM(transaction_count) as total_tx_count,
         SUM(total_volume_zatoshi) as total_volume,
         MIN(activity_date) as first_activity_date,
         MAX(activity_date) as last_activity_date
       FROM wallet_activity_metrics 
       WHERE wallet_id = $1`,
      [walletId]
    )
  ]);

  const txData = transactionsResult.rows[0];
  const activityData = activityResult.rows[0];

  return {
    totalTransactions: parseInt(txData.total_transactions) || 0,
    uniqueTxTypes: parseInt(txData.unique_tx_types) || 0,
    uniqueFeatures: parseInt(txData.unique_features) || 0,
    activeDays: parseInt(txData.active_days) || parseInt(activityData.active_days) || 0,
    totalVolume: parseInt(txData.total_volume) || parseInt(activityData.total_volume) || 0,
    firstTxDate: txData.first_tx_date || activityData.first_activity_date,
    lastTxDate: txData.last_tx_date || activityData.last_activity_date,
    timeSpanDays: txData.first_tx_date && txData.last_tx_date ? 
      Math.ceil((new Date(txData.last_tx_date) - new Date(txData.first_tx_date)) / (1000 * 60 * 60 * 24)) : 0
  };
}

/**
 * Check if a specific stage has been achieved based on activity data
 */
async function checkStageAchievement(stage, activityData, walletCreatedAt) {
  const criteria = STAGE_CRITERIA[stage];
  if (!criteria) return false;

  let achieved = false;
  let probability = 0;

  switch (stage) {
    case 'first_tx':
      achieved = activityData.totalTransactions >= criteria.minTransactions;
      probability = achieved ? 1.0 : Math.min(activityData.totalTransactions / criteria.minTransactions, 0.9);
      break;

    case 'feature_usage':
      achieved = activityData.totalTransactions >= criteria.minTransactions && 
                activityData.uniqueTxTypes >= criteria.minFeatureTypes;
      probability = achieved ? 1.0 : 
        Math.min((activityData.totalTransactions / criteria.minTransactions) * 
                (activityData.uniqueTxTypes / criteria.minFeatureTypes), 0.9);
      break;

    case 'recurring':
      achieved = activityData.totalTransactions >= criteria.minTransactions &&
                activityData.activeDays >= criteria.minActiveDays &&
                activityData.timeSpanDays >= criteria.minTimeSpanDays;
      probability = achieved ? 1.0 :
        Math.min((activityData.totalTransactions / criteria.minTransactions) *
                (activityData.activeDays / criteria.minActiveDays) *
                (activityData.timeSpanDays / criteria.minTimeSpanDays), 0.9);
      break;

    case 'high_value':
      achieved = activityData.totalTransactions >= criteria.minTransactions &&
                activityData.activeDays >= criteria.minActiveDays &&
                activityData.timeSpanDays >= criteria.minTimeSpanDays &&
                activityData.totalVolume >= criteria.minTotalVolume;
      probability = achieved ? 1.0 :
        Math.min((activityData.totalTransactions / criteria.minTransactions) *
                (activityData.activeDays / criteria.minActiveDays) *
                (activityData.timeSpanDays / criteria.minTimeSpanDays) *
                (activityData.totalVolume / criteria.minTotalVolume), 0.9);
      break;
  }

  if (achieved) {
    return {
      achievedAt: activityData.lastTxDate || new Date(),
      probability: probability
    };
  }

  return false;
}

/**
 * Get adoption funnel data for a project
 */
async function getProjectAdoptionFunnel(projectId) {
  const result = await pool.query(
    `SELECT 
       was.stage_name,
       COUNT(*) as total_wallets,
       COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) as achieved_wallets,
       ROUND(100.0 * COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) / COUNT(*), 2) as conversion_rate,
       AVG(CASE WHEN was.achieved_at IS NOT NULL THEN was.time_to_achieve_hours END) as avg_time_to_achieve_hours,
       AVG(was.conversion_probability) as avg_conversion_probability
     FROM wallets w
     JOIN wallet_adoption_stages was ON w.id = was.wallet_id
     WHERE w.project_id = $1
     GROUP BY was.stage_name
     ORDER BY 
       CASE was.stage_name
         WHEN 'created' THEN 1
         WHEN 'first_tx' THEN 2
         WHEN 'feature_usage' THEN 3
         WHEN 'recurring' THEN 4
         WHEN 'high_value' THEN 5
         ELSE 6
       END`,
    [projectId]
  );

  return result.rows;
}

/**
 * Get adoption funnel conversion rates between stages
 */
async function getAdoptionConversionRates(projectId) {
  const funnelData = await getProjectAdoptionFunnel(projectId);
  
  const conversions = [];
  for (let i = 0; i < funnelData.length - 1; i++) {
    const currentStage = funnelData[i];
    const nextStage = funnelData[i + 1];
    
    const conversionRate = currentStage.achieved_wallets > 0 ? 
      (nextStage.achieved_wallets / currentStage.achieved_wallets) * 100 : 0;
    
    const dropOffRate = 100 - conversionRate;
    
    conversions.push({
      from_stage: currentStage.stage_name,
      to_stage: nextStage.stage_name,
      conversion_rate: Math.round(conversionRate * 100) / 100,
      drop_off_rate: Math.round(dropOffRate * 100) / 100,
      wallets_converted: nextStage.achieved_wallets,
      wallets_dropped: currentStage.achieved_wallets - nextStage.achieved_wallets
    });
  }
  
  return conversions;
}

/**
 * Get time-to-stage progression metrics
 */
async function getTimeToStageMetrics(projectId) {
  const result = await pool.query(
    `SELECT 
       was.stage_name,
       COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) as achieved_count,
       AVG(was.time_to_achieve_hours) as avg_hours,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY was.time_to_achieve_hours) as median_hours,
       MIN(was.time_to_achieve_hours) as min_hours,
       MAX(was.time_to_achieve_hours) as max_hours
     FROM wallets w
     JOIN wallet_adoption_stages was ON w.id = was.wallet_id
     WHERE w.project_id = $1 AND was.achieved_at IS NOT NULL
     GROUP BY was.stage_name
     ORDER BY 
       CASE was.stage_name
         WHEN 'created' THEN 1
         WHEN 'first_tx' THEN 2
         WHEN 'feature_usage' THEN 3
         WHEN 'recurring' THEN 4
         WHEN 'high_value' THEN 5
         ELSE 6
       END`,
    [projectId]
  );

  return result.rows;
}

/**
 * Get segmented funnel analysis by cohort
 */
async function getSegmentedFunnelAnalysis(projectId, segmentType = 'cohort') {
  let segmentQuery = '';
  
  if (segmentType === 'cohort') {
    segmentQuery = `
      SELECT 
        wc.cohort_period as segment,
        was.stage_name,
        COUNT(*) as total_wallets,
        COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) as achieved_wallets,
        ROUND(100.0 * COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) / COUNT(*), 2) as conversion_rate
      FROM wallets w
      JOIN wallet_adoption_stages was ON w.id = was.wallet_id
      JOIN wallet_cohort_assignments wca ON w.id = wca.wallet_id
      JOIN wallet_cohorts wc ON wca.cohort_id = wc.id
      WHERE w.project_id = $1 AND wc.cohort_type = 'weekly'
      GROUP BY wc.cohort_period, was.stage_name
      ORDER BY wc.cohort_period DESC, 
        CASE was.stage_name
          WHEN 'created' THEN 1
          WHEN 'first_tx' THEN 2
          WHEN 'feature_usage' THEN 3
          WHEN 'recurring' THEN 4
          WHEN 'high_value' THEN 5
          ELSE 6
        END`;
  }

  const result = await pool.query(segmentQuery, [projectId]);
  return result.rows;
}

/**
 * Identify drop-off points and bottlenecks
 */
async function identifyDropOffPoints(projectId) {
  const conversions = await getAdoptionConversionRates(projectId);
  
  // Find stages with highest drop-off rates
  const dropOffs = conversions
    .map(conv => ({
      stage: conv.to_stage,
      drop_off_rate: conv.drop_off_rate,
      wallets_lost: conv.wallets_dropped,
      severity: conv.drop_off_rate > 70 ? 'high' : conv.drop_off_rate > 50 ? 'medium' : 'low'
    }))
    .sort((a, b) => b.drop_off_rate - a.drop_off_rate);

  return dropOffs;
}

/**
 * Get wallet's current adoption stage and progress
 */
async function getWalletAdoptionStatus(walletId) {
  const result = await pool.query(
    `SELECT 
       stage_name,
       achieved_at,
       time_to_achieve_hours,
       conversion_probability
     FROM wallet_adoption_stages 
     WHERE wallet_id = $1
     ORDER BY 
       CASE stage_name
         WHEN 'created' THEN 1
         WHEN 'first_tx' THEN 2
         WHEN 'feature_usage' THEN 3
         WHEN 'recurring' THEN 4
         WHEN 'high_value' THEN 5
         ELSE 6
       END`,
    [walletId]
  );

  const stages = result.rows;
  
  // Find current stage (last achieved stage)
  let currentStage = 'created';
  let nextStage = 'first_tx';
  
  for (let i = stages.length - 1; i >= 0; i--) {
    if (stages[i].achieved_at) {
      currentStage = stages[i].stage_name;
      nextStage = i < stages.length - 1 ? stages[i + 1].stage_name : null;
      break;
    }
  }

  return {
    current_stage: currentStage,
    next_stage: nextStage,
    stages: stages,
    progress_percentage: (stages.filter(s => s.achieved_at).length / stages.length) * 100
  };
}

export {
  initializeWalletAdoption,
  updateWalletAdoptionStages,
  getProjectAdoptionFunnel,
  getAdoptionConversionRates,
  getTimeToStageMetrics,
  getSegmentedFunnelAnalysis,
  identifyDropOffPoints,
  getWalletAdoptionStatus,
  ADOPTION_STAGES,
  STAGE_CRITERIA
};