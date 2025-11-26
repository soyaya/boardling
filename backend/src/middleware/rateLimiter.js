// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per IP per window
  message: { error: 'Too many requests, please try again later' }
});

export { authLimiter };
