# Unified Zcash Invoice System

A centralized, easy-to-use payment system that supports all Zcash payment methods through a single API endpoint.

## 🎯 Key Benefits

- **Single Entry Point**: One endpoint for all payment methods
- **Centralized Balance**: All payments tracked in unified user balance
- **Auto Method Selection**: Intelligent payment method selection
- **Minimal Code**: Simple SDK with just a few lines of code
- **Consistent API**: Same interface across all payment types

## 🚀 Quick Start

### 1. Install and Initialize

```javascript
import { createZcashPaywall, PAYMENT_METHODS } from './src/UnifiedZcashPaywall.js';

const paywall = createZcashPaywall({
  baseURL: 'http://localhost:3001',
  network: 'testnet'
});
```

### 2. Create Invoice (Auto Method)

```javascript
// Simplest possible invoice creation
const invoice = await paywall.createInvoice({
  email: 'user@example.com',  // Auto-creates user if needed
  amount_zec: 0.01,
  description: 'My product'
});

console.log('Payment address:', invoice.invoice.payment_address);
console.log('QR code:', invoice.invoice.qr_code);
```

### 3. Monitor Payment

```javascript
// Wait for payment with progress updates
const result = await paywall.waitForPayment(invoice.invoice.id, {
  onProgress: (status) => console.log('Status:', status.paid ? 'PAID' : 'PENDING')
});

console.log('Payment completed!', result);
```

## 💳 Payment Methods

### Auto Selection (Recommended)
```javascript
const invoice = await paywall.createInvoice({
  user_id: 'user123',
  amount_zec: 0.01,
  payment_method: 'auto'  // Default - chooses best method
});
```

### Specific Methods
```javascript
// Transparent (t-address)
const transparent = await paywall.createTransparentInvoice({
  user_id: 'user123',
  amount_zec: 0.01
});

// Unified Address (recommended for privacy)
const unified = await paywall.createUnifiedInvoice({
  user_id: 'user123', 
  amount_zec: 0.01
});

// Shielded (z-address)
const shielded = await paywall.createShieldedInvoice({
  user_id: 'user123',
  amount_zec: 0.01
});

// WebZjs (browser-based)
const webzjs = await paywall.createWebZjsInvoice({
  user_id: 'user123',
  amount_zec: 0.01
});

// zcash-devtool (CLI-based)
const devtool = await paywall.createDevtoolInvoice({
  user_id: 'user123',
  amount_zec: 0.01
});
```

## 🏗️ Architecture

### Unified Invoice Table
```sql
CREATE TABLE unified_invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    payment_method VARCHAR(20) NOT NULL,  -- auto, transparent, shielded, unified, webzjs, devtool
    payment_address TEXT NOT NULL,
    address_type VARCHAR(30) NOT NULL,
    amount_zec DECIMAL(16, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    -- ... other fields
);
```

### Balance Tracking
All payments from any method are automatically tracked in the centralized `user_balances` view:

```sql
CREATE VIEW user_balances AS
SELECT 
    u.id,
    u.email,
    -- Combines legacy invoices + unified invoices
    SUM(legacy_payments + unified_payments) as total_received_zec,
    SUM(withdrawals) as total_withdrawn_zec,
    (total_received - total_withdrawn) as available_balance_zec
FROM users u
LEFT JOIN invoices i ON u.id = i.user_id
LEFT JOIN unified_invoices ui ON u.id = ui.user_id
-- ...
```

## 📊 Payment Method Comparison

| Method | Setup | Privacy | Speed | Use Case |
|--------|-------|---------|-------|----------|
| **Auto** | None | High | Fast | Recommended default |
| **Transparent** | None | Low | Fast | Simple integration |
| **Unified** | None | High | Fast | Modern standard |
| **Shielded** | RPC | High | Medium | Privacy focused |
| **WebZjs** | Browser | High | Fast | Web applications |
| **Devtool** | CLI | Medium | Medium | Development/testing |

## 🔄 Migration from Fragmented System

### Before (Fragmented)
```javascript
// Different endpoints for different methods
const transparentInvoice = await fetch('/api/invoice/create', { ... });
const shieldedInvoice = await fetch('/api/shielded/invoice/create', { ... });
const webzjsInvoice = await fetch('/api/webzjs/invoice/create', { ... });
const unifiedInvoice = await fetch('/api/unified/invoice/create', { ... });

// Different balance tracking
// Different payment checking
// Different error handling
```

### After (Unified)
```javascript
// Single endpoint for everything
const invoice = await paywall.createInvoice({
  user_id: 'user123',
  amount_zec: 0.01,
  payment_method: 'auto'  // or any specific method
});

// Unified balance tracking
const balance = await paywall.getUserBalance('user123');

// Consistent payment checking
const status = await paywall.checkPayment(invoice.invoice.id);
```

## 🛠️ Advanced Usage

### User Preferences
```javascript
// Set user's preferred payment method
await paywall.createInvoice({
  user_id: 'user123',
  amount_zec: 0.01,
  payment_method: 'unified',  // User's preference
  webzjs_wallet_id: 'wallet456'  // Link to existing wallet
});
```

### Subscription Payments
```javascript
const subscription = await paywall.createInvoice({
  user_id: 'user123',
  amount_zec: 0.1,
  type: 'subscription',  // Auto-expires in 30 days
  description: 'Monthly subscription'
});
```

### Payment Monitoring
```javascript
// Simple check
const status = await paywall.checkPayment(invoice_id);

// Polling with timeout
const result = await paywall.waitForPayment(invoice_id, {
  timeout: 300000,  // 5 minutes
  interval: 5000,   // Check every 5 seconds
  onProgress: (status) => {
    console.log('Received:', status.invoice.received_amount, 'ZEC');
  }
});
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
node backend/tests/test-unified-invoice-system.js
```

Or run the examples:

```bash
node backend/examples/unified-invoice-example.js
```

## 📈 Benefits Over Fragmented Approach

### Code Reduction
- **Before**: ~50 lines per payment method
- **After**: ~5 lines for any payment method

### Maintenance
- **Before**: Update 5+ different endpoints
- **After**: Update single unified endpoint

### Balance Tracking
- **Before**: Complex queries across multiple tables
- **After**: Single view with all payment methods

### Error Handling
- **Before**: Different error formats per method
- **After**: Consistent error handling

### User Experience
- **Before**: Users need to choose technical details
- **After**: Automatic best method selection

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/zcash_paywall

# Network
ZCASH_NETWORK=testnet

# RPC (for transparent/shielded)
ZCASH_RPC_URL=http://localhost:8232
ZCASH_RPC_USER=user
ZCASH_RPC_PASS=pass
```

### SDK Configuration
```javascript
const paywall = createZcashPaywall({
  baseURL: 'http://localhost:3001',
  apiKey: 'your-api-key',           // Optional
  network: 'testnet',               // mainnet | testnet
  paymentMethod: 'auto',            // Default method
  timeout: 30000                    // Request timeout
});
```

## 🚀 Production Deployment

1. **Run Migration**:
   ```bash
   psql -d zcash_paywall -f backend/migrations/006_unified_invoice_system.sql
   ```

2. **Update Routes**:
   The unified system is automatically included in the main routes.

3. **Test Integration**:
   ```bash
   npm test
   ```

4. **Monitor Performance**:
   Check the `payment_method_stats` view for usage analytics.

## 📚 API Reference

### Create Invoice
```
POST /api/invoice/unified/create
```

### Check Payment
```
POST /api/invoice/unified/check
```

### Get Invoice
```
GET /api/invoice/unified/:id
```

See the full SDK documentation in `UnifiedZcashPaywall.js` for all available methods.

## 🎉 Summary

The Unified Zcash Invoice System provides:

✅ **Single entry point** for all payment methods  
✅ **Centralized balance** tracking  
✅ **Minimal code** required (5 lines vs 50+)  
✅ **Automatic method selection**  
✅ **Consistent API** across all methods  
✅ **Easy migration** from fragmented system  
✅ **Production ready** with comprehensive testing  

Perfect for developers who want Zcash payments without the complexity!