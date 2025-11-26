/**
 * AI-Powered Alert Content Generation Service
 * Generates specific suggestions for addressing identified issues,
 * creates actionable recommendations with clear next steps,
 * and adds priority scoring and urgency indicators
 */

/**
 * Generate AI-powered content for an alert
 * @param {Object} alert - Alert object from alert engine
 * @param {Object} context - Additional context (project metrics, history, etc.)
 * @returns {Object} Enhanced alert with AI-generated content
 */
function generateAlertContent(alert, context = {}) {
  const enhancedAlert = {
    ...alert,
    ai_suggestions: generateSuggestions(alert, context),
    action_items: generateActionItems(alert, context),
    urgency: calculateUrgency(alert, context),
    priority_score: calculatePriorityScore(alert, context),
    estimated_impact: estimateImpact(alert, context),
    timeline: suggestTimeline(alert, context)
  };
  
  return enhancedAlert;
}

/**
 * Generate specific suggestions for addressing the alert
 */
function generateSuggestions(alert, context) {
  const suggestions = [];
  
  switch (alert.type) {
    case 'retention_drop':
    case 'retention_critical':
    case 'retention_warning':
      suggestions.push(...generateRetentionSuggestions(alert, context));
      break;
      
    case 'churn_critical':
    case 'high_risk_wallets':
    case 'combined_risk':
      suggestions.push(...generateChurnSuggestions(alert, context));
      break;
      
    case 'funnel_drop_off':
    case 'low_conversion':
      suggestions.push(...generateFunnelSuggestions(alert, context));
      break;
      
    case 'shielded_spike':
    case 'shielded_drop':
    case 'shielded_volume_change':
      suggestions.push(...generateShieldedSuggestions(alert, context));
      break;
      
    default:
      suggestions.push({
        category: 'general',
        suggestion: 'Review the alert data and investigate the underlying cause',
        rationale: 'Understanding the root cause is the first step to resolution'
      });
  }
  
  return suggestions;
}

/**
 * Generate retention-specific suggestions
 */
function generateRetentionSuggestions(alert, context) {
  const suggestions = [];
  
  if (alert.severity === 'critical') {
    suggestions.push({
      category: 'immediate_action',
      suggestion: 'Launch emergency re-engagement campaign for at-risk users',
      rationale: 'Critical retention levels require immediate intervention to prevent further losses',
      expected_outcome: 'Stabilize retention within 1-2 weeks'
    });
    
    suggestions.push({
      category: 'investigation',
      suggestion: 'Conduct urgent user interviews to identify pain points',
      rationale: 'Understanding why users are leaving is crucial for effective intervention',
      expected_outcome: 'Identify top 3 churn drivers within 3-5 days'
    });
  }
  
  suggestions.push({
    category: 'engagement',
    suggestion: 'Implement personalized email campaigns targeting inactive users',
    rationale: 'Personalized outreach has shown 3-5x higher re-engagement rates',
    expected_outcome: '10-15% improvement in retention over 4 weeks'
  });
  
  suggestions.push({
    category: 'product',
    suggestion: 'Add value-driving features or improve existing feature discoverability',
    rationale: 'Users stay when they consistently derive value from the product',
    expected_outcome: 'Increase feature adoption by 20-30%'
  });
  
  suggestions.push({
    category: 'community',
    suggestion: 'Build community engagement through forums, events, or social channels',
    rationale: 'Strong community connections significantly improve retention',
    expected_outcome: 'Create network effects that boost retention by 15-25%'
  });
  
  return suggestions;
}

/**
 * Generate churn-specific suggestions
 */
function generateChurnSuggestions(alert, context) {
  const suggestions = [];
  
  suggestions.push({
    category: 'prevention',
    suggestion: 'Implement early warning system to identify at-risk users before they churn',
    rationale: 'Proactive intervention is 5x more effective than reactive win-back',
    expected_outcome: 'Reduce churn rate by 20-30%'
  });
  
  suggestions.push({
    category: 'retention',
    suggestion: 'Create VIP support program for high-value or at-risk users',
    rationale: 'Personalized support significantly reduces churn among engaged users',
    expected_outcome: 'Improve retention of high-value users by 40%'
  });
  
  suggestions.push({
    category: 'product',
    suggestion: 'Analyze common patterns among churned users and fix identified issues',
    rationale: 'Addressing root causes prevents future churn',
    expected_outcome: 'Eliminate top churn drivers within 2-3 weeks'
  });
  
  suggestions.push({
    category: 'incentives',
    suggestion: 'Offer retention incentives or loyalty rewards to at-risk users',
    rationale: 'Strategic incentives can tip the balance for users considering leaving',
    expected_outcome: 'Retain 30-40% of at-risk users'
  });
  
  if (alert.severity === 'critical') {
    suggestions.push({
      category: 'emergency',
      suggestion: 'Conduct emergency product review and implement quick wins',
      rationale: 'Critical churn levels indicate fundamental product or market fit issues',
      expected_outcome: 'Stabilize churn within 2-3 weeks'
    });
  }
  
  return suggestions;
}

/**
 * Generate funnel-specific suggestions
 */
function generateFunnelSuggestions(alert, context) {
  const suggestions = [];
  
  if (alert.type === 'funnel_drop_off') {
    const stage = alert.data?.to_stage || 'unknown';
    
    suggestions.push({
      category: 'optimization',
      suggestion: `Optimize the ${stage} stage to reduce friction and improve conversion`,
      rationale: `High drop-off at ${stage} indicates a significant barrier to progression`,
      expected_outcome: 'Reduce drop-off by 20-30%'
    });
    
    suggestions.push({
      category: 'analysis',
      suggestion: `Conduct user testing specifically for the ${stage} stage`,
      rationale: 'Direct user feedback reveals hidden friction points',
      expected_outcome: 'Identify and fix top 3 friction points'
    });
    
    suggestions.push({
      category: 'incentives',
      suggestion: `Add progressive incentives to encourage ${stage} completion`,
      rationale: 'Strategic incentives can overcome hesitation at critical stages',
      expected_outcome: 'Increase stage completion by 15-25%'
    });
  }
  
  suggestions.push({
    category: 'onboarding',
    suggestion: 'Simplify onboarding flow and reduce steps to value',
    rationale: 'Every additional step in onboarding reduces conversion by 10-20%',
    expected_outcome: 'Improve overall funnel conversion by 25-35%'
  });
  
  suggestions.push({
    category: 'education',
    suggestion: 'Add contextual help and tooltips at key decision points',
    rationale: 'Users need guidance at critical moments to progress confidently',
    expected_outcome: 'Reduce confusion-related drop-offs by 30%'
  });
  
  return suggestions;
}

/**
 * Generate shielded activity suggestions
 */
function generateShieldedSuggestions(alert, context) {
  const suggestions = [];
  
  if (alert.type === 'shielded_spike') {
    suggestions.push({
      category: 'monitoring',
      suggestion: 'Monitor for unusual patterns that might indicate coordinated activity',
      rationale: 'Sudden spikes can indicate both positive adoption or potential issues',
      expected_outcome: 'Understand spike cause within 24-48 hours'
    });
    
    suggestions.push({
      category: 'opportunity',
      suggestion: 'Investigate if spike represents new user segment or use case',
      rationale: 'Activity spikes often reveal new growth opportunities',
      expected_outcome: 'Identify and capitalize on new use cases'
    });
  } else if (alert.type === 'shielded_drop') {
    suggestions.push({
      category: 'investigation',
      suggestion: 'Investigate technical issues or UX problems with shielded features',
      rationale: 'Sudden drops often indicate technical or usability problems',
      expected_outcome: 'Identify and resolve issues within 1 week'
    });
    
    suggestions.push({
      category: 'engagement',
      suggestion: 'Re-engage privacy-focused users with targeted communications',
      rationale: 'Privacy-focused users are often high-value and worth retaining',
      expected_outcome: 'Restore 50-70% of previous activity levels'
    });
  }
  
  suggestions.push({
    category: 'education',
    suggestion: 'Educate users on privacy features and benefits',
    rationale: 'Many users don\'t fully understand or utilize privacy features',
    expected_outcome: 'Increase shielded transaction adoption by 20-30%'
  });
  
  return suggestions;
}

/**
 * Generate actionable next steps
 */
function generateActionItems(alert, context) {
  const actionItems = [];
  
  // Add immediate actions based on severity
  if (alert.severity === 'critical') {
    actionItems.push({
      action: 'Convene emergency response team',
      owner: 'Product Lead',
      timeline: 'Immediate (within 24 hours)',
      priority: 'P0'
    });
    
    actionItems.push({
      action: 'Analyze root cause and create action plan',
      owner: 'Analytics Team',
      timeline: '24-48 hours',
      priority: 'P0'
    });
  }
  
  // Add type-specific actions
  switch (alert.type) {
    case 'retention_drop':
    case 'retention_critical':
      actionItems.push(
        {
          action: 'Launch re-engagement email campaign',
          owner: 'Marketing Team',
          timeline: '2-3 days',
          priority: alert.severity === 'critical' ? 'P0' : 'P1'
        },
        {
          action: 'Conduct user interviews with churned users',
          owner: 'Product Team',
          timeline: '1 week',
          priority: 'P1'
        },
        {
          action: 'Implement retention improvements',
          owner: 'Engineering Team',
          timeline: '2-3 weeks',
          priority: 'P1'
        }
      );
      break;
      
    case 'churn_critical':
    case 'high_risk_wallets':
      actionItems.push(
        {
          action: 'Identify and segment at-risk users',
          owner: 'Analytics Team',
          timeline: '1-2 days',
          priority: 'P0'
        },
        {
          action: 'Create personalized retention offers',
          owner: 'Product Team',
          timeline: '3-5 days',
          priority: 'P1'
        },
        {
          action: 'Launch targeted retention campaign',
          owner: 'Marketing Team',
          timeline: '1 week',
          priority: 'P1'
        }
      );
      break;
      
    case 'funnel_drop_off':
      actionItems.push(
        {
          action: 'Conduct funnel analysis and identify friction points',
          owner: 'Product Analytics',
          timeline: '2-3 days',
          priority: 'P1'
        },
        {
          action: 'Run A/B tests on funnel improvements',
          owner: 'Product Team',
          timeline: '1-2 weeks',
          priority: 'P1'
        },
        {
          action: 'Implement winning variations',
          owner: 'Engineering Team',
          timeline: '2-3 weeks',
          priority: 'P2'
        }
      );
      break;
      
    case 'shielded_spike':
    case 'shielded_drop':
      actionItems.push(
        {
          action: 'Investigate cause of activity change',
          owner: 'Analytics Team',
          timeline: '1-2 days',
          priority: 'P1'
        },
        {
          action: 'Monitor for continued trends',
          owner: 'Operations Team',
          timeline: 'Ongoing',
          priority: 'P2'
        }
      );
      break;
  }
  
  // Add follow-up action
  actionItems.push({
    action: 'Review alert resolution and document learnings',
    owner: 'Product Lead',
    timeline: '1 week after resolution',
    priority: 'P2'
  });
  
  return actionItems;
}

/**
 * Calculate urgency level
 */
function calculateUrgency(alert, context) {
  let urgencyScore = 0;
  
  // Base urgency on severity
  const severityScores = {
    critical: 90,
    warning: 60,
    info: 30
  };
  
  urgencyScore = severityScores[alert.severity] || 30;
  
  // Adjust based on alert type
  const criticalTypes = ['retention_critical', 'churn_critical', 'combined_risk'];
  if (criticalTypes.includes(alert.type)) {
    urgencyScore = Math.min(100, urgencyScore + 10);
  }
  
  // Adjust based on trend (if available in context)
  if (context.trend === 'worsening') {
    urgencyScore = Math.min(100, urgencyScore + 10);
  }
  
  // Determine urgency level
  let level = 'low';
  let response_time = '1-2 weeks';
  
  if (urgencyScore >= 80) {
    level = 'critical';
    response_time = 'Immediate (24-48 hours)';
  } else if (urgencyScore >= 60) {
    level = 'high';
    response_time = '2-5 days';
  } else if (urgencyScore >= 40) {
    level = 'medium';
    response_time = '1 week';
  }
  
  return {
    level,
    score: urgencyScore,
    response_time,
    rationale: `Based on ${alert.severity} severity and ${alert.type} type`
  };
}

/**
 * Calculate priority score (0-100)
 */
function calculatePriorityScore(alert, context) {
  let score = 0;
  
  // Severity contribution (40 points)
  const severityPoints = {
    critical: 40,
    warning: 25,
    info: 10
  };
  score += severityPoints[alert.severity] || 10;
  
  // Impact contribution (30 points)
  const impactTypes = {
    retention_critical: 30,
    churn_critical: 30,
    combined_risk: 30,
    retention_drop: 25,
    high_risk_wallets: 25,
    funnel_drop_off: 20,
    low_conversion: 15,
    shielded_spike: 10,
    shielded_drop: 15
  };
  score += impactTypes[alert.type] || 10;
  
  // Affected users contribution (20 points)
  if (context.affected_percentage) {
    if (context.affected_percentage >= 50) score += 20;
    else if (context.affected_percentage >= 30) score += 15;
    else if (context.affected_percentage >= 10) score += 10;
    else score += 5;
  } else {
    score += 10; // Default
  }
  
  // Trend contribution (10 points)
  if (context.trend === 'worsening') score += 10;
  else if (context.trend === 'stable') score += 5;
  else score += 3;
  
  return Math.min(100, score);
}

/**
 * Estimate impact of the alert
 */
function estimateImpact(alert, context) {
  const impacts = {
    user_impact: 'Unknown',
    revenue_impact: 'Unknown',
    growth_impact: 'Unknown',
    overall: 'Medium'
  };
  
  // Estimate based on alert type
  switch (alert.type) {
    case 'retention_critical':
    case 'churn_critical':
      impacts.user_impact = 'High - Significant user loss expected';
      impacts.revenue_impact = 'High - Direct revenue impact from churned users';
      impacts.growth_impact = 'High - Negative word-of-mouth affects acquisition';
      impacts.overall = 'High';
      break;
      
    case 'retention_drop':
    case 'high_risk_wallets':
      impacts.user_impact = 'Medium - Moderate user loss risk';
      impacts.revenue_impact = 'Medium - Potential revenue decline';
      impacts.growth_impact = 'Medium - May slow growth trajectory';
      impacts.overall = 'Medium';
      break;
      
    case 'funnel_drop_off':
      impacts.user_impact = 'Medium - Reduced user activation';
      impacts.revenue_impact = 'Medium - Lower conversion to paying users';
      impacts.growth_impact = 'High - Directly limits growth potential';
      impacts.overall = 'Medium-High';
      break;
      
    case 'low_conversion':
      impacts.user_impact = 'Low-Medium - Affects new user experience';
      impacts.revenue_impact = 'Medium - Reduces monetization potential';
      impacts.growth_impact = 'Medium - Limits effective growth';
      impacts.overall = 'Medium';
      break;
      
    case 'shielded_spike':
      impacts.user_impact = 'Low - May indicate increased engagement';
      impacts.revenue_impact = 'Low - Minimal direct impact';
      impacts.growth_impact = 'Low-Medium - Could indicate new use case';
      impacts.overall = 'Low';
      break;
      
    case 'shielded_drop':
      impacts.user_impact = 'Low-Medium - Affects privacy-focused users';
      impacts.revenue_impact = 'Low - Limited user segment';
      impacts.growth_impact = 'Low - Niche feature impact';
      impacts.overall = 'Low-Medium';
      break;
  }
  
  return impacts;
}

/**
 * Suggest timeline for resolution
 */
function suggestTimeline(alert, context) {
  const timeline = {
    investigation: '1-3 days',
    planning: '2-5 days',
    implementation: '1-3 weeks',
    validation: '1-2 weeks',
    total: '4-6 weeks'
  };
  
  // Adjust for critical alerts
  if (alert.severity === 'critical') {
    timeline.investigation = '24-48 hours';
    timeline.planning = '1-2 days';
    timeline.implementation = '1-2 weeks';
    timeline.validation = '1 week';
    timeline.total = '2-4 weeks';
  }
  
  // Adjust for info alerts
  if (alert.severity === 'info') {
    timeline.investigation = '3-5 days';
    timeline.planning = '1 week';
    timeline.implementation = '2-4 weeks';
    timeline.validation = '2-3 weeks';
    timeline.total = '6-8 weeks';
  }
  
  return timeline;
}

/**
 * Generate complete alert package with AI content
 * @param {Array} alerts - Array of alerts from alert engine
 * @param {Object} context - Additional context
 * @returns {Array} Enhanced alerts with AI content
 */
function generateAlertPackages(alerts, context = {}) {
  return alerts.map(alert => generateAlertContent(alert, context));
}

export {
  generateAlertContent,
  generateAlertPackages,
  generateSuggestions,
  generateActionItems,
  calculateUrgency,
  calculatePriorityScore,
  estimateImpact,
  suggestTimeline
};
