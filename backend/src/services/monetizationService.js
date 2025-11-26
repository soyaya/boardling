/**
 * Monetization and Payment Service
 * 
 * Enables pay-per-analytics access for monetizable wallet data.
 * Integrates with zcash-paywall-sdk for payment processing.
 * Distributes earnings to wallet owners.
 * 
 * Requirements: 8.2, 8.3, 8.4
 */

import { ZcashPaywall } from 'zcash-paywall-sdk';

class MonetizationService {
  constructor(db, paywallConfig = {}) {
    this.db = db;
    
    // Initialize Zcash Paywall SDK
    this.paywall = new ZcashPaywall({
      baseURL: paywallConfig.baseURL || process.env.PAYWALL_API_URL || 'http://localhost:3000',
      apiKey: paywallConfig.apiKey || process.env.PAYWALL_API_KEY,
      timeout: paywallConfig.timeout || 30000
    });

    // Pricing configuration (in ZEC)
    this.pricing = {
      singleWalletAccess: 0.001,  // 0.001 ZEC per wallet analytics access
      bulkAccessDiscount: 0.10,    // 10% discount for bulk purchases
      ownerEarningsShare: 0.70,    // 70% goes to wallet owner
      platformFee: 0.30            // 30% platform fee
    };
  }

  /**
   * Initialize the paywall SDK
   */
  async initialize() {
    await this.paywall.initialize();
  }

  /**
   * Create a payment invoice for wallet data access
   * @param {string} requesterId - UUID of the user requesting access
   * @param {string} walletId - UUID of the wallet to access
   * @param {string} requesterEmail - Email of the requester
   * @returns {Promise<Object>} Payment invoice with QR code
   */
  async createDataAccessPayment(requesterId, walletId, requesterEmail) {
    // Verify wallet is monetizable
    const wallet = await this.db.query(
      `SELECT id, privacy_mode, project_id
       FROM wallets
       WHERE id = $1`,
      [walletId]
    );

    if (wallet.rows.length === 0) {
      throw new Error('Wallet not found');
    }

    if (wallet.rows[0].privacy_mode !== 'monetizable') {
      throw new Error('Wallet is not available for monetization');
    }

    // Get or create paywall user
    let paywallUser;
    try {
      paywallUser = await this.paywall.users.getByEmail(requesterEmail);
    } catch (error) {
      // User doesn't exist, create new one
      paywallUser = await this.paywall.users.create({
        email: requesterEmail,
        name: `User ${requesterId.substring(0, 8)}`
      });
    }

    // Create invoice for data access
    const invoice = await this.paywall.invoices.create({
      user_id: paywallUser.id,
      type: 'one_time',
      amount_zec: this.pricing.singleWalletAccess,
      item_id: `wallet_data_${walletId}`
    });

    // Store payment record in our database
    await this.db.query(
      `INSERT INTO wallet_data_access_payments 
       (id, requester_id, wallet_id, invoice_id, amount_zec, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        invoice.id,
        requesterId,
        walletId,
        invoice.id,
        this.pricing.singleWalletAccess,
        'pending'
      ]
    );

    return {
      invoice_id: invoice.id,
      payment_address: invoice.z_address,
      amount_zec: invoice.amount_zec,
      qr_code: invoice.qr_code,
      payment_uri: invoice.payment_uri,
      expires_at: invoice.expires_at
    };
  }

  /**
   * Check if a payment has been completed
   * @param {string} invoiceId - Invoice ID from paywall
   * @returns {Promise<Object>} Payment status
   */
  async checkPaymentStatus(invoiceId) {
    const status = await this.paywall.invoices.checkPayment(invoiceId);

    if (status.paid) {
      // Update our database
      await this.db.query(
        `UPDATE wallet_data_access_payments
         SET status = 'paid', paid_at = NOW(), paid_txid = $1
         WHERE invoice_id = $2`,
        [status.invoice.paid_txid, invoiceId]
      );

      // Distribute earnings to wallet owner
      const payment = await this.db.query(
        `SELECT requester_id, wallet_id, amount_zec
         FROM wallet_data_access_payments
         WHERE invoice_id = $1`,
        [invoiceId]
      );

      if (payment.rows.length > 0) {
        await this.distributeEarnings(
          payment.rows[0].wallet_id,
          payment.rows[0].amount_zec
        );
      }
    }

    return {
      paid: status.paid,
      invoice_id: invoiceId,
      paid_at: status.invoice.paid_at,
      paid_txid: status.invoice.paid_txid
    };
  }

  /**
   * Distribute earnings to wallet owner
   * @param {string} walletId - UUID of the wallet
   * @param {number} totalAmount - Total payment amount in ZEC
   * @private
   */
  async distributeEarnings(walletId, totalAmount) {
    // Calculate owner share
    const ownerEarnings = totalAmount * this.pricing.ownerEarningsShare;
    const platformFee = totalAmount * this.pricing.platformFee;

    // Get wallet owner
    const result = await this.db.query(
      `SELECT p.user_id
       FROM wallets w
       JOIN projects p ON w.project_id = p.id
       WHERE w.id = $1`,
      [walletId]
    );

    if (result.rows.length === 0) {
      throw new Error('Wallet owner not found');
    }

    const ownerId = result.rows[0].user_id;

    // Record earnings
    await this.db.query(
      `INSERT INTO wallet_owner_earnings 
       (id, user_id, wallet_id, amount_zec, platform_fee_zec, status, earned_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'pending', NOW())`,
      [ownerId, walletId, ownerEarnings, platformFee]
    );

    return {
      owner_earnings: ownerEarnings,
      platform_fee: platformFee,
      total: totalAmount
    };
  }

  /**
   * Get earnings for a wallet owner
   * @param {string} userId - UUID of the user
   * @returns {Promise<Object>} Earnings summary
   */
  async getOwnerEarnings(userId) {
    const result = await this.db.query(
      `SELECT 
        COUNT(*) as total_sales,
        SUM(amount_zec) as total_earnings,
        SUM(platform_fee_zec) as total_fees,
        SUM(CASE WHEN status = 'pending' THEN amount_zec ELSE 0 END) as pending_earnings,
        SUM(CASE WHEN status = 'paid' THEN amount_zec ELSE 0 END) as paid_earnings
       FROM wallet_owner_earnings
       WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0];

    return {
      total_sales: parseInt(row.total_sales) || 0,
      total_earnings_zec: parseFloat(row.total_earnings) || 0,
      total_fees_zec: parseFloat(row.total_fees) || 0,
      pending_earnings_zec: parseFloat(row.pending_earnings) || 0,
      paid_earnings_zec: parseFloat(row.paid_earnings) || 0,
      available_for_withdrawal_zec: parseFloat(row.pending_earnings) || 0
    };
  }

  /**
   * Request withdrawal of earnings
   * @param {string} userId - UUID of the user
   * @param {string} toAddress - Zcash address for withdrawal
   * @param {number} amountZec - Amount to withdraw in ZEC
   * @returns {Promise<Object>} Withdrawal request
   */
  async requestWithdrawal(userId, toAddress, amountZec) {
    // Check available balance
    const earnings = await this.getOwnerEarnings(userId);

    if (amountZec > earnings.available_for_withdrawal_zec) {
      throw new Error('Insufficient balance for withdrawal');
    }

    // Get paywall user
    const userResult = await this.db.query(
      `SELECT email FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const userEmail = userResult.rows[0].email;

    // Get or create paywall user
    let paywallUser;
    try {
      paywallUser = await this.paywall.users.getByEmail(userEmail);
    } catch (error) {
      paywallUser = await this.paywall.users.create({
        email: userEmail,
        name: `User ${userId.substring(0, 8)}`
      });
    }

    // Create withdrawal request
    const withdrawal = await this.paywall.withdrawals.create({
      user_id: paywallUser.id,
      to_address: toAddress,
      amount_zec: amountZec
    });

    // Record withdrawal in our database
    await this.db.query(
      `INSERT INTO wallet_earnings_withdrawals
       (id, user_id, withdrawal_id, amount_zec, to_address, status, requested_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'pending', NOW())`,
      [userId, withdrawal.id, amountZec, toAddress]
    );

    // Mark earnings as withdrawn
    await this.db.query(
      `UPDATE wallet_owner_earnings
       SET status = 'withdrawn', withdrawn_at = NOW()
       WHERE user_id = $1 AND status = 'pending'
       AND amount_zec <= $2`,
      [userId, amountZec]
    );

    return {
      withdrawal_id: withdrawal.id,
      amount_zec: amountZec,
      to_address: toAddress,
      status: 'pending'
    };
  }

  /**
   * Check if user has paid for wallet data access
   * @param {string} requesterId - UUID of the requester
   * @param {string} walletId - UUID of the wallet
   * @returns {Promise<boolean>} Whether access has been paid for
   */
  async hasAccessToWallet(requesterId, walletId) {
    const result = await this.db.query(
      `SELECT id FROM wallet_data_access_payments
       WHERE requester_id = $1 AND wallet_id = $2 AND status = 'paid'
       LIMIT 1`,
      [requesterId, walletId]
    );

    return result.rows.length > 0;
  }

  /**
   * Get marketplace listing of monetizable wallets
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of available wallets
   */
  async getMarketplaceListing(filters = {}) {
    let query = `
      SELECT 
        w.id,
        w.type,
        COUNT(DISTINCT wam.activity_date) as active_days,
        SUM(wam.transaction_count) as total_transactions,
        AVG(wps.total_score) as avg_productivity_score,
        COUNT(DISTINCT wdap.requester_id) as purchase_count
      FROM wallets w
      LEFT JOIN wallet_activity_metrics wam ON w.id = wam.wallet_id
      LEFT JOIN wallet_productivity_scores wps ON w.id = wps.wallet_id
      LEFT JOIN wallet_data_access_payments wdap ON w.id = wdap.wallet_id AND wdap.status = 'paid'
      WHERE w.privacy_mode = 'monetizable'
    `;

    const params = [];
    let paramIndex = 1;

    // Add filters
    if (filters.minProductivityScore) {
      query += ` AND wps.total_score >= $${paramIndex}`;
      params.push(filters.minProductivityScore);
      paramIndex++;
    }

    if (filters.walletType) {
      query += ` AND w.type = $${paramIndex}`;
      params.push(filters.walletType);
      paramIndex++;
    }

    query += `
      GROUP BY w.id, w.type
      ORDER BY avg_productivity_score DESC NULLS LAST
      LIMIT ${filters.limit || 50}
    `;

    const result = await this.db.query(query, params);

    return result.rows.map(row => ({
      wallet_id: row.id,
      wallet_type: row.type,
      price_zec: this.pricing.singleWalletAccess,
      metrics_preview: {
        active_days: parseInt(row.active_days) || 0,
        total_transactions: parseInt(row.total_transactions) || 0,
        productivity_score: parseFloat(row.avg_productivity_score) || 0
      },
      popularity: {
        purchase_count: parseInt(row.purchase_count) || 0
      }
    }));
  }

  /**
   * Create necessary database tables for monetization
   */
  async createTables() {
    // Create wallet data access payments table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS wallet_data_access_payments (
        id UUID PRIMARY KEY,
        requester_id UUID NOT NULL,
        wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
        invoice_id TEXT NOT NULL,
        amount_zec DECIMAL(16,8) NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
        paid_at TIMESTAMP WITH TIME ZONE,
        paid_txid TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create wallet owner earnings table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS wallet_owner_earnings (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
        amount_zec DECIMAL(16,8) NOT NULL,
        platform_fee_zec DECIMAL(16,8) NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'withdrawn', 'paid')),
        earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        withdrawn_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Create wallet earnings withdrawals table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS wallet_earnings_withdrawals (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        withdrawal_id TEXT NOT NULL,
        amount_zec DECIMAL(16,8) NOT NULL,
        to_address TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
        requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Create indexes
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_wallet_data_payments_requester 
      ON wallet_data_access_payments(requester_id)
    `);

    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_wallet_data_payments_wallet 
      ON wallet_data_access_payments(wallet_id)
    `);

    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_wallet_owner_earnings_user 
      ON wallet_owner_earnings(user_id)
    `);

    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_wallet_earnings_withdrawals_user 
      ON wallet_earnings_withdrawals(user_id)
    `);
  }
}

export default MonetizationService;
