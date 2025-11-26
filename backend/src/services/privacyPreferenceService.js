/**
 * Privacy Preference Management Service
 * 
 * Manages wallet privacy settings and data access controls.
 * Supports three privacy modes:
 * - private: No data sharing, analytics visible only to wallet owner
 * - public: Data visible to all users for free
 * - monetizable: Data available for purchase, owner earns from access
 * 
 * Requirements: 8.1, 8.5
 */

class PrivacyPreferenceService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Set privacy preference for a wallet
   * @param {string} walletId - UUID of the wallet
   * @param {string} privacyMode - 'private', 'public', or 'monetizable'
   * @returns {Promise<Object>} Updated wallet with new privacy mode
   */
  async setPrivacyPreference(walletId, privacyMode) {
    // Validate privacy mode
    const validModes = ['private', 'public', 'monetizable'];
    if (!validModes.includes(privacyMode)) {
      throw new Error(`Invalid privacy mode. Must be one of: ${validModes.join(', ')}`);
    }

    // Update wallet privacy mode
    const result = await this.db.query(
      `UPDATE wallets 
       SET privacy_mode = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, address, type, privacy_mode, project_id, created_at, updated_at`,
      [privacyMode, walletId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    // Log privacy change for audit trail
    await this.logPrivacyChange(walletId, privacyMode);

    return result.rows[0];
  }

  /**
   * Get privacy preference for a wallet
   * @param {string} walletId - UUID of the wallet
   * @returns {Promise<Object>} Wallet privacy information
   */
  async getPrivacyPreference(walletId) {
    const result = await this.db.query(
      `SELECT id, address, type, privacy_mode, project_id, created_at, updated_at
       FROM wallets
       WHERE id = $1`,
      [walletId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    return result.rows[0];
  }

  /**
   * Batch update privacy preferences for multiple wallets
   * @param {string} projectId - UUID of the project
   * @param {string} privacyMode - Privacy mode to apply to all wallets
   * @returns {Promise<Array>} Updated wallets
   */
  async setProjectPrivacyPreference(projectId, privacyMode) {
    // Validate privacy mode
    const validModes = ['private', 'public', 'monetizable'];
    if (!validModes.includes(privacyMode)) {
      throw new Error(`Invalid privacy mode. Must be one of: ${validModes.join(', ')}`);
    }

    // Update all wallets for the project
    const result = await this.db.query(
      `UPDATE wallets 
       SET privacy_mode = $1, updated_at = NOW()
       WHERE project_id = $2
       RETURNING id, address, type, privacy_mode, project_id, created_at, updated_at`,
      [privacyMode, projectId]
    );

    // Log privacy changes for all wallets
    for (const wallet of result.rows) {
      await this.logPrivacyChange(wallet.id, privacyMode);
    }

    return result.rows;
  }

  /**
   * Check if a wallet's data can be accessed by a requester
   * @param {string} walletId - UUID of the wallet
   * @param {string} requesterId - UUID of the requesting user
   * @param {boolean} isPaid - Whether the requester has paid for access
   * @returns {Promise<Object>} Access decision with reason
   */
  async checkDataAccess(walletId, requesterId, isPaid = false) {
    // Get wallet and its owner
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
        dataLevel: null
      };
    }

    const wallet = walletResult.rows[0];

    // Owner always has full access
    if (wallet.owner_id === requesterId) {
      return {
        allowed: true,
        reason: 'Owner access',
        dataLevel: 'full'
      };
    }

    // Check privacy mode
    switch (wallet.privacy_mode) {
      case 'private':
        return {
          allowed: false,
          reason: 'Wallet is private',
          dataLevel: null
        };

      case 'public':
        return {
          allowed: true,
          reason: 'Wallet is public',
          dataLevel: 'aggregated'
        };

      case 'monetizable':
        if (isPaid) {
          return {
            allowed: true,
            reason: 'Paid access to monetizable data',
            dataLevel: 'aggregated'
          };
        } else {
          return {
            allowed: false,
            reason: 'Payment required for monetizable data',
            dataLevel: null,
            requiresPayment: true
          };
        }

      default:
        return {
          allowed: false,
          reason: 'Unknown privacy mode',
          dataLevel: null
        };
    }
  }

  /**
   * Get anonymized/aggregated data based on access level
   * @param {string} walletId - UUID of the wallet
   * @param {string} dataLevel - 'full' or 'aggregated'
   * @returns {Promise<Object>} Wallet analytics data
   */
  async getWalletData(walletId, dataLevel) {
    if (dataLevel === 'full') {
      // Return full detailed data for owner
      return await this.getFullWalletData(walletId);
    } else if (dataLevel === 'aggregated') {
      // Return anonymized aggregated data
      return await this.getAggregatedWalletData(walletId);
    } else {
      throw new Error('Invalid data level');
    }
  }

  /**
   * Get full wallet data (owner only)
   * @private
   */
  async getFullWalletData(walletId) {
    const result = await this.db.query(
      `SELECT 
        w.id,
        w.address,
        w.type,
        w.privacy_mode,
        COUNT(DISTINCT wam.activity_date) as active_days,
        SUM(wam.transaction_count) as total_transactions,
        SUM(wam.total_volume_zatoshi) as total_volume,
        AVG(wps.total_score) as avg_productivity_score
       FROM wallets w
       LEFT JOIN wallet_activity_metrics wam ON w.id = wam.wallet_id
       LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
       WHERE w.id = $1
       GROUP BY w.id, w.address, w.type, w.privacy_mode`,
      [walletId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get aggregated wallet data (anonymized)
   * @private
   */
  async getAggregatedWalletData(walletId) {
    const result = await this.db.query(
      `SELECT 
        w.type,
        COUNT(DISTINCT wam.activity_date) as active_days,
        SUM(wam.transaction_count) as total_transactions,
        AVG(wps.total_score) as avg_productivity_score,
        AVG(wps.retention_score) as avg_retention_score,
        AVG(wps.adoption_score) as avg_adoption_score
       FROM wallets w
       LEFT JOIN wallet_activity_metrics wam ON w.id = wam.wallet_id
       LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
       WHERE w.id = $1
       GROUP BY w.type`,
      [walletId]
    );

    // Return anonymized data (no address, no wallet ID)
    const data = result.rows[0] || null;
    if (data) {
      return {
        wallet_type: data.type,
        behavioral_metrics: {
          active_days: parseInt(data.active_days) || 0,
          total_transactions: parseInt(data.total_transactions) || 0,
          avg_productivity_score: parseFloat(data.avg_productivity_score) || 0,
          avg_retention_score: parseFloat(data.avg_retention_score) || 0,
          avg_adoption_score: parseFloat(data.avg_adoption_score) || 0
        },
        note: 'Data is anonymized and aggregated for privacy'
      };
    }
    return null;
  }

  /**
   * Log privacy setting changes for audit trail
   * @private
   */
  async logPrivacyChange(walletId, newPrivacyMode) {
    // Create audit log table if it doesn't exist
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS wallet_privacy_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_id UUID NOT NULL,
        privacy_mode TEXT NOT NULL,
        changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Insert audit log entry
    await this.db.query(
      `INSERT INTO wallet_privacy_audit_log (wallet_id, privacy_mode)
       VALUES ($1, $2)`,
      [walletId, newPrivacyMode]
    );
  }

  /**
   * Get privacy statistics for a project
   * @param {string} projectId - UUID of the project
   * @returns {Promise<Object>} Privacy mode distribution
   */
  async getProjectPrivacyStats(projectId) {
    const result = await this.db.query(
      `SELECT 
        privacy_mode,
        COUNT(*) as wallet_count
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
      stats[row.privacy_mode] = parseInt(row.wallet_count);
      stats.total += parseInt(row.wallet_count);
    });

    return stats;
  }

  /**
   * Get all monetizable wallets for marketplace
   * @returns {Promise<Array>} List of monetizable wallet summaries
   */
  async getMonetizableWallets() {
    const result = await this.db.query(
      `SELECT 
        w.id,
        w.type,
        COUNT(DISTINCT wam.activity_date) as active_days,
        SUM(wam.transaction_count) as total_transactions,
        AVG(wps.total_score) as avg_productivity_score
       FROM wallets w
       LEFT JOIN wallet_activity_metrics wam ON w.id = wam.wallet_id
       LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
       WHERE w.privacy_mode = 'monetizable'
       GROUP BY w.id, w.type
       ORDER BY avg_productivity_score DESC NULLS LAST`,
      []
    );

    // Return anonymized summaries
    return result.rows.map(row => ({
      wallet_id: row.id,
      wallet_type: row.type,
      metrics_summary: {
        active_days: parseInt(row.active_days) || 0,
        total_transactions: parseInt(row.total_transactions) || 0,
        productivity_score: parseFloat(row.avg_productivity_score) || 0
      }
    }));
  }
}

export default PrivacyPreferenceService;
