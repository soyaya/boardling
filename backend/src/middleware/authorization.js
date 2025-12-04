/**
 * Authorization middleware for resource ownership and admin access control
 * 
 * This middleware provides:
 * - User ownership verification for resources (projects, wallets, etc.)
 * - Admin permission checking for admin-only endpoints
 * - Resource access control based on user permissions
 */

import { pool } from '../config/appConfig.js';
import { ForbiddenError, NotFoundError } from '../errors/index.js';

/**
 * Verify that the authenticated user owns the specified resource
 * 
 * @param {string} resourceType - Type of resource (e.g., 'project', 'wallet', 'invoice')
 * @param {string} paramName - Name of the route parameter containing the resource ID (default: 'id')
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/projects/:id', authenticateJWT, requireOwnership('project'), getProjectController);
 * router.put('/wallets/:walletId', authenticateJWT, requireOwnership('wallet', 'walletId'), updateWalletController);
 */
export function requireOwnership(resourceType, paramName = 'id') {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        throw new ForbiddenError('Authentication required');
      }

      const resourceId = req.params[paramName];
      
      if (!resourceId) {
        throw new ForbiddenError(`Missing ${paramName} parameter`);
      }

      const userId = req.user.id;
      let query;
      let tableName;

      // Determine the appropriate table and query based on resource type
      switch (resourceType.toLowerCase()) {
        case 'project':
          tableName = 'projects';
          query = 'SELECT user_id FROM projects WHERE id = $1';
          break;
        
        case 'wallet':
          // Wallets are owned through projects
          tableName = 'wallets';
          query = `
            SELECT p.user_id 
            FROM wallets w
            JOIN projects p ON w.project_id = p.id
            WHERE w.id = $1
          `;
          break;
        
        case 'invoice':
          tableName = 'invoices';
          query = 'SELECT user_id FROM invoices WHERE id = $1';
          break;
        
        case 'unified_invoice':
          tableName = 'unified_invoices';
          query = 'SELECT user_id FROM unified_invoices WHERE id = $1';
          break;
        
        case 'withdrawal':
          tableName = 'withdrawals';
          query = 'SELECT user_id FROM withdrawals WHERE id = $1';
          break;
        
        case 'api_key':
          tableName = 'api_keys';
          query = 'SELECT user_id FROM api_keys WHERE id = $1';
          break;
        
        default:
          throw new Error(`Unsupported resource type: ${resourceType}`);
      }

      // Query the database to check ownership
      const result = await pool.query(query, [resourceId]);

      if (result.rows.length === 0) {
        throw new NotFoundError(`${resourceType} not found`);
      }

      const resourceOwnerId = result.rows[0].user_id;

      // Verify ownership
      if (resourceOwnerId !== userId) {
        throw new ForbiddenError(`You do not have permission to access this ${resourceType}`);
      }

      // Ownership verified, proceed to next middleware
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Verify that the authenticated user has admin privileges
 * 
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/admin/stats', authenticateJWT, requireAdmin, getStatsController);
 */
export async function requireAdmin(req, res, next) {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      throw new ForbiddenError('Authentication required');
    }

    // Check if user has admin privileges
    const result = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new ForbiddenError('User not found');
    }

    const isAdmin = result.rows[0].is_admin;

    if (!isAdmin) {
      throw new ForbiddenError('Admin privileges required');
    }

    // Admin verified, proceed to next middleware
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Verify that the authenticated user can access the specified resource
 * This is a more flexible version that allows both owners and admins to access resources
 * 
 * @param {string} resourceType - Type of resource (e.g., 'project', 'wallet', 'invoice')
 * @param {string} paramName - Name of the route parameter containing the resource ID (default: 'id')
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/projects/:id', authenticateJWT, requireAccess('project'), getProjectController);
 */
export function requireAccess(resourceType, paramName = 'id') {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        throw new ForbiddenError('Authentication required');
      }

      const resourceId = req.params[paramName];
      
      if (!resourceId) {
        throw new ForbiddenError(`Missing ${paramName} parameter`);
      }

      const userId = req.user.id;

      // Check if user is admin
      const adminResult = await pool.query(
        'SELECT is_admin FROM users WHERE id = $1',
        [userId]
      );

      if (adminResult.rows.length === 0) {
        throw new ForbiddenError('User not found');
      }

      const isAdmin = adminResult.rows[0].is_admin;

      // Admins have access to all resources
      if (isAdmin) {
        req.isAdmin = true;
        return next();
      }

      // For non-admins, verify ownership
      let query;

      switch (resourceType.toLowerCase()) {
        case 'project':
          query = 'SELECT user_id FROM projects WHERE id = $1';
          break;
        
        case 'wallet':
          query = `
            SELECT p.user_id 
            FROM wallets w
            JOIN projects p ON w.project_id = p.id
            WHERE w.id = $1
          `;
          break;
        
        case 'invoice':
          query = 'SELECT user_id FROM invoices WHERE id = $1';
          break;
        
        case 'unified_invoice':
          query = 'SELECT user_id FROM unified_invoices WHERE id = $1';
          break;
        
        case 'withdrawal':
          query = 'SELECT user_id FROM withdrawals WHERE id = $1';
          break;
        
        case 'api_key':
          query = 'SELECT user_id FROM api_keys WHERE id = $1';
          break;
        
        default:
          throw new Error(`Unsupported resource type: ${resourceType}`);
      }

      const result = await pool.query(query, [resourceId]);

      if (result.rows.length === 0) {
        throw new NotFoundError(`${resourceType} not found`);
      }

      const resourceOwnerId = result.rows[0].user_id;

      if (resourceOwnerId !== userId) {
        throw new ForbiddenError(`You do not have permission to access this ${resourceType}`);
      }

      // Access granted
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Verify that the user in the request body or params matches the authenticated user
 * Useful for endpoints that modify user data
 * 
 * @param {string} location - Where to find the user ID ('body' or 'params')
 * @param {string} fieldName - Name of the field containing the user ID (default: 'userId')
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.put('/users/:userId', authenticateJWT, requireSelfOrAdmin('params', 'userId'), updateUserController);
 */
export function requireSelfOrAdmin(location = 'params', fieldName = 'userId') {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        throw new ForbiddenError('Authentication required');
      }

      const targetUserId = location === 'body' ? req.body[fieldName] : req.params[fieldName];
      
      if (!targetUserId) {
        throw new ForbiddenError(`Missing ${fieldName} in ${location}`);
      }

      const currentUserId = req.user.id;

      // Check if user is trying to access their own data
      if (targetUserId === currentUserId) {
        return next();
      }

      // Check if user is admin
      const result = await pool.query(
        'SELECT is_admin FROM users WHERE id = $1',
        [currentUserId]
      );

      if (result.rows.length === 0) {
        throw new ForbiddenError('User not found');
      }

      const isAdmin = result.rows[0].is_admin;

      if (!isAdmin) {
        throw new ForbiddenError('You can only access your own data');
      }

      // Admin or self access granted
      req.isAdmin = true;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default {
  requireOwnership,
  requireAdmin,
  requireAccess,
  requireSelfOrAdmin
};
