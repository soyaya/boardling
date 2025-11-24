/**
 * Authentication middleware for API key validation
 */

import { pool } from '../config/appConfig.js';
import crypto from 'crypto';

/**
 * Generate a new API key
 */
export function generateApiKey() {
  return 'zp_' + crypto.randomBytes(32).toString('hex');
}

/**
 * Hash API key for storage
 */
export function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(apiKey) {
  return typeof apiKey === 'string' && apiKey.startsWith('zp_') && apiKey.length === 67;
}

/**
 * API key authentication middleware
 */
export async function authenticateApiKey(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Missing Authorization header',
        message: 'API key required. Use: Authorization: Bearer your-api-key'
      });
    }

    const [scheme, token] = authHeader.split(' ');
    
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        error: 'Invalid Authorization header format',
        message: 'Use: Authorization: Bearer your-api-key'
      });
    }

    if (!isValidApiKeyFormat(token)) {
      return res.status(401).json({
        error: 'Invalid API key format',
        message: 'API key must start with "zp_" and be 67 characters long'
      });
    }

    // Hash the provided key to compare with stored hash
    const hashedKey = hashApiKey(token);
    
    // Look up API key in database
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE key_hash = $1 AND is_active = true',
      [hashedKey]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'API key not found or inactive'
      });
    }

    const apiKeyRecord = result.rows[0];

    // Check if key is expired
    if (apiKeyRecord.expires_at && new Date() > apiKeyRecord.expires_at) {
      return res.status(401).json({
        error: 'API key expired',
        message: 'Please generate a new API key'
      });
    }

    // Update last used timestamp
    await pool.query(
      'UPDATE api_keys SET last_used_at = NOW(), usage_count = usage_count + 1 WHERE id = $1',
      [apiKeyRecord.id]
    );

    // Add API key info to request
    req.apiKey = {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      permissions: apiKeyRecord.permissions,
      user_id: apiKeyRecord.user_id,
      created_at: apiKeyRecord.created_at
    };

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
}

/**
 * Check if API key has specific permission
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'API key authentication required'
      });
    }

    const permissions = req.apiKey.permissions || [];
    
    if (!permissions.includes(permission) && !permissions.includes('admin')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Permission '${permission}' required`,
        required_permission: permission,
        your_permissions: permissions
      });
    }

    next();
  };
}

/**
 * Optional API key middleware (doesn't fail if no key provided)
 */
export async function optionalApiKey(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }

  // If auth header is provided, validate it
  return authenticateApiKey(req, res, next);
}