import { CustomAPIError } from '../errors/index.js';
import crypto from 'crypto';

/**
 * Error code mapping for common error scenarios
 */
const ERROR_CODE_MAP = {
  // Authentication errors
  'JsonWebTokenError': 'AUTH_INVALID',
  'TokenExpiredError': 'AUTH_EXPIRED',
  'NotBeforeError': 'AUTH_INVALID',
  
  // Database errors
  '23505': 'ALREADY_EXISTS', // PostgreSQL unique violation
  '23503': 'NOT_FOUND', // PostgreSQL foreign key violation
  '23502': 'VALIDATION_ERROR', // PostgreSQL not null violation
  '23514': 'VALIDATION_ERROR', // PostgreSQL check violation
  
  // Rate limiting
  'RATE_LIMIT': 'RATE_LIMIT_EXCEEDED',
  
  // Blockchain errors
  'BLOCKCHAIN_ERROR': 'BLOCKCHAIN_ERROR',
  
  // Privacy errors
  'PRIVACY_RESTRICTED': 'PRIVACY_RESTRICTED',
  
  // Subscription errors
  'SUBSCRIPTION_EXPIRED': 'SUBSCRIPTION_EXPIRED',
  
  // Balance errors
  'INSUFFICIENT_BALANCE': 'INSUFFICIENT_BALANCE',
};

/**
 * Log error with appropriate level based on severity
 */
const logError = (err, errorId, req) => {
  const logData = {
    errorId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    errorCode: err.errorCode || err.code || 'UNKNOWN',
    message: err.message,
  };

  // Determine log level based on status code
  const statusCode = err.statusCode || 500;
  
  if (statusCode >= 500) {
    // Critical errors - log full stack trace
    console.error('[CRITICAL ERROR]', JSON.stringify(logData, null, 2));
    console.error('Stack trace:', err.stack);
  } else if (statusCode >= 400) {
    // Client errors - log basic info
    console.warn('[CLIENT ERROR]', JSON.stringify(logData, null, 2));
  } else {
    // Other errors
    console.log('[ERROR]', JSON.stringify(logData, null, 2));
  }
};

/**
 * Map database errors to application error codes
 */
const mapDatabaseError = (err) => {
  if (err.code && ERROR_CODE_MAP[err.code]) {
    return ERROR_CODE_MAP[err.code];
  }
  
  // PostgreSQL error codes
  if (err.code && err.code.startsWith('23')) {
    if (err.constraint) {
      if (err.constraint.includes('unique')) {
        return 'ALREADY_EXISTS';
      }
      if (err.constraint.includes('fkey')) {
        return 'NOT_FOUND';
      }
    }
  }
  
  return 'INTERNAL_ERROR';
};

/**
 * Map JWT errors to application error codes
 */
const mapJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return 'AUTH_INVALID';
  }
  if (err.name === 'TokenExpiredError') {
    return 'AUTH_EXPIRED';
  }
  if (err.name === 'NotBeforeError') {
    return 'AUTH_INVALID';
  }
  return 'AUTH_INVALID';
};

/**
 * Build structured error response
 */
const buildErrorResponse = (err, errorId) => {
  const response = {
    error: err.errorCode || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
  };

  // Add details for validation errors
  if (err.details) {
    response.details = err.details;
  }

  // Add error ID for tracking (only for server errors)
  if (err.statusCode >= 500) {
    response.errorId = errorId;
  }

  return response;
};

/**
 * Main error handler middleware
 * Must be registered last in the middleware chain
 */
const errorHandlerMiddleware = (err, req, res, next) => {
  // Generate unique error ID for tracking
  const errorId = crypto.randomBytes(8).toString('hex');
  
  // Handle CustomAPIError instances
  if (err instanceof CustomAPIError) {
    logError(err, errorId, req);
    const response = buildErrorResponse(err, errorId);
    return res.status(err.statusCode).json(response);
  }
  
  // Handle JWT errors
  if (err.name && (err.name.includes('JsonWebToken') || err.name.includes('Token'))) {
    const errorCode = mapJWTError(err);
    const statusCode = 401;
    err.errorCode = errorCode;
    err.statusCode = statusCode;
    logError(err, errorId, req);
    
    return res.status(statusCode).json({
      error: errorCode,
      message: 'Authentication failed',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Handle database errors
  if (err.code && (typeof err.code === 'string' && err.code.match(/^[0-9]{5}$/))) {
    const errorCode = mapDatabaseError(err);
    let statusCode = 500;
    let message = 'Database error occurred';
    
    if (errorCode === 'ALREADY_EXISTS') {
      statusCode = 409;
      message = 'Resource already exists';
    } else if (errorCode === 'NOT_FOUND') {
      statusCode = 404;
      message = 'Referenced resource not found';
    } else if (errorCode === 'VALIDATION_ERROR') {
      statusCode = 400;
      message = 'Validation constraint violated';
    }
    
    err.errorCode = errorCode;
    err.statusCode = statusCode;
    err.message = message;
    logError(err, errorId, req);
    
    return res.status(statusCode).json({
      error: errorCode,
      message: message,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Handle validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    err.errorCode = 'VALIDATION_ERROR';
    err.statusCode = 400;
    logError(err, errorId, req);
    
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Handle rate limit errors
  if (err.message && err.message.includes('rate limit')) {
    err.errorCode = 'RATE_LIMIT_EXCEEDED';
    err.statusCode = 429;
    logError(err, errorId, req);
    
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Handle all other errors as internal server errors
  err.errorCode = 'INTERNAL_ERROR';
  err.statusCode = 500;
  logError(err, errorId, req);
  
  // Return generic error message to client (don't leak internal details)
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
    errorId: errorId,
    timestamp: new Date().toISOString(),
  });
};

export { errorHandlerMiddleware };