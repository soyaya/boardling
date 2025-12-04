# Subscription Management System

## Overview

The subscription management system provides comprehensive support for user subscriptions, free trials, and premium access control. It includes a service layer, middleware for access control, and API routes for subscription management.

## Features

- **Free Trial Initialization**: Automatically creates 30-day free trials for new users
- **Subscription Status Checking**: Real-time subscription status validation
- **Premium Access Control**: Middleware to restrict premium features
- **Trial Expiration Warnings**: Automatic warnings when trials are expiring
- **Subscription Upgrades**: Support for upgrading to premium subscriptions
- **Onboarding Tracking**: Track user onboarding completion

## Database Schema

### Users Table Additions

The following fields were added to the `users` table:

```sql
-- Subscription status enum
CREATE TYPE subscription_status AS ENUM ('free', 'premium', 'enterprise');

-- Subscription fields
ALTER TABLE users 
ADD COLUMN subscription_status subscription_status DEFAULT 'free',
ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN balance_zec DECIMAL(16,8) DEFAULT 0 CHECK (balance_zec >= 0);
```

## Service Layer

### `subscriptionService.js`

Located at: `backend/src/services/subscriptionService.js`

#### Functions

**`initializeFreeTrial(userId)`**
- Initializes a 30-day free trial for a new user
- Sets subscription_status to 'free'
- Sets expiration date to 30 days from now
- Returns: Updated user subscription data

**`checkSubscriptionStatus(userId)`**
- Checks if a user's subscription is active
- Calculates days remaining
- Determines if subscription is expired
- Returns: Comprehensive subscription status object

**`updateSubscriptionStatus(userId, newStatus, expiresAt)`**
- Updates a user's subscription status
- Validates status values ('free', 'premium', 'enterprise')
- Sets expiration date
- Returns: Updated subscription data

**`upgradeToPremium(userId, durationMonths)`**
- Upgrades user to premium subscription
- Sets expiration based on duration
- Returns: Updated subscription data

**`getSubscriptionDetails(userId)`**
- Gets comprehensive subscription information
- Includes balance, onboarding status, and member since date
- Returns: Detailed subscription object

**`hasPremiumAccess(userId)`**
- Checks if user has premium or enterprise access
- Returns: Boolean indicating premium access

**`completeOnboarding(userId)`**
- Marks user's onboarding as completed
- Returns: Updated user data

**`getExpiredSubscriptions()`**
- Gets all users with expired subscriptions
- Useful for cleanup and notification tasks
- Returns: Array of users with expired subscriptions

## Middleware

### `subscription.js`

Located at: `backend/src/middleware/subscription.js`

#### Middleware Functions

**`checkSubscription(req, res, next)`**
- Checks subscription status and attaches to `req.subscription`
- Should be used before other subscription middleware
- Non-blocking - always calls next()

**`requireActiveSubscription(req, res, next)`**
- Requires an active subscription (free trial or premium)
- Returns 403 if subscription is expired
- Use after `checkSubscription`

**`requirePremiumSubscription(req, res, next)`**
- Requires premium or enterprise subscription
- Returns 403 if user doesn't have premium access
- Use after `checkSubscription`

**`checkTrialExpiration(req, res, next)`**
- Adds warning headers if trial is expiring soon (< 7 days)
- Headers: `X-Trial-Expiring`, `X-Trial-Days-Remaining`
- Non-blocking - always calls next()

**`requireTrialStatus(req, res, next)`**
- Requires user to be on free trial
- Useful for trial-specific features
- Returns 403 if not on trial

**`attachSubscriptionStatus(req, res, next)`**
- Attaches subscription status to request and response headers
- Non-blocking - always calls next()
- Useful for informational purposes

## API Routes

### `subscription.js`

Located at: `backend/src/routes/subscription.js`

All routes require JWT authentication.

#### Endpoints

**`GET /api/subscriptions/status`**
- Get current subscription status and details
- Returns: Subscription object with status, expiration, balance, etc.

**`POST /api/subscriptions/upgrade`**
- Upgrade to premium subscription
- Body: `{ durationMonths: 1-12 }`
- Returns: Updated subscription data

**`POST /api/subscriptions/cancel`**
- Cancel subscription (downgrade to free)
- Returns: Updated subscription data

**`GET /api/subscriptions/history`**
- Get subscription payment history
- Returns: Array of payment records (placeholder)

**`GET /api/subscriptions/check-premium`**
- Check if user has premium access
- Returns: Boolean indicating premium status

## Usage Examples

### Protecting Routes with Subscription Middleware

```javascript
import { authenticateJWT } from '../middleware/auth.js';
import { checkSubscription, requireActiveSubscription } from '../middleware/subscription.js';

// Require active subscription (free trial or premium)
router.get('/api/analytics/dashboard', 
  authenticateJWT,
  checkSubscription,
  requireActiveSubscription,
  async (req, res) => {
    // User has active subscription
    // Access req.subscription for subscription details
  }
);

// Require premium subscription
router.get('/api/analytics/comparison', 
  authenticateJWT,
  checkSubscription,
  requirePremiumSubscription,
  async (req, res) => {
    // User has premium access
  }
);
```

### Initializing Free Trial on Registration

```javascript
import { initializeFreeTrial } from '../services/subscriptionService.js';

// After creating user
const user = await createUser(name, email, password);
await initializeFreeTrial(user.id);
```

### Checking Subscription Status

```javascript
import { checkSubscriptionStatus } from '../services/subscriptionService.js';

const status = await checkSubscriptionStatus(userId);

console.log(status);
// {
//   userId: '...',
//   status: 'free',
//   expiresAt: '2025-12-30T...',
//   isActive: true,
//   isExpired: false,
//   daysRemaining: 30,
//   isPremium: false
// }
```

### Upgrading to Premium

```javascript
import { upgradeToPremium } from '../services/subscriptionService.js';

// Upgrade for 3 months
const updated = await upgradeToPremium(userId, 3);
```

## Integration with Project Creation

When a user creates their first project, the system should:

1. Check if user already has a subscription
2. If not, initialize a free trial
3. Link the project to the user

Example:

```javascript
import { checkSubscriptionStatus, initializeFreeTrial } from '../services/subscriptionService.js';

async function createFirstProject(userId, projectData) {
  // Check if user has subscription
  try {
    await checkSubscriptionStatus(userId);
  } catch (error) {
    // User doesn't have subscription, initialize free trial
    await initializeFreeTrial(userId);
  }
  
  // Create project
  const project = await createProject(userId, projectData);
  return project;
}
```

## Testing

### Test Files

- `backend/tests/test-subscription-management.js` - Tests subscription service functions
- `backend/tests/test-subscription-middleware.js` - Tests subscription middleware

### Running Tests

```bash
# Test subscription service
DB_USER=postgres DB_PASS=admin DB_NAME=broadlypaywall node tests/test-subscription-management.js

# Test subscription middleware
DB_USER=postgres DB_PASS=admin DB_NAME=broadlypaywall node tests/test-subscription-middleware.js
```

## Requirements Coverage

This implementation covers the following requirements:

- **Requirement 4.2**: Automatically initialize 30-day free trial for first-time users
- **Requirement 4.3**: Restrict access to premium features when free trial expires
- **Requirement 9.1**: Create subscription record with status "free" and 30-day expiration
- **Requirement 9.2**: Grant access to all premium features during active trial
- **Requirement 9.3**: Restrict access and display upgrade prompts when trial expires

## Future Enhancements

1. **Email Notifications**: Send emails when trial is expiring or expired
2. **Payment Integration**: Integrate with Zcash payment system for automatic upgrades
3. **Subscription History**: Track all subscription changes and payments
4. **Usage Limits**: Implement feature usage limits based on subscription tier
5. **Grace Period**: Add grace period after trial expiration
6. **Subscription Analytics**: Track subscription conversion rates and churn

## Error Handling

All functions and middleware include comprehensive error handling:

- User not found errors
- Invalid subscription status errors
- Database connection errors
- Validation errors

Errors are logged and appropriate HTTP status codes are returned:

- `400` - Validation errors
- `401` - Authentication required
- `403` - Subscription expired or insufficient permissions
- `404` - User not found
- `500` - Internal server errors

## Security Considerations

1. **JWT Authentication**: All subscription routes require valid JWT tokens
2. **User Isolation**: Users can only access their own subscription data
3. **Status Validation**: Subscription status values are validated against enum
4. **SQL Injection Prevention**: All queries use parameterized statements
5. **Balance Protection**: Balance field has CHECK constraint to prevent negative values
