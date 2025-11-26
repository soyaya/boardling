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
  getWalletHealthDashboardController,
  
  // Bulk operations
  updateAllProductivityScoresController,
  updateAllAdoptionStagesController
};