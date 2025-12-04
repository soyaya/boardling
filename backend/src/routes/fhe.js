/**
 * FHE (Fully Homomorphic Encryption) Routes
 * 
 * API endpoints for managing encrypted data and FHE operations
 */

import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { 
  generateKey,
  encryptAES,
  decryptAES,
  encryptWalletData,
  decryptWalletData,
  getEncryptionKey,
  initializeFHE
} from '../services/fheService.js';

const router = express.Router();

/**
 * @route   GET /api/fhe/status
 * @desc    Get FHE service status
 * @access  Private
 */
router.get('/status', authenticateJWT, (req, res) => {
  try {
    const status = initializeFHE();
    
    res.json({
      success: true,
      data: {
        ...status,
        enabled: process.env.ENABLE_FHE_ENCRYPTION === 'true',
        recommendation: status.keyConfigured 
          ? 'FHE is properly configured' 
          : 'Set FHE_ENCRYPTION_KEY environment variable for production use'
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get FHE status'
    });
  }
});

/**
 * @route   POST /api/fhe/encrypt
 * @desc    Encrypt data (for testing/development)
 * @access  Private (Admin only)
 */
router.post('/encrypt', authenticateJWT, (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: 'Only administrators can use encryption endpoints'
      });
    }
    
    const { data, fields } = req.body;
    
    if (!data) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Data is required'
      });
    }
    
    const key = getEncryptionKey();
    const encrypted = encryptWalletData(data, key, fields);
    
    res.json({
      success: true,
      data: encrypted,
      note: 'This endpoint is for testing only. In production, encryption happens automatically.'
    });
  } catch (error) {
    res.status(500).json({
      error: 'ENCRYPTION_ERROR',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/fhe/decrypt
 * @desc    Decrypt data (for testing/development)
 * @access  Private (Admin only)
 */
router.post('/decrypt', authenticateJWT, (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: 'Only administrators can use decryption endpoints'
      });
    }
    
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Encrypted data is required'
      });
    }
    
    const key = getEncryptionKey();
    const decrypted = decryptWalletData(data, key);
    
    res.json({
      success: true,
      data: decrypted,
      note: 'This endpoint is for testing only. In production, decryption happens automatically.'
    });
  } catch (error) {
    res.status(500).json({
      error: 'DECRYPTION_ERROR',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/fhe/generate-key
 * @desc    Generate a new encryption key (for setup)
 * @access  Private (Admin only)
 */
router.post('/generate-key', authenticateJWT, (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: 'Only administrators can generate encryption keys'
      });
    }
    
    const key = generateKey();
    const keyHex = key.toString('hex');
    
    res.json({
      success: true,
      data: {
        key: keyHex,
        length: key.length * 8,
        algorithm: 'AES-256-GCM'
      },
      instructions: [
        'Add this key to your .env file:',
        `FHE_ENCRYPTION_KEY=${keyHex}`,
        '',
        'IMPORTANT: Store this key securely!',
        '- Use AWS KMS, HashiCorp Vault, or similar in production',
        '- Never commit this key to version control',
        '- Losing this key means losing access to encrypted data'
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: 'KEY_GENERATION_ERROR',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/fhe/encrypted-fields
 * @desc    Get list of fields that are encrypted
 * @access  Private
 */
router.get('/encrypted-fields', authenticateJWT, (req, res) => {
  try {
    const encryptedFields = {
      wallets: ['address', 'balance', 'note'],
      transactions: ['amount', 'from_address', 'to_address', 'memo'],
      analytics: ['wallet_address', 'transaction_amount', 'balance', 'user_id', 'project_id']
    };
    
    res.json({
      success: true,
      data: encryptedFields,
      note: 'These fields are encrypted when ENABLE_FHE_ENCRYPTION=true'
    });
  } catch (error) {
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get encrypted fields'
    });
  }
});

export default router;
