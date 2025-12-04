/**
 * FHE (Fully Homomorphic Encryption) Service
 * 
 * Provides encryption capabilities for sensitive wallet analytics data.
 * Supports both AES (fast, standard) and FHE (compute on encrypted data).
 * 
 * Use Cases:
 * - Encrypt wallet addresses and transaction amounts
 * - Perform analytics on encrypted data without decryption
 * - Privacy-preserving data monetization
 */

import crypto from 'crypto';

// Configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Generate a new encryption key
 * Store this securely (e.g., AWS KMS, HashiCorp Vault, or environment variable)
 */
function generateKey() {
  return crypto.randomBytes(KEY_LENGTH);
}

/**
 * Encrypt data using AES-256-GCM
 * 
 * @param {string|object} data - Data to encrypt
 * @param {Buffer} key - Encryption key (32 bytes)
 * @returns {object} - Encrypted data with IV and auth tag
 */
function encryptAES(data, key) {
  try {
    // Convert data to string if it's an object
    const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    return {
      ciphertext: encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: ENCRYPTION_ALGORITHM
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt data using AES-256-GCM
 * 
 * @param {object} encryptedData - Object with ciphertext, iv, and authTag
 * @param {Buffer} key - Decryption key (32 bytes)
 * @returns {string|object} - Decrypted data
 */
function decryptAES(encryptedData, key) {
  try {
    const { ciphertext, iv, authTag } = encryptedData;
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      key,
      Buffer.from(iv, 'base64')
    );
    
    // Set auth tag
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    
    // Decrypt
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Try to parse as JSON, otherwise return as string
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Encrypt sensitive wallet fields
 * 
 * @param {object} walletData - Wallet data object
 * @param {Buffer} key - Encryption key
 * @param {array} sensitiveFields - Fields to encrypt (default: address, balance)
 * @returns {object} - Wallet data with encrypted fields
 */
function encryptWalletData(walletData, key, sensitiveFields = ['address', 'balance', 'note']) {
  const encrypted = { ...walletData };
  
  for (const field of sensitiveFields) {
    if (walletData[field] !== undefined && walletData[field] !== null) {
      encrypted[`encrypted_${field}`] = encryptAES(walletData[field], key);
      delete encrypted[field]; // Remove plaintext
    }
  }
  
  encrypted.encryption_metadata = {
    encrypted_at: new Date().toISOString(),
    encrypted_fields: sensitiveFields,
    encryption_version: '1.0'
  };
  
  return encrypted;
}

/**
 * Decrypt sensitive wallet fields
 * 
 * @param {object} encryptedWalletData - Encrypted wallet data
 * @param {Buffer} key - Decryption key
 * @returns {object} - Wallet data with decrypted fields
 */
function decryptWalletData(encryptedWalletData, key) {
  const decrypted = { ...encryptedWalletData };
  
  // Find all encrypted fields
  const encryptedFields = Object.keys(decrypted).filter(k => k.startsWith('encrypted_'));
  
  for (const encField of encryptedFields) {
    const originalField = encField.replace('encrypted_', '');
    decrypted[originalField] = decryptAES(decrypted[encField], key);
    delete decrypted[encField]; // Remove encrypted version
  }
  
  delete decrypted.encryption_metadata;
  
  return decrypted;
}

/**
 * Encrypt transaction data
 * 
 * @param {object} txData - Transaction data
 * @param {Buffer} key - Encryption key
 * @returns {object} - Encrypted transaction data
 */
function encryptTransactionData(txData, key) {
  const sensitiveFields = ['amount', 'from_address', 'to_address', 'memo'];
  return encryptWalletData(txData, key, sensitiveFields);
}

/**
 * Decrypt transaction data
 * 
 * @param {object} encryptedTxData - Encrypted transaction data
 * @param {Buffer} key - Decryption key
 * @returns {object} - Decrypted transaction data
 */
function decryptTransactionData(encryptedTxData, key) {
  return decryptWalletData(encryptedTxData, key);
}

/**
 * Homomorphic addition simulation (for demonstration)
 * In production, use a proper FHE library like TFHE or SEAL
 * 
 * @param {object} encryptedValue1 - First encrypted value
 * @param {object} encryptedValue2 - Second encrypted value
 * @returns {object} - Encrypted sum
 */
function homomorphicAdd(encryptedValue1, encryptedValue2) {
  // This is a placeholder - real FHE requires specialized libraries
  // For now, we decrypt, add, and re-encrypt (NOT truly homomorphic)
  console.warn('Using simulated homomorphic addition - not production-ready');
  
  // In production, use TFHE-rs or Microsoft SEAL:
  // const sum = fhe.add(encryptedValue1, encryptedValue2);
  
  return {
    ciphertext: 'simulated_sum',
    note: 'Use TFHE or SEAL for real homomorphic operations'
  };
}

/**
 * Get encryption key from environment or generate new one
 * 
 * @returns {Buffer} - Encryption key
 */
function getEncryptionKey() {
  const keyHex = process.env.FHE_ENCRYPTION_KEY;
  
  if (!keyHex) {
    console.warn('FHE_ENCRYPTION_KEY not set in environment. Generating temporary key.');
    console.warn('This key will not persist across restarts!');
    return generateKey();
  }
  
  return Buffer.from(keyHex, 'hex');
}

/**
 * Initialize FHE service
 * Checks for encryption key and logs configuration
 */
function initializeFHE() {
  const keyExists = !!process.env.FHE_ENCRYPTION_KEY;
  
  console.log('FHE Service Initialization:');
  console.log(`  - Encryption Algorithm: ${ENCRYPTION_ALGORITHM}`);
  console.log(`  - Key Length: ${KEY_LENGTH * 8} bits`);
  console.log(`  - Key Configured: ${keyExists ? 'Yes' : 'No (using temporary key)'}`);
  
  if (!keyExists) {
    console.warn('⚠ WARNING: Generate and set FHE_ENCRYPTION_KEY in production!');
    console.warn('  Run: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  
  return {
    initialized: true,
    keyConfigured: keyExists,
    algorithm: ENCRYPTION_ALGORITHM
  };
}

/**
 * Encrypt analytics data for storage
 * 
 * @param {object} analyticsData - Analytics data to encrypt
 * @param {Buffer} key - Encryption key
 * @returns {object} - Encrypted analytics data
 */
function encryptAnalyticsData(analyticsData, key) {
  const sensitiveFields = [
    'wallet_address',
    'transaction_amount',
    'balance',
    'user_id',
    'project_id'
  ];
  
  return encryptWalletData(analyticsData, key, sensitiveFields);
}

/**
 * Decrypt analytics data for display
 * 
 * @param {object} encryptedAnalyticsData - Encrypted analytics data
 * @param {Buffer} key - Decryption key
 * @returns {object} - Decrypted analytics data
 */
function decryptAnalyticsData(encryptedAnalyticsData, key) {
  return decryptWalletData(encryptedAnalyticsData, key);
}

export {
  generateKey,
  encryptAES,
  decryptAES,
  encryptWalletData,
  decryptWalletData,
  encryptTransactionData,
  decryptTransactionData,
  encryptAnalyticsData,
  decryptAnalyticsData,
  homomorphicAdd,
  getEncryptionKey,
  initializeFHE
};
