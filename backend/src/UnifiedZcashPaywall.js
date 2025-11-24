/**
 * Unified Zcash Paywall SDK
 * Simple, centralized interface for all payment methods
 */

import axios from 'axios';

export class UnifiedZcashPaywall {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'http://localhost:3001';
    this.apiKey = config.apiKey || null;
    this.defaultNetwork = config.network || 'testnet';
    this.defaultPaymentMethod = config.paymentMethod || 'auto';
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      }
    });
  }

  /**
   * Create invoice with unified payment system
   * @param {Object} options - Invoice options
   * @returns {Promise<Object>} Invoice details
   */
  async createInvoice(options = {}) {
    const {
      user_id,
      email,
      amount_zec,
      type = 'one_time',
      payment_method = this.defaultPaymentMethod,
      network = this.defaultNetwork,
      item_id,
      description,
      // Wallet linking
      webzjs_wallet_id,
      devtool_wallet_id,
      shielded_wallet_id
    } = options;

    // Validation
    if (!amount_zec || amount_zec <= 0) {
      throw new Error('amount_zec must be a positive number');
    }

    if (!user_id && !email) {
      throw new Error('Either user_id or email must be provided');
    }

    try {
      const response = await this.client.post('/api/invoice/unified/create', {
        user_id,
        email,
        amount_zec,
        type,
        payment_method,
        network,
        item_id,
        description,
        webzjs_wallet_id,
        devtool_wallet_id,
        shielded_wallet_id
      });

      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Check invoice payment status
   * @param {string} invoice_id - Invoice ID
   * @returns {Promise<Object>} Payment status
   */
  async checkPayment(invoice_id) {
    if (!invoice_id) {
      throw new Error('invoice_id is required');
    }

    try {
      const response = await this.client.post('/api/invoice/unified/check', {
        invoice_id
      });

      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get invoice details
   * @param {string} invoice_id - Invoice ID
   * @returns {Promise<Object>} Invoice details
   */
  async getInvoice(invoice_id) {
    if (!invoice_id) {
      throw new Error('invoice_id is required');
    }

    try {
      const response = await this.client.get(`/api/invoice/unified/${invoice_id}`);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Create user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} User details
   */
  async createUser(userData = {}) {
    const { email, name } = userData;

    if (!email) {
      throw new Error('email is required');
    }

    try {
      const response = await this.client.post('/api/users/create', {
        email,
        name
      });

      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get user balance
   * @param {string} user_id - User ID
   * @returns {Promise<Object>} Balance details
   */
  async getUserBalance(user_id) {
    if (!user_id) {
      throw new Error('user_id is required');
    }

    try {
      const response = await this.client.get(`/api/users/${user_id}/balance`);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Create withdrawal request
   * @param {Object} options - Withdrawal options
   * @returns {Promise<Object>} Withdrawal details
   */
  async createWithdrawal(options = {}) {
    const { user_id, to_address, amount_zec } = options;

    if (!user_id || !to_address || !amount_zec) {
      throw new Error('user_id, to_address, and amount_zec are required');
    }

    try {
      const response = await this.client.post('/api/withdraw/create', {
        user_id,
        to_address,
        amount_zec
      });

      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get fee estimate for withdrawal
   * @param {number} amount_zec - Amount in ZEC
   * @returns {Promise<Object>} Fee calculation
   */
  async getFeeEstimate(amount_zec) {
    if (!amount_zec || amount_zec <= 0) {
      throw new Error('amount_zec must be a positive number');
    }

    try {
      const response = await this.client.post('/api/withdraw/fee-estimate', {
        amount_zec
      });

      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Convenience methods for specific payment methods
   */

  // Create transparent invoice
  async createTransparentInvoice(options) {
    return this.createInvoice({ ...options, payment_method: 'transparent' });
  }

  // Create shielded invoice
  async createShieldedInvoice(options) {
    return this.createInvoice({ ...options, payment_method: 'shielded' });
  }

  // Create unified address invoice
  async createUnifiedInvoice(options) {
    return this.createInvoice({ ...options, payment_method: 'unified' });
  }

  // Create WebZjs invoice
  async createWebZjsInvoice(options) {
    return this.createInvoice({ ...options, payment_method: 'webzjs' });
  }

  // Create zcash-devtool invoice
  async createDevtoolInvoice(options) {
    return this.createInvoice({ ...options, payment_method: 'devtool' });
  }

  /**
   * Polling helper for payment detection
   * @param {string} invoice_id - Invoice ID
   * @param {Object} options - Polling options
   * @returns {Promise<Object>} Payment result
   */
  async waitForPayment(invoice_id, options = {}) {
    const {
      timeout = 300000, // 5 minutes
      interval = 5000,   // 5 seconds
      onProgress = null
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const result = await this.checkPayment(invoice_id);
        
        if (onProgress) {
          onProgress(result);
        }

        if (result.paid) {
          return result;
        }

        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.warn('Payment check failed:', error.message);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error('Payment timeout - no payment detected within timeout period');
  }

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get API configuration
   * @returns {Promise<Object>} API config
   */
  async getConfig() {
    try {
      const response = await this.client.get('/api/config');
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Error handler
   * @private
   */
  _handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const message = data?.error || data?.message || `HTTP ${status}`;
      const details = data?.details || null;
      
      const customError = new Error(message);
      customError.status = status;
      customError.details = details;
      customError.response = data;
      
      return customError;
    } else if (error.request) {
      // Network error
      return new Error('Network error - unable to connect to Zcash Paywall API');
    } else {
      // Other error
      return error;
    }
  }
}

/**
 * Factory function for easy instantiation
 */
export function createZcashPaywall(config = {}) {
  return new UnifiedZcashPaywall(config);
}

/**
 * Payment method constants
 */
export const PAYMENT_METHODS = {
  AUTO: 'auto',
  TRANSPARENT: 'transparent', 
  SHIELDED: 'shielded',
  UNIFIED: 'unified',
  WEBZJS: 'webzjs',
  DEVTOOL: 'devtool'
};

/**
 * Network constants
 */
export const NETWORKS = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet'
};

/**
 * Invoice types
 */
export const INVOICE_TYPES = {
  ONE_TIME: 'one_time',
  SUBSCRIPTION: 'subscription'
};

export default UnifiedZcashPaywall;