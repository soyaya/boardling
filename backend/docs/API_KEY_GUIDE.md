# Zcash Paywall SDK - API Key Authentication Guide

This guide covers everything you need to know about API key authentication in the Zcash Paywall SDK.

## 🔑 Overview

API keys provide secure, token-based authentication for the Zcash Paywall API. They offer:

- **Secure Authentication**: SHA-256 hashed keys stored securely
- **Permission-Based Access**: Fine-grained control over API access
- **Usage Tracking**: Monitor API key usage and activity
- **Expiration Support**: Set automatic expiration dates
- **Easy Management**: Create, update, regenerate, and deactivate keys

## 🚀 Quick Start

### 1. Create a User

```javascript
import { ZcashPaywall } from "zcash-paywall-sdk";

const paywall = new ZcashPaywall({
  baseURL: "http://localhost:3000",
});

// Create user first
const user = await paywall.users.create({
  email: "user@example.com",
  name: "John Doe",
});
```

### 2. Create API Key

```javascript
// Create API key for the user
const apiKeyResponse = await paywall.apiKeys.create({
  user_id: user.id,
  name: "My App API Key",
  permissions: ["read", "write"],
  expires_in_days: 30,
});

console.log("API Key:", apiKeyResponse.api_key);
// Store this securely - it won't be shown again!
```

### 3. Use API Key

```javascript
// Create authenticated SDK instance
const authenticatedPaywall = new ZcashPaywall({
  baseURL: "http://localhost:3000",
  apiKey: apiKeyResponse.api_key,
});

// Now you can access protected endpoints
const invoice = await authenticatedPaywall.invoices.create({
  user_id: user.id,
  type: "one_time",
  amount_zec: 0.01,
});
```

## 🔐 API Key Format

API keys follow this format:

- **Prefix**: `zp_` (Zcash Paywall)
- **Length**: 67 characters total
- **Example**: `zp_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

## 🎯 Permissions System

### Available Permissions

| Permission | Description                | Endpoints                     |
| ---------- | -------------------------- | ----------------------------- |
| `read`     | Read-only access           | GET endpoints                 |
| `write`    | Create/update access       | POST, PUT endpoints           |
| `admin`    | Full administrative access | All endpoints including admin |

### Permission Examples

```javascript
// Read-only access
const readOnlyKey = await paywall.apiKeys.create({
  user_id: user.id,
  name: "Read Only Key",
  permissions: ["read"],
});

// Read and write access
const readWriteKey = await paywall.apiKeys.create({
  user_id: user.id,
  name: "Read Write Key",
  permissions: ["read", "write"],
});

// Full admin access
const adminKey = await paywall.apiKeys.create({
  user_id: user.id,
  name: "Admin Key",
  permissions: ["admin"],
});
```

## 📋 Endpoint Authentication Requirements

### Public Endpoints (No Authentication Required)

- `GET /health`
- `GET /api/config`
- `GET /api` (API documentation)

### Optional Authentication

These endpoints work without authentication but may provide additional features when authenticated:

- `POST /api/users/create`
- `POST /api/invoice/create`
- `POST /api/invoice/check`
- `GET /api/invoice/:id`
- `GET /api/invoice/:id/qr`
- `GET /api/invoice/:id/uri`
- `GET /api/invoice/user/:user_id`
- `POST /api/withdraw/create`
- `GET /api/withdraw/:id`
- `GET /api/withdraw/user/:user_id`
- `POST /api/withdraw/fee-estimate`
- `GET /api/users/:id`
- `GET /api/users/email/:email`
- `PUT /api/users/:id`
- `GET /api/users/:id/balance`

### Required Authentication

- All `/api/keys/*` endpoints

### Admin Permission Required

- `GET /api/users` (list all users)
- `POST /api/withdraw/process/:id`
- All `/api/admin/*` endpoints

## 🛠️ API Key Management

### Create API Key

```javascript
const apiKeyResponse = await paywall.apiKeys.create({
  user_id: "user-uuid",
  name: "My Application Key",
  permissions: ["read", "write"],
  expires_in_days: 90, // Optional
});

// Response includes:
// - api_key: The actual key (only shown once!)
// - key_info: Metadata about the key
// - warning: Reminder to store securely
```

### List User's API Keys

```javascript
const userKeys = await paywall.apiKeys.listByUser(userId);

console.log("Total keys:", userKeys.total);
userKeys.api_keys.forEach((key) => {
  console.log(`${key.name}: ${key.is_active ? "Active" : "Inactive"}`);
  console.log(`Permissions: ${key.permissions.join(", ")}`);
  console.log(`Usage: ${key.usage_count} requests`);
});
```

### Get API Key Details

```javascript
const keyDetails = await paywall.apiKeys.getById(keyId);

console.log("Key name:", keyDetails.api_key.name);
console.log("Created:", keyDetails.api_key.created_at);
console.log("Last used:", keyDetails.api_key.last_used_at);
console.log("Usage count:", keyDetails.api_key.usage_count);
```

### Update API Key

```javascript
// Update name and permissions
const updatedKey = await paywall.apiKeys.update(keyId, {
  name: "Updated Key Name",
  permissions: ["read", "write", "admin"],
  is_active: true,
});

// Deactivate key
const deactivatedKey = await paywall.apiKeys.update(keyId, {
  is_active: false,
});
```

### Regenerate API Key

```javascript
// Generate new key value (old key becomes invalid)
const regeneratedKey = await paywall.apiKeys.regenerate(keyId);

console.log("New API key:", regeneratedKey.api_key);
// Update your application with the new key!
```

### Delete API Key

```javascript
// Soft delete (deactivates the key)
const result = await paywall.apiKeys.delete(keyId);
console.log(result.message); // "API key deactivated successfully"
```

## 🔧 SDK Configuration with API Keys

### Method 1: Constructor

```javascript
const paywall = new ZcashPaywall({
  baseURL: "https://api.yourcompany.com",
  apiKey: "zp_your_api_key_here",
});
```

### Method 2: Environment Variable

```bash
# .env file
SDK_DEFAULT_API_KEY=zp_your_api_key_here
```

```javascript
const paywall = new ZcashPaywall(); // Uses env var
```

### Method 3: Dynamic Setting

```javascript
const paywall = new ZcashPaywall();

// Set API key later
paywall.setApiKey("zp_your_api_key_here");

// Check if set
if (paywall.hasApiKey()) {
  // Make authenticated requests
}

// Remove API key
paywall.removeApiKey();
```

### Method 4: Per-Request

```javascript
// Override API key for specific requests
const response = await paywall.client.get("/api/users/123", {
  headers: {
    Authorization: "Bearer zp_different_api_key",
  },
});
```

## 🔒 Security Best Practices

### 1. Store API Keys Securely

```javascript
// ✅ Good: Use environment variables
const apiKey = process.env.ZCASH_API_KEY;

// ❌ Bad: Hardcode in source code
const apiKey = "zp_1234567890abcdef...";
```

### 2. Use Appropriate Permissions

```javascript
// ✅ Good: Minimal permissions
const readOnlyKey = await paywall.apiKeys.create({
  user_id: userId,
  name: "Analytics Dashboard",
  permissions: ["read"], // Only what's needed
});

// ❌ Bad: Excessive permissions
const adminKey = await paywall.apiKeys.create({
  user_id: userId,
  name: "Simple App",
  permissions: ["admin"], // Too much access
});
```

### 3. Set Expiration Dates

```javascript
// ✅ Good: Set reasonable expiration
const temporaryKey = await paywall.apiKeys.create({
  user_id: userId,
  name: "Temporary Integration",
  permissions: ["read", "write"],
  expires_in_days: 30, // Expires automatically
});
```

### 4. Monitor Usage

```javascript
// Regularly check API key usage
const keys = await paywall.apiKeys.listByUser(userId);

keys.api_keys.forEach((key) => {
  if (key.usage_count === 0 && isOlderThan30Days(key.created_at)) {
    console.log(`Unused key: ${key.name}`);
    // Consider deactivating
  }

  if (key.last_used_at && isOlderThan90Days(key.last_used_at)) {
    console.log(`Stale key: ${key.name}`);
    // Consider regenerating
  }
});
```

### 5. Rotate Keys Regularly

```javascript
// Rotate keys periodically
const rotateApiKey = async (keyId) => {
  // Generate new key
  const newKey = await paywall.apiKeys.regenerate(keyId);

  // Update your application configuration
  await updateApplicationConfig(newKey.api_key);

  console.log("API key rotated successfully");
};
```

## 🚨 Error Handling

### Common API Key Errors

```javascript
try {
  const result = await paywall.invoices.create({...});
} catch (error) {
  switch (error.status) {
    case 401:
      if (error.message.includes('Missing Authorization header')) {
        console.log('No API key provided');
        // Prompt user to set API key
      } else if (error.message.includes('Invalid API key')) {
        console.log('API key is invalid or expired');
        // Regenerate or create new key
      }
      break;

    case 403:
      console.log('Insufficient permissions');
      console.log('Required permission:', error.data?.required_permission);
      console.log('Your permissions:', error.data?.your_permissions);
      // Update key permissions
      break;

    default:
      console.error('Unexpected error:', error.message);
  }
}
```

### Automatic Retry with Key Rotation

```javascript
const makeRequestWithRetry = async (requestFn, keyId) => {
  try {
    return await requestFn();
  } catch (error) {
    if (error.status === 401 && error.message.includes("expired")) {
      // Try to regenerate key and retry
      const newKey = await paywall.apiKeys.regenerate(keyId);
      paywall.setApiKey(newKey.api_key);

      // Retry the request
      return await requestFn();
    }
    throw error;
  }
};
```

## 📊 Monitoring and Analytics

### Track API Key Usage

```javascript
const analyzeApiKeyUsage = async (userId) => {
  const keys = await paywall.apiKeys.listByUser(userId);

  const analysis = {
    total_keys: keys.total,
    active_keys: keys.api_keys.filter((k) => k.is_active).length,
    total_requests: keys.api_keys.reduce((sum, k) => sum + k.usage_count, 0),
    most_used: keys.api_keys.sort((a, b) => b.usage_count - a.usage_count)[0],
    unused_keys: keys.api_keys.filter((k) => k.usage_count === 0),
  };

  console.log("API Key Analysis:", analysis);
  return analysis;
};
```

### Health Check with Authentication

```javascript
const checkApiKeyHealth = async (apiKey) => {
  const testPaywall = new ZcashPaywall({
    baseURL: "http://localhost:3000",
    apiKey: apiKey,
  });

  try {
    const health = await testPaywall.getHealth();
    console.log("✅ API key is valid");
    return { valid: true, health };
  } catch (error) {
    console.log("❌ API key issue:", error.message);
    return { valid: false, error: error.message };
  }
};
```

## 🔄

Migration Guide

### Adding API Keys to Existing Database

If you already have a Zcash Paywall database without API keys support:

```bash
# Run the migration script
psql -d your_database -f scripts/migrate-api-keys.sql
```

### Updating Existing Applications

1. **Update your SDK version**:

```bash
npm update zcash-paywall-sdk
```

2. **Add API key to your configuration**:

```javascript
// Before
const paywall = new ZcashPaywall({
  baseURL: "http://localhost:3000",
});

// After
const paywall = new ZcashPaywall({
  baseURL: "http://localhost:3000",
  apiKey: process.env.ZCASH_API_KEY,
});
```

3. **Create API keys for existing users**:

```javascript
const migrateUsersToApiKeys = async () => {
  const users = await paywall.users.list();

  for (const user of users.users) {
    const apiKey = await paywall.apiKeys.create({
      user_id: user.id,
      name: "Migration Key",
      permissions: ["read", "write"],
    });

    console.log(`Created API key for ${user.email}: ${apiKey.api_key}`);
    // Store these keys securely for your users
  }
};
```

## 🧪 Testing with API Keys

### Unit Testing

```javascript
import { ZcashPaywall } from "zcash-paywall-sdk";

describe("API Key Authentication", () => {
  test("should authenticate with valid API key", async () => {
    const paywall = new ZcashPaywall({
      baseURL: "http://localhost:3000",
      apiKey: "zp_test_key_12345",
    });

    expect(paywall.hasApiKey()).toBe(true);
  });

  test("should handle missing API key", async () => {
    const paywall = new ZcashPaywall();

    try {
      await paywall.admin.getStats();
      fail("Should have thrown authentication error");
    } catch (error) {
      expect(error.status).toBe(401);
    }
  });
});
```

### Integration Testing

```javascript
const testApiKeyFlow = async () => {
  // 1. Create user
  const user = await paywall.users.create({
    email: "test@example.com",
  });

  // 2. Create API key
  const apiKeyResponse = await paywall.apiKeys.create({
    user_id: user.id,
    name: "Test Key",
    permissions: ["read", "write"],
  });

  // 3. Test with new key
  const authenticatedPaywall = new ZcashPaywall({
    baseURL: "http://localhost:3000",
    apiKey: apiKeyResponse.api_key,
  });

  // 4. Verify access
  const invoice = await authenticatedPaywall.invoices.create({
    user_id: user.id,
    type: "one_time",
    amount_zec: 0.01,
  });

  expect(invoice.id).toBeDefined();
};
```

## 📚 Additional Resources

### Example Applications

- [Basic API Key Usage](examples/api-key-usage.js)
- [Permission Management](examples/permission-management.js)
- [Key Rotation Strategy](examples/key-rotation.js)

### Related Documentation

- [SDK Configuration Guide](SDK_CONFIGURATION_GUIDE.md)
- [Backend API Documentation](docs/BACKEND_DOCS.md)
- [User and Payment Schema](docs/USER_AND_PAYMENT_SCHEMA_DOCS.md)

### Support

- GitHub Issues: [Report bugs or request features](https://github.com/your-org/zcash-paywall/issues)
- Documentation: [Full API documentation](docs/)
- Examples: [Code examples and tutorials](examples/)

---

**Security Notice**: Always store API keys securely and never commit them to version control. Use environment variables or secure key management systems in production.
