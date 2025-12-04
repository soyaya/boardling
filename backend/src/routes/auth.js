/**
 * Authentication Routes
 * Handles user registration, login, and password management
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { pool } from '../config/appConfig.js';
import { authenticateJWT } from '../middleware/auth.js';
import { initializeFreeTrial } from '../services/subscriptionService.js';

const router = express.Router();

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

/**
 * Register new user
 * POST /auth/register
 */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'All fields are required: name, email, password'
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'ALREADY_EXISTS',
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user with onboarding_completed = false
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, onboarding_completed)
       VALUES ($1, $2, $3, false)
       RETURNING id, name, email, onboarding_completed, created_at`,
      [name, email.toLowerCase(), password_hash]
    );

    const user = result.rows[0];

    // Initialize free trial for new user
    try {
      await initializeFreeTrial(user.id);
    } catch (error) {
      console.error('Failed to initialize free trial:', error);
      // Don't fail registration if trial initialization fails
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboarding_completed: user.onboarding_completed || false,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to register user'
    });
  }
});

/**
 * Login user
 * POST /auth/login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'AUTH_INVALID',
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Check if password_hash exists
    if (!user.password_hash || typeof user.password_hash !== 'string') {
      console.error('Invalid password_hash for user:', user.email);
      return res.status(401).json({
        error: 'AUTH_INVALID',
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'AUTH_INVALID',
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Check if user has projects/wallets for onboarding status
    let hasProject = false;
    let hasWallet = false;
    
    if (!user.onboarding_completed) {
      const projectCheck = await pool.query(
        'SELECT id FROM projects WHERE user_id = $1 LIMIT 1',
        [user.id]
      );
      hasProject = projectCheck.rows.length > 0;
      
      if (hasProject) {
        const walletCheck = await pool.query(
          'SELECT id FROM wallets WHERE project_id = $1 LIMIT 1',
          [projectCheck.rows[0].id]
        );
        hasWallet = walletCheck.rows.length > 0;
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        subscription_status: user.subscription_status,
        subscription_expires_at: user.subscription_expires_at,
        onboarding_completed: user.onboarding_completed,
        has_project: hasProject,
        has_wallet: hasWallet
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to login'
    });
  }
});

/**
 * Logout user (client-side token removal)
 * POST /auth/logout
 */
router.post('/logout', authenticateJWT, (req, res) => {
  // JWT logout is handled client-side by removing the token
  // This endpoint exists for consistency and future server-side token blacklisting
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * Change password
 * POST /auth/change-password
 */
router.post('/change-password', authenticateJWT, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Current password and new password are required'
      });
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get user
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'AUTH_INVALID',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to change password'
    });
  }
});

/**
 * Forgot password - Generate reset token
 * POST /auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Validation
    if (!email) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email is required'
      });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Don't reveal if email exists for security
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      });
    }

    const user = result.rows[0];

    // Generate reset token (15 minute expiration)
    const resetToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        purpose: 'password_reset'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // In production, send this via email
    // For now, return it in the response for testing
    res.json({
      success: true,
      message: 'Password reset token generated',
      resetToken // Remove this in production - send via email instead
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process password reset request'
    });
  }
});

/**
 * Reset password with token
 * POST /auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    // Validation
    if (!resetToken || !newPassword) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Reset token and new password are required'
      });
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'New password must be at least 8 characters long'
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        error: 'AUTH_INVALID',
        message: 'Invalid or expired reset token'
      });
    }

    // Verify token purpose
    if (decoded.purpose !== 'password_reset') {
      return res.status(401).json({
        error: 'AUTH_INVALID',
        message: 'Invalid reset token'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, decoded.id]
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to reset password'
    });
  }
});

/**
 * Verify email (placeholder for future implementation)
 * GET /auth/verify-email
 */
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    if (!token) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Verification token is required'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        error: 'AUTH_INVALID',
        message: 'Invalid or expired verification token'
      });
    }

    // In production, update user's email_verified status
    // For now, just return success
    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to verify email'
    });
  }
});

/**
 * Get current user info
 * GET /auth/me
 */
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get user information'
    });
  }
});

export default router;
