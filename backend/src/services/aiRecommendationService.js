import pool from '../db/db.js';
import { calculateEnhancedProductivityScore } from './productivityScoringService.js';

/**
 * AI Recommendation Generation Service
 * Generates task recommendations based on declining productivity metrics,
 * implements recommendation types (marketing, onboarding, feature enhancement),
 * and adds priority scoring and action item generation
 */

// Recommendation types and their characteristics
const RECOMMENDATION_TYPES = {
  marketing: {
    name: 'Marketing Campaign',
    typical_timeline: '2-4 weeks',
    effort_level: 'medium'
  },
  onboarding: {
    name: 'Onboarding Optimization',
    typical_timeline: '1-3 weeks',
    effort_level: 'medium'
  },
  feature_enhancement: {
    name: 'Feature Enhancement',
    typical_timeline: '4-8 weeks',
    effort_level: 'high'
  },
  retention: {
    name: 'Retention Initiative',
    typical_timeline: '2-6 weeks',
    effort_level: 'medium'
  },
  engagement: {
    name: 'Engagement Campaign',
    typical_timeline: '1-2 weeks',
    effort_level: 'low'
  }
};

/**
 * Generate AI recommendations for a wallet based on productivity metrics
 * @param {string} walletId - Wallet UUID
 * @returns {Object} Generated recommendations with priorities and actions
 */
async function generateWalletRecommendations(walletId) {
  try {
    // Get current productivity scores
    const scores = await calculateEnhancedProductivityScore(walletId);
    
    // Analyze declining metrics
    const decliningMetrics = identifyDecliningMetrics(scores);
    
    // Generate recommendations for each declining metric
    const recommendations = [];
    
    for (const metric of decliningMetrics) {
      const recs = await generateRecommendationsForMetric(walletId, metric, scores);
      recommendations.push(...recs);
    }
    
    // Add general recommendations if overall score is low
    if (scores.total_score < 50) {
      const generalRecs = generateGeneralRecommendations(scores);
      recommendations.push(...generalRecs);
    }
    
    // Sort by priority and return top recommendations
    const sortedRecs = recommendations.sort((a, b) => b.priority - a.priority);
    
    return {
      wallet_id: walletId,
      total_score: scores.total_score,
      status: scores.status,
      risk_level: scores.risk_level,
      recommendations: sortedRecs.slice(0, 10), // Top 10 recommendations
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error generating recommendations for wallet ${walletId}:`, error);
    throw error;
  }
}

/**
 * Generate AI recommendations for a project
 * @param {string} projectId - Project UUID
 * @returns {Object} Project-level recommendations
 */
async function generateProjectRecommendations(projectId) {
  try {
    // Get all wallets for the project
    const walletsResult = await pool.query(`
      SELECT w.id, wps.total_score, wps.status, wps.risk_level
      FROM wallets w
      LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
      WHERE w.project_id = $1
      AND w.is_active = true
    `, [projectId]);
    
    const wallets = walletsResult.rows;
    
    if (wallets.length === 0) {
      return {
        project_id: projectId,
        recommendations: [],
        message: 'No active wallets found for this project'
      };
    }
    
    // Analyze project-level patterns
    const projectAnalysis = analyzeProjectHealth(wallets);
    
    // Generate project-level recommendations
    const recommendations = generateProjectLevelRecommendations(projectAnalysis);
    
    // Add wallet-specific recommendations for high-risk wallets
    const highRiskWallets = wallets.filter(w => w.risk_level === 'high');
    if (highRiskWallets.length > 0) {
      recommendations.push({
        recommendation_type: 'retention',
        title: `Address ${highRiskWallets.length} high-risk wallets`,
        description: `${highRiskWallets.length} wallets are at high risk of churning`,
        priority: 9,
        actions: [
          'Identify common patterns among high-risk wallets',
          'Launch targeted re-engagement campaign',
          'Provide personalized support and incentives',
          'Monitor progress weekly'
        ],
        expected_impact: 'High',
        timeline: '1-2 weeks'
      });
    }
    
    return {
      project_id: projectId,
      total_wallets: wallets.length,
      project_health: projectAnalysis,
      recommendations: recommendations.sort((a, b) => b.priority - a.priority),
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error generating project recommendations for ${projectId}:`, error);
    throw error;
  }
}

/**
 * Identify declining metrics from productivity scores
 */
function identifyDecliningMetrics(scores) {
  const declining = [];
  const threshold = 50; // Metrics below this are considered declining
  
  if (scores.component_scores.retention_score < threshold) {
    declining.push({
      name: 'retention',
      score: scores.component_scores.retention_score,
      severity: scores.component_scores.retention_score < 30 ? 'high' : 'medium'
    });
  }
  
  if (scores.component_scores.adoption_score < threshold) {
    declining.push({
      name: 'adoption',
      score: scores.component_scores.adoption_score,
      severity: scores.component_scores.adoption_score < 30 ? 'high' : 'medium'
    });
  }
  
  if (scores.component_scores.activity_score < threshold) {
    declining.push({
      name: 'activity',
      score: scores.component_scores.activity_score,
      severity: scores.component_scores.activity_score < 30 ? 'high' : 'medium'
    });
  }
  
  if (scores.component_scores.frequency_score < threshold) {
    declining.push({
      name: 'frequency',
      score: scores.component_scores.frequency_score,
      severity: scores.component_scores.frequency_score < 30 ? 'high' : 'medium'
    });
  }
  
  // Churn score is inverted (higher is better), so check if it's low
  if (scores.component_scores.churn_score < threshold) {
    declining.push({
      name: 'churn',
      score: scores.component_scores.churn_score,
      severity: scores.component_scores.churn_score < 30 ? 'high' : 'medium'
    });
  }
  
  return declining;
}

/**
 * Generate recommendations for a specific metric
 */
async function generateRecommendationsForMetric(walletId, metric, scores) {
  const recommendations = [];
  
  switch (metric.name) {
    case 'retention':
      recommendations.push(...generateRetentionRecommendations(walletId, metric, scores));
      break;
    case 'adoption':
      recommendations.push(...generateAdoptionRecommendations(walletId, metric, scores));
      break;
    case 'activity':
      recommendations.push(...generateActivityRecommendations(walletId, metric, scores));
      break;
    case 'frequency':
      recommendations.push(...generateFrequencyRecommendations(walletId, metric, scores));
      break;
    case 'churn':
      recommendations.push(...generateChurnRecommendations(walletId, metric, scores));
      break;
  }
  
  return recommendations;
}

/**
 * Generate retention-focused recommendations
 */
function generateRetentionRecommendations(walletId, metric, scores) {
  const priority = metric.severity === 'high' ? 9 : 7;
  
  return [{
    wallet_id: walletId,
    recommendation_type: 'retention',
    title: 'Improve wallet retention',
    description: `Retention score is ${metric.score}/100. Implement strategies to keep this wallet engaged.`,
    priority,
    actions: [
      'Send personalized re-engagement email',
      'Offer exclusive features or benefits',
      'Provide usage tips and best practices',
      'Schedule follow-up check-ins'
    ],
    completion_indicators: {
      activity_increase: true,
      transaction_frequency: 'weekly',
      retention_score_target: 70
    },
    expected_impact: metric.severity === 'high' ? 'High' : 'Medium',
    timeline: '2-4 weeks'
  }];
}

/**
 * Generate adoption-focused recommendations
 */
function generateAdoptionRecommendations(walletId, metric, scores) {
  const priority = metric.severity === 'high' ? 8 : 6;
  
  return [{
    wallet_id: walletId,
    recommendation_type: 'onboarding',
    title: 'Optimize onboarding experience',
    description: `Adoption score is ${metric.score}/100. Help this wallet progress through adoption stages.`,
    priority,
    actions: [
      'Send guided tutorial or walkthrough',
      'Highlight key features not yet used',
      'Provide incentives for feature exploration',
      'Simplify complex workflows'
    ],
    completion_indicators: {
      adoption_stage_progress: true,
      feature_usage_increase: true,
      adoption_score_target: 70
    },
    expected_impact: metric.severity === 'high' ? 'High' : 'Medium',
    timeline: '1-3 weeks'
  }];
}

/**
 * Generate activity-focused recommendations
 */
function generateActivityRecommendations(walletId, metric, scores) {
  const priority = metric.severity === 'high' ? 8 : 6;
  
  return [{
    wallet_id: walletId,
    recommendation_type: 'engagement',
    title: 'Increase wallet activity',
    description: `Activity score is ${metric.score}/100. Encourage more frequent interactions.`,
    priority,
    actions: [
      'Send activity-based notifications',
      'Offer time-limited promotions',
      'Gamify user interactions',
      'Provide activity streaks or rewards'
    ],
    completion_indicators: {
      daily_active_increase: true,
      transaction_count_increase: true,
      activity_score_target: 70
    },
    expected_impact: metric.severity === 'high' ? 'High' : 'Medium',
    timeline: '1-2 weeks'
  }];
}

/**
 * Generate frequency-focused recommendations
 */
function generateFrequencyRecommendations(walletId, metric, scores) {
  const priority = metric.severity === 'high' ? 7 : 5;
  
  return [{
    wallet_id: walletId,
    recommendation_type: 'engagement',
    title: 'Improve transaction frequency',
    description: `Frequency score is ${metric.score}/100. Encourage more regular usage.`,
    priority,
    actions: [
      'Set up automated reminders',
      'Create recurring use cases',
      'Offer subscription or membership benefits',
      'Build habit-forming features'
    ],
    completion_indicators: {
      transaction_frequency: 'weekly',
      consistency_improvement: true,
      frequency_score_target: 70
    },
    expected_impact: 'Medium',
    timeline: '2-4 weeks'
  }];
}

/**
 * Generate churn prevention recommendations
 */
function generateChurnRecommendations(walletId, metric, scores) {
  const priority = 10; // Churn prevention is always high priority
  
  return [{
    wallet_id: walletId,
    recommendation_type: 'retention',
    title: 'Prevent wallet churn',
    description: `Churn risk score is ${metric.score}/100. Immediate action needed to prevent disengagement.`,
    priority,
    actions: [
      'Reach out with personalized support',
      'Identify and address pain points',
      'Offer special retention incentives',
      'Conduct user feedback survey',
      'Provide VIP support access'
    ],
    completion_indicators: {
      activity_resumed: true,
      engagement_sustained: true,
      churn_score_target: 70
    },
    expected_impact: 'Critical',
    timeline: '1 week'
  }];
}

/**
 * Generate general recommendations for low-scoring wallets
 */
function generateGeneralRecommendations(scores) {
  return [{
    recommendation_type: 'marketing',
    title: 'Comprehensive engagement campaign',
    description: `Overall productivity score is ${scores.total_score}/100. Launch multi-channel engagement initiative.`,
    priority: 8,
    actions: [
      'Audit current user experience',
      'Identify key friction points',
      'Launch targeted marketing campaign',
      'Improve product value proposition',
      'Enhance customer support'
    ],
    completion_indicators: {
      overall_score_increase: true,
      multiple_metrics_improved: true,
      total_score_target: 70
    },
    expected_impact: 'High',
    timeline: '4-6 weeks'
  }];
}

/**
 * Analyze project health from wallet data
 */
function analyzeProjectHealth(wallets) {
  const totalWallets = wallets.length;
  const healthyCount = wallets.filter(w => w.status === 'healthy').length;
  const atRiskCount = wallets.filter(w => w.status === 'at_risk').length;
  const churnCount = wallets.filter(w => w.status === 'churn').length;
  
  const avgScore = wallets.reduce((sum, w) => sum + (w.total_score || 0), 0) / totalWallets;
  
  const highRiskCount = wallets.filter(w => w.risk_level === 'high').length;
  const mediumRiskCount = wallets.filter(w => w.risk_level === 'medium').length;
  const lowRiskCount = wallets.filter(w => w.risk_level === 'low').length;
  
  return {
    total_wallets: totalWallets,
    average_score: Math.round(avgScore),
    health_distribution: {
      healthy: healthyCount,
      at_risk: atRiskCount,
      churn: churnCount
    },
    risk_distribution: {
      high: highRiskCount,
      medium: mediumRiskCount,
      low: lowRiskCount
    },
    health_percentage: Math.round((healthyCount / totalWallets) * 100),
    at_risk_percentage: Math.round((atRiskCount / totalWallets) * 100),
    churn_percentage: Math.round((churnCount / totalWallets) * 100)
  };
}

/**
 * Generate project-level recommendations
 */
function generateProjectLevelRecommendations(analysis) {
  const recommendations = [];
  
  // If churn rate is high
  if (analysis.churn_percentage > 30) {
    recommendations.push({
      recommendation_type: 'retention',
      title: 'Address high churn rate',
      description: `${analysis.churn_percentage}% of wallets are churning. Implement retention strategies.`,
      priority: 10,
      actions: [
        'Analyze common churn patterns',
        'Improve product value delivery',
        'Launch win-back campaign',
        'Enhance onboarding process',
        'Implement early warning system'
      ],
      expected_impact: 'Critical',
      timeline: '2-4 weeks'
    });
  }
  
  // If at-risk percentage is high
  if (analysis.at_risk_percentage > 40) {
    recommendations.push({
      recommendation_type: 'engagement',
      title: 'Re-engage at-risk wallets',
      description: `${analysis.at_risk_percentage}% of wallets are at risk. Proactive engagement needed.`,
      priority: 9,
      actions: [
        'Segment at-risk wallets by behavior',
        'Create targeted re-engagement campaigns',
        'Offer personalized incentives',
        'Improve feature discoverability'
      ],
      expected_impact: 'High',
      timeline: '2-3 weeks'
    });
  }
  
  // If average score is low
  if (analysis.average_score < 50) {
    recommendations.push({
      recommendation_type: 'feature_enhancement',
      title: 'Improve overall product experience',
      description: `Average productivity score is ${analysis.average_score}/100. Comprehensive improvements needed.`,
      priority: 8,
      actions: [
        'Conduct user research and feedback sessions',
        'Identify and fix major pain points',
        'Enhance core features',
        'Improve user interface and experience',
        'Add requested features'
      ],
      expected_impact: 'High',
      timeline: '6-8 weeks'
    });
  }
  
  // If healthy percentage is low
  if (analysis.health_percentage < 40) {
    recommendations.push({
      recommendation_type: 'marketing',
      title: 'Boost user acquisition and activation',
      description: `Only ${analysis.health_percentage}% of wallets are healthy. Focus on quality growth.`,
      priority: 7,
      actions: [
        'Optimize user acquisition channels',
        'Improve activation rate',
        'Enhance onboarding experience',
        'Build community engagement',
        'Implement referral program'
      ],
      expected_impact: 'Medium',
      timeline: '4-6 weeks'
    });
  }
  
  return recommendations;
}

/**
 * Store recommendation in database
 */
async function storeRecommendation(recommendation) {
  try {
    const result = await pool.query(`
      INSERT INTO ai_recommendations (
        wallet_id,
        project_id,
        recommendation_type,
        title,
        description,
        priority,
        completion_indicators,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `, [
      recommendation.wallet_id || null,
      recommendation.project_id || null,
      recommendation.recommendation_type,
      recommendation.title,
      recommendation.description,
      recommendation.priority,
      JSON.stringify(recommendation.completion_indicators || {})
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error storing recommendation:', error);
    throw error;
  }
}

/**
 * Get recommendations for a wallet
 */
async function getWalletRecommendations(walletId, status = null) {
  try {
    let query = `
      SELECT * FROM ai_recommendations
      WHERE wallet_id = $1
    `;
    
    const params = [walletId];
    
    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY priority DESC, created_at DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error(`Error getting recommendations for wallet ${walletId}:`, error);
    throw error;
  }
}

/**
 * Get recommendations for a project
 */
async function getProjectRecommendations(projectId, status = null) {
  try {
    let query = `
      SELECT * FROM ai_recommendations
      WHERE project_id = $1
    `;
    
    const params = [projectId];
    
    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY priority DESC, created_at DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error(`Error getting recommendations for project ${projectId}:`, error);
    throw error;
  }
}

export {
  generateWalletRecommendations,
  generateProjectRecommendations,
  identifyDecliningMetrics,
  generateRecommendationsForMetric,
  analyzeProjectHealth,
  storeRecommendation,
  getWalletRecommendations,
  getProjectRecommendations,
  RECOMMENDATION_TYPES
};
