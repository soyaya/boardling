/**
 * Withdrawals API Module
 */

export class WithdrawalsAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Create a withdrawal request
   */
  async create({ user_id, to_address, amount_zec }) {
    const response = await this.client.post('/api/withdraw/create', {
      user_id,
      to_address,
      amount_zec
    });
    return response.data.withdrawal;
  }

  /**
   * Process a withdrawal (admin function)
   */
  async process(withdrawalId) {
    const response = await this.client.post(`/api/withdraw/process/${withdrawalId}`);
    return response.data;
  }

  /**
   * Process multiple withdrawals at once
   */
  async processBatch(withdrawalIds) {
    const results = [];
    for (const id of withdrawalIds) {
      try {
        const result = await this.process(id);
        results.push({ id, success: true, ...result });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    return results;
  }

  /**
   * Get fee estimate
   */
  async getFeeEstimate(amount_zec) {
    const response = await this.client.post('/api/withdraw/fee-estimate', {
      amount_zec
    });
    return response.data;
  }

  /**
   * Get withdrawal by ID
   */
  async getById(withdrawalId) {
    const response = await this.client.get(`/api/withdraw/${withdrawalId}`);
    return response.data.withdrawal;
  }

  /**
   * List withdrawals for a user
   */
  async listByUser(userId, options = {}) {
    const response = await this.client.get(`/api/withdraw/user/${userId}`, {
      params: {
        status: options.status,
        limit: options.limit || 50,
        offset: options.offset || 0
      }
    });
    return response.data;
  }
}