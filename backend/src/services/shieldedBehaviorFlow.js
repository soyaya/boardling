import pool from '../db/db.js';

// =====================================================
// SHIELDED BEHAVIOR FLOW TRACKING SERVICE
// =====================================================
// Tracks sequences from transparent to shielded transactions and back,
// identifies patterns in shielded usage that predict loyalty,
// and generates privacy-focused behavioral insights
// =====================================================

/**
 * Shielded flow patterns for behavioral analysis
 */
const SHIELDED_FLOW_PATTERNS = {
  PRIVACY_ACCUMULATOR: 'privacy_accumulator',     // T→Z→Z→Z (accumulating in shielded)
  PRIVACY_MIXER: 'privacy_mixer',                 // T→Z→T (quick mixing)
  PRIVACY_HOLDER: 'privacy_holder',               // T→Z→(long pause)→T (long-term holding)
  PRIVACY_CYCLER: 'privacy_cycler',               // T→Z→T→Z→T (regular cycling)
  TRANSPARENT_ONLY: 'transparent_only',           // T→T→T (no privacy usage)
  SHIELDED_NATIVE: 'shielded_native'              // Z→Z→Z (primarily shielded user)
};

/**
 * Flow complexity levels
 */
const FLOW_COMPLEXITY = {
  SIMPLE: 'simple',           // 1-2 transactions
  MODERATE: 'moderate',       // 3-5 transactions
  COMPLEX: 'complex',         // 6-10 transactions
  ADVANCED: 'advanced'        // 11+ transactions
};

/**
 * Privacy transition types
 */
const PRIVACY_TRANSITIONS = {
  T_TO_Z: 'transparent_to_shielded',
  Z_TO_T: 'shielded_to_transparent',
  T_TO_T: 'transparent_to_transparent',
  Z_TO_Z: 'shielded_to_shielded'
};

// =====================================================
// CORE BEHAVIOR FLOW ANALYSIS FUNCTIONS
// =====================================================

/**
 * Track shielded behavior flows for a wallet over a time period
 */
async function trackWalletShieldedFlows(walletId, startDate, endDate) {
  try {
    console.log(`Tracking shielded flows for wallet ${walletId} from ${startDate} to ${endDate}`);
    
    // Get all transactions for the wallet in chronological order
    const transactionsResult = await pool.query(`
      SELECT 
        pt.*,
        w.address as wallet_address,
        w.type as wallet_type
      FROM processed_transactions pt
      JOIN wallets w ON pt.wallet_id = w.id
      WHERE pt.wallet_id = $1 
      AND pt.block_timestamp >= $2
      AND pt.block_timestamp <= $3
      ORDER BY pt.block_timestamp ASC
    `, [walletId, startDate, endDate]);
    
    const transactions = transactionsResult.rows;
    
    if (transactions.length === 0) {
      console.log(`No transactions found for wallet ${walletId} in the specified period`);
      return null;
    }
    
    // Analyze transaction sequences and identify flows
    const flows = identifyShieldedFlows(transactions);
    
    // Analyze privacy transitions
    const transitions = analyzePrivacyTransitions(transactions);
    
    // Calculate flow metrics
    const flowMetrics = calculateFlowMetrics(flows, transactions);
    
    // Identify behavioral patterns
    const behaviorPattern = identifyBehaviorPattern(flows, transitions, flowMetrics);
    
    // Generate loyalty predictions
    const loyaltyPrediction = predictLoyaltyFromFlows(flows, behaviorPattern, flowMetrics);
    
    // Save behavior flow data
    const behaviorFlow = {
      wallet_id: walletId,
      analysis_period: {
        start_date: startDate,
        end_date: endDate
      },
      flows: flows,
      transitions: transitions,
      metrics: flowMetrics,
      behavior_pattern: behaviorPattern,
      loyalty_prediction: loyaltyPrediction,
      analyzed_at: new Date().toISOString()
    };
    
    await saveBehaviorFlow(behaviorFlow);
    
    console.log(`Shielded flow analysis completed for wallet ${walletId}: ${flows.length} flows identified`);
    return behaviorFlow;
    
  } catch (error) {
    console.error(`Error tracking shielded flows for wallet ${walletId}:`, error);
    throw error;
  }
}

/**
 * Identify distinct shielded flows from transaction sequence
 */
function identifyShieldedFlows(transactions) {
  const flows = [];
  let currentFlow = null;
  
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const isShielded = tx.is_shielded;
    const isShieldedEntry = tx.shielded_pool_entry;
    const isShieldedExit = tx.shielded_pool_exit;
    
    // Start a new flow if we encounter a shielded transaction
    if (isShielded && !currentFlow) {
      currentFlow = {
        flow_id: `flow_${flows.length + 1}`,
        start_time: tx.block_timestamp,
        transactions: [],
        privacy_transitions: [],
        flow_type: null,
        complexity: FLOW_COMPLEXITY.SIMPLE
      };
    }
    
    // Add transaction to current flow if it exists
    if (currentFlow) {
      currentFlow.transactions.push({
        txid: tx.txid,
        timestamp: tx.block_timestamp,
        is_shielded: isShielded,
        shielded_entry: isShieldedEntry,
        shielded_exit: isShieldedExit,
        value_zatoshi: tx.value_zatoshi,
        tx_type: tx.tx_type
      });
      
      // Track privacy transitions
      if (i > 0) {
        const prevTx = currentFlow.transactions[currentFlow.transactions.length - 2];
        if (prevTx) {
          const transition = getPrivacyTransition(prevTx.is_shielded, isShielded);
          currentFlow.privacy_transitions.push(transition);
        }
      }
      
      // End flow if we exit shielded pool or have a long gap
      const shouldEndFlow = isShieldedExit || 
                           (!isShielded && currentFlow.transactions.length > 1) ||
                           (i === transactions.length - 1);
      
      if (shouldEndFlow) {
        currentFlow.end_time = tx.block_timestamp;
        currentFlow.duration_minutes = calculateDurationMinutes(
          currentFlow.start_time, 
          currentFlow.end_time
        );
        currentFlow.flow_type = classifyFlowType(currentFlow);
        currentFlow.complexity = classifyFlowComplexity(currentFlow.transactions.length);
        
        flows.push(currentFlow);
        currentFlow = null;
      }
    }
  }
  
  // Handle case where flow continues to end of transactions
  if (currentFlow) {
    const lastTx = currentFlow.transactions[currentFlow.transactions.length - 1];
    currentFlow.end_time = lastTx.timestamp;
    currentFlow.duration_minutes = calculateDurationMinutes(
      currentFlow.start_time, 
      currentFlow.end_time
    );
    currentFlow.flow_type = classifyFlowType(currentFlow);
    currentFlow.complexity = classifyFlowComplexity(currentFlow.transactions.length);
    flows.push(currentFlow);
  }
  
  return flows;
}

/**
 * Analyze privacy transitions in transaction sequence
 */
function analyzePrivacyTransitions(transactions) {
  const transitions = {
    [PRIVACY_TRANSITIONS.T_TO_Z]: 0,
    [PRIVACY_TRANSITIONS.Z_TO_T]: 0,
    [PRIVACY_TRANSITIONS.T_TO_T]: 0,
    [PRIVACY_TRANSITIONS.Z_TO_Z]: 0
  };
  
  for (let i = 1; i < transactions.length; i++) {
    const prevTx = transactions[i - 1];
    const currentTx = transactions[i];
    
    const transition = getPrivacyTransition(prevTx.is_shielded, currentTx.is_shielded);
    transitions[transition]++;
  }
  
  // Calculate transition percentages
  const totalTransitions = Object.values(transitions).reduce((sum, count) => sum + count, 0);
  const transitionPercentages = {};
  
  Object.entries(transitions).forEach(([type, count]) => {
    transitionPercentages[type] = totalTransitions > 0 ? 
      Math.round((count / totalTransitions) * 100 * 100) / 100 : 0;
  });
  
  return {
    counts: transitions,
    percentages: transitionPercentages,
    total_transitions: totalTransitions
  };
}

/**
 * Calculate comprehensive flow metrics
 */
function calculateFlowMetrics(flows, transactions) {
  const metrics = {
    total_flows: flows.length,
    avg_flow_duration_minutes: 0,
    avg_transactions_per_flow: 0,
    shielded_flow_ratio: 0,
    complexity_distribution: {
      [FLOW_COMPLEXITY.SIMPLE]: 0,
      [FLOW_COMPLEXITY.MODERATE]: 0,
      [FLOW_COMPLEXITY.COMPLEX]: 0,
      [FLOW_COMPLEXITY.ADVANCED]: 0
    },
    flow_type_distribution: {},
    privacy_efficiency_score: 0
  };
  
  if (flows.length === 0) return metrics;
  
  // Calculate averages
  const totalDuration = flows.reduce((sum, flow) => sum + (flow.duration_minutes || 0), 0);
  const totalTransactions = flows.reduce((sum, flow) => sum + flow.transactions.length, 0);
  
  metrics.avg_flow_duration_minutes = Math.round((totalDuration / flows.length) * 100) / 100;
  metrics.avg_transactions_per_flow = Math.round((totalTransactions / flows.length) * 100) / 100;
  
  // Calculate shielded flow ratio
  const shieldedFlows = flows.filter(flow => 
    flow.transactions.some(tx => tx.is_shielded)
  ).length;
  metrics.shielded_flow_ratio = Math.round((shieldedFlows / flows.length) * 100 * 100) / 100;
  
  // Calculate complexity distribution
  flows.forEach(flow => {
    metrics.complexity_distribution[flow.complexity]++;
  });
  
  // Calculate flow type distribution
  flows.forEach(flow => {
    if (!metrics.flow_type_distribution[flow.flow_type]) {
      metrics.flow_type_distribution[flow.flow_type] = 0;
    }
    metrics.flow_type_distribution[flow.flow_type]++;
  });
  
  // Calculate privacy efficiency score (0-100)
  metrics.privacy_efficiency_score = calculatePrivacyEfficiencyScore(flows, transactions);
  
  return metrics;
}

/**
 * Identify overall behavior pattern from flows and transitions
 */
function identifyBehaviorPattern(flows, transitions, metrics) {
  const pattern = {
    primary_pattern: SHIELDED_FLOW_PATTERNS.TRANSPARENT_ONLY,
    confidence: 0,
    characteristics: [],
    privacy_preference: 'low'
  };
  
  if (flows.length === 0) {
    return pattern;
  }
  
  const shieldedRatio = metrics.shielded_flow_ratio / 100;
  const avgDuration = metrics.avg_flow_duration_minutes;
  const tToZ = transitions.percentages[PRIVACY_TRANSITIONS.T_TO_Z] || 0;
  const zToT = transitions.percentages[PRIVACY_TRANSITIONS.Z_TO_T] || 0;
  const zToZ = transitions.percentages[PRIVACY_TRANSITIONS.Z_TO_Z] || 0;
  
  // Determine primary pattern
  if (shieldedRatio >= 0.8) {
    pattern.primary_pattern = SHIELDED_FLOW_PATTERNS.SHIELDED_NATIVE;
    pattern.confidence = 90;
    pattern.privacy_preference = 'high';
    pattern.characteristics.push('Primarily uses shielded transactions');
  } else if (zToZ > 50) {
    pattern.primary_pattern = SHIELDED_FLOW_PATTERNS.PRIVACY_ACCUMULATOR;
    pattern.confidence = 85;
    pattern.privacy_preference = 'high';
    pattern.characteristics.push('Accumulates funds in shielded pool');
  } else if (avgDuration > 1440) { // > 24 hours
    pattern.primary_pattern = SHIELDED_FLOW_PATTERNS.PRIVACY_HOLDER;
    pattern.confidence = 80;
    pattern.privacy_preference = 'medium';
    pattern.characteristics.push('Holds funds in shielded pool for extended periods');
  } else if (tToZ > 30 && zToT > 30) {
    if (Math.abs(tToZ - zToT) < 10) {
      pattern.primary_pattern = SHIELDED_FLOW_PATTERNS.PRIVACY_CYCLER;
      pattern.confidence = 75;
      pattern.privacy_preference = 'medium';
      pattern.characteristics.push('Regularly cycles between transparent and shielded');
    } else {
      pattern.primary_pattern = SHIELDED_FLOW_PATTERNS.PRIVACY_MIXER;
      pattern.confidence = 70;
      pattern.privacy_preference = 'medium';
      pattern.characteristics.push('Uses shielded pool for transaction mixing');
    }
  } else if (shieldedRatio > 0.2) {
    pattern.primary_pattern = SHIELDED_FLOW_PATTERNS.PRIVACY_MIXER;
    pattern.confidence = 60;
    pattern.privacy_preference = 'low';
    pattern.characteristics.push('Occasional privacy usage');
  }
  
  // Add additional characteristics
  if (metrics.avg_transactions_per_flow > 5) {
    pattern.characteristics.push('Complex transaction flows');
  }
  
  if (avgDuration < 60) {
    pattern.characteristics.push('Quick privacy operations');
  }
  
  return pattern;
}

/**
 * Predict loyalty based on shielded flow patterns
 */
function predictLoyaltyFromFlows(flows, behaviorPattern, metrics) {
  const prediction = {
    loyalty_score: 0,        // 0-100
    retention_probability: 0, // 0-100
    engagement_level: 'low',  // low, medium, high
    risk_factors: [],
    positive_indicators: []
  };
  
  let loyaltyScore = 50; // Base score
  
  // Pattern-based scoring
  switch (behaviorPattern.primary_pattern) {
    case SHIELDED_FLOW_PATTERNS.SHIELDED_NATIVE:
      loyaltyScore += 30;
      prediction.positive_indicators.push('Native shielded user - high privacy commitment');
      break;
    case SHIELDED_FLOW_PATTERNS.PRIVACY_ACCUMULATOR:
      loyaltyScore += 25;
      prediction.positive_indicators.push('Accumulates in shielded pool - long-term holder');
      break;
    case SHIELDED_FLOW_PATTERNS.PRIVACY_HOLDER:
      loyaltyScore += 20;
      prediction.positive_indicators.push('Extended shielded holding periods');
      break;
    case SHIELDED_FLOW_PATTERNS.PRIVACY_CYCLER:
      loyaltyScore += 15;
      prediction.positive_indicators.push('Regular privacy usage patterns');
      break;
    case SHIELDED_FLOW_PATTERNS.PRIVACY_MIXER:
      loyaltyScore += 10;
      prediction.positive_indicators.push('Active privacy-conscious user');
      break;
    case SHIELDED_FLOW_PATTERNS.TRANSPARENT_ONLY:
      loyaltyScore -= 10;
      prediction.risk_factors.push('No privacy feature usage');
      break;
  }
  
  // Metrics-based adjustments
  if (metrics.avg_flow_duration_minutes > 1440) { // > 24 hours
    loyaltyScore += 15;
    prediction.positive_indicators.push('Long-term engagement patterns');
  }
  
  if (metrics.privacy_efficiency_score > 70) {
    loyaltyScore += 10;
    prediction.positive_indicators.push('Efficient privacy usage');
  }
  
  if (metrics.total_flows > 5) {
    loyaltyScore += 10;
    prediction.positive_indicators.push('Multiple privacy sessions');
  } else if (metrics.total_flows === 1) {
    loyaltyScore -= 5;
    prediction.risk_factors.push('Limited privacy exploration');
  }
  
  // Complexity bonus
  const complexFlows = metrics.complexity_distribution[FLOW_COMPLEXITY.COMPLEX] + 
                      metrics.complexity_distribution[FLOW_COMPLEXITY.ADVANCED];
  if (complexFlows > 0) {
    loyaltyScore += 5;
    prediction.positive_indicators.push('Sophisticated privacy usage');
  }
  
  // Ensure score is within bounds
  prediction.loyalty_score = Math.max(0, Math.min(100, loyaltyScore));
  
  // Calculate retention probability (correlated with loyalty but different factors)
  prediction.retention_probability = Math.min(100, prediction.loyalty_score * 0.8 + 
    (metrics.shielded_flow_ratio * 0.3));
  
  // Determine engagement level
  if (prediction.loyalty_score >= 75) {
    prediction.engagement_level = 'high';
  } else if (prediction.loyalty_score >= 50) {
    prediction.engagement_level = 'medium';
  } else {
    prediction.engagement_level = 'low';
  }
  
  return prediction;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get privacy transition type between two transactions
 */
function getPrivacyTransition(prevIsShielded, currentIsShielded) {
  if (!prevIsShielded && currentIsShielded) {
    return PRIVACY_TRANSITIONS.T_TO_Z;
  } else if (prevIsShielded && !currentIsShielded) {
    return PRIVACY_TRANSITIONS.Z_TO_T;
  } else if (!prevIsShielded && !currentIsShielded) {
    return PRIVACY_TRANSITIONS.T_TO_T;
  } else {
    return PRIVACY_TRANSITIONS.Z_TO_Z;
  }
}

/**
 * Classify flow type based on transaction patterns
 */
function classifyFlowType(flow) {
  const transactions = flow.transactions;
  const transitions = flow.privacy_transitions;
  
  if (transactions.length === 1) {
    return 'single_transaction';
  }
  
  // Check for specific patterns
  const hasShielded = transactions.some(tx => tx.is_shielded);
  const hasEntry = transactions.some(tx => tx.shielded_entry);
  const hasExit = transactions.some(tx => tx.shielded_exit);
  
  if (!hasShielded) {
    return 'transparent_only';
  }
  
  if (hasEntry && hasExit) {
    if (flow.duration_minutes > 1440) {
      return 'privacy_holding';
    } else {
      return 'privacy_mixing';
    }
  }
  
  if (hasEntry && !hasExit) {
    return 'privacy_accumulation';
  }
  
  if (!hasEntry && hasExit) {
    return 'privacy_spending';
  }
  
  return 'internal_shielded';
}

/**
 * Classify flow complexity based on transaction count
 */
function classifyFlowComplexity(transactionCount) {
  if (transactionCount <= 2) return FLOW_COMPLEXITY.SIMPLE;
  if (transactionCount <= 5) return FLOW_COMPLEXITY.MODERATE;
  if (transactionCount <= 10) return FLOW_COMPLEXITY.COMPLEX;
  return FLOW_COMPLEXITY.ADVANCED;
}

/**
 * Calculate privacy efficiency score
 */
function calculatePrivacyEfficiencyScore(flows, transactions) {
  if (flows.length === 0 || transactions.length === 0) return 0;
  
  let score = 0;
  
  // Base score from shielded transaction ratio
  const shieldedTx = transactions.filter(tx => tx.is_shielded).length;
  const shieldedRatio = shieldedTx / transactions.length;
  score += shieldedRatio * 40;
  
  // Bonus for flow diversity
  const flowTypes = new Set(flows.map(flow => flow.flow_type));
  score += Math.min(flowTypes.size * 10, 30);
  
  // Bonus for optimal flow patterns
  const optimalFlows = flows.filter(flow => 
    flow.flow_type === 'privacy_mixing' || 
    flow.flow_type === 'privacy_holding'
  ).length;
  score += (optimalFlows / flows.length) * 30;
  
  return Math.min(100, Math.round(score));
}

/**
 * Calculate duration in minutes between two timestamps
 */
function calculateDurationMinutes(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end - start) / (1000 * 60));
}

// =====================================================
// DATABASE OPERATIONS
// =====================================================

/**
 * Save behavior flow analysis to database
 */
async function saveBehaviorFlow(behaviorFlow) {
  try {
    const result = await pool.query(`
      INSERT INTO wallet_behavior_flows (
        wallet_id, flow_sequence, flow_duration_minutes,
        flow_complexity_score, flow_type, success_indicator,
        started_at, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      behaviorFlow.wallet_id,
      JSON.stringify(behaviorFlow),
      behaviorFlow.metrics?.avg_flow_duration_minutes || 0,
      behaviorFlow.metrics?.privacy_efficiency_score || 0,
      behaviorFlow.behavior_pattern?.primary_pattern || 'unknown',
      true,
      behaviorFlow.analysis_period.start_date,
      behaviorFlow.analysis_period.end_date
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error saving behavior flow:', error);
    throw error;
  }
}

/**
 * Get behavior flows for a wallet
 */
async function getWalletBehaviorFlows(walletId, limit = 10) {
  try {
    const result = await pool.query(`
      SELECT * FROM wallet_behavior_flows
      WHERE wallet_id = $1
      ORDER BY started_at DESC
      LIMIT $2
    `, [walletId, limit]);
    
    return result.rows.map(row => ({
      ...row,
      flow_sequence: typeof row.flow_sequence === 'string' ? 
        JSON.parse(row.flow_sequence) : row.flow_sequence
    }));
  } catch (error) {
    console.error('Error getting wallet behavior flows:', error);
    throw error;
  }
}

/**
 * Analyze project-wide shielded behavior patterns
 */
async function analyzeProjectShieldedBehaviors(projectId, days = 30) {
  try {
    console.log(`Analyzing project shielded behaviors for project ${projectId}`);
    
    const endDate = new Date();
    const startDate = new Date(endDate - days * 24 * 60 * 60 * 1000);
    
    // Get all wallets for the project
    const walletsResult = await pool.query(`
      SELECT id, address, type
      FROM wallets
      WHERE project_id = $1 AND is_active = true
    `, [projectId]);
    
    const wallets = walletsResult.rows;
    const behaviorAnalyses = [];
    
    for (const wallet of wallets) {
      try {
        const analysis = await trackWalletShieldedFlows(
          wallet.id, 
          startDate.toISOString(), 
          endDate.toISOString()
        );
        
        if (analysis) {
          behaviorAnalyses.push(analysis);
        }
      } catch (error) {
        console.error(`Error analyzing wallet ${wallet.id}:`, error.message);
      }
    }
    
    // Generate project-wide insights
    const projectInsights = generateProjectBehaviorInsights(behaviorAnalyses);
    
    console.log(`Project behavior analysis completed: ${behaviorAnalyses.length} wallets analyzed`);
    return {
      project_id: projectId,
      analysis_period: { start_date: startDate, end_date: endDate },
      wallet_analyses: behaviorAnalyses,
      project_insights: projectInsights
    };
    
  } catch (error) {
    console.error('Error analyzing project shielded behaviors:', error);
    throw error;
  }
}

/**
 * Generate project-wide behavior insights
 */
function generateProjectBehaviorInsights(behaviorAnalyses) {
  const insights = {
    total_wallets_analyzed: behaviorAnalyses.length,
    behavior_pattern_distribution: {},
    avg_loyalty_score: 0,
    high_loyalty_wallets: 0,
    privacy_adoption_rate: 0,
    common_characteristics: [],
    recommendations: []
  };
  
  if (behaviorAnalyses.length === 0) return insights;
  
  // Calculate pattern distribution
  behaviorAnalyses.forEach(analysis => {
    const pattern = analysis.behavior_pattern.primary_pattern;
    insights.behavior_pattern_distribution[pattern] = 
      (insights.behavior_pattern_distribution[pattern] || 0) + 1;
  });
  
  // Calculate average loyalty score
  const totalLoyalty = behaviorAnalyses.reduce((sum, analysis) => 
    sum + analysis.loyalty_prediction.loyalty_score, 0
  );
  insights.avg_loyalty_score = Math.round((totalLoyalty / behaviorAnalyses.length) * 100) / 100;
  
  // Count high loyalty wallets
  insights.high_loyalty_wallets = behaviorAnalyses.filter(analysis => 
    analysis.loyalty_prediction.loyalty_score >= 75
  ).length;
  
  // Calculate privacy adoption rate
  const privacyUsers = behaviorAnalyses.filter(analysis => 
    analysis.behavior_pattern.primary_pattern !== SHIELDED_FLOW_PATTERNS.TRANSPARENT_ONLY
  ).length;
  insights.privacy_adoption_rate = Math.round((privacyUsers / behaviorAnalyses.length) * 100 * 100) / 100;
  
  // Identify common characteristics
  const allCharacteristics = behaviorAnalyses.flatMap(analysis => 
    analysis.behavior_pattern.characteristics
  );
  const characteristicCounts = {};
  allCharacteristics.forEach(char => {
    characteristicCounts[char] = (characteristicCounts[char] || 0) + 1;
  });
  
  insights.common_characteristics = Object.entries(characteristicCounts)
    .filter(([_, count]) => count >= behaviorAnalyses.length * 0.2) // 20% threshold
    .map(([char, count]) => ({ characteristic: char, prevalence: count }))
    .sort((a, b) => b.prevalence - a.prevalence);
  
  // Generate recommendations
  if (insights.privacy_adoption_rate < 30) {
    insights.recommendations.push('Low privacy adoption - consider privacy education campaigns');
  }
  
  if (insights.avg_loyalty_score < 50) {
    insights.recommendations.push('Below average loyalty - focus on user engagement and retention');
  }
  
  const dominantPattern = Object.entries(insights.behavior_pattern_distribution)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (dominantPattern && dominantPattern[0] === SHIELDED_FLOW_PATTERNS.TRANSPARENT_ONLY) {
    insights.recommendations.push('Many users not utilizing privacy features - improve privacy UX');
  }
  
  return insights;
}

// Export all functions
export {
  trackWalletShieldedFlows,
  getWalletBehaviorFlows,
  analyzeProjectShieldedBehaviors,
  SHIELDED_FLOW_PATTERNS,
  FLOW_COMPLEXITY,
  PRIVACY_TRANSITIONS
};