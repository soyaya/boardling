/**
 * Payment Service
 * Handles payment processing for subscriptions and data access
 * Integrates with unified invoice system and subscription management
 */

import pool from '../db/db.js';
import { updateSubscriptionStatus } from './subscriptionService.js';

/**
 * Create a subscription payment invoice
 * @param {string} userId - User UUID
 * @param {string} planType - Subscription plan ('premium' or 'enterprise')
 * @param {number} durationMonths - Subscription duration in months
 * @param {Object} options - Additional options (payment_method, network, etc.)
 * @returns {Promise<Object>} Invoice details
 */
export async function createSubscriptionInvoice(userId, planType, durationMonths = 1, options = {}) {
  const {
    payment_method = 'auto',
    network = 'testnet',
    description
  } = options;

  // Validate plan type
  const validPlans = ['premium', 'enterprise'];
  if (!validPlans.includes(planType)) {
    throw new Error(`Invalid plan type: ${planType}. Must be one of: ${validPlans.join(', ')}`);
  }

  // Validate duration
  if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 12) {
    throw new Error('Duration must be between 1 and 12 months');
  }

  // Calculate subscription amount based on plan and duration
  const pricing = {
    premium: 0.01,    // 0.01 ZEC per month
    enterprise: 0.05  // 0.05 ZEC per month
  };

  const monthlyRate = pricing[planType];
  const totalAmount = monthlyRate * durationMonths;

  // Create invoice using unified invoice system
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Generate payment address based on method
    const addressInfo = await generatePaymentAddress(payment_method, network);

    // Create unified invoice
    const invoiceResult = await client.query(
      `INSERT INTO unified_invoices (
        user_id, type, amount_zec, payment_method, network,
        payment_address, address_type, item_id, description, status,
        address_metadata, created_at
      ) VALUES ($1, 'subscription', $2, $3, $4, $5, $6, $7, $8, 'pending', $9, NOW()) 
      RETURNING *`,
      [
        userId,
        totalAmount,
        payment_method,
        network,
        addressInfo.address,
        addressInfo.type,
        `${planType}_${durationMonths}m`,
        description || `${planType} subscription for ${durationMonths} month(s)`,
        JSON.stringify({
          ...addressInfo.metadata,
          plan_type: planType,
          duration_months: durationMonths,
          monthly_rate: monthlyRate
        })
      ]
    );

    await client.query('COMMIT');

    const invoice = invoiceResult.rows[0];

    return {
      invoice_id: invoice.id,
      user_id: invoice.user_id,
      plan_type: planType,
      duration_months: durationMonths,
      amount_zec: parseFloat(invoice.amount_zec),
      payment_address: invoice.payment_address,
      payment_method: invoice.payment_method,
      address_type: invoice.address_type,
      network: invoice.network,
      status: invoice.status,
      created_at: invoice.created_at
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check payment status for an invoice
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<Object>} Payment status
 */
export async function checkInvoicePayment(invoiceId) {
  const result = await pool.query(
    `SELECT * FROM unified_invoices WHERE id = $1`,
    [invoiceId]
  );

  if (result.rows.length === 0) {
    throw new Error('Invoice not found');
  }

  const invoice = result.rows[0];

  return {
    invoice_id: invoice.id,
    status: invoice.status,
    paid: invoice.status === 'paid',
    amount_zec: parseFloat(invoice.amount_zec),
    paid_amount_zec: invoice.paid_amount_zec ? parseFloat(invoice.paid_amount_zec) : null,
    paid_txid: invoice.paid_txid,
    paid_at: invoice.paid_at,
    expires_at: invoice.expires_at,
    payment_address: invoice.payment_address
  };
}

/**
 * Process payment and activate subscription
 * This is called when payment is detected for a subscription invoice
 * @param {string} invoiceId - Invoice ID
 * @param {Object} paymentDetails - Payment details (amount, txid)
 * @returns {Promise<Object>} Updated subscription details
 */
export async function processSubscriptionPayment(invoiceId, paymentDetails) {
  const { amount_zec, txid } = paymentDetails;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get invoice details
    const invoiceResult = await client.query(
      `SELECT * FROM unified_invoices WHERE id = $1 FOR UPDATE`,
      [invoiceId]
    );

    if (invoiceResult.rows.length === 0) {
      throw new Error('Invoice not found');
    }

    const invoice = invoiceResult.rows[0];

    // Check if already paid
    if (invoice.status === 'paid') {
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'Invoice already paid',
        invoice_id: invoiceId
      };
    }

    // Verify invoice type is subscription
    if (invoice.type !== 'subscription') {
      throw new Error('Invoice is not a subscription invoice');
    }

    // Parse metadata to get plan details
    const metadata = invoice.address_metadata || {};
    const planType = metadata.plan_type || 'premium';
    const durationMonths = metadata.duration_months || 1;

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    // Update invoice status
    await client.query(
      `UPDATE unified_invoices 
       SET status = 'paid',
           paid_amount_zec = $1,
           paid_txid = $2,
           paid_at = NOW(),
           expires_at = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [amount_zec, txid, expiresAt, invoiceId]
    );

    // Update user subscription status
    await client.query(
      `UPDATE users 
       SET subscription_status = $1,
           subscription_expires_at = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [planType, expiresAt, invoice.user_id]
    );

    // Create legacy invoice record for balance tracking
    await client.query(
      `INSERT INTO invoices (
        user_id, type, amount_zec, z_address, item_id, status,
        paid_amount_zec, paid_txid, paid_at, expires_at, created_at
      ) VALUES ($1, 'subscription', $2, $3, $4, 'paid', $5, $6, NOW(), $7, $8)`,
      [
        invoice.user_id,
        invoice.amount_zec,
        invoice.payment_address,
        invoice.item_id,
        amount_zec,
        txid,
        expiresAt,
        invoice.created_at
      ]
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Subscription activated successfully',
      invoice_id: invoiceId,
      user_id: invoice.user_id,
      subscription: {
        status: planType,
        expires_at: expiresAt,
        duration_months: durationMonths
      },
      payment: {
        amount_zec: parseFloat(amount_zec),
        txid: txid,
        paid_at: new Date()
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create a data access payment invoice
 * @param {string} buyerUserId - User purchasing data access
 * @param {string} dataOwnerUserId - User who owns the data
 * @param {string} dataPackageId - Identifier for the data package (e.g., project_id or wallet_id)
 * @param {number} amount_zec - Amount in ZEC
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Invoice details
 */
export async function createDataAccessInvoice(buyerUserId, dataOwnerUserId, dataPackageId, amount_zec, options = {}) {
  const {
    payment_method = 'auto',
    network = 'testnet',
    description,
    data_type = 'project_analytics' // 'project_analytics', 'wallet_analytics', 'comparison_data'
  } = options;

  // Validate amount
  if (!amount_zec || amount_zec <= 0) {
    throw new Error('Amount must be a positive number');
  }

  // Validate buyer and owner are different users
  if (buyerUserId === dataOwnerUserId) {
    throw new Error('Cannot purchase access to your own data');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify buyer has valid subscription and privacy mode
    const buyerResult = await client.query(
      `SELECT subscription_status, subscription_expires_at 
       FROM users WHERE id = $1`,
      [buyerUserId]
    );

    if (buyerResult.rows.length === 0) {
      throw new Error('Buyer user not found');
    }

    const buyer = buyerResult.rows[0];
    const now = new Date();

    // Check if buyer has active subscription
    if (buyer.subscription_status === 'free' || 
        (buyer.subscription_expires_at && new Date(buyer.subscription_expires_at) < now)) {
      throw new Error('Active subscription required to purchase data access');
    }

    // Verify data owner exists and has monetizable data
    const ownerResult = await client.query(
      `SELECT id FROM users WHERE id = $1`,
      [dataOwnerUserId]
    );

    if (ownerResult.rows.length === 0) {
      throw new Error('Data owner not found');
    }

    // Verify the data package exists and is monetizable
    if (data_type === 'project_analytics') {
      const projectResult = await client.query(
        `SELECT p.id, p.user_id, 
                COUNT(w.id) FILTER (WHERE w.privacy_mode = 'monetizable') as monetizable_count
         FROM projects p
         LEFT JOIN wallets w ON w.project_id = p.id
         WHERE p.id = $1 AND p.user_id = $2
         GROUP BY p.id, p.user_id`,
        [dataPackageId, dataOwnerUserId]
      );

      if (projectResult.rows.length === 0) {
        throw new Error('Project not found or does not belong to data owner');
      }

      if (projectResult.rows[0].monetizable_count === 0) {
        throw new Error('Project has no monetizable wallets');
      }
    }

    // Generate payment address
    const addressInfo = await generatePaymentAddress(payment_method, network);

    // Create unified invoice
    const invoiceResult = await client.query(
      `INSERT INTO unified_invoices (
        user_id, type, amount_zec, payment_method, network,
        payment_address, address_type, item_id, description, status,
        address_metadata, created_at
      ) VALUES ($1, 'data_access', $2, $3, $4, $5, $6, $7, $8, 'pending', $9, NOW()) 
      RETURNING *`,
      [
        buyerUserId,
        amount_zec,
        payment_method,
        network,
        addressInfo.address,
        addressInfo.type,
        `data_access_${dataPackageId}`,
        description || `Data access purchase: ${data_type} for ${dataPackageId}`,
        JSON.stringify({
          ...addressInfo.metadata,
          data_owner_id: dataOwnerUserId,
          data_package_id: dataPackageId,
          data_type: data_type,
          invoice_type: 'data_access'
        })
      ]
    );

    await client.query('COMMIT');

    const invoice = invoiceResult.rows[0];

    return {
      invoice_id: invoice.id,
      buyer_user_id: buyerUserId,
      data_owner_id: dataOwnerUserId,
      data_package_id: dataPackageId,
      data_type: data_type,
      amount_zec: parseFloat(invoice.amount_zec),
      payment_address: invoice.payment_address,
      payment_method: invoice.payment_method,
      address_type: invoice.address_type,
      network: invoice.network,
      status: invoice.status,
      created_at: invoice.created_at
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Process data access payment with revenue split
 * @param {string} invoiceId - Invoice ID
 * @param {Object} paymentDetails - Payment details
 * @returns {Promise<Object>} Payment processing result
 */
export async function processDataAccessPayment(invoiceId, paymentDetails) {
  const { amount_zec, txid } = paymentDetails;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get invoice details
    const invoiceResult = await client.query(
      `SELECT * FROM unified_invoices WHERE id = $1 FOR UPDATE`,
      [invoiceId]
    );

    if (invoiceResult.rows.length === 0) {
      throw new Error('Invoice not found');
    }

    const invoice = invoiceResult.rows[0];

    // Check if already paid
    if (invoice.status === 'paid') {
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'Invoice already paid',
        invoice_id: invoiceId
      };
    }

    // Verify invoice type is data_access
    if (invoice.type !== 'data_access') {
      throw new Error('Invoice is not a data access invoice');
    }

    // Parse metadata
    const metadata = invoice.address_metadata || {};
    const dataOwnerId = metadata.data_owner_id;
    const dataPackageId = metadata.data_package_id;
    const dataType = metadata.data_type || 'project_analytics';

    if (!dataOwnerId) {
      throw new Error('Data owner ID not found in invoice metadata');
    }

    // Calculate revenue split (70% to data owner, 30% to platform)
    const dataOwnerShare = parseFloat((amount_zec * 0.7).toFixed(8));
    const platformShare = parseFloat((amount_zec * 0.3).toFixed(8));

    // Update invoice status
    await client.query(
      `UPDATE unified_invoices 
       SET status = 'paid',
           paid_amount_zec = $1,
           paid_txid = $2,
           paid_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [amount_zec, txid, invoiceId]
    );

    // Update data owner balance
    await client.query(
      `UPDATE users 
       SET balance_zec = balance_zec + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [dataOwnerShare, dataOwnerId]
    );

    // Grant data access to buyer
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // Access valid for 1 month

    await client.query(
      `INSERT INTO data_access_grants (
        id, buyer_user_id, data_owner_id, data_package_id, data_type,
        invoice_id, amount_paid_zec, granted_at, expires_at
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), $7)
      ON CONFLICT (buyer_user_id, data_package_id) 
      DO UPDATE SET 
        expires_at = EXCLUDED.expires_at,
        amount_paid_zec = data_access_grants.amount_paid_zec + EXCLUDED.amount_paid_zec,
        granted_at = NOW()`,
      [invoice.user_id, dataOwnerId, dataPackageId, dataType, invoiceId, amount_zec, expiresAt]
    );

    // Record earnings for data owner
    await client.query(
      `INSERT INTO data_owner_earnings (
        id, user_id, data_package_id, data_type, amount_zec, 
        platform_fee_zec, buyer_user_id, invoice_id, earned_at
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())`,
      [dataOwnerId, dataPackageId, dataType, dataOwnerShare, platformShare, invoice.user_id, invoiceId]
    );

    // Create legacy invoice record for balance tracking
    await client.query(
      `INSERT INTO invoices (
        user_id, type, amount_zec, z_address, item_id, status,
        paid_amount_zec, paid_txid, paid_at, created_at
      ) VALUES ($1, 'one_time', $2, $3, $4, 'paid', $5, $6, NOW(), $7)`,
      [
        invoice.user_id,
        invoice.amount_zec,
        invoice.payment_address,
        invoice.item_id,
        amount_zec,
        txid,
        invoice.created_at
      ]
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Data access payment processed successfully',
      invoice_id: invoiceId,
      buyer_user_id: invoice.user_id,
      data_owner_id: dataOwnerId,
      data_package_id: dataPackageId,
      data_type: dataType,
      access_granted: true,
      access_expires_at: expiresAt,
      payment: {
        total_amount_zec: parseFloat(amount_zec),
        data_owner_share_zec: dataOwnerShare,
        platform_share_zec: platformShare,
        txid: txid,
        paid_at: new Date()
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get user balance
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Balance information
 */
export async function getUserBalance(userId) {
  const result = await pool.query(
    `SELECT balance_zec FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return {
    user_id: userId,
    balance_zec: parseFloat(result.rows[0].balance_zec || 0)
  };
}

/**
 * Get payment history for a user
 * @param {string} userId - User UUID
 * @param {Object} options - Query options (limit, offset, type)
 * @returns {Promise<Array>} Payment history
 */
export async function getPaymentHistory(userId, options = {}) {
  const {
    limit = 50,
    offset = 0,
    type = null // 'subscription' or 'one_time'
  } = options;

  let query = `
    SELECT 
      id, type, amount_zec, payment_method, payment_address,
      status, paid_amount_zec, paid_txid, paid_at, expires_at,
      item_id, description, created_at
    FROM unified_invoices
    WHERE user_id = $1
  `;

  const params = [userId];

  if (type) {
    query += ` AND type = $${params.length + 1}`;
    params.push(type);
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  return result.rows.map(row => ({
    invoice_id: row.id,
    type: row.type,
    amount_zec: parseFloat(row.amount_zec),
    payment_method: row.payment_method,
    payment_address: row.payment_address,
    status: row.status,
    paid_amount_zec: row.paid_amount_zec ? parseFloat(row.paid_amount_zec) : null,
    paid_txid: row.paid_txid,
    paid_at: row.paid_at,
    expires_at: row.expires_at,
    item_id: row.item_id,
    description: row.description,
    created_at: row.created_at
  }));
}

// Helper function to generate payment address
async function generatePaymentAddress(method, network) {
  // This is a simplified version - in production, integrate with actual address generation
  // For now, return mock addresses based on method
  
  switch (method) {
    case 'transparent':
      return {
        address: `t1${generateRandomString(33)}`,
        type: 'transparent',
        metadata: { method: 'mock_generated' }
      };
      
    case 'shielded':
      return {
        address: `zs1${generateRandomString(75)}`,
        type: 'shielded',
        metadata: { method: 'mock_generated' }
      };
      
    case 'unified':
      return {
        address: `u1${generateRandomString(140)}`,
        type: 'unified',
        metadata: { method: 'mock_generated', pools: ['orchard', 'sapling'] }
      };
      
    case 'auto':
    default:
      // Default to unified for auto mode
      return {
        address: `u1${generateRandomString(140)}`,
        type: 'unified',
        metadata: { method: 'auto_unified', pools: ['orchard', 'sapling'] }
      };
  }
}

function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if user has access to data package
 * @param {string} userId - User UUID
 * @param {string} dataPackageId - Data package ID (project_id or wallet_id)
 * @returns {Promise<Object>} Access status
 */
export async function checkDataAccess(userId, dataPackageId) {
  const result = await pool.query(
    `SELECT id, data_type, granted_at, expires_at
     FROM data_access_grants
     WHERE buyer_user_id = $1 AND data_package_id = $2 AND expires_at > NOW()
     ORDER BY expires_at DESC
     LIMIT 1`,
    [userId, dataPackageId]
  );

  if (result.rows.length === 0) {
    return {
      has_access: false,
      message: 'No active data access found'
    };
  }

  const grant = result.rows[0];

  return {
    has_access: true,
    data_type: grant.data_type,
    granted_at: grant.granted_at,
    expires_at: grant.expires_at
  };
}

/**
 * Get data owner earnings summary
 * @param {string} userId - User UUID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Earnings summary
 */
export async function getDataOwnerEarnings(userId, options = {}) {
  const {
    data_type = null,
    start_date = null,
    end_date = null
  } = options;

  let query = `
    SELECT 
      COUNT(*) as total_sales,
      SUM(amount_zec) as total_earnings,
      SUM(platform_fee_zec) as total_fees,
      data_type
    FROM data_owner_earnings
    WHERE user_id = $1
  `;

  const params = [userId];
  let paramIndex = 2;

  if (data_type) {
    query += ` AND data_type = $${paramIndex}`;
    params.push(data_type);
    paramIndex++;
  }

  if (start_date) {
    query += ` AND earned_at >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }

  if (end_date) {
    query += ` AND earned_at <= $${paramIndex}`;
    params.push(end_date);
    paramIndex++;
  }

  query += ` GROUP BY data_type`;

  const result = await pool.query(query, params);

  const summary = {
    user_id: userId,
    total_sales: 0,
    total_earnings_zec: 0,
    total_fees_zec: 0,
    by_data_type: {}
  };

  result.rows.forEach(row => {
    const sales = parseInt(row.total_sales) || 0;
    const earnings = parseFloat(row.total_earnings) || 0;
    const fees = parseFloat(row.total_fees) || 0;

    summary.total_sales += sales;
    summary.total_earnings_zec += earnings;
    summary.total_fees_zec += fees;

    summary.by_data_type[row.data_type] = {
      sales: sales,
      earnings_zec: earnings,
      fees_zec: fees
    };
  });

  return summary;
}

/**
 * Get list of users who purchased access to data
 * @param {string} dataOwnerId - Data owner user ID
 * @param {string} dataPackageId - Data package ID
 * @returns {Promise<Array>} List of buyers
 */
export async function getDataAccessBuyers(dataOwnerId, dataPackageId) {
  const result = await pool.query(
    `SELECT 
      dag.buyer_user_id,
      u.email,
      u.name,
      dag.data_type,
      dag.amount_paid_zec,
      dag.granted_at,
      dag.expires_at,
      CASE WHEN dag.expires_at > NOW() THEN true ELSE false END as is_active
     FROM data_access_grants dag
     JOIN users u ON u.id = dag.buyer_user_id
     WHERE dag.data_owner_id = $1 AND dag.data_package_id = $2
     ORDER BY dag.granted_at DESC`,
    [dataOwnerId, dataPackageId]
  );

  return result.rows.map(row => ({
    buyer_user_id: row.buyer_user_id,
    buyer_email: row.email,
    buyer_name: row.name,
    data_type: row.data_type,
    amount_paid_zec: parseFloat(row.amount_paid_zec),
    granted_at: row.granted_at,
    expires_at: row.expires_at,
    is_active: row.is_active
  }));
}

/**
 * Get monetizable data packages for a user
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} List of monetizable data packages
 */
export async function getMonetizableDataPackages(userId) {
  const result = await pool.query(
    `SELECT 
      p.id as project_id,
      p.name as project_name,
      p.description,
      COUNT(w.id) FILTER (WHERE w.privacy_mode = 'monetizable') as monetizable_wallets,
      COUNT(DISTINCT dag.buyer_user_id) as total_buyers,
      COALESCE(SUM(doe.amount_zec), 0) as total_earnings_zec
     FROM projects p
     LEFT JOIN wallets w ON w.project_id = p.id
     LEFT JOIN data_access_grants dag ON dag.data_package_id = p.id::text
     LEFT JOIN data_owner_earnings doe ON doe.data_package_id = p.id::text
     WHERE p.user_id = $1
     GROUP BY p.id, p.name, p.description
     HAVING COUNT(w.id) FILTER (WHERE w.privacy_mode = 'monetizable') > 0
     ORDER BY total_earnings_zec DESC`,
    [userId]
  );

  return result.rows.map(row => ({
    project_id: row.project_id,
    project_name: row.project_name,
    description: row.description,
    monetizable_wallets: parseInt(row.monetizable_wallets),
    total_buyers: parseInt(row.total_buyers),
    total_earnings_zec: parseFloat(row.total_earnings_zec)
  }));
}

export default {
  createSubscriptionInvoice,
  checkInvoicePayment,
  processSubscriptionPayment,
  createDataAccessInvoice,
  processDataAccessPayment,
  getUserBalance,
  getPaymentHistory,
  checkDataAccess,
  getDataOwnerEarnings,
  getDataAccessBuyers,
  getMonetizableDataPackages
};
