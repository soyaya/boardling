import pool from '../db/db.js';

/**
 * Enhanced Productivity Scoring Service
 * 
 * Calculates comprehensive 0-100 productivity scores by combining:
 * - Retention percentage
 * - Adoption percentage  
 * - Churn percentage (inverted)
 * - Transaction frequency
 * - Active days
 * 
 * Provides component-level breakdowns and color-coded status indicators.
 */

// Scoring weights for different components
const SCORING_WEIGHTS = {
  retention: 0.30,    // 30% - How well the wallet retains activity over time
  adoption: 0.25,     // 25% - Progress through adoption funnel stages
  churn: 0.20,        // 20% - Inverse of churn risk (lower churn = higher score)
  frequency: 0.15,    // 15% - Transaction frequency and consistency
  activity: 0.10      // 10% - Recent activity levels
};

// Thresholds for status indicators
const STATUS_THRESHOLDS = {
  healthy: 70,        // >= 70 = healthy (green)
  at_risk: 40,        // 40-69 = at risk (yellow)
  churn: 0            // < 40 = churn risk (red)
};

// Risk level thresholds
const RISK_THRESHOLDS = {
  low: 60,           // >= 60 = low risk
  medium: 30,        // 30-59 = medium risk
  high: 0            // < 30 = high risk
};

/**
 * Calculate comprehensive productivity score for a wallet
 */
async function calculateEnhancedProductivityScore(walletId) {
  try {
    // Get all component scores in parallel
    const [
      retentionScore,
      adoptionScore,
      churnScore,
      frequencyScore,
      activityScore
    ] = await Promise.all([
      calculateRetentionScore(walletId),
      calculateAdoptionScore(walletId),
      calculateChurnScore(walletId),
      calculateFrequencyScore(walletId),
      calculateActivityScore(walletId)
    ]);

    // Calculate weighted total score
    const totalScore = Math.round(
      (retentionScore * SCORING_WEIGHTS.retention) +
      (adoptionScore * SCORING_WEIGHTS.adoption) +
      (churnScore * SCORING_WEIGHTS.churn) +
      (frequencyScore * SCORING_WEIGHTS.frequency) +
      (activityScore * SCORING_WEIGHTS.activity)
    );

    // Determine status and risk level
    const status = getStatusFromScore(totalScore);
    const riskLevel = getRiskLevelFromScore(totalScore);

    // Get color indicators
    const colorIndicators = getColorIndicators({
      total: totalScore,
      retention: retentionScore,
      adoption: adoptionScore,
      churn: churnScore,
      frequency: frequencyScore,
      activity: activityScore
    });

    return {
      total_score: Math.max(0, Math.min(100, totalScore)),
      component_scores: {
        retention_score: retentionScore,
        adoption_score: adoptionScore,
        churn_score: churnScore,
        frequency_score: frequencyScore,
        activity_score: activityScore
      },
      weighted_contributions: {
        retention: Math.round(retentionScore * SCORING_WEIGHTS.retention),
        adoption: Math.round(adoptionScore * SCORING_WEIGHTS.adoption),
        churn: Math.round(churnScore * SCORING_WEIGHTS.churn),
        frequency: Math.round(frequencyScore * SCORING_WEIGHTS.frequency),
        activity: Math.round(activityScore * SCORING_WEIGHTS.activity)
      },
      status,
      risk_level: riskLevel,
      color_indicators: colorIndicators,
      scoring_weights: SCORING_WEIGHTS,
      calculated_at: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`Failed to calculate productivity score: ${error.message}`);
  }
}

/**
 * Calculate retention score (0-100)
 * Based on frequency, recency, volume, and diversity
 */
async function calculateRetentionScore(walletId) {
  const result = await pool.query(`
    SELECT 
      MAX(activity_date) as last_activity_date,
      COUNT(DISTINCT activity_date) as activity_days,
      SUM(total_volume_zatoshi) as total_volume,
      COUNT(DISTINCT CASE WHEN transfers_count > 0 THEN 'transfer' END) +
      COUNT(DISTINCT CASE WHEN swaps_count > 0 THEN 'swap' END) +
      COUNT(DISTINCT CASE WHEN bridges_count > 0 THEN 'bridge' END) +
      COUNT(DISTINCT CASE WHEN shielded_count > 0 THEN 'shielded' END) as tx_diversity,
      AVG(sequence_complexity_score) as avg_complexity
    FROM wallet_activity_metrics
    WHERE wallet_id = $1
    AND activity_date >= CURRENT_DATE - INTERVAL '30 days'
  `, [walletId]);

  const data = result.rows[0];
  if (!data || data.activity_days === 0) return 0;

  let score = 0;

  // Frequency component (0-30 points)
  const activityDays = parseInt(data.activity_days);
  if (activityDays >= 15) score += 30;
  else if (activityDays >= 8) score += 20;
  else if (activityDays >= 4) score += 10;
  else if (activityDays >= 1) score += 5;

  // Recency component (0-30 points)
  const daysSinceLastActivity = data.last_activity_date ? 
    Math.floor((new Date() - new Date(data.last_activity_date)) / (1000 * 60 * 60 * 24)) : 999;
  
  if (daysSinceLastActivity <= 1) score += 30;
  else if (daysSinceLastActivity <= 3) score += 20;
  else if (daysSinceLastActivity <= 7) score += 10;
  else if (daysSinceLastActivity <= 14) score += 5;

  // Volume component (0-20 points)
  const totalVolume = parseInt(data.total_volume) || 0;
  if (totalVolume > 100000000) score += 20; // > 1 ZEC
  else if (totalVolume > 10000000) score += 15; // > 0.1 ZEC
  else if (totalVolume > 1000000) score += 10; // > 0.01 ZEC
  else if (totalVolume > 0) score += 5;

  // Diversity component (0-20 points)
  const diversity = parseInt(data.tx_diversity) || 0;
  score += Math.min(diversity * 5, 20);

  return Math.min(score, 100);
}

/**
 * Calculate adoption score (0-100)
 * Based on progression through adoption funnel stages
 */
async function calculateAdoptionScore(walletId) {
  const result = await pool.query(`
    SELECT 
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
      END
  `, [walletId]);

  if (result.rows.length === 0) return 0;

  const stages = result.rows;
  let score = 0;

  // Base score for each achieved stage
  const stageValues = {
    'created': 10,
    'first_tx': 20,
    'feature_usage': 30,
    'recurring': 25,
    'high_value': 15
  };

  stages.forEach(stage => {
    if (stage.achieved_at) {
      score += stageValues[stage.stage_name] || 0;
      
      // Bonus for quick achievement (within reasonable time)
      if (stage.time_to_achieve_hours !== null) {
        const hours = stage.time_to_achieve_hours;
        if (stage.stage_name === 'first_tx' && hours <= 24) score += 5;
        else if (stage.stage_name === 'feature_usage' && hours <= 72) score += 5;
        else if (stage.stage_name === 'recurring' && hours <= 168) score += 5; // 1 week
      }
    }
  });

  return Math.min(score, 100);
}

/**
 * Calculate churn score (0-100)
 * Higher score = lower churn risk
 */
async function calculateChurnScore(walletId) {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_days,
      COUNT(CASE WHEN is_active THEN 1 END) as active_days,
      MAX(activity_date) as last_activity,
      MIN(activity_date) as first_activity,
      AVG(transaction_count) as avg_daily_txs,
      STDDEV(transaction_count) as tx_consistency
    FROM wallet_activity_metrics
    WHERE wallet_id = $1
    AND activity_date >= CURRENT_DATE - INTERVAL '60 days'
  `, [walletId]);

  const data = result.rows[0];
  if (!data || data.total_days === 0) return 0;

  let score = 100; // Start with perfect score, deduct for churn indicators

  // Deduct for inactivity
  const daysSinceLastActivity = data.last_activity ? 
    Math.floor((new Date() - new Date(data.last_activity)) / (1000 * 60 * 60 * 24)) : 999;
  
  if (daysSinceLastActivity > 30) score -= 50;
  else if (daysSinceLastActivity > 14) score -= 30;
  else if (daysSinceLastActivity > 7) score -= 15;
  else if (daysSinceLastActivity > 3) score -= 5;

  // Deduct for low activity ratio
  const activityRatio = data.active_days / data.total_days;
  if (activityRatio < 0.1) score -= 30;
  else if (activityRatio < 0.2) score -= 20;
  else if (activityRatio < 0.3) score -= 10;

  // Deduct for declining activity trend
  const recentActivity = await pool.query(`
    SELECT COUNT(CASE WHEN is_active THEN 1 END) as recent_active_days
    FROM wallet_activity_metrics
    WHERE wallet_id = $1
    AND activity_date >= CURRENT_DATE - INTERVAL '7 days'
  `, [walletId]);

  const recentActiveDays = recentActivity.rows[0]?.recent_active_days || 0;
  if (recentActiveDays === 0) score -= 20;
  else if (recentActiveDays <= 1) score -= 10;

  return Math.max(0, Math.min(score, 100));
}

/**
 * Calculate frequency score (0-100)
 * Based on transaction frequency and consistency
 */
async function calculateFrequencyScore(walletId) {
  // First get basic transaction stats
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_transactions,
      COUNT(DISTINCT DATE(block_timestamp)) as active_days,
      MIN(block_timestamp) as first_tx,
      MAX(block_timestamp) as last_tx
    FROM processed_transactions
    WHERE wallet_id = $1
    AND block_timestamp >= CURRENT_DATE - INTERVAL '30 days'
  `, [walletId]);

  // Then calculate time between transactions separately
  const timingResult = await pool.query(`
    WITH tx_intervals AS (
      SELECT 
        EXTRACT(EPOCH FROM (block_timestamp - LAG(block_timestamp) OVER (ORDER BY block_timestamp))) / 3600 as hours_between
      FROM processed_transactions
      WHERE wallet_id = $1
      AND block_timestamp >= CURRENT_DATE - INTERVAL '30 days'
    )
    SELECT 
      AVG(hours_between) as avg_hours_between_txs,
      STDDEV(hours_between) as consistency_score
    FROM tx_intervals
    WHERE hours_between IS NOT NULL
  `, [walletId]);

  const data = result.rows[0];
  const timingData = timingResult.rows[0];
  
  if (!data || data.total_transactions === 0) return 0;

  let score = 0;

  // Transaction volume score (0-40 points)
  const txCount = parseInt(data.total_transactions);
  if (txCount >= 50) score += 40;
  else if (txCount >= 20) score += 30;
  else if (txCount >= 10) score += 20;
  else if (txCount >= 5) score += 10;
  else if (txCount >= 1) score += 5;

  // Activity spread score (0-30 points)
  const activeDays = parseInt(data.active_days);
  if (activeDays >= 15) score += 30;
  else if (activeDays >= 10) score += 20;
  else if (activeDays >= 5) score += 15;
  else if (activeDays >= 2) score += 10;
  else if (activeDays >= 1) score += 5;

  // Consistency bonus (0-30 points)
  const avgHoursBetween = parseFloat(timingData?.avg_hours_between_txs) || 0;
  if (avgHoursBetween > 0 && avgHoursBetween <= 168) { // Within a week
    score += 30;
  } else if (avgHoursBetween <= 720) { // Within a month
    score += 15;
  }

  return Math.min(score, 100);
}

/**
 * Calculate activity score (0-100)
 * Based on recent activity levels
 */
async function calculateActivityScore(walletId) {
  const result = await pool.query(`
    SELECT 
      COUNT(CASE WHEN activity_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days,
      COUNT(CASE WHEN activity_date >= CURRENT_DATE - INTERVAL '14 days' THEN 1 END) as last_14_days,
      COUNT(CASE WHEN activity_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days,
      SUM(CASE WHEN activity_date >= CURRENT_DATE - INTERVAL '7 days' THEN transaction_count ELSE 0 END) as recent_tx_count,
      AVG(CASE WHEN activity_date >= CURRENT_DATE - INTERVAL '7 days' THEN sequence_complexity_score END) as recent_complexity
    FROM wallet_activity_metrics
    WHERE wallet_id = $1
    AND is_active = true
  `, [walletId]);

  const data = result.rows[0];
  if (!data) return 0;

  let score = 0;

  // Recent activity score (0-50 points)
  const last7Days = parseInt(data.last_7_days) || 0;
  if (last7Days >= 7) score += 50;
  else if (last7Days >= 5) score += 40;
  else if (last7Days >= 3) score += 30;
  else if (last7Days >= 2) score += 20;
  else if (last7Days >= 1) score += 10;

  // Transaction volume score (0-30 points)
  const recentTxCount = parseInt(data.recent_tx_count) || 0;
  if (recentTxCount >= 20) score += 30;
  else if (recentTxCount >= 10) score += 20;
  else if (recentTxCount >= 5) score += 15;
  else if (recentTxCount >= 2) score += 10;
  else if (recentTxCount >= 1) score += 5;

  // Complexity bonus (0-20 points)
  const complexity = parseFloat(data.recent_complexity) || 0;
  if (complexity >= 8) score += 20;
  else if (complexity >= 5) score += 15;
  else if (complexity >= 3) score += 10;
  else if (complexity >= 1) score += 5;

  return Math.min(score, 100);
}

/**
 * Determine status from total score
 */
function getStatusFromScore(score) {
  if (score >= STATUS_THRESHOLDS.healthy) return 'healthy';
  if (score >= STATUS_THRESHOLDS.at_risk) return 'at_risk';
  return 'churn';
}

/**
 * Determine risk level from total score
 */
function getRiskLevelFromScore(score) {
  if (score >= RISK_THRESHOLDS.low) return 'low';
  if (score >= RISK_THRESHOLDS.medium) return 'medium';
  return 'high';
}

/**
 * Get color indicators for each component
 */
function getColorIndicators(scores) {
  const getColor = (score) => {
    if (score >= 70) return 'green';
    if (score >= 40) return 'yellow';
    return 'red';
  };

  return {
    total: getColor(scores.total),
    retention: getColor(scores.retention),
    adoption: getColor(scores.adoption),
    churn: getColor(scores.churn),
    frequency: getColor(scores.frequency),
    activity: getColor(scores.activity)
  };
}

/**
 * Update productivity score in database
 */
async function updateProductivityScore(walletId, scoreData = null) {
  const scores = scoreData || await calculateEnhancedProductivityScore(walletId);
  
  const result = await pool.query(`
    INSERT INTO wallet_productivity_scores (
      wallet_id, total_score, retention_score, adoption_score,
      activity_score, diversity_score, status, risk_level
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (wallet_id) 
    DO UPDATE SET
      total_score = EXCLUDED.total_score,
      retention_score = EXCLUDED.retention_score,
      adoption_score = EXCLUDED.adoption_score,
      activity_score = EXCLUDED.activity_score,
      diversity_score = EXCLUDED.diversity_score,
      status = EXCLUDED.status,
      risk_level = EXCLUDED.risk_level,
      calculated_at = NOW()
    RETURNING *
  `, [
    walletId,
    scores.total_score,
    scores.component_scores.retention_score,
    scores.component_scores.adoption_score,
    scores.component_scores.activity_score,
    scores.component_scores.frequency_score, // Using frequency as diversity for now
    scores.status,
    scores.risk_level
  ]);

  return {
    ...result.rows[0],
    enhanced_scores: scores
  };
}

/**
 * Get productivity scores for multiple wallets
 */
async function getBulkProductivityScores(walletIds) {
  const scores = await Promise.allSettled(
    walletIds.map(id => calculateEnhancedProductivityScore(id))
  );

  return walletIds.map((walletId, index) => ({
    wallet_id: walletId,
    success: scores[index].status === 'fulfilled',
    scores: scores[index].status === 'fulfilled' ? scores[index].value : null,
    error: scores[index].status === 'rejected' ? scores[index].reason.message : null
  }));
}

/**
 * Get project-level productivity summary
 */
async function getProjectProductivitySummary(projectId) {
  const result = await pool.query(`
    SELECT 
      COUNT(w.id) as total_wallets,
      AVG(wps.total_score) as avg_score,
      COUNT(CASE WHEN wps.status = 'healthy' THEN 1 END) as healthy_count,
      COUNT(CASE WHEN wps.status = 'at_risk' THEN 1 END) as at_risk_count,
      COUNT(CASE WHEN wps.status = 'churn' THEN 1 END) as churn_count,
      COUNT(CASE WHEN wps.risk_level = 'low' THEN 1 END) as low_risk_count,
      COUNT(CASE WHEN wps.risk_level = 'medium' THEN 1 END) as medium_risk_count,
      COUNT(CASE WHEN wps.risk_level = 'high' THEN 1 END) as high_risk_count
    FROM wallets w
    LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
    WHERE w.project_id = $1
  `, [projectId]);

  const data = result.rows[0];
  
  return {
    project_id: projectId,
    total_wallets: parseInt(data.total_wallets),
    average_score: Math.round(parseFloat(data.avg_score) || 0),
    status_distribution: {
      healthy: parseInt(data.healthy_count),
      at_risk: parseInt(data.at_risk_count),
      churn: parseInt(data.churn_count)
    },
    risk_distribution: {
      low: parseInt(data.low_risk_count),
      medium: parseInt(data.medium_risk_count),
      high: parseInt(data.high_risk_count)
    },
    health_percentage: data.total_wallets > 0 ? 
      Math.round((parseInt(data.healthy_count) / parseInt(data.total_wallets)) * 100) : 0
  };
}

export {
  calculateEnhancedProductivityScore,
  updateProductivityScore,
  getBulkProductivityScores,
  getProjectProductivitySummary,
  SCORING_WEIGHTS,
  STATUS_THRESHOLDS,
  RISK_THRESHOLDS
};