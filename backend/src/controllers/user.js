// controllers/authController.js
import { createUser, findUserByEmail, updatePassword } from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BadRequestError, UnauthenticatedError } from '../errors/index.js';

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw new BadRequestError('All fields are required');
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      throw new BadRequestError('Email already registered');
    }

    const user = await createUser(name, email, password);
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    if (err.message === 'Invalid email address') {
      return next(new BadRequestError('Invalid email address'));
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new BadRequestError('Email and password required');
    }

    const user = await findUserByEmail(email);
    if (!user) {
      throw new UnauthenticatedError('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthenticatedError('Invalid email or password');
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new BadRequestError('Both passwords required');
    }

    const user = await findUserByEmail(req.user.email);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      throw new BadRequestError('Current password is incorrect');
    }

    await updatePassword(user.id, newPassword);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      throw new BadRequestError('Email is required');
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token (in production, you'd send this via email)
    const resetToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    
    // In a real app, you'd save this token to database and send email
    // For testing purposes, we'll just return it
    res.status(200).json({ 
      message: 'Reset token generated (in production this would be sent via email)',
      resetToken // Remove this in production
    });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      throw new BadRequestError('Reset token and new password are required');
    }

    // Verify reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    
    // Update password
    await updatePassword(decoded.id, newPassword);
    
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new BadRequestError('Invalid or expired reset token'));
    }
    next(err);
  }
}

export { register, login, changePassword, forgotPassword, resetPassword };
