import pool from '../db/db.js';
import { initializeWalletAnalytics } from './analytics.js';

async function createWallet(walletData) {
  const { project_id, address, type, privacy_mode, description, network, is_active } = walletData;
  
  // Validate address format (basic validation)
  if (!address || address.trim().length === 0) {
    throw new Error('Wallet address is required');
  }

  // Validate wallet type
  const validTypes = ['t', 'z', 'u'];
  if (!validTypes.includes(type)) {
    throw new Error('Invalid wallet type. Must be t, z, or u');
  }

  // Validate privacy mode
  const validPrivacyModes = ['private', 'public', 'monetizable'];
  if (privacy_mode && !validPrivacyModes.includes(privacy_mode)) {
    throw new Error('Invalid privacy mode. Must be private, public, or monetizable');
  }

  // Validate network
  const validNetworks = ['mainnet', 'testnet'];
  if (network && !validNetworks.includes(network)) {
    throw new Error('Invalid network. Must be mainnet or testnet');
  }

  const result = await pool.query(
    `INSERT INTO wallets (project_id, address, type, privacy_mode, description, network, is_active) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      project_id, 
      address.trim(), 
      type, 
      privacy_mode || 'private', 
      description, 
      network || 'mainnet', 
      is_active !== undefined ? is_active : true
    ]
  );
  
  const wallet = result.rows[0];
  
  // Initialize analytics tracking for the new wallet
  try {
    await initializeWalletAnalytics(wallet.id);
  } catch (error) {
    console.warn(`Failed to initialize analytics for wallet ${wallet.id}:`, error.message);
    // Don't fail wallet creation if analytics initialization fails
  }
  
  return wallet;
}

async function getAllWalletsByProject(projectId) {
  const result = await pool.query(
    'SELECT * FROM wallets WHERE project_id = $1 ORDER BY created_at DESC',
    [projectId]
  );
  return result.rows;
}

async function getWalletById(walletId, projectId) {
  const result = await pool.query(
    'SELECT * FROM wallets WHERE id = $1 AND project_id = $2',
    [walletId, projectId]
  );
  return result.rows[0];
}

async function updateWallet(walletId, projectId, updateData) {
  const fields = [];
  const values = [];
  let paramCount = 1;

  // Build dynamic update query
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined && key !== 'id' && key !== 'project_id' && key !== 'created_at') {
      fields.push(`${key} = $${paramCount}`);
      values.push(updateData[key]);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(walletId, projectId);
  
  const result = await pool.query(
    `UPDATE wallets SET ${fields.join(', ')}, updated_at = NOW() 
     WHERE id = $${paramCount} AND project_id = $${paramCount + 1} RETURNING *`,
    values
  );
  
  return result.rows[0];
}

async function deleteWallet(walletId, projectId) {
  const result = await pool.query(
    'DELETE FROM wallets WHERE id = $1 AND project_id = $2 RETURNING *',
    [walletId, projectId]
  );
  return result.rows[0];
}

async function getWalletsByUser(userId) {
  const result = await pool.query(
    `SELECT w.*, p.name as project_name, p.user_id 
     FROM wallets w 
     JOIN projects p ON w.project_id = p.id 
     WHERE p.user_id = $1 
     ORDER BY w.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getWalletsByType(projectId, walletType) {
  const result = await pool.query(
    'SELECT * FROM wallets WHERE project_id = $1 AND type = $2 ORDER BY created_at DESC',
    [projectId, walletType]
  );
  return result.rows;
}

async function getActiveWallets(projectId) {
  const result = await pool.query(
    'SELECT * FROM wallets WHERE project_id = $1 AND is_active = true ORDER BY created_at DESC',
    [projectId]
  );
  return result.rows;
}

export { 
  createWallet, 
  getAllWalletsByProject, 
  getWalletById, 
  updateWallet, 
  deleteWallet,
  getWalletsByUser,
  getWalletsByType,
  getActiveWallets
};