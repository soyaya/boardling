import {
  getActivityMetrics,
  getWalletActivitySummary,
  getCohortRetentionData,
  updateProductivityScore,
  getProductivityScore,
  getWalletTransactions,
  getWalletHealthDashboard,
  getProjectAnalyticsSummary,
  getWalletAdoptionStages,
  getProjectAdoptionMetrics
} from '../models/analytics.js';
import {
  calculateEnhancedProductivityScore,
  updateProductivityScore as updateEnhancedProductivityScore,
  getBulkProductivityScores,
  getProjectProductivitySummary
} from '../services/productivityScoringService.js';
import {
  initializeWalletAdoption,
  updateWalletAdoptionStages,
  getProjectAdoptionFunnel,
  getAdoptionConversionRates,
  getTimeToStageMetrics,
  identifyDropOffPoints,
  getWalletAdoptionStatus
} from '../services/adoptionStageService.js';
import {
  calculateStageConversions,
  identifySignificantDropOffs,
  getCohortFunnelAnalysis,
  analyzeConversionTrends,
  generateConversionReport
} from '../services/conversionAnalysisService.js';
import { getProjectById } from '../models/project.js';
import { getWalletById } from '../models/wallet.js';
import { BadRequestError, NotFoundError } from '../errors/index.js';
import pool from '../db/db.js';
import DashboardAggregationService from '../services/dashboardAggregationService.js';
import PrivacyPreferenceService from '../services/privacyPreferenceService.js';
import PrivacyEnforcementService from '../services/privacyEnforcementService.js';

// Initialize privacy enforcement service
const privacyEnforcement = new PrivacyEnforcementService(pool);

// =====================================================
// WALLET ACTIVITY ANALYTICS
// =====================================================

const getWalletActivityController = async (req, res, next) => {
  try {
    const { projectId, walletId } = req.params;
    const { startDate, endDate, days = 30 } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Verify wallet exists and belongs to project
    const wallet = await getWalletById(walletId, projectId);
    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    let activityData;
    
    if (startDate && endDate) {
      // Get activity for specific date range
      activityData = await getActivityMetrics(walletId, startDate, endDate);
    } else {
      // Get activity summary for recent days
      activityData = await getWalletActivitySummary(walletId, parseInt(days));
    }

    res.json({
      success: true,
      data: {
        wallet_id: walletId,
        activity: activityData
      }
    });
  } catch (err) {
    next(err);
  }
};

const getWalletTransactionsController = async (req, res, next) => {
  try {
    const { projectId, walletId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Verify wallet exists and belongs to project
    const wallet = await getWalletById(walletId, projectId);
    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    const transactions = await getWalletTransactions(
      walletId, 
      parseInt(limit), 
      parseInt(offset)
    );

    res.json({
      success: true,
      data: {
        wallet_id: walletId,
        transactions,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: transactions.length
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// =====================================================
// PRODUCTIVITY SCORING
// =====================================================

const getWalletProductivityController = async (req, res, next) => {
  try {
    const { projectId, walletId } = req.params;
    const { enhanced = 'true' } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Verify wallet exists and belongs to project
    const wallet = await getWalletById(walletId, projectId);
    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    let productivityData;

    if (enhanced === 'true') {
      // Use enhanced productivity scoring
      productivityData = await calculateEnhancedProductivityScore(walletId);
    } else {
      // Use legacy scoring
      let productivityScore = await getProductivityScore(walletId);
      
      // If no score exists, calculate it
      if (!productivityScore) {
        productivityScore = await updateProductivityScore(walletId);
      }
      productivityData = productivityScore;
    }

    res.json({
      success: true,
      data: {
        wallet_id: walletId,
        productivity: productivityData,
        enhanced: enhanced === 'true'
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateWalletProductivityController = async (req, res, next) => {
  try {
    const { projectId, walletId } = req.params;
    const { enhanced = 'true' } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Verify wallet exists and belongs to project
    const wallet = await getWalletById(walletId, projectId);
    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    let productivityScore;

    if (enhanced === 'true') {
      // Use enhanced productivity scoring
      productivityScore = await updateEnhancedProductivityScore(walletId);
    } else {
      // Use legacy scoring
      productivityScore = await updateProductivityScore(walletId);
    }

    res.json({
      success: true,
      data: {
        wallet_id: walletId,
        productivity: productivityScore,
        enhanced: enhanced === 'true',
        message: 'Productivity score updated successfully'
      }
    });
  } catch (err) {
    next(err);
  }
};

// =====================================================
// COHORT AND RETENTION ANALYTICS
// =====================================================

const getCohortRetentionController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { cohortType = 'weekly', limit = 10 } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (!['weekly', 'monthly'].includes(cohortType)) {
      throw new BadRequestError('Cohort type must be weekly or monthly');
    }

    const retentionData = await getCohortRetentionData(cohortType, parseInt(limit));

    res.json({
      success: true,
      data: {
        project_id: projectId,
        cohort_type: cohortType,
        retention_data: retentionData
      }
    });
  } catch (err) {
    next(err);
  }
};

// =====================================================
// PROJECT-LEVEL ANALYTICS
// =====================================================

const getProjectAnalyticsController = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const analyticsSummary = await getProjectAnalyticsSummary(projectId);

    res.json({
      success: true,
      data: {
        project_id: projectId,
        project_name: project.name,
        analytics: analyticsSummary
      }
    });
  } catch (err) {
    next(err);
  }
};

// =====================================================
// DASHBOARD ANALYTICS
// =====================================================

// Initialize services
const dashboardService = new DashboardAggregationService(pool);
const privacyService = new PrivacyPreferenceService(pool);

/**
 * Get comprehensive dashboard metrics for a project
 * Implements caching and privacy filtering
 * Requirements: 7.1, 8.1
 */
const getProjectDashboardController = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get comprehensive dashboard data with caching
    const dashboardData = await dashboardService.getProjectDashboard(projectId);

    // Apply privacy filters to the data
    const filteredData = await applyPrivacyFilters(dashboardData, projectId, req.user.id);

    res.json({
      success: true,
      data: {
        project_id: projectId,
        project_name: project.name,
        ...filteredData
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get time-series data for dashboard charts
 * Requirements: 7.1
 */
const getDashboardTimeSeriesController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { metric = 'active_wallets', days = 30 } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Validate metric
    const validMetrics = ['active_wallets', 'transactions', 'productivity'];
    if (!validMetrics.includes(metric)) {
      throw new BadRequestError(`Invalid metric. Must be one of: ${validMetrics.join(', ')}`);
    }

    // Get time-series data with caching
    const timeSeriesData = await dashboardService.getTimeSeriesData(
      projectId, 
      metric, 
      parseInt(days)
    );

    res.json({
      success: true,
      data: {
        project_id: projectId,
        metric,
        days: parseInt(days),
        time_series: timeSeriesData
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Export analytics report
 * Requirements: 7.1
 */
const exportAnalyticsReportController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { format = 'json' } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Validate format
    const validFormats = ['json', 'csv'];
    if (!validFormats.includes(format)) {
      throw new BadRequestError(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }

    // Export report
    const report = await dashboardService.exportAnalyticsReport(projectId, format);

    // Set appropriate content type
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${projectId}-${Date.now()}.csv"`);
      res.send(report.data);
    } else {
      res.json({
        success: true,
        ...report
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Clear dashboard cache for a project
 * Requirements: 7.1
 */
const clearDashboardCacheController = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Clear cache for this project
    dashboardService.clearCache(`dashboard:${projectId}`);
    dashboardService.clearCache(`timeseries:${projectId}`);

    res.json({
      success: true,
      data: {
        project_id: projectId,
        message: 'Dashboard cache cleared successfully'
      }
    });
  } catch (err) {
    next(err);
  }
};

const getWalletHealthDashboardController = async (req, res, next) => {
  try {
    const healthData = await getWalletHealthDashboard();

    res.json({
      success: true,
      data: {
        wallet_health: healthData,
        generated_at: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Helper function to apply privacy filters to dashboard data
 * Filters out private wallets and applies appropriate data masking
 * Requirements: 8.1
 */
async function applyPrivacyFilters(dashboardData, projectId, userId) {
  // Get all wallets for the project with their privacy modes
  const walletsResult = await pool.query(
    `SELECT id, privacy_mode FROM wallets WHERE project_id = $1`,
    [projectId]
  );

  const wallets = walletsResult.rows;
  const privateWalletIds = wallets
    .filter(w => w.privacy_mode === 'private')
    .map(w => w.id);

  // If there are no private wallets, return data as-is
  if (privateWalletIds.length === 0) {
    return dashboardData;
  }

  // Apply privacy filters to overview metrics
  // Recalculate metrics excluding private wallets
  const filteredOverview = await recalculateOverviewMetrics(projectId, privateWalletIds);
  
  // Apply privacy filters to productivity summary
  const filteredProductivity = await recalculateProductivityMetrics(projectId, privateWalletIds);

  // Return filtered dashboard data
  return {
    ...dashboardData,
    overview: filteredOverview || dashboardData.overview,
    productivity: filteredProductivity || dashboardData.productivity,
    privacy_note: privateWalletIds.length > 0 
      ? `${privateWalletIds.length} private wallet(s) excluded from aggregated metrics`
      : null
  };
}

/**
 * Recalculate overview metrics excluding private wallets
 */
async function recalculateOverviewMetrics(projectId, excludeWalletIds) {
  if (excludeWalletIds.length === 0) return null;

  const result = await pool.query(
    `SELECT 
      COUNT(DISTINCT w.id) as total_wallets,
      COUNT(DISTINCT CASE WHEN wam.is_active THEN w.id END) as active_wallets,
      SUM(wam.transaction_count) as total_transactions,
      SUM(wam.total_volume_zatoshi) as total_volume,
      AVG(wps.total_score) as avg_productivity_score
     FROM wallets w
     LEFT JOIN wallet_activity_metrics wam ON w.id = wam.wallet_id
     LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
     WHERE w.project_id = $1 AND w.id != ALL($2)`,
    [projectId, excludeWalletIds]
  );

  const row = result.rows[0];
  return {
    total_wallets: parseInt(row.total_wallets) || 0,
    active_wallets: parseInt(row.active_wallets) || 0,
    total_transactions: parseInt(row.total_transactions) || 0,
    total_volume_zec: (parseInt(row.total_volume) || 0) / 100000000,
    avg_productivity_score: parseFloat(row.avg_productivity_score) || 0
  };
}

/**
 * Recalculate productivity metrics excluding private wallets
 */
async function recalculateProductivityMetrics(projectId, excludeWalletIds) {
  if (excludeWalletIds.length === 0) return null;

  const result = await pool.query(
    `SELECT 
      AVG(total_score) as avg_total,
      AVG(retention_score) as avg_retention,
      AVG(adoption_score) as avg_adoption,
      AVG(activity_score) as avg_activity,
      COUNT(CASE WHEN status = 'at_risk' THEN 1 END) as at_risk_count,
      COUNT(CASE WHEN status = 'churn' THEN 1 END) as churn_count
     FROM wallet_productivity_scores wps
     JOIN wallets w ON wps.wallet_id = w.id
     WHERE w.project_id = $1 AND w.id != ALL($2)`,
    [projectId, excludeWalletIds]
  );

  const row = result.rows[0];
  return {
    avg_total_score: parseFloat(row.avg_total) || 0,
    avg_retention_score: parseFloat(row.avg_retention) || 0,
    avg_adoption_score: parseFloat(row.avg_adoption) || 0,
    avg_activity_score: parseFloat(row.avg_activity) || 0,
    at_risk_wallets: parseInt(row.at_risk_count) || 0,
    churn_wallets: parseInt(row.churn_count) || 0
  };
}

// =====================================================
// ADOPTION FUNNEL ANALYTICS
// =====================================================

const getWalletAdoptionController = async (req, res, next) => {
  try {
    const { projectId, walletId } = req.params;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Verify wallet exists and belongs to project
    const wallet = await getWalletById(walletId, projectId);
    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    const adoptionStatus = await getWalletAdoptionStatus(walletId);

    res.json({
      success: true,
      data: {
        wallet_id: walletId,
        adoption: adoptionStatus
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateWalletAdoptionController = async (req, res, next) => {
  try {
    const { projectId, walletId } = req.params;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Verify wallet exists and belongs to project
    const wallet = await getWalletById(walletId, projectId);
    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    // Initialize adoption tracking if not exists
    await initializeWalletAdoption(walletId);
    
    // Update adoption stages based on current activity
    const result = await updateWalletAdoptionStages(walletId);

    res.json({
      success: true,
      data: {
        wallet_id: walletId,
        updates: result.updates,
        message: `Updated ${result.updates.length} adoption stages`
      }
    });
  } catch (err) {
    next(err);
  }
};

const getProjectAdoptionFunnelController = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const [funnelData, conversionRates, timeMetrics, dropOffs] = await Promise.all([
      getProjectAdoptionFunnel(projectId),
      getAdoptionConversionRates(projectId),
      getTimeToStageMetrics(projectId),
      identifyDropOffPoints(projectId)
    ]);

    res.json({
      success: true,
      data: {
        project_id: projectId,
        funnel_overview: funnelData,
        conversion_rates: conversionRates,
        time_to_stage_metrics: timeMetrics,
        drop_off_analysis: dropOffs
      }
    });
  } catch (err) {
    next(err);
  }
};

const getProjectConversionAnalysisController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { 
      segmentBy = null, 
      timeRange = null,
      minSampleSize = 10 
    } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Parse time range if provided
    let parsedTimeRange = null;
    if (timeRange) {
      try {
        const [start, end] = timeRange.split(',');
        parsedTimeRange = {
          start: new Date(start),
          end: new Date(end)
        };
      } catch (error) {
        throw new BadRequestError('Invalid time range format. Use: start_date,end_date');
      }
    }

    const options = {
      segmentBy: segmentBy || null,
      timeRange: parsedTimeRange,
      minSampleSize: parseInt(minSampleSize)
    };

    const [stageConversions, dropOffAnalysis] = await Promise.all([
      calculateStageConversions(projectId, options),
      identifySignificantDropOffs(projectId, options)
    ]);

    res.json({
      success: true,
      data: {
        project_id: projectId,
        analysis_options: options,
        stage_conversions: stageConversions,
        drop_off_analysis: dropOffAnalysis
      }
    });
  } catch (err) {
    next(err);
  }
};

const getProjectConversionReportController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { 
      cohortType = 'weekly',
      lookbackDays = 90,
      timeGranularity = 'weekly'
    } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const options = {
      cohortType,
      lookbackDays: parseInt(lookbackDays),
      timeGranularity
    };

    const conversionReport = await generateConversionReport(projectId, options);

    res.json({
      success: true,
      data: conversionReport
    });
  } catch (err) {
    next(err);
  }
};

const getCohortConversionAnalysisController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { 
      cohortType = 'weekly',
      limit = 10 
    } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const options = {
      cohortType,
      limit: parseInt(limit)
    };

    const cohortAnalysis = await getCohortFunnelAnalysis(projectId, options);

    res.json({
      success: true,
      data: {
        project_id: projectId,
        cohort_type: cohortType,
        cohort_analysis: cohortAnalysis
      }
    });
  } catch (err) {
    next(err);
  }
};

const getConversionTrendsController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { 
      timeGranularity = 'weekly',
      lookbackDays = 90 
    } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (!['daily', 'weekly', 'monthly'].includes(timeGranularity)) {
      throw new BadRequestError('Time granularity must be daily, weekly, or monthly');
    }

    const options = {
      timeGranularity,
      lookbackDays: parseInt(lookbackDays)
    };

    const trendAnalysis = await analyzeConversionTrends(projectId, options);

    res.json({
      success: true,
      data: {
        project_id: projectId,
        time_granularity: timeGranularity,
        lookback_days: parseInt(lookbackDays),
        trend_analysis: trendAnalysis
      }
    });
  } catch (err) {
    next(err);
  }
};

// =====================================================
// BULK OPERATIONS
// =====================================================

const updateAllProductivityScoresController = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get all wallets for the project
    const walletsResult = await pool.query(
      'SELECT id FROM wallets WHERE project_id = $1 AND is_active = true',
      [projectId]
    );

    const updatePromises = walletsResult.rows.map(wallet => 
      updateProductivityScore(wallet.id)
    );

    const results = await Promise.allSettled(updatePromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({
      success: true,
      data: {
        project_id: projectId,
        total_wallets: walletsResult.rows.length,
        successful_updates: successful,
        failed_updates: failed,
        message: `Updated productivity scores for ${successful} wallets`
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateAllAdoptionStagesController = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get all wallets for the project
    const walletsResult = await pool.query(
      'SELECT id FROM wallets WHERE project_id = $1 AND is_active = true',
      [projectId]
    );

    const updatePromises = walletsResult.rows.map(async (wallet) => {
      try {
        await initializeWalletAdoption(wallet.id);
        return await updateWalletAdoptionStages(wallet.id);
      } catch (error) {
        return { error: error.message, wallet_id: wallet.id };
      }
    });

    const results = await Promise.allSettled(updatePromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
    const failed = results.filter(r => r.status === 'rejected' || r.value?.error).length;

    res.json({
      success: true,
      data: {
        project_id: projectId,
        total_wallets: walletsResult.rows.length,
        successful_updates: successful,
        failed_updates: failed,
        message: `Updated adoption stages for ${successful} wallets`
      }
    });
  } catch (err) {
    next(err);
  }
};

const getBulkProductivityScoresController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { limit = 50 } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get wallet IDs for the project
    const walletsResult = await pool.query(
      'SELECT id FROM wallets WHERE project_id = $1 AND is_active = true LIMIT $2',
      [projectId, parseInt(limit)]
    );

    const walletIds = walletsResult.rows.map(row => row.id);
    
    if (walletIds.length === 0) {
      return res.json({
        success: true,
        data: {
          project_id: projectId,
          wallet_scores: [],
          message: 'No active wallets found'
        }
      });
    }

    const bulkScores = await getBulkProductivityScores(walletIds);

    res.json({
      success: true,
      data: {
        project_id: projectId,
        wallet_scores: bulkScores,
        total_processed: bulkScores.length,
        successful: bulkScores.filter(s => s.success).length,
        failed: bulkScores.filter(s => !s.success).length
      }
    });
  } catch (err) {
    next(err);
  }
};

const getProjectProductivitySummaryController = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const summary = await getProjectProductivitySummary(projectId);

    res.json({
      success: true,
      data: {
        project_name: project.name,
        ...summary
      }
    });
  } catch (err) {
    next(err);
  }
};

// =====================================================
// NEW ANALYTICS ENDPOINTS FOR TASK 19
// =====================================================

/**
 * Get adoption funnel analytics for a project
 * Requirements: 7.2
 */
const getProjectAdoptionAnalyticsController = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get adoption funnel data
    const adoptionData = await getProjectAdoptionFunnel(projectId);

    res.json({
      success: true,
      data: {
        project_id: projectId,
        project_name: project.name,
        adoption_funnel: adoptionData
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get retention cohort analytics for a project
 * Requirements: 7.4
 */
const getProjectRetentionAnalyticsController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { cohortType = 'weekly', limit = 10 } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Import retention service
    const { getRetentionHeatmapData, analyzeRetentionTrends } = await import('../services/retentionService.js');

    // Get retention data
    const [heatmapData, trendAnalysis] = await Promise.all([
      getRetentionHeatmapData(cohortType, parseInt(limit)),
      analyzeRetentionTrends(cohortType, parseInt(limit))
    ]);

    // Calculate average retention across all cohorts
    const averageRetention = heatmapData.length > 0
      ? heatmapData.reduce((sum, cohort) => {
          const avg = (
            (parseFloat(cohort.week_1) || 0) +
            (parseFloat(cohort.week_2) || 0) +
            (parseFloat(cohort.week_3) || 0) +
            (parseFloat(cohort.week_4) || 0)
          ) / 4;
          return sum + avg;
        }, 0) / heatmapData.length
      : 0;

    // Determine period range
    const periods = heatmapData.map(c => new Date(c.cohort_period)).filter(d => !isNaN(d.getTime()));
    const periodStart = periods.length > 0 ? new Date(Math.min(...periods)).toISOString() : new Date().toISOString();
    const periodEnd = periods.length > 0 ? new Date(Math.max(...periods)).toISOString() : new Date().toISOString();

    res.json({
      success: true,
      data: {
        cohorts: heatmapData,
        average_retention: averageRetention,
        period: {
          start: periodStart,
          end: periodEnd
        },
        trend_analysis: trendAnalysis
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get productivity analytics for a project
 * Requirements: 7.5
 */
const getProjectProductivityAnalyticsController = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get productivity summary
    const productivitySummary = await getProjectProductivitySummary(projectId);

    res.json({
      success: true,
      data: {
        project_id: projectId,
        project_name: project.name,
        productivity: productivitySummary
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get shielded pool analytics for a project
 * Requirements: 7.6
 */
const getProjectShieldedAnalyticsController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { days = 30 } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Import shielded analyzer service
    const { getProjectShieldedAnalytics, compareShieldedVsTransparentUsers } = await import('../services/shieldedAnalyzer.js');

    // Get shielded analytics
    const [shieldedMetrics, comparison] = await Promise.all([
      getProjectShieldedAnalytics(projectId, parseInt(days)),
      compareShieldedVsTransparentUsers(projectId, parseInt(days))
    ]);

    res.json({
      success: true,
      data: {
        project_id: projectId,
        project_name: project.name,
        time_period_days: parseInt(days),
        shielded_metrics: shieldedMetrics,
        shielded_vs_transparent_comparison: comparison
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get wallet segmentation analytics for a project
 * Requirements: 7.7
 */
const getProjectSegmentsAnalyticsController = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get wallet segmentation data
    const segmentationResult = await pool.query(`
      SELECT 
        wps.status,
        wps.risk_level,
        COUNT(*) as wallet_count,
        AVG(wps.total_score) as avg_score,
        AVG(wps.retention_score) as avg_retention,
        AVG(wps.adoption_score) as avg_adoption,
        AVG(wps.activity_score) as avg_activity
      FROM wallets w
      JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
      WHERE w.project_id = $1
      GROUP BY wps.status, wps.risk_level
      ORDER BY wps.status, wps.risk_level
    `, [projectId]);

    const segments = segmentationResult.rows.map(row => ({
      status: row.status,
      risk_level: row.risk_level,
      wallet_count: parseInt(row.wallet_count),
      avg_score: Math.round(parseFloat(row.avg_score) * 100) / 100,
      avg_retention: Math.round(parseFloat(row.avg_retention) * 100) / 100,
      avg_adoption: Math.round(parseFloat(row.avg_adoption) * 100) / 100,
      avg_activity: Math.round(parseFloat(row.avg_activity) * 100) / 100
    }));

    res.json({
      success: true,
      data: {
        project_id: projectId,
        project_name: project.name,
        segments
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get project health indicators
 * Requirements: 7.8
 */
const getProjectHealthAnalyticsController = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get comprehensive health metrics
    const healthResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT w.id) as total_wallets,
        COUNT(DISTINCT CASE WHEN wam.is_active THEN w.id END) as active_wallets,
        COUNT(DISTINCT CASE WHEN wps.status = 'healthy' THEN w.id END) as healthy_wallets,
        COUNT(DISTINCT CASE WHEN wps.status = 'at_risk' THEN w.id END) as at_risk_wallets,
        COUNT(DISTINCT CASE WHEN wps.status = 'churn' THEN w.id END) as churned_wallets,
        AVG(wps.total_score) as avg_productivity_score,
        SUM(wam.transaction_count) as total_transactions,
        COUNT(DISTINCT wam.activity_date) as total_active_days
      FROM wallets w
      LEFT JOIN wallet_activity_metrics wam ON w.id = wam.wallet_id
      LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
      WHERE w.project_id = $1
    `, [projectId]);

    const healthData = healthResult.rows[0];
    const totalWallets = parseInt(healthData.total_wallets) || 0;

    const healthIndicators = {
      total_wallets: totalWallets,
      active_wallets: parseInt(healthData.active_wallets) || 0,
      active_wallet_percentage: totalWallets > 0 ? 
        Math.round((parseInt(healthData.active_wallets) / totalWallets) * 10000) / 100 : 0,
      healthy_wallets: parseInt(healthData.healthy_wallets) || 0,
      at_risk_wallets: parseInt(healthData.at_risk_wallets) || 0,
      churned_wallets: parseInt(healthData.churned_wallets) || 0,
      churn_rate: totalWallets > 0 ? 
        Math.round((parseInt(healthData.churned_wallets) / totalWallets) * 10000) / 100 : 0,
      avg_productivity_score: Math.round(parseFloat(healthData.avg_productivity_score) * 100) / 100 || 0,
      total_transactions: parseInt(healthData.total_transactions) || 0,
      total_active_days: parseInt(healthData.total_active_days) || 0
    };

    // Calculate overall health score (0-100)
    const healthScore = calculateProjectHealthScore(healthIndicators);

    res.json({
      success: true,
      data: {
        project_id: projectId,
        project_name: project.name,
        health_score: healthScore,
        health_indicators: healthIndicators,
        health_status: getHealthStatus(healthScore)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get competitive comparison analytics (privacy-gated)
 * Requirements: 7.9
 */
const getProjectComparisonAnalyticsController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { targetPercentile = 'p50' } = req.query;

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check if user has public or monetizable privacy mode
    const privacyCheckResult = await pool.query(`
      SELECT COUNT(*) as public_wallet_count
      FROM wallets
      WHERE project_id = $1
      AND privacy_mode IN ('public', 'monetizable')
    `, [projectId]);

    const publicWalletCount = parseInt(privacyCheckResult.rows[0].public_wallet_count);

    if (publicWalletCount === 0) {
      return res.status(403).json({
        success: false,
        error: 'PRIVACY_RESTRICTED',
        message: 'Competitive comparison requires at least one wallet with public or monetizable privacy mode',
        data: {
          project_id: projectId,
          privacy_requirement: 'public or monetizable',
          current_public_wallets: 0
        }
      });
    }

    // Import comparison service
    const { compareProjectToBenchmarks } = await import('../services/projectComparisonService.js');

    // Get comparison data
    const comparisonData = await compareProjectToBenchmarks(projectId, targetPercentile);

    res.json({
      success: true,
      data: {
        project_id: projectId,
        project_name: project.name,
        comparison: comparisonData,
        privacy_note: `Comparison available due to ${publicWalletCount} wallet(s) with public/monetizable privacy mode`
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Helper function to calculate project health score
 */
function calculateProjectHealthScore(indicators) {
  let score = 0;

  // Active wallet percentage (0-30 points)
  score += Math.min(indicators.active_wallet_percentage * 0.3, 30);

  // Productivity score (0-30 points)
  score += Math.min(indicators.avg_productivity_score * 0.3, 30);

  // Churn rate (0-20 points, inverse)
  const churnPenalty = Math.min(indicators.churn_rate * 0.5, 20);
  score += (20 - churnPenalty);

  // At-risk wallet percentage (0-20 points, inverse)
  const atRiskPercentage = indicators.total_wallets > 0 ? 
    (indicators.at_risk_wallets / indicators.total_wallets) * 100 : 0;
  const atRiskPenalty = Math.min(atRiskPercentage * 0.5, 20);
  score += (20 - atRiskPenalty);

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Helper function to get health status from score
 */
function getHealthStatus(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'poor';
  return 'critical';
}

export {
  // Wallet activity
  getWalletActivityController,
  getWalletTransactionsController,
  
  // Productivity scoring
  getWalletProductivityController,
  updateWalletProductivityController,
  getBulkProductivityScoresController,
  getProjectProductivitySummaryController,
  
  // Cohort and retention
  getCohortRetentionController,
  
  // Adoption funnel
  getWalletAdoptionController,
  updateWalletAdoptionController,
  getProjectAdoptionFunnelController,
  
  // Conversion analysis
  getProjectConversionAnalysisController,
  getProjectConversionReportController,
  getCohortConversionAnalysisController,
  getConversionTrendsController,
  
  // Project analytics
  getProjectAnalyticsController,
  
  // Dashboard
  getProjectDashboardController,
  getDashboardTimeSeriesController,
  exportAnalyticsReportController,
  clearDashboardCacheController,
  getWalletHealthDashboardController,
  
  // Bulk operations
  updateAllProductivityScoresController,
  updateAllAdoptionStagesController,
  
  // New analytics endpoints (Task 19)
  getProjectAdoptionAnalyticsController,
  getProjectRetentionAnalyticsController,
  getProjectProductivityAnalyticsController,
  getProjectShieldedAnalyticsController,
  getProjectSegmentsAnalyticsController,
  getProjectHealthAnalyticsController,
  getProjectComparisonAnalyticsController
};