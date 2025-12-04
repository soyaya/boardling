/**
 * Subscription Middleware
 * Middleware for checking subscription status and enforcing access control
 */

import { checkSubscriptionStatus, hasPremiumAccess } from '../services/subscriptionService.js';

/**
 * Middleware to check if user has an active subscription
 * Attaches subscription status to req.subscription
 */
export async function checkSubscription(req, res, next) {
  try {
    // User should be authenticated at this point (via auth middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'AUTH_REQUIRED',
        message: 'Authentication required'
      });
    }
    
    // Check subscription status
    const subscriptionStatus = await checkSubscriptionStatus(req.user.id);
    
    // Attach to request object
    req.subscription = subscriptionStatus;
    
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to check subscription status'
    });
  }
}

/**
 * Middleware to require an active subscription (free trial or premium)
 * Returns 403 if subscription is expired
 */
export function requireActiveSubscription(req, res, next) {
  if (!req.subscription) {
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Subscription status not checked. Use checkSubscription middleware first.'
    });
  }
  
  if (!req.subscription.isActive) {
    return res.status(403).json({
      error: 'SUBSCRIPTION_EXPIRED',
      message: 'Your subscription has expired. Please upgrade to continue.',
      details: {
        status: req.subscription.status,
        expiresAt: req.subscription.expiresAt
      }
    });
  }
  
  next();
}

/**
 * Middleware to require premium subscription
 * Returns 403 if user doesn't have premium access
 */
export function requirePremiumSubscription(req, res, next) {
  if (!req.subscription) {
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Subscription status not checked. Use checkSubscription middleware first.'
    });
  }
  
  if (!req.subscription.isPremium) {
    return res.status(403).json({
      error: 'PREMIUM_REQUIRED',
      message: 'This feature requires a premium subscription.',
      details: {
        currentStatus: req.subscription.status,
        upgradeRequired: true
      }
    });
  }
  
  next();
}

/**
 * Middleware to check if free trial is still active
 * Adds warning header if trial is expiring soon (< 7 days)
 */
export function checkTrialExpiration(req, res, next) {
  if (!req.subscription) {
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Subscription status not checked. Use checkSubscription middleware first.'
    });
  }
  
  // If on free trial and expiring soon, add warning header
  if (req.subscription.status === 'free' && req.subscription.daysRemaining <= 7 && req.subscription.daysRemaining > 0) {
    res.setHeader('X-Trial-Expiring', 'true');
    res.setHeader('X-Trial-Days-Remaining', req.subscription.daysRemaining.toString());
  }
  
  next();
}

/**
 * Middleware to allow access only during trial period
 * Useful for trial-specific features
 */
export function requireTrialStatus(req, res, next) {
  if (!req.subscription) {
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Subscription status not checked. Use checkSubscription middleware first.'
    });
  }
  
  if (req.subscription.status !== 'free') {
    return res.status(403).json({
      error: 'TRIAL_ONLY',
      message: 'This feature is only available during the free trial period.'
    });
  }
  
  next();
}

/**
 * Middleware to check subscription and add status to response
 * Non-blocking - always allows request to proceed
 */
export async function attachSubscriptionStatus(req, res, next) {
  try {
    if (req.user && req.user.id) {
      const subscriptionStatus = await checkSubscriptionStatus(req.user.id);
      req.subscription = subscriptionStatus;
      
      // Add subscription info to response headers
      res.setHeader('X-Subscription-Status', subscriptionStatus.status);
      res.setHeader('X-Subscription-Active', subscriptionStatus.isActive.toString());
      
      if (subscriptionStatus.daysRemaining !== null) {
        res.setHeader('X-Subscription-Days-Remaining', subscriptionStatus.daysRemaining.toString());
      }
    }
  } catch (error) {
    console.error('Error attaching subscription status:', error);
    // Don't block the request on error
  }
  
  next();
}

export default {
  checkSubscription,
  requireActiveSubscription,
  requirePremiumSubscription,
  checkTrialExpiration,
  requireTrialStatus,
  attachSubscriptionStatus
};
