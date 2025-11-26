# Implementation Plan

- [x] 1. Unify backend servers into single consolidated system





  - Merge app.js authentication server with src/index.js Zcash Paywall SDK server
  - Configure unified Express server with all existing middleware and routes
  - Ensure authentication routes (/auth/*) and analytics routes (/api/*) work together
  - Test that both authentication and analytics functionality work in unified server
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 1.1 Write property test for unified backend route handling
  - **Property 1: Authentication route handling consistency**
  - **Validates: Requirements 1.2**

- [ ]* 1.2 Write property test for analytics authentication enforcement
  - **Property 2: Analytics route authentication enforcement**
  - **Validates: Requirements 1.3, 5.1**


- [x] 2. Implement frontend authentication service and state management


- [x] 2.1 Create authentication service for API communication


  - Build AuthService class with register, login, logout methods
  - Implement JWT token storage and retrieval in localStorage
  - Add error handling for network issues and API errors
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_




- [x] 2.2 Create React authentication context and provider

  - Build AuthContext with user state, authentication status, and auth methods
  - Implement authentication state persistence across page refreshes
  - Add loading states and error handling for authentication operations
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 2.3 Write property test for JWT token management
  - **Property 8: JWT token storage and management**
  - **Validates: Requirements 4.1, 6.4**





- [ ]* 2.4 Write property test for session restoration
  - **Property 9: Session restoration consistency**
  - **Validates: Requirements 4.2**


- [x] 3. Connect SignUp page to unified backend

- [x] 3.1 Integrate SignUp form with authentication service
  - Connect form submission to AuthService.register method
  - Implement form validation and error display
  - Add loading states and success handling with redirect to onboarding
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_





- [ ]* 3.2 Write property test for registration error handling
  - **Property 4: Frontend registration error handling**
  - **Validates: Requirements 2.2**

- [ ]* 3.3 Write property test for form validation
  - **Property 5: Frontend form validation prevention**

  - **Validates: Requirements 2.5**


- [x] 4. Connect SignIn page to unified backend
- [x] 4.1 Integrate SignIn form with authentication service
  - Connect form submission to AuthService.login method



  - Implement error handling for invalid credentials and rate limiting
  - Add success handling with redirect to dashboard
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x]* 4.2 Write property test for login error handling

  - **Property 6: Frontend login error handling**
  - **Validates: Requirements 3.2**


- [x]* 4.3 Write property test for network error handling

  - **Property 7: Frontend network error handling**
  - **Validates: Requirements 2.4, 3.5**

- [x] 5. Implement protected routes and authentication guards
- [x] 5.1 Create ProtectedRoute component
  - Build route wrapper that checks authentication status
  - Implement redirect to SignIn for unauthenticated users
  - Add token validation and automatic session clearing for invalid tokens





  - _Requirements: 6.1, 6.2, 6.3_

- [x] 5.2 Apply authentication guards to dashboard and analytics routes
  - Wrap all protected routes with ProtectedRoute component


  - Ensure proper authentication state checking before route access
  - Test route protection with various authentication states
  - _Requirements: 6.1, 6.2, 6.3_



- [ ]* 5.3 Write property test for protected route access control
  - **Property 11: Protected route access control**

  - **Validates: Requirements 6.1, 6.2**



- [ ]* 5.4 Write property test for token expiration handling
  - **Property 10: Token expiration handling**
  - **Validates: Requirements 4.3, 4.5, 6.3**


- [x] 6. Implement project creation flow (Step 2 of user journey)
- [x] 6.1 Create project creation API endpoints in unified backend
  - Add POST /api/projects/create endpoint for new project creation
  - Add GET /api/projects/user/:userId endpoint for listing user projects
  - Implement authentication middleware for project endpoints
  - _Requirements: 5.1, 5.4_

- [x] 6.2 Build project creation frontend components
  - Create ProjectCreation component for new project setup
  - Implement form for project name and description
  - Add API integration for project creation with authentication headers
  - _Requirements: 5.4, 6.4_

- [x] 7. Implement wallet addition flow (Step 3 of user journey)


- [x] 7.1 Create wallet management API endpoints

  - Add POST /api/wallets/add endpoint for adding wallets to projects
  - Add GET /api/projects/:projectId/wallets endpoint for listing project wallets
  - Implement wallet validation and type detection (transparent/shielded/unified)
  - _Requirements: 5.1, 5.4_

- [x] 7.2 Build wallet addition frontend components


  - Create WalletAddition component for adding wallets to projects
  - Implement wallet address validation and type detection
  - Add API integration with proper authentication headers
  - _Requirements: 5.4, 6.4_

- [x] 8. Integrate analytics access with authentication (Step 4 of user journey)


- [x] 8.1 Apply authentication middleware to existing analytics routes

  - Add JWT authentication middleware to all /api/analytics/* routes
  - Ensure user context is passed to analytics services
  - Test that analytics endpoints require valid authentication
  - _Requirements: 5.1, 5.4_

- [x] 8.2 Update frontend analytics components with authentication

  - Add authentication headers to all analytics API calls
  - Implement error handling for authentication failures in analytics
  - Test analytics access with authenticated and unauthenticated states

  - _Requirements: 5.4, 6.4, 6.5_

- [ ]* 8.3 Write property test for API authentication headers
  - **Property 13: API authentication header inclusion**
  - **Validates: Requirements 5.4, 6.4**

- [ ]* 8.4 Write property test for API authentication error handling
  - **Property 15: API authentication error handling**
  - **Validates: Requirements 6.5**

- [x] 9. Implement ZEC payment integration (Step 5 of user journey)





- [x] 9.1 Integrate premium feature access control

  - Add subscription status checking to premium analytics endpoints
  - Implement payment flow initiation for premium feature access
  - Connect existing Zcash Paywall SDK with user authentication system
  - _Requirements: 5.2, 5.3_

- [x] 9.2 Build payment frontend components

  - Create premium feature upgrade components
  - Implement payment flow UI with Zcash payment options
  - Add subscription status display and management
  - _Requirements: 5.2, 5.3_

- [ ]* 9.3 Write property test for premium feature access control
  - **Property 12: Premium feature access control**
  - **Validates: Requirements 5.2**

- [ ]* 9.4 Write property test for subscription status consistency
  - **Property 14: Subscription status consistency**
  - **Validates: Requirements 5.5**

- [x] 10. Checkpoint - Ensure all authentication and integration tests pass

  - Ensure all tests pass, ask the user if questions arise.
  - Verify complete user flow from registration to premium access
  - Test authentication persistence and session management
  - Validate analytics access with proper authentication

- [x] 11. Implement comprehensive error handling and user experience improvements

- [x] 11.1 Add comprehensive error handling across the application

  - Implement consistent error message display throughout the UI
  - Add retry mechanisms for network failures
  - Create user-friendly error pages for different error types
  - _Requirements: 2.2, 2.4, 3.2, 3.5, 6.5_

- [x] 11.2 Add loading states and user feedback

  - Implement loading spinners for authentication operations
  - Add progress indicators for multi-step processes
  - Create success notifications for completed actions
  - _Requirements: All user experience related requirements_

- [ ]* 11.3 Write unit tests for error handling scenarios
  - Test various error conditions and user feedback
  - Verify retry mechanisms work correctly
  - Test loading states and progress indicators
  - _Requirements: 2.2, 2.4, 3.2, 3.5, 6.5_

- [x] 12. Final integration testing and deployment preparation

- [x] 12.1 Perform end-to-end testing of complete user journey

  - Test full flow: SignUp → Project Creation → Wallet Addition → Analytics → Payment
  - Verify authentication persistence across all steps
  - Test error scenarios and recovery paths
  - _Requirements: All requirements_

- [x] 12.2 Prepare unified backend for deployment

  - Configure environment variables for unified server
  - Update deployment scripts to use unified backend
  - Test production configuration and security settings
  - _Requirements: 1.1, 1.5_

- [ ]* 12.3 Write integration tests for complete user flow
  - Test end-to-end user journey with automated tests
  - Verify authentication works across all application features
  - Test payment integration and subscription management
  - _Requirements: All requirements_

- [x] 13. Final checkpoint - Complete system validation

  - Ensure all tests pass, ask the user if questions arise.
  - Verify unified backend serves all functionality correctly
  - Validate complete user journey works seamlessly
  - Confirm ZEC payment integration functions properly