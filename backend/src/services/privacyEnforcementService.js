/**
 * Privacy Enforcement Service
 * 
 * Comprehensive privacy enforcement for wallet analytics data.
 * Implements immediate privacy mode updates, data anonymization,
 * and monetizable data access control.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 * 
 * Privacy Modes:
 * - private: Data excluded from all public queries and comparisons
 * - public: Anonymized data included in aggregate statistics
 * - monetizable: Data available for purchase by other users
 */

import pool from '../db/db.js';

class PrivacyEnforcementService {
  constructor(db = pool) {
    this.db = db;
  }

  /**
   * Check privacy mode for a wallet
   * Requirement 8.1: Private mode data exclusion
   * 
   * @param {string} walletId - UUID of the wallet
   * @returns {Promise<string>} Privacy mode ('private', 'public', 'monetizable')
   */
  async checkPrivacyMode(walletId) {
    const result = await this.db.query(
      'SELECT privacy_mode FROM wallets WHERE id = $1',
      [walletId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    return result.rows[0].privacy_mode;
  }

  /**
   * Filter wallet IDs based on privacy mode
   * Requirement 8.1: Exclude private wallets from queries
   * 
   * @param {Array<string>} walletIds - Array of wallet UUIDs
   * @param {Array<string>} allowedModes - Privacy modes to include
   * @returns {Promise<Array<string>>} Filtered wallet IDs
   */
  async filterWalletsByPrivacy(walletIds, allowedModes = ['public', 'monetizable']) {
    if (!walletIds || walletIds.length === 0) {
      return [];
    }

    const result = await this.db.query(
      `SELECT id FROM wallets 
       WHERE id = ANY($1) AND privacy_mode = ANY($2)`,
      [walletIds, allowedModes]
    );

    return result.rows.map(row => row.id);
  }

  /**
   * Get wallets by privacy mode for a project
   * 
   * @param {string} projectId - UUID of the project
   * @param {string} privacyMode - Privacy mode to filter by
   * @returns {Promise<Array>} Wallets with specified privacy mode
   */
  async getWalletsByPrivacyMode(projectId, privacyMode) {
    const result = await this.db.query(
      `SELECT id, address, type, privacy_mode, created_at, updated_at
       FROM wallets
       WHERE project_id = $1 AND privacy_mode = $2`,
      [projectId, privacyMode]
    );

    return result.rows;
  }

  /**
   * Anonymize wallet data for public mode
   * Requirement 8.2: Public mode anonymization
   * 
   * @param {Object} walletData - Raw wallet data
   * @returns {Object} Anonymized wallet data
   */
  anonymizeWalletData(walletData) {
    // Remove identifying information
    const anonymized = { ...walletData };
    
    // Remove wallet ID and address
    delete anonymized.id;
    delete anonymized.wallet_id;
    delete anonymized.address;
    delete anonymized.project_id;
    delete anonymized.user_id;
    
    // Keep only aggregated metrics
    return {
      wallet_type: anonymized.type || anonymized.wallet_type,
      metrics: {
        active_days: anonymized.active_days || 0,
        transaction_count: anonymized.transaction_count || 0,
        total_volume: anonymized.total_volume || 0,
        avg_productivity_score: anonymized.avg_productivity_score || 0,
        retention_score: anonymized.retention_score || 0,
        adoption_score: anonymized.adoption_score || 0
      },
      anonymized: true,
      note: 'Data is anonymized for privacy protection'
    };
  }

  /**
   * Anonymize multiple wallet records
   * 
   * @param {Array<Object>} walletDataArray - Array of wallet data
   * @returns {Array<Object>} Array of anonymized wallet data
   */
  anonymizeWalletDataBatch(walletDataArray) {
    return walletDataArray.map(data => this.anonymizeWalletData(data));
  }

  /**
   * Check if user can access monetizable data
   * Requirement 8.3: Monetizable data access control
   * 
   * @param {string} walletId - UUID of the wallet
   * @param {string} requesterId - UUID of the requesting user
   * @returns {Promise<Object>} Access decision
   */
  async checkMonetizableAccess(walletId, requesterId) {
    // Get wallet owner and privacy mode
    const walletResult = await this.db.query(
      `SELECT w.id, w.privacy_mode, w.project_id, p.user_id as owner_id
       FROM wallets w
       JOIN projects p ON w.project_id = p.id
       WHERE w.id = $1`,
      [walletId]
    );

    if (walletResult.rows.length === 0) {
      return {
        allowed: false,
        reason: 'Wallet not found',
        requiresPayment: false
      };
    }

    const wallet = walletResult.rows[0];

    // Owner always has access
    if (wallet.owner_id === requesterId) {
      return {
        allowed: true,
        reason: 'Owner access',
        requiresPayment: false,
        dataLevel: 'full'
      };
    }

    // Check privacy mode
    if (wallet.privacy_mode === 'private') {
      return {
        allowed: false,
        reason: 'Wallet is private',
        requiresPayment: false
      };
    }

    if (wallet.privacy_mode === 'public') {
      return {
        allowed: true,
        reason: 'Wallet is public',
        requiresPayment: false,
        dataLevel: 'anonymized'
      };
    }

    if (wallet.privacy_mode === 'monetizable') {
      // Check if user has paid for access
      const hasPaid = await this.checkPaidAccess(walletId, requesterId);
      
      if (hasPaid) {
        return {
          allowed: true,
          reason: 'Paid access granted',
          requiresPayment: false,
          dataLevel: 'anonymized'
        };
      } else {
        return {
          allowed: false,
          reason: 'Payment required for monetizable data',
          requiresPayment: true,
          dataLevel: null
        };
      }
    }

    return {
      allowed: false,
      reason: 'Unknown privacy mode',
      requiresPayment: false
    };
  }

  /**
   * Check if user has paid for access to monetizable data
   * 
   * @param {string} walletId - UUID of the wallet
   * @param {string} requesterId - UUID of the requesting user
   * @returns {Promise<boolean>} True if user has paid for access
   */
  async checkPaidAccess(walletId, requesterId) {
    // Check if there's a paid invoice for data access
    const result = await this.db.query(
      `SELECT id FROM invoices
       WHERE user_id = $1 
       AND type = 'data_access'
       AND item_id = $2
       AND status = 'paid'
       AND (expires_at IS NULL OR expires_at > NOW())
       LIMIT 1`,
      [requesterId, walletId]
    );

    return result.rows.length > 0;
  }

  /**
   * Update privacy mode with immediate enforcement
   * Requirement 8.4: Immediate privacy mode updates
   * 
   * @param {string} walletId - UUID of the wallet
   * @param {string} newPrivacyMode - New privacy mode
   * @param {string} userId - UUID of the user making the change
   * @returns {Promise<Object>} Updated wallet
   */
  async updatePrivacyMode(walletId, newPrivacyMode, userId) {
    // Validate privacy mode
    const validModes = ['private', 'public', 'monetizable'];
    if (!validModes.includes(newPrivacyMode)) {
      throw new Error(`Invalid privacy mode. Must be one of: ${validModes.join(', ')}`);
    }

    // Verify user owns the wallet
    const ownerCheck = await this.db.query(
      `SELECT w.id FROM wallets w
       JOIN projects p ON w.project_id = p.id
       WHERE w.id = $1 AND p.user_id = $2`,
      [walletId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      throw new Error('Wallet not found or access denied');
    }

    // Update privacy mode immediately
    const result = await this.db.query(
      `UPDATE wallets 
       SET privacy_mode = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, address, type, privacy_mode, project_id, created_at, updated_at`,
      [newPrivacyMode, walletId]
    );

    // Log the privacy change for audit
    await this.logPrivacyChange(walletId, newPrivacyMode, userId);

    // Clear any cached data for this wallet (if caching is implemented)
    await this.clearWalletCache(walletId);

    return result.rows[0];
  }

  /**
   * Batch update privacy mode for multiple wallets
   * 
   * @param {Array<string>} walletIds - Array of wallet UUIDs
   * @param {string} newPrivacyMode - New privacy mode
   * @param {string} userId - UUID of the user making the change
   * @returns {Promise<Array>} Updated wallets
   */
  async batchUpdatePrivacyMode(walletIds, newPrivacyMode, userId) {
    // Validate privacy mode
    const validModes = ['private', 'public', 'monetizable'];
    if (!validModes.includes(newPrivacyMode)) {
      throw new Error(`Invalid privacy mode. Must be one of: ${validModes.join(', ')}`);
    }

    // Verify user owns all wallets
    const ownerCheck = await this.db.query(
      `SELECT w.id FROM wallets w
       JOIN projects p ON w.project_id = p.id
       WHERE w.id = ANY($1) AND p.user_id = $2`,
      [walletIds, userId]
    );

    if (ownerCheck.rows.length !== walletIds.length) {
      throw new Error('Some wallets not found or access denied');
    }

    // Update all wallets
    const result = await this.db.query(
      `UPDATE wallets 
       SET privacy_mode = $1, updated_at = NOW()
       WHERE id = ANY($2)
       RETURNING id, address, type, privacy_mode, project_id, created_at, updated_at`,
      [newPrivacyMode, walletIds]
    );

    // Log privacy changes
    for (const walletId of walletIds) {
      await this.logPrivacyChange(walletId, newPrivacyMode, userId);
      await this.clearWalletCache(walletId);
    }

    return result.rows;
  }

  /**
   * Apply privacy filters to analytics query
   * 
   * @param {string} baseQuery - Base SQL query
   * @param {string} requesterId - UUID of the requesting user
   * @param {boolean} includePrivate - Whether to include private wallets (owner only)
   * @returns {Object} Modified query and parameters
   */
  applyPrivacyFilters(baseQuery, requesterId, includePrivate = false) {
    let privacyFilter = '';
    const params = [requesterId];

    if (includePrivate) {
      // Include all wallets owned by the requester
      privacyFilter = `
        AND (
          p.user_id = $1
          OR w.privacy_mode IN ('public', 'monetizable')
        )
      `;
    } else {
      // Only include public and monetizable wallets
      privacyFilter = `
        AND w.privacy_mode IN ('public', 'monetizable')
      `;
    }

    return {
      query: baseQuery + privacyFilter,
      params
    };
  }

  /**
   * Get privacy statistics for a project
   * 
   * @param {string} projectId - UUID of the project
   * @returns {Promise<Object>} Privacy mode distribution
   */
  async getPrivacyStats(projectId) {
    const result = await this.db.query(
      `SELECT 
        privacy_mode,
        COUNT(*) as count
       FROM wallets
       WHERE project_id = $1
       GROUP BY privacy_mode`,
      [projectId]
    );

    const stats = {
      private: 0,
      public: 0,
      monetizable: 0,
      total: 0
    };

    result.rows.forEach(row => {
      stats[row.privacy_mode] = parseInt(row.count);
      stats.total += parseInt(row.count);
    });

    return stats;
  }

  /**
   * Log privacy mode changes for audit trail
   * 
   * @param {string} walletId - UUID of the wallet
   * @param {string} newPrivacyMode - New privacy mode
   * @param {string} userId - UUID of the user making the change
   * @returns {Promise<void>}
   */
  async logPrivacyChange(walletId, newPrivacyMode, userId) {
    // Create audit log table if it doesn't exist
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS wallet_privacy_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_id UUID NOT NULL,
        privacy_mode TEXT NOT NULL,
        changed_by UUID,
        changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
      )
    `);

    // Insert audit log entry
    await this.db.query(
      `INSERT INTO wallet_privacy_audit_log (wallet_id, privacy_mode, changed_by)
       VALUES ($1, $2, $3)`,
      [walletId, newPrivacyMode, userId]
    );
  }

  /**
   * Clear cached data for a wallet (placeholder for cache implementation)
   * 
   * @param {string} walletId - UUID of the wallet
   * @returns {Promise<void>}
   */
  async clearWalletCache(walletId) {
    // This is a placeholder for cache invalidation
    // In a production system, this would clear Redis/Memcached entries
    // For now, we just log the action
    console.log(`Cache cleared for wallet: ${walletId}`);
  }

  /**
   * Get privacy audit log for a wallet
   * 
   * @param {string} walletId - UUID of the wallet
   * @param {number} limit - Maximum number of entries to return
   * @returns {Promise<Array>} Privacy change history
   */
  async getPrivacyAuditLog(walletId, limit = 50) {
    const result = await this.db.query(
      `SELECT 
        id,
        wallet_id,
        privacy_mode,
        changed_by,
        changed_at
       FROM wallet_privacy_audit_log
       WHERE wallet_id = $1
       ORDER BY changed_at DESC
       LIMIT $2`,
      [walletId, limit]
    );

    return result.rows;
  }

  /**
   * Validate privacy mode transition
   * Some transitions may require additional checks (e.g., monetizable requires setup)
   * 
   * @param {string} currentMode - Current privacy mode
   * @param {string} newMode - Desired new privacy mode
   * @returns {Object} Validation result
   */
  validatePrivacyTransition(currentMode, newMode) {
    const validModes = ['private', 'public', 'monetizable'];
    
    if (!validModes.includes(newMode)) {
      return {
        valid: false,
        reason: `Invalid privacy mode: ${newMode}`
      };
    }

    // All transitions are allowed, but monetizable may require additional setup
    if (newMode === 'monetizable') {
      return {
        valid: true,
        requiresSetup: true,
        message: 'Monetizable mode requires pricing configuration'
      };
    }

    return {
      valid: true,
      requiresSetup: false
    };
  }
}

export default PrivacyEnforcementService;
