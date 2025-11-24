# Broadlings' Paywall SDK - NPM Package Usage

A production-ready Node.js SDK for implementing Zcash-based paywall systems with subscription and one-time payment support.

## Installation

```bash
npm install zcash-paywall-sdk
```

## Quick Start

### 1. Basic Setup

```javascript
import { ZcashPaywall } from 'zcash-paywall-sdk';

const paywall = new ZcashPaywall();

// Initialize the SDK
await paywall.initialize();
```

### 2. Create User

```javascript
const user = await paywall.users.create({
  email: 'user@example.com',
  name: 'John Doe'
});

console.log('User created:', user.id);
```

### 3. Create Payment Invoice (with QR Code)

```javascript
const invoice = await paywall.invoices.create({
  user_id: user.id,
  type: 'subscription', // or 'one_time'
  amount_zec: 0.01,
  item_id: 'premium-content-123' // optional
});

console.log('Payment address:', invoice.z_address);
console.log('Amount required:', invoice.amount_zec, 'ZEC');
console.log('QR code (base64):', invoice.qr_code);
console.log('Payment URI:', invoice.payment_uri);
```

### 4. Check Payment Status

```javascript
const paymentStatus = await paywall.invoices.checkPayment(invoice.id);

if (paymentStatus.paid) {
  console.log('Payment received!');
  console.log('Transaction ID:', paymentStatus.invoice.paid_txid);
} else {
  console.log('Payment pending...');
}
```

### 5. Process Withdrawal

```javascript
// Create withdrawal request
const withdrawal = await paywall.withdrawals.create({
  user_id: user.id,
  to_address: 't1UserZcashAddress1234567890123456789012345',
  amount_zec: 0.5
});

// Process withdrawal (admin function)
const result = await paywall.withdrawals.process(withdrawal.id);
console.log('Withdrawal processed:', result.txid);
```

## API Reference

### ZcashPaywall Class

### Users API

#### Create User
```javascript
const user = await paywall.users.create({
  email: string,          // Required: User email
  name?: string           // Optional: User name
});
```

#### Get User
```javascript
const user = await paywall.users.getById(userId);
const user = await paywall.users.getByEmail(email);
```

#### Update User
```javascript
const user = await paywall.users.update(userId, {
  email?: string,
  name?: string
});
```

#### Get User Balance
```javascript
const balance = await paywall.users.getBalance(userId);
// Returns: { total_received_zec, total_withdrawn_zec, available_balance_zec, ... }
```

### Invoices API

#### Create Invoice
```javascript
const invoice = await paywall.invoices.create({
  user_id: string,        // Required: User UUID
  type: 'subscription' | 'one_time', // Required: Payment type
  amount_zec: number,     // Required: Amount in ZEC
  item_id?: string        // Optional: Item identifier
});
// Returns: { id, z_address, amount_zec, qr_code, payment_uri, ... }
```

#### Get QR Code
```javascript
// Get QR code as PNG buffer
const qrBuffer = await paywall.invoices.getQRCode(invoiceId, {
  format: 'buffer',
  preset: 'web'
});

// Get QR code as SVG string
const qrSvg = await paywall.invoices.getQRCode(invoiceId, {
  format: 'svg',
  size: 512
});

// Get QR code as base64 data URL
const qrDataUrl = await paywall.invoices.getQRCode(invoiceId, {
  format: 'dataurl',
  preset: 'mobile'
});
```

#### Check Payment
```javascript
const status = await paywall.invoices.checkPayment(invoiceId);
// Returns: { paid: boolean, invoice: {...} }
```

#### Get Invoice
```javascript
const invoice = await paywall.invoices.getById(invoiceId);
```

#### List User Invoices
```javascript
const invoices = await paywall.invoices.listByUser(userId, {
  status?: 'pending' | 'paid' | 'expired' | 'cancelled',
  type?: 'subscription' | 'one_time',
  limit?: number,         // Default: 50
  offset?: number         // Default: 0
});
```

### Withdrawals API

#### Create Withdrawal
```javascript
const withdrawal = await paywall.withdrawals.create({
  user_id: string,        // Required: User UUID
  to_address: string,     // Required: Zcash address
  amount_zec: number      // Required: Amount in ZEC
});
```

#### Process Withdrawal (Admin)
```javascript
const result = await paywall.withdrawals.process(withdrawalId);
// Returns: { success: boolean, txid: string, user_received: number, platform_fee: number }
```

#### Get Fee Estimate
```javascript
const estimate = await paywall.withdrawals.getFeeEstimate(amount_zec);
// Returns: { amount, fee, net, feeBreakdown }
```

#### Get Withdrawal
```javascript
const withdrawal = await paywall.withdrawals.getById(withdrawalId);
```

#### List User Withdrawals
```javascript
const withdrawals = await paywall.withdrawals.listByUser(userId, {
  status?: 'pending' | 'processing' | 'sent' | 'failed',
  limit?: number,
  offset?: number
});
```

### Admin API

#### Get Platform Statistics
```javascript
const stats = await paywall.admin.getStats();
// Returns comprehensive platform statistics
```

#### Get Pending Withdrawals
```javascript
const pending = await paywall.admin.getPendingWithdrawals();
```

#### Get User Balances
```javascript
const balances = await paywall.admin.getUserBalances({
  min_balance?: number,
  limit?: number,
  offset?: number
});
```

#### Get Revenue Data
```javascript
const revenue = await paywall.admin.getRevenue();
```

#### Get Active Subscriptions
```javascript
const subscriptions = await paywall.admin.getActiveSubscriptions();
```

#### Get Node Status
```javascript
const nodeStatus = await paywall.admin.getNodeStatus();
```

## Express.js Integration

### Basic Express App

```javascript
import express from 'express';
import { ZcashPaywall } from 'zcash-paywall-sdk';

const app = express();
app.use(express.json());

const paywall = new ZcashPaywall({
  // ... configuration
});

await paywall.initialize();

// Create payment endpoint
app.post('/api/create-payment', async (req, res) => {
  try {
    const { user_email, amount_zec, type } = req.body;
    
    // Get or create user
    let user = await paywall.users.getByEmail(user_email);
    if (!user) {
      user = await paywall.users.create({ email: user_email });
    }
    
    // Create invoice
    const invoice = await paywall.invoices.create({
      user_id: user.id,
      type,
      amount_zec
    });
    
    res.json({
      success: true,
      payment_address: invoice.z_address,
      amount_zec: invoice.amount_zec,
      invoice_id: invoice.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check payment endpoint
app.post('/api/check-payment', async (req, res) => {
  try {
    const { invoice_id } = req.body;
    const status = await paywall.invoices.checkPayment(invoice_id);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Middleware for Access Control

```javascript
// Middleware to check if user has active subscription
async function requireSubscription(req, res, next) {
  try {
    const { user_id } = req.user; // Assuming you have user auth
    
    const invoices = await paywall.invoices.listByUser(user_id, {
      type: 'subscription',
      status: 'paid'
    });
    
    const activeSubscription = invoices.invoices.find(inv => 
      inv.expires_at && new Date(inv.expires_at) > new Date()
    );
    
    if (!activeSubscription) {
      return res.status(403).json({ 
        error: 'Active subscription required',
        redirect_to_payment: true
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Protected route
app.get('/api/premium-content', requireSubscription, (req, res) => {
  res.json({ content: 'This is premium content!' });
});
```

## React.js Integration

### Payment Component with QR Code

```jsx
import React, { useState, useEffect } from 'react';

function PaymentComponent({ userEmail, amount, type, onPaymentComplete }) {
  const [invoice, setInvoice] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(true);

  const createPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/invoice/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userEmail,
          amount_zec: amount,
          type: type
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setInvoice(data.invoice);
        startPaymentPolling(data.invoice.id);
      }
    } catch (error) {
      console.error('Payment creation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const startPaymentPolling = (invoiceId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/invoice/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoice_id: invoiceId })
        });
        
        const status = await response.json();
        if (status.paid) {
          setPaymentStatus('paid');
          clearInterval(interval);
          onPaymentComplete?.(status.invoice);
        }
      } catch (error) {
        console.error('Payment check failed:', error);
      }
    }, 5000); // Check every 5 seconds

    // Stop polling after 30 minutes
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (paymentStatus === 'paid') {
    return (
      <div className="payment-success">
        <h3>✅ Payment Received!</h3>
        <p>Thank you for your payment.</p>
      </div>
    );
  }

  return (
    <div className="payment-component">
      <h3>Complete Payment</h3>
      <p>Amount: {amount} ZEC</p>
      <p>Type: {type}</p>
      
      {!invoice ? (
        <button onClick={createPayment} disabled={loading}>
          {loading ? 'Creating...' : 'Create Payment'}
        </button>
      ) : (
        <div className="payment-details">
          <div className="payment-tabs">
            <button 
              className={showQR ? 'active' : ''} 
              onClick={() => setShowQR(true)}
            >
              📱 QR Code
            </button>
            <button 
              className={!showQR ? 'active' : ''} 
              onClick={() => setShowQR(false)}
            >
              📋 Address
            </button>
          </div>

          {showQR ? (
            <div className="qr-section">
              <h4>Scan with Zcash Wallet</h4>
              <img 
                src={invoice.qr_code} 
                alt="Payment QR Code"
                className="qr-code"
                style={{ maxWidth: '256px', height: 'auto' }}
              />
              <p>Amount: {invoice.amount_zec} ZEC</p>
              <button onClick={() => window.open(invoice.payment_uri)}>
                Open in Wallet App
              </button>
            </div>
          ) : (
            <div className="address-section">
              <h4>Send ZEC to this address:</h4>
              <div className="address-container">
                <code className="payment-address">{invoice.z_address}</code>
                <button onClick={() => copyToClipboard(invoice.z_address)}>
                  📋 Copy
                </button>
              </div>
              <p>Amount: {invoice.amount_zec} ZEC</p>
            </div>
          )}

          <div className="payment-status">
            <span>⏳ Waiting for payment...</span>
            <div className="status-indicator">
              <div className="pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentComponent;
```

### QR Code Styling (CSS)

```css
.payment-component {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: Arial, sans-serif;
}

.payment-tabs {
  display: flex;
  margin-bottom: 20px;
}

.payment-tabs button {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  background: #f5f5f5;
  cursor: pointer;
}

.payment-tabs button.active {
  background: #007bff;
  color: white;
}

.qr-section, .address-section {
  text-align: center;
}

.qr-code {
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 10px 0;
}

.address-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
}

.payment-address {
  flex: 1;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  word-break: break-all;
}

.status-indicator {
  display: inline-block;
  margin-left: 10px;
}

.pulse {
  width: 12px;
  height: 12px;
  background: #28a745;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.payment-success {
  text-align: center;
  padding: 20px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  color: #155724;
}
```

## Error Handling

### Common Error Types

```javascript
try {
  await paywall.invoices.create({...});
} catch (error) {
  switch (error.code) {
    case 'USER_NOT_FOUND':
      console.log('User does not exist');
      break;
    case 'INSUFFICIENT_BALANCE':
      console.log('User has insufficient balance');
      break;
    case 'INVALID_ADDRESS':
      console.log('Invalid Zcash address provided');
      break;
    case 'RPC_ERROR':
      console.log('Zcash node connection failed');
      break;
    case 'DATABASE_ERROR':
      console.log('Database operation failed');
      break;
    default:
      console.log('Unknown error:', error.message);
  }
}
```

### Retry Logic

```javascript
import { retryWithBackoff } from 'zcash-paywall-sdk/utils';

const createPaymentWithRetry = async (paymentData) => {
  return await retryWithBackoff(
    () => paywall.invoices.create(paymentData),
    3, // max retries
    1000 // base delay ms
  );
};
```

## Environment Configuration

### Development
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=dev_user
DB_PASS=dev_pass
DB_NAME=zcashpaywall_dev
ZCASH_RPC_URL=http://127.0.0.1:18232
ZCASH_RPC_USER=dev_rpc_user
ZCASH_RPC_PASS=dev_rpc_pass
LOG_LEVEL=debug
```

### Production
```env
NODE_ENV=production
DB_HOST=prod-db-host
DB_PORT=5432
DB_USER=prod_user
DB_PASS=secure_password
DB_NAME=zcashpaywall
ZCASH_RPC_URL=http://127.0.0.1:8232
ZCASH_RPC_USER=prod_rpc_user
ZCASH_RPC_PASS=very_secure_rpc_password
PLATFORM_TREASURY_ADDRESS=t1YourProductionTreasury123456789012345
LOG_LEVEL=info
```

## Testing

### Unit Tests
```javascript
import { ZcashPaywall } from 'zcash-paywall-sdk';
import { createMockDatabase, createMockZcashRPC } from 'zcash-paywall-sdk/testing';

describe('Payment Processing', () => {
  let paywall;

  beforeEach(async () => {
    paywall = new ZcashPaywall({
      database: createMockDatabase(),
      zcash: createMockZcashRPC(),
      testing: true
    });
    await paywall.initialize();
  });

  test('should create invoice successfully', async () => {
    const user = await paywall.users.create({
      email: 'test@example.com'
    });

    const invoice = await paywall.invoices.create({
      user_id: user.id,
      type: 'one_time',
      amount_zec: 0.01
    });

    expect(invoice.amount_zec).toBe(0.01);
    expect(invoice.z_address).toMatch(/^z[a-zA-Z0-9]{94}$/);
  });
});
```

## Performance Optimization

### Connection Pooling
```javascript
const paywall = new ZcashPaywall({
  database: {
    // ... other config
    max: 50,                    // Max connections
    idleTimeoutMillis: 30000,   // Idle timeout
    connectionTimeoutMillis: 2000 // Connection timeout
  }
});
```

### Caching
```javascript
// Cache user balances for 5 minutes
const balance = await paywall.users.getBalance(userId, { 
  cache: true, 
  cacheTTL: 300 
});
```

### Batch Operations
```javascript
// Process multiple withdrawals at once
const results = await paywall.withdrawals.processBatch([
  withdrawalId1,
  withdrawalId2,
  withdrawalId3
]);
```

## Security Best Practices

1. **Environment Variables**: Never hardcode credentials
2. **Input Validation**: Always validate user inputs
3. **Rate Limiting**: Implement API rate limiting
4. **HTTPS**: Use HTTPS in production
5. **Database Security**: Use connection encryption
6. **Logging**: Don't log sensitive information
7. **Access Control**: Implement proper authentication

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```javascript
   // Check database connectivity
   const health = await paywall.getHealth();
   console.log('Database status:', health.database);
   ```

2. **Zcash RPC Connection Failed**
   ```javascript
   // Test RPC connection
   const nodeStatus = await paywall.admin.getNodeStatus();
   console.log('Node blocks:', nodeStatus.blocks);
   ```

3. **Payment Not Detected**
   ```javascript
   // Manual payment check with detailed logging
   const status = await paywall.invoices.checkPayment(invoiceId, { 
     verbose: true 
   });
   ```

## Support

- **Documentation**: [Full API Documentation](./API_REFERENCE.md)
- **Examples**: [Example Applications](./examples/)
- **Issues**: [GitHub Issues](https://github.com/your-org/zcash-paywall-sdk/issues)
- **Discord**: [Community Support](https://discord.gg/your-server)

## License

MIT License - see [LICENSE](./LICENSE) file for details.