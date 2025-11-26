/**
 * Wallet Analytics Platform API Routes
 * Comprehensive REST API endpoints for privacy, monetization, benchmarking, alerts
 */

import express from 'express';

const router = express.Router();

// =====================================================
// PRIVACY CONTROL ROUTES
// =====================================================

// GET /api/wallets/:walletId/privacy
router.get('/wallets/:walletId/privacy', async (req, res) => {
  try {
    const { walletId } = req.params;
    const privacyService = req.app.get('privacyService');
    const preference = await privacyService.getPrivacyPreference(walletId);
    res.json({ success: true, data: preference });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false, error: error.message
    });
  }
});

// PUT /api/wallets/:walletId/privacy
router.put('/wallets/:walletId/privacy', async (req, res) => {
  try {
    const { walletId } = req.params;
    const { privacy_mode } = req.body;
    const privacyService = req.app.get('privacyService');
    
    if (!privacy_mode) {
      return res.status(400).json({ success: false, error: 'privacy_mode is required' });
    }
    
    const updated = await privacyService.setPrivacyPreference(walletId, privacy_mode);
    res.json({ success: true, data: updated, message: `Privacy mode updated to ${privacy_mode}` });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/wallets/:walletId/privacy/check-access
router.post('/wallets/:walletId/privacy/check-access', async (req, res) => {
  try {
    const { walletId } = req.params;
    const { requester_id, is_paid = false } = req.body;
    const privacyService = req.app.get('privacyService');
    
    if (!requester_id) {
      return res.status(400).json({ success: false, error: 'requester_id is required' });
    }
    
    const access = await privacyService.checkDataAccess(walletId, requester_id, is_paid);
    res.json({ success: true, data: access });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/projects/:projectId/privacy/stats
router.get('/projects/:projectId/privacy/stats', async (req, res) => {
  try {
    const { projectId } = req.params;
    const privacyService = req.app.get('privacyService');
    const stats = await privacyService.getProjectPrivacyStats(projectId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// MONETIZATION ROUTES
// =====================================================

// GET /api/marketplace/wallets
router.get('/marketplace/wallets', async (req, res) => {
  try {
    const { minProductivityScore, walletType, limit } = req.query;
    const monetizationService = req.app.get('monetizationService');
    
    const filters = {
      minProductivityScore: minProductivityScore ? parseInt(minProductivityScore) : undefined,
      walletType,
      limit: limit ? parseInt(limit) : 50
    };
    
    const listing = await monetizationService.getMarketplaceListing(filters);
    res.json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/wallets/:walletId/purchase-access
router.post('/wallets/:walletId/purchase-access', async (req, res) => {
  try {
    const { walletId } = req.params;
    const { requester_id, requester_email } = req.body;
    const monetizationService = req.app.get('monetizationService');
    
    if (!requester_id || !requester_email) {
      return res.status(400).json({
        success: false,
        error: 'requester_id and requester_email are required'
      });
    }
    
    const payment = await monetizationService.createDataAccessPayment(
      requester_id,
      walletId,
      requester_email
    );
    
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/payments/:invoiceId/status
router.get('/payments/:invoiceId/status', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const monetizationService = req.app.get('monetizationService');
    const status = await monetizationService.checkPaymentStatus(invoiceId);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/users/:userId/earnings
router.get('/users/:userId/earnings', async (req, res) => {
  try {
    const { userId } = req.params;
    const monetizationService = req.app.get('monetizationService');
    const earnings = await monetizationService.getOwnerEarnings(userId);
    res.json({ success: true, data: earnings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/users/:userId/withdraw
router.post('/users/:userId/withdraw', async (req, res) => {
  try {
    const { userId } = req.params;
    const { to_address, amount_zec } = req.body;
    const monetizationService = req.app.get('monetizationService');
    
    if (!to_address || !amount_zec) {
      return res.status(400).json({
        success: false,
        error: 'to_address and amount_zec are required'
      });
    }
    
    const withdrawal = await monetizationService.requestWithdrawal(userId, to_address, amount_zec);
    res.json({ success: true, data: withdrawal });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =====================================================
// COMPETITIVE BENCHMARKING ROUTES
// =====================================================

// GET /api/benchmarks/:category
router.get('/benchmarks/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const benchmarkService = req.app.get('benchmarkService');
    const benchmarks = await benchmarkService.getBenchmarks(category);
    res.json({ success: true, data: benchmarks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/benchmarks/:category
router.post('/benchmarks/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { metric_type, values } = req.body;
    const benchmarkService = req.app.get('benchmarkService');
    
    if (!metric_type || !values) {
      return res.status(400).json({
        success: false,
        error: 'metric_type and values are required'
      });
    }
    
    const benchmark = await benchmarkService.storeBenchmark(category, metric_type, values);
    res.json({ success: true, data: benchmark });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/projects/:projectId/compare
router.get('/projects/:projectId/compare', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { category } = req.query;
    const comparisonService = req.app.get('projectComparisonService');
    
    const comparison = await comparisonService.compareToMarket(projectId, category);
    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/projects/:projectId/competitive-insights
router.get('/projects/:projectId/competitive-insights', async (req, res) => {
  try {
    const { projectId } = req.params;
    const insightsService = req.app.get('competitiveInsightsService');
    const insights = await insightsService.generateInsights(projectId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// AI RECOMMENDATIONS ROUTES
// =====================================================

// GET /api/projects/:projectId/recommendations
router.get('/projects/:projectId/recommendations', async (req, res) => {
  try {
    const { projectId } = req.params;
    const recommendationService = req.app.get('aiRecommendationService');
    const recommendations = await recommendationService.generateRecommendations(projectId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/projects/:projectId/recommendations/:taskId/complete
router.post('/projects/:projectId/recommendations/:taskId/complete', async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const monitoringService = req.app.get('taskCompletionMonitoringService');
    const result = await monitoringService.markTaskComplete(projectId, taskId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// ALERT ROUTES
// =====================================================

// GET /api/projects/:projectId/alerts
router.get('/projects/:projectId/alerts', async (req, res) => {
  try {
    const { projectId } = req.params;
    const alertService = req.app.get('alertEngineService');
    const alerts = await alertService.checkAllAlerts(projectId);
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/projects/:projectId/alerts/:alertId/content
router.get('/projects/:projectId/alerts/:alertId/content', async (req, res) => {
  try {
    const { alertId } = req.params;
    const alertContentService = req.app.get('aiAlertContentService');
    const content = await alertContentService.generateAlertContent(alertId);
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// SHIELDED ANALYTICS ROUTES
// =====================================================

// GET /api/wallets/:walletId/shielded-analytics
router.get('/wallets/:walletId/shielded-analytics', async (req, res) => {
  try {
    const { walletId } = req.params;
    const shieldedService = req.app.get('shieldedAnalyzerService');
    const analytics = await shieldedService.analyzeWallet(walletId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/projects/:projectId/shielded-comparison
router.get('/projects/:projectId/shielded-comparison', async (req, res) => {
  try {
    const { projectId } = req.params;
    const comparisonService = req.app.get('shieldedComparisonService');
    const comparison = await comparisonService.compareShieldedVsTransparent(projectId);
    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// DASHBOARD AGGREGATION ROUTES
// =====================================================

// GET /api/projects/:projectId/dashboard
router.get('/projects/:projectId/dashboard', async (req, res) => {
  try {
    const { projectId } = req.params;
    const dashboardService = req.app.get('dashboardAggregationService');
    const dashboard = await dashboardService.getProjectDashboard(projectId);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/health/dashboard
router.get('/health/dashboard', async (req, res) => {
  try {
    const { status, risk_level } = req.query;
    const dashboardService = req.app.get('dashboardAggregationService');
    
    const filters = {};
    if (status) filters.status = status;
    if (risk_level) filters.risk_level = risk_level;
    
    const health = await dashboardService.getWalletHealthDashboard(filters);
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/projects/:projectId/timeseries/:metric
router.get('/projects/:projectId/timeseries/:metric', async (req, res) => {
  try {
    const { projectId, metric } = req.params;
    const { days = 30 } = req.query;
    const dashboardService = req.app.get('dashboardAggregationService');
    
    const timeSeries = await dashboardService.getTimeSeriesData(
      projectId,
      metric,
      parseInt(days)
    );
    res.json({ success: true, data: timeSeries });
  } catch (error) {
    res.status(error.message.includes('Unknown metric') ? 400 : 500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/projects/:projectId/export
router.get('/projects/:projectId/export', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { format = 'json' } = req.query;
    const dashboardService = req.app.get('dashboardAggregationService');
    
    const report = await dashboardService.exportAnalyticsReport(projectId, format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${projectId}.csv"`);
      res.send(report.data);
    } else {
      res.json({ success: true, data: report });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/projects/:projectId/cache
router.delete('/projects/:projectId/cache', async (req, res) => {
  try {
    const { projectId } = req.params;
    const dashboardService = req.app.get('dashboardAggregationService');
    dashboardService.clearCache(projectId);
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
