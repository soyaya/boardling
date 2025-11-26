/**
 * Dashboard Data Aggregation Service
 * 
 * Aggregates data from multiple analytics services for dashboard widgets.
 * Implements caching for frequently accessed analytics.
 * Provides export functionality for analytics reports.
 */

class DashboardAggregationService {
  constructor(db, services = {}) {
    this.db = db;
    this.services = services;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes default TTL
  }

  /**
   * Get comprehensive project dashboard data
   * @param {string} projectId - UUID of the project
   * @returns {Promise<Object>} Aggregated dashboard data
   */
  async getProjectDashboard(projectId) {
    const cacheKey = `dashboard:${projectId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const [
      overview,
      productivity,
      cohorts,
      adoption,
      alerts,
      recommendations
    ] = await Promise.all([
      this.getProjectOverview(projectId),
      this.getProductivitySummary(projectId),
      this.getCohortSummary(projectId),
      this.getAdoptionFunnelSummary(projectId),
      this.getActiveAlerts(projectId),
      this.getTopRecommendations(projectId)
    ]);

    const dashboard = {
      overview,
      productivity,
      cohorts,
      adoption,
      alerts,
      recommendations,
      generated_at: new Date().toISOString()
    };

    this.setCache(cacheKey, dashboard);
    return dashboard;
  }

  /**
   * Get project overview metrics
   * @private
   */
  async getProjectOverview(projectId) {
    const result = await this.db.query(
      `SELECT 
        COUNT(DISTINCT w.id) as total_wallets,
        COUNT(DISTINCT CASE WHEN wam.is_active THEN w.id END) as active_wallets,
        SUM(wam.transaction_count) as total_transactions,
        SUM(wam.total_volume_zatoshi) as total_volume,
        AVG(wps.total_score) as avg_productivity_score
       FROM wallets w
       LEFT JOIN wallet_activity_metrics wam ON w.id = wam.wallet_id
       LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
       WHERE w.project_id = $1`,
      [projectId]
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
   * Get productivity summary
   * @private
   */
  async getProductivitySummary(projectId) {
    const result = await this.db.query(
      `SELECT 
        AVG(total_score) as avg_total,
        AVG(retention_score) as avg_retention,
        AVG(adoption_score) as avg_adoption,
        AVG(activity_score) as avg_activity,
        COUNT(CASE WHEN status = 'at_risk' THEN 1 END) as at_risk_count,
        COUNT(CASE WHEN status = 'churn' THEN 1 END) as churn_count
       FROM wallet_productivity_scores wps
       JOIN wallets w ON wps.wallet_id = w.id
       WHERE w.project_id = $1`,
      [projectId]
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

  /**
   * Get cohort summary
   * @private
   */
  async getCohortSummary(projectId) {
    const result = await this.db.query(
      `SELECT 
        cohort_type,
        COUNT(*) as cohort_count,
        AVG(retention_week_1) as avg_week_1,
        AVG(retention_week_2) as avg_week_2,
        AVG(retention_week_4) as avg_week_4
       FROM wallet_cohorts wc
       WHERE EXISTS (
         SELECT 1 FROM wallet_cohort_assignments wca
         JOIN wallets w ON wca.wallet_id = w.id
         WHERE wca.cohort_id = wc.id AND w.project_id = $1
       )
       GROUP BY cohort_type`,
      [projectId]
    );

    return result.rows.map(row => ({
      cohort_type: row.cohort_type,
      cohort_count: parseInt(row.cohort_count) || 0,
      avg_retention_week_1: parseFloat(row.avg_week_1) || 0,
      avg_retention_week_2: parseFloat(row.avg_week_2) || 0,
      avg_retention_week_4: parseFloat(row.avg_week_4) || 0
    }));
  }

  /**
   * Get adoption funnel summary
   * @private
   */
  async getAdoptionFunnelSummary(projectId) {
    const result = await this.db.query(
      `SELECT 
        stage_name,
        COUNT(*) as wallet_count,
        AVG(time_to_achieve_hours) as avg_time_hours
       FROM wallet_adoption_stages was
       JOIN wallets w ON was.wallet_id = w.id
       WHERE w.project_id = $1 AND was.achieved_at IS NOT NULL
       GROUP BY stage_name
       ORDER BY 
         CASE stage_name
           WHEN 'created' THEN 1
           WHEN 'first_tx' THEN 2
           WHEN 'feature_usage' THEN 3
           WHEN 'recurring' THEN 4
           WHEN 'high_value' THEN 5
         END`,
      [projectId]
    );

    return result.rows.map(row => ({
      stage: row.stage_name,
      wallet_count: parseInt(row.wallet_count) || 0,
      avg_time_hours: parseFloat(row.avg_time_hours) || 0
    }));
  }

  /**
   * Get active alerts
   * @private
   */
  async getActiveAlerts(projectId) {
    // This would integrate with the alert service
    if (this.services.alertEngine) {
      try {
        return await this.services.alertEngine.checkAllAlerts(projectId);
      } catch (error) {
        return [];
      }
    }
    return [];
  }

  /**
   * Get top recommendations
   * @private
   */
  async getTopRecommendations(projectId) {
    // This would integrate with the recommendation service
    if (this.services.aiRecommendation) {
      try {
        const recs = await this.services.aiRecommendation.generateRecommendations(projectId);
        return recs.slice(0, 5); // Top 5
      } catch (error) {
        return [];
      }
    }
    return [];
  }

  /**
   * Get wallet health dashboard (cross-project)
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Health dashboard data
   */
  async getWalletHealthDashboard(filters = {}) {
    const cacheKey = `health:${JSON.stringify(filters)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const result = await this.db.query(
      `SELECT 
        wps.status,
        wps.risk_level,
        COUNT(*) as wallet_count,
        AVG(wps.total_score) as avg_score
       FROM wallet_productivity_scores wps
       JOIN wallets w ON wps.wallet_id = w.id
       GROUP BY wps.status, wps.risk_level
       ORDER BY wps.status, wps.risk_level`
    );

    const health = {
      by_status: {},
      by_risk_level: {},
      total_wallets: 0
    };

    result.rows.forEach(row => {
      const count = parseInt(row.wallet_count);
      health.total_wallets += count;
      
      if (!health.by_status[row.status]) {
        health.by_status[row.status] = { count: 0, avg_score: 0 };
      }
      health.by_status[row.status].count += count;
      health.by_status[row.status].avg_score = parseFloat(row.avg_score) || 0;

      if (!health.by_risk_level[row.risk_level]) {
        health.by_risk_level[row.risk_level] = { count: 0, avg_score: 0 };
      }
      health.by_risk_level[row.risk_level].count += count;
      health.by_risk_level[row.risk_level].avg_score = parseFloat(row.avg_score) || 0;
    });

    this.setCache(cacheKey, health);
    return health;
  }

  /**
   * Export analytics report
   * @param {string} projectId - UUID of the project
   * @param {string} format - Export format ('json', 'csv')
   * @returns {Promise<Object>} Export data
   */
  async exportAnalyticsReport(projectId, format = 'json') {
    const dashboard = await this.getProjectDashboard(projectId);
    
    if (format === 'csv') {
      return this.convertToCSV(dashboard);
    }
    
    return {
      format: 'json',
      data: dashboard,
      exported_at: new Date().toISOString()
    };
  }

  /**
   * Convert dashboard data to CSV format
   * @private
   */
  convertToCSV(dashboard) {
    const lines = [];
    
    // Overview section
    lines.push('OVERVIEW');
    lines.push('Metric,Value');
    lines.push(`Total Wallets,${dashboard.overview.total_wallets}`);
    lines.push(`Active Wallets,${dashboard.overview.active_wallets}`);
    lines.push(`Total Transactions,${dashboard.overview.total_transactions}`);
    lines.push(`Avg Productivity Score,${dashboard.overview.avg_productivity_score.toFixed(2)}`);
    lines.push('');

    // Productivity section
    lines.push('PRODUCTIVITY');
    lines.push('Metric,Value');
    lines.push(`Avg Total Score,${dashboard.productivity.avg_total_score.toFixed(2)}`);
    lines.push(`Avg Retention Score,${dashboard.productivity.avg_retention_score.toFixed(2)}`);
    lines.push(`At Risk Wallets,${dashboard.productivity.at_risk_wallets}`);
    lines.push(`Churn Wallets,${dashboard.productivity.churn_wallets}`);
    lines.push('');

    // Adoption funnel
    lines.push('ADOPTION FUNNEL');
    lines.push('Stage,Wallet Count,Avg Time (hours)');
    dashboard.adoption.forEach(stage => {
      lines.push(`${stage.stage},${stage.wallet_count},${stage.avg_time_hours.toFixed(2)}`);
    });

    return {
      format: 'csv',
      data: lines.join('\n'),
      exported_at: new Date().toISOString()
    };
  }

  /**
   * Get time-series data for charts
   * @param {string} projectId - UUID of the project
   * @param {string} metric - Metric to retrieve
   * @param {number} days - Number of days to retrieve
   * @returns {Promise<Array>} Time-series data
   */
  async getTimeSeriesData(projectId, metric, days = 30) {
    const cacheKey = `timeseries:${projectId}:${metric}:${days}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    let query;
    switch (metric) {
      case 'active_wallets':
        query = `
          SELECT 
            activity_date as date,
            COUNT(DISTINCT wallet_id) as value
          FROM wallet_activity_metrics wam
          JOIN wallets w ON wam.wallet_id = w.id
          WHERE w.project_id = $1 
            AND wam.is_active = true
            AND activity_date >= CURRENT_DATE - INTERVAL '${days} days'
          GROUP BY activity_date
          ORDER BY activity_date
        `;
        break;

      case 'transactions':
        query = `
          SELECT 
            activity_date as date,
            SUM(transaction_count) as value
          FROM wallet_activity_metrics wam
          JOIN wallets w ON wam.wallet_id = w.id
          WHERE w.project_id = $1 
            AND activity_date >= CURRENT_DATE - INTERVAL '${days} days'
          GROUP BY activity_date
          ORDER BY activity_date
        `;
        break;

      case 'productivity':
        query = `
          SELECT 
            DATE(wps.calculated_at) as date,
            AVG(wps.total_score) as value
          FROM wallet_productivity_scores wps
          JOIN wallets w ON wps.wallet_id = w.id
          WHERE w.project_id = $1 
            AND wps.calculated_at >= CURRENT_DATE - INTERVAL '${days} days'
          GROUP BY DATE(wps.calculated_at)
          ORDER BY DATE(wps.calculated_at)
        `;
        break;

      default:
        throw new Error(`Unknown metric: ${metric}`);
    }

    const result = await this.db.query(query, [projectId]);
    
    const timeSeries = result.rows.map(row => ({
      date: row.date,
      value: parseFloat(row.value) || 0
    }));

    this.setCache(cacheKey, timeSeries);
    return timeSeries;
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(pattern) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

export default DashboardAggregationService;
