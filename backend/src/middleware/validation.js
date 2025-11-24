/**
 * Validation middleware for API endpoints
 */

/**
 * Validate UUID format
 */
export function validateUUID(req, res, next) {
  const { id, user_id } = req.params;
  const uuidToValidate = id || user_id;
  
  if (uuidToValidate) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuidToValidate)) {
      return res.status(400).json({ error: 'Invalid UUID format' });
    }
  }
  
  next();
}

/**
 * Validate ZEC amount
 */
export function validateZecAmount(req, res, next) {
  const { amount_zec } = req.body;
  
  if (amount_zec !== undefined) {
    if (typeof amount_zec !== 'number' || amount_zec <= 0 || amount_zec > 21000000) {
      return res.status(400).json({ 
        error: 'Invalid ZEC amount. Must be a positive number not exceeding 21,000,000' 
      });
    }
    
    // Check for reasonable precision (8 decimal places max)
    const decimalPlaces = (amount_zec.toString().split('.')[1] || '').length;
    if (decimalPlaces > 8) {
      return res.status(400).json({ 
        error: 'ZEC amount cannot have more than 8 decimal places' 
      });
    }
  }
  
  next();
}

/**
 * Validate Zcash address format
 */
export function validateZcashAddress(req, res, next) {
  const { to_address, z_address } = req.body;
  const address = to_address || z_address;
  
  if (address) {
    // Basic format validation for Zcash addresses
    const tAddressRegex = /^t[a-zA-Z0-9]{33}$/;
    const zAddressRegex = /^z[a-zA-Z0-9]{94}$/;
    
    if (!tAddressRegex.test(address) && !zAddressRegex.test(address)) {
      return res.status(400).json({ 
        error: 'Invalid Zcash address format. Must be a valid t-address or z-address' 
      });
    }
  }
  
  next();
}

/**
 * Validate pagination parameters
 */
export function validatePagination(req, res, next) {
  const { limit, offset } = req.query;
  
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      return res.status(400).json({ 
        error: 'Limit must be a number between 1 and 1000' 
      });
    }
    req.query.limit = limitNum;
  }
  
  if (offset !== undefined) {
    const offsetNum = parseInt(offset);
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({ 
        error: 'Offset must be a non-negative number' 
      });
    }
    req.query.offset = offsetNum;
  }
  
  next();
}

/**
 * Validate email format
 */
export function validateEmail(req, res, next) {
  const { email } = req.body;
  
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (email.length > 255) {
      return res.status(400).json({ error: 'Email too long (max 255 characters)' });
    }
  }
  
  next();
}

/**
 * Validate invoice type
 */
export function validateInvoiceType(req, res, next) {
  const { type } = req.body;
  
  if (type && !['subscription', 'one_time'].includes(type)) {
    return res.status(400).json({ 
      error: 'Invalid invoice type. Must be "subscription" or "one_time"' 
    });
  }
  
  next();
}