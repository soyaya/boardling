# Payment Processing Quick Start Guide

## Overview

This guide provides a quick reference for using the payment processing system.

## Quick Setup

### 1. Prerequisites
- Backend server running on port 3001
- User registered and authenticated
- JWT token obtained from login

### 2. Basic Flow

```javascript
// Step 1: Create subscription invoice
const createInvoice = async (token) => {
  const response = await fetch('http://localhost:3001/api/payments/invoice', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      plan_type: 'premium',      // 'premium' or 'enterprise'
      duration_months: 1,        // 1-12 months
      payment_method: 'auto',    // 'auto', 'transparent', 'shielded', 'unified'
      network: 'testnet'
    })
  });
  
  return await response.json();
};

// Step 2: User sends payment to the address
// (External - user uses their Zcash wallet)

// Step 3: Check payment and process
const checkPayment = async (token, invoiceId, txid) => {
  const response = await fetch(`http://localhost:3001/api/payments/check/${invoiceId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      payment_detected: true,
      amount_zec: 0.01,
      txid: txid
    })
  });
  
  return await response.json();
};

// Step 4: Verify subscription is active
const checkSubscription = async (token) => {
  const response = await fetch('http://localhost:3001/api/subscriptions/status', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

## API Endpoints

### Create Subscription Invoice
```
POST /api/payments/invoice
Authorization: Bearer <token>

Body:
{
  "plan_type": "premium",
  "duration_months": 1,
  "payment_method": "auto",
  "network": "testnet"
}

Response:
{
  "success": true,
  "invoice": {
    "invoice_id": "123",
    "amount_zec": 0.01,
    "payment_address": "u1abc...",
    "status": "pending"
  }
}
```

### Check Payment Status
```
POST /api/payments/check/:id
Authorization: Bearer <token>

Body:
{
  "payment_detected": true,
  "amount_zec": 0.01,
  "txid": "abc123..."
}

Response:
{
  "success": true,
  "paid": true,
  "result": {
    "subscription": {
      "status": "premium",
      "expires_at": "2025-02-01T00:00:00Z"
    }
  }
}
```

### Get Balance
```
GET /api/payments/balance
Authorization: Bearer <token>

Response:
{
  "success": true,
  "balance": {
    "user_id": "user-uuid",
    "balance_zec": 0.035
  }
}
```

### Get Payment History
```
GET /api/payments/history?limit=10&offset=0
Authorization: Bearer <token>

Response:
{
  "success": true,
  "history": [
    {
      "invoice_id": "123",
      "type": "subscription",
      "amount_zec": 0.01,
      "status": "paid",
      "paid_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

## Pricing

### Premium Plan
- **0.01 ZEC per month**
- All premium analytics features
- 1-12 month duration

### Enterprise Plan
- **0.05 ZEC per month**
- All features + priority support
- 1-12 month duration

## Testing

### Run Tests
```bash
# Start backend server
cd backend
npm start

# In another terminal
node tests/test-payment-processing.js
```

### Manual Testing with cURL

```bash
# 1. Register user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'

# 2. Login
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }' | jq -r '.token')

# 3. Create invoice
INVOICE=$(curl -X POST http://localhost:3001/api/payments/invoice \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_type": "premium",
    "duration_months": 1
  }')

echo $INVOICE | jq

# 4. Get invoice ID
INVOICE_ID=$(echo $INVOICE | jq -r '.invoice.invoice_id')

# 5. Check payment (simulate)
curl -X POST http://localhost:3001/api/payments/check/$INVOICE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_detected": true,
    "amount_zec": 0.01,
    "txid": "test_txid_123"
  }' | jq

# 6. Verify subscription
curl -X GET http://localhost:3001/api/subscriptions/status \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Common Issues

### Issue: "Invoice not found"
**Solution**: Verify the invoice ID is correct and belongs to the authenticated user.

### Issue: "Invalid plan type"
**Solution**: Use 'premium' or 'enterprise' as plan_type.

### Issue: "Duration must be between 1 and 12 months"
**Solution**: Ensure duration_months is an integer between 1 and 12.

### Issue: "Invoice already paid"
**Solution**: Cannot process payment twice. Check invoice status first.

## Data Monetization

### Create Data Access Invoice
```javascript
const createDataInvoice = async (token, dataOwnerId, dataPackageId) => {
  const response = await fetch('http://localhost:3001/api/payments/data-access', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data_owner_id: dataOwnerId,
      data_package_id: dataPackageId,
      amount_zec: 0.005,
      payment_method: 'auto'
    })
  });
  
  return await response.json();
};
```

### Revenue Split
- **70%** goes to data owner's balance
- **30%** retained by platform

## Next Steps

1. **Automatic Payment Detection**: Integrate with blockchain indexer for automatic payment detection
2. **Recurring Subscriptions**: Implement auto-renewal before expiration
3. **Payment Notifications**: Add email notifications for payments
4. **Withdrawal System**: Implement withdrawal processing for user balances

## Support

For detailed documentation, see:
- [Payment Processing Documentation](./PAYMENT_PROCESSING.md)
- [Unified Invoice System](./UNIFIED_INVOICE_SYSTEM.md)
- [Subscription Management](./SUBSCRIPTION_MANAGEMENT.md)

## Related Files

- Service: `backend/src/services/paymentService.js`
- Routes: `backend/src/routes/payment.js`
- Tests: `backend/tests/test-payment-processing.js`
