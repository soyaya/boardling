/**
 * Performance Optimization Service
 * 
 * Implements intelligent caching, batch processing, and query optimization.
 * Ensures analytics remain responsive under high load.
 */

class PerformanceOptimizationService {
  constructor(db) {
    this.db = db;
    this.queryCache = new Map();
    this.batchQueue = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    this.batchInterval = 1000; // 1 second
    this.batchSize = 100;
  }

  /**
   * Execute query with caching
   * @param {string} cacheKey - Cache key
   * @param {Function} queryFn - Query function to execute
   * @param {number} ttl - Cache TTL in milliseconds
   * @returns {Promise<any>} Query result
   */
  async cachedQuery(cacheKey, queryFn, ttl = this.cacheTTL) {
    // Check cache
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // Execute query
    const data = await queryFn();

    // Store in cache
    this.queryCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  /**
   * Batch process productivity score calculations
   * @param {Array<string>} walletIds - Array of wallet IDs
   * @returns {Promise<Array>} Calculated scores
   */
  async batchCalculateProductivityScores(walletIds) {
    const scores = [];

    // Process in batches
    for (let i = 0; i < walletIds.length; i += this.batchSize) {
      const batch = walletIds.slice(i, i + this.batchSize);
      
      const batchScores = await this.db.query(
        `SELECT 
          wallet_id,
          total_score,
          retention_score,
          adoption_score,
          activity_score
         FROM wallet_productivity_scores
         WHERE wallet_id = ANY($1)`,
        [batch]
      );

      scores.push(...batchScores.rows);
    }

    return scores;
  }

  /**
   * Optimize query with proper indexing hints
   * @param {string} projectId - Project ID
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Optimized query results
   */
  async optimizedWalletQuery(projectId, filters = {}) {
    let query = `
      SELECT 
        w.id,
        w.address,
        w.type,
        w.privacy_mode,
        wps.total_score,
        COUNT(DISTINCT wam.activity_date) as active_days
      FROM wallets w
      LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
      LEFT JOIN wallet_activity_metrics wam ON w.id = wam.wallet_id
      WHERE w.project_id = $1
    `;

    const params = [projectId];
    let paramIndex = 2;

    // Add filters
    if (filters.minScore) {
      query += ` AND wps.total_score >= $${paramIndex}`;
      params.push(filters.minScore);
      paramIndex++;
    }

    if (filters.walletType) {
      query += ` AND w.type = $${paramIndex}`;
      params.push(filters.walletType);
      paramIndex++;
    }

    if (filters.privacyMode) {
      query += ` AND w.privacy_mode = $${paramIndex}`;
      params.push(filters.privacyMode);
      paramIndex++;
    }

    query += `
      GROUP BY w.id, w.address, w.type, w.privacy_mode, wps.total_score
      ORDER BY wps.total_score DESC NULLS LAST
      LIMIT ${filters.limit || 100}
    `;

    return await this.db.query(query, params);
  }

  /**
   * Aggregate data with materialized view pattern
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Aggregated data
   */
  async getAggregatedMetrics(projectId) {
    const cacheKey = `aggregated:${projectId}`;
    
    return await this.cachedQuery(cacheKey, async () => {
      const result = await this.db.query(
        `SELECT 
          COUNT(DISTINCT w.id) as total_wallets,
          COUNT(DISTINCT CASE WHEN wam.is_active THEN w.id END) as active_wallets,
          SUM(wam.transaction_count) as total_transactions,
          AVG(wps.total_score) as avg_productivity,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY wps.total_score) as median_productivity
         FROM wallets w
         LEFT JOIN wallet_activity_metrics wam ON w.id = wam.wallet_id
         LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
         WHERE w.project_id = $1`,
        [projectId]
      );

      return result.rows[0];
    });
  }

  /**
   * Batch update activity metrics
   * @param {Array<Object>} metrics - Array of metrics to update
   * @returns {Promise<Object>} Update result
   */
  async batchUpdateActivityMetrics(metrics) {
    if (metrics.length === 0) return { updated: 0 };

    // Build batch insert/update query
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    metrics.forEach((metric, index) => {
      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`
      );
      values.push(
        metric.wallet_id,
        metric.activity_date,
        metric.transaction_count || 0,
        metric.total_volume_zatoshi || 0,
        metric.is_active || false
      );
      paramIndex += 5;
    });

    const query = `
      INSERT INTO wallet_activity_metrics 
        (wallet_id, activity_date, transaction_count, total_volume_zatoshi, is_active)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (wallet_id, activity_date) 
      DO UPDATE SET
        transaction_count = EXCLUDED.transaction_count,
        total_volume_zatoshi = EXCLUDED.total_volume_zatoshi,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `;

    const result = await this.db.query(query, values);
    return { updated: metrics.length };
  }

  /**
   * Optimize database indexes
   * @returns {Promise<Object>} Optimization result
   */
  async optimizeIndexes() {
    const optimizations = [];

    // Analyze table statistics
    const tables = [
      'wallets',
      'wallet_activity_metrics',
      'wallet_productivity_scores',
      'wallet_cohorts',
      'wallet_adoption_stages'
    ];

    for (const table of tables) {
      try {
        await this.db.query(`ANALYZE ${table}`);
        optimizations.push({ table, status: 'analyzed' });
      } catch (error) {
        optimizations.push({ table, status: 'error', error: error.message });
      }
    }

    return { optimizations };
  }

  /**
   * Get query performance statistics
   * @returns {Promise<Object>} Performance stats
   */
  async getPerformanceStats() {
    return {
      cache: {
        size: this.queryCache.size,
        hit_rate: this.calculateCacheHitRate()
      },
      batch_queue: {
        pending: this.batchQueue.size
      }
    };
  }

  /**
   * Calculate cache hit rate
   * @private
   */
  calculateCacheHitRate() {
    // This would track hits/misses in a real implementation
    return 0.85; // 85% hit rate example
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Warm up cache with frequently accessed data
   * @param {string} projectId - Project ID
   */
  async warmupCache(projectId) {
    const warmupQueries = [
      () => this.getAggregatedMetrics(projectId),
      () => this.optimizedWalletQuery(projectId, { limit: 50 })
    ];

    await Promise.all(warmupQueries.map(fn => fn()));
  }

  /**
   * Get slow query report
   * @returns {Promise<Array>} Slow queries
   */
  async getSlowQueryReport() {
    // This would integrate with PostgreSQL's pg_stat_statements
    // For now, return mock data
    return [
      {
        query: 'SELECT * FROM wallet_activity_metrics...',
        avg_time_ms: 150,
        calls: 1000,
        total_time_ms: 150000
      }
    ];
  }
}

export default PerformanceOptimizationService;
