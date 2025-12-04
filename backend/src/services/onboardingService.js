/**
 * Onboarding Service
 * Handles the complete onboarding flow including project and wallet creation
 * in a single atomic transaction
 */

import { pool } from '../config/appConfig.js';
import { validateZcashAddress, detectAddressType } from '../utils/zcashAddress.js';
import { initializeWalletAnalytics } from '../models/analytics.js';

/**
 * Complete onboarding flow - creates project and wallet in a single transaction
 * @param {string} userId - User ID
 * @param {Object} onboardingData - Onboarding data
 * @param {Object} onboardingData.project - Project data
 * @param {string} onboardingData.project.name - Project name
 * @param {string} onboardingData.project.description - Project description
 * @param {string} onboardingData.project.category - Project category
 * @param {string} onboardingData.project.website_url - Project website URL (optional)
 * @param {string} onboardingData.project.github_url - Project GitHub URL (optional)
 * @param {Object} onboardingData.wallet - Wallet data
 * @param {string} onboardingData.wallet.address - Zcash address
 * @param {string} onboardingData.wallet.privacy_mode - Privacy mode (private, public, monetizable)
 * @param {string} onboardingData.wallet.description - Wallet description (optional)
 * @param {string} onboardingData.wallet.network - Network (mainnet, testnet)
 * @returns {Promise<Object>} Created project and wallet
 */
export async function completeOnboarding(userId, onboardingData) {
  const client = await pool.connect();
  
  try {
    // Validate input
    if (!onboardingData.project || !onboardingData.wallet) {
      throw new Error('Both project and wallet data are required');
    }

    const { project: projectData, wallet: walletData } = onboardingData;

    // Validate project data
    if (!projectData.name || !projectData.category) {
      throw new Error('Project name and category are required');
    }

    // Validate wallet data
    if (!walletData.address) {
      throw new Error('Wallet address is required');
    }

    const walletNetwork = walletData.network || 'mainnet';
    
    // Validate Zcash address
    const validation = validateZcashAddress(walletData.address.trim(), walletNetwork);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid Zcash address');
    }

    // Auto-detect wallet type
    const walletType = detectAddressType(walletData.address.trim(), walletNetwork);
    if (!walletType) {
      throw new Error('Could not detect wallet type from address');
    }

    // Validate privacy mode
    const validPrivacyModes = ['private', 'public', 'monetizable'];
    const privacyMode = walletData.privacy_mode || 'private';
    if (!validPrivacyModes.includes(privacyMode)) {
      throw new Error('Invalid privacy mode. Must be private, public, or monetizable');
    }

    // Start transaction
    await client.query('BEGIN');

    // 1. Create project with default wallet address
    const projectResult = await client.query(
      `INSERT INTO projects (user_id, name, description, category, website_url, github_url, status, default_wallet_address)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
       RETURNING *`,
      [
        userId,
        projectData.name,
        projectData.description || null,
        projectData.category,
        projectData.website_url || null,
        projectData.github_url || null,
        walletData.address.trim() // Set default wallet address immediately
      ]
    );

    const project = projectResult.rows[0];

    // 2. Create wallet linked to the project
    const walletResult = await client.query(
      `INSERT INTO wallets (project_id, address, type, privacy_mode, description, network, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [
        project.id,
        walletData.address.trim(),
        walletType,
        privacyMode,
        walletData.description || null,
        walletNetwork
      ]
    );

    const wallet = walletResult.rows[0];

    // 3. Mark user as onboarding completed
    await client.query(
      `UPDATE users 
       SET onboarding_completed = true, updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // Commit transaction
    await client.query('COMMIT');

    // Initialize wallet analytics (outside transaction - non-critical)
    try {
      await initializeWalletAnalytics(wallet.id);
    } catch (error) {
      console.warn(`Failed to initialize analytics for wallet ${wallet.id}:`, error.message);
      // Don't fail onboarding if analytics initialization fails
    }

    return {
      success: true,
      project,
      wallet,
      message: 'Onboarding completed successfully'
    };

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Onboarding error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if user has completed onboarding
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if onboarding is completed
 */
export async function isOnboardingCompleted(userId) {
  try {
    const result = await pool.query(
      'SELECT onboarding_completed FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0].onboarding_completed || false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    throw error;
  }
}

/**
 * Get user's onboarding status and data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Onboarding status and related data
 */
export async function getOnboardingStatus(userId) {
  try {
    const userResult = await pool.query(
      'SELECT id, name, email, onboarding_completed, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // If onboarding is completed, get the first project and wallet
    let project = null;
    let wallet = null;

    if (user.onboarding_completed) {
      const projectResult = await pool.query(
        'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1',
        [userId]
      );

      if (projectResult.rows.length > 0) {
        project = projectResult.rows[0];

        const walletResult = await pool.query(
          'SELECT * FROM wallets WHERE project_id = $1 ORDER BY created_at ASC LIMIT 1',
          [project.id]
        );

        if (walletResult.rows.length > 0) {
          wallet = walletResult.rows[0];
        }
      }
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      },
      onboarding_completed: user.onboarding_completed,
      project,
      wallet
    };
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    throw error;
  }
}

/**
 * Reset onboarding status (for testing/admin purposes)
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function resetOnboarding(userId) {
  try {
    await pool.query(
      `UPDATE users 
       SET onboarding_completed = false, updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    throw error;
  }
}
