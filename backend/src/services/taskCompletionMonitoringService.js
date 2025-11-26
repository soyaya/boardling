import pool from '../db/db.js';
import { calculateEnhancedProductivityScore, updateProductivityScore } from './productivityScoringService.js';

/**
 * Task Completion Monitoring Service
 * Tracks on-chain activity changes to detect task completion,
 * updates productivity scores when task effectiveness is detected,
 * and marks tasks as completed with effectiveness tracking
 */

/**
 * Monitor task completion for a specific recommendation
 * @param {string} recommendationId - Recommendation UUID
 * @returns {Object} Completion status and metrics
 */
async function monitorTaskCompletion(recommendationId) {
  try {
    // Get recommendation details
    const recResult = await pool.query(`
      SELECT * FROM ai_recommendations
      WHERE id = $1
    `, [recommendationId]);

    if (recResult.rows.length === 0) {
      throw new Error(`Recommendation ${recommendationId} not found`);
    }

    const recommendation = recResult.rows[0];
    
    // Get baseline metrics
    const baselineMetrics = recommendation.baseline_metrics || {};
    
    // Get current metrics
    const currentMetrics = await getCurrentMetrics(
      recommendation.wallet_id,
      recommendation.project_id
    );
    
    // Check completion indicators
    const completionStatus = checkCompletionIndicators(
      recommendation.completion_indicators,
      baselineMetrics,
      currentMetrics
    );
    
    // Calculate effectiveness if completed
    let effectiveness = null;
    if (completionStatus.is_completed) {
      effectiveness = calculateEffectiveness(
        baselineMetrics,
        currentMetrics,
        recommendation.recommendation_type
      );
      
      // Update recommendation status
      await markTaskCompleted(recommendationId, currentMetrics, effectiveness);
      
      // Update productivity score if wallet-specific
      if (recommendation.wallet_id) {
        await updateProductivityScore(recommendation.wallet_id);
      }
    }
    
    return {
      recommendation_id: recommendationId,
      is_completed: completionStatus.is_completed,
      completion_percentage: completionStatus.completion_percentage,
      indicators_met: completionStatus.indicators_met,
      effectiveness: effectiveness,
      current_metrics: currentMetrics,
      checked_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error monitoring task completion for ${recommendationId}:`, error);
    throw error;
  }
}

/**
 * Monitor all pending recommendations for a wallet
 * @param {string} walletId - Wallet UUID
 * @returns {Array} Completion status for all pending recommendations
 */
async function monitorWalletRecommendations(walletId) {
  try {
    // Get all pending recommendations
    const result = await pool.query(`
      SELECT id FROM ai_recommendations
      WHERE wallet_id = $1
      AND status IN ('pending', 'in_progress')
      ORDER BY created_at DESC
    `, [walletId]);

    const recommendations = result.rows;
    
    // Monitor each recommendation
    const results = [];
    for (const rec of recommendations) {
      try {
        const status = await monitorTaskCompletion(rec.id);
        results.push(status);
      } catch (error) {
        console.error(`Error monitoring recommendation ${rec.id}:`, error.message);
        results.push({
          recommendation_id: rec.id,
          error: error.message
        });
      }
    }
    
    return {
      wallet_id: walletId,
      total_monitored: recommendations.length,
      completed: results.filter(r => r.is_completed).length,
      results,
      monitored_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error monitoring wallet recommendations for ${walletId}:`, error);
    throw error;
  }
}

/**
 * Monitor all pending recommendations for a project
 * @param {string} projectId - Project UUID
 * @returns {Array} Completion status for all pending recommendations
 */
async function monitorProjectRecommendations(projectId) {
  try {
    // Get all pending recommendations
    const result = await pool.query(`
      SELECT id FROM ai_recommendations
      WHERE project_id = $1
      AND status IN ('pending', 'in_progress')
      ORDER BY created_at DESC
    `, [projectId]);

    const recommendations = result.rows;
    
    // Monitor each recommendation
    const results = [];
    for (const rec of recommendations) {
      try {
        const status = await monitorTaskCompletion(rec.id);
        results.push(status);
      } catch (error) {
        console.error(`Error monitoring recommendation ${rec.id}:`, error.message);
        results.push({
          recommendation_id: rec.id,
          error: error.message
        });
      }
    }
    
    return {
      project_id: projectId,
      total_monitored: recommendations.length,
      completed: results.filter(r => r.is_completed).length,
      results,
      monitored_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error monitoring project recommendations for ${projectId}:`, error);
    throw error;
  }
}

/**
 * Get current metrics for wallet or project
 */
async function getCurrentMetrics(walletId, projectId) {
  const metrics = {};
  
  if (walletId) {
    // Get wallet-specific metrics
    const scores = await calculateEnhancedProductivityScore(walletId);
    
    // Get activity metrics
    const activityResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT activity_date) as active_days,
        SUM(transaction_count) as total_transactions,
        MAX(activity_date) as last_activity_date
      FROM wallet_activity_metrics
      WHERE wallet_id = $1
      AND activity_date >= CURRENT_DATE - INTERVAL '30 days'
    `, [walletId]);
    
    const activity = activityResult.rows[0];
    
    metrics.productivity_score = scores.total_score;
    metrics.retention_score = scores.component_scores.retention_score;
    metrics.adoption_score = scores.component_scores.adoption_score;
    metrics.activity_score = scores.component_scores.activity_score;
    metrics.churn_score = scores.component_scores.churn_score;
    metrics.active_days = parseInt(activity.active_days) || 0;
    metrics.total_transactions = parseInt(activity.total_transactions) || 0;
    metrics.last_activity_date = activity.last_activity_date;
  }
  
  if (projectId) {
    // Get project-level metrics
    const projectResult = await pool.query(`
      SELECT 
        COUNT(*) as total_wallets,
        AVG(wps.total_score) as avg_score,
        COUNT(CASE WHEN wps.status = 'healthy' THEN 1 END) as healthy_count,
        COUNT(CASE WHEN wps.status = 'churn' THEN 1 END) as churn_count
      FROM wallets w
      LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
      WHERE w.project_id = $1
    `, [projectId]);
    
    const project = projectResult.rows[0];
    
    metrics.total_wallets = parseInt(project.total_wallets);
    metrics.average_score = Math.round(parseFloat(project.avg_score) || 0);
    metrics.healthy_count = parseInt(project.healthy_count);
    metrics.churn_count = parseInt(project.churn_count);
    metrics.health_percentage = metrics.total_wallets > 0 ?
      Math.round((metrics.healthy_count / metrics.total_wallets) * 100) : 0;
  }
  
  return metrics;
}

/**
 * Check if completion indicators are met
 */
function checkCompletionIndicators(indicators, baseline, current) {
  if (!indicators || Object.keys(indicators).length === 0) {
    return {
      is_completed: false,
      completion_percentage: 0,
      indicators_met: []
    };
  }
  
  const indicatorChecks = [];
  let metCount = 0;
  
  // Check each indicator
  Object.entries(indicators).forEach(([key, value]) => {
    let isMet = false;
    let details = '';
    
    switch (key) {
      case 'activity_increase':
        if (value && current.active_days > (baseline.active_days || 0)) {
          isMet = true;
          details = `Active days increased from ${baseline.active_days || 0} to ${current.active_days}`;
        }
        break;
        
      case 'transaction_frequency':
        const requiredFrequency = value; // 'daily', 'weekly', etc.
        const avgDailyTxs = current.total_transactions / 30;
        if (requiredFrequency === 'daily' && avgDailyTxs >= 1) {
          isMet = true;
          details = `Daily transaction frequency achieved (${avgDailyTxs.toFixed(2)} txs/day)`;
        } else if (requiredFrequency === 'weekly' && avgDailyTxs >= 0.14) {
          isMet = true;
          details = `Weekly transaction frequency achieved`;
        }
        break;
        
      case 'retention_score_target':
        if (current.retention_score >= value) {
          isMet = true;
          details = `Retention score reached ${current.retention_score} (target: ${value})`;
        }
        break;
        
      case 'adoption_score_target':
        if (current.adoption_score >= value) {
          isMet = true;
          details = `Adoption score reached ${current.adoption_score} (target: ${value})`;
        }
        break;
        
      case 'activity_score_target':
        if (current.activity_score >= value) {
          isMet = true;
          details = `Activity score reached ${current.activity_score} (target: ${value})`;
        }
        break;
        
      case 'churn_score_target':
        if (current.churn_score >= value) {
          isMet = true;
          details = `Churn score reached ${current.churn_score} (target: ${value})`;
        }
        break;
        
      case 'total_score_target':
        if (current.productivity_score >= value) {
          isMet = true;
          details = `Productivity score reached ${current.productivity_score} (target: ${value})`;
        }
        break;
        
      case 'activity_resumed':
        const daysSinceActivity = current.last_activity_date ?
          Math.floor((new Date() - new Date(current.last_activity_date)) / (1000 * 60 * 60 * 24)) : 999;
        if (value && daysSinceActivity <= 7) {
          isMet = true;
          details = `Activity resumed (last active ${daysSinceActivity} days ago)`;
        }
        break;
        
      case 'health_percentage_target':
        if (current.health_percentage >= value) {
          isMet = true;
          details = `Health percentage reached ${current.health_percentage}% (target: ${value}%)`;
        }
        break;
    }
    
    indicatorChecks.push({
      indicator: key,
      required_value: value,
      is_met: isMet,
      details
    });
    
    if (isMet) metCount++;
  });
  
  const totalIndicators = indicatorChecks.length;
  const completionPercentage = totalIndicators > 0 ?
    Math.round((metCount / totalIndicators) * 100) : 0;
  
  // Consider completed if 80% or more indicators are met
  const isCompleted = completionPercentage >= 80;
  
  return {
    is_completed: isCompleted,
    completion_percentage: completionPercentage,
    indicators_met: indicatorChecks.filter(i => i.is_met),
    indicators_pending: indicatorChecks.filter(i => !i.is_met),
    total_indicators: totalIndicators,
    met_count: metCount
  };
}

/**
 * Calculate effectiveness of completed task
 */
function calculateEffectiveness(baseline, current, recommendationType) {
  let effectivenessScore = 0;
  const improvements = [];
  
  // Calculate improvements based on recommendation type
  switch (recommendationType) {
    case 'retention':
      if (baseline.retention_score && current.retention_score) {
        const improvement = current.retention_score - baseline.retention_score;
        effectivenessScore += Math.max(0, improvement);
        improvements.push({
          metric: 'retention_score',
          baseline: baseline.retention_score,
          current: current.retention_score,
          improvement
        });
      }
      break;
      
    case 'onboarding':
      if (baseline.adoption_score && current.adoption_score) {
        const improvement = current.adoption_score - baseline.adoption_score;
        effectivenessScore += Math.max(0, improvement);
        improvements.push({
          metric: 'adoption_score',
          baseline: baseline.adoption_score,
          current: current.adoption_score,
          improvement
        });
      }
      break;
      
    case 'engagement':
      if (baseline.activity_score && current.activity_score) {
        const improvement = current.activity_score - baseline.activity_score;
        effectivenessScore += Math.max(0, improvement);
        improvements.push({
          metric: 'activity_score',
          baseline: baseline.activity_score,
          current: current.activity_score,
          improvement
        });
      }
      break;
      
    case 'marketing':
    case 'feature_enhancement':
      // Overall productivity improvement
      if (baseline.productivity_score && current.productivity_score) {
        const improvement = current.productivity_score - baseline.productivity_score;
        effectivenessScore += Math.max(0, improvement);
        improvements.push({
          metric: 'productivity_score',
          baseline: baseline.productivity_score,
          current: current.productivity_score,
          improvement
        });
      }
      break;
  }
  
  // Normalize to 0-100 scale
  effectivenessScore = Math.min(effectivenessScore, 100);
  
  return {
    score: Math.round(effectivenessScore * 100) / 100,
    level: effectivenessScore >= 20 ? 'High' : effectivenessScore >= 10 ? 'Medium' : 'Low',
    improvements,
    summary: `Task effectiveness: ${effectivenessScore >= 20 ? 'High' : effectivenessScore >= 10 ? 'Medium' : 'Low'} (${Math.round(effectivenessScore)} points improvement)`
  };
}

/**
 * Mark task as completed
 */
async function markTaskCompleted(recommendationId, currentMetrics, effectiveness) {
  try {
    const result = await pool.query(`
      UPDATE ai_recommendations
      SET 
        status = 'completed',
        current_metrics = $1,
        effectiveness_score = $2,
        completed_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [
      JSON.stringify(currentMetrics),
      effectiveness.score,
      recommendationId
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error(`Error marking task ${recommendationId} as completed:`, error);
    throw error;
  }
}

/**
 * Set baseline metrics for a recommendation
 * Should be called when recommendation is created or when monitoring starts
 */
async function setBaselineMetrics(recommendationId) {
  try {
    const recResult = await pool.query(`
      SELECT wallet_id, project_id FROM ai_recommendations
      WHERE id = $1
    `, [recommendationId]);

    if (recResult.rows.length === 0) {
      throw new Error(`Recommendation ${recommendationId} not found`);
    }

    const { wallet_id, project_id } = recResult.rows[0];
    
    // Get current metrics as baseline
    const baselineMetrics = await getCurrentMetrics(wallet_id, project_id);
    
    // Update recommendation with baseline
    await pool.query(`
      UPDATE ai_recommendations
      SET baseline_metrics = $1
      WHERE id = $2
    `, [JSON.stringify(baselineMetrics), recommendationId]);
    
    return baselineMetrics;
  } catch (error) {
    console.error(`Error setting baseline metrics for ${recommendationId}:`, error);
    throw error;
  }
}

/**
 * Run monitoring for all pending recommendations
 * This should be called periodically (e.g., daily cron job)
 */
async function runPeriodicMonitoring() {
  try {
    console.log('🔄 Running periodic task completion monitoring...');
    
    // Get all pending/in-progress recommendations
    const result = await pool.query(`
      SELECT id, wallet_id, project_id
      FROM ai_recommendations
      WHERE status IN ('pending', 'in_progress')
      ORDER BY created_at DESC
    `);
    
    const recommendations = result.rows;
    console.log(`Found ${recommendations.length} recommendations to monitor`);
    
    const results = {
      total_monitored: recommendations.length,
      completed: 0,
      still_pending: 0,
      errors: 0,
      details: []
    };
    
    for (const rec of recommendations) {
      try {
        const status = await monitorTaskCompletion(rec.id);
        
        if (status.is_completed) {
          results.completed++;
          console.log(`  ✅ Recommendation ${rec.id} completed`);
        } else {
          results.still_pending++;
          console.log(`  ⏳ Recommendation ${rec.id} still pending (${status.completion_percentage}% complete)`);
        }
        
        results.details.push(status);
      } catch (error) {
        results.errors++;
        console.error(`  ❌ Error monitoring ${rec.id}:`, error.message);
        results.details.push({
          recommendation_id: rec.id,
          error: error.message
        });
      }
    }
    
    console.log(`✅ Monitoring complete: ${results.completed} completed, ${results.still_pending} pending, ${results.errors} errors`);
    
    return results;
  } catch (error) {
    console.error('Error in periodic monitoring:', error);
    throw error;
  }
}

export {
  monitorTaskCompletion,
  monitorWalletRecommendations,
  monitorProjectRecommendations,
  getCurrentMetrics,
  checkCompletionIndicators,
  calculateEffectiveness,
  markTaskCompleted,
  setBaselineMetrics,
  runPeriodicMonitoring
};
