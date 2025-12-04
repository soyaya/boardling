/**
 * Property-Based Tests for Authentication
 * 
 * Tests universal properties that should hold true across all authentication scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { authService, type LoginCredentials, type User } from '../../services/authService';

// Feature: fullstack-integration, Property 6: Token storage and navigation
// Validates: Requirements 2.3

describe('Authentication Properties', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Property 6: Token storage and navigation', () => {
    it('should store JWT token in localStorage for any successful login', async () => {
      // Property: For any successful login, the JWT token should be stored in localStorage
      
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary valid login credentials
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }),
          }),
          // Generate arbitrary successful login response
          fc.record({
            success: fc.constant(true),
            token: fc.string({ minLength: 20, maxLength: 500 }).map(s => {
              // Generate a valid JWT-like token structure
              const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
              const payload = btoa(JSON.stringify({
                id: fc.sample(fc.uuid(), 1)[0],
                email: fc.sample(fc.emailAddress(), 1)[0],
                name: fc.sample(fc.string({ minLength: 1, maxLength: 50 }), 1)[0],
                exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
              }));
              const signature = s.substring(0, 43); // Mock signature
              return `${header}.${payload}.${signature}`;
            }),
            user: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              email: fc.emailAddress(),
              created_at: fc.constant(new Date().toISOString()),
              updated_at: fc.constant(new Date().toISOString()),
            }),
            message: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          async (credentials, mockResponse) => {
            // Mock the fetch API to return our generated response
            global.fetch = vi.fn().mockResolvedValue({
              ok: true,
              json: async () => mockResponse,
            } as Response);

            // Perform login
            const response = await authService.login(credentials);

            // Property assertion: Token should be stored in localStorage
            const storedToken = localStorage.getItem('boardling_auth_token');
            
            expect(storedToken).toBe(mockResponse.token);
            expect(response.success).toBe(true);
            expect(response.token).toBe(mockResponse.token);
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });

    it('should store user data in localStorage for any successful login', async () => {
      // Property: For any successful login, user data should be stored in localStorage
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }),
          }),
          fc.record({
            success: fc.constant(true),
            token: fc.string({ minLength: 20, maxLength: 500 }).map(s => {
              const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
              const payload = btoa(JSON.stringify({
                id: fc.sample(fc.uuid(), 1)[0],
                email: fc.sample(fc.emailAddress(), 1)[0],
                name: fc.sample(fc.string({ minLength: 1, maxLength: 50 }), 1)[0],
                exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
              }));
              const signature = s.substring(0, 43);
              return `${header}.${payload}.${signature}`;
            }),
            user: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              email: fc.emailAddress(),
              created_at: fc.constant(new Date().toISOString()),
              updated_at: fc.constant(new Date().toISOString()),
            }),
            message: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          async (credentials, mockResponse) => {
            global.fetch = vi.fn().mockResolvedValue({
              ok: true,
              json: async () => mockResponse,
            } as Response);

            await authService.login(credentials);

            // Property assertion: User data should be stored in localStorage
            const storedUserData = localStorage.getItem('boardling_user');
            expect(storedUserData).not.toBeNull();
            
            const storedUser = JSON.parse(storedUserData!);
            expect(storedUser.id).toBe(mockResponse.user.id);
            expect(storedUser.email).toBe(mockResponse.user.email);
            expect(storedUser.name).toBe(mockResponse.user.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT store token in localStorage for any failed login', async () => {
      // Property: For any failed login, no token should be stored in localStorage
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }),
          }),
          fc.record({
            success: fc.constant(false),
            error: fc.string({ minLength: 1, maxLength: 100 }),
            message: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          async (credentials, mockResponse) => {
            global.fetch = vi.fn().mockResolvedValue({
              ok: false,
              json: async () => mockResponse,
            } as Response);

            await authService.login(credentials);

            // Property assertion: No token should be stored for failed login
            const storedToken = localStorage.getItem('boardling_auth_token');
            expect(storedToken).toBeNull();
            
            const storedUser = localStorage.getItem('boardling_user');
            expect(storedUser).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain token-user consistency for any successful login', async () => {
      // Property: For any successful login, the stored token and user should be consistent
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }),
          }),
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (credentials, userId, userEmail, userName) => {
            const mockResponse = {
              success: true,
              token: (() => {
                const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
                const payload = btoa(JSON.stringify({
                  id: userId,
                  email: userEmail,
                  name: userName,
                  exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
                }));
                const signature = 'mock_signature_' + Math.random().toString(36).substring(7);
                return `${header}.${payload}.${signature}`;
              })(),
              user: {
                id: userId,
                name: userName,
                email: userEmail,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              message: 'Login successful',
            };

            global.fetch = vi.fn().mockResolvedValue({
              ok: true,
              json: async () => mockResponse,
            } as Response);

            await authService.login(credentials);

            // Property assertion: Token payload should match stored user data
            const storedToken = localStorage.getItem('boardling_auth_token');
            const storedUserData = localStorage.getItem('boardling_user');
            
            expect(storedToken).not.toBeNull();
            expect(storedUserData).not.toBeNull();
            
            // Decode token
            const tokenPayload = JSON.parse(atob(storedToken!.split('.')[1]));
            const storedUser = JSON.parse(storedUserData!);
            
            // Verify consistency
            expect(tokenPayload.id).toBe(storedUser.id);
            expect(tokenPayload.email).toBe(storedUser.email);
            expect(tokenPayload.name).toBe(storedUser.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear storage for any logout operation', async () => {
      // Property: For any logout, both token and user data should be cleared from localStorage
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 500 }),
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            created_at: fc.constant(new Date().toISOString()),
            updated_at: fc.constant(new Date().toISOString()),
          }),
          async (token, user) => {
            // Pre-populate localStorage with token and user
            localStorage.setItem('boardling_auth_token', token);
            localStorage.setItem('boardling_user', JSON.stringify(user));

            // Mock fetch for logout endpoint
            global.fetch = vi.fn().mockResolvedValue({
              ok: true,
              json: async () => ({ success: true, message: 'Logout successful' }),
            } as Response);

            // Perform logout
            await authService.logout();

            // Property assertion: Storage should be cleared
            const storedToken = localStorage.getItem('boardling_auth_token');
            const storedUser = localStorage.getItem('boardling_user');
            
            expect(storedToken).toBeNull();
            expect(storedUser).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate token expiration correctly for any token', async () => {
      // Property: For any token, isTokenExpired should correctly identify expired tokens
      
      await fc.assert(
        fc.property(
          fc.integer({ min: -86400, max: 86400 }), // Seconds offset from now (-1 day to +1 day)
          (secondsOffset) => {
            // Skip the edge case where secondsOffset is exactly 0 or very close to current time
            // This can cause timing issues in the test
            if (Math.abs(secondsOffset) < 2) {
              return true; // Skip this case
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const expTime = currentTime + secondsOffset;
            
            const token = (() => {
              const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
              const payload = btoa(JSON.stringify({
                id: 'test-id',
                email: 'test@example.com',
                name: 'Test User',
                exp: expTime,
              }));
              const signature = 'mock_signature';
              return `${header}.${payload}.${signature}`;
            })();

            localStorage.setItem('boardling_auth_token', token);

            const isExpired = authService.isTokenExpired();
            const shouldBeExpired = expTime < currentTime;

            // Property assertion: isTokenExpired should match actual expiration status
            expect(isExpired).toBe(shouldBeExpired);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: fullstack-integration, Property 7: Session persistence
  // Validates: Requirements 2.5
  describe('Property 7: Session persistence', () => {
    it('should maintain session for any authenticated user with valid token after page refresh', async () => {
      // Property: For any authenticated user with a valid token, refreshing the page should maintain the session
      
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 3600, max: 604800 }), // Token valid for 1 hour to 7 days
          async (userId, userEmail, userName, validForSeconds) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const expTime = currentTime + validForSeconds;
            
            // Create a valid token
            const token = (() => {
              const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
              const payload = btoa(JSON.stringify({
                id: userId,
                email: userEmail,
                name: userName,
                exp: expTime,
              }));
              const signature = 'mock_signature_' + Math.random().toString(36).substring(7);
              return `${header}.${payload}.${signature}`;
            })();

            const user = {
              id: userId,
              name: userName,
              email: userEmail,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Simulate user being logged in before page refresh
            localStorage.setItem('boardling_auth_token', token);
            localStorage.setItem('boardling_user', JSON.stringify(user));

            // Simulate page refresh by checking authentication status
            const isAuthenticated = authService.isAuthenticated();
            const currentUser = authService.getCurrentUser();

            // Property assertion: Session should be maintained
            expect(isAuthenticated).toBe(true);
            expect(currentUser).not.toBeNull();
            expect(currentUser?.id).toBe(userId);
            expect(currentUser?.email).toBe(userEmail);
            expect(currentUser?.name).toBe(userName);

            // Verify token is still in storage
            const storedToken = authService.getToken();
            expect(storedToken).toBe(token);

            // Verify user data is still in storage
            const storedUser = authService.getUser();
            expect(storedUser).not.toBeNull();
            expect(storedUser?.id).toBe(userId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT maintain session for any user with expired token after page refresh', async () => {
      // Property: For any user with an expired token, refreshing the page should clear the session
      
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 86400 }), // Token expired 1 second to 1 day ago
          async (userId, userEmail, userName, expiredBySeconds) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const expTime = currentTime - expiredBySeconds;
            
            // Create an expired token
            const token = (() => {
              const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
              const payload = btoa(JSON.stringify({
                id: userId,
                email: userEmail,
                name: userName,
                exp: expTime,
              }));
              const signature = 'mock_signature_' + Math.random().toString(36).substring(7);
              return `${header}.${payload}.${signature}`;
            })();

            const user = {
              id: userId,
              name: userName,
              email: userEmail,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Simulate user having an expired token
            localStorage.setItem('boardling_auth_token', token);
            localStorage.setItem('boardling_user', JSON.stringify(user));

            // Simulate page refresh by checking authentication status
            const isAuthenticated = authService.isAuthenticated();
            const currentUser = authService.getCurrentUser();

            // Property assertion: Session should NOT be maintained for expired token
            expect(isAuthenticated).toBe(false);
            expect(currentUser).toBeNull();

            // Verify token and user data are cleared from storage
            const storedToken = authService.getToken();
            const storedUser = authService.getUser();
            expect(storedToken).toBeNull();
            expect(storedUser).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT maintain session for any user with invalid token format after page refresh', async () => {
      // Property: For any user with an invalid token format, refreshing the page should clear the session
      
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.oneof(
            fc.constant('invalid-token'),
            fc.constant('not.a.jwt'),
            fc.string({ minLength: 1, maxLength: 50 }), // Random string (excluding empty)
            fc.constant('header.payload'), // Missing signature
            fc.constant('a.b.c.d'), // Too many parts
          ),
          async (userId, userEmail, userName, invalidToken) => {
            const user = {
              id: userId,
              name: userName,
              email: userEmail,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Simulate user having an invalid token
            localStorage.setItem('boardling_auth_token', invalidToken);
            localStorage.setItem('boardling_user', JSON.stringify(user));

            // Simulate page refresh by checking authentication status
            const isAuthenticated = authService.isAuthenticated();
            const currentUser = authService.getCurrentUser();

            // Property assertion: Session should NOT be maintained for invalid token
            expect(isAuthenticated).toBe(false);
            expect(currentUser).toBeNull();

            // After isAuthenticated() is called, invalid tokens should be cleared
            // Note: getToken() returns what's in storage, but isAuthenticated() clears invalid tokens
            const storedToken = authService.getToken();
            const storedUser = authService.getUser();
            expect(storedToken).toBeNull();
            expect(storedUser).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT maintain session for any user with no token after page refresh', async () => {
      // Property: For any user with no token, refreshing the page should not establish a session
      
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (userId, userEmail, userName) => {
            const user = {
              id: userId,
              name: userName,
              email: userEmail,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Simulate user data in storage but no token (edge case)
            localStorage.removeItem('boardling_auth_token');
            localStorage.setItem('boardling_user', JSON.stringify(user));

            // Simulate page refresh by checking authentication status
            const isAuthenticated = authService.isAuthenticated();
            const currentUser = authService.getCurrentUser();

            // Property assertion: Session should NOT be maintained without token
            expect(isAuthenticated).toBe(false);
            expect(currentUser).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent token-user data for any valid session after page refresh', async () => {
      // Property: For any valid session, the token payload should match stored user data after refresh
      
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 3600, max: 604800 }),
          async (userId, userEmail, userName, validForSeconds) => {
            const currentTime = Math.floor(Date.now() / 1000);
            const expTime = currentTime + validForSeconds;
            
            // Create a valid token with user data
            const token = (() => {
              const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
              const payload = btoa(JSON.stringify({
                id: userId,
                email: userEmail,
                name: userName,
                exp: expTime,
              }));
              const signature = 'mock_signature_' + Math.random().toString(36).substring(7);
              return `${header}.${payload}.${signature}`;
            })();

            const user = {
              id: userId,
              name: userName,
              email: userEmail,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Simulate logged in state
            localStorage.setItem('boardling_auth_token', token);
            localStorage.setItem('boardling_user', JSON.stringify(user));

            // Simulate page refresh
            const isAuthenticated = authService.isAuthenticated();
            const currentUser = authService.getCurrentUser();

            // Property assertion: Token and user data should be consistent
            if (isAuthenticated && currentUser) {
              const storedToken = authService.getToken();
              expect(storedToken).not.toBeNull();
              
              // Decode token and verify consistency
              const tokenPayload = JSON.parse(atob(storedToken!.split('.')[1]));
              expect(tokenPayload.id).toBe(currentUser.id);
              expect(tokenPayload.email).toBe(currentUser.email);
              expect(tokenPayload.name).toBe(currentUser.name);
              expect(currentUser.id).toBe(userId);
              expect(currentUser.email).toBe(userEmail);
              expect(currentUser.name).toBe(userName);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
