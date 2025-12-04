# Payment Processing System

## Overview

The payment processing system integrates with the existing unified invoice system and subscription management to handle:

1. **Subscription Invoice Creation** - Create payment invoices for premium subscriptions
2. **Payment Detection** - Monitor and detect payments to invoice addresses
3. **Subscription Activation** - Automatically activate subscriptions upon payment
4. **Data Monetization** - Handle payments for data access with revenue splitting

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Payment Flow                              │
└─────────────────────────────────────────────────────────────┘

User Request → Payment Service → Unified Invoice System
                     ↓
              Generate Address
                     ↓
              Create Invoice
                     ↓
              Return Payment Info
                     ↓
         User Sends Payment (External)
                     ↓
         Payment Detection (Polling/Webhook)
                     ↓
         Process Payment Service
                     ↓
    ┌────────────────┴────────────────┐
    ↓                                  ↓
Subscription Payment          Data Access Payment
    ↓                                  ↓
Update Subscription           Split Revenue (70/30)
    ↓                                  ↓
Activate Premium              Update Balances
```

## Components

### 1. Payment Service (`backend/src/services/paymentService.js`)

Core service handling all payment operations:

- `createSubscriptionInvoice()` - Create subscription payment invoices
- `checkInvoicePayment()` - Check payment status
- `processSubscriptionPayment()` - Process payment and activate subscription
- `createDataAccessInvoice()` - Create data access payment invoices
- `processDataAccessPayment()` - Process data payment with revenue split
- `getUserBalance()` - Get user balance from data monetization
- `getPaymentHistory()` - Get user payment history

### 2. Payment Routes (`backend/src/routes/payment.js`)

API endpoints for payment operations:

```
POST   /api/payments/invoice              - Create subscription invoice
GET    /api/payments/invoice/:id          - Get invoice details
POST   /api/payments/check/:id            - Check payment status
GET    /api/payments/balance              - Get user balance
GET    /api/payments/history              - Get payment history
POST   /api/payments/data-access          - Create data access invoice
POST   /api/payments/process-data-access/:id - Process data access payment
POST   /api/payments/webhook              - Payment notification webhook
```

## Usage Examples

### 1. Create Subscription Invoice

```javascript
// Request
POST /api/payments/invoice
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "plan_type": "premium",
  "duration_months": 1,
  "payment_method": "auto",
  "network": "testnet",
  "description": "Premium subscription"
}

// Response
{
  "success": true,
  "message": "Subscription invoice created successfully",
  "invoice": {
    "invoice_id": "123",
    "user_id": "user-uuid",
    "plan_type": "premium",
    "duration_months": 1,
    "amount_zec": 0.01,
    "payment_address": "u1abc...",
    "payment_method": "auto",
    "address_type": "unified",
    "network": "testnet",
    "status": "pending",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

### 2. Check Payment Status

```javascript
// Request
POST /api/payments/check/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "payment_detected": true,
  "amount_zec": 0.01,
  "txid": "abc123..."
}

// Response
{
  "success": true,
  "paid": true,
  "message": "Payment processed successfully",
  "result": {
    "success": true,
    "invoice_id": "123",
    "user_id": "user-uuid",
    "subscription": {
      "status": "premium",
      "expires_at": "2025-02-01T00:00:00Z",
      "duration_months": 1
    },
    "payment": {
      "amount_zec": 0.01,
      "txid": "abc123...",
      "paid_at": "2025-01-01T00:00:00Z"
    }
  }
}
```

### 3. Get User Balance

```javascript
// Request
GET /api/payments/balance
Authorization: Bearer <jwt_token>

// Response
{
  "success": true,
  "balance": {
    "user_id": "user-uuid",
    "balance_zec": 0.035
  }
}
```

### 4. Get Payment History

```javascript
// Request
GET /api/payments/history?limit=10&offset=0&type=subscription
Authorization: Bearer <jwt_token>

// Response
{
  "success": true,
  "history": [
    {
      "invoice_id": "123",
      "type": "subscription",
      "amount_zec": 0.01,
      "payment_method": "auto",
      "payment_address": "u1abc...",
      "status": "paid",
      "paid_amount_zec": 0.01,
      "paid_txid": "abc123...",
      "paid_at": "2025-01-01T00:00:00Z",
      "expires_at": "2025-02-01T00:00:00Z",
      "item_id": "premium_1m",
      "description": "Premium subscription",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "count": 1
  }
}
```

### 5. Create Data Access Invoice

```javascript
// Request
POST /api/payments/data-access
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "data_owner_id": "owner-uuid",
  "data_package_id": "analytics_package_123",
  "amount_zec": 0.005,
  "payment_method": "auto",
  "network": "testnet",
  "description": "Analytics data access"
}

// Response
{
  "success": true,
  "message": "Data access invoice created successfully",
  "invoice": {
    "invoice_id": "456",
    "buyer_user_id": "buyer-uuid",
    "data_owner_id": "owner-uuid",
    "data_package_id": "analytics_package_123",
    "amount_zec": 0.005,
    "payment_address": "u1xyz...",
    "payment_method": "auto",
    "address_type": "unified",
    "network": "testnet",
    "status": "pending",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

## Subscription Plans

### Premium Plan
- **Price**: 0.01 ZEC per month
- **Features**: All premium analytics features
- **Duration**: 1-12 months

### Enterprise Plan
- **Price**: 0.05 ZEC per month
- **Features**: All features + priority support
- **Duration**: 1-12 months

## Data Monetization

### Revenue Split
- **Data Owner**: 70% of payment
- **Platform**: 30% of payment

### Process Flow
1. User requests data access
2. System creates invoice with data owner metadata
3. User pays invoice
4. System splits payment:
   - 70% added to data owner's balance
   - 30% retained by platform
5. User granted access to data

## Payment Detection

### Current Implementation
- Manual payment detection via API endpoint
- Requires payment details (amount, txid) in request body

### Future Enhancements
1. **Blockchain Monitoring**
   - Integrate with blockchain indexer
   - Automatic payment detection
   - Real-time updates

2. **Webhook System**
   - Payment notification webhooks
   - Automatic processing
   - Event-driven architecture

3. **Payment Polling**
   - Background job to check pending invoices
   - Configurable polling interval
   - Automatic subscription activation

## Database Schema

### Unified Invoices Table
```sql
CREATE TABLE unified_invoices (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('subscription', 'one_time')),
    amount_zec DECIMAL(16, 8) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    network VARCHAR(10) NOT NULL DEFAULT 'testnet',
    payment_address TEXT NOT NULL,
    address_type VARCHAR(30) NOT NULL,
    address_metadata JSONB DEFAULT '{}',
    item_id TEXT,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    paid_amount_zec DECIMAL(16, 8),
    paid_txid TEXT,
    paid_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Users Table (Subscription Fields)
```sql
ALTER TABLE users 
ADD COLUMN subscription_status subscription_status DEFAULT 'free',
ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN balance_zec DECIMAL(16,8) DEFAULT 0;
```

## Integration with Existing Systems

### 1. Unified Invoice System
- Uses existing `unified_invoices` table
- Leverages address generation logic
- Maintains compatibility with all payment methods

### 2. Subscription Service
- Integrates with `subscriptionService.js`
- Updates subscription status automatically
- Maintains subscription expiration dates

### 3. Legacy Invoice System
- Creates legacy invoice records for balance tracking
- Ensures backward compatibility
- Maintains unified balance view

## Error Handling

### Validation Errors (400)
- Invalid plan type
- Invalid duration (must be 1-12 months)
- Missing required fields
- Invalid amount

### Not Found Errors (404)
- Invoice not found
- User not found

### Conflict Errors (409)
- Invoice already paid
- Duplicate payment processing

### Internal Errors (500)
- Database errors
- Payment processing failures
- Address generation failures

## Testing

### Test File
`backend/tests/test-payment-processing.js`

### Test Coverage
1. User registration and login
2. Create subscription invoice
3. Check invoice payment status
4. Process payment and activate subscription
5. Verify subscription activation
6. Get user balance
7. Get payment history
8. Create data access invoice
9. Invalid plan type validation
10. Invalid duration validation

### Running Tests
```bash
# Start the backend server
npm start

# In another terminal, run tests
node backend/tests/test-payment-processing.js
```

## Security Considerations

1. **Authentication**
   - All endpoints require JWT authentication
   - User can only access their own invoices and payments

2. **Payment Verification**
   - Verify payment amount matches invoice amount
   - Verify transaction ID is valid
   - Prevent double-processing of payments

3. **Balance Protection**
   - Balance cannot go negative
   - Atomic transactions for balance updates
   - Proper locking to prevent race conditions

4. **Data Access Control**
   - Verify user has permission to purchase data
   - Verify data owner exists and has monetizable data
   - Grant access only after payment confirmation

## Future Enhancements

1. **Automatic Payment Detection**
   - Integrate with blockchain indexer
   - Monitor addresses for incoming payments
   - Automatic subscription activation

2. **Recurring Subscriptions**
   - Auto-renewal before expiration
   - Saved payment preferences
   - Subscription management dashboard

3. **Payment Notifications**
   - Email notifications on payment received
   - Subscription expiration reminders
   - Balance update notifications

4. **Advanced Analytics**
   - Revenue tracking and reporting
   - Subscription metrics
   - Payment method analytics

5. **Multi-Currency Support**
   - USD pricing with ZEC conversion
   - Dynamic pricing based on ZEC/USD rate
   - Price history tracking

## API Reference

See the main API documentation at `/api` endpoint for complete details on all payment-related endpoints.

## Support

For issues or questions about the payment processing system:
1. Check the test file for usage examples
2. Review error messages in API responses
3. Check server logs for detailed error information
4. Consult the unified invoice system documentation

## Related Documentation

- [Unified Invoice System](./UNIFIED_INVOICE_SYSTEM.md)
- [Subscription Management](./SUBSCRIPTION_MANAGEMENT.md)
- [API Documentation](./BACKEND_DOCS.md)
