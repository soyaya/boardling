/**
 * Project Wallet Service
 * 
 * Handles project default wallet address management and indexing
 */

import pool from '../db/db.js';
import { processWalletTransactions } from './walletTrackingService.js';

/**
 * Ensure project has a default wallet address
 * If empty, fetch from database and index from Zcash
 * 
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Project with default wallet address
 */
export async function ensureDefaultWalletAddress(projectId) {
  try {
    // Get project
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new Error('Project not found');
    }

    let project = projectResult.rows[0];

    // If project already has a default wallet address, return it
    if (project.default_wallet_address) {
      return {
        success: true,
        project,
        message: 'Project already has default wallet address'
      };
    }

    // Try to get the first wallet for this project
    const walletResult = await pool.query(
      `SELECT * FROM wallets 
       WHERE project_id = $1 
       AND is_active = true 
       ORDER BY created_at ASC 
       LIMIT 1`,
      [projectId]
    );

    if (walletResult.rows.length === 0) {
      return {
        success: false,
        project,
        message: 'No wallets found for this project'
      };
    }

    const wallet = walletResult.rows[0];

    // Update project with default wallet address
    const updateResult = await pool.query(
      `UPDATE projects 
       SET default_wallet_address = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [wallet.address, projectId]
    );

    project = updateResult.rows[0];

    // Index the wallet from Zcash blockchain
    console.log(`Indexing wallet ${wallet.address} for project ${projectId}...`);
    
    try {
      await processWalletTransactions(wallet);
      console.log(`✓ Wallet ${wallet.address} indexed successfully`);
    } catch (indexError) {
      console.warn(`⚠ Failed to index wallet ${wallet.address}:`, indexError.message);
      // Don't fail the entire operation if indexing fails
    }

    return {
      success: true,
      project,
      wallet,
      message: 'Default wallet address set and indexed'
    };

  } catch (error) {
    console.error('Error ensuring default wallet address:', error);
    throw error;
  }
}

/**
 * Get project with default wallet address
 * Ensures the address is set and indexed
 * 
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Project with default wallet address
 */
export async function getProjectWithDefaultWallet(projectId, userId) {
  try {
    // Verify project belongs to user
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      throw new Error('Project not found or access denied');
    }

    let project = projectResult.rows[0];

    // Ensure default wallet address is set
    if (!project.default_wallet_address) {
      const result = await ensureDefaultWalletAddress(projectId);
      project = result.project;
    }

    return {
      success: true,
      data: project
    };

  } catch (error) {
    console.error('Error getting project with default wallet:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update project default wallet address
 * 
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID (for authorization)
 * @param {string} walletAddress - New default wallet address
 * @returns {Promise<Object>} Updated project
 */
export async function updateDefaultWalletAddress(projectId, userId, walletAddress) {
  try {
    // Verify project belongs to user
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      throw new Error('Project not found or access denied');
    }

    // Verify wallet exists and belongs to this project
    const walletResult = await pool.query(
      'SELECT * FROM wallets WHERE project_id = $1 AND address = $2',
      [projectId, walletAddress]
    );

    if (walletResult.rows.length === 0) {
      throw new Error('Wallet not found for this project');
    }

    const wallet = walletResult.rows[0];

    // Update project
    const updateResult = await pool.query(
      `UPDATE projects 
       SET default_wallet_address = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [walletAddress, projectId]
    );

    const project = updateResult.rows[0];

    // Index the wallet if not already indexed
    try {
      await processWalletTransactions(wallet);
    } catch (indexError) {
      console.warn(`⚠ Failed to index wallet ${walletAddress}:`, indexError.message);
    }

    return {
      success: true,
      data: project
    };

  } catch (error) {
    console.error('Error updating default wallet address:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Sync all projects' default wallet addresses
 * Useful for batch operations or migrations
 * 
 * @returns {Promise<Object>} Sync results
 */
export async function syncAllProjectDefaultWallets() {
  try {
    console.log('Starting sync of all project default wallet addresses...');

    // Get all projects without default wallet address
    const projectsResult = await pool.query(
      `SELECT p.id, p.name, p.user_id
       FROM projects p
       WHERE p.default_wallet_address IS NULL
       AND EXISTS (
         SELECT 1 FROM wallets w 
         WHERE w.project_id = p.id 
         AND w.is_active = true
       )`
    );

    const projects = projectsResult.rows;
    console.log(`Found ${projects.length} projects without default wallet address`);

    const results = [];

    for (const project of projects) {
      try {
        const result = await ensureDefaultWalletAddress(project.id);
        results.push({
          project_id: project.id,
          project_name: project.name,
          success: result.success,
          message: result.message
        });
      } catch (error) {
        console.error(`Failed to sync project ${project.id}:`, error.message);
        results.push({
          project_id: project.id,
          project_name: project.name,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✓ Synced ${successCount}/${projects.length} projects`);

    return {
      success: true,
      total: projects.length,
      synced: successCount,
      results
    };

  } catch (error) {
    console.error('Error syncing project default wallets:', error);
    throw error;
  }
}
