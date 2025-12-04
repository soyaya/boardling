/**
 * FHE Encryption Middleware
 * 
 * Automatically encrypts sensitive data before storing in database
 * and decrypts when retrieving for authorized users.
 */

import { 
  encryptWalletData, 
  decryptWalletData,
  getEncryptionKey 
} from '../services/fheService.js';

/**
 * Middleware to encrypt request body data
 * Use this before database insert operations
 */
function encryptRequestData(options = {}) {
  const {
    fields = ['address', 'balance', 'note'],
    enabled = process.env.ENABLE_FHE_ENCRYPTION === 'true'
  } = options;
  
  return (req, res, next) => {
    if (!enabled) {
      return next();
    }
    
    try {
      const key = getEncryptionKey();
      
      if (req.body && typeof req.body === 'object') {
        req.body = encryptWalletData(req.body, key, fields);
        req.fheEncrypted = true;
      }
      
      next();
    } catch (error) {
      console.error('Encryption middleware error:', error.message);
      next(error);
    }
  };
}

/**
 * Middleware to decrypt response data
 * Use this after database query operations
 */
function decryptResponseData(options = {}) {
  const {
    enabled = process.env.ENABLE_FHE_ENCRYPTION === 'true'
  } = options;
  
  return (req, res, next) => {
    if (!enabled) {
      return next();
    }
    
    // Intercept res.json to decrypt before sending
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      try {
        const key = getEncryptionKey();
        
        // Decrypt if data has encrypted fields
        if (data && typeof data === 'object') {
          if (Array.isArray(data)) {
            data = data.map(item => {
              if (hasEncryptedFields(item)) {
                return decryptWalletData(item, key);
              }
              return item;
            });
          } else if (hasEncryptedFields(data)) {
            data = decryptWalletData(data, key);
          } else if (data.data && hasEncryptedFields(data.data)) {
            data.data = decryptWalletData(data.data, key);
          }
        }
        
        return originalJson(data);
      } catch (error) {
        console.error('Decryption middleware error:', error.message);
        return originalJson(data);
      }
    };
    
    next();
  };
}

/**
 * Check if object has encrypted fields
 */
function hasEncryptedFields(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return Object.keys(obj).some(key => key.startsWith('encrypted_'));
}

/**
 * Middleware to mark data as requiring encryption
 * Sets a flag that can be checked by other middleware
 */
function requireEncryption(req, res, next) {
  req.requiresEncryption = true;
  next();
}

/**
 * Middleware to check if FHE is enabled
 */
function checkFHEEnabled(req, res, next) {
  const enabled = process.env.ENABLE_FHE_ENCRYPTION === 'true';
  
  if (!enabled && req.requiresEncryption) {
    return res.status(503).json({
      error: 'SERVICE_UNAVAILABLE',
      message: 'FHE encryption is not enabled on this server'
    });
  }
  
  next();
}

export {
  encryptRequestData,
  decryptResponseData,
  requireEncryption,
  checkFHEEnabled,
  hasEncryptedFields
};
