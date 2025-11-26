import pool from '../db/db.js';

// =====================================================
// WALLET ACTIVITY METRICS
// =====================================================

async function createActivityMetric(walletId, activityData) {
  const {
    activity_date = new Date().toISOString().split('T')[0],
    transaction_count = 0,
    unique_days_active = 0,
    total_volume_zatoshi = 0,
    total_fees_paid = 0,
    transfers_count = 0,
    swaps_count = 0,
    bridges_count = 0,
    shielded_count = 0,
    is_active = false,
    is_returning = false,
    sequence_complexity_score = 0
  } = activityData;

  // Calculate days since wallet creation
  const walletResult = await pool.query('SELECT created_at FROM wallets WHERE id = $1', [walletId]);
  if (!walletResult.rows[0]) {
    throw new Error('Wallet not found');
  }
  
  const daysSinceCreation = Math.floor(
    (new Date(activity_date) - new Date(walletResult.rows[0].created_at)) / (1000 * 60 * 60 * 24)
  );

  const result = await pool.query(
    `INSERT INTO wallet_activity_metrics (
      wallet_id, activity_date, transaction_count, unique_days_active,
      total_volume_zatoshi, total_fees_paid, transfers_count, swaps_count,
      bridges_count, shielded_count, is_active, is_returning,
      days_since_creation, sequence_complexity_score
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (wallet_id, activity_date) 
    DO UPDATE SET
      transaction_count = EXCLUDED.transaction_count,
      total_volume_zatoshi = EXCLUDED.total_volume_zatoshi,
      total_fees_paid = EXCLUDED.total_fees_paid,
      transfers_count = EXCLUDED.transfers_count,
      swaps_count = EXCLUDED.swaps_count,
      bridges_count = EXCLUDED.bridges_count,
      shielded_count = EXCLUDED.shielded_count,
      is_active = EXCLUDED.is_active,
      is_returning = EXCLUDED.is_returning,
      sequence_complexity_score = EXCLUDED.sequence_complexity_score,
      updated_at = NOW()
    RETURNING *`,
    [
      walletId, activity_date, transaction_count, unique_days_active,
      total_volume_zatoshi, total_fees_paid, transfers_count, swaps_count,
      bridges_count, shielded_count, is_active, is_returning,
      daysSinceCreation, sequence_complexity_score
    ]
  );

  return result.rows[0];
}

async function getActivityMetrics(walletId, startDate, endDate) {
  const result = await pool.query(
    `SELECT * FROM wallet_activity_metrics 
     WHERE wallet_id = $1 
     AND activity_date BETWEEN $2 AND $3
     ORDER BY activity_date DESC`,
    [walletId, startDate, endDate]
  );
  return result.rows;
}

async function getWalletActivitySummary(walletId, days = 30) {
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total_days,
      SUM(transaction_count) as total_transactions,
      SUM(total_volume_zatoshi) as total_volume,
      SUM(total_fees_paid) as total_fees,
      COUNT(CASE WHEN is_active THEN 1 END) as active_days,
      AVG(sequence_complexity_score) as avg_complexity
     FROM wallet_activity_metrics 
     WHERE wallet_id = $1 
     AND activity_date >= CURRENT_DATE - INTERVAL '${days} days'`,
    [walletId]
  );
  return result.rows[0];
}

// =====================================================
// COHORT MANAGEMENT
// =====================================================

async function createCohort(cohortType, cohortPeriod) {
  const result = await pool.query(
    `INSERT INTO wallet_cohorts (cohort_type, cohort_period, wallet_count)
     VALUES ($1, $2, 0)
     ON CONFLICT (cohort_type, cohort_period) 
     DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [cohortType, cohortPeriod]
  );
  return result.rows[0];
}

async function assignWalletToCohort(walletId, cohortId) {
  const result = await pool.query(
    `INSERT INTO wallet_cohort_assignments (wallet_id, cohort_id)
     VALUES ($1, $2)
     ON CONFLICT (wallet_id, cohort_id) DO NOTHING
     RETURNING *`,
    [walletId, cohortId]
  );
  return result.rows[0];
}

async function getCohortRetentionData(cohortType = 'weekly', limit = 10) {
  const result = await pool.query(
    `SELECT * FROM weekly_cohort_retention 
     ORDER BY cohort_period DESC 
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function updateCohortRetention(cohortId) {
  // Calculate retention rates for the cohort
  const result = await pool.query(
    `WITH cohort_wallets AS (
      SELECT wca.wallet_id, wc.cohort_period
      FROM wallet_cohort_assignments wca
      JOIN wallet_cohorts wc ON wca.cohort_id = wc.id
      WHERE wc.id = $1
    ),
    weekly_activity AS (
      SELECT 
        cw.wallet_id,
        EXTRACT(WEEK FROM wam.activity_date) - EXTRACT(WEEK FROM cw.cohort_period) as week_number
      FROM cohort_wallets cw
      JOIN wallet_activity_metrics wam ON cw.wallet_id = wam.wallet_id
      WHERE wam.is_active = true
    )
    UPDATE wallet_cohorts SET
      retention_week_1 = (
        SELECT ROUND(100.0 * COUNT(DISTINCT wallet_id) / wallet_count, 2)
        FROM weekly_activity WHERE week_number = 1
      ),
      retention_week_2 = (
        SELECT ROUND(100.0 * COUNT(DISTINCT wallet_id) / wallet_count, 2)
        FROM weekly_activity WHERE week_number = 2
      ),
      retention_week_3 = (
        SELECT ROUND(100.0 * COUNT(DISTINCT wallet_id) / wallet_count, 2)
        FROM weekly_activity WHERE week_number = 3
      ),
      retention_week_4 = (
        SELECT ROUND(100.0 * COUNT(DISTINCT wallet_id) / wallet_count, 2)
        FROM weekly_activity WHERE week_number = 4
      ),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *`,
    [cohortId]
  );
  return result.rows[0];
}

// =====================================================
// PRODUCTIVITY SCORING
// =====================================================

async function calculateProductivityScore(walletId) {
  // Use the database function to calculate retention score
  const retentionResult = await pool.query(
    'SELECT calculate_wallet_retention_score($1) as retention_score',
    [walletId]
  );
  
  const retentionScore = retentionResult.rows[0].retention_score || 0;
  
  // Calculate adoption score based on activity history (simplified for now)
  const adoptionResult = await pool.query(
    `SELECT 
      CASE 
        WHEN COUNT(*) >= 30 THEN 100
        WHEN COUNT(*) >= 15 THEN 75
        WHEN COUNT(*) >= 7 THEN 50
        WHEN COUNT(*) >= 3 THEN 25
        ELSE 0
      END as adoption_score
     FROM wallet_activity_metrics 
     WHERE wallet_id = $1 AND is_active = true`,
    [walletId]
  );
  
  const adoptionScore = adoptionResult.rows[0].adoption_score || 0;
  
  // Calculate activity score based on recent activity
  const activityResult = await pool.query(
    `SELECT 
      CASE 
        WHEN COUNT(*) >= 7 THEN 100
        WHEN COUNT(*) >= 4 THEN 75
        WHEN COUNT(*) >= 2 THEN 50
        WHEN COUNT(*) >= 1 THEN 25
        ELSE 0
      END as activity_score
     FROM wallet_activity_metrics 
     WHERE wallet_id = $1 
     AND activity_date >= CURRENT_DATE - INTERVAL '7 days'
     AND is_active = true`,
    [walletId]
  );
  
  const activityScore = activityResult.rows[0].activity_score || 0;
  
  // Calculate diversity score based on transaction types
  const diversityResult = await pool.query(
    `SELECT 
      (CASE WHEN SUM(transfers_count) > 0 THEN 25 ELSE 0 END +
       CASE WHEN SUM(swaps_count) > 0 THEN 25 ELSE 0 END +
       CASE WHEN SUM(bridges_count) > 0 THEN 25 ELSE 0 END +
       CASE WHEN SUM(shielded_count) > 0 THEN 25 ELSE 0 END) as diversity_score
     FROM wallet_activity_metrics 
     WHERE wallet_id = $1 
     AND activity_date >= CURRENT_DATE - INTERVAL '30 days'`,
    [walletId]
  );
  
  const diversityScore = diversityResult.rows[0].diversity_score || 0;
  
  // Calculate total score (weighted average)
  const totalScore = Math.round(
    (retentionScore * 0.3) + 
    (adoptionScore * 0.25) + 
    (activityScore * 0.25) + 
    (diversityScore * 0.2)
  );
  
  // Determine status and risk level
  let status = 'healthy';
  let riskLevel = 'low';
  
  if (totalScore < 30) {
    status = 'churn';
    riskLevel = 'high';
  } else if (totalScore < 60) {
    status = 'at_risk';
    riskLevel = 'medium';
  }
  
  return {
    total_score: totalScore,
    retention_score: retentionScore,
    adoption_score: adoptionScore,
    activity_score: activityScore,
    diversity_score: diversityScore,
    status,
    risk_level: riskLevel
  };
}

async function updateProductivityScore(walletId) {
  const scores = await calculateProductivityScore(walletId);
  
  const result = await pool.query(
    `INSERT INTO wallet_productivity_scores (
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
    RETURNING *`,
    [
      walletId, scores.total_score, scores.retention_score, scores.adoption_score,
      scores.activity_score, scores.diversity_score, scores.status, scores.risk_level
    ]
  );
  
  return result.rows[0];
}

async function getProductivityScore(walletId) {
  const result = await pool.query(
    'SELECT * FROM wallet_productivity_scores WHERE wallet_id = $1',
    [walletId]
  );
  return result.rows[0];
}

// =====================================================
// PROCESSED TRANSACTIONS
// =====================================================

async function saveProcessedTransaction(transactionData) {
  const {
    wallet_id,
    txid,
    block_height,
    block_timestamp,
    tx_type,
    tx_subtype,
    value_zatoshi = 0,
    fee_zatoshi = 0,
    usd_value_at_time,
    counterparty_address,
    counterparty_type,
    feature_used,
    sequence_position,
    session_id,
    time_since_previous_tx_minutes,
    is_shielded = false,
    shielded_pool_entry = false,
    shielded_pool_exit = false
  } = transactionData;

  const result = await pool.query(
    `INSERT INTO processed_transactions (
      wallet_id, txid, block_height, block_timestamp, tx_type, tx_subtype,
      value_zatoshi, fee_zatoshi, usd_value_at_time, counterparty_address,
      counterparty_type, feature_used, sequence_position, session_id,
      time_since_previous_tx_minutes, is_shielded, shielded_pool_entry, shielded_pool_exit
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    ON CONFLICT (wallet_id, txid) 
    DO UPDATE SET
      tx_type = EXCLUDED.tx_type,
      tx_subtype = EXCLUDED.tx_subtype,
      counterparty_type = EXCLUDED.counterparty_type,
      feature_used = EXCLUDED.feature_used,
      processed_at = NOW()
    RETURNING *`,
    [
      wallet_id, txid, block_height, block_timestamp, tx_type, tx_subtype,
      value_zatoshi, fee_zatoshi, usd_value_at_time, counterparty_address,
      counterparty_type, feature_used, sequence_position, session_id,
      time_since_previous_tx_minutes, is_shielded, shielded_pool_entry, shielded_pool_exit
    ]
  );

  return result.rows[0];
}

async function getWalletTransactions(walletId, limit = 100, offset = 0) {
  const result = await pool.query(
    `SELECT * FROM processed_transactions 
     WHERE wallet_id = $1 
     ORDER BY block_timestamp DESC 
     LIMIT $2 OFFSET $3`,
    [walletId, limit, offset]
  );
  return result.rows;
}

// =====================================================
// DASHBOARD ANALYTICS
// =====================================================

async function getWalletHealthDashboard() {
  const result = await pool.query('SELECT * FROM wallet_health_dashboard');
  return result.rows;
}

async function getProjectAnalyticsSummary(projectId) {
  const result = await pool.query(
    `SELECT 
      COUNT(w.id) as total_wallets,
      COUNT(CASE WHEN w.is_active THEN 1 END) as active_wallets,
      AVG(wps.total_score) as avg_productivity_score,
      COUNT(CASE WHEN wps.status = 'healthy' THEN 1 END) as healthy_wallets,
      COUNT(CASE WHEN wps.status = 'at_risk' THEN 1 END) as at_risk_wallets,
      COUNT(CASE WHEN wps.status = 'churn' THEN 1 END) as churn_wallets
     FROM wallets w
     LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
     WHERE w.project_id = $1`,
    [projectId]
  );
  return result.rows[0];
}

// =====================================================
// ADOPTION STAGE TRACKING
// =====================================================

async function getWalletAdoptionStages(walletId) {
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
  return result.rows;
}

async function updateAdoptionStage(walletId, stageName, achievedAt, timeToAchieveHours, conversionProbability) {
  const result = await pool.query(
    `UPDATE wallet_adoption_stages 
     SET achieved_at = $1, time_to_achieve_hours = $2, conversion_probability = $3
     WHERE wallet_id = $4 AND stage_name = $5
     RETURNING *`,
    [achievedAt, timeToAchieveHours, conversionProbability, walletId, stageName]
  );
  return result.rows[0];
}

async function getProjectAdoptionMetrics(projectId) {
  const result = await pool.query(
    `SELECT 
       was.stage_name,
       COUNT(*) as total_wallets,
       COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) as achieved_wallets,
       ROUND(100.0 * COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) / COUNT(*), 2) as conversion_rate,
       AVG(CASE WHEN was.achieved_at IS NOT NULL THEN was.time_to_achieve_hours END) as avg_time_to_achieve_hours
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

// =====================================================
// INITIALIZATION FUNCTIONS
// =====================================================

async function initializeWalletAnalytics(walletId) {
  try {
    await pool.query('SELECT initialize_wallet_analytics($1)', [walletId]);
    return { success: true, message: 'Analytics initialized for wallet' };
  } catch (error) {
    throw new Error(`Failed to initialize analytics: ${error.message}`);
  }
}

export {
  // Activity metrics
  createActivityMetric,
  getActivityMetrics,
  getWalletActivitySummary,
  
  // Cohort management
  createCohort,
  assignWalletToCohort,
  getCohortRetentionData,
  updateCohortRetention,
  
  // Productivity scoring
  calculateProductivityScore,
  updateProductivityScore,
  getProductivityScore,
  
  // Transaction processing
  saveProcessedTransaction,
  getWalletTransactions,
  
  // Adoption stage tracking
  getWalletAdoptionStages,
  updateAdoptionStage,
  getProjectAdoptionMetrics,
  
  // Dashboard analytics
  getWalletHealthDashboard,
  getProjectAnalyticsSummary,
  
  // Initialization
  initializeWalletAnalytics
};