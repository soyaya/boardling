// routes/auth.js
import express from 'express';
import { register, login, changePassword, forgotPassword, resetPassword } from '../controllers/user.js';
import { authenticateToken } from '../middleware/users.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/change-password', authenticateToken, changePassword); // protected route
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
