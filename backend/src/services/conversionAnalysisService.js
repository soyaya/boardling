import pool from '../db/db.js';

/**
 * Conversion Rate and Drop-off Analysis Service
 * 
 * Provides detailed analysis of conversion rates between adoption stages,
 * identifies significant drop-off points, and generates segmented analysis
 * by cohort, wallet type, and other dimensions.
 */

// Define significance thresholds for drop-off analysis
const DROP_OFF_THRESHOLDS = {
  high: 70,    // >70% drop-off is high severity
  medium: 50,  // 50-70% drop-off is medium severity
  low: 30      // 30-50% drop-off is low severity
};

// Define minimum sample sizes for statistical significance
const MIN_SAMPLE_SIZES = {
  conversion_analysis: 10,
  segmented_analysis: 5,
  trend_analysis: 20
};

/**
 * Calculate detailed conversion rates between all adoption stages
 */
async function calculateConversionRates(projectId, options = {}) {
  const {
    segmentBy = null, // 'cohort', 'wallet_type', 'time_period'
    timeRange = null, // { start: Date, end: Date }
    minSampleSize = MIN_SAMPLE_SIZES.conversion_analysis
  } = options;

  let baseQuery = `
    SELECT 
      was.stage_name,
      COUNT(*) as total_wallets,
      COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) as achieved_wallets,
      ROUND(100.0 * COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) / COUNT(*), 2) as conversion_rate,
      AVG(CASE WHEN was.achieved_at IS NOT NULL THEN was.time_to_achieve_hours END) as avg_time_to_achieve_hours,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY was.time_to_achieve_hours) as median_time_to_achieve_hours,
      MIN(was.time_to_achieve_hours) as min_time_to_achieve_hours,
      MAX(was.time_to_achieve_hours) as max_time_to_achieve_hours
    FROM wallets w
    JOIN wallet_adoption_stages was ON w.id = was.wallet_id
    WHERE w.project_id = $1`;

  const queryParams = [projectId];
  let paramIndex = 2;

  // Add time range filter if specified
  if (timeRange) {
    baseQuery += ` AND w.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
    queryParams.push(timeRange.start, timeRange.end);
    paramIndex += 2;
  }

  // Add segmentation if specified
  let segmentField = '';
  if (segmentBy === 'cohort') {
    baseQuery = `
      SELECT 
        wc.cohort_period as segment,
        was.stage_name,
        COUNT(*) as total_wallets,
        COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) as achieved_wallets,
        ROUND(100.0 * COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) / COUNT(*), 2) as conversion_rate,
        AVG(CASE WHEN was.achieved_at IS NOT NULL THEN was.time_to_achieve_hours END) as avg_time_to_achieve_hours
      FROM wallets w
      JOIN wallet_adoption_stages was ON w.id = was.wallet_id
      LEFT JOIN wallet_cohort_assignments wca ON w.id = wca.wallet_id
      LEFT JOIN wallet_cohorts wc ON wca.cohort_id = wc.id
      WHERE w.project_id = $1`;
    segmentField = 'wc.cohort_period, ';
  }

  baseQuery += `
    GROUP BY ${segmentField}was.stage_name
    HAVING COUNT(*) >= $${paramIndex}
    ORDER BY ${segmentField}
      CASE was.stage_name
        WHEN 'created' THEN 1
        WHEN 'first_tx' THEN 2
        WHEN 'feature_usage' THEN 3
        WHEN 'recurring' THEN 4
        WHEN 'high_value' THEN 5
        ELSE 6
      END`;

  queryParams.push(minSampleSize);

  const result = await pool.query(baseQuery, queryParams);
  return result.rows;
}

/**
 * Calculate stage-to-stage conversion rates and drop-offs
 */
async function calculateStageConversions(projectId, options = {}) {
  const stageData = await calculateConversionRates(projectId, options);
  
  if (!options.segmentBy) {
    // Simple stage-to-stage conversion for non-segmented data
    const conversions = [];
    
    for (let i = 0; i < stageData.length - 1; i++) {
      const currentStage = stageData[i];
      const nextStage = stageData[i + 1];
      
      const conversionRate = currentStage.achieved_wallets > 0 ? 
        (nextStage.achieved_wallets / currentStage.achieved_wallets) * 100 : 0;
      
      const dropOffRate = 100 - conversionRate;
      const walletsDropped = currentStage.achieved_wallets - nextStage.achieved_wallets;
      
      conversions.push({
        from_stage: currentStage.stage_name,
        to_stage: nextStage.stage_name,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        drop_off_rate: Math.round(dropOffRate * 100) / 100,
        wallets_converted: nextStage.achieved_wallets,
        wallets_dropped: walletsDropped,
        sample_size: currentStage.achieved_wallets,
        statistical_significance: currentStage.achieved_wallets >= MIN_SAMPLE_SIZES.conversion_analysis
      });
    }
    
    return conversions;
  } else {
    // Segmented conversion analysis
    const segments = [...new Set(stageData.map(row => row.segment))];
    const segmentedConversions = {};
    
    for (const segment of segments) {
      const segmentStages = stageData.filter(row => row.segment === segment);
      segmentedConversions[segment] = [];
      
      for (let i = 0; i < segmentStages.length - 1; i++) {
        const currentStage = segmentStages[i];
        const nextStage = segmentStages[i + 1];
        
        const conversionRate = currentStage.achieved_wallets > 0 ? 
          (nextStage.achieved_wallets / currentStage.achieved_wallets) * 100 : 0;
        
        const dropOffRate = 100 - conversionRate;
        const walletsDropped = currentStage.achieved_wallets - nextStage.achieved_wallets;
        
        segmentedConversions[segment].push({
          from_stage: currentStage.stage_name,
          to_stage: nextStage.stage_name,
          conversion_rate: Math.round(conversionRate * 100) / 100,
          drop_off_rate: Math.round(dropOffRate * 100) / 100,
          wallets_converted: nextStage.achieved_wallets,
          wallets_dropped: walletsDropped,
          sample_size: currentStage.achieved_wallets,
          statistical_significance: currentStage.achieved_wallets >= MIN_SAMPLE_SIZES.segmented_analysis
        });
      }
    }
    
    return segmentedConversions;
  }
}

/**
 * Identify significant drop-off points with detailed analysis
 */
async function identifySignificantDropOffs(projectId, options = {}) {
  const conversions = await calculateStageConversions(projectId, options);
  
  if (Array.isArray(conversions)) {
    // Non-segmented analysis
    return analyzeDropOffs(conversions);
  } else {
    // Segmented analysis
    const segmentedDropOffs = {};
    
    for (const [segment, segmentConversions] of Object.entries(conversions)) {
      segmentedDropOffs[segment] = analyzeDropOffs(segmentConversions);
    }
    
    return segmentedDropOffs;
  }
}

/**
 * Analyze drop-offs for a set of conversions
 */
function analyzeDropOffs(conversions) {
  return conversions
    .map(conv => {
      let severity = 'low';
      let priority = 1;
      
      if (conv.drop_off_rate >= DROP_OFF_THRESHOLDS.high) {
        severity = 'high';
        priority = 3;
      } else if (conv.drop_off_rate >= DROP_OFF_THRESHOLDS.medium) {
        severity = 'medium';
        priority = 2;
      }
      
      // Adjust priority based on sample size and statistical significance
      if (!conv.statistical_significance) {
        priority = Math.max(1, priority - 1);
      }
      
      // Calculate impact score (drop-off rate * number of wallets lost)
      const impactScore = (conv.drop_off_rate / 100) * conv.wallets_dropped;
      
      return {
        stage_transition: `${conv.from_stage} → ${conv.to_stage}`,
        drop_off_rate: conv.drop_off_rate,
        wallets_lost: conv.wallets_dropped,
        severity,
        priority,
        impact_score: Math.round(impactScore * 100) / 100,
        sample_size: conv.sample_size,
        statistical_significance: conv.statistical_significance,
        recommendations: generateDropOffRecommendations(conv)
      };
    })
    .sort((a, b) => {
      // Sort by priority first, then by impact score
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.impact_score - a.impact_score;
    });
}

/**
 * Generate recommendations for addressing drop-offs
 */
function generateDropOffRecommendations(conversion) {
  const recommendations = [];
  
  const { from_stage, to_stage, drop_off_rate, wallets_dropped } = conversion;
  
  if (from_stage === 'created' && to_stage === 'first_tx') {
    if (drop_off_rate > 50) {
      recommendations.push('Improve onboarding flow to guide users to their first transaction');
      recommendations.push('Add tutorial or guided walkthrough for new users');
      recommendations.push('Reduce friction in wallet setup and funding process');
    }
  } else if (from_stage === 'first_tx' && to_stage === 'feature_usage') {
    if (drop_off_rate > 40) {
      recommendations.push('Highlight additional features after first transaction');
      recommendations.push('Implement progressive feature discovery');
      recommendations.push('Add incentives for trying different transaction types');
    }
  } else if (from_stage === 'feature_usage' && to_stage === 'recurring') {
    if (drop_off_rate > 60) {
      recommendations.push('Implement retention campaigns for engaged users');
      recommendations.push('Add notifications or reminders for continued usage');
      recommendations.push('Analyze user journey to identify friction points');
    }
  } else if (from_stage === 'recurring' && to_stage === 'high_value') {
    if (drop_off_rate > 70) {
      recommendations.push('Create incentives for high-value transactions');
      recommendations.push('Implement loyalty or rewards program');
      recommendations.push('Provide advanced features for power users');
    }
  }
  
  // Add general recommendations based on drop-off severity
  if (drop_off_rate > 70) {
    recommendations.push('Conduct user research to understand barriers');
    recommendations.push('A/B test different approaches to improve conversion');
  }
  
  return recommendations;
}

/**
 * Generate cohort-based funnel analysis
 */
async function getCohortFunnelAnalysis(projectId, options = {}) {
  const {
    cohortType = 'weekly',
    limit = 10
  } = options;

  const result = await pool.query(
    `SELECT 
       wc.cohort_period,
       wc.cohort_type,
       was.stage_name,
       COUNT(*) as total_wallets,
       COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) as achieved_wallets,
       ROUND(100.0 * COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) / COUNT(*), 2) as conversion_rate,
       AVG(CASE WHEN was.achieved_at IS NOT NULL THEN was.time_to_achieve_hours END) as avg_time_to_achieve_hours
     FROM wallets w
     JOIN wallet_adoption_stages was ON w.id = was.wallet_id
     JOIN wallet_cohort_assignments wca ON w.id = wca.wallet_id
     JOIN wallet_cohorts wc ON wca.cohort_id = wc.id
     WHERE w.project_id = $1 AND wc.cohort_type = $2
     GROUP BY wc.cohort_period, wc.cohort_type, was.stage_name
     HAVING COUNT(*) >= $3
     ORDER BY wc.cohort_period DESC, 
       CASE was.stage_name
         WHEN 'created' THEN 1
         WHEN 'first_tx' THEN 2
         WHEN 'feature_usage' THEN 3
         WHEN 'recurring' THEN 4
         WHEN 'high_value' THEN 5
         ELSE 6
       END
     LIMIT $4`,
    [projectId, cohortType, MIN_SAMPLE_SIZES.segmented_analysis, limit * 5] // 5 stages per cohort
  );

  // Group by cohort period
  const cohortData = {};
  result.rows.forEach(row => {
    if (!cohortData[row.cohort_period]) {
      cohortData[row.cohort_period] = [];
    }
    cohortData[row.cohort_period].push(row);
  });

  return cohortData;
}

/**
 * Analyze conversion trends over time
 */
async function analyzeConversionTrends(projectId, options = {}) {
  const {
    timeGranularity = 'weekly', // 'daily', 'weekly', 'monthly'
    lookbackDays = 90
  } = options;

  let dateGrouping = '';
  switch (timeGranularity) {
    case 'daily':
      dateGrouping = "DATE_TRUNC('day', w.created_at)";
      break;
    case 'weekly':
      dateGrouping = "DATE_TRUNC('week', w.created_at)";
      break;
    case 'monthly':
      dateGrouping = "DATE_TRUNC('month', w.created_at)";
      break;
    default:
      dateGrouping = "DATE_TRUNC('week', w.created_at)";
  }

  const result = await pool.query(
    `SELECT 
       ${dateGrouping} as time_period,
       was.stage_name,
       COUNT(*) as total_wallets,
       COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) as achieved_wallets,
       ROUND(100.0 * COUNT(CASE WHEN was.achieved_at IS NOT NULL THEN 1 END) / COUNT(*), 2) as conversion_rate
     FROM wallets w
     JOIN wallet_adoption_stages was ON w.id = was.wallet_id
     WHERE w.project_id = $1 
     AND w.created_at >= CURRENT_DATE - INTERVAL '${lookbackDays} days'
     GROUP BY ${dateGrouping}, was.stage_name
     HAVING COUNT(*) >= $2
     ORDER BY time_period DESC, 
       CASE was.stage_name
         WHEN 'created' THEN 1
         WHEN 'first_tx' THEN 2
         WHEN 'feature_usage' THEN 3
         WHEN 'recurring' THEN 4
         WHEN 'high_value' THEN 5
         ELSE 6
       END`,
    [projectId, MIN_SAMPLE_SIZES.trend_analysis]
  );

  // Group by time period
  const trendData = {};
  result.rows.forEach(row => {
    const period = row.time_period.toISOString().split('T')[0];
    if (!trendData[period]) {
      trendData[period] = [];
    }
    trendData[period].push(row);
  });

  return trendData;
}

/**
 * Generate comprehensive conversion analysis report
 */
async function generateConversionReport(projectId, options = {}) {
  const [
    overallConversions,
    dropOffAnalysis,
    cohortAnalysis,
    trendAnalysis
  ] = await Promise.all([
    calculateStageConversions(projectId),
    identifySignificantDropOffs(projectId),
    getCohortFunnelAnalysis(projectId, options),
    analyzeConversionTrends(projectId, options)
  ]);

  // Calculate overall funnel health score
  const avgConversionRate = overallConversions.reduce((sum, conv) => sum + conv.conversion_rate, 0) / overallConversions.length;
  const highSeverityDropOffs = dropOffAnalysis.filter(d => d.severity === 'high').length;
  
  let funnelHealthScore = Math.max(0, Math.min(100, avgConversionRate - (highSeverityDropOffs * 10)));
  
  let healthStatus = 'healthy';
  if (funnelHealthScore < 40) {
    healthStatus = 'critical';
  } else if (funnelHealthScore < 60) {
    healthStatus = 'needs_attention';
  }

  return {
    project_id: projectId,
    generated_at: new Date().toISOString(),
    funnel_health: {
      score: Math.round(funnelHealthScore),
      status: healthStatus,
      avg_conversion_rate: Math.round(avgConversionRate * 100) / 100
    },
    stage_conversions: overallConversions,
    drop_off_analysis: dropOffAnalysis,
    cohort_analysis: cohortAnalysis,
    trend_analysis: trendAnalysis,
    recommendations: {
      priority_actions: dropOffAnalysis.slice(0, 3).map(d => ({
        issue: d.stage_transition,
        severity: d.severity,
        recommendations: d.recommendations
      })),
      overall_suggestions: generateOverallRecommendations(funnelHealthScore, dropOffAnalysis)
    }
  };
}

/**
 * Generate overall recommendations based on funnel health
 */
function generateOverallRecommendations(healthScore, dropOffs) {
  const recommendations = [];
  
  if (healthScore < 40) {
    recommendations.push('Conduct comprehensive user experience audit');
    recommendations.push('Implement user feedback collection system');
    recommendations.push('Consider major onboarding flow redesign');
  } else if (healthScore < 60) {
    recommendations.push('Focus on top 2-3 drop-off points');
    recommendations.push('Implement A/B testing for key conversion points');
    recommendations.push('Add user analytics to identify friction points');
  } else {
    recommendations.push('Continue monitoring conversion trends');
    recommendations.push('Optimize for advanced user engagement');
    recommendations.push('Consider expanding feature set for power users');
  }
  
  // Add specific recommendations based on drop-off patterns
  const highImpactDropOffs = dropOffs.filter(d => d.impact_score > 10);
  if (highImpactDropOffs.length > 0) {
    recommendations.push('Address high-impact drop-off points immediately');
  }
  
  return recommendations;
}

export {
  calculateConversionRates,
  calculateStageConversions,
  identifySignificantDropOffs,
  getCohortFunnelAnalysis,
  analyzeConversionTrends,
  generateConversionReport,
  DROP_OFF_THRESHOLDS,
  MIN_SAMPLE_SIZES
};