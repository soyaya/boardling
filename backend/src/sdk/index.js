/**
 * Zcash Paywall SDK - Main Entry Point
 * A production-ready Node.js SDK for implementing Zcash-based paywall systems
 */

import axios from 'axios';
import { UsersAPI } from './api/users.js';
import { InvoicesAPI } from './api/invoices.js';
import { WithdrawalsAPI } from './api/withdrawals.js';
import { AdminAPI } from './api/admin.js';
import { ApiKeysAPI } from './api/apiKeys.js';
import { resolveConfig, getPreset } from './config.js';

export class ZcashPaywall {
  constructor(options = {}) {
    // Resolve configuration with smart defaults
    const config = resolveConfig(options);
    
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      }
    });

    // Add request interceptor to ensure API key is always included
    this.client.interceptors.request.use((config) => {
      if (this.apiKey && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${this.apiKey}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server responded with error status
          const customError = new Error(error.response.data.error || error.response.data.message || 'API Error');
          customError.code = this.mapErrorCode(error.response.status, error.response.data);
          customError.status = error.response.status;
          customError.data = error.response.data;
          throw customError;
        } else if (error.request) {
          // Network error
          const networkError = new Error('Network error - unable to connect to Zcash Paywall API');
          networkError.code = 'NETWORK_ERROR';
          throw networkError;
        } else {
          // Other error
          throw error;
        }
      }
    );

    // Initialize API modules
    this.users = new UsersAPI(this.client);
    this.invoices = new InvoicesAPI(this.client);
    this.withdrawals = new WithdrawalsAPI(this.client);
    this.admin = new AdminAPI(this.client);
    this.apiKeys = new ApiKeysAPI(this.client);
  }

  /**
   * Initialize the SDK (optional - for future use)
   */
  async initialize() {
    try {
      const health = await this.getHealth();
      if (health.status !== 'OK') {
        throw new Error('Zcash Paywall API is not healthy');
      }
      return true;
    } catch (error) {
      throw new Error(`Failed to initialize Zcash Paywall SDK: ${error.message}`);
    }
  }

  /**
   * Get API health status
   */
  async getHealth() {
    const response = await this.client.get('/health');
    return response.data;
  }

  /**
   * Set API key for authentication
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.client.defaults.headers.Authorization = `Bearer ${apiKey}`;
  }

  /**
   * Remove API key
   */
  removeApiKey() {
    this.apiKey = null;
    delete this.client.defaults.headers.Authorization;
  }

  /**
   * Check if API key is set
   */
  hasApiKey() {
    return !!this.apiKey;
  }

  /**
   * Map HTTP status codes to error codes
   */
  mapErrorCode(status, data) {
    if (data.error) {
      const errorMsg = data.error.toLowerCase();
      // Check for specific error messages
      if (errorMsg.includes('not found')) return 'NOT_FOUND';
      if (errorMsg.includes('already exists')) return 'ALREADY_EXISTS';
      if (errorMsg.includes('insufficient balance')) return 'INSUFFICIENT_BALANCE';
      if (errorMsg.includes('invalid') && errorMsg.includes('address')) return 'INVALID_ADDRESS';
      if (errorMsg.includes('rpc')) return 'RPC_ERROR';
      if (errorMsg.includes('database')) return 'DATABASE_ERROR';
    }

    // Fallback to HTTP status codes
    switch (status) {
      case 400: return 'VALIDATION_ERROR';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 429: return 'RATE_LIMITED';
      case 500: return 'INTERNAL_ERROR';
      default: return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Create SDK instance with environment preset
   */
  static withPreset(environment, overrides = {}) {
    const preset = getPreset(environment);
    return new ZcashPaywall({ ...preset, ...overrides });
  }

  /**
   * Create SDK instance with server-side defaults
   * This method tries to use server configuration if available
   */
  static async withServerDefaults(overrides = {}) {
    const { getServerConfig } = await import('./config.js');
    const serverConfig = await getServerConfig();
    
    if (serverConfig) {
      return new ZcashPaywall({ ...serverConfig, ...overrides });
    }
    
    // Fallback to regular constructor
    return new ZcashPaywall(overrides);
  }

  /**
   * Create SDK instance by fetching configuration from a server
   */
  static async fromServer(baseURL, overrides = {}) {
    const { createWithServerConfig } = await import('./utils/config-fetcher.js');
    const config = await createWithServerConfig(baseURL, overrides);
    return new ZcashPaywall(config);
  }
}

// Export utility functions
export { retryWithBackoff } from './utils/retry.js';
export { resolveConfig, getPreset } from './config.js';

// Export for CommonJS compatibility
export default ZcashPaywall;