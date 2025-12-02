import express from 'express';
import {
  getWalletActivityController,
  getWalletTransactionsController,
  getWalletProductivityController,
  updateWalletProductivityController,
  getBulkProductivityScoresController,
  getProjectProductivitySummaryController,
  getCohortRetentionController,
  getWalletAdoptionController,
  updateWalletAdoptionController,
  getProjectAdoptionFunnelController,
  getProjectConversionAnalysisController,
  getProjectConversionReportController,
  getCohortConversionAnalysisController,
  getConversionTrendsController,
  getProjectAnalyticsController,
  getProjectDashboardController,
  getDashboardTimeSeriesController,
  exportAnalyticsReportController,
  clearDashboardCacheController,
  getWalletHealthDashboardController,
  updateAllProductivityScoresController,
  updateAllAdoptionStagesController,
  getProjectAdoptionAnalyticsController,
  getProjectRetentionAnalyticsController,
  getProjectProductivityAnalyticsController,
  getProjectShieldedAnalyticsController,
  getProjectSegmentsAnalyticsController,
  getProjectHealthAnalyticsController,
  getProjectComparisonAnalyticsController
} from '../controllers/analytics.js';

const router = express.Router();

// =====================================================
// WALLET-LEVEL ANALYTICS ROUTES
// =====================================================

// GET /api/projects/:projectId/wallets/:walletId/analytics/activity
// Get wallet activity metrics
router.get('/projects/:projectId/wallets/:walletId/analytics/activity', getWalletActivityController);

// GET /api/projects/:projectId/wallets/:walletId/analytics/transactions
// Get processed transactions for wallet
router.get('/projects/:projectId/wallets/:walletId/analytics/transactions', getWalletTransactionsController);

// GET /api/projects/:projectId/wallets/:walletId/analytics/productivity
// Get wallet productivity score
router.get('/projects/:projectId/wallets/:walletId/analytics/productivity', getWalletProductivityController);

// PUT /api/projects/:projectId/wallets/:walletId/analytics/productivity
// Update wallet productivity score
router.put('/projects/:projectId/wallets/:walletId/analytics/productivity', updateWalletProductivityController);

// GET /api/projects/:projectId/wallets/:walletId/analytics/adoption
// Get wallet adoption stage status
router.get('/projects/:projectId/wallets/:walletId/analytics/adoption', getWalletAdoptionController);

// PUT /api/projects/:projectId/wallets/:walletId/analytics/adoption
// Update wallet adoption stages
router.put('/projects/:projectId/wallets/:walletId/analytics/adoption', updateWalletAdoptionController);

// =====================================================
// PROJECT-LEVEL ANALYTICS ROUTES
// =====================================================

// GET /api/analytics/dashboard/:projectId
// Get comprehensive dashboard metrics with caching and privacy filtering
router.get('/analytics/dashboard/:projectId', getProjectDashboardController);

// GET /api/analytics/dashboard/:projectId/timeseries
// Get time-series data for dashboard charts
router.get('/analytics/dashboard/:projectId/timeseries', getDashboardTimeSeriesController);

// GET /api/analytics/dashboard/:projectId/export
// Export analytics report in JSON or CSV format
router.get('/analytics/dashboard/:projectId/export', exportAnalyticsReportController);

// DELETE /api/analytics/dashboard/:projectId/cache
// Clear dashboard cache for a project
router.delete('/analytics/dashboard/:projectId/cache', clearDashboardCacheController);

// GET /api/projects/:projectId/analytics
// Get comprehensive project analytics summary
router.get('/projects/:projectId/analytics', getProjectAnalyticsController);

// GET /api/projects/:projectId/analytics/cohorts
// Get cohort retention analysis
router.get('/projects/:projectId/analytics/cohorts', getCohortRetentionController);

// GET /api/projects/:projectId/analytics/adoption-funnel
// Get project adoption funnel analysis
router.get('/projects/:projectId/analytics/adoption-funnel', getProjectAdoptionFunnelController);

// GET /api/projects/:projectId/analytics/conversion-analysis
// Get detailed conversion rate and drop-off analysis
router.get('/projects/:projectId/analytics/conversion-analysis', getProjectConversionAnalysisController);

// GET /api/projects/:projectId/analytics/conversion-report
// Get comprehensive conversion analysis report
router.get('/projects/:projectId/analytics/conversion-report', getProjectConversionReportController);

// GET /api/projects/:projectId/analytics/cohort-conversions
// Get cohort-based conversion analysis
router.get('/projects/:projectId/analytics/cohort-conversions', getCohortConversionAnalysisController);

// GET /api/projects/:projectId/analytics/conversion-trends
// Get conversion trends over time
router.get('/projects/:projectId/analytics/conversion-trends', getConversionTrendsController);

// GET /api/projects/:projectId/analytics/productivity/bulk
// Get productivity scores for multiple wallets
router.get('/projects/:projectId/analytics/productivity/bulk', getBulkProductivityScoresController);

// GET /api/projects/:projectId/analytics/productivity/summary
// Get project-level productivity summary
router.get('/projects/:projectId/analytics/productivity/summary', getProjectProductivitySummaryController);

// PUT /api/projects/:projectId/analytics/productivity/update-all
// Update productivity scores for all wallets in project
router.put('/projects/:projectId/analytics/productivity/update-all', updateAllProductivityScoresController);

// PUT /api/projects/:projectId/analytics/adoption/update-all
// Update adoption stages for all wallets in project
router.put('/projects/:projectId/analytics/adoption/update-all', updateAllAdoptionStagesController);

// =====================================================
// GLOBAL ANALYTICS ROUTES
// =====================================================

// GET /api/analytics/dashboard/health
// Get wallet health dashboard (cross-project)
router.get('/analytics/dashboard/health', getWalletHealthDashboardController);

// =====================================================
// NEW ANALYTICS API ENDPOINTS (TASK 19)
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
// =====================================================

// GET /api/analytics/adoption/:projectId
// Get adoption funnel analytics for a project
// Requirements: 7.2
router.get('/analytics/adoption/:projectId', getProjectAdoptionAnalyticsController);

// GET /api/analytics/retention/:projectId
// Get retention cohort analytics for a project
// Requirements: 7.4
router.get('/analytics/retention/:projectId', getProjectRetentionAnalyticsController);

// GET /api/analytics/productivity/:projectId
// Get productivity analytics for a project
// Requirements: 7.5
router.get('/analytics/productivity/:projectId', getProjectProductivityAnalyticsController);

// GET /api/analytics/shielded/:projectId
// Get shielded pool analytics for a project
// Requirements: 7.6
router.get('/analytics/shielded/:projectId', getProjectShieldedAnalyticsController);

// GET /api/analytics/segments/:projectId
// Get wallet segmentation analytics for a project
// Requirements: 7.7
router.get('/analytics/segments/:projectId', getProjectSegmentsAnalyticsController);

// GET /api/analytics/health/:projectId
// Get project health indicators
// Requirements: 7.8
router.get('/analytics/health/:projectId', getProjectHealthAnalyticsController);

// GET /api/analytics/comparison/:projectId
// Get competitive comparison analytics (privacy-gated)
// Requirements: 7.9
router.get('/analytics/comparison/:projectId', getProjectComparisonAnalyticsController);

export default router;