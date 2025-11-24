/**
 * Users API Module
 */

export class UsersAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Create a new user
   */
  async create({ email, name }) {
    const response = await this.client.post('/api/users/create', {
      email,
      name
    });
    return response.data.user;
  }

  /**
   * Get user by ID
   */
  async getById(userId) {
    const response = await this.client.get(`/api/users/${userId}`);
    return response.data.user;
  }

  /**
   * Get user by email
   */
  async getByEmail(email) {
    const response = await this.client.get(`/api/users/email/${encodeURIComponent(email)}`);
    return response.data.user;
  }

  /**
   * Update user
   */
  async update(userId, { email, name }) {
    const response = await this.client.put(`/api/users/${userId}`, {
      email,
      name
    });
    return response.data.user;
  }

  /**
   * Get user balance
   */
  async getBalance(userId, options = {}) {
    const response = await this.client.get(`/api/users/${userId}/balance`, {
      params: {
        cache: options.cache,
        cacheTTL: options.cacheTTL
      }
    });
    return response.data.balance;
  }

  /**
   * List users with pagination
   */
  async list(options = {}) {
    const response = await this.client.get('/api/users', {
      params: {
        limit: options.limit || 50,
        offset: options.offset || 0,
        search: options.search
      }
    });
    return response.data;
  }
}