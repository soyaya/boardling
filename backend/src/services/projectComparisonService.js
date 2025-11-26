import pool from '../db/db.js';
import {
  getLatestBenchmark,
  getBenchmarksByCategory,
  calculatePerformanceGap,
  getPercentileRange
} from './benchmarkService.js';
import { getProjectProductivitySummary } from './productivityScoringService.js';

/**
 * Project Comparison Engine
 * Enables side-by-side metrics comparison against benchmarks,
 * identifies performance gaps, and tracks market position changes
 */

/**
 * Get comprehensive project metrics for comparison
 * @param {string} projectId - Project UUID
 * @returns {Object} Project metrics including productivity, retention, adoption, churn
 */
async function getProjectMetrics(projectId) {
  try {
    // Get project details
    const projectResult = await pool.query(`
      SELECT id, name, category, status, created_at, launched_at
      FROM projects
      WHERE id = $1
    `, [projectId]);

    if (projectResult.rows.length === 0) {
      throw new Error(`Project ${projectId} not found`);
    }

    const project = projectResult.rows[0];

    // Get productivity summary
    const productivitySummary = await getProjectProductivitySummary(projectId);

    // Get retention metrics
    const retentionMetrics = await getProjectRetentionMetrics(projectId);

    // Get adoption metrics
    const adoptionMetrics = await getProjectAdoptionMetrics(projectId);

    // Get churn metrics
    const churnMetrics = await getProjectChurnMetrics(projectId);

    return {
      project_id: projectId,
      project_name: project.name,
      category: project.category,
      status: project.status,
      created_at: project.created_at,
      launched_at: project.launched_at,
      metrics: {
        productivity: productivitySummary.average_score,
        retention: retentionMetrics.overall_retention_rate,
        adoption: adoptionMetrics.overall_adoption_rate,
        churn: churnMetrics.churn_rate
      },
      detailed_metrics: {
        productivity: productivitySummary,
        retention: retentionMetrics,
        adoption: adoptionMetrics,
        churn: churnMetrics
      },
      calculated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error getting project metrics for ${projectId}:`, error);
    throw error;
  }
}

/**
 * Get project retention metrics
 */
async function getProjectRetentionMetrics(projectId) {
  const result = await pool.query(`
    SELECT 
      wc.cohort_type,
      AVG(wc.retention_week_1) as avg_week_1,
      AVG(wc.retention_week_2) as avg_week_2,
      AVG(wc.retention_week_3) as avg_week_3,
      AVG(wc.retention_week_4) as avg_week_4
    FROM wallet_cohorts wc
    JOIN wallet_cohort_assignments wca ON wc.id = wca.cohort_id
    JOIN wallets w ON wca.wallet_id = w.id
    WHERE w.project_id = $1
    GROUP BY wc.cohort_type
  `, [projectId]);

  const weeklyData = result.rows.find(r => r.cohort_type === 'weekly');
  
  const overallRetention = weeklyData ? 
    (parseFloat(weeklyData.avg_week_1) + parseFloat(weeklyData.avg_week_2) + 
     parseFloat(weeklyData.avg_week_3) + parseFloat(weeklyData.avg_week_4)) / 4 : 0;

  return {
    overall_retention_rate: Math.round(overallRetention * 100) / 100,
    week_1: weeklyData ? Math.round(parseFloat(weeklyData.avg_week_1) * 100) / 100 : 0,
    week_2: weeklyData ? Math.round(parseFloat(weeklyData.avg_week_2) * 100) / 100 : 0,
    week_3: weeklyData ? Math.round(parseFloat(weeklyData.avg_week_3) * 100) / 100 : 0,
    week_4: weeklyData ? Math.round(parseFloat(weeklyData.avg_week_4) * 100) / 100 : 0
  };
}

/**
 * Get project adoption metrics
 */
async function getProjectAdoptionMetrics(projectId) {
  const result = await pool.query(`
    SELECT 
      was.stage_name,
      COUNT(DISTINCT was.wallet_id) as wallets_achieved,
      AVG(was.time_to_achieve_hours) as avg_time_to_achieve
    FROM wallet_adoption_stages was
    JOIN wallets w ON was.wallet_id = w.id
    WHERE w.project_id = $1
    AND was.achieved_at IS NOT NULL
    GROUP BY was.stage_name
  `, [projectId]);

  const totalWalletsResult = await pool.query(`
    SELECT COUNT(*) as total FROM wallets WHERE project_id = $1
  `, [projectId]);

  const totalWallets = parseInt(totalWalletsResult.rows[0].total);
  const stages = result.rows;

  const stageData = {};
  let totalAdoptionScore = 0;

  stages.forEach(stage => {
    const achieved = parseInt(stage.wallets_achieved);
    const percentage = totalWallets > 0 ? (achieved / totalWallets) * 100 : 0;
    stageData[stage.stage_name] = {
      wallets_achieved: achieved,
      percentage: Math.round(percentage * 100) / 100,
      avg_time_hours: Math.round(parseFloat(stage.avg_time_to_achieve) || 0)
    };
    totalAdoptionScore += percentage;
  });

  return {
    overall_adoption_rate: Math.round((totalAdoptionScore / 5) * 100) / 100, // Average across 5 stages
    total_wallets: totalWallets,
    stages: stageData
  };
}

/**
 * Get project churn metrics
 */
async function getProjectChurnMetrics(projectId) {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_wallets,
      COUNT(CASE WHEN wps.status = 'churn' THEN 1 END) as churned_wallets,
      COUNT(CASE WHEN wps.risk_level = 'high' THEN 1 END) as high_risk_wallets,
      AVG(CASE WHEN wps.status = 'churn' THEN wps.total_score END) as avg_churn_score
    FROM wallets w
    LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
    WHERE w.project_id = $1
  `, [projectId]);

  const data = result.rows[0];
  const totalWallets = parseInt(data.total_wallets);
  const churnedWallets = parseInt(data.churned_wallets);
  const highRiskWallets = parseInt(data.high_risk_wallets);

  return {
    churn_rate: totalWallets > 0 ? Math.round((churnedWallets / totalWallets) * 10000) / 100 : 0,
    churned_wallets: churnedWallets,
    high_risk_wallets: highRiskWallets,
    at_risk_percentage: totalWallets > 0 ? Math.round((highRiskWallets / totalWallets) * 10000) / 100 : 0,
    avg_churn_score: Math.round(parseFloat(data.avg_churn_score) || 0)
  };
}

/**
 * Compare project against benchmarks
 * @param {string} projectId - Project UUID
 * @param {string} targetPercentile - Target percentile ('p50', 'p75', 'p90')
 * @returns {Object} Comparison results with gaps and recommendations
 */
async function compareProjectToBenchmarks(projectId, targetPercentile = 'p50') {
  try {
    // Get project metrics
    const projectMetrics = await getProjectMetrics(projectId);
    const category = projectMetrics.category;

    // Get benchmarks for this category
    const benchmarks = await getBenchmarksByCategory(category);

    if (benchmarks.length === 0) {
      return {
        project_id: projectId,
        category,
        status: 'no_benchmarks',
        message: `No benchmarks available for category: ${category}`,
        project_metrics: projectMetrics
      };
    }

    // Create benchmark map
    const benchmarkMap = {};
    benchmarks.forEach(b => {
      benchmarkMap[b.benchmark_type] = b;
    });

    // Calculate gaps for each metric
    const comparisons = {};
    const metricTypes = ['productivity', 'retention', 'adoption', 'churn'];

    metricTypes.forEach(metricType => {
      const benchmark = benchmarkMap[metricType];
      const value = projectMetrics.metrics[metricType];

      if (benchmark) {
        const gap = calculatePerformanceGap(value, benchmark, targetPercentile);
        const range = getPercentileRange(value, benchmark);

        comparisons[metricType] = {
          current_value: value,
          benchmark_target: gap.targetValue,
          gap: gap.gap,
          gap_percentage: gap.percentage,
          status: gap.status,
          percentile_range: range,
          benchmark_data: {
            p25: benchmark.percentile_25,
            p50: benchmark.percentile_50,
            p75: benchmark.percentile_75,
            p90: benchmark.percentile_90,
            sample_size: benchmark.sample_size,
            calculation_date: benchmark.calculation_date
          }
        };
      } else {
        comparisons[metricType] = {
          current_value: value,
          status: 'no_benchmark',
          message: `No benchmark available for ${metricType}`
        };
      }
    });

    // Identify performance gaps
    const gaps = identifyPerformanceGaps(comparisons, targetPercentile);

    // Generate recommendations
    const recommendations = generateComparisonRecommendations(gaps, projectMetrics);

    return {
      project_id: projectId,
      project_name: projectMetrics.project_name,
      category,
      target_percentile: targetPercentile,
      comparisons,
      performance_gaps: gaps,
      recommendations,
      overall_position: calculateOverallPosition(comparisons),
      compared_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error comparing project ${projectId} to benchmarks:`, error);
    throw error;
  }
}

/**
 * Identify significant performance gaps
 */
function identifyPerformanceGaps(comparisons, targetPercentile) {
  const gaps = {
    underperforming: [],
    outperforming: [],
    at_target: []
  };

  Object.entries(comparisons).forEach(([metric, data]) => {
    if (data.status === 'no_benchmark') return;

    const gapPercentage = Math.abs(data.gap_percentage);

    if (data.status === 'below_target' && gapPercentage > 10) {
      gaps.underperforming.push({
        metric,
        current: data.current_value,
        target: data.benchmark_target,
        gap: data.gap,
        gap_percentage: data.gap_percentage,
        severity: gapPercentage > 30 ? 'high' : gapPercentage > 20 ? 'medium' : 'low'
      });
    } else if (data.status === 'above_target' && gapPercentage > 10) {
      gaps.outperforming.push({
        metric,
        current: data.current_value,
        target: data.benchmark_target,
        gap: data.gap,
        gap_percentage: data.gap_percentage
      });
    } else {
      gaps.at_target.push({
        metric,
        current: data.current_value,
        target: data.benchmark_target
      });
    }
  });

  return gaps;
}

/**
 * Generate recommendations based on comparison
 */
function generateComparisonRecommendations(gaps, projectMetrics) {
  const recommendations = [];

  // Recommendations for underperforming metrics
  gaps.underperforming.forEach(gap => {
    let recommendation = {
      metric: gap.metric,
      priority: gap.severity === 'high' ? 10 : gap.severity === 'medium' ? 7 : 5,
      type: 'improvement',
      title: `Improve ${gap.metric}`,
      description: '',
      actions: []
    };

    switch (gap.metric) {
      case 'productivity':
        recommendation.description = `Your productivity score (${gap.current}) is ${Math.abs(gap.gap_percentage)}% below the ${gap.target} benchmark.`;
        recommendation.actions = [
          'Increase user engagement through targeted campaigns',
          'Optimize onboarding flow to reduce friction',
          'Implement retention strategies for at-risk users'
        ];
        break;

      case 'retention':
        recommendation.description = `Your retention rate (${gap.current}%) is ${Math.abs(gap.gap_percentage)}% below the ${gap.target}% benchmark.`;
        recommendation.actions = [
          'Analyze drop-off points in user journey',
          'Implement re-engagement campaigns for inactive users',
          'Add value-driving features to increase stickiness'
        ];
        break;

      case 'adoption':
        recommendation.description = `Your adoption rate (${gap.current}%) is ${Math.abs(gap.gap_percentage)}% below the ${gap.target}% benchmark.`;
        recommendation.actions = [
          'Simplify onboarding process',
          'Add progressive feature discovery',
          'Provide incentives for completing adoption stages'
        ];
        break;

      case 'churn':
        recommendation.description = `Your churn rate (${gap.current}%) is ${Math.abs(gap.gap_percentage)}% above the ${gap.target}% benchmark.`;
        recommendation.actions = [
          'Identify and address common churn triggers',
          'Implement early warning system for at-risk users',
          'Improve product value proposition'
        ];
        break;
    }

    recommendations.push(recommendation);
  });

  // Highlight strengths
  if (gaps.outperforming.length > 0) {
    recommendations.push({
      metric: 'strengths',
      priority: 3,
      type: 'strength',
      title: 'Leverage Your Strengths',
      description: `You're outperforming benchmarks in: ${gaps.outperforming.map(g => g.metric).join(', ')}`,
      actions: [
        'Document and replicate successful strategies',
        'Share best practices across your organization',
        'Consider these as competitive advantages in marketing'
      ]
    });
  }

  return recommendations.sort((a, b) => b.priority - a.priority);
}

/**
 * Calculate overall market position
 */
function calculateOverallPosition(comparisons) {
  const validComparisons = Object.values(comparisons).filter(c => c.status !== 'no_benchmark');
  
  if (validComparisons.length === 0) {
    return { position: 'unknown', score: 0 };
  }

  const rangeScores = {
    'above_90': 5,
    '75_90': 4,
    '50_75': 3,
    '25_50': 2,
    'below_25': 1
  };

  const totalScore = validComparisons.reduce((sum, comp) => {
    return sum + (rangeScores[comp.percentile_range] || 0);
  }, 0);

  const avgScore = totalScore / validComparisons.length;

  let position = 'below_average';
  if (avgScore >= 4.5) position = 'top_performer';
  else if (avgScore >= 3.5) position = 'above_average';
  else if (avgScore >= 2.5) position = 'average';

  return {
    position,
    score: Math.round(avgScore * 100) / 100,
    metrics_compared: validComparisons.length
  };
}

/**
 * Track market position changes over time
 * @param {string} projectId - Project UUID
 * @param {number} daysBack - Number of days to look back
 */
async function trackMarketPositionChanges(projectId, daysBack = 30) {
  try {
    // This would require storing historical comparison data
    // For now, we'll return a placeholder structure
    
    const currentComparison = await compareProjectToBenchmarks(projectId, 'p50');
    
    // In a full implementation, we'd query historical comparison data
    // and calculate trends
    
    return {
      project_id: projectId,
      current_position: currentComparison.overall_position,
      trend: 'stable', // Would be calculated from historical data
      changes: {
        productivity: { change: 0, direction: 'stable' },
        retention: { change: 0, direction: 'stable' },
        adoption: { change: 0, direction: 'stable' },
        churn: { change: 0, direction: 'stable' }
      },
      period_days: daysBack,
      message: 'Historical tracking requires storing comparison snapshots over time'
    };
  } catch (error) {
    console.error(`Error tracking market position for ${projectId}:`, error);
    throw error;
  }
}

/**
 * Compare multiple projects side-by-side
 * @param {string[]} projectIds - Array of project UUIDs
 * @param {string} targetPercentile - Target percentile for comparison
 */
async function compareMultipleProjects(projectIds, targetPercentile = 'p50') {
  try {
    const comparisons = await Promise.all(
      projectIds.map(id => compareProjectToBenchmarks(id, targetPercentile))
    );

    // Create side-by-side comparison matrix
    const matrix = {
      projects: comparisons.map(c => ({
        id: c.project_id,
        name: c.project_name,
        category: c.category,
        position: c.overall_position
      })),
      metrics: {}
    };

    // Build comparison matrix for each metric
    const metricTypes = ['productivity', 'retention', 'adoption', 'churn'];
    metricTypes.forEach(metric => {
      matrix.metrics[metric] = comparisons.map(c => ({
        project_id: c.project_id,
        value: c.comparisons[metric]?.current_value || 0,
        gap: c.comparisons[metric]?.gap || 0,
        status: c.comparisons[metric]?.status || 'unknown',
        percentile_range: c.comparisons[metric]?.percentile_range || 'unknown'
      }));
    });

    // Identify leader in each metric
    matrix.leaders = {};
    metricTypes.forEach(metric => {
      const values = matrix.metrics[metric];
      const maxValue = Math.max(...values.map(v => v.value));
      const leader = values.find(v => v.value === maxValue);
      matrix.leaders[metric] = leader?.project_id || null;
    });

    return {
      comparison_matrix: matrix,
      target_percentile: targetPercentile,
      compared_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error comparing multiple projects:', error);
    throw error;
  }
}

export {
  getProjectMetrics,
  compareProjectToBenchmarks,
  trackMarketPositionChanges,
  compareMultipleProjects,
  identifyPerformanceGaps,
  generateComparisonRecommendations,
  calculateOverallPosition
};
