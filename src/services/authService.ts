/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls and token management
 * for the unified Boardling backend.
 */

// Types for authentication
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  // Frontend-only fields for validation
  confirmPassword?: string;
  company?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  subscription_status?: 'free' | 'premium' | 'enterprise';
  onboarding_step?: 'registration' | 'project_creation' | 'wallet_addition' | 'analytics_access' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success?: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: string;
}

class AuthService {
  private baseURL: string;
  private tokenKey = 'boardling_auth_token';
  private userKey = 'boardling_user';

  constructor() {
    // Use environment variable or default to unified backend
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Validate passwords match (frontend validation)
      if (userData.confirmPassword && userData.password !== userData.confirmPassword) {
        return {
          success: false,
          error: 'Passwords do not match'
        };
      }

      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password
          // Backend only expects: name, email, password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Registration failed',
          message: data.message
        };
      }

      // Backend returns: { id, name, email }
      // Create a user object from the response
      const user: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store user data
      this.setUser(user);

      // Note: Backend doesn't return a token on registration
      // User needs to login after registration
      return {
        success: true,
        user: user,
        message: 'Registration successful. Please sign in.'
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }
  }

  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Login failed',
          message: data.message
        };
      }

      // Backend returns: { token }
      // Store the token
      if (data.token) {
        this.setToken(data.token);
        
        // Decode token to get user info
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          const user: User = {
            id: payload.id,
            email: payload.email,
            name: payload.name || payload.email.split('@')[0], // Fallback to email username
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          this.setUser(user);
          
          return {
            success: true,
            token: data.token,
            user: user,
            message: 'Login successful'
          };
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
          return {
            success: true,
            token: data.token,
            message: 'Login successful'
          };
        }
      }

      return {
        success: false,
        error: 'No token received from server'
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }
  }

  /**
   * Logout user and clear stored data
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint if token exists
      const token = this.getToken();
      if (token) {
        await fetch(`${this.baseURL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if backend call fails
    } finally {
      // Always clear local storage
      this.clearToken();
      this.clearUser();
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      const response = await fetch(`${this.baseURL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Password change failed',
          message: data.message
        };
      }

      return {
        success: true,
        message: data.message || 'Password changed successfully'
      };

    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      return {
        success: response.ok,
        message: data.message || 'Password reset email sent',
        error: response.ok ? undefined : (data.error || 'Failed to send reset email')
      };

    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetToken,
          newPassword
        }),
      });

      const data = await response.json();

      return {
        success: response.ok,
        message: data.message || 'Password reset successful',
        error: response.ok ? undefined : (data.error || 'Password reset failed')
      };

    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  /**
   * Make authenticated API request
   */
  async authenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401) {
      this.clearToken();
      this.clearUser();
      // Redirect to login will be handled by the auth context
    }

    return response;
  }

  /**
   * Token management methods
   */
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  /**
   * User data management methods
   */
  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser(): User | null {
    const userData = localStorage.getItem(this.userKey);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.clearUser();
      }
    }
    return null;
  }

  clearUser(): void {
    localStorage.removeItem(this.userKey);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Basic JWT validation (check if it's not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        // Token is expired
        this.clearToken();
        this.clearUser();
        return false;
      }

      return true;
    } catch (error) {
      // Invalid token format
      this.clearToken();
      this.clearUser();
      return false;
    }
  }

  /**
   * Get current user from token or storage
   */
  getCurrentUser(): User | null {
    if (!this.isAuthenticated()) {
      return null;
    }

    return this.getUser();
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;