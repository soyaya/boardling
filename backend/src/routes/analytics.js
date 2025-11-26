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
  getWalletHealthDashboardController,
  updateAllProductivityScoresController,
  updateAllAdoptionStagesController
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

export default router;