/**
 * Subscription Service
 * Handles subscription management, free trial initialization, and status checking
 */

import pool from '../db/db.js';

/**
 * Initialize a free trial for a new user
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Updated user subscription data
 */
export async function initializeFreeTrial(userId) {
  const client = await pool.connect();
  
  try {
    // Set free trial expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const result = await client.query(
      `UPDATE users 
       SET subscription_status = 'free',
           subscription_expires_at = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, subscription_status, subscription_expires_at`,
      [expiresAt, userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Check if a user's subscription is active
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Subscription status information
 */
export async function checkSubscriptionStatus(userId) {
  const result = await pool.query(
    `SELECT id, subscription_status, subscription_expires_at
     FROM users
     WHERE id = $1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const user = result.rows[0];
  const now = new Date();
  
  // Check if subscription has expired
  const isExpired = user.subscription_expires_at && new Date(user.subscription_expires_at) < now;
  const isActive = !isExpired && (user.subscription_status === 'free' || user.subscription_status === 'premium' || user.subscription_status === 'enterprise');
  
  // Calculate days remaining
  let daysRemaining = null;
  if (user.subscription_expires_at) {
    const diffTime = new Date(user.subscription_expires_at) - now;
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  return {
    userId: user.id,
    status: user.subscription_status,
    expiresAt: user.subscription_expires_at,
    isActive,
    isExpired,
    daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
    isPremium: user.subscription_status === 'premium' || user.subscription_status === 'enterprise'
  };
}

/**
 * Update subscription status (e.g., after payment)
 * @param {string} userId - User UUID
 * @param {string} newStatus - New subscription status ('free', 'premium', 'enterprise')
 * @param {Date|null} expiresAt - Expiration date (null for permanent)
 * @returns {Promise<Object>} Updated subscription data
 */
export async function updateSubscriptionStatus(userId, newStatus, expiresAt = null) {
  const validStatuses = ['free', 'premium', 'enterprise'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid subscription status: ${newStatus}`);
  }
  
  const result = await pool.query(
    `UPDATE users 
     SET subscription_status = $1,
         subscription_expires_at = $2,
         updated_at = NOW()
     WHERE id = $3
     RETURNING id, subscription_status, subscription_expires_at`,
    [newStatus, expiresAt, userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  return result.rows[0];
}

/**
 * Upgrade user to premium subscription
 * @param {string} userId - User UUID
 * @param {number} durationMonths - Subscription duration in months
 * @returns {Promise<Object>} Updated subscription data
 */
export async function upgradeToPremium(userId, durationMonths = 1) {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
  
  return updateSubscriptionStatus(userId, 'premium', expiresAt);
}

/**
 * Get subscription details for a user
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Detailed subscription information
 */
export async function getSubscriptionDetails(userId) {
  const status = await checkSubscriptionStatus(userId);
  
  // Get additional user info
  const result = await pool.query(
    `SELECT onboarding_completed, balance_zec, created_at
     FROM users
     WHERE id = $1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const user = result.rows[0];
  
  return {
    ...status,
    onboardingCompleted: user.onboarding_completed,
    balance: parseFloat(user.balance_zec || 0),
    memberSince: user.created_at
  };
}

/**
 * Check if user has access to premium features
 * @param {string} userId - User UUID
 * @returns {Promise<boolean>} True if user has premium access
 */
export async function hasPremiumAccess(userId) {
  const status = await checkSubscriptionStatus(userId);
  return status.isActive && (status.status === 'premium' || status.status === 'enterprise');
}

/**
 * Mark user's onboarding as completed
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Updated user data
 */
export async function completeOnboarding(userId) {
  const result = await pool.query(
    `UPDATE users 
     SET onboarding_completed = true,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, onboarding_completed`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  return result.rows[0];
}

/**
 * Get all users with expired subscriptions
 * @returns {Promise<Array>} List of users with expired subscriptions
 */
export async function getExpiredSubscriptions() {
  const result = await pool.query(
    `SELECT id, email, subscription_status, subscription_expires_at
     FROM users
     WHERE subscription_expires_at < NOW()
     AND subscription_status IN ('free', 'premium')
     ORDER BY subscription_expires_at DESC`
  );
  
  return result.rows;
}

export default {
  initializeFreeTrial,
  checkSubscriptionStatus,
  updateSubscriptionStatus,
  upgradeToPremium,
  getSubscriptionDetails,
  hasPremiumAccess,
  completeOnboarding,
  getExpiredSubscriptions
};
