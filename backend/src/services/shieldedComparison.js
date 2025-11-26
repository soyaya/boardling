import pool from '../db/db.js';

// =====================================================
// SHIELDED VS TRANSPARENT USER COMPARISON SERVICE
// =====================================================
// Provides retention and engagement comparisons between user types,
// calculates correlation between shielded usage and retention,
// and generates comparative analytics for privacy-focused users
// =====================================================

/**
 * User classification types based on privacy usage
 */
const USER_TYPES = {
  SHIELDED_HEAVY: 'shielded_heavy',         // >70% shielded transactions
  SHIELDED_MODERATE: 'shielded_moderate',   // 30-70% shielded transactions
  SHIELDED_LIGHT: 'shielded_light',         // 5-30% shielded transactions
  TRANSPARENT_ONLY: 'transparent_only'      // 0-5% shielded transactions
};

/**
 * Comparison metrics categories
 */
const COMPARISON_METRICS = {
  RETENTION: 'retention',
  ENGAGEMENT: 'engagement',
  TRANSACTION_BEHAVIOR: 'transaction_behavior',
  LOYALTY: 'loyalty',
  LIFECYCLE: 'lifecycle'
};

// =====================================================
// CORE COMPARISON FUNCTIONS
// =====================================================

/**
 * Comprehensive comparison between shielded and transparent users
 */
async function compareShieldedVsTransparentUsers(projectId, timeRange = 30) {
  try {
    console.log(`Starting comprehensive shielded vs transparent comparison for project ${projectId}`);
    
    const endDate = new Date();
    const startDate = new Date(endDate - timeRange * 24 * 60 * 60 * 1000);
    
    // Classify users by privacy usage patterns
    const userClassification = await classifyUsersByPrivacyUsage(projectId, startDate, endDate);
    
    // Calculate detailed metrics for each user type
    const detailedMetrics = await calculateDetailedMetrics(userClassification, startDate, endDate);
    
    // Perform retention analysis
    const retentionAnalysis = await analyzeRetentionByUserType(userClassification, timeRange);
    
    // Analyze engagement patterns
    const engagementAnalysis = await analyzeEngagementPatterns(userClassification, startDate, endDate);
    
    // Calculate correlation between shielded usage and various metrics
    const correlationAnalysis = await calculateShieldedCorrelations(projectId, startDate, endDate);
    
    // Generate insights and recommendations
    const insights = generateComparisonInsights(
      userClassification, 
      detailedMetrics, 
      retentionAnalysis, 
      engagementAnalysis, 
      correlationAnalysis
    );
    
    const comparison = {
      project_id: projectId,
      analysis_period: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        days: timeRange
      },
      user_classification: userClassification,
      detailed_metrics: detailedMetrics,
      retention_analysis: retentionAnalysis,
      engagement_analysis: engagementAnalysis,
      correlation_analysis: correlationAnalysis,
      insights: insights,
      analyzed_at: new Date().toISOString()
    };
    
    console.log(`Comparison completed: ${userClassification.total_users} users analyzed`);
    return comparison;
    
  } catch (error) {
    console.error('Error in comprehensive shielded vs transparent comparison:', error);
    throw error;
  }
}/**

 * Classify users by their privacy usage patterns
 */
async function classifyUsersByPrivacyUsage(projectId, startDate, endDate) {
  try {
    console.log('Classifying users by privacy usage patterns...');
    
    // Get all wallets with their shielded transaction percentages
    const result = await pool.query(`
      WITH wallet_privacy_stats AS (
        SELECT 
          w.id as wallet_id,
          w.address,
          w.type as wallet_type,
          w.created_at,
          COUNT(pt.id) as total_transactions,
          COUNT(pt.id) FILTER (WHERE pt.is_shielded = true) as shielded_transactions,
          CASE 
            WHEN COUNT(pt.id) = 0 THEN 0
            ELSE ROUND((COUNT(pt.id) FILTER (WHERE pt.is_shielded = true)::DECIMAL / COUNT(pt.id)) * 100, 2)
          END as shielded_percentage,
          SUM(ABS(pt.value_zatoshi)) as total_volume,
          COUNT(DISTINCT DATE(pt.block_timestamp)) as active_days
        FROM wallets w
        LEFT JOIN processed_transactions pt ON w.id = pt.wallet_id
          AND pt.block_timestamp >= $2
          AND pt.block_timestamp <= $3
        WHERE w.project_id = $1 AND w.is_active = true
        GROUP BY w.id, w.address, w.type, w.created_at
        HAVING COUNT(pt.id) > 0
      )
      SELECT 
        wallet_id,
        address,
        wallet_type,
        created_at,
        total_transactions,
        shielded_transactions,
        shielded_percentage,
        total_volume,
        active_days,
        CASE 
          WHEN shielded_percentage > 70 THEN 'shielded_heavy'
          WHEN shielded_percentage > 30 THEN 'shielded_moderate'
          WHEN shielded_percentage > 5 THEN 'shielded_light'
          ELSE 'transparent_only'
        END as user_type
      FROM wallet_privacy_stats
      ORDER BY shielded_percentage DESC, total_transactions DESC
    `, [projectId, startDate, endDate]);
    
    const wallets = result.rows;
    
    // Group wallets by user type
    const classification = {
      total_users: wallets.length,
      [USER_TYPES.SHIELDED_HEAVY]: [],
      [USER_TYPES.SHIELDED_MODERATE]: [],
      [USER_TYPES.SHIELDED_LIGHT]: [],
      [USER_TYPES.TRANSPARENT_ONLY]: [],
      distribution: {}
    };
    
    wallets.forEach(wallet => {
      classification[wallet.user_type].push(wallet);
    });
    
    // Calculate distribution percentages
    Object.values(USER_TYPES).forEach(type => {
      const count = classification[type].length;
      classification.distribution[type] = {
        count: count,
        percentage: classification.total_users > 0 ? 
          Math.round((count / classification.total_users) * 100 * 100) / 100 : 0
      };
    });
    
    console.log(`User classification completed: ${classification.total_users} users classified`);
    return classification;
    
  } catch (error) {
    console.error('Error classifying users by privacy usage:', error);
    throw error;
  }
}

/**
 * Calculate detailed metrics for each user type
 */
async function calculateDetailedMetrics(userClassification, startDate, endDate) {
  try {
    console.log('Calculating detailed metrics for each user type...');
    
    const metrics = {};
    
    for (const userType of Object.values(USER_TYPES)) {
      const wallets = userClassification[userType];
      
      if (wallets.length === 0) {
        metrics[userType] = {
          count: 0,
          avg_transactions_per_user: 0,
          avg_volume_per_user: 0,
          avg_active_days: 0,
          avg_shielded_percentage: 0,
          median_transaction_count: 0,
          total_volume: 0,
          total_transactions: 0
        };
        continue;
      }
      
      const walletIds = wallets.map(w => w.wallet_id);
      
      // Get detailed transaction metrics
      const metricsResult = await pool.query(`
        SELECT 
          COUNT(pt.id) as total_transactions,
          SUM(ABS(pt.value_zatoshi)) as total_volume,
          COUNT(DISTINCT DATE(pt.block_timestamp)) as total_active_days,
          COUNT(DISTINCT pt.wallet_id) as active_wallets,
          AVG(ABS(pt.value_zatoshi)) as avg_transaction_value,
          COUNT(pt.id) FILTER (WHERE pt.is_shielded = true) as total_shielded_transactions
        FROM processed_transactions pt
        WHERE pt.wallet_id = ANY($1)
        AND pt.block_timestamp >= $2
        AND pt.block_timestamp <= $3
      `, [walletIds, startDate, endDate]);
      
      const data = metricsResult.rows[0];
      const userCount = wallets.length;
      
      // Calculate averages and additional metrics
      const totalTx = parseInt(data.total_transactions) || 0;
      const totalVolume = parseInt(data.total_volume) || 0;
      const totalShielded = parseInt(data.total_shielded_transactions) || 0;
      
      metrics[userType] = {
        count: userCount,
        avg_transactions_per_user: Math.round((totalTx / userCount) * 100) / 100,
        avg_volume_per_user: Math.round(totalVolume / userCount),
        avg_active_days: Math.round((parseInt(data.total_active_days) / userCount) * 100) / 100,
        avg_shielded_percentage: wallets.reduce((sum, w) => sum + w.shielded_percentage, 0) / userCount,
        avg_transaction_value: Math.round(parseFloat(data.avg_transaction_value) || 0),
        median_transaction_count: calculateMedian(wallets.map(w => w.total_transactions)),
        total_volume: totalVolume,
        total_transactions: totalTx,
        total_shielded_transactions: totalShielded,
        shielded_ratio: totalTx > 0 ? Math.round((totalShielded / totalTx) * 100 * 100) / 100 : 0
      };
    }
    
    console.log('Detailed metrics calculation completed');
    return metrics;
    
  } catch (error) {
    console.error('Error calculating detailed metrics:', error);
    throw error;
  }
}

/**
 * Analyze retention patterns by user type
 */
async function analyzeRetentionByUserType(userClassification, timeRange) {
  try {
    console.log('Analyzing retention patterns by user type...');
    
    const retentionAnalysis = {};
    
    for (const userType of Object.values(USER_TYPES)) {
      const wallets = userClassification[userType];
      
      if (wallets.length === 0) {
        retentionAnalysis[userType] = {
          week_1: 0, week_2: 0, week_3: 0, week_4: 0,
          avg_retention: 0, retention_trend: 'stable'
        };
        continue;
      }
      
      const walletIds = wallets.map(w => w.wallet_id);
      const retention = await calculateGroupRetention(walletIds, timeRange);
      
      // Calculate retention trend
      const retentionTrend = calculateRetentionTrend([
        retention.week_1, retention.week_2, retention.week_3, retention.week_4
      ]);
      
      retentionAnalysis[userType] = {
        ...retention,
        avg_retention: Math.round(((retention.week_1 + retention.week_2 + retention.week_3 + retention.week_4) / 4) * 100) / 100,
        retention_trend: retentionTrend
      };
    }
    
    console.log('Retention analysis completed');
    return retentionAnalysis;
    
  } catch (error) {
    console.error('Error analyzing retention by user type:', error);
    throw error;
  }
}

/**
 * Analyze engagement patterns by user type
 */
async function analyzeEngagementPatterns(userClassification, startDate, endDate) {
  try {
    console.log('Analyzing engagement patterns by user type...');
    
    const engagementAnalysis = {};
    
    for (const userType of Object.values(USER_TYPES)) {
      const wallets = userClassification[userType];
      
      if (wallets.length === 0) {
        engagementAnalysis[userType] = {
          avg_session_duration_hours: 0,
          avg_transactions_per_session: 0,
          avg_days_between_transactions: 0,
          engagement_consistency: 0,
          peak_activity_pattern: 'none'
        };
        continue;
      }
      
      const walletIds = wallets.map(w => w.wallet_id);
      
      // Calculate session-based engagement metrics
      const sessionResult = await pool.query(`
        WITH wallet_sessions AS (
          SELECT 
            wallet_id,
            DATE(block_timestamp) as activity_date,
            COUNT(*) as daily_transactions,
            EXTRACT(EPOCH FROM (MAX(block_timestamp) - MIN(block_timestamp))) / 3600 as session_duration_hours
          FROM processed_transactions
          WHERE wallet_id = ANY($1)
          AND block_timestamp >= $2
          AND block_timestamp <= $3
          GROUP BY wallet_id, DATE(block_timestamp)
        ),
        wallet_gaps AS (
          SELECT 
            wallet_id,
            activity_date,
            LAG(activity_date) OVER (PARTITION BY wallet_id ORDER BY activity_date) as prev_date,
            daily_transactions,
            session_duration_hours
          FROM wallet_sessions
        )
        SELECT 
          AVG(session_duration_hours) as avg_session_duration,
          AVG(daily_transactions) as avg_transactions_per_session,
          AVG(EXTRACT(DAY FROM (activity_date - prev_date))) as avg_days_between_sessions,
          COUNT(*) as total_sessions,
          COUNT(DISTINCT wallet_id) as active_wallets
        FROM wallet_gaps
        WHERE prev_date IS NOT NULL
      `, [walletIds, startDate, endDate]);
      
      const sessionData = sessionResult.rows[0];
      
      // Calculate engagement consistency (coefficient of variation)
      const consistencyResult = await pool.query(`
        WITH daily_activity AS (
          SELECT 
            wallet_id,
            DATE(block_timestamp) as activity_date,
            COUNT(*) as daily_tx_count
          FROM processed_transactions
          WHERE wallet_id = ANY($1)
          AND block_timestamp >= $2
          AND block_timestamp <= $3
          GROUP BY wallet_id, DATE(block_timestamp)
        ),
        wallet_consistency AS (
          SELECT 
            wallet_id,
            STDDEV(daily_tx_count) / NULLIF(AVG(daily_tx_count), 0) as cv
          FROM daily_activity
          GROUP BY wallet_id
        )
        SELECT AVG(cv) as avg_consistency
        FROM wallet_consistency
        WHERE cv IS NOT NULL
      `, [walletIds, startDate, endDate]);
      
      const consistencyData = consistencyResult.rows[0];
      
      engagementAnalysis[userType] = {
        avg_session_duration_hours: Math.round((parseFloat(sessionData.avg_session_duration) || 0) * 100) / 100,
        avg_transactions_per_session: Math.round((parseFloat(sessionData.avg_transactions_per_session) || 0) * 100) / 100,
        avg_days_between_transactions: Math.round((parseFloat(sessionData.avg_days_between_sessions) || 0) * 100) / 100,
        engagement_consistency: Math.round((1 - (parseFloat(consistencyData.avg_consistency) || 1)) * 100),
        total_sessions: parseInt(sessionData.total_sessions) || 0,
        peak_activity_pattern: await identifyPeakActivityPattern(walletIds, startDate, endDate)
      };
    }
    
    console.log('Engagement analysis completed');
    return engagementAnalysis;
    
  } catch (error) {
    console.error('Error analyzing engagement patterns:', error);
    throw error;
  }
}/**

 * Calculate correlation between shielded usage and various metrics
 */
async function calculateShieldedCorrelations(projectId, startDate, endDate) {
  try {
    console.log('Calculating shielded usage correlations...');
    
    // Get wallet data with shielded percentages and various metrics
    const result = await pool.query(`
      WITH wallet_metrics AS (
        SELECT 
          w.id as wallet_id,
          COUNT(pt.id) as total_transactions,
          COUNT(pt.id) FILTER (WHERE pt.is_shielded = true) as shielded_transactions,
          CASE 
            WHEN COUNT(pt.id) = 0 THEN 0
            ELSE (COUNT(pt.id) FILTER (WHERE pt.is_shielded = true)::DECIMAL / COUNT(pt.id)) * 100
          END as shielded_percentage,
          SUM(ABS(pt.value_zatoshi)) as total_volume,
          COUNT(DISTINCT DATE(pt.block_timestamp)) as active_days,
          EXTRACT(DAY FROM ($3 - MIN(pt.block_timestamp))) as wallet_age_days,
          AVG(ABS(pt.value_zatoshi)) as avg_transaction_value
        FROM wallets w
        LEFT JOIN processed_transactions pt ON w.id = pt.wallet_id
          AND pt.block_timestamp >= $2
          AND pt.block_timestamp <= $3
        WHERE w.project_id = $1 AND w.is_active = true
        GROUP BY w.id
        HAVING COUNT(pt.id) > 0
      ),
      retention_metrics AS (
        SELECT 
          wm.wallet_id,
          wm.shielded_percentage,
          wm.total_transactions,
          wm.total_volume,
          wm.active_days,
          wm.wallet_age_days,
          wm.avg_transaction_value,
          CASE 
            WHEN wm.wallet_age_days >= 28 THEN
              CASE WHEN COUNT(pt_recent.id) > 0 THEN 1 ELSE 0 END
            ELSE NULL
          END as is_retained_4_weeks
        FROM wallet_metrics wm
        LEFT JOIN processed_transactions pt_recent ON wm.wallet_id = pt_recent.wallet_id
          AND pt_recent.block_timestamp >= $3 - INTERVAL '7 days'
          AND pt_recent.block_timestamp <= $3
        GROUP BY wm.wallet_id, wm.shielded_percentage, wm.total_transactions, 
                 wm.total_volume, wm.active_days, wm.wallet_age_days, wm.avg_transaction_value
      )
      SELECT 
        shielded_percentage,
        total_transactions,
        total_volume,
        active_days,
        wallet_age_days,
        avg_transaction_value,
        is_retained_4_weeks
      FROM retention_metrics
      WHERE shielded_percentage IS NOT NULL
    `, [projectId, startDate, endDate]);
    
    const data = result.rows;
    
    if (data.length < 10) {
      return {
        sample_size: data.length,
        correlations: {},
        significance: 'insufficient_data',
        insights: ['Insufficient data for correlation analysis (minimum 10 wallets required)']
      };
    }
    
    // Calculate correlations
    const correlations = {
      shielded_vs_retention: calculateCorrelation(
        data.filter(d => d.is_retained_4_weeks !== null),
        'shielded_percentage',
        'is_retained_4_weeks'
      ),
      shielded_vs_transaction_count: calculateCorrelation(data, 'shielded_percentage', 'total_transactions'),
      shielded_vs_volume: calculateCorrelation(data, 'shielded_percentage', 'total_volume'),
      shielded_vs_active_days: calculateCorrelation(data, 'shielded_percentage', 'active_days'),
      shielded_vs_wallet_age: calculateCorrelation(data, 'shielded_percentage', 'wallet_age_days'),
      shielded_vs_avg_tx_value: calculateCorrelation(data, 'shielded_percentage', 'avg_transaction_value')
    };
    
    // Determine statistical significance
    const significance = determineCorrelationSignificance(correlations, data.length);
    
    // Generate correlation insights
    const insights = generateCorrelationInsights(correlations, significance);
    
    console.log('Correlation analysis completed');
    return {
      sample_size: data.length,
      correlations: correlations,
      significance: significance,
      insights: insights
    };
    
  } catch (error) {
    console.error('Error calculating shielded correlations:', error);
    throw error;
  }
}

/**
 * Generate comprehensive insights from comparison data
 */
function generateComparisonInsights(userClassification, detailedMetrics, retentionAnalysis, engagementAnalysis, correlationAnalysis) {
  const insights = {
    key_findings: [],
    recommendations: [],
    privacy_adoption_insights: [],
    retention_insights: [],
    engagement_insights: [],
    correlation_insights: correlationAnalysis.insights || []
  };
  
  // Privacy adoption insights
  const totalUsers = userClassification.total_users;
  const shieldedUsers = userClassification[USER_TYPES.SHIELDED_HEAVY].length + 
                      userClassification[USER_TYPES.SHIELDED_MODERATE].length + 
                      userClassification[USER_TYPES.SHIELDED_LIGHT].length;
  const privacyAdoptionRate = totalUsers > 0 ? (shieldedUsers / totalUsers) * 100 : 0;
  
  insights.privacy_adoption_insights.push(`${privacyAdoptionRate.toFixed(1)}% of users utilize privacy features`);
  
  if (privacyAdoptionRate < 20) {
    insights.recommendations.push('Low privacy adoption - consider privacy education and UX improvements');
  } else if (privacyAdoptionRate > 60) {
    insights.key_findings.push('High privacy adoption indicates strong privacy-conscious user base');
  }
  
  // Retention comparison insights
  const transparentRetention = retentionAnalysis[USER_TYPES.TRANSPARENT_ONLY]?.avg_retention || 0;
  const heavyShieldedRetention = retentionAnalysis[USER_TYPES.SHIELDED_HEAVY]?.avg_retention || 0;
  
  if (heavyShieldedRetention > transparentRetention + 10) {
    insights.key_findings.push(`Heavy privacy users show ${(heavyShieldedRetention - transparentRetention).toFixed(1)}% better retention`);
    insights.retention_insights.push('Privacy features correlate with improved user retention');
  } else if (transparentRetention > heavyShieldedRetention + 10) {
    insights.retention_insights.push('Transparent users show better retention - investigate privacy UX barriers');
    insights.recommendations.push('Analyze privacy feature usability and user education needs');
  }
  
  // Engagement comparison insights
  const transparentEngagement = engagementAnalysis[USER_TYPES.TRANSPARENT_ONLY]?.avg_transactions_per_session || 0;
  const heavyShieldedEngagement = engagementAnalysis[USER_TYPES.SHIELDED_HEAVY]?.avg_transactions_per_session || 0;
  
  if (heavyShieldedEngagement > transparentEngagement * 1.2) {
    insights.engagement_insights.push('Privacy users demonstrate higher transaction frequency per session');
  }
  
  // Volume and value insights
  const transparentVolume = detailedMetrics[USER_TYPES.TRANSPARENT_ONLY]?.avg_volume_per_user || 0;
  const heavyShieldedVolume = detailedMetrics[USER_TYPES.SHIELDED_HEAVY]?.avg_volume_per_user || 0;
  
  if (heavyShieldedVolume > transparentVolume * 1.5) {
    insights.key_findings.push('Privacy users transact significantly higher volumes');
    insights.recommendations.push('Focus on privacy features for high-value user acquisition');
  }
  
  // Distribution insights
  const heavyShieldedCount = userClassification.distribution[USER_TYPES.SHIELDED_HEAVY]?.count || 0;
  const moderateShieldedCount = userClassification.distribution[USER_TYPES.SHIELDED_MODERATE]?.count || 0;
  
  if (heavyShieldedCount > moderateShieldedCount * 2) {
    insights.privacy_adoption_insights.push('Users tend toward heavy privacy usage rather than moderate');
  }
  
  return insights;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Calculate retention rate for a group of wallets
 */
async function calculateGroupRetention(walletIds, timeRange) {
  if (walletIds.length === 0) {
    return { week_1: 0, week_2: 0, week_3: 0, week_4: 0 };
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
 * Calculate retention trend from retention percentages
 */
function calculateRetentionTrend(retentionValues) {
  const validValues = retentionValues.filter(v => v !== null && v !== undefined && !isNaN(v));
  
  if (validValues.length < 2) return 'stable';
  
  let increasing = 0;
  let decreasing = 0;
  
  for (let i = 1; i < validValues.length; i++) {
    if (validValues[i] > validValues[i-1]) increasing++;
    else if (validValues[i] < validValues[i-1]) decreasing++;
  }
  
  if (increasing > decreasing) return 'improving';
  if (decreasing > increasing) return 'declining';
  return 'stable';
}

/**
 * Identify peak activity patterns for a group of wallets
 */
async function identifyPeakActivityPattern(walletIds, startDate, endDate) {
  if (walletIds.length === 0) return 'none';
  
  try {
    const result = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM block_timestamp) as hour_of_day,
        COUNT(*) as transaction_count
      FROM processed_transactions
      WHERE wallet_id = ANY($1)
      AND block_timestamp >= $2
      AND block_timestamp <= $3
      GROUP BY EXTRACT(HOUR FROM block_timestamp)
      ORDER BY transaction_count DESC
      LIMIT 1
    `, [walletIds, startDate, endDate]);
    
    if (result.rows.length === 0) return 'none';
    
    const peakHour = parseInt(result.rows[0].hour_of_day);
    
    if (peakHour >= 6 && peakHour < 12) return 'morning';
    if (peakHour >= 12 && peakHour < 18) return 'afternoon';
    if (peakHour >= 18 && peakHour < 24) return 'evening';
    return 'night';
    
  } catch (error) {
    console.error('Error identifying peak activity pattern:', error);
    return 'unknown';
  }
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(data, xField, yField) {
  const validData = data.filter(d => 
    d[xField] !== null && d[xField] !== undefined && !isNaN(d[xField]) &&
    d[yField] !== null && d[yField] !== undefined && !isNaN(d[yField])
  );
  
  if (validData.length < 3) return { coefficient: 0, strength: 'insufficient_data' };
  
  const n = validData.length;
  const xValues = validData.map(d => parseFloat(d[xField]));
  const yValues = validData.map(d => parseFloat(d[yField]));
  
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
  
  let numerator = 0;
  let xSumSquares = 0;
  let ySumSquares = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = xValues[i] - xMean;
    const yDiff = yValues[i] - yMean;
    
    numerator += xDiff * yDiff;
    xSumSquares += xDiff * xDiff;
    ySumSquares += yDiff * yDiff;
  }
  
  const denominator = Math.sqrt(xSumSquares * ySumSquares);
  const coefficient = denominator === 0 ? 0 : numerator / denominator;
  
  // Determine correlation strength
  const absCoeff = Math.abs(coefficient);
  let strength;
  if (absCoeff >= 0.7) strength = 'strong';
  else if (absCoeff >= 0.4) strength = 'moderate';
  else if (absCoeff >= 0.2) strength = 'weak';
  else strength = 'negligible';
  
  return {
    coefficient: Math.round(coefficient * 1000) / 1000,
    strength: strength,
    sample_size: n
  };
}

/**
 * Determine statistical significance of correlations
 */
function determineCorrelationSignificance(correlations, sampleSize) {
  if (sampleSize < 30) return 'low';
  
  const significantCorrelations = Object.values(correlations).filter(corr => 
    corr.strength === 'strong' || corr.strength === 'moderate'
  ).length;
  
  if (significantCorrelations >= 3) return 'high';
  if (significantCorrelations >= 1) return 'moderate';
  return 'low';
}

/**
 * Generate insights from correlation analysis
 */
function generateCorrelationInsights(correlations, significance) {
  const insights = [];
  
  if (significance === 'low') {
    insights.push('Limited statistical significance in correlation analysis');
    return insights;
  }
  
  // Retention correlation insights
  const retentionCorr = correlations.shielded_vs_retention;
  if (retentionCorr && retentionCorr.strength !== 'negligible') {
    if (retentionCorr.coefficient > 0.3) {
      insights.push(`Strong positive correlation between privacy usage and retention (r=${retentionCorr.coefficient})`);
    } else if (retentionCorr.coefficient < -0.3) {
      insights.push(`Privacy usage negatively correlates with retention (r=${retentionCorr.coefficient})`);
    }
  }
  
  // Volume correlation insights
  const volumeCorr = correlations.shielded_vs_volume;
  if (volumeCorr && volumeCorr.coefficient > 0.4) {
    insights.push('Higher privacy usage correlates with increased transaction volumes');
  }
  
  // Activity correlation insights
  const activityCorr = correlations.shielded_vs_active_days;
  if (activityCorr && activityCorr.coefficient > 0.3) {
    insights.push('Privacy users demonstrate more consistent activity patterns');
  }
  
  return insights;
}

/**
 * Calculate median value from array
 */
function calculateMedian(values) {
  if (values.length === 0) return 0;
  
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  } else {
    return sorted[middle];
  }
}

// Export all functions
export {
  compareShieldedVsTransparentUsers,
  classifyUsersByPrivacyUsage,
  calculateDetailedMetrics,
  analyzeRetentionByUserType,
  analyzeEngagementPatterns,
  calculateShieldedCorrelations,
  USER_TYPES,
  COMPARISON_METRICS
};