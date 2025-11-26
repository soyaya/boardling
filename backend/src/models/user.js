// models/user.js
import pool from '../db/db.js';
import bcrypt from 'bcryptjs';
import validator from 'validator';

async function createUser(name, email, password) {
  if (!validator.isEmail(email)) throw new Error('Invalid email address');
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [name, email, hashedPassword]
  );
  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

async function updatePassword(userId, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const result = await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [hashedPassword, userId]
  );
  return result.rows[0];
}

export { createUser, findUserByEmail, updatePassword };
