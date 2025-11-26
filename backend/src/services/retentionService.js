import pool from '../db/db.js';

/**
 * Retention Calculation Engine
 * Calculates retention percentages, generates heatmap data, and tracks retention trends
 */

/**
 * Calculate retention rates for a specific cohort
 */
async function calculateCohortRetention(cohortId) {
  try {
    console.log(`Calculating retention for cohort ${cohortId}...`);

    // Get cohort information
    const cohortResult = await pool.query(`
      SELECT wc.*, COUNT(wca.wallet_id) as wallet_count
      FROM wallet_cohorts wc
      LEFT JOIN wallet_cohort_assignments wca ON wc.id = wca.cohort_id
      WHERE wc.id = $1
      GROUP BY wc.id, wc.cohort_type, wc.cohort_period, wc.wallet_count,
               wc.retention_week_1, wc.retention_week_2, wc.retention_week_3, wc.retention_week_4,
               wc.created_at, wc.updated_at
    `, [cohortId]);

    if (!cohortResult.rows[0]) {
      throw new Error(`Cohort ${cohortId} not found`);
    }

    const cohort = cohortResult.rows[0];
    const totalWallets = parseInt(cohort.wallet_count);

    if (totalWallets === 0) {
      console.log(`Cohort ${cohortId} has no wallets, skipping retention calculation`);
      return null;
    }

    console.log(`Cohort ${cohort.cohort_type} ${cohort.cohort_period} has ${totalWallets} wallets`);

    // Calculate retention for each week
    const retentionRates = {};
    
    for (let week = 1; week <= 4; week++) {
      const retentionRate = await calculateWeeklyRetention(cohortId, week);
      retentionRates[`week_${week}`] = retentionRate;
    }

    // Update cohort with calculated retention rates
    await pool.query(`
      UPDATE wallet_cohorts 
      SET 
        retention_week_1 = $2,
        retention_week_2 = $3,
        retention_week_3 = $4,
        retention_week_4 = $5,
        updated_at = NOW()
      WHERE id = $1
    `, [
      cohortId,
      retentionRates.week_1,
      retentionRates.week_2,
      retentionRates.week_3,
      retentionRates.week_4
    ]);

    console.log(`Updated retention rates for cohort ${cohortId}:`, retentionRates);
    return retentionRates;

  } catch (error) {
    console.error(`Error calculating retention for cohort ${cohortId}:`, error);
    throw error;
  }
}

/**
 * Calculate retention rate for a specific week after cohort creation
 */
async function calculateWeeklyRetention(cohortId, weekNumber) {
  try {
    // Get cohort information
    const cohortResult = await pool.query(`
      SELECT cohort_period, cohort_type, wallet_count
      FROM wallet_cohorts 
      WHERE id = $1
    `, [cohortId]);

    if (!cohortResult.rows[0]) {
      return 0;
    }

    const { cohort_period, cohort_type, wallet_count } = cohortResult.rows[0];
    const totalWallets = parseInt(wallet_count);

    if (totalWallets === 0) {
      return 0;
    }

    // Calculate the target week period
    const cohortStart = new Date(cohort_period);
    const targetWeekStart = new Date(cohortStart);
    targetWeekStart.setDate(targetWeekStart.getDate() + (weekNumber - 1) * 7);
    
    const targetWeekEnd = new Date(targetWeekStart);
    targetWeekEnd.setDate(targetWeekEnd.getDate() + 6);

    console.log(`Calculating week ${weekNumber} retention for cohort ${cohortId}`);
    console.log(`Target week: ${targetWeekStart.toISOString().split('T')[0]} to ${targetWeekEnd.toISOString().split('T')[0]}`);

    // Count active wallets in the target week
    const activeWalletsResult = await pool.query(`
      SELECT COUNT(DISTINCT wam.wallet_id) as active_count
      FROM wallet_cohort_assignments wca
      JOIN wallet_activity_metrics wam ON wca.wallet_id = wam.wallet_id
      WHERE wca.cohort_id = $1
      AND wam.activity_date BETWEEN $2 AND $3
      AND wam.is_active = true
    `, [cohortId, targetWeekStart.toISOString().split('T')[0], targetWeekEnd.toISOString().split('T')[0]]);

    const activeWallets = parseInt(activeWalletsResult.rows[0].active_count || 0);
    const retentionRate = totalWallets > 0 ? (activeWallets / totalWallets) * 100 : 0;

    console.log(`Week ${weekNumber}: ${activeWallets}/${totalWallets} wallets active = ${retentionRate.toFixed(2)}%`);
    return Math.round(retentionRate * 100) / 100; // Round to 2 decimal places

  } catch (error) {
    console.error(`Error calculating weekly retention for cohort ${cohortId}, week ${weekNumber}:`, error);
    return 0;
  }
}

/**
 * Calculate retention for all cohorts
 */
async function calculateAllCohortRetention(cohortType = null) {
  try {
    console.log(`🔄 Calculating retention for all ${cohortType || 'all'} cohorts...`);

    let query = 'SELECT id FROM wallet_cohorts';
    const params = [];

    if (cohortType) {
      query += ' WHERE cohort_type = $1';
      params.push(cohortType);
    }

    query += ' ORDER BY cohort_period DESC';

    const cohortsResult = await pool.query(query, params);
    const cohorts = cohortsResult.rows;

    console.log(`Found ${cohorts.length} cohorts to process`);

    const results = [];
    for (const cohort of cohorts) {
      try {
        const retentionRates = await calculateCohortRetention(cohort.id);
        if (retentionRates) {
          results.push({ cohortId: cohort.id, retentionRates });
        }
      } catch (error) {
        console.error(`Failed to calculate retention for cohort ${cohort.id}:`, error.message);
      }
    }

    console.log(`✅ Successfully calculated retention for ${results.length} cohorts`);
    return results;

  } catch (error) {
    console.error('❌ Error in calculateAllCohortRetention:', error);
    throw error;
  }
}

/**
 * Get retention heatmap data for visualization
 */
async function getRetentionHeatmapData(cohortType = 'weekly', limit = 20) {
  try {
    const result = await pool.query(`
      SELECT 
        cohort_period,
        wallet_count as new_users,
        retention_week_1 as week_1,
        retention_week_2 as week_2,
        retention_week_3 as week_3,
        retention_week_4 as week_4,
        created_at,
        updated_at
      FROM wallet_cohorts
      WHERE cohort_type = $1
      AND wallet_count > 0
      ORDER BY cohort_period DESC
      LIMIT $2
    `, [cohortType, limit]);

    return result.rows;
  } catch (error) {
    console.error(`Error getting retention heatmap data:`, error);
    throw error;
  }
}

/**
 * Analyze retention trends over time
 */
async function analyzeRetentionTrends(cohortType = 'weekly', periodCount = 12) {
  try {
    const result = await pool.query(`
      SELECT 
        cohort_period,
        wallet_count,
        retention_week_1,
        retention_week_2,
        retention_week_3,
        retention_week_4,
        (retention_week_1 + retention_week_2 + retention_week_3 + retention_week_4) / 4 as avg_retention
      FROM wallet_cohorts
      WHERE cohort_type = $1
      AND wallet_count > 0
      AND retention_week_1 IS NOT NULL
      ORDER BY cohort_period DESC
      LIMIT $2
    `, [cohortType, periodCount]);

    const trends = result.rows;

    if (trends.length < 2) {
      return { trends, analysis: 'Insufficient data for trend analysis' };
    }

    // Calculate trend analysis
    const recentAvg = trends.slice(0, Math.ceil(trends.length / 2))
      .reduce((sum, t) => sum + (parseFloat(t.avg_retention) || 0), 0) / Math.ceil(trends.length / 2);

    const olderAvg = trends.slice(Math.ceil(trends.length / 2))
      .reduce((sum, t) => sum + (parseFloat(t.avg_retention) || 0), 0) / Math.floor(trends.length / 2);

    const trendDirection = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable';
    const trendMagnitude = Math.abs(recentAvg - olderAvg);

    const analysis = {
      recent_avg_retention: Math.round(recentAvg * 100) / 100,
      older_avg_retention: Math.round(olderAvg * 100) / 100,
      trend_direction: trendDirection,
      trend_magnitude: Math.round(trendMagnitude * 100) / 100,
      periods_analyzed: trends.length
    };

    return { trends, analysis };

  } catch (error) {
    console.error('Error analyzing retention trends:', error);
    throw error;
  }
}

/**
 * Compare retention between new and returning wallets
 */
async function compareNewVsReturningRetention(cohortId) {
  try {
    // Get cohort period
    const cohortResult = await pool.query(`
      SELECT cohort_period FROM wallet_cohorts WHERE id = $1
    `, [cohortId]);

    if (!cohortResult.rows[0]) {
      throw new Error(`Cohort ${cohortId} not found`);
    }

    const cohortPeriod = cohortResult.rows[0].cohort_period;

    // Analyze retention patterns for new vs returning wallets
    const result = await pool.query(`
      SELECT 
        wam.is_returning,
        COUNT(DISTINCT wam.wallet_id) as wallet_count,
        AVG(CASE WHEN wam.is_active THEN 1.0 ELSE 0.0 END) * 100 as avg_activity_rate,
        COUNT(DISTINCT wam.activity_date) as total_active_days
      FROM wallet_cohort_assignments wca
      JOIN wallet_activity_metrics wam ON wca.wallet_id = wam.wallet_id
      WHERE wca.cohort_id = $1
      AND wam.activity_date >= $2
      AND wam.activity_date <= $2::date + INTERVAL '28 days'
      GROUP BY wam.is_returning
    `, [cohortId, cohortPeriod]);

    const comparison = {
      new_wallets: result.rows.find(r => !r.is_returning) || { wallet_count: 0, avg_activity_rate: 0 },
      returning_wallets: result.rows.find(r => r.is_returning) || { wallet_count: 0, avg_activity_rate: 0 }
    };

    return comparison;

  } catch (error) {
    console.error(`Error comparing new vs returning retention for cohort ${cohortId}:`, error);
    throw error;
  }
}

/**
 * Get retention statistics summary
 */
async function getRetentionStatistics(cohortType = null) {
  try {
    let query = `
      SELECT 
        cohort_type,
        COUNT(*) as total_cohorts,
        AVG(wallet_count) as avg_cohort_size,
        AVG(retention_week_1) as avg_week_1_retention,
        AVG(retention_week_2) as avg_week_2_retention,
        AVG(retention_week_3) as avg_week_3_retention,
        AVG(retention_week_4) as avg_week_4_retention,
        MIN(cohort_period) as earliest_cohort,
        MAX(cohort_period) as latest_cohort
      FROM wallet_cohorts
      WHERE wallet_count > 0
      AND retention_week_1 IS NOT NULL
    `;

    const params = [];
    if (cohortType) {
      query += ' AND cohort_type = $1';
      params.push(cohortType);
    }

    query += ' GROUP BY cohort_type ORDER BY cohort_type';

    const result = await pool.query(query, params);
    return result.rows;

  } catch (error) {
    console.error('Error getting retention statistics:', error);
    throw error;
  }
}

/**
 * Identify cohorts with significant retention changes
 */
async function identifyRetentionAnomalies(cohortType = 'weekly', threshold = 10) {
  try {
    const result = await pool.query(`
      WITH cohort_changes AS (
        SELECT 
          wc1.id,
          wc1.cohort_period,
          wc1.retention_week_1,
          wc2.retention_week_1 as prev_retention_week_1,
          wc1.retention_week_1 - wc2.retention_week_1 as retention_change,
          wc1.wallet_count
        FROM wallet_cohorts wc1
        JOIN wallet_cohorts wc2 ON (
          wc2.cohort_type = wc1.cohort_type AND
          wc2.cohort_period < wc1.cohort_period
        )
        WHERE wc1.cohort_type = $1
        AND wc1.retention_week_1 IS NOT NULL
        AND wc2.retention_week_1 IS NOT NULL
        AND wc1.wallet_count > 0
        ORDER BY wc1.cohort_period DESC, wc2.cohort_period DESC
      )
      SELECT DISTINCT ON (id) *
      FROM cohort_changes
      WHERE ABS(retention_change) >= $2
      ORDER BY id, cohort_period DESC
    `, [cohortType, threshold]);

    return result.rows;

  } catch (error) {
    console.error('Error identifying retention anomalies:', error);
    throw error;
  }
}

export {
  calculateCohortRetention,
  calculateWeeklyRetention,
  calculateAllCohortRetention,
  getRetentionHeatmapData,
  analyzeRetentionTrends,
  compareNewVsReturningRetention,
  getRetentionStatistics,
  identifyRetentionAnomalies
};