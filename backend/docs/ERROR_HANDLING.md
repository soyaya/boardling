# Error Handling Implementation

## Overview

The Boardling platform implements comprehensive error handling middleware that provides structured error responses, appropriate logging, and error code mapping for all API requests.

## Features

### 1. Structured Error Responses

All API errors return a consistent JSON structure:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "details": {},  // Optional: for validation errors
  "errorId": "abc123def456"  // Only for server errors (5xx)
}
```

### 2. Error Code Mapping

The system automatically maps various error types to appropriate error codes:

| Error Type | HTTP Status | Error Code | Description |
|------------|-------------|------------|-------------|
| UnauthenticatedError | 401 | AUTH_INVALID | Invalid or missing authentication |
| TokenExpiredError | 401 | AUTH_EXPIRED | JWT token has expired |
| ForbiddenError | 403 | PERMISSION_DENIED | User lacks required permissions |
| PrivacyRestrictedError | 403 | PRIVACY_RESTRICTED | Data access restricted by privacy settings |
| NotFoundError | 404 | NOT_FOUND | Resource not found |
| BadRequestError | 400 | BAD_REQUEST | Invalid request data |
| ValidationError | 400 | VALIDATION_ERROR | Input validation failed |
| InsufficientBalanceError | 400 | INSUFFICIENT_BALANCE | Not enough funds |
| PaymentRequiredError | 402 | PAYMENT_REQUIRED | Payment required for feature |
| SubscriptionExpiredError | 402 | SUBSCRIPTION_EXPIRED | Subscription has expired |
| ConflictError | 409 | ALREADY_EXISTS | Resource already exists |
| RateLimitExceededError | 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| CustomAPIError | 500 | INTERNAL_ERROR | Internal server error |
| BlockchainError | 503 | BLOCKCHAIN_ERROR | Blockchain interaction failed |

### 3. Error Logging

The middleware implements intelligent logging based on error severity:

- **Critical Errors (5xx)**: Full error details with stack trace logged to console.error
- **Client Errors (4xx)**: Basic error info logged to console.warn
- **Other Errors**: Logged to console.log

Each log entry includes:
- Unique error ID (for server errors)
- Timestamp
- HTTP method and URL
- Client IP address
- User ID (if authenticated)
- Error code and message

### 4. Database Error Handling

PostgreSQL errors are automatically mapped to appropriate error codes:

- `23505` (unique violation) → `ALREADY_EXISTS` (409)
- `23503` (foreign key violation) → `NOT_FOUND` (404)
- `23502` (not null violation) → `VALIDATION_ERROR` (400)
- `23514` (check violation) → `VALIDATION_ERROR` (400)

### 5. JWT Error Handling

JWT-related errors are automatically detected and mapped:

- `JsonWebTokenError` → `AUTH_INVALID` (401)
- `TokenExpiredError` → `AUTH_EXPIRED` (401)
- `NotBeforeError` → `AUTH_INVALID` (401)

## Usage

### Using Custom Error Classes

```javascript
import {
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
  ForbiddenError,
  ValidationError,
  SubscriptionExpiredError,
  BlockchainError,
  PrivacyRestrictedError,
  InsufficientBalanceError,
} from '../errors/index.js';

// Example: Throw a not found error
if (!user) {
  throw new NotFoundError('User not found');
}

// Example: Throw a validation error with details
if (errors.length > 0) {
  throw new ValidationError('Validation failed', errors);
}

// Example: Throw a subscription expired error
if (subscription.isExpired()) {
  throw new SubscriptionExpiredError();
}

// Example: Throw a blockchain error
try {
  await zcashRPC.getBlock(blockHash);
} catch (error) {
  throw new BlockchainError('Failed to fetch block from Zcash node');
}
```

### Middleware Integration

The error handler is registered as the last middleware in the Express app:

```javascript
import { errorHandlerMiddleware } from './src/middleware/errorHandler.js';

// ... other middleware and routes ...

// Error handling middleware (must be last)
app.use(errorHandlerMiddleware);
```

### Frontend Error Handling

Frontend applications should handle errors based on the error code:

```typescript
try {
  const response = await api.get('/api/projects');
  return response.data;
} catch (error) {
  if (error.response) {
    const { error: errorCode, message } = error.response.data;
    
    switch (errorCode) {
      case 'AUTH_EXPIRED':
        // Redirect to login
        router.push('/signin');
        break;
      case 'SUBSCRIPTION_EXPIRED':
        // Show upgrade modal
        showUpgradeModal();
        break;
      case 'VALIDATION_ERROR':
        // Highlight invalid fields
        highlightErrors(error.response.data.details);
        break;
      case 'INSUFFICIENT_BALANCE':
        // Show balance warning
        showBalanceWarning(message);
        break;
      default:
        // Show generic error
        showError(message);
    }
  }
}
```

## Error Classes

### CustomAPIError (Base Class)

Base class for all custom API errors.

```javascript
class CustomAPIError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 500;
    this.errorCode = 'INTERNAL_ERROR';
  }
}
```

### UnauthenticatedError

Used when authentication is required but not provided or invalid.

```javascript
throw new UnauthenticatedError('Invalid credentials');
```

### NotFoundError

Used when a requested resource doesn't exist.

```javascript
throw new NotFoundError('Project not found');
```

### BadRequestError

Used for invalid request data.

```javascript
throw new BadRequestError('Invalid email format');
```

### ForbiddenError

Used when user lacks required permissions.

```javascript
throw new ForbiddenError('You do not have permission to access this project');
```

### ConflictError

Used when a resource already exists.

```javascript
throw new ConflictError('Email already registered');
```

### PaymentRequiredError

Used when payment is required for a feature.

```javascript
throw new PaymentRequiredError('Premium subscription required');
```

### ValidationError

Used for input validation failures. Supports optional details array.

```javascript
const errors = [
  { field: 'email', message: 'Invalid email format' },
  { field: 'password', message: 'Password must be at least 8 characters' }
];
throw new ValidationError('Validation failed', errors);
```

### SubscriptionExpiredError

Used when a user's subscription has expired.

```javascript
throw new SubscriptionExpiredError();
```

### BlockchainError

Used when blockchain interactions fail.

```javascript
throw new BlockchainError('Failed to connect to Zcash RPC node');
```

### PrivacyRestrictedError

Used when data access is restricted by privacy settings.

```javascript
throw new PrivacyRestrictedError('This data is marked as private');
```

### InsufficientBalanceError

Used when a user doesn't have enough balance for an operation.

```javascript
throw new InsufficientBalanceError('Insufficient balance for withdrawal');
```

### RateLimitExceededError

Used when rate limits are exceeded.

```javascript
throw new RateLimitExceededError();
```

## Testing

The error handler includes comprehensive test coverage:

```bash
# Run error handler verification tests
node tests/verify-error-handler.js
```

Tests verify:
- ✓ Structured error responses for all error types
- ✓ Correct HTTP status codes
- ✓ Proper error code mapping
- ✓ JWT error handling
- ✓ Database error handling
- ✓ Error logging functionality
- ✓ Error ID generation for server errors
- ✓ Timestamp inclusion in all responses

## Best Practices

1. **Use Specific Error Classes**: Always use the most specific error class for your use case
2. **Provide Clear Messages**: Error messages should be user-friendly and actionable
3. **Include Details for Validation**: Use the details parameter for validation errors
4. **Don't Leak Sensitive Info**: Never include sensitive data in error messages
5. **Log Appropriately**: Let the middleware handle logging - don't duplicate logs
6. **Handle Async Errors**: Use try-catch blocks in async functions
7. **Test Error Paths**: Always test error handling in your endpoints

## Security Considerations

- Server errors (5xx) include an error ID but hide internal details from clients
- Database constraint names are not exposed to clients
- Stack traces are only logged server-side, never sent to clients
- Generic messages are used for authentication failures to prevent user enumeration
- Error IDs allow tracking issues without exposing sensitive information

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 14.1**: ✓ Structured error responses with error code and message
- **Requirement 14.5**: ✓ Critical error logging with detailed information while showing generic messages to users

## Related Documentation

- [Authentication Setup](./AUTHENTICATION_SETUP.md)
- [API Documentation](./BACKEND_DOCS.md)
- [Privacy Enforcement](./PRIVACY_ENFORCEMENT_SERVICE.md)
