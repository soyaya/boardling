/**
 * Data Integrity Service
 * 
 * Enforces referential integrity, prevents duplicates, and validates data consistency.
 * Implements validation rules for analytics calculations.
 * 
 * Requirements: 9.3
 */

class DataIntegrityService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Validate wallet data before insertion/update
   * @param {Object} walletData - Wallet data to validate
   * @returns {Object} Validation result
   */
  validateWallet(walletData) {
    const errors = [];

    // Required fields
    if (!walletData.address) {
      errors.push('Wallet address is required');
    }

    if (!walletData.type || !['t', 'z', 'u'].includes(walletData.type)) {
      errors.push('Valid wallet type (t, z, u) is required');
    }

    if (!walletData.project_id) {
      errors.push('Project ID is required');
    }

    // Privacy mode validation
    if (walletData.privacy_mode && !['private', 'public', 'monetizable'].includes(walletData.privacy_mode)) {
      errors.push('Privacy mode must be private, public, or monetizable');
    }

    // Address format validation
    if (walletData.address) {
      const addressPattern = /^[a-zA-Z0-9]+$/;
      if (!addressPattern.test(walletData.address)) {
        errors.push('Invalid wallet address format');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate activity metrics before insertion
   * @param {Object} metricsData - Activity metrics to validate
   * @returns {Object} Validation result
   */
  validateActivityMetrics(metricsData) {
    const errors = [];

    // Required fields
    if (!metricsData.wallet_id) {
      errors.push('Wallet ID is required');
    }

    if (!metricsData.activity_date) {
      errors.push('Activity date is required');
    }

    // Numeric validations
    if (metricsData.transaction_count !== undefined && metricsData.transaction_count < 0) {
      errors.push('Transaction count cannot be negative');
    }

    if (metricsData.total_volume_zatoshi !== undefined && metricsData.total_volume_zatoshi < 0) {
      errors.push('Total volume cannot be negative');
    }

    if (metricsData.total_fees_paid !== undefined && metricsData.total_fees_paid < 0) {
      errors.push('Total fees cannot be negative');
    }

    // Logical validations
    const totalTxTypes = (metricsData.transfers_count || 0) + 
                        (metricsData.swaps_count || 0) + 
                        (metricsData.bridges_count || 0) + 
                        (metricsData.shielded_count || 0);
    
    if (metricsData.transaction_count && totalTxTypes > metricsData.transaction_count) {
      errors.push('Sum of transaction types cannot exceed total transaction count');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate productivity score before insertion/update
   * @param {Object} scoreData - Productivity score data to validate
   * @returns {Object} Validation result
   */
  validateProductivityScore(scoreData) {
    const errors = [];

    // Required fields
    if (!scoreData.wallet_id) {
      errors.push('Wallet ID is required');
    }

    // Score range validations (0-100)
    const scoreFields = [
      'total_score',
      'retention_score',
      'adoption_score',
      'activity_score',
      'diversity_score'
    ];

    scoreFields.forEach(field => {
      if (scoreData[field] !== undefined) {
        const score = scoreData[field];
        if (score < 0 || score > 100) {
          errors.push(`${field} must be between 0 and 100`);
        }
      }
    });

    // Status validation
    if (scoreData.status && !['healthy', 'at_risk', 'churn'].includes(scoreData.status)) {
      errors.push('Status must be healthy, at_risk, or churn');
    }

    // Risk level validation
    if (scoreData.risk_level && !['low', 'medium', 'high'].includes(scoreData.risk_level)) {
      errors.push('Risk level must be low, medium, or high');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for duplicate wallet entries
   * @param {string} address - Wallet address
   * @param {string} network - Network (mainnet/testnet)
   * @returns {Promise<boolean>} True if duplicate exists
   */
  async checkDuplicateWallet(address, network) {
    const result = await this.db.query(
      `SELECT id FROM wallets WHERE address = $1 AND network = $2 LIMIT 1`,
      [address, network]
    );
    return result.rows.length > 0;
  }

  /**
   * Check for duplicate activity metrics
   * @param {string} walletId - Wallet ID
   * @param {string} activityDate - Activity date
   * @returns {Promise<boolean>} True if duplicate exists
   */
  async checkDuplicateActivityMetrics(walletId, activityDate) {
    const result = await this.db.query(
      `SELECT id FROM wallet_activity_metrics 
       WHERE wallet_id = $1 AND activity_date = $2 LIMIT 1`,
      [walletId, activityDate]
    );
    return result.rows.length > 0;
  }

  /**
   * Verify referential integrity for wallet
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} Integrity check result
   */
  async verifyWalletIntegrity(walletId) {
    const issues = [];

    // Check if wallet exists
    const walletResult = await this.db.query(
      `SELECT id, project_id FROM wallets WHERE id = $1`,
      [walletId]
    );

    if (walletResult.rows.length === 0) {
      return {
        valid: false,
        issues: ['Wallet does not exist']
      };
    }

    const wallet = walletResult.rows[0];

    // Check if project exists
    const projectResult = await this.db.query(
      `SELECT id FROM projects WHERE id = $1`,
      [wallet.project_id]
    );

    if (projectResult.rows.length === 0) {
      issues.push('Referenced project does not exist');
    }

    // Check for orphaned activity metrics
    const orphanedMetrics = await this.db.query(
      `SELECT COUNT(*) as count FROM wallet_activity_metrics 
       WHERE wallet_id = $1 AND wallet_id NOT IN (SELECT id FROM wallets)`,
      [walletId]
    );

    if (parseInt(orphanedMetrics.rows[0].count) > 0) {
      issues.push('Orphaned activity metrics found');
    }

    // Check for orphaned productivity scores
    const orphanedScores = await this.db.query(
      `SELECT COUNT(*) as count FROM wallet_productivity_scores 
       WHERE wallet_id = $1 AND wallet_id NOT IN (SELECT id FROM wallets)`,
      [walletId]
    );

    if (parseInt(orphanedScores.rows[0].count) > 0) {
      issues.push('Orphaned productivity scores found');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Verify data consistency across related tables
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Consistency check result
   */
  async verifyProjectDataConsistency(projectId) {
    const issues = [];

    // Check wallet count consistency
    const walletCount = await this.db.query(
      `SELECT COUNT(*) as count FROM wallets WHERE project_id = $1`,
      [projectId]
    );

    const metricsWalletCount = await this.db.query(
      `SELECT COUNT(DISTINCT wallet_id) as count 
       FROM wallet_activity_metrics wam
       JOIN wallets w ON wam.wallet_id = w.id
       WHERE w.project_id = $1`,
      [projectId]
    );

    const totalWallets = parseInt(walletCount.rows[0].count);
    const walletsWithMetrics = parseInt(metricsWalletCount.rows[0].count);

    if (walletsWithMetrics > totalWallets) {
      issues.push('More wallets with metrics than total wallets');
    }

    // Check for negative values in metrics
    const negativeMetrics = await this.db.query(
      `SELECT COUNT(*) as count FROM wallet_activity_metrics wam
       JOIN wallets w ON wam.wallet_id = w.id
       WHERE w.project_id = $1 
       AND (wam.transaction_count < 0 
            OR wam.total_volume_zatoshi < 0 
            OR wam.total_fees_paid < 0)`,
      [projectId]
    );

    if (parseInt(negativeMetrics.rows[0].count) > 0) {
      issues.push('Negative values found in activity metrics');
    }

    // Check for invalid productivity scores
    const invalidScores = await this.db.query(
      `SELECT COUNT(*) as count FROM wallet_productivity_scores wps
       JOIN wallets w ON wps.wallet_id = w.id
       WHERE w.project_id = $1 
       AND (wps.total_score < 0 OR wps.total_score > 100
            OR wps.retention_score < 0 OR wps.retention_score > 100
            OR wps.adoption_score < 0 OR wps.adoption_score > 100)`,
      [projectId]
    );

    if (parseInt(invalidScores.rows[0].count) > 0) {
      issues.push('Invalid productivity scores found (outside 0-100 range)');
    }

    return {
      valid: issues.length === 0,
      issues,
      stats: {
        total_wallets: totalWallets,
        wallets_with_metrics: walletsWithMetrics
      }
    };
  }

  /**
   * Clean up orphaned records
   * @param {string} projectId - Project ID (optional, cleans all if not provided)
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOrphanedRecords(projectId = null) {
    const cleaned = {
      activity_metrics: 0,
      productivity_scores: 0,
      cohort_assignments: 0,
      adoption_stages: 0
    };

    // Clean orphaned activity metrics
    const metricsResult = await this.db.query(
      `DELETE FROM wallet_activity_metrics 
       WHERE wallet_id NOT IN (SELECT id FROM wallets)
       ${projectId ? 'AND wallet_id IN (SELECT id FROM wallets WHERE project_id = $1)' : ''}
       RETURNING id`,
      projectId ? [projectId] : []
    );
    cleaned.activity_metrics = metricsResult.rows.length;

    // Clean orphaned productivity scores
    const scoresResult = await this.db.query(
      `DELETE FROM wallet_productivity_scores 
       WHERE wallet_id NOT IN (SELECT id FROM wallets)
       ${projectId ? 'AND wallet_id IN (SELECT id FROM wallets WHERE project_id = $1)' : ''}
       RETURNING id`,
      projectId ? [projectId] : []
    );
    cleaned.productivity_scores = scoresResult.rows.length;

    // Clean orphaned cohort assignments
    const cohortResult = await this.db.query(
      `DELETE FROM wallet_cohort_assignments 
       WHERE wallet_id NOT IN (SELECT id FROM wallets)
       ${projectId ? 'AND wallet_id IN (SELECT id FROM wallets WHERE project_id = $1)' : ''}
       RETURNING id`,
      projectId ? [projectId] : []
    );
    cleaned.cohort_assignments = cohortResult.rows.length;

    // Clean orphaned adoption stages
    const adoptionResult = await this.db.query(
      `DELETE FROM wallet_adoption_stages 
       WHERE wallet_id NOT IN (SELECT id FROM wallets)
       ${projectId ? 'AND wallet_id IN (SELECT id FROM wallets WHERE project_id = $1)' : ''}
       RETURNING id`,
      projectId ? [projectId] : []
    );
    cleaned.adoption_stages = adoptionResult.rows.length;

    return {
      success: true,
      cleaned
    };
  }

  /**
   * Run comprehensive data integrity check
   * @param {string} projectId - Project ID (optional)
   * @returns {Promise<Object>} Comprehensive integrity report
   */
  async runIntegrityCheck(projectId = null) {
    const report = {
      timestamp: new Date().toISOString(),
      project_id: projectId,
      checks: []
    };

    // Check 1: Referential integrity
    report.checks.push({
      name: 'Referential Integrity',
      status: 'checking'
    });

    try {
      const consistency = await this.verifyProjectDataConsistency(projectId || 'all');
      report.checks[0].status = consistency.valid ? 'passed' : 'failed';
      report.checks[0].issues = consistency.issues;
      report.checks[0].stats = consistency.stats;
    } catch (error) {
      report.checks[0].status = 'error';
      report.checks[0].error = error.message;
    }

    // Check 2: Duplicate detection
    report.checks.push({
      name: 'Duplicate Detection',
      status: 'checking'
    });

    try {
      const duplicates = await this.findDuplicates(projectId);
      report.checks[1].status = duplicates.found ? 'failed' : 'passed';
      report.checks[1].duplicates = duplicates;
    } catch (error) {
      report.checks[1].status = 'error';
      report.checks[1].error = error.message;
    }

    // Overall status
    report.overall_status = report.checks.every(c => c.status === 'passed') ? 'passed' : 'failed';

    return report;
  }

  /**
   * Find duplicate records
   * @private
   */
  async findDuplicates(projectId) {
    const duplicates = {
      found: false,
      wallets: [],
      activity_metrics: []
    };

    // Find duplicate wallets (same address and network)
    const walletDupes = await this.db.query(
      `SELECT address, network, COUNT(*) as count
       FROM wallets
       ${projectId ? 'WHERE project_id = $1' : ''}
       GROUP BY address, network
       HAVING COUNT(*) > 1`,
      projectId ? [projectId] : []
    );

    if (walletDupes.rows.length > 0) {
      duplicates.found = true;
      duplicates.wallets = walletDupes.rows;
    }

    // Find duplicate activity metrics (same wallet and date)
    const metricsDupes = await this.db.query(
      `SELECT wallet_id, activity_date, COUNT(*) as count
       FROM wallet_activity_metrics wam
       ${projectId ? 'JOIN wallets w ON wam.wallet_id = w.id WHERE w.project_id = $1' : ''}
       GROUP BY wallet_id, activity_date
       HAVING COUNT(*) > 1`,
      projectId ? [projectId] : []
    );

    if (metricsDupes.rows.length > 0) {
      duplicates.found = true;
      duplicates.activity_metrics = metricsDupes.rows;
    }

    return duplicates;
  }
}

export default DataIntegrityService;
