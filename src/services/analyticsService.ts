/**
 * Analytics Service
 * 
 * Handles all analytics-related API operations with comprehensive error handling,
 * data transformation utilities, and request/response typing.
 * 
 * Requirements: 7.1-7.9
 */

import { apiClient } from './apiClient';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

/**
 * Service response wrapper
 */
export interface AnalyticsServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Dashboard metrics (Requirement 7.1)
 */
export interface DashboardMetrics {
  totalWallets: number;
  activeWallets: number;
  totalTransactions: number;
  totalVolume: number;
  averageTransactionValue: number;
  retentionRate: number;
  adoptionRate: number;
  productivityScore: number;
  healthScore: number;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Adoption funnel data (Requirement 7.2)
 */
export interface AdoptionStage {
  stage: 'created' | 'first_tx' | 'feature_usage' | 'recurring' | 'high_value';
  walletCount: number;
  percentage: number;
  conversionRate?: number;
  averageTimeToAchieve?: number;
}

export interface AdoptionFunnelData {
  stages: AdoptionStage[];
  totalWallets: number;
  overallConversionRate: number;
}

/**
 * Transaction data (Requirement 7.3)
 */
export interface TransactionData {
  id: string;
  walletId: string;
  txid: string;
  timestamp: string;
  type: 'transfer' | 'swap' | 'bridge' | 'shielded' | 'other';
  amount: number;
  fee: number;
  status: 'confirmed' | 'pending' | 'failed';
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  lastOccurrence: string;
}

export interface AnalyticsData {
  transactions: TransactionData[];
  behaviorPatterns: BehaviorPattern[];
  totalTransactions: number;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Retention cohort data (Requirement 7.4)
 */
export interface CohortData {
  cohortPeriod: string;
  walletCount: number;
  retentionWeek1: number;
  retentionWeek2: number;
  retentionWeek3: number;
  retentionWeek4: number;
}

export interface RetentionAnalytics {
  cohorts: CohortData[];
  averageRetention: number;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Productivity data (Requirement 7.5)
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  status: 'pending' | 'completed';
}

export interface ProductivityScore {
  totalScore: number;
  retentionScore: number;
  adoptionScore: number;
  activityScore: number;
  diversityScore: number;
  status: 'healthy' | 'at_risk' | 'churn';
  riskLevel: 'low' | 'medium' | 'high';
  pendingTasks: Task[];
  completedTasks: Task[];
}

export interface ProductivityAnalytics {
  averageScore: number;
  scores: ProductivityScore[];
  distribution: {
    healthy: number;
    atRisk: number;
    churn: number;
  };
}

/**
 * Shielded analytics data (Requirement 7.6)
 */
export interface ShieldedMetrics {
  totalShieldedTransactions: number;
  shieldedVolume: number;
  shieldedPercentage: number;
  privacyScore: number;
  shieldedWallets: number;
}

export interface ShieldedAnalytics {
  metrics: ShieldedMetrics;
  trends: {
    date: string;
    shieldedCount: number;
    transparentCount: number;
  }[];
  period: {
    start: string;
    end: string;
  };
}

/**
 * Wallet segmentation data (Requirement 7.7)
 */
export interface WalletSegment {
  segmentName: string;
  walletCount: number;
  percentage: number;
  characteristics: {
    averageTransactions: number;
    averageVolume: number;
    retentionRate: number;
  };
}

export interface SegmentAnalytics {
  segments: WalletSegment[];
  totalWallets: number;
}

/**
 * Project health data (Requirement 7.8)
 */
export interface HealthIndicator {
  name: string;
  value: number;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

export interface ProjectHealthAnalytics {
  overallHealth: number;
  indicators: HealthIndicator[];
  alerts: {
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  }[];
}

/**
 * Comparison data (Requirement 7.9)
 */
export interface ComparisonMetric {
  metric: string;
  yourValue: number;
  industryAverage: number;
  percentile: number;
}

export interface ComparisonAnalytics {
  metrics: ComparisonMetric[];
  category: string;
  sampleSize: number;
}

// =====================================================
// DATA TRANSFORMATION UTILITIES
// =====================================================

/**
 * Transform raw API response to DashboardMetrics
 */
export function transformDashboardData(rawData: any): DashboardMetrics {
  return {
    totalWallets: rawData.total_wallets || rawData.totalWallets || 0,
    activeWallets: rawData.active_wallets || rawData.activeWallets || 0,
    totalTransactions: rawData.total_transactions || rawData.totalTransactions || 0,
    totalVolume: parseFloat(rawData.total_volume || rawData.totalVolume || '0'),
    averageTransactionValue: parseFloat(rawData.average_transaction_value || rawData.averageTransactionValue || '0'),
    retentionRate: parseFloat(rawData.retention_rate || rawData.retentionRate || '0'),
    adoptionRate: parseFloat(rawData.adoption_rate || rawData.adoptionRate || '0'),
    productivityScore: parseFloat(rawData.productivity_score || rawData.productivityScore || '0'),
    healthScore: parseFloat(rawData.health_score || rawData.healthScore || '0'),
    period: {
      start: rawData.period?.start || rawData.period_start || new Date().toISOString(),
      end: rawData.period?.end || rawData.period_end || new Date().toISOString(),
    },
  };
}

/**
 * Transform raw adoption funnel data
 */
export function transformAdoptionData(rawData: any): AdoptionFunnelData {
  const stages = (rawData.stages || []).map((stage: any) => ({
    stage: stage.stage || stage.stage_name,
    walletCount: stage.wallet_count || stage.walletCount || 0,
    percentage: parseFloat(stage.percentage || '0'),
    conversionRate: stage.conversion_rate ? parseFloat(stage.conversion_rate) : undefined,
    averageTimeToAchieve: stage.average_time_to_achieve || stage.averageTimeToAchieve,
  }));

  return {
    stages,
    totalWallets: rawData.total_wallets || rawData.totalWallets || 0,
    overallConversionRate: parseFloat(rawData.overall_conversion_rate || rawData.overallConversionRate || '0'),
  };
}

/**
 * Transform raw transaction data
 */
export function transformTransactionData(rawData: any): AnalyticsData {
  const transactions = (rawData.transactions || []).map((tx: any) => ({
    id: tx.id,
    walletId: tx.wallet_id || tx.walletId,
    txid: tx.txid,
    timestamp: tx.timestamp || tx.created_at,
    type: tx.type || tx.transaction_type || 'other',
    amount: parseFloat(tx.amount || '0'),
    fee: parseFloat(tx.fee || '0'),
    status: tx.status || 'confirmed',
  }));

  const behaviorPatterns = (rawData.behavior_patterns || rawData.behaviorPatterns || []).map((pattern: any) => ({
    pattern: pattern.pattern || pattern.name,
    frequency: pattern.frequency || 0,
    lastOccurrence: pattern.last_occurrence || pattern.lastOccurrence,
  }));

  return {
    transactions,
    behaviorPatterns,
    totalTransactions: rawData.total_transactions || rawData.totalTransactions || transactions.length,
    period: {
      start: rawData.period?.start || rawData.period_start || new Date().toISOString(),
      end: rawData.period?.end || rawData.period_end || new Date().toISOString(),
    },
  };
}

/**
 * Transform raw retention cohort data
 */
export function transformRetentionData(rawData: any): RetentionAnalytics {
  const cohorts = (rawData.cohorts || []).map((cohort: any) => ({
    cohortPeriod: cohort.cohort_period || cohort.cohortPeriod,
    walletCount: cohort.wallet_count || cohort.walletCount || 0,
    retentionWeek1: parseFloat(cohort.retention_week_1 || cohort.retentionWeek1 || '0'),
    retentionWeek2: parseFloat(cohort.retention_week_2 || cohort.retentionWeek2 || '0'),
    retentionWeek3: parseFloat(cohort.retention_week_3 || cohort.retentionWeek3 || '0'),
    retentionWeek4: parseFloat(cohort.retention_week_4 || cohort.retentionWeek4 || '0'),
  }));

  return {
    cohorts,
    averageRetention: parseFloat(rawData.average_retention || rawData.averageRetention || '0'),
    period: {
      start: rawData.period?.start || rawData.period_start || new Date().toISOString(),
      end: rawData.period?.end || rawData.period_end || new Date().toISOString(),
    },
  };
}

/**
 * Transform raw productivity data
 */
export function transformProductivityData(rawData: any): ProductivityAnalytics {
  const scores = (rawData.scores || []).map((score: any) => ({
    totalScore: parseFloat(score.total_score || score.totalScore || '0'),
    retentionScore: parseFloat(score.retention_score || score.retentionScore || '0'),
    adoptionScore: parseFloat(score.adoption_score || score.adoptionScore || '0'),
    activityScore: parseFloat(score.activity_score || score.activityScore || '0'),
    diversityScore: parseFloat(score.diversity_score || score.diversityScore || '0'),
    status: score.status || 'healthy',
    riskLevel: score.risk_level || score.riskLevel || 'low',
    pendingTasks: (score.pending_tasks || score.pendingTasks || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority || 'medium',
      dueDate: task.due_date || task.dueDate || null,
      status: 'pending',
    })),
    completedTasks: (score.completed_tasks || score.completedTasks || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority || 'medium',
      dueDate: task.due_date || task.dueDate || null,
      status: 'completed',
    })),
  }));

  return {
    averageScore: parseFloat(rawData.average_score || rawData.averageScore || '0'),
    scores,
    distribution: {
      healthy: rawData.distribution?.healthy || 0,
      atRisk: rawData.distribution?.at_risk || rawData.distribution?.atRisk || 0,
      churn: rawData.distribution?.churn || 0,
    },
  };
}

/**
 * Transform raw shielded analytics data
 */
export function transformShieldedData(rawData: any): ShieldedAnalytics {
  // Handle backend response structure
  const shieldedMetrics = rawData.shielded_metrics || [];
  
  // Calculate aggregate metrics from the time series data
  let totalShieldedTx = 0;
  let totalShieldedVolume = 0;
  let avgPrivacyScore = 0;
  let uniqueWallets = 0;
  
  if (shieldedMetrics.length > 0) {
    shieldedMetrics.forEach((metric: any) => {
      totalShieldedTx += parseInt(metric.total_shielded_transactions || 0);
      totalShieldedVolume += parseFloat(metric.total_shielded_volume || 0);
      avgPrivacyScore += parseFloat(metric.avg_privacy_score || 0);
      uniqueWallets = Math.max(uniqueWallets, parseInt(metric.active_shielded_wallets || 0));
    });
    avgPrivacyScore = avgPrivacyScore / shieldedMetrics.length;
  }
  
  // Calculate shielded percentage from comparison data if available
  const comparison = rawData.shielded_vs_transparent_comparison || {};
  const totalTx = (comparison.total_shielded_transactions || 0) + (comparison.total_transparent_transactions || 0);
  const shieldedPercentage = totalTx > 0 
    ? ((comparison.total_shielded_transactions || 0) / totalTx) * 100 
    : 0;

  const metrics: ShieldedMetrics = {
    totalShieldedTransactions: totalShieldedTx,
    shieldedVolume: totalShieldedVolume,
    shieldedPercentage: shieldedPercentage,
    privacyScore: avgPrivacyScore,
    shieldedWallets: uniqueWallets,
  };

  // Transform trends data
  const trends = (shieldedMetrics || []).map((metric: any) => ({
    date: metric.date,
    shieldedCount: parseInt(metric.total_shielded_transactions || 0),
    transparentCount: parseInt(metric.total_transparent_transactions || 0),
  }));

  return {
    metrics,
    trends,
    period: {
      start: rawData.period?.start || rawData.period_start || new Date().toISOString(),
      end: rawData.period?.end || rawData.period_end || new Date().toISOString(),
    },
  };
}

/**
 * Transform raw segmentation data
 */
export function transformSegmentData(rawData: any): SegmentAnalytics {
  const segments = (rawData.segments || []).map((segment: any) => ({
    segmentName: segment.segment_name || segment.segmentName,
    walletCount: segment.wallet_count || segment.walletCount || 0,
    percentage: parseFloat(segment.percentage || '0'),
    characteristics: {
      averageTransactions: segment.characteristics?.average_transactions || segment.characteristics?.averageTransactions || 0,
      averageVolume: parseFloat(segment.characteristics?.average_volume || segment.characteristics?.averageVolume || '0'),
      retentionRate: parseFloat(segment.characteristics?.retention_rate || segment.characteristics?.retentionRate || '0'),
    },
  }));

  return {
    segments,
    totalWallets: rawData.total_wallets || rawData.totalWallets || 0,
  };
}

/**
 * Transform raw health data
 */
export function transformHealthData(rawData: any): ProjectHealthAnalytics {
  // Handle backend response structure
  const healthIndicators = rawData.health_indicators || {};
  const healthScore = rawData.health_score || 0;
  
  // Create indicators array from health_indicators object
  const indicators: HealthIndicator[] = [];
  
  // Active Wallets indicator
  if (healthIndicators.active_wallet_percentage !== undefined) {
    indicators.push({
      name: 'Active Wallets',
      value: healthIndicators.active_wallet_percentage,
      status: healthIndicators.active_wallet_percentage >= 70 ? 'good' : 
              healthIndicators.active_wallet_percentage >= 40 ? 'warning' : 'critical',
      trend: 'stable',
    });
  }
  
  // Productivity Score indicator
  if (healthIndicators.avg_productivity_score !== undefined) {
    indicators.push({
      name: 'Productivity',
      value: healthIndicators.avg_productivity_score,
      status: healthIndicators.avg_productivity_score >= 70 ? 'good' : 
              healthIndicators.avg_productivity_score >= 40 ? 'warning' : 'critical',
      trend: 'stable',
    });
  }
  
  // Churn Rate indicator (inverse - lower is better)
  if (healthIndicators.churn_rate !== undefined) {
    indicators.push({
      name: 'Churn Risk',
      value: 100 - healthIndicators.churn_rate, // Invert so higher is better
      status: healthIndicators.churn_rate <= 10 ? 'good' : 
              healthIndicators.churn_rate <= 25 ? 'warning' : 'critical',
      trend: healthIndicators.churn_rate > 15 ? 'up' : 'down',
    });
  }
  
  // Healthy Wallets indicator
  if (healthIndicators.healthy_wallets !== undefined && healthIndicators.total_wallets > 0) {
    const healthyPercentage = (healthIndicators.healthy_wallets / healthIndicators.total_wallets) * 100;
    indicators.push({
      name: 'Wallet Health',
      value: healthyPercentage,
      status: healthyPercentage >= 70 ? 'good' : 
              healthyPercentage >= 40 ? 'warning' : 'critical',
      trend: 'stable',
    });
  }
  
  // Transaction Activity indicator
  if (healthIndicators.total_transactions !== undefined) {
    const txScore = Math.min(100, (healthIndicators.total_transactions / 100) * 100);
    indicators.push({
      name: 'Transaction Activity',
      value: txScore,
      status: txScore >= 70 ? 'good' : 
              txScore >= 40 ? 'warning' : 'critical',
      trend: 'stable',
    });
  }
  
  // At-Risk Wallets indicator
  if (healthIndicators.at_risk_wallets !== undefined && healthIndicators.total_wallets > 0) {
    const atRiskPercentage = (healthIndicators.at_risk_wallets / healthIndicators.total_wallets) * 100;
    indicators.push({
      name: 'At-Risk Wallets',
      value: 100 - atRiskPercentage, // Invert so higher is better
      status: atRiskPercentage <= 10 ? 'good' : 
              atRiskPercentage <= 25 ? 'warning' : 'critical',
      trend: atRiskPercentage > 15 ? 'up' : 'down',
    });
  }

  // Generate alerts based on health indicators
  const alerts: { severity: 'info' | 'warning' | 'critical'; message: string; timestamp: string }[] = [];
  
  if (healthIndicators.churn_rate > 25) {
    alerts.push({
      severity: 'critical',
      message: `High churn rate detected (${healthIndicators.churn_rate.toFixed(1)}%). Immediate action required to retain wallets.`,
      timestamp: new Date().toISOString(),
    });
  } else if (healthIndicators.churn_rate > 15) {
    alerts.push({
      severity: 'warning',
      message: `Churn rate is elevated (${healthIndicators.churn_rate.toFixed(1)}%). Consider implementing retention strategies.`,
      timestamp: new Date().toISOString(),
    });
  }
  
  if (healthIndicators.at_risk_wallets > 0 && healthIndicators.total_wallets > 0) {
    const atRiskPercentage = (healthIndicators.at_risk_wallets / healthIndicators.total_wallets) * 100;
    if (atRiskPercentage > 25) {
      alerts.push({
        severity: 'warning',
        message: `${healthIndicators.at_risk_wallets} wallets (${atRiskPercentage.toFixed(1)}%) are at risk of churning. Review engagement strategies.`,
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  if (healthIndicators.active_wallet_percentage < 40) {
    alerts.push({
      severity: 'warning',
      message: `Low wallet activity (${healthIndicators.active_wallet_percentage.toFixed(1)}%). Consider re-engagement campaigns.`,
      timestamp: new Date().toISOString(),
    });
  }
  
  if (healthScore >= 80) {
    alerts.push({
      severity: 'info',
      message: 'Project health is excellent! Continue current strategies to maintain momentum.',
      timestamp: new Date().toISOString(),
    });
  }

  return {
    overallHealth: healthScore,
    indicators,
    alerts,
  };
}

/**
 * Transform raw comparison data
 */
export function transformComparisonData(rawData: any): ComparisonAnalytics {
  const metrics = (rawData.metrics || []).map((metric: any) => ({
    metric: metric.metric || metric.name,
    yourValue: parseFloat(metric.your_value || metric.yourValue || '0'),
    industryAverage: parseFloat(metric.industry_average || metric.industryAverage || '0'),
    percentile: parseFloat(metric.percentile || '0'),
  }));

  return {
    metrics,
    category: rawData.category || 'general',
    sampleSize: rawData.sample_size || rawData.sampleSize || 0,
  };
}

/**
 * Format ZEC amount for display
 */
export function formatZecAmount(zatoshi: number | string): string {
  const amount = typeof zatoshi === 'string' ? parseFloat(zatoshi) : zatoshi;
  const zec = amount / 100000000; // Convert zatoshi to ZEC
  return zec.toFixed(8);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get trend direction
 */
export function getTrendDirection(current: number, previous: number): 'up' | 'down' | 'stable' {
  const change = calculatePercentageChange(current, previous);
  if (Math.abs(change) < 1) return 'stable';
  return change > 0 ? 'up' : 'down';
}

// =====================================================
// ANALYTICS SERVICE CLASS
// =====================================================

class AnalyticsService {
  /**
   * Get dashboard metrics for a project
   * Requirement 7.1: Dashboard metrics aggregation
   */
  async getDashboard(projectId: string): Promise<AnalyticsServiceResponse<DashboardMetrics>> {
    try {
      if (!projectId || projectId.trim().length === 0) {
        return {
          success: false,
          error: 'Project ID is required',
        };
      }

      const response = await apiClient.get(`/api/analytics/dashboard/${projectId}`);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to fetch dashboard metrics',
          message: response.message,
        };
      }

      const transformedData = transformDashboardData(response.data);

      return {
        success: true,
        data: transformedData,
        message: response.message,
      };
    } catch (error) {
      console.error('Get dashboard error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard metrics',
      };
    }
  }

  /**
   * Get adoption funnel analytics
   * Requirement 7.2: Adoption funnel data
   */
  async getAdoption(projectId: string): Promise<AnalyticsServiceResponse<AdoptionFunnelData>> {
    try {
      if (!projectId || projectId.trim().length === 0) {
        return {
          success: false,
          error: 'Project ID is required',
        };
      }

      const response = await apiClient.get(`/api/analytics/adoption/${projectId}`);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to fetch adoption analytics',
          message: response.message,
        };
      }

      const transformedData = transformAdoptionData(response.data);

      return {
        success: true,
        data: transformedData,
        message: response.message,
      };
    } catch (error) {
      console.error('Get adoption error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch adoption analytics',
      };
    }
  }

  /**
   * Get transaction analytics
   * Requirement 7.3: Transaction data and behavior patterns
   */
  async getAnalytics(projectId: string): Promise<AnalyticsServiceResponse<AnalyticsData>> {
    try {
      if (!projectId || projectId.trim().length === 0) {
        return {
          success: false,
          error: 'Project ID is required',
        };
      }

      const response = await apiClient.get(`/api/projects/${projectId}/analytics`);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to fetch analytics data',
          message: response.message,
        };
      }

      const transformedData = transformTransactionData(response.data);

      return {
        success: true,
        data: transformedData,
        message: response.message,
      };
    } catch (error) {
      console.error('Get analytics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics data',
      };
    }
  }

  /**
   * Get retention cohort analytics
   * Requirement 7.4: Retention cohorts and rates
   */
  async getRetention(projectId: string): Promise<AnalyticsServiceResponse<RetentionAnalytics>> {
    try {
      if (!projectId || projectId.trim().length === 0) {
        return {
          success: false,
          error: 'Project ID is required',
        };
      }

      const response = await apiClient.get(`/api/analytics/retention/${projectId}`);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to fetch retention analytics',
          message: response.message,
        };
      }

      const transformedData = transformRetentionData(response.data);

      return {
        success: true,
        data: transformedData,
        message: response.message,
      };
    } catch (error) {
      console.error('Get retention error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch retention analytics',
      };
    }
  }

  /**
   * Get productivity analytics
   * Requirement 7.5: Productivity scores and tasks
   */
  async getProductivity(projectId: string): Promise<AnalyticsServiceResponse<ProductivityAnalytics>> {
    try {
      if (!projectId || projectId.trim().length === 0) {
        return {
          success: false,
          error: 'Project ID is required',
        };
      }

      const response = await apiClient.get(`/api/analytics/productivity/${projectId}`);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to fetch productivity analytics',
          message: response.message,
        };
      }

      const transformedData = transformProductivityData(response.data);

      return {
        success: true,
        data: transformedData,
        message: response.message,
      };
    } catch (error) {
      console.error('Get productivity error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch productivity analytics',
      };
    }
  }

  /**
   * Get shielded pool analytics
   * Requirement 7.6: Shielded transaction analytics
   */
  async getShielded(projectId: string): Promise<AnalyticsServiceResponse<ShieldedAnalytics>> {
    try {
      if (!projectId || projectId.trim().length === 0) {
        return {
          success: false,
          error: 'Project ID is required',
        };
      }

      const response = await apiClient.get(`/api/analytics/shielded/${projectId}`);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to fetch shielded analytics',
          message: response.message,
        };
      }

      const transformedData = transformShieldedData(response.data);

      return {
        success: true,
        data: transformedData,
        message: response.message,
      };
    } catch (error) {
      console.error('Get shielded error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch shielded analytics',
      };
    }
  }

  /**
   * Get wallet segmentation analytics
   * Requirement 7.7: Wallet segmentation data
   */
  async getSegments(projectId: string): Promise<AnalyticsServiceResponse<SegmentAnalytics>> {
    try {
      if (!projectId || projectId.trim().length === 0) {
        return {
          success: false,
          error: 'Project ID is required',
        };
      }

      const response = await apiClient.get(`/api/analytics/segments/${projectId}`);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to fetch segment analytics',
          message: response.message,
        };
      }

      const transformedData = transformSegmentData(response.data);

      return {
        success: true,
        data: transformedData,
        message: response.message,
      };
    } catch (error) {
      console.error('Get segments error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch segment analytics',
      };
    }
  }

  /**
   * Get project health indicators
   * Requirement 7.8: Project health indicators
   */
  async getHealth(projectId: string): Promise<AnalyticsServiceResponse<ProjectHealthAnalytics>> {
    try {
      if (!projectId || projectId.trim().length === 0) {
        return {
          success: false,
          error: 'Project ID is required',
        };
      }

      const response = await apiClient.get(`/api/analytics/health/${projectId}`);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to fetch health analytics',
          message: response.message,
        };
      }

      const transformedData = transformHealthData(response.data);

      return {
        success: true,
        data: transformedData,
        message: response.message,
      };
    } catch (error) {
      console.error('Get health error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch health analytics',
      };
    }
  }

  /**
   * Get competitive comparison analytics (privacy-gated)
   * Requirement 7.9: Competitive comparison data
   */
  async getComparison(projectId: string): Promise<AnalyticsServiceResponse<ComparisonAnalytics>> {
    try {
      if (!projectId || projectId.trim().length === 0) {
        return {
          success: false,
          error: 'Project ID is required',
        };
      }

      const response = await apiClient.get(`/api/analytics/comparison/${projectId}`);

      if (!response.success) {
        // Handle privacy-gated access
        if (response.error?.includes('privacy') || response.error?.includes('permission')) {
          return {
            success: false,
            error: 'Comparison analytics require public or monetizable privacy mode',
            message: response.message,
          };
        }

        return {
          success: false,
          error: response.error || 'Failed to fetch comparison analytics',
          message: response.message,
        };
      }

      const transformedData = transformComparisonData(response.data);

      return {
        success: true,
        data: transformedData,
        message: response.message,
      };
    } catch (error) {
      console.error('Get comparison error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch comparison analytics',
      };
    }
  }

  /**
   * Export analytics report
   */
  async exportReport(projectId: string, format: 'json' | 'csv' = 'json'): Promise<AnalyticsServiceResponse<any>> {
    try {
      if (!projectId || projectId.trim().length === 0) {
        return {
          success: false,
          error: 'Project ID is required',
        };
      }

      const response = await apiClient.get(`/api/analytics/dashboard/${projectId}/export?format=${format}`);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to export analytics report',
          message: response.message,
        };
      }

      return {
        success: true,
        data: response.data,
        message: response.message || 'Report exported successfully',
      };
    } catch (error) {
      console.error('Export report error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export analytics report',
      };
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
