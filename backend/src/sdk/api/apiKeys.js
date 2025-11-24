/**
 * API Keys management API module
 */

export class ApiKeysAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Create a new API key
   */
  async create({ user_id, name, permissions, expires_in_days }) {
    const response = await this.client.post('/api/keys/create', {
      user_id,
      name,
      permissions,
      expires_in_days
    });
    return response.data;
  }

  /**
   * List API keys for a user
   */
  async listByUser(userId) {
    const response = await this.client.get(`/api/keys/user/${userId}`);
    return response.data;
  }

  /**
   * Get API key details
   */
  async getById(keyId) {
    const response = await this.client.get(`/api/keys/${keyId}`);
    return response.data;
  }

  /**
   * Update API key
   */
  async update(keyId, { name, permissions, is_active }) {
    const response = await this.client.put(`/api/keys/${keyId}`, {
      name,
      permissions,
      is_active
    });
    return response.data;
  }

  /**
   * Delete (deactivate) API key
   */
  async delete(keyId) {
    const response = await this.client.delete(`/api/keys/${keyId}`);
    return response.data;
  }

  /**
   * Regenerate API key
   */
  async regenerate(keyId) {
    const response = await this.client.post(`/api/keys/${keyId}/regenerate`);
    return response.data;
  }
}