// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { UnauthenticatedError } from '../errors/index.js';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new UnauthenticatedError('Unauthorized: No token provided'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(new UnauthenticatedError('Forbidden: Invalid token'));
    }
    req.user = user;
    next();
  });
}

export { authenticateToken };
