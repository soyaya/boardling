import express from 'express';
import { pool } from '../config/appConfig.js';
import { optionalApiKey, authenticateApiKey, requirePermission } from '../middleware/auth.js';

const router = express.Router();

/**
 * Create new user
 * POST /api/users/create
 */
router.post('/create', optionalApiKey, async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
      [email, name || null]
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create user',
      details: error.message 
    });
  }
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
router.get('/:id', optionalApiKey, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Failed to get user',
      details: error.message 
    });
  }
});

/**
 * Get user by email
 * GET /api/users/email/:email
 */
router.get('/email/:email', optionalApiKey, async (req, res) => {
  const { email } = req.params;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('Get user by email error:', error);
    res.status(500).json({ 
      error: 'Failed to get user',
      details: error.message 
    });
  }
});

/**
 * Update user
 * PUT /api/users/:id
 */
router.put('/:id', optionalApiKey, async (req, res) => {
  const { id } = req.params;
  const { email, name } = req.body;

  if (!email && !name) {
    return res.status(400).json({ error: 'At least one field (email or name) is required' });
  }

  try {
    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Check if email is already taken by another user
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2', 
        [email, id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Email already taken by another user' });
      }

      updates.push(`email = $${++paramCount}`);
      values.push(email);
    }

    if (name !== undefined) {
      updates.push(`name = $${++paramCount}`);
      values.push(name);
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${++paramCount} RETURNING *`;

    const result = await pool.query(query, values);
    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: error.message 
    });
  }
});

/**
 * Get user balance and activity
 * GET /api/users/:id/balance
 */
router.get('/:id/balance', optionalApiKey, async (req, res) => {
  const { id } = req.params;

  try {
    // Get user balance from view
    const balanceResult = await pool.query(
      'SELECT * FROM user_balances WHERE id = $1',
      [id]
    );

    if (balanceResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const balance = balanceResult.rows[0];

    res.json({
      success: true,
      balance: {
        user_id: balance.id,
        email: balance.email,
        name: balance.name,
        total_received_zec: parseFloat(balance.total_received_zec),
        total_withdrawn_zec: parseFloat(balance.total_withdrawn_zec),
        available_balance_zec: parseFloat(balance.available_balance_zec),
        total_invoices: parseInt(balance.total_invoices),
        total_withdrawals: parseInt(balance.total_withdrawals)
      }
    });

  } catch (error) {
    console.error('Get user balance error:', error);
    res.status(500).json({ 
      error: 'Failed to get user balance',
      details: error.message 
    });
  }
});

/**
 * List users with pagination (Admin only)
 * GET /api/users
 */
router.get('/', authenticateApiKey, requirePermission('admin'), async (req, res) => {
  const { limit = 50, offset = 0, search } = req.query;

  try {
    let query = 'SELECT * FROM users';
    const params = [];
    let paramCount = 0;

    if (search) {
      query += ` WHERE email ILIKE $${++paramCount} OR name ILIKE $${++paramCount}`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM users';
    let countParams = [];
    if (search) {
      countQuery += ' WHERE email ILIKE $1 OR name ILIKE $2';
      countParams = [`%${search}%`, `%${search}%`];
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      users: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: totalCount,
        has_more: parseInt(offset) + result.rows.length < totalCount
      }
    });

  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ 
      error: 'Failed to list users',
      details: error.message 
    });
  }
});

export default router;