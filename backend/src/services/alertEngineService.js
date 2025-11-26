import pool from '../db/db.js';

/**
 * Threshold-Based Alert Engine Service
 * Implements retention drop detection, churn risk identification,
 * funnel performance monitoring, and shielded pool activity spike detection
 */

// Default alert thresholds (can be customized per project)
const DEFAULT_THRESHOLDS = {
  retention: {
    drop_percentage: 15, // Alert if retention drops by 15% or more
    critical_level: 40,  // Alert if retention falls below 40%
    warning_level: 55    // Warning if retention falls below 55%
  },
  churn: {
    high_risk_percentage: 30, // Alert if 30%+ wallets are high risk
    rate_increase: 10,        // Alert if churn rate increases by 10%+
    critical_rate: 40         // Alert if churn rate exceeds 40%
  },
  funnel: {
    conversion_drop: 20,      // Alert if conversion drops by 20%+
    stage_drop_threshold: 50, // Alert if stage has 50%+ drop-off
    critical_conversion: 30   // Alert if conversion below 30%
  },
  shielded: {
    spike_multiplier: 2.5,    // Alert if activity spikes 2.5x average
    drop_multiplier: 0.4,     // Alert if activity drops to 40% of average
    volume_threshold: 1000000 // Alert for large volume changes (zatoshi)
  }
};

/**
 * Check all alerts for a project
 * @param {string} projectId - Project UUID
 * @param {Object} customThresholds - Optional custom thresholds
 * @returns {Object} All triggered alerts
 */
async function checkProjectAlerts(projectId, customThresholds = {}) {
  try {
    const thresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds };
    
    const alerts = {
      project_id: projectId,
      retention_alerts: await checkRetentionAlerts(projectId, thresholds.retention),
      churn_alerts: await checkChurnAlerts(projectId, thresholds.churn),
      funnel_alerts: await checkFunnelAlerts(projectId, thresholds.funnel),
      shielded_alerts: await checkShieldedAlerts(projectId, thresholds.shielded),
      checked_at: new Date().toISOString()
    };
    
    // Count total alerts by severity
    const allAlerts = [
      ...alerts.retention_alerts,
      ...alerts.churn_alerts,
      ...alerts.funnel_alerts,
      ...alerts.shielded_alerts
    ];
    
    alerts.summary = {
      total: allAlerts.length,
      critical: allAlerts.filter(a => a.severity === 'critical').length,
      warning: allAlerts.filter(a => a.severity === 'warning').length,
      info: allAlerts.filter(a => a.severity === 'info').length
    };
    
    return alerts;
  } catch (error) {
    console.error(`Error checking alerts for project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Check retention drop alerts
 */
async function checkRetentionAlerts(projectId, thresholds) {
  const alerts = [];
  
  try {
    // Get recent cohort retention data
    const result = await pool.query(`
      SELECT 
        wc.cohort_period,
        wc.cohort_type,
        wc.retention_week_1,
        wc.retention_week_2,
        wc.retention_week_3,
        wc.retention_week_4,
        wc.wallet_count
      FROM wallet_cohorts wc
      JOIN wallet_cohort_assignments wca ON wc.id = wca.cohort_id
      JOIN wallets w ON wca.wallet_id = w.id
      WHERE w.project_id = $1
      AND wc.cohort_type = 'weekly'
      AND wc.cohort_period >= CURRENT_DATE - INTERVAL '8 weeks'
      GROUP BY wc.id, wc.cohort_period, wc.cohort_type, wc.retention_week_1, 
               wc.retention_week_2, wc.retention_week_3, wc.retention_week_4, wc.wallet_count
      ORDER BY wc.cohort_period DESC
      LIMIT 4
    `, [projectId]);
    
    const cohorts = result.rows;
    
    if (cohorts.length < 2) {
      return alerts; // Need at least 2 cohorts to compare
    }
    
    // Check for retention drops between cohorts
    for (let i = 0; i < cohorts.length - 1; i++) {
      const current = cohorts[i];
      const previous = cohorts[i + 1];
      
      // Compare week 1 retention
      if (current.retention_week_1 && previous.retention_week_1) {
        const drop = previous.retention_week_1 - current.retention_week_1;
        const dropPercentage = (drop / previous.retention_week_1) * 100;
        
        if (dropPercentage >= thresholds.drop_percentage) {
          alerts.push({
            type: 'retention_drop',
            severity: dropPercentage >= 25 ? 'critical' : 'warning',
            title: 'Significant retention drop detected',
            message: `Week 1 retention dropped ${dropPercentage.toFixed(1)}% from ${previous.retention_week_1.toFixed(1)}% to ${current.retention_week_1.toFixed(1)}%`,
            data: {
              current_cohort: current.cohort_period,
              previous_cohort: previous.cohort_period,
              current_retention: current.retention_week_1,
              previous_retention: previous.retention_week_1,
              drop_percentage: dropPercentage
            },
            detected_at: new Date().toISOString()
          });
        }
      }
      
      // Check if retention is critically low
      if (current.retention_week_1 && current.retention_week_1 < thresholds.critical_level) {
        alerts.push({
          type: 'retention_critical',
          severity: 'critical',
          title: 'Critical retention level',
          message: `Week 1 retention is critically low at ${current.retention_week_1.toFixed(1)}% (threshold: ${thresholds.critical_level}%)`,
          data: {
            cohort: current.cohort_period,
            retention: current.retention_week_1,
            threshold: thresholds.critical_level
          },
          detected_at: new Date().toISOString()
        });
      } else if (current.retention_week_1 && current.retention_week_1 < thresholds.warning_level) {
        alerts.push({
          type: 'retention_warning',
          severity: 'warning',
          title: 'Low retention level',
          message: `Week 1 retention is below target at ${current.retention_week_1.toFixed(1)}% (threshold: ${thresholds.warning_level}%)`,
          data: {
            cohort: current.cohort_period,
            retention: current.retention_week_1,
            threshold: thresholds.warning_level
          },
          detected_at: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error checking retention alerts:', error);
  }
  
  return alerts;
}

/**
 * Check churn risk alerts
 */
async function checkChurnAlerts(projectId, thresholds) {
  const alerts = [];
  
  try {
    // Get current churn metrics
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_wallets,
        COUNT(CASE WHEN wps.status = 'churn' THEN 1 END) as churned_wallets,
        COUNT(CASE WHEN wps.risk_level = 'high' THEN 1 END) as high_risk_wallets,
        COUNT(CASE WHEN wps.status = 'at_risk' THEN 1 END) as at_risk_wallets
      FROM wallets w
      LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
      WHERE w.project_id = $1
      AND w.is_active = true
    `, [projectId]);
    
    const metrics = result.rows[0];
    const totalWallets = parseInt(metrics.total_wallets);
    const churnedWallets = parseInt(metrics.churned_wallets);
    const highRiskWallets = parseInt(metrics.high_risk_wallets);
    const atRiskWallets = parseInt(metrics.at_risk_wallets);
    
    if (totalWallets === 0) return alerts;
    
    const churnRate = (churnedWallets / totalWallets) * 100;
    const highRiskPercentage = (highRiskWallets / totalWallets) * 100;
    const atRiskPercentage = (atRiskWallets / totalWallets) * 100;
    
    // Check if churn rate is critical
    if (churnRate >= thresholds.critical_rate) {
      alerts.push({
        type: 'churn_critical',
        severity: 'critical',
        title: 'Critical churn rate',
        message: `${churnRate.toFixed(1)}% of wallets are churning (${churnedWallets}/${totalWallets})`,
        data: {
          churn_rate: churnRate,
          churned_wallets: churnedWallets,
          total_wallets: totalWallets,
          threshold: thresholds.critical_rate
        },
        detected_at: new Date().toISOString()
      });
    }
    
    // Check if high risk percentage is too high
    if (highRiskPercentage >= thresholds.high_risk_percentage) {
      alerts.push({
        type: 'high_risk_wallets',
        severity: 'warning',
        title: 'High number of at-risk wallets',
        message: `${highRiskPercentage.toFixed(1)}% of wallets are at high risk of churning (${highRiskWallets}/${totalWallets})`,
        data: {
          high_risk_percentage: highRiskPercentage,
          high_risk_wallets: highRiskWallets,
          total_wallets: totalWallets,
          threshold: thresholds.high_risk_percentage
        },
        detected_at: new Date().toISOString()
      });
    }
    
    // Check overall at-risk situation
    const combinedRisk = churnRate + atRiskPercentage;
    if (combinedRisk >= 60) {
      alerts.push({
        type: 'combined_risk',
        severity: 'critical',
        title: 'High combined churn and risk',
        message: `${combinedRisk.toFixed(1)}% of wallets are churned or at risk`,
        data: {
          churn_rate: churnRate,
          at_risk_percentage: atRiskPercentage,
          combined_percentage: combinedRisk,
          affected_wallets: churnedWallets + atRiskWallets,
          total_wallets: totalWallets
        },
        detected_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error checking churn alerts:', error);
  }
  
  return alerts;
}

/**
 * Check funnel performance alerts
 */
async function checkFunnelAlerts(projectId, thresholds) {
  const alerts = [];
  
  try {
    // Get funnel conversion rates
    const result = await pool.query(`
      SELECT 
        was.stage_name,
        COUNT(DISTINCT was.wallet_id) as wallets_achieved,
        (SELECT COUNT(*) FROM wallets WHERE project_id = $1) as total_wallets
      FROM wallet_adoption_stages was
      JOIN wallets w ON was.wallet_id = w.id
      WHERE w.project_id = $1
      AND was.achieved_at IS NOT NULL
      GROUP BY was.stage_name
    `, [projectId]);
    
    const stages = result.rows;
    const totalWallets = stages[0]?.total_wallets || 0;
    
    if (totalWallets === 0) return alerts;
    
    // Calculate conversion rates
    const stageOrder = ['created', 'first_tx', 'feature_usage', 'recurring', 'high_value'];
    const conversions = {};
    
    stages.forEach(stage => {
      conversions[stage.stage_name] = {
        count: parseInt(stage.wallets_achieved),
        rate: (parseInt(stage.wallets_achieved) / totalWallets) * 100
      };
    });
    
    // Check for significant drop-offs between stages
    for (let i = 0; i < stageOrder.length - 1; i++) {
      const currentStage = stageOrder[i];
      const nextStage = stageOrder[i + 1];
      
      const currentCount = conversions[currentStage]?.count || totalWallets;
      const nextCount = conversions[nextStage]?.count || 0;
      
      if (currentCount > 0) {
        const dropOff = ((currentCount - nextCount) / currentCount) * 100;
        
        if (dropOff >= thresholds.stage_drop_threshold) {
          alerts.push({
            type: 'funnel_drop_off',
            severity: dropOff >= 70 ? 'critical' : 'warning',
            title: `High drop-off at ${nextStage} stage`,
            message: `${dropOff.toFixed(1)}% of users drop off between ${currentStage} and ${nextStage}`,
            data: {
              from_stage: currentStage,
              to_stage: nextStage,
              from_count: currentCount,
              to_count: nextCount,
              drop_off_percentage: dropOff,
              threshold: thresholds.stage_drop_threshold
            },
            detected_at: new Date().toISOString()
          });
        }
      }
    }
    
    // Check for critically low conversion rates
    Object.entries(conversions).forEach(([stage, data]) => {
      if (data.rate < thresholds.critical_conversion) {
        alerts.push({
          type: 'low_conversion',
          severity: 'warning',
          title: `Low conversion rate at ${stage}`,
          message: `Only ${data.rate.toFixed(1)}% of wallets reach ${stage} stage`,
          data: {
            stage,
            conversion_rate: data.rate,
            wallets_achieved: data.count,
            total_wallets: totalWallets,
            threshold: thresholds.critical_conversion
          },
          detected_at: new Date().toISOString()
        });
      }
    });
  } catch (error) {
    console.error('Error checking funnel alerts:', error);
  }
  
  return alerts;
}

/**
 * Check shielded pool activity alerts
 */
async function checkShieldedAlerts(projectId, thresholds) {
  const alerts = [];
  
  try {
    // Get recent shielded activity
    const result = await pool.query(`
      SELECT 
        spm.analysis_date,
        SUM(spm.shielded_tx_count) as total_shielded_txs,
        SUM(spm.shielded_volume_zatoshi) as total_volume,
        COUNT(DISTINCT spm.wallet_id) as active_wallets
      FROM shielded_pool_metrics spm
      JOIN wallets w ON spm.wallet_id = w.id
      WHERE w.project_id = $1
      AND spm.analysis_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY spm.analysis_date
      ORDER BY spm.analysis_date DESC
    `, [projectId]);
    
    const dailyMetrics = result.rows;
    
    if (dailyMetrics.length < 7) {
      return alerts; // Need at least a week of data
    }
    
    // Calculate averages
    const avgTxs = dailyMetrics.reduce((sum, d) => sum + parseInt(d.total_shielded_txs), 0) / dailyMetrics.length;
    const avgVolume = dailyMetrics.reduce((sum, d) => sum + parseInt(d.total_volume), 0) / dailyMetrics.length;
    
    // Check most recent day for spikes or drops
    const today = dailyMetrics[0];
    const todayTxs = parseInt(today.total_shielded_txs);
    const todayVolume = parseInt(today.total_volume);
    
    // Check for transaction spike
    if (todayTxs > avgTxs * thresholds.spike_multiplier) {
      alerts.push({
        type: 'shielded_spike',
        severity: 'info',
        title: 'Shielded transaction spike detected',
        message: `Shielded transactions increased to ${todayTxs} (${(todayTxs / avgTxs).toFixed(1)}x average)`,
        data: {
          current_txs: todayTxs,
          average_txs: Math.round(avgTxs),
          multiplier: todayTxs / avgTxs,
          date: today.analysis_date
        },
        detected_at: new Date().toISOString()
      });
    }
    
    // Check for transaction drop
    if (todayTxs < avgTxs * thresholds.drop_multiplier && avgTxs > 10) {
      alerts.push({
        type: 'shielded_drop',
        severity: 'warning',
        title: 'Shielded transaction drop detected',
        message: `Shielded transactions dropped to ${todayTxs} (${((todayTxs / avgTxs) * 100).toFixed(1)}% of average)`,
        data: {
          current_txs: todayTxs,
          average_txs: Math.round(avgTxs),
          percentage_of_average: (todayTxs / avgTxs) * 100,
          date: today.analysis_date
        },
        detected_at: new Date().toISOString()
      });
    }
    
    // Check for large volume changes
    const volumeChange = Math.abs(todayVolume - avgVolume);
    if (volumeChange > thresholds.volume_threshold) {
      const direction = todayVolume > avgVolume ? 'increase' : 'decrease';
      alerts.push({
        type: 'shielded_volume_change',
        severity: 'info',
        title: `Significant shielded volume ${direction}`,
        message: `Shielded volume ${direction}d by ${(volumeChange / 100000000).toFixed(2)} ZEC`,
        data: {
          current_volume: todayVolume,
          average_volume: Math.round(avgVolume),
          change_zatoshi: volumeChange,
          change_zec: volumeChange / 100000000,
          date: today.analysis_date
        },
        detected_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error checking shielded alerts:', error);
  }
  
  return alerts;
}

/**
 * Get alert configuration for a project
 */
async function getAlertConfiguration(projectId) {
  // In a full implementation, this would fetch custom thresholds from database
  // For now, return defaults
  return DEFAULT_THRESHOLDS;
}

/**
 * Update alert configuration for a project
 */
async function updateAlertConfiguration(projectId, thresholds) {
  // In a full implementation, this would store custom thresholds in database
  // For now, just validate and return
  return { ...DEFAULT_THRESHOLDS, ...thresholds };
}

export {
  checkProjectAlerts,
  checkRetentionAlerts,
  checkChurnAlerts,
  checkFunnelAlerts,
  checkShieldedAlerts,
  getAlertConfiguration,
  updateAlertConfiguration,
  DEFAULT_THRESHOLDS
};
