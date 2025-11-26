import pool from '../db/db.js';
import {
  getLatestBenchmark,
  getBenchmarksByCategory
} from './benchmarkService.js';
import {
  compareProjectToBenchmarks,
  getProjectMetrics
} from './projectComparisonService.js';

/**
 * Competitive Insights Generator
 * Analyzes successful patterns in higher-performing projects,
 * identifies competitive trends, and provides actionable insights
 */

/**
 * Generate comprehensive competitive insights for a project
 * @param {string} projectId - Project UUID
 * @returns {Object} Competitive insights with recommendations and trends
 */
async function generateCompetitiveInsights(projectId) {
  try {
    // Get project comparison data
    const comparison = await compareProjectToBenchmarks(projectId, 'p75');
    const projectMetrics = await getProjectMetrics(projectId);
    
    // Analyze competitive patterns
    const patterns = await analyzeSuccessfulPatterns(projectMetrics.category);
    
    // Identify competitive trends
    const trends = await identifyCompetitiveTrends(projectMetrics.category);
    
    // Generate strategic recommendations
    const strategicRecs = generateStrategicRecommendations(
      comparison,
      patterns,
      trends
    );
    
    // Analyze market positioning
    const positioning = analyzeMarketPositioning(comparison, patterns);
    
    // Identify quick wins
    const quickWins = identifyQuickWins(comparison, patterns);
    
    // Calculate competitive advantage score
    const advantageScore = calculateCompetitiveAdvantage(comparison, patterns);
    
    return {
      project_id: projectId,
      project_name: projectMetrics.project_name,
      category: projectMetrics.category,
      competitive_position: comparison.overall_position,
      advantage_score: advantageScore,
      insights: {
        successful_patterns: patterns,
        market_trends: trends,
        strategic_recommendations: strategicRecs,
        market_positioning: positioning,
        quick_wins: quickWins
      },
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error generating competitive insights for ${projectId}:`, error);
    throw error;
  }
}

/**
 * Analyze successful patterns from higher-performing projects
 * @param {string} category - Project category
 * @returns {Object} Patterns observed in top performers
 */
async function analyzeSuccessfulPatterns(category) {
  try {
    // Get benchmarks to understand what top performers achieve
    const benchmarks = await getBenchmarksByCategory(category);
    
    if (benchmarks.length === 0) {
      return {
        available: false,
        message: `No benchmark data available for ${category}`
      };
    }
    
    // Analyze patterns from benchmark data
    const patterns = {
      productivity: analyzeProductivityPatterns(benchmarks),
      retention: analyzeRetentionPatterns(benchmarks),
      adoption: analyzeAdoptionPatterns(benchmarks),
      churn: analyzeChurnPatterns(benchmarks)
    };
    
    // Extract key success factors
    const successFactors = extractSuccessFactors(patterns);
    
    return {
      available: true,
      category,
      patterns,
      success_factors: successFactors,
      sample_size: benchmarks[0]?.sample_size || 0
    };
  } catch (error) {
    console.error(`Error analyzing successful patterns for ${category}:`, error);
    throw error;
  }
}

/**
 * Analyze productivity patterns from benchmarks
 */
function analyzeProductivityPatterns(benchmarks) {
  const productivityBenchmark = benchmarks.find(b => b.benchmark_type === 'productivity');
  
  if (!productivityBenchmark) {
    return { available: false };
  }
  
  return {
    available: true,
    top_performer_threshold: productivityBenchmark.percentile_90,
    median_performance: productivityBenchmark.percentile_50,
    competitive_threshold: productivityBenchmark.percentile_75,
    insights: [
      `Top 10% of ${productivityBenchmark.category} projects achieve productivity scores above ${Math.round(productivityBenchmark.percentile_90)}`,
      `Median performers maintain scores around ${Math.round(productivityBenchmark.percentile_50)}`,
      `To be competitive, aim for scores above ${Math.round(productivityBenchmark.percentile_75)}`
    ],
    key_drivers: [
      'Consistent user engagement',
      'High retention rates',
      'Effective onboarding processes',
      'Regular feature usage'
    ]
  };
}

/**
 * Analyze retention patterns from benchmarks
 */
function analyzeRetentionPatterns(benchmarks) {
  const retentionBenchmark = benchmarks.find(b => b.benchmark_type === 'retention');
  
  if (!retentionBenchmark) {
    return { available: false };
  }
  
  return {
    available: true,
    top_performer_threshold: retentionBenchmark.percentile_90,
    median_performance: retentionBenchmark.percentile_50,
    competitive_threshold: retentionBenchmark.percentile_75,
    insights: [
      `Top performers maintain ${Math.round(retentionBenchmark.percentile_90)}%+ retention rates`,
      `Industry median is around ${Math.round(retentionBenchmark.percentile_50)}%`,
      `Competitive projects achieve ${Math.round(retentionBenchmark.percentile_75)}%+ retention`
    ],
    key_drivers: [
      'Value-driven feature set',
      'Regular engagement campaigns',
      'Strong community building',
      'Responsive user support'
    ]
  };
}

/**
 * Analyze adoption patterns from benchmarks
 */
function analyzeAdoptionPatterns(benchmarks) {
  const adoptionBenchmark = benchmarks.find(b => b.benchmark_type === 'adoption');
  
  if (!adoptionBenchmark) {
    return { available: false };
  }
  
  return {
    available: true,
    top_performer_threshold: adoptionBenchmark.percentile_90,
    median_performance: adoptionBenchmark.percentile_50,
    competitive_threshold: adoptionBenchmark.percentile_75,
    insights: [
      `Leading projects achieve ${Math.round(adoptionBenchmark.percentile_90)}%+ adoption rates`,
      `Average adoption rates hover around ${Math.round(adoptionBenchmark.percentile_50)}%`,
      `Strong performers maintain ${Math.round(adoptionBenchmark.percentile_75)}%+ adoption`
    ],
    key_drivers: [
      'Streamlined onboarding',
      'Clear value proposition',
      'Progressive feature discovery',
      'Incentivized early adoption'
    ]
  };
}

/**
 * Analyze churn patterns from benchmarks
 */
function analyzeChurnPatterns(benchmarks) {
  const churnBenchmark = benchmarks.find(b => b.benchmark_type === 'churn');
  
  if (!churnBenchmark) {
    return { available: false };
  }
  
  return {
    available: true,
    top_performer_threshold: churnBenchmark.percentile_90, // Lower is better for churn
    median_performance: churnBenchmark.percentile_50,
    competitive_threshold: churnBenchmark.percentile_75,
    insights: [
      `Top performers keep churn below ${Math.round(churnBenchmark.percentile_90)}%`,
      `Industry median churn is around ${Math.round(churnBenchmark.percentile_50)}%`,
      `Competitive projects maintain churn under ${Math.round(churnBenchmark.percentile_75)}%`
    ],
    key_drivers: [
      'Proactive user engagement',
      'Early warning systems',
      'Continuous value delivery',
      'Strong retention programs'
    ]
  };
}

/**
 * Extract key success factors from patterns
 */
function extractSuccessFactors(patterns) {
  const factors = [];
  
  // Collect all key drivers from available patterns
  Object.values(patterns).forEach(pattern => {
    if (pattern.available && pattern.key_drivers) {
      factors.push(...pattern.key_drivers);
    }
  });
  
  // Remove duplicates and prioritize
  const uniqueFactors = [...new Set(factors)];
  
  return uniqueFactors.slice(0, 8); // Top 8 factors
}

/**
 * Identify competitive trends in the market
 * @param {string} category - Project category
 * @returns {Object} Market trends and emerging patterns
 */
async function identifyCompetitiveTrends(category) {
  try {
    // Get recent benchmarks to identify trends
    const benchmarks = await getBenchmarksByCategory(category);
    
    if (benchmarks.length === 0) {
      return {
        available: false,
        message: `No trend data available for ${category}`
      };
    }
    
    // Analyze trends (in a full implementation, this would compare historical data)
    const trends = {
      market_maturity: assessMarketMaturity(benchmarks),
      competitive_intensity: assessCompetitiveIntensity(benchmarks),
      emerging_patterns: identifyEmergingPatterns(category),
      category_insights: getCategorySpecificInsights(category)
    };
    
    return {
      available: true,
      category,
      trends,
      analysis_date: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error identifying competitive trends for ${category}:`, error);
    throw error;
  }
}

/**
 * Assess market maturity based on benchmark distribution
 */
function assessMarketMaturity(benchmarks) {
  // Calculate spread between percentiles
  const productivityBenchmark = benchmarks.find(b => b.benchmark_type === 'productivity');
  
  if (!productivityBenchmark) {
    return { level: 'unknown', insights: [] };
  }
  
  const spread = productivityBenchmark.percentile_90 - productivityBenchmark.percentile_25;
  const median = productivityBenchmark.percentile_50;
  
  let level = 'emerging';
  let insights = [];
  
  if (spread < 20 && median > 70) {
    level = 'mature';
    insights = [
      'Market shows high consolidation with established leaders',
      'High barriers to entry for new projects',
      'Focus on differentiation and niche positioning'
    ];
  } else if (spread < 30 && median > 50) {
    level = 'growing';
    insights = [
      'Market is consolidating with clear leaders emerging',
      'Opportunities exist for well-executed projects',
      'Focus on execution excellence and user experience'
    ];
  } else {
    level = 'emerging';
    insights = [
      'Market is still developing with high variance',
      'Significant opportunities for innovation',
      'Focus on finding product-market fit'
    ];
  }
  
  return { level, spread, median, insights };
}

/**
 * Assess competitive intensity
 */
function assessCompetitiveIntensity(benchmarks) {
  const sampleSize = benchmarks[0]?.sample_size || 0;
  
  let intensity = 'low';
  let insights = [];
  
  if (sampleSize > 100) {
    intensity = 'high';
    insights = [
      'Highly competitive market with many players',
      'Differentiation is critical for success',
      'Focus on unique value propositions'
    ];
  } else if (sampleSize > 50) {
    intensity = 'moderate';
    insights = [
      'Growing competitive landscape',
      'Opportunities for market share capture',
      'Focus on execution and user acquisition'
    ];
  } else {
    intensity = 'low';
    insights = [
      'Less crowded market with room for growth',
      'First-mover advantages available',
      'Focus on rapid iteration and learning'
    ];
  }
  
  return { intensity, sample_size: sampleSize, insights };
}

/**
 * Identify emerging patterns specific to category
 */
function identifyEmergingPatterns(category) {
  // Category-specific emerging patterns
  const patterns = {
    defi: [
      'Increased focus on user experience and simplicity',
      'Integration of social features for community building',
      'Emphasis on security and transparency'
    ],
    gamefi: [
      'Shift towards sustainable tokenomics',
      'Focus on gameplay quality over pure earning',
      'Integration of social and competitive elements'
    ],
    social_fi: [
      'Privacy-first approaches gaining traction',
      'Monetization models evolving beyond ads',
      'Community governance becoming standard'
    ],
    nft: [
      'Utility-focused NFTs over pure collectibles',
      'Integration with real-world assets',
      'Focus on creator empowerment'
    ]
  };
  
  return patterns[category] || [
    'Market-specific patterns still emerging',
    'Monitor competitor innovations closely',
    'Focus on user feedback and iteration'
  ];
}

/**
 * Get category-specific insights
 */
function getCategorySpecificInsights(category) {
  const insights = {
    defi: {
      key_metrics: ['TVL growth', 'Transaction volume', 'User retention'],
      success_factors: ['Security audits', 'Liquidity depth', 'User experience'],
      common_pitfalls: ['Complex UX', 'High gas fees', 'Security vulnerabilities']
    },
    gamefi: {
      key_metrics: ['Daily active users', 'Session length', 'Token economy health'],
      success_factors: ['Engaging gameplay', 'Balanced economy', 'Community engagement'],
      common_pitfalls: ['Unsustainable tokenomics', 'Pay-to-win mechanics', 'Poor gameplay']
    },
    social_fi: {
      key_metrics: ['User engagement', 'Content creation rate', 'Network effects'],
      success_factors: ['Privacy features', 'Content quality', 'Community moderation'],
      common_pitfalls: ['Spam and bots', 'Privacy concerns', 'Monetization challenges']
    }
  };
  
  return insights[category] || {
    key_metrics: ['User growth', 'Engagement', 'Retention'],
    success_factors: ['Product quality', 'User experience', 'Community'],
    common_pitfalls: ['Poor execution', 'Lack of differentiation', 'Weak value proposition']
  };
}

/**
 * Generate strategic recommendations based on insights
 */
function generateStrategicRecommendations(comparison, patterns, trends) {
  const recommendations = [];
  
  // Analyze gaps and generate strategic recommendations
  if (comparison.performance_gaps.underperforming.length > 0) {
    comparison.performance_gaps.underperforming.forEach(gap => {
      const pattern = patterns.patterns[gap.metric];
      
      if (pattern && pattern.available) {
        recommendations.push({
          area: gap.metric,
          priority: gap.severity === 'high' ? 10 : gap.severity === 'medium' ? 7 : 5,
          type: 'strategic',
          title: `Strategic ${gap.metric} improvement`,
          current_state: `Currently at ${gap.current}, ${Math.abs(gap.gap_percentage)}% below target`,
          target_state: `Aim for ${pattern.competitive_threshold} to be competitive`,
          strategy: generateStrategyForMetric(gap.metric, pattern, trends),
          timeline: gap.severity === 'high' ? '1-2 months' : '2-4 months',
          expected_impact: gap.severity === 'high' ? 'High' : 'Medium'
        });
      }
    });
  }
  
  // Add market positioning recommendations
  if (comparison.overall_position.position !== 'top_performer') {
    recommendations.push({
      area: 'market_positioning',
      priority: 8,
      type: 'strategic',
      title: 'Improve overall market position',
      current_state: `Currently ${comparison.overall_position.position}`,
      target_state: 'Move towards top_performer status',
      strategy: generatePositioningStrategy(comparison, trends),
      timeline: '3-6 months',
      expected_impact: 'High'
    });
  }
  
  return recommendations.sort((a, b) => b.priority - a.priority);
}

/**
 * Generate strategy for specific metric
 */
function generateStrategyForMetric(metric, pattern, trends) {
  const strategies = {
    productivity: [
      `Focus on ${pattern.key_drivers.join(', ')}`,
      'Implement data-driven optimization cycles',
      'Benchmark against top performers regularly',
      'Invest in user engagement initiatives'
    ],
    retention: [
      `Prioritize ${pattern.key_drivers.join(', ')}`,
      'Implement early warning systems for churn',
      'Create re-engagement campaigns',
      'Build strong community connections'
    ],
    adoption: [
      `Optimize ${pattern.key_drivers.join(', ')}`,
      'Reduce friction in onboarding',
      'Provide clear value demonstrations',
      'Implement progressive feature rollout'
    ],
    churn: [
      `Address ${pattern.key_drivers.join(', ')}`,
      'Identify and fix churn triggers',
      'Improve product value delivery',
      'Enhance user support systems'
    ]
  };
  
  return strategies[metric] || ['Analyze top performers', 'Implement best practices', 'Monitor progress'];
}

/**
 * Generate positioning strategy
 */
function generatePositioningStrategy(comparison, trends) {
  const strategy = [
    'Conduct comprehensive competitive analysis',
    'Identify unique value propositions',
    'Focus on underperforming metrics first'
  ];
  
  if (trends.available) {
    strategy.push(`Align with ${trends.category} market trends`);
    strategy.push(...trends.trends.emerging_patterns.slice(0, 2));
  }
  
  return strategy;
}

/**
 * Analyze market positioning
 */
function analyzeMarketPositioning(comparison, patterns) {
  return {
    current_position: comparison.overall_position,
    competitive_gaps: comparison.performance_gaps.underperforming.length,
    competitive_strengths: comparison.performance_gaps.outperforming.length,
    positioning_score: calculatePositioningScore(comparison),
    recommendations: [
      'Focus on closing critical performance gaps',
      'Leverage existing strengths in marketing',
      'Monitor competitor movements closely'
    ]
  };
}

/**
 * Calculate positioning score
 */
function calculatePositioningScore(comparison) {
  const positionScores = {
    'top_performer': 90,
    'above_average': 70,
    'average': 50,
    'below_average': 30
  };
  
  let score = positionScores[comparison.overall_position.position] || 0;
  
  // Adjust based on gaps
  score -= comparison.performance_gaps.underperforming.length * 5;
  score += comparison.performance_gaps.outperforming.length * 5;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Identify quick wins
 */
function identifyQuickWins(comparison, patterns) {
  const quickWins = [];
  
  // Look for metrics that are close to target
  comparison.performance_gaps.underperforming.forEach(gap => {
    if (gap.severity === 'low' && Math.abs(gap.gap_percentage) < 15) {
      quickWins.push({
        metric: gap.metric,
        current: gap.current,
        target: gap.target,
        gap: Math.abs(gap.gap),
        effort: 'Low',
        impact: 'Medium',
        actions: [
          `Small improvements in ${gap.metric} can close the gap`,
          'Focus on incremental optimizations',
          'Monitor progress weekly'
        ]
      });
    }
  });
  
  return quickWins;
}

/**
 * Calculate competitive advantage score
 */
function calculateCompetitiveAdvantage(comparison, patterns) {
  let score = 0;
  
  // Base score from position
  const positionScores = {
    'top_performer': 40,
    'above_average': 30,
    'average': 20,
    'below_average': 10
  };
  
  score += positionScores[comparison.overall_position.position] || 0;
  
  // Add points for outperforming metrics
  score += comparison.performance_gaps.outperforming.length * 15;
  
  // Subtract points for underperforming metrics
  score -= comparison.performance_gaps.underperforming.length * 10;
  
  // Bonus for being at target
  score += comparison.performance_gaps.at_target.length * 5;
  
  return {
    score: Math.max(0, Math.min(100, score)),
    level: score >= 70 ? 'Strong' : score >= 40 ? 'Moderate' : 'Weak',
    description: score >= 70 ? 
      'Strong competitive position with clear advantages' :
      score >= 40 ?
      'Moderate competitive position with room for improvement' :
      'Weak competitive position requiring significant improvement'
  };
}

export {
  generateCompetitiveInsights,
  analyzeSuccessfulPatterns,
  identifyCompetitiveTrends,
  generateStrategicRecommendations,
  analyzeMarketPositioning,
  identifyQuickWins,
  calculateCompetitiveAdvantage
};
