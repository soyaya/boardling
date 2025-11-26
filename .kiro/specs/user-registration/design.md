# Design Document

## Overview

This design document outlines the architecture for unifying the existing backend servers and integrating the complete user journey from registration to premium analytics access. The solution merges the simple authentication server (app.js) with the comprehensive Zcash Paywall SDK server (src/index.js) to create a single, cohesive backend that supports the full user flow:

**Complete User Journey:**
1. **SignUp/SignIn** → User creates account and authenticates
2. **Project Creation** → User creates their first analytics project  
3. **Wallet Addition** → User adds Zcash wallets to track
4. **Analytics Access** → User views wallet analytics and insights
5. **ZEC Payment** → User pays with Zcash for premium features

The unified backend will serve authentication, project management, wallet analytics, and Zcash payment functionality in a seamless experience.

## Architecture

### Current State
- **Simple Auth Server (app.js)**: Basic Express server with `/auth` routes for registration/login
- **Zcash Paywall SDK Server (src/index.js)**: Comprehensive API server with analytics, payments, and user management
- **Frontend**: React components (SignIn/SignUp) with no backend integration

### Target State
- **Unified Backend Server**: Single Express server combining all functionality
- **Integrated Frontend**: React components connected to unified backend APIs
- **Consolidated Authentication**: JWT-based auth system across all routes
- **Seamless Payment Integration**: Zcash payments integrated with user authentication

## Components and Interfaces

### Backend Components

#### 1. Unified Server Entry Point
```javascript
// New unified server structure
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import existing route modules
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';
import walletRoutes from './routes/wallet.js';
import projectRoutes from './routes/project.js';
// ... other existing routes

const app = express();

// Middleware configuration
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Route mounting
app.use('/auth', authRoutes);           // Authentication routes
app.use('/api', analyticsRoutes);       // Analytics routes  
app.use('/api', walletRoutes);          // Wallet routes
app.use('/api/projects', projectRoutes); // Project routes
// ... other routes

app.listen(3001, () => console.log('Unified server running on port 3001'));
```

#### 2. Authentication Integration
- **Existing Auth Controllers**: Reuse existing user registration/login logic
- **JWT Middleware**: Apply authentication middleware to protected analytics routes
- **User Context**: Pass authenticated user information to analytics services

#### 3. Route Structure (Supporting Complete User Flow)
```
# Step 1: Authentication
/auth/register          - User registration (SignUp page)
/auth/login            - User authentication (SignIn page)
/auth/logout           - Session termination
/auth/forgot-password  - Password reset
/auth/reset-password   - Password reset confirmation

# Step 2: Project Management  
/api/projects/create   - Create new analytics project (protected)
/api/projects/:id      - Get/update project details (protected)
/api/projects/user/:userId - List user's projects (protected)

# Step 3: Wallet Management
/api/wallets/add       - Add wallet to project (protected)
/api/wallets/:id       - Get/update wallet details (protected)
/api/projects/:projectId/wallets - List project wallets (protected)

# Step 4: Analytics Access
/api/analytics/dashboard/:projectId - Dashboard data (protected)
/api/analytics/cohorts/:projectId   - Cohort analysis (protected)
/api/analytics/funnel/:projectId    - Adoption funnel (protected)
/api/analytics/retention/:projectId - Retention metrics (protected)

# Step 5: ZEC Payments
/api/invoice/create    - Create payment invoice for premium features
/api/invoice/check     - Check payment status
/api/users/:id/subscription - Update subscription status after payment
```

### Frontend Components

#### 1. Authentication Service
```typescript
// Frontend authentication service
class AuthService {
  private baseURL = 'http://localhost:3001';
  
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }
  
  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  }
  
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }
  
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
  
  clearToken(): void {
    localStorage.removeItem('auth_token');
  }
}
```

#### 2. Authentication Context
```typescript
// React context for authentication state
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

#### 3. Protected Route Component
```typescript
// Route protection component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  return <>{children}</>;
};
```

## Data Models

### User Model (Enhanced)
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  subscription_status: 'free' | 'premium' | 'enterprise';
  onboarding_step: 'registration' | 'project_creation' | 'wallet_addition' | 'analytics_access' | 'completed';
  created_at: Date;
  updated_at: Date;
}
```

### Project Model
```typescript
interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  wallet_count: number;
  created_at: Date;
  updated_at: Date;
}
```

### Wallet Model
```typescript
interface Wallet {
  id: string;
  project_id: string;
  address: string;
  label?: string;
  wallet_type: 'transparent' | 'shielded' | 'unified';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### Authentication Response
```typescript
interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}
```

### API Request Headers
```typescript
interface AuthenticatedRequest {
  headers: {
    'Authorization': `Bearer ${token}`;
    'Content-Type': 'application/json';
  }
}
```
## Correct
ness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Authentication route handling consistency
*For any* authentication endpoint (/auth/register, /auth/login, /auth/logout), the unified backend should handle requests using the existing auth controllers and return consistent response formats
**Validates: Requirements 1.2**

Property 2: Analytics route authentication enforcement
*For any* analytics endpoint (/api/analytics/*, /api/projects/*, /api/wallets/*), access should be denied without valid JWT tokens and granted with valid authentication
**Validates: Requirements 1.3, 5.1**

Property 3: CORS and security middleware consistency
*For any* route in the unified backend, security headers and CORS configuration should be applied uniformly across all endpoints
**Validates: Requirements 1.5**

Property 4: Frontend registration error handling
*For any* registration error response from the backend, the frontend should display the error message in the UI without navigation or redirection
**Validates: Requirements 2.2**

Property 5: Frontend form validation prevention
*For any* invalid form data (empty fields, invalid email, weak password), the frontend should prevent form submission and display validation feedback
**Validates: Requirements 2.5**

Property 6: Frontend login error handling
*For any* authentication error response, the frontend should display the error message without redirecting and maintain the current page state
**Validates: Requirements 3.2**

Property 7: Frontend network error handling
*For any* network connectivity issue during authentication requests, the frontend should display connection error messages and provide retry options
**Validates: Requirements 2.4, 3.5**

Property 8: JWT token storage and management
*For any* successful authentication, the session management should store JWT tokens securely and retrieve them consistently for API requests
**Validates: Requirements 4.1, 6.4**

Property 9: Session restoration consistency
*For any* stored valid JWT token, returning to the application should automatically restore the authenticated session without requiring re-login
**Validates: Requirements 4.2**

Property 10: Token expiration handling
*For any* expired or invalid JWT token, the session management should clear the session and redirect to the SignIn page consistently
**Validates: Requirements 4.3, 4.5, 6.3**

Property 11: Protected route access control
*For any* protected route, unauthenticated users should be redirected to SignIn while authenticated users should be granted access
**Validates: Requirements 6.1, 6.2**

Property 12: Premium feature access control
*For any* premium feature access attempt, the system should check subscription status and initiate payment flows when required
**Validates: Requirements 5.2**

Property 13: API authentication header inclusion
*For any* API request to protected endpoints, the frontend should include valid JWT tokens in the Authorization header
**Validates: Requirements 5.4, 6.4**

Property 14: Subscription status consistency
*For any* subscription status change, updated access permissions should be reflected consistently across all API endpoints
**Validates: Requirements 5.5**

Property 15: API authentication error handling
*For any* API response indicating authentication errors (401, 403), the frontend should handle token expiration and redirect appropriately
**Validates: Requirements 6.5**

## Error Handling

### Backend Error Handling
- **Validation Errors**: Return 400 status with specific field validation messages
- **Authentication Errors**: Return 401 status with clear error descriptions
- **Authorization Errors**: Return 403 status when user lacks required permissions
- **Rate Limiting**: Return 429 status with retry-after headers
- **Server Errors**: Return 500 status with generic error messages (hide internal details)

### Frontend Error Handling
- **Network Errors**: Display user-friendly connection error messages with retry buttons
- **Validation Errors**: Show inline field validation with specific error messages
- **Authentication Errors**: Display error messages without redirecting, allow retry
- **Session Expiration**: Automatically redirect to SignIn and clear stored tokens
- **API Errors**: Handle different error types appropriately based on status codes

## Testing Strategy

### Dual Testing Approach
The testing strategy combines unit testing and property-based testing to ensure comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and integration points
- **Property Tests**: Verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Unit Testing Requirements
Unit tests will cover:
- Specific authentication flows (registration, login, logout)
- Error handling scenarios with known inputs
- Integration points between frontend and backend
- Route protection with specific user states
- Payment integration with known subscription statuses

### Property-Based Testing Requirements
Property-based tests will use **Jest with fast-check** library for JavaScript/TypeScript testing. Each property-based test will:
- Run a minimum of 100 iterations to ensure thorough testing
- Be tagged with comments referencing the design document property
- Use the format: `**Feature: user-registration, Property {number}: {property_text}**`

Each correctness property will be implemented by a single property-based test that generates random valid inputs and verifies the property holds across all test cases.

### Testing Implementation
- **Frontend Tests**: React Testing Library with Jest for component testing
- **Backend Tests**: Supertest with Jest for API endpoint testing  
- **Integration Tests**: End-to-end testing of authentication flows
- **Property Tests**: Fast-check for property-based testing of authentication logic
- **Coverage Requirements**: Minimum 80% code coverage for authentication components