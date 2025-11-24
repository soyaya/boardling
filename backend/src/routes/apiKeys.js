/**
 * API Keys management routes
 */

import express from "express";
import { pool } from "../config/appConfig.js";
import {
  generateApiKey,
  hashApiKey,
  authenticateApiKey,
  requirePermission,
} from "../middleware/auth.js";

const router = express.Router();

/**
 * Create new API key
 * POST /api/keys/create
 */
router.post("/create", async (req, res) => {
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
      VALUES ($1, $2, $3, $4, $5, true)
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
        permissions: JSON.parse(keyRecord.permissions),
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

/**
 * List API keys for a user
 * GET /api/keys/user/:user_id
 */
router.get("/user/:user_id", authenticateApiKey, async (req, res) => {
  const { user_id } = req.params;

  try {
    // Check if requesting own keys or has admin permission
    if (
      req.apiKey.user_id !== user_id &&
      !req.apiKey.permissions.includes("admin")
    ) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Can only view your own API keys",
      });
    }

    const result = await pool.query(
      `
      SELECT id, name, permissions, expires_at, created_at, last_used_at, usage_count, is_active
      FROM api_keys 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `,
      [user_id]
    );

    const keys = result.rows.map((key) => ({
      ...key,
      permissions:
        typeof key.permissions === "string"
          ? JSON.parse(key.permissions)
          : key.permissions,
      key_hash: undefined, // Never return the hash
    }));

    res.json({
      success: true,
      api_keys: keys,
      total: keys.length,
    });
  } catch (error) {
    console.error("API keys list error:", error);
    res.status(500).json({
      error: "Failed to list API keys",
      message: error.message,
    });
  }
});

/**
 * Get API key details
 * GET /api/keys/:key_id
 */
router.get("/:key_id", authenticateApiKey, async (req, res) => {
  const { key_id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT ak.*, u.email as user_email
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.id = $1
    `,
      [key_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "API key not found" });
    }

    const keyRecord = result.rows[0];

    // Check permissions
    if (
      req.apiKey.user_id !== keyRecord.user_id &&
      !req.apiKey.permissions.includes("admin")
    ) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Can only view your own API keys",
      });
    }

    res.json({
      success: true,
      api_key: {
        id: keyRecord.id,
        name: keyRecord.name,
        permissions:
          typeof keyRecord.permissions === "string"
            ? JSON.parse(keyRecord.permissions)
            : keyRecord.permissions,
        user_id: keyRecord.user_id,
        user_email: keyRecord.user_email,
        expires_at: keyRecord.expires_at,
        created_at: keyRecord.created_at,
        last_used_at: keyRecord.last_used_at,
        usage_count: keyRecord.usage_count,
        is_active: keyRecord.is_active,
      },
    });
  } catch (error) {
    console.error("API key details error:", error);
    res.status(500).json({
      error: "Failed to get API key details",
      message: error.message,
    });
  }
});

/**
 * Update API key
 * PUT /api/keys/:key_id
 */
router.put("/:key_id", authenticateApiKey, async (req, res) => {
  const { key_id } = req.params;
  const { name, permissions, is_active } = req.body;

  try {
    // Get current key record
    const currentResult = await pool.query(
      "SELECT * FROM api_keys WHERE id = $1",
      [key_id]
    );
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "API key not found" });
    }

    const currentKey = currentResult.rows[0];

    // Check permissions
    if (
      req.apiKey.user_id !== currentKey.user_id &&
      !req.apiKey.permissions.includes("admin")
    ) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Can only modify your own API keys",
      });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: "permissions must be an array" });
      }
      updates.push(`permissions = $${paramCount++}`);
      values.push(JSON.stringify(permissions));
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(key_id);

    const result = await pool.query(
      `
      UPDATE api_keys 
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, name, permissions, expires_at, is_active, updated_at
    `,
      values
    );

    const updatedKey = result.rows[0];

    res.json({
      success: true,
      api_key: {
        ...updatedKey,
        permissions:
          typeof updatedKey.permissions === "string"
            ? JSON.parse(updatedKey.permissions)
            : updatedKey.permissions,
      },
    });
  } catch (error) {
    console.error("API key update error:", error);
    res.status(500).json({
      error: "Failed to update API key",
      message: error.message,
    });
  }
});

/**
 * Delete API key
 * DELETE /api/keys/:key_id
 */
router.delete("/:key_id", authenticateApiKey, async (req, res) => {
  const { key_id } = req.params;

  try {
    // Get current key record
    const currentResult = await pool.query(
      "SELECT * FROM api_keys WHERE id = $1",
      [key_id]
    );
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "API key not found" });
    }

    const currentKey = currentResult.rows[0];

    // Check permissions
    if (
      req.apiKey.user_id !== currentKey.user_id &&
      !req.apiKey.permissions.includes("admin")
    ) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Can only delete your own API keys",
      });
    }

    // Soft delete (deactivate)
    await pool.query(
      "UPDATE api_keys SET is_active = false, updated_at = NOW() WHERE id = $1",
      [key_id]
    );

    res.json({
      success: true,
      message: "API key deactivated successfully",
    });
  } catch (error) {
    console.error("API key deletion error:", error);
    res.status(500).json({
      error: "Failed to delete API key",
      message: error.message,
    });
  }
});

/**
 * Regenerate API key
 * POST /api/keys/:key_id/regenerate
 */
router.post("/:key_id/regenerate", authenticateApiKey, async (req, res) => {
  const { key_id } = req.params;

  try {
    // Get current key record
    const currentResult = await pool.query(
      "SELECT * FROM api_keys WHERE id = $1",
      [key_id]
    );
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "API key not found" });
    }

    const currentKey = currentResult.rows[0];

    // Check permissions
    if (
      req.apiKey.user_id !== currentKey.user_id &&
      !req.apiKey.permissions.includes("admin")
    ) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Can only regenerate your own API keys",
      });
    }

    // Generate new API key
    const newApiKey = generateApiKey();
    const newKeyHash = hashApiKey(newApiKey);

    // Update the key hash
    const result = await pool.query(
      `
      UPDATE api_keys 
      SET key_hash = $1, updated_at = NOW(), usage_count = 0, last_used_at = NULL
      WHERE id = $2
      RETURNING id, name, permissions, expires_at, updated_at
    `,
      [newKeyHash, key_id]
    );

    const updatedKey = result.rows[0];

    res.json({
      success: true,
      api_key: newApiKey, // Only returned once!
      key_info: {
        ...updatedKey,
        permissions:
          typeof updatedKey.permissions === "string"
            ? JSON.parse(updatedKey.permissions)
            : updatedKey.permissions,
      },
      warning: "Store this new API key securely. The old key is now invalid.",
    });
  } catch (error) {
    console.error("API key regeneration error:", error);
    res.status(500).json({
      error: "Failed to regenerate API key",
      message: error.message,
    });
  }
});

export default router;
