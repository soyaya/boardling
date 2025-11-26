/**
 * API Client
 * 
 * Centralized API client for making authenticated requests to the backend.
 * Handles authentication headers, error responses, and token refresh.
 */

import { authService } from './authService';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiRequestOptions extends RequestInit {
  requireAuth?: boolean;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  /**
   * Make an API request with automatic authentication handling
   */
  async request<T = any>(
    endpoint: string, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { requireAuth = true, ...fetchOptions } = options;

    try {
      let response: Response;

      if (requireAuth) {
        // Use authenticated request from auth service
        response = await authService.authenticatedRequest(endpoint, fetchOptions);
      } else {
        // Make regular request
        const headers = {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        };

        response = await fetch(`${this.baseURL}${endpoint}`, {
          ...fetchOptions,
          headers,
        });
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle successful responses
      if (response.ok) {
        return {
          success: true,
          data: data,
          message: data.message,
        };
      }

      // Handle error responses
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}`,
        message: data.message,
      };

    } catch (error) {
      console.error('API request failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string, 
    data?: any, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string, 
    data?: any, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string, 
    data?: any, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Upload file
   */
  async upload<T = any>(
    endpoint: string, 
    file: File, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it with boundary
        ...options.headers,
      },
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Convenience functions for common API patterns
export const api = {
  // Authentication endpoints (no auth required)
  auth: {
    register: (data: any) => apiClient.post('/auth/register', data, { requireAuth: false }),
    login: (data: any) => apiClient.post('/auth/login', data, { requireAuth: false }),
    logout: () => apiClient.post('/auth/logout'),
    forgotPassword: (data: any) => apiClient.post('/auth/forgot-password', data, { requireAuth: false }),
    resetPassword: (data: any) => apiClient.post('/auth/reset-password', data, { requireAuth: false }),
    changePassword: (data: any) => apiClient.post('/auth/change-password', data),
  },

  // User management
  users: {
    getProfile: () => apiClient.get('/api/users/profile'),
    updateProfile: (data: any) => apiClient.put('/api/users/profile', data),
    getById: (id: string) => apiClient.get(`/api/users/${id}`),
  },

  // Project management
  projects: {
    list: () => apiClient.get('/api/projects'),
    create: (data: any) => apiClient.post('/api/projects', data),
    getById: (id: string) => apiClient.get(`/api/projects/${id}`),
    update: (id: string, data: any) => apiClient.put(`/api/projects/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/projects/${id}`),
    getDashboard: (id: string) => apiClient.get(`/api/projects/${id}/dashboard`),
  },

  // Wallet management
  wallets: {
    list: (projectId: string) => apiClient.get(`/api/projects/${projectId}/wallets`),
    add: (data: any) => apiClient.post('/api/wallets', data),
    getById: (id: string) => apiClient.get(`/api/wallets/${id}`),
    update: (id: string, data: any) => apiClient.put(`/api/wallets/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/wallets/${id}`),
  },

  // Analytics
  analytics: {
    getDashboard: (projectId: string) => apiClient.get(`/api/analytics/dashboard/${projectId}`),
    getCohorts: (projectId: string) => apiClient.get(`/api/analytics/cohorts/${projectId}`),
    getFunnel: (projectId: string) => apiClient.get(`/api/analytics/funnel/${projectId}`),
    getRetention: (projectId: string) => apiClient.get(`/api/analytics/retention/${projectId}`),
  },

  // Payments
  payments: {
    createInvoice: (data: any) => apiClient.post('/api/invoice/create', data),
    getInvoice: (id: string) => apiClient.get(`/api/invoice/${id}`),
    checkPayment: (data: any) => apiClient.post('/api/invoice/check', data),
  },

  // System
  system: {
    health: () => apiClient.get('/health', { requireAuth: false }),
    config: () => apiClient.get('/api/config', { requireAuth: false }),
  },
};

export default apiClient;