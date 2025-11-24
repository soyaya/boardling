/**
 * Utility helper functions
 */

/**
 * Format ZEC amount to 8 decimal places
 */
export function formatZecAmount(amount) {
  return Number(parseFloat(amount).toFixed(8));
}

/**
 * Validate and sanitize ZEC amount
 */
export function sanitizeZecAmount(amount) {
  if (typeof amount === 'string') {
    amount = parseFloat(amount);
  }
  
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount: must be a number');
  }
  
  if (amount <= 0) {
    throw new Error('Invalid amount: must be positive');
  }
  
  if (amount > 21000000) {
    throw new Error('Invalid amount: exceeds maximum ZEC supply');
  }
  
  return formatZecAmount(amount);
}

/**
 * Generate a random string for testing
 */
export function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Parse and validate UUID
 */
export function parseUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuid || typeof uuid !== 'string') {
    throw new Error('UUID must be a string');
  }
  
  if (!uuidRegex.test(uuid)) {
    throw new Error('Invalid UUID format');
  }
  
  return uuid.toLowerCase();
}

/**
 * Sanitize string input
 */
export function sanitizeString(str, maxLength = 255) {
  if (typeof str !== 'string') {
    return null;
  }
  
  str = str.trim();
  
  if (str.length === 0) {
    return null;
  }
  
  if (str.length > maxLength) {
    throw new Error(`String too long (max ${maxLength} characters)`);
  }
  
  return str;
}

/**
 * Check if string is a valid email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email) && email.length <= 255;
}

/**
 * Format error response
 */
export function formatErrorResponse(error, includeStack = false) {
  const response = {
    error: error.message || 'Unknown error',
    timestamp: new Date().toISOString()
  };
  
  if (includeStack && error.stack) {
    response.stack = error.stack;
  }
  
  return response;
}

/**
 * Format success response
 */
export function formatSuccessResponse(data, message = null) {
  const response = {
    success: true,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  if (message) {
    response.message = message;
  }
  
  return response;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return Number(((value / total) * 100).toFixed(2));
}

/**
 * Round to specified decimal places
 */
export function roundToDecimals(number, decimals = 2) {
  return Number(Math.round(number + 'e' + decimals) + 'e-' + decimals);
}