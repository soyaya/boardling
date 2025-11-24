/**
 * Simple logging utility
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level}: ${message}${metaStr}`;
}

export const logger = {
  error: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(formatMessage('ERROR', message, meta));
    }
  },
  
  warn: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, meta));
    }
  },
  
  info: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(formatMessage('INFO', message, meta));
    }
  },
  
  debug: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(formatMessage('DEBUG', message, meta));
    }
  }
};

/**
 * Express middleware for request logging
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;
    
    logger.info(`${method} ${originalUrl}`, {
      status: statusCode,
      duration: `${duration}ms`,
      ip: ip || 'unknown'
    });
  });
  
  next();
}