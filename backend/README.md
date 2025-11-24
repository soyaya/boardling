# Zcash Paywall SDK

A production-ready Node.js SDK for implementing Zcash-based paywall systems with subscription and one-time payment support.

## Features

- 🔐 **Secure Payments**: Built on Zcash's privacy-focused blockchain
- 💳 **Flexible Payment Types**: Support for subscriptions and one-time payments
- 📱 **QR Code Generation**: Automatic QR code generation for mobile payments
- 💰 **Withdrawal Management**: Built-in withdrawal processing with fee calculation
- 📊 **Admin Dashboard**: Comprehensive analytics and management tools
- 🔄 **Retry Logic**: Built-in retry mechanisms with exponential backoff
- 🧪 **Testing Support**: Mock utilities for testing your integration

## Installation

```bash
npm install zcash-paywall-sdk
```

## Quick Start

```javascript
import { ZcashPaywall } from "zcash-paywall-sdk";

const paywall = new ZcashPaywall({
  baseURL: "https://your-api-server.com",
});

// Initialize the SDK
await paywall.initialize();

// Create a user
const user = await paywall.users.create({
  email: "user@example.com",
  name: "John Doe",
});

// Create a payment invoice
const invoice = await paywall.invoices.create({
  user_id: user.id,
  type: "subscription",
  amount_zec: 0.01,
});

console.log("Payment address:", invoice.z_address);
console.log("QR code:", invoice.qr_code);
```

## API Reference

### Configuration

#### Basic Configuration
```javascript
const paywall = new ZcashPaywall({
  baseURL: 'https://your-api-server.com', // Your API server URL
  apiKey: 'your-api-key',                 // Optional API key
  timeout: 30000                          // Request timeout in ms
});
```

#### Smart Defaults (Recommended)
```javascript
// Uses environment variables or smart defaults
const paywall = new ZcashPaywall();
```

#### Environment Presets
```javascript
// Development preset
const paywall = ZcashPaywall.withPreset('development');

// Production preset  
const paywall = ZcashPaywall.withPreset('production', {
  apiKey: 'your-production-key'
});
```

#### Server-Side Configuration
```javascript
// Uses server configuration (server-side only)
const paywall = await ZcashPaywall.withServerDefaults();

// Fetch configuration from server
const paywall = await ZcashPaywall.fromServer('https://api.example.com');
```

#### Environment Variables
Set these in your `.env` file for automatic configuration:
```bash
SDK_DEFAULT_BASE_URL=http://localhost:3000
PUBLIC_API_URL=https://api.yourdomain.com
SDK_DEFAULT_TIMEOUT=30000
```

3. **Default (Development only):**
   ```javascript
   const paywall = new ZcashPaywall(); // Uses http://localhost:3000
   ```

### Users API

```javascript
// Create user
const user = await paywall.users.create({
  email: "user@example.com",
  name: "John Doe", // optional
});

// Get user by ID or email
const user = await paywall.users.getById(userId);
const user = await paywall.users.getByEmail("user@example.com");

// Get user balance
const balance = await paywall.users.getBalance(userId);
```

### Invoices API

```javascript
// Create invoice
const invoice = await paywall.invoices.create({
  user_id: userId,
  type: "subscription", // or 'one_time'
  amount_zec: 0.01,
  item_id: "premium-content", // optional
});

// Check payment status
const status = await paywall.invoices.checkPayment(invoice.id);

// Get QR code in different formats
const qrBuffer = await paywall.invoices.getQRCode(invoice.id, {
  format: "buffer",
  size: 256,
});
```

### Withdrawals API

```javascript
// Create withdrawal
const withdrawal = await paywall.withdrawals.create({
  user_id: userId,
  to_address: "t1UserZcashAddress...",
  amount_zec: 0.5,
});

// Get fee estimate
const estimate = await paywall.withdrawals.getFeeEstimate(0.5);
```

## Express.js Integration

```javascript
import express from "express";
import { ZcashPaywall } from "zcash-paywall-sdk";

const app = express();
const paywall = new ZcashPaywall();

app.post("/create-payment", async (req, res) => {
  try {
    const { email, amount } = req.body;

    let user = await paywall.users.getByEmail(email);
    if (!user) {
      user = await paywall.users.create({ email });
    }

    const invoice = await paywall.invoices.create({
      user_id: user.id,
      type: "one_time",
      amount_zec: amount,
    });

    res.json({
      payment_address: invoice.z_address,
      qr_code: invoice.qr_code,
      amount: invoice.amount_zec,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Error Handling

The SDK provides structured error handling with specific error codes:

```javascript
try {
  await paywall.invoices.create({...});
} catch (error) {
  switch (error.code) {
    case 'USER_NOT_FOUND':
      // Handle user not found
      break;
    case 'INSUFFICIENT_BALANCE':
      // Handle insufficient balance
      break;
    case 'INVALID_ADDRESS':
      // Handle invalid Zcash address
      break;
    case 'RPC_ERROR':
      // Handle Zcash node connection issues
      break;
    default:
      // Handle other errors
      console.error('Error:', error.message);
  }
}
```

## Testing

The SDK includes testing utilities:

```javascript
import {
  createMockDatabase,
  createMockZcashRPC,
  MockZcashPaywall,
} from "zcash-paywall-sdk/testing";

// Use mock paywall for testing
const paywall = new MockZcashPaywall();
const user = await paywall.users.create({ email: "test@example.com" });
```

## TypeScript Support

The SDK includes full TypeScript definitions:

```typescript
import { ZcashPaywall, User, Invoice } from "zcash-paywall-sdk";

const paywall = new ZcashPaywall();
const user: User = await paywall.users.create({
  email: "user@example.com",
});
```

## Documentation

- [Full API Documentation](./docs/NPM_PACKAGE_USAGE.md)
- [Backend Documentation](./docs/BACKEND_DOCS.md)
- [Schema Documentation](./docs/USER_AND_PAYMENT_SCHEMA_DOCS.md)

## Requirements

- Node.js >= 18.0.0
- A running Zcash Paywall API server

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/limitlxx/zcash-paywall-sdk/issues)
- Documentation: [Full documentation](./docs/)

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.
