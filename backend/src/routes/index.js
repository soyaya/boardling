/**
 * Modularized Route Index
 * Centralizes all route definitions with proper API key authentication
 */

import express from "express";

// Import individual route modules
import invoiceRouter from "./invoice.js";
import withdrawRouter from "./withdraw.js";
import adminRouter from "./admin.js";
import usersRouter from "./users.js";
import apiKeysRouter from "./apiKeys.js";
import shieldedRouter from "./shielded.js";
import webzjsRouter from "./webzjs.js";
import zcashDevtoolRouter from "./zcash-devtool.js";
import alternativesRouter from "./alternatives.js";
import unifiedRouter from "./unified.js";
import unifiedInvoiceRouter from "./unified-invoice.js";

// Import authentication middleware
import {
  authenticateApiKey,
  optionalApiKey,
  requirePermission,
} from "../middleware/auth.js";

// Import config and utilities
import { pool, config } from "../config/appConfig.js";
import { getBlockchainInfo } from "../config/zcash.js";

const router = express.Router();

/**
 * Public endpoints (no authentication required)
 */

// Health check endpoint
router.get("/health", async (req, res) => {
  const services = {
    database: "disconnected",
    zcash_rpc: "disconnected",
  };

  let overallStatus = "OK";
  let errors = [];

  try {
    // Test database connection
    await pool.query("SELECT 1");
    services.database = "connected";
  } catch (error) {
    console.error("Database health check failed:", error);
    services.database = "disconnected";
    errors.push(`Database: ${error.message}`);
    overallStatus = "DEGRADED";
  }

  try {
    // Test Zcash RPC connection
    const blockchainInfo = await getBlockchainInfo();
    services.zcash_rpc = "connected";
    services.node_blocks = blockchainInfo.blocks;
    services.node_chain = blockchainInfo.chain;
  } catch (error) {
    console.error("Zcash RPC health check failed:", error);
    services.zcash_rpc = "disconnected";
    errors.push(`Zcash RPC: ${error.message}`);
    // RPC being down is not critical for basic API functionality
    if (overallStatus === "OK") {
      overallStatus = "DEGRADED";
    }
  }

  // Return appropriate status code
  const statusCode =
    overallStatus === "OK" ? 200 : overallStatus === "DEGRADED" ? 200 : 500;

  res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
    errors: errors.length > 0 ? errors : undefined,
    version: "1.0.0",
  });
});

// SDK configuration endpoint
router.get("/api/config", (req, res) => {
  res.json({
    sdk: {
      baseURL: config.sdk.publicApiUrl,
      timeout: config.sdk.defaultTimeout,
      apiVersion: config.sdk.apiVersion,
      environment: config.nodeEnv,
    },
    server: {
      version: "1.0.0",
      status: "online",
    },
  });
});

// API documentation endpoint
router.get("/api", (req, res) => {
  res.json({
    name: "Zcash Paywall SDK",
    version: "1.0.0",
    description:
      "Production-ready Zcash paywall API with API key authentication",
    authentication: {
      type: "Bearer Token",
      header: "Authorization: Bearer zp_your_api_key_here",
      permissions: ["read", "write", "admin"],
      endpoints: {
        create_key: "POST /api/keys/create",
        manage_keys: "GET /api/keys/user/:user_id",
      },
    },
    sdk_config: "/api/config",
    endpoints: {
      users: {
        "POST /api/users/create": {
          auth: "optional",
          description: "Create new user",
        },
        "GET /api/users/:id": {
          auth: "optional",
          description: "Get user by ID",
        },
        "GET /api/users/email/:email": {
          auth: "optional",
          description: "Get user by email",
        },
        "PUT /api/users/:id": { auth: "optional", description: "Update user" },
        "GET /api/users/:id/balance": {
          auth: "optional",
          description: "Get user balance",
        },
        "GET /api/users": {
          auth: "required",
          permissions: ["admin"],
          description: "List all users",
        },
      },
      api_keys: {
        "POST /api/keys/create": {
          auth: "required",
          description: "Create API key",
        },
        "GET /api/keys/user/:user_id": {
          auth: "required",
          description: "List user API keys",
        },
        "GET /api/keys/:id": {
          auth: "required",
          description: "Get API key details",
        },
        "PUT /api/keys/:id": {
          auth: "required",
          description: "Update API key",
        },
        "DELETE /api/keys/:id": {
          auth: "required",
          description: "Deactivate API key",
        },
        "POST /api/keys/:id/regenerate": {
          auth: "required",
          description: "Regenerate API key",
        },
      },
      invoices: {
        "POST /api/invoice/unified/create": {
          auth: "optional",
          description: "Create unified payment invoice (supports all methods)",
        },
        "POST /api/invoice/unified/check": {
          auth: "optional",
          description: "Check unified payment status",
        },
        "GET /api/invoice/unified/:id": {
          auth: "optional",
          description: "Get unified invoice details",
        },
        "POST /api/invoice/create": {
          auth: "optional",
          description: "Create payment invoice (legacy transparent)",
        },
        "POST /api/invoice/check": {
          auth: "optional",
          description: "Check payment status (legacy)",
        },
        "GET /api/invoice/:id": {
          auth: "optional",
          description: "Get invoice details (legacy)",
        },
        "GET /api/invoice/:id/qr": {
          auth: "optional",
          description: "Get QR code image",
        },
        "GET /api/invoice/:id/uri": {
          auth: "optional",
          description: "Get payment URI",
        },
        "GET /api/invoice/user/:user_id": {
          auth: "optional",
          description: "List user invoices",
        },
      },
      withdrawals: {
        "POST /api/withdraw/create": {
          auth: "optional",
          description: "Create withdrawal request",
        },
        "GET /api/withdraw/:id": {
          auth: "optional",
          description: "Get withdrawal details",
        },
        "GET /api/withdraw/user/:user_id": {
          auth: "optional",
          description: "List user withdrawals",
        },
        "POST /api/withdraw/fee-estimate": {
          auth: "optional",
          description: "Get fee estimate",
        },
        "POST /api/withdraw/process/:id": {
          auth: "required",
          permissions: ["admin"],
          description: "Process withdrawal",
        },
      },
      admin: {
        "GET /api/admin/stats": {
          auth: "required",
          permissions: ["admin"],
          description: "Platform statistics",
        },
        "GET /api/admin/withdrawals/pending": {
          auth: "required",
          permissions: ["admin"],
          description: "Pending withdrawals",
        },
        "GET /api/admin/balances": {
          auth: "required",
          permissions: ["admin"],
          description: "User balances",
        },
        "GET /api/admin/revenue": {
          auth: "required",
          permissions: ["admin"],
          description: "Platform revenue",
        },
        "GET /api/admin/subscriptions": {
          auth: "required",
          permissions: ["admin"],
          description: "Active subscriptions",
        },
        "GET /api/admin/node-status": {
          auth: "required",
          permissions: ["admin"],
          description: "Zcash node status",
        },
      },
      shielded: {
        "POST /api/shielded/address/generate": {
          auth: "optional",
          description: "Generate new shielded address",
        },
        "POST /api/shielded/address/validate": {
          auth: "optional",
          description: "Validate shielded address",
        },
        "GET /api/shielded/address/:address/info": {
          auth: "optional",
          description: "Get shielded address info",
        },
        "POST /api/shielded/address/batch-generate": {
          auth: "optional",
          description: "Generate multiple shielded addresses",
        },
        "POST /api/shielded/wallet/create": {
          auth: "optional",
          description: "Create shielded wallet",
        },
        "GET /api/shielded/wallet/user/:user_id": {
          auth: "optional",
          description: "Get user shielded wallets",
        },
        "GET /api/shielded/wallet/:wallet_id/details": {
          auth: "optional",
          description: "Get shielded wallet details",
        },
        "POST /api/shielded/invoice/create": {
          auth: "optional",
          description: "Create shielded invoice",
        },
        "POST /api/shielded/invoice/check": {
          auth: "optional",
          description: "Check shielded invoice payment",
        },
        "GET /api/shielded/status": {
          auth: "optional",
          description: "Check Zaino service status",
        },
      },
      webzjs: {
        "GET /api/webzjs/config": {
          auth: "optional",
          description: "Get WebZjs configuration and setup",
        },
        "POST /api/webzjs/wallet/create": {
          auth: "optional",
          description: "Create WebZjs wallet configuration",
        },
        "GET /api/webzjs/wallet/user/:user_id": {
          auth: "optional",
          description: "Get user WebZjs wallets",
        },
        "GET /api/webzjs/wallet/:wallet_id/setup": {
          auth: "optional",
          description: "Get WebZjs wallet setup instructions",
        },
        "POST /api/webzjs/invoice/create": {
          auth: "optional",
          description: "Create WebZjs browser-based invoice",
        },
        "GET /api/webzjs/guide": {
          auth: "optional",
          description: "Get WebZjs setup guide and troubleshooting",
        },
      },
      zcash_devtool: {
        "GET /api/zcash-devtool/config": {
          auth: "optional",
          description: "Get zcash-devtool configuration and setup",
        },
        "POST /api/zcash-devtool/wallet/create": {
          auth: "optional",
          description: "Create zcash-devtool wallet configuration",
        },
        "GET /api/zcash-devtool/wallet/user/:user_id": {
          auth: "optional",
          description: "Get user zcash-devtool wallets",
        },
        "GET /api/zcash-devtool/wallet/:wallet_id/commands": {
          auth: "optional",
          description: "Get zcash-devtool CLI commands",
        },
        "POST /api/zcash-devtool/invoice/create": {
          auth: "optional",
          description: "Create zcash-devtool CLI-based invoice",
        },
        "GET /api/zcash-devtool/guide": {
          auth: "optional",
          description: "Get zcash-devtool setup guide and troubleshooting",
        },
      },
      alternatives: {
        "GET /api/alternatives/overview": {
          auth: "optional",
          description: "Get comprehensive overview of Zcash development alternatives",
        },
        "POST /api/alternatives/recommend": {
          auth: "optional",
          description: "Get personalized alternative recommendation",
        },
        "GET /api/alternatives/setup-comparison": {
          auth: "optional",
          description: "Compare setup complexity and features",
        },
      },
      unified: {
        "GET /api/unified/config": {
          auth: "optional",
          description: "Get ZIP-316 unified address configuration",
        },
        "POST /api/unified/address/create": {
          auth: "optional",
          description: "Create ZIP-316 compliant unified address",
        },
        "POST /api/unified/address/validate": {
          auth: "optional",
          description: "Validate unified address format",
        },
        "GET /api/unified/address/user/:user_id": {
          auth: "optional",
          description: "Get user's unified addresses",
        },
        "GET /api/unified/address/:address_id/details": {
          auth: "optional",
          description: "Get unified address details and receivers",
        },
        "POST /api/unified/invoice/create": {
          auth: "optional",
          description: "Create unified invoice for multiple pools",
        },
        "GET /api/unified/guide": {
          auth: "optional",
          description: "Get ZIP-316 implementation guide",
        },
      },
    },
    health_check: "GET /health",
  });
});

/**
 * API Routes with Authentication
 */

// API Key creation (public endpoint)
router.post("/api/keys/create", async (req, res) => {
  const { user_id, name, permissions, expires_in_days } = req.body;

  // Validation
  if (!user_id || !name) {
    return res.status(400).json({
      error: "Missing required fields: user_id, name",
    });
  }

  if (permissions && !Array.isArray(permissions)) {
    return res.status(400).json({
      error: "permissions must be an array",
    });
  }

  try {
    // Import auth functions
    const { generateApiKey, hashApiKey } = await import(
      "../middleware/auth.js"
    );

    // Verify user exists
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
      user_id,
    ]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);

    // Calculate expiration date
    let expiresAt = null;
    if (expires_in_days) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);
    }

    // Default permissions
    const defaultPermissions = permissions || ["read", "write"];

    // Insert API key record
    const result = await pool.query(
      `
      INSERT INTO api_keys (user_id, name, key_hash, permissions, expires_at, is_active)
      VALUES ($1, $2, $3, $4::jsonb, $5, true)
      RETURNING id, name, permissions, expires_at, created_at
    `,
      [user_id, name, keyHash, JSON.stringify(defaultPermissions), expiresAt]
    );

    const keyRecord = result.rows[0];

    res.status(201).json({
      success: true,
      api_key: apiKey, // Only returned once!
      key_info: {
        id: keyRecord.id,
        name: keyRecord.name,
        permissions: keyRecord.permissions,
        expires_at: keyRecord.expires_at,
        created_at: keyRecord.created_at,
      },
      warning: "Store this API key securely. It will not be shown again.",
    });
  } catch (error) {
    console.error("API key creation error:", error);
    res.status(500).json({
      error: "Failed to create API key",
      message: error.message,
    });
  }
});

// API Key management routes (require authentication)
router.use("/api/keys", authenticateApiKey, apiKeysRouter);

// User routes (mixed authentication requirements)
router.use("/api/users", usersRouter);

// Unified Invoice routes (recommended - supports all payment methods)
router.use("/api/invoice/unified", unifiedInvoiceRouter);

// Invoice routes (optional authentication - legacy transparent only)
router.use("/api/invoice", invoiceRouter);

// Withdrawal routes (mixed authentication requirements)
router.use("/api/withdraw", withdrawRouter);

// Admin routes (require admin permission)
router.use(
  "/api/admin",
  authenticateApiKey,
  requirePermission("admin"),
  adminRouter
);

// Shielded routes (optional authentication)
router.use("/api/shielded", shieldedRouter);

// Alternative Zcash development routes (optional authentication)
router.use("/api/webzjs", webzjsRouter);
router.use("/api/zcash-devtool", zcashDevtoolRouter);
router.use("/api/alternatives", alternativesRouter);

// Unified address routes (ZIP-316 compliant)
router.use("/api/unified", unifiedRouter);

/**
 * Error handling
 */

// 404 handler for API routes
router.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    message: `${req.method} ${req.originalUrl} is not a valid API endpoint`,
    available_endpoints: "/api",
  });
});

// 404 handler for all other routes
router.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
    available_endpoints: "/api",
  });
});

export default router;
