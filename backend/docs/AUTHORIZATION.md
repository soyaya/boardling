# Authorization Middleware

This document describes the authorization middleware system for the Boardling platform, which provides resource ownership verification, admin permission checking, and flexible access control.

## Overview

The authorization middleware works in conjunction with the authentication middleware to ensure that users can only access resources they own or have permission to access. It supports:

- **User Ownership Verification**: Ensures users can only access their own resources
- **Admin Permission Checking**: Grants admin users elevated privileges
- **Flexible Access Control**: Combines ownership and admin checks for flexible authorization
- **Self-or-Admin Access**: Allows users to access their own data or admins to access any data

## Middleware Functions

### `requireOwnership(resourceType, paramName)`

Verifies that the authenticated user owns the specified resource.

**Parameters:**
- `resourceType` (string): Type of resource (e.g., 'project', 'wallet', 'invoice')
- `paramName` (string, optional): Name of the route parameter containing the resource ID (default: 'id')

**Supported Resource Types:**
- `project`: Projects table
- `wallet`: Wallets table (ownership through projects)
- `invoice`: Invoices table
- `unified_invoice`: Unified invoices table
- `withdrawal`: Withdrawals table
- `api_key`: API keys table

**Example Usage:**
```javascript
import { authenticateJWT } from '../middleware/auth.js';
import { requireOwnership } from '../middleware/authorization.js';

// Protect project routes
router.get('/projects/:id', authenticateJWT, requireOwnership('project'), getProjectController);
router.put('/projects/:id', authenticateJWT, requireOwnership('project'), updateProjectController);

// Protect wallet routes with custom parameter name
router.get('/wallets/:walletId', authenticateJWT, requireOwnership('wallet', 'walletId'), getWalletController);
```

**Behavior:**
- Returns `403 Forbidden` if the user doesn't own the resource
- Returns `404 Not Found` if the resource doesn't exist
- Calls `next()` without error if ownership is verified

---

### `requireAdmin(req, res, next)`

Verifies that the authenticated user has admin privileges.

**Example Usage:**
```javascript
import { authenticateJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/authorization.js';

// Protect admin routes
router.get('/admin/stats', authenticateJWT, requireAdmin, getStatsController);
router.get('/admin/users', authenticateJWT, requireAdmin, getUsersController);

// Apply to all routes in a router
router.use(authenticateJWT);
router.use(requireAdmin);
```

**Behavior:**
- Returns `403 Forbidden` if the user is not an admin
- Calls `next()` without error if admin privileges are verified

---

### `requireAccess(resourceType, paramName)`

Verifies that the authenticated user can access the specified resource. This is a more flexible version that allows both owners and admins to access resources.

**Parameters:**
- `resourceType` (string): Type of resource (same as `requireOwnership`)
- `paramName` (string, optional): Name of the route parameter (default: 'id')

**Example Usage:**
```javascript
import { authenticateJWT } from '../middleware/auth.js';
import { requireAccess } from '../middleware/authorization.js';

// Allow owners and admins to access
router.get('/projects/:id', authenticateJWT, requireAccess('project'), getProjectController);
```

**Behavior:**
- Admins can access any resource
- Non-admins must own the resource
- Sets `req.isAdmin = true` if the user is an admin
- Returns `403 Forbidden` if access is denied
- Returns `404 Not Found` if the resource doesn't exist

---

### `requireSelfOrAdmin(location, fieldName)`

Verifies that the user in the request matches the authenticated user, or that the authenticated user is an admin. Useful for endpoints that modify user data.

**Parameters:**
- `location` (string): Where to find the user ID ('body' or 'params')
- `fieldName` (string, optional): Name of the field containing the user ID (default: 'userId')

**Example Usage:**
```javascript
import { authenticateJWT } from '../middleware/auth.js';
import { requireSelfOrAdmin } from '../middleware/authorization.js';

// Users can update their own profile, admins can update any profile
router.put('/users/:userId', authenticateJWT, requireSelfOrAdmin('params', 'userId'), updateUserController);

// Check user ID in request body
router.post('/users/update', authenticateJWT, requireSelfOrAdmin('body', 'userId'), updateUserController);
```

**Behavior:**
- Users can access their own data
- Admins can access any user's data
- Sets `req.isAdmin = true` if the user is an admin
- Returns `403 Forbidden` if access is denied

---

## Admin Role Setup

### Database Migration

The admin role is added to the users table via migration `012_add_admin_role.sql`:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;
```

### Creating Admin Users

To create an admin user, set the `is_admin` field to `true`:

```sql
-- Create a new admin user
INSERT INTO users (name, email, password_hash, is_admin)
VALUES ('Admin User', 'admin@example.com', 'hashed_password', true);

-- Promote an existing user to admin
UPDATE users SET is_admin = true WHERE email = 'user@example.com';
```

---

## Error Responses

All authorization middleware functions return structured error responses:

### 401 Unauthorized
```json
{
  "error": "AUTH_REQUIRED",
  "message": "Authentication required"
}
```

### 403 Forbidden (Ownership)
```json
{
  "error": "PERMISSION_DENIED",
  "message": "You do not have permission to access this project"
}
```

### 403 Forbidden (Admin)
```json
{
  "error": "PERMISSION_DENIED",
  "message": "Admin privileges required"
}
```

### 404 Not Found
```json
{
  "error": "NOT_FOUND",
  "message": "project not found"
}
```

---

## Best Practices

### 1. Always Use with Authentication

Authorization middleware should always be used after authentication middleware:

```javascript
// ✅ Correct
router.get('/projects/:id', authenticateJWT, requireOwnership('project'), getProjectController);

// ❌ Wrong - no authentication
router.get('/projects/:id', requireOwnership('project'), getProjectController);
```

### 2. Choose the Right Middleware

- Use `requireOwnership` when only the owner should access the resource
- Use `requireAdmin` for admin-only endpoints
- Use `requireAccess` when both owners and admins should have access
- Use `requireSelfOrAdmin` for user profile endpoints

### 3. Apply Middleware at the Route Level

Apply authorization middleware to specific routes rather than globally:

```javascript
// ✅ Correct - specific routes
router.get('/projects', authenticateJWT, getProjectsController);  // No ownership check for list
router.get('/projects/:id', authenticateJWT, requireOwnership('project'), getProjectController);

// ❌ Wrong - applied globally
router.use(requireOwnership('project'));  // Breaks list endpoint
```

### 4. Handle Custom Parameter Names

When using non-standard parameter names, specify them explicitly:

```javascript
// Custom parameter name
router.get('/projects/:projectId/wallets/:walletId', 
  authenticateJWT, 
  requireOwnership('wallet', 'walletId'),  // Specify 'walletId'
  getWalletController
);
```

---

## Testing

### Unit Tests

Unit tests are located in `tests/unit/authorization.test.js` and cover:
- Owner access to their own resources
- Non-owner denial of access
- Admin access to admin endpoints
- Non-admin denial of admin endpoints
- Admin access to any resource
- Self-or-admin access patterns

### Property-Based Tests

Property-based tests are located in `tests/property/authorization-properties.test.js` and verify:
- **Property 63**: Invalid token rejection (Requirements 15.2)
- **Property 64**: Cross-user access prevention (Requirements 15.3)
- **Property 65**: Authorized data access (Requirements 15.4)
- **Property 66**: Admin permission verification (Requirements 15.5)

### Verification Script

Run the verification script to test all authorization functionality:

```bash
node tests/verify-authorization.js
```

---

## Implementation Details

### Ownership Verification

Ownership is verified by querying the database to check if the resource's `user_id` matches the authenticated user's ID:

```javascript
// For projects
SELECT user_id FROM projects WHERE id = $1

// For wallets (through projects)
SELECT p.user_id 
FROM wallets w
JOIN projects p ON w.project_id = p.id
WHERE w.id = $1
```

### Admin Verification

Admin status is checked by querying the `is_admin` field in the users table:

```javascript
SELECT is_admin FROM users WHERE id = $1
```

### Performance Considerations

- All authorization checks use indexed queries for fast lookups
- The `is_admin` field has a partial index for efficient admin lookups
- Ownership checks are combined with resource existence checks to minimize queries

---

## Related Documentation

- [Authentication Setup](./AUTHENTICATION_SETUP.md) - JWT authentication middleware
- [Error Handling](./ERROR_HANDLING.md) - Error response structure
- [API Endpoints](./BACKEND_DOCS.md) - Complete API documentation

---

## Requirements Validation

This authorization middleware implements the following requirements:

- **Requirement 15.2**: Invalid or expired JWT tokens return 401 Unauthorized
- **Requirement 15.3**: Cross-user access attempts return 403 Forbidden
- **Requirement 15.4**: Authorized users can access their own data
- **Requirement 15.5**: Admin users can access admin endpoints

All requirements are validated through property-based testing with 100+ test iterations per property.
