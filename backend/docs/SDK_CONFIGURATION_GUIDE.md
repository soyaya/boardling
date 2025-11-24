# Zcash Paywall SDK - Configuration Guide

This guide explains all the ways to configure the Zcash Paywall SDK for different environments and use cases.

## 🚀 Quick Start

### Default Configuration (Recommended)

```javascript
import { ZcashPaywall } from "zcash-paywall-sdk";

// Uses smart defaults - works out of the box
const paywall = new ZcashPaywall();
```

## 📋 Configuration Methods

### 1. Basic Configuration

```javascript
const paywall = new ZcashPaywall({
  baseURL: "https://api.yourcompany.com",
  apiKey: "your-api-key",
  timeout: 30000,
});
```

### 2. Environment Presets

```javascript
// Development (localhost:3000, 30s timeout)
const paywall = ZcashPaywall.withPreset("development");

// Production (optimized settings)
const paywall = ZcashPaywall.withPreset("production", {
  apiKey: process.env.API_KEY,
});

// Testing (localhost:3001, 5s timeout)
const paywall = ZcashPaywall.withPreset("testing");
```

### 3. Server-Side Configuration

```javascript
// Uses server's configuration (server-side only)
const paywall = await ZcashPaywall.withServerDefaults({
  apiKey: "override-key",
});
```

### 4. Dynamic Configuration from Server

```javascript
// Fetches configuration from server's /api/config endpoint
const paywall = await ZcashPaywall.fromServer("https://api.yourcompany.com");
```

## 🔧 Environment Variables

### Server-Side (.env file)

```bash
# SDK Configuration
SDK_DEFAULT_BASE_URL=http://localhost:3000
PUBLIC_API_URL=https://api.yourdomain.com
SDK_DEFAULT_TIMEOUT=30000
API_VERSION=v1

# Legacy support
ZCASH_PAYWALL_URL=http://localhost:3000
```

### Client-Side (Browser)

The SDK automatically detects browser environment and uses the current origin.

## 🌍 Environment-Specific Examples

### Development

```javascript
// Option 1: Use preset
const paywall = ZcashPaywall.withPreset("development");

// Option 2: Manual configuration
const paywall = new ZcashPaywall({
  baseURL: "http://localhost:3000",
  timeout: 30000,
});

// Option 3: Environment variable
// Set: SDK_DEFAULT_BASE_URL=http://localhost:3000
const paywall = new ZcashPaywall();
```

### Production

```javascript
// Option 1: Use preset with overrides
const paywall = ZcashPaywall.withPreset("production", {
  baseURL: "https://api.yourcompany.com",
  apiKey: process.env.ZCASH_API_KEY,
});

// Option 2: Full configuration
const paywall = new ZcashPaywall({
  baseURL: "https://api.yourcompany.com",
  apiKey: process.env.ZCASH_API_KEY,
  timeout: 15000,
});

// Option 3: Server configuration
const paywall = await ZcashPaywall.withServerDefaults({
  apiKey: process.env.ZCASH_API_KEY,
});
```

### Testing

```javascript
// Option 1: Use testing preset
const paywall = ZcashPaywall.withPreset("testing");

// Option 2: Mock for unit tests
import { MockZcashPaywall } from "zcash-paywall-sdk/testing";
const paywall = new MockZcashPaywall();
```

## 🏗️ Server Configuration

### 1. Environment Variables

Add to your server's `.env` file:

```bash
SDK_DEFAULT_BASE_URL=https://api.yourcompany.com
PUBLIC_API_URL=https://api.yourcompany.com
SDK_DEFAULT_TIMEOUT=30000
```

### 2. Configuration Endpoint

Your server automatically exposes `/api/config` with SDK configuration:

```json
{
  "sdk": {
    "baseURL": "https://api.yourcompany.com",
    "timeout": 30000,
    "apiVersion": "v1",
    "environment": "production"
  }
}
```

### 3. Client Usage

```javascript
// Clients can fetch this configuration
const paywall = await ZcashPaywall.fromServer("https://api.yourcompany.com");
```

## 🔄 Configuration Priority

The SDK resolves configuration in this order (highest to lowest priority):

1. **Constructor options** - Direct parameters
2. **Environment variables** - SDK_DEFAULT_BASE_URL, etc.
3. **Server configuration** - From /api/config endpoint
4. **Preset defaults** - Environment-specific presets
5. **Smart defaults** - Automatic detection

## 📱 Browser vs Node.js

### Browser Environment

```javascript
// Automatically uses current origin
const paywall = new ZcashPaywall(); // Uses window.location.origin

// Override for different API server
const paywall = new ZcashPaywall({
  baseURL: "https://api.yourcompany.com",
});
```

### Node.js Environment

```javascript
// Uses environment variables or defaults
const paywall = new ZcashPaywall(); // Uses SDK_DEFAULT_BASE_URL

// Server-side configuration
const paywall = await ZcashPaywall.withServerDefaults();
```

## 🛠️ Advanced Configuration

### Custom Configuration Function

```javascript
import { resolveConfig } from "zcash-paywall-sdk";

const config = resolveConfig({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://api.yourcompany.com"
      : "http://localhost:3000",
  timeout: process.env.NODE_ENV === "production" ? 15000 : 30000,
  apiKey: process.env.ZCASH_API_KEY,
});

const paywall = new ZcashPaywall(config);
```

### Configuration Validation

```javascript
const paywall = new ZcashPaywall({
  baseURL: "https://api.yourcompany.com",
});

// Validate configuration
try {
  await paywall.initialize();
  console.log("✅ Configuration valid");
} catch (error) {
  console.error("❌ Configuration error:", error.message);
}
```

## 🔍 Debugging Configuration

### Check Current Configuration

```javascript
const paywall = new ZcashPaywall();
console.log("Base URL:", paywall.baseURL);
console.log("Timeout:", paywall.timeout);
console.log("API Key:", paywall.apiKey ? "***" : "Not set");
```

### Test Configuration

```javascript
// Test health endpoint
const health = await paywall.getHealth();
console.log("Server status:", health.status);
```

### Environment Detection

```javascript
import { getDefaultConfig } from "zcash-paywall-sdk";

const defaults = getDefaultConfig();
console.log("Detected defaults:", defaults);
```

## 📚 Configuration Examples by Use Case

### 1. Local Development

```javascript
// .env
SDK_DEFAULT_BASE_URL=http://localhost:3000

// Code
const paywall = new ZcashPaywall(); // Auto-configured
```

### 2. Docker Development

```javascript
// docker-compose.yml environment
SDK_DEFAULT_BASE_URL=http://api:3000

// Code
const paywall = new ZcashPaywall(); // Uses container network
```

### 3. Microservices

```javascript
// Service A calling Service B
const paywall = new ZcashPaywall({
  baseURL: "http://zcash-paywall-service:3000",
});
```

### 4. Multi-tenant SaaS

```javascript
// Dynamic configuration per tenant
const paywall = new ZcashPaywall({
  baseURL: `https://${tenant}.api.yourcompany.com`,
  apiKey: await getTenantApiKey(tenant),
});
```

### 5. Edge Functions / Serverless

```javascript
// Vercel, Netlify, AWS Lambda
const paywall = new ZcashPaywall({
  baseURL: process.env.ZCASH_API_URL,
  timeout: 5000, // Shorter timeout for serverless
});
```

## ⚡ Performance Tips

1. **Reuse instances**: Create one SDK instance and reuse it
2. **Set appropriate timeouts**: Lower for serverless, higher for batch operations
3. **Use presets**: They're optimized for each environment
4. **Cache configuration**: Don't fetch server config on every request

## 🔒 Security Best Practices

1. **Never hardcode API keys** in client-side code
2. **Use environment variables** for sensitive configuration
3. **Validate server certificates** in production
4. **Use HTTPS** for all production APIs
5. **Rotate API keys** regularly

---

## 🎯 Summary

The Zcash Paywall SDK provides flexible configuration options for any environment:

- **Zero-config**: Works out of the box with smart defaults
- **Environment-aware**: Automatically adapts to browser/Node.js
- **Preset-based**: Quick setup for common environments
- **Server-driven**: Dynamic configuration from your API
- **Override-friendly**: Easy to customize any setting

Choose the method that best fits your architecture and deployment strategy!
