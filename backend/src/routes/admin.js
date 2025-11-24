import express from "express";
import { pool } from "../config/appConfig.js";
import { getBlockchainInfo } from "../config/zcash.js";

const router = express.Router();

/**
 * Get platform statistics
 * GET /api/admin/stats
 */
router.get("/stats", async (req, res) => {
  try {
    // Get basic stats
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM invoices WHERE status = 'paid') as paid_invoices,
        (SELECT COUNT(*) FROM invoices WHERE status = 'pending') as pending_invoices,
        (SELECT COUNT(*) FROM withdrawals WHERE status = 'sent') as completed_withdrawals,
        (SELECT COUNT(*) FROM withdrawals WHERE status = 'pending') as pending_withdrawals,
        (SELECT COALESCE(SUM(paid_amount_zec), 0) FROM invoices WHERE status = 'paid') as total_revenue_zec,
        (SELECT COALESCE(SUM(fee_zec), 0) FROM withdrawals WHERE status = 'sent') as total_fees_earned_zec
    `;

    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];

    // Get recent activity
    const recentInvoices = await pool.query(`
      SELECT i.id, i.type, i.amount_zec, i.status, i.created_at, u.email
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `);

    const recentWithdrawals = await pool.query(`
      SELECT w.id, w.amount_zec, w.fee_zec, w.status, w.requested_at, u.email
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.requested_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: {
        users: {
          total: parseInt(stats.total_users),
        },
        invoices: {
          paid: parseInt(stats.paid_invoices),
          pending: parseInt(stats.pending_invoices),
        },
        withdrawals: {
          completed: parseInt(stats.completed_withdrawals),
          pending: parseInt(stats.pending_withdrawals),
        },
        revenue: {
          total_zec: parseFloat(stats.total_revenue_zec),
          fees_earned_zec: parseFloat(stats.total_fees_earned_zec),
        },
      },
      recent_activity: {
        invoices: recentInvoices.rows.map((inv) => ({
          id: inv.id,
          type: inv.type,
          amount_zec: parseFloat(inv.amount_zec),
          status: inv.status,
          user_email: inv.email,
          created_at: inv.created_at,
        })),
        withdrawals: recentWithdrawals.rows.map((w) => ({
          id: w.id,
          amount_zec: parseFloat(w.amount_zec),
          fee_zec: parseFloat(w.fee_zec),
          status: w.status,
          user_email: w.email,
          requested_at: w.requested_at,
        })),
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({
      error: "Failed to get platform statistics",
      details: error.message,
    });
  }
});

/**
 * Get pending withdrawals for processing
 * GET /api/admin/withdrawals/pending
 */
router.get("/withdrawals/pending", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, u.email, u.name
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      WHERE w.status = 'pending'
      ORDER BY w.requested_at ASC
    `);

    res.json({
      success: true,
      pending_withdrawals: result.rows.map((w) => ({
        id: w.id,
        user_id: w.user_id,
        user_email: w.email,
        user_name: w.name,
        amount_zec: parseFloat(w.amount_zec),
        fee_zec: parseFloat(w.fee_zec),
        net_zec: parseFloat(w.net_zec),
        to_address: w.to_address,
        requested_at: w.requested_at,
      })),
    });
  } catch (error) {
    console.error("Get pending withdrawals error:", error);
    res.status(500).json({
      error: "Failed to get pending withdrawals",
      details: error.message,
    });
  }
});

/**
 * Get user balances
 * GET /api/admin/balances
 */
router.get("/balances", async (req, res) => {
  const { limit = 50, offset = 0, min_balance = 0 } = req.query;

  try {
    const result = await pool.query(
      `
      SELECT * FROM user_balances 
      WHERE available_balance_zec >= $1
      ORDER BY available_balance_zec DESC
      LIMIT $2 OFFSET $3
    `,
      [parseFloat(min_balance), parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      balances: result.rows.map((balance) => ({
        user_id: balance.id,
        email: balance.email,
        name: balance.name,
        total_received_zec: parseFloat(balance.total_received_zec),
        total_withdrawn_zec: parseFloat(balance.total_withdrawn_zec),
        available_balance_zec: parseFloat(balance.available_balance_zec),
        total_invoices: parseInt(balance.total_invoices),
        total_withdrawals: parseInt(balance.total_withdrawals),
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Get balances error:", error);
    res.status(500).json({
      error: "Failed to get user balances",
      details: error.message,
    });
  }
});

/**
 * Get platform revenue details
 * GET /api/admin/revenue
 */
router.get("/revenue", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM platform_revenue");
    const revenue = result.rows[0];

    // Get monthly revenue breakdown
    const monthlyResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', processed_at) as month,
        SUM(fee_zec) as fees_earned,
        COUNT(*) as withdrawals_count
      FROM withdrawals 
      WHERE status = 'sent' AND processed_at IS NOT NULL
      GROUP BY DATE_TRUNC('month', processed_at)
      ORDER BY month DESC
      LIMIT 12
    `);

    res.json({
      success: true,
      total_revenue: {
        total_fees_earned_zec: parseFloat(revenue?.total_fees_earned_zec || 0),
        total_withdrawals: parseInt(revenue?.total_withdrawals || 0),
        avg_fee_per_withdrawal: parseFloat(
          revenue?.avg_fee_per_withdrawal || 0
        ),
        min_fee: parseFloat(revenue?.min_fee || 0),
        max_fee: parseFloat(revenue?.max_fee || 0),
      },
      monthly_breakdown: monthlyResult.rows.map((row) => ({
        month: row.month,
        fees_earned_zec: parseFloat(row.fees_earned),
        withdrawals_count: parseInt(row.withdrawals_count),
      })),
    });
  } catch (error) {
    console.error("Get revenue error:", error);
    res.status(500).json({
      error: "Failed to get revenue data",
      details: error.message,
    });
  }
});

/**
 * Get active subscriptions
 * GET /api/admin/subscriptions
 */
router.get("/subscriptions", async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  try {
    const result = await pool.query(
      `
      SELECT * FROM active_subscriptions
      ORDER BY expires_at ASC
      LIMIT $1 OFFSET $2
    `,
      [parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      active_subscriptions: result.rows.map((sub) => ({
        user_id: sub.user_id,
        email: sub.email,
        expires_at: sub.expires_at,
        paid_amount_zec: parseFloat(sub.paid_amount_zec),
        created_at: sub.created_at,
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({
      error: "Failed to get active subscriptions",
      details: error.message,
    });
  }
});

/**
 * Get Zcash node status
 * GET /api/admin/node-status
 */
router.get("/node-status", async (req, res) => {
  try {
    const blockchainInfo = await getBlockchainInfo();

    res.json({
      success: true,
      node_status: {
        chain: blockchainInfo.chain,
        blocks: blockchainInfo.blocks,
        headers: blockchainInfo.headers,
        verification_progress: blockchainInfo.verificationprogress,
        size_on_disk: blockchainInfo.size_on_disk,
        pruned: blockchainInfo.pruned,
        difficulty: blockchainInfo.difficulty,
      },
    });
  } catch (error) {
    console.error("Node status error:", error);
    res.status(500).json({
      error: "Failed to get node status",
      details: error.message,
    });
  }
});

export default router;
