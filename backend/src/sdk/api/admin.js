/**
 * Admin API Module
 */

export class AdminAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get platform statistics
   */
  async getStats() {
    const response = await this.client.get('/api/admin/stats');
    return response.data.stats;
  }

  /**
   * Get pending withdrawals
   */
  async getPendingWithdrawals() {
    const response = await this.client.get('/api/admin/withdrawals/pending');
    return response.data.withdrawals;
  }

  /**
   * Get user balances
   */
  async getUserBalances(options = {}) {
    const response = await this.client.get('/api/admin/balances', {
      params: {
        min_balance: options.min_balance,
        limit: options.limit || 50,
        offset: options.offset || 0
      }
    });
    return response.data;
  }

  /**
   * Get revenue data
   */
  async getRevenue() {
    const response = await this.client.get('/api/admin/revenue');
    return response.data;
  }

  /**
   * Get active subscriptions
   */
  async getActiveSubscriptions() {
    const response = await this.client.get('/api/admin/subscriptions');
    return response.data;
  }

  /**
   * Get Zcash node status
   */
  async getNodeStatus() {
    const response = await this.client.get('/api/admin/node-status');
    return response.data;
  }
}