import pool from '../db/db.js';

/**
 * Transaction Type Correlation Analysis Service
 * Analyzes which transaction types correlate with higher retention rates
 */

/**
 * Analyze correlation between transaction types and retention
 */
async function analyzeTransactionTypeRetention() {
  try {
    console.log('🔄 Analyzing transaction type correlation with retention...');

    // Get retention data by transaction type usage
    const result = await pool.query(`
      WITH wallet_tx_types AS (
        SELECT 
          wam.wallet_id,
          SUM(wam.transfers_count) > 0 as uses_transfers,
          SUM(wam.swaps_count) > 0 as uses_swaps,
          SUM(wam.bridges_count) > 0 as uses_bridges,
          SUM(wam.shielded_count) > 0 as uses_shielded,
          COUNT(DISTINCT wam.activity_date) as active_days,
          MAX(wam.activity_date) as last_active_date,
          MIN(wam.activity_date) as first_active_date
        FROM wallet_activity_metrics wam
        WHERE wam.is_active = true
        GROUP BY wam.wallet_id
      ),
      wallet_retention AS (
        SELECT 
          wtt.*,
          CASE 
            WHEN wtt.last_active_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'active_7d'
            WHEN wtt.last_active_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'active_30d'
            ELSE 'inactive'
          END as retention_status,
          (wtt.last_active_date - wtt.first_active_date) as lifecycle_days
        FROM wallet_tx_types wtt
      )
      SELECT 
        'transfers' as transaction_type,
        COUNT(CASE WHEN uses_transfers THEN 1 END) as users_with_type,
        COUNT(CASE WHEN uses_transfers AND retention_status = 'active_7d' THEN 1 END) as active_7d_count,
        COUNT(CASE WHEN uses_transfers AND retention_status = 'active_30d' THEN 1 END) as active_30d_count,
        AVG(CASE WHEN uses_transfers THEN active_days END) as avg_active_days,
        AVG(CASE WHEN uses_transfers THEN lifecycle_days END) as avg_lifecycle_days
      FROM wallet_retention
      
      UNION ALL
      
      SELECT 
        'swaps' as transaction_type,
        COUNT(CASE WHEN uses_swaps THEN 1 END) as users_with_type,
        COUNT(CASE WHEN uses_swaps AND retention_status = 'active_7d' THEN 1 END) as active_7d_count,
        COUNT(CASE WHEN uses_swaps AND retention_status = 'active_30d' THEN 1 END) as active_30d_count,
        AVG(CASE WHEN uses_swaps THEN active_days END) as avg_active_days,
        AVG(CASE WHEN uses_swaps THEN lifecycle_days END) as avg_lifecycle_days
      FROM wallet_retention
      
      UNION ALL
      
      SELECT 
        'bridges' as transaction_type,
        COUNT(CASE WHEN uses_bridges THEN 1 END) as users_with_type,
        COUNT(CASE WHEN uses_bridges AND retention_status = 'active_7d' THEN 1 END) as active_7d_count,
        COUNT(CASE WHEN uses_bridges AND retention_status = 'active_30d' THEN 1 END) as active_30d_count,
        AVG(CASE WHEN uses_bridges THEN active_days END) as avg_active_days,
        AVG(CASE WHEN uses_bridges THEN lifecycle_days END) as avg_lifecycle_days
      FROM wallet_retention
      
      UNION ALL
      
      SELECT 
        'shielded' as transaction_type,
        COUNT(CASE WHEN uses_shielded THEN 1 END) as users_with_type,
        COUNT(CASE WHEN uses_shielded AND retention_status = 'active_7d' THEN 1 END) as active_7d_count,
        COUNT(CASE WHEN uses_shielded AND retention_status = 'active_30d' THEN 1 END) as active_30d_count,
        AVG(CASE WHEN uses_shielded THEN active_days END) as avg_active_days,
        AVG(CASE WHEN uses_shielded THEN lifecycle_days END) as avg_lifecycle_days
      FROM wallet_retention
      
      ORDER BY transaction_type
    `);

    // Calculate retention rates and correlations
    const correlations = result.rows.map(row => {
      const retention_7d_rate = row.users_with_type > 0 ? 
        (parseFloat(row.active_7d_count) / parseFloat(row.users_with_type)) * 100 : 0;
      
      const retention_30d_rate = row.users_with_type > 0 ? 
        (parseFloat(row.active_30d_count) / parseFloat(row.users_with_type)) * 100 : 0;

      return {
        transaction_type: row.transaction_type,
        users_with_type: parseInt(row.users_with_type),
        retention_7d_rate: Math.round(retention_7d_rate * 100) / 100,
        retention_30d_rate: Math.round(retention_30d_rate * 100) / 100,
        avg_active_days: parseFloat(row.avg_active_days || 0).toFixed(2),
        avg_lifecycle_days: parseFloat(row.avg_lifecycle_days || 0).toFixed(2)
      };
    });

    console.log(`✅ Analyzed transaction type correlations for ${correlations.length} transaction types`);
    return correlations;

  } catch (error) {
    console.error('❌ Error analyzing transaction type retention:', error);
    throw error;
  }
}

/**
 * Analyze transaction diversity impact on retention
 */
async function analyzeTransactionDiversityRetention() {
  try {
    console.log('🔄 Analyzing transaction diversity impact on retention...');

    const result = await pool.query(`
      WITH wallet_diversity AS (
        SELECT 
          wam.wallet_id,
          (CASE WHEN SUM(wam.transfers_count) > 0 THEN 1 ELSE 0 END +
           CASE WHEN SUM(wam.swaps_count) > 0 THEN 1 ELSE 0 END +
           CASE WHEN SUM(wam.bridges_count) > 0 THEN 1 ELSE 0 END +
           CASE WHEN SUM(wam.shielded_count) > 0 THEN 1 ELSE 0 END) as tx_type_diversity,
          COUNT(DISTINCT wam.activity_date) as active_days,
          MAX(wam.activity_date) as last_active_date,
          SUM(wam.transaction_count) as total_transactions,
          AVG(wam.sequence_complexity_score) as avg_complexity
        FROM wallet_activity_metrics wam
        WHERE wam.is_active = true
        GROUP BY wam.wallet_id
      ),
      diversity_retention AS (
        SELECT 
          wd.*,
          CASE 
            WHEN wd.last_active_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'active_7d'
            WHEN wd.last_active_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'active_30d'
            ELSE 'inactive'
          END as retention_status
        FROM wallet_diversity wd
      )
      SELECT 
        tx_type_diversity,
        COUNT(*) as wallet_count,
        COUNT(CASE WHEN retention_status = 'active_7d' THEN 1 END) as active_7d_count,
        COUNT(CASE WHEN retention_status = 'active_30d' THEN 1 END) as active_30d_count,
        AVG(active_days) as avg_active_days,
        AVG(total_transactions) as avg_total_transactions,
        AVG(avg_complexity) as avg_complexity_score
      FROM diversity_retention
      GROUP BY tx_type_diversity
      ORDER BY tx_type_diversity
    `);

    const diversityAnalysis = result.rows.map(row => {
      const retention_7d_rate = row.wallet_count > 0 ? 
        (parseFloat(row.active_7d_count) / parseFloat(row.wallet_count)) * 100 : 0;
      
      const retention_30d_rate = row.wallet_count > 0 ? 
        (parseFloat(row.active_30d_count) / parseFloat(row.wallet_count)) * 100 : 0;

      return {
        tx_type_diversity: parseInt(row.tx_type_diversity),
        wallet_count: parseInt(row.wallet_count),
        retention_7d_rate: Math.round(retention_7d_rate * 100) / 100,
        retention_30d_rate: Math.round(retention_30d_rate * 100) / 100,
        avg_active_days: parseFloat(row.avg_active_days || 0).toFixed(2),
        avg_total_transactions: parseFloat(row.avg_total_transactions || 0).toFixed(2),
        avg_complexity_score: parseFloat(row.avg_complexity_score || 0).toFixed(2)
      };
    });

    console.log(`✅ Analyzed diversity impact for ${diversityAnalysis.length} diversity levels`);
    return diversityAnalysis;

  } catch (error) {
    console.error('❌ Error analyzing transaction diversity retention:', error);
    throw error;
  }
}

/**
 * Analyze transaction volume correlation with retention
 */
async function analyzeVolumeRetentionCorrelation() {
  try {
    console.log('🔄 Analyzing transaction volume correlation with retention...');

    const result = await pool.query(`
      WITH wallet_volume AS (
        SELECT 
          wam.wallet_id,
          SUM(wam.total_volume_zatoshi) as total_volume,
          COUNT(DISTINCT wam.activity_date) as active_days,
          MAX(wam.activity_date) as last_active_date,
          SUM(wam.transaction_count) as total_transactions,
          CASE 
            WHEN SUM(wam.total_volume_zatoshi) = 0 THEN 'no_volume'
            WHEN SUM(wam.total_volume_zatoshi) < 10000000 THEN 'low_volume'    -- < 0.1 ZEC
            WHEN SUM(wam.total_volume_zatoshi) < 100000000 THEN 'medium_volume' -- 0.1-1 ZEC
            ELSE 'high_volume'                                                  -- > 1 ZEC
          END as volume_category
        FROM wallet_activity_metrics wam
        WHERE wam.is_active = true
        GROUP BY wam.wallet_id
      ),
      volume_retention AS (
        SELECT 
          wv.*,
          CASE 
            WHEN wv.last_active_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'active_7d'
            WHEN wv.last_active_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'active_30d'
            ELSE 'inactive'
          END as retention_status
        FROM wallet_volume wv
      )
      SELECT 
        volume_category,
        COUNT(*) as wallet_count,
        COUNT(CASE WHEN retention_status = 'active_7d' THEN 1 END) as active_7d_count,
        COUNT(CASE WHEN retention_status = 'active_30d' THEN 1 END) as active_30d_count,
        AVG(total_volume) as avg_volume,
        AVG(active_days) as avg_active_days,
        AVG(total_transactions) as avg_transactions
      FROM volume_retention
      GROUP BY volume_category
      ORDER BY 
        CASE volume_category
          WHEN 'no_volume' THEN 1
          WHEN 'low_volume' THEN 2
          WHEN 'medium_volume' THEN 3
          WHEN 'high_volume' THEN 4
        END
    `);

    const volumeAnalysis = result.rows.map(row => {
      const retention_7d_rate = row.wallet_count > 0 ? 
        (parseFloat(row.active_7d_count) / parseFloat(row.wallet_count)) * 100 : 0;
      
      const retention_30d_rate = row.wallet_count > 0 ? 
        (parseFloat(row.active_30d_count) / parseFloat(row.wallet_count)) * 100 : 0;

      return {
        volume_category: row.volume_category,
        wallet_count: parseInt(row.wallet_count),
        retention_7d_rate: Math.round(retention_7d_rate * 100) / 100,
        retention_30d_rate: Math.round(retention_30d_rate * 100) / 100,
        avg_volume_zatoshi: parseInt(row.avg_volume || 0),
        avg_active_days: parseFloat(row.avg_active_days || 0).toFixed(2),
        avg_transactions: parseFloat(row.avg_transactions || 0).toFixed(2)
      };
    });

    console.log(`✅ Analyzed volume correlation for ${volumeAnalysis.length} volume categories`);
    return volumeAnalysis;

  } catch (error) {
    console.error('❌ Error analyzing volume retention correlation:', error);
    throw error;
  }
}

/**
 * Analyze transaction frequency patterns and retention
 */
async function analyzeFrequencyRetentionCorrelation() {
  try {
    console.log('🔄 Analyzing transaction frequency correlation with retention...');

    const result = await pool.query(`
      WITH wallet_frequency AS (
        SELECT 
          wam.wallet_id,
          COUNT(DISTINCT wam.activity_date) as active_days,
          SUM(wam.transaction_count) as total_transactions,
          MAX(wam.activity_date) as last_active_date,
          MIN(wam.activity_date) as first_active_date,
          CASE 
            WHEN COUNT(DISTINCT wam.activity_date) = 1 THEN 'single_day'
            WHEN COUNT(DISTINCT wam.activity_date) <= 3 THEN 'low_frequency'
            WHEN COUNT(DISTINCT wam.activity_date) <= 7 THEN 'medium_frequency'
            ELSE 'high_frequency'
          END as frequency_category
        FROM wallet_activity_metrics wam
        WHERE wam.is_active = true
        GROUP BY wam.wallet_id
      ),
      frequency_retention AS (
        SELECT 
          wf.*,
          (wf.last_active_date - wf.first_active_date) + 1 as lifecycle_days,
          wf.active_days::float / NULLIF((wf.last_active_date - wf.first_active_date) + 1, 0) as activity_ratio,
          CASE 
            WHEN wf.last_active_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'active_7d'
            WHEN wf.last_active_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'active_30d'
            ELSE 'inactive'
          END as retention_status
        FROM wallet_frequency wf
      )
      SELECT 
        frequency_category,
        COUNT(*) as wallet_count,
        COUNT(CASE WHEN retention_status = 'active_7d' THEN 1 END) as active_7d_count,
        COUNT(CASE WHEN retention_status = 'active_30d' THEN 1 END) as active_30d_count,
        AVG(active_days) as avg_active_days,
        AVG(total_transactions) as avg_transactions,
        AVG(lifecycle_days) as avg_lifecycle_days,
        AVG(activity_ratio) as avg_activity_ratio
      FROM frequency_retention
      GROUP BY frequency_category
      ORDER BY 
        CASE frequency_category
          WHEN 'single_day' THEN 1
          WHEN 'low_frequency' THEN 2
          WHEN 'medium_frequency' THEN 3
          WHEN 'high_frequency' THEN 4
        END
    `);

    const frequencyAnalysis = result.rows.map(row => {
      const retention_7d_rate = row.wallet_count > 0 ? 
        (parseFloat(row.active_7d_count) / parseFloat(row.wallet_count)) * 100 : 0;
      
      const retention_30d_rate = row.wallet_count > 0 ? 
        (parseFloat(row.active_30d_count) / parseFloat(row.wallet_count)) * 100 : 0;

      return {
        frequency_category: row.frequency_category,
        wallet_count: parseInt(row.wallet_count),
        retention_7d_rate: Math.round(retention_7d_rate * 100) / 100,
        retention_30d_rate: Math.round(retention_30d_rate * 100) / 100,
        avg_active_days: parseFloat(row.avg_active_days || 0).toFixed(2),
        avg_transactions: parseFloat(row.avg_transactions || 0).toFixed(2),
        avg_lifecycle_days: parseFloat(row.avg_lifecycle_days || 0).toFixed(2),
        avg_activity_ratio: parseFloat(row.avg_activity_ratio || 0).toFixed(3)
      };
    });

    console.log(`✅ Analyzed frequency correlation for ${frequencyAnalysis.length} frequency categories`);
    return frequencyAnalysis;

  } catch (error) {
    console.error('❌ Error analyzing frequency retention correlation:', error);
    throw error;
  }
}

/**
 * Generate comprehensive correlation insights
 */
async function generateCorrelationInsights() {
  try {
    console.log('🔄 Generating comprehensive correlation insights...');

    // Run all correlation analyses
    const [
      transactionTypeCorrelations,
      diversityAnalysis,
      volumeAnalysis,
      frequencyAnalysis
    ] = await Promise.all([
      analyzeTransactionTypeRetention(),
      analyzeTransactionDiversityRetention(),
      analyzeVolumeRetentionCorrelation(),
      analyzeFrequencyRetentionCorrelation()
    ]);

    // Generate insights
    const insights = {
      transaction_types: {
        data: transactionTypeCorrelations,
        insights: generateTransactionTypeInsights(transactionTypeCorrelations)
      },
      diversity: {
        data: diversityAnalysis,
        insights: generateDiversityInsights(diversityAnalysis)
      },
      volume: {
        data: volumeAnalysis,
        insights: generateVolumeInsights(volumeAnalysis)
      },
      frequency: {
        data: frequencyAnalysis,
        insights: generateFrequencyInsights(frequencyAnalysis)
      },
      summary: generateOverallInsights(transactionTypeCorrelations, diversityAnalysis, volumeAnalysis, frequencyAnalysis)
    };

    console.log('✅ Generated comprehensive correlation insights');
    return insights;

  } catch (error) {
    console.error('❌ Error generating correlation insights:', error);
    throw error;
  }
}

/**
 * Generate insights for transaction type correlations
 */
function generateTransactionTypeInsights(correlations) {
  if (!correlations || correlations.length === 0) {
    return ['No transaction type data available for analysis'];
  }

  const insights = [];
  
  // Find highest retention transaction type
  const highestRetention = correlations.reduce((max, curr) => 
    curr.retention_7d_rate > max.retention_7d_rate ? curr : max
  );
  
  insights.push(`${highestRetention.transaction_type} transactions show the highest 7-day retention rate at ${highestRetention.retention_7d_rate}%`);
  
  // Find most engaging transaction type (highest active days)
  const mostEngaging = correlations.reduce((max, curr) => 
    parseFloat(curr.avg_active_days) > parseFloat(max.avg_active_days) ? curr : max
  );
  
  insights.push(`Users with ${mostEngaging.transaction_type} transactions are most engaged with ${mostEngaging.avg_active_days} average active days`);
  
  return insights;
}

/**
 * Generate insights for diversity analysis
 */
function generateDiversityInsights(diversityData) {
  if (!diversityData || diversityData.length === 0) {
    return ['No diversity data available for analysis'];
  }

  const insights = [];
  
  // Find optimal diversity level
  const highestRetention = diversityData.reduce((max, curr) => 
    curr.retention_7d_rate > max.retention_7d_rate ? curr : max
  );
  
  insights.push(`Wallets using ${highestRetention.tx_type_diversity} transaction types show highest retention at ${highestRetention.retention_7d_rate}%`);
  
  // Analyze diversity trend
  const diversityTrend = diversityData.map(d => ({ diversity: d.tx_type_diversity, retention: d.retention_7d_rate }))
    .sort((a, b) => a.diversity - b.diversity);
  
  if (diversityTrend.length > 1) {
    const trend = diversityTrend[diversityTrend.length - 1].retention > diversityTrend[0].retention ? 'increases' : 'decreases';
    insights.push(`Retention generally ${trend} with transaction type diversity`);
  }
  
  return insights;
}

/**
 * Generate insights for volume analysis
 */
function generateVolumeInsights(volumeData) {
  if (!volumeData || volumeData.length === 0) {
    return ['No volume data available for analysis'];
  }

  const insights = [];
  
  // Find volume category with highest retention
  const highestRetention = volumeData.reduce((max, curr) => 
    curr.retention_7d_rate > max.retention_7d_rate ? curr : max
  );
  
  insights.push(`${highestRetention.volume_category} wallets show highest retention at ${highestRetention.retention_7d_rate}%`);
  
  return insights;
}

/**
 * Generate insights for frequency analysis
 */
function generateFrequencyInsights(frequencyData) {
  if (!frequencyData || frequencyData.length === 0) {
    return ['No frequency data available for analysis'];
  }

  const insights = [];
  
  // Find frequency category with highest retention
  const highestRetention = frequencyData.reduce((max, curr) => 
    curr.retention_7d_rate > max.retention_7d_rate ? curr : max
  );
  
  insights.push(`${highestRetention.frequency_category} users show highest retention at ${highestRetention.retention_7d_rate}%`);
  
  return insights;
}

/**
 * Generate overall insights
 */
function generateOverallInsights(transactionTypes, diversity, volume, frequency) {
  const insights = [];
  
  insights.push('Correlation analysis reveals key patterns for retention optimization');
  
  if (transactionTypes && transactionTypes.length > 0) {
    const totalUsers = transactionTypes.reduce((sum, t) => sum + t.users_with_type, 0);
    insights.push(`Analysis based on ${totalUsers} total wallet interactions across transaction types`);
  }
  
  return insights;
}

export {
  analyzeTransactionTypeRetention,
  analyzeTransactionDiversityRetention,
  analyzeVolumeRetentionCorrelation,
  analyzeFrequencyRetentionCorrelation,
  generateCorrelationInsights
};