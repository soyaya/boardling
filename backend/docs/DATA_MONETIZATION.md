# Data Monetization System

## Overview

The data monetization system enables users to purchase access to other users' analytics data with automatic revenue splitting. Data owners can set their wallet privacy mode to "monetizable" and earn 70% of each data access purchase, while the platform retains 30%.

## Requirements

This system implements the following requirements:

- **11.1**: Check user's privacy mode and subscription status before allowing data purchase
- **11.2**: Create invoice for data access fee
- **11.3**: Split payment (70% to data owner, 30% to platform)
- **11.4**: Grant access to requested data after payment
- **11.5**: Update data owner balance with their share

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Data Monetization Flow                        │
└─────────────────────────────────────────────────────────────┘

Buyer Request → Authorization Check
                     ↓
              Verify Subscription (Premium/Enterprise)
                     ↓
              Verify Data is Monetizable
                     ↓
              Create Data Access Invoice
                     ↓
              Return Payment Address
                     ↓
         Buyer Sends Payment (External)
                     ↓
         Payment Detection & Processing
                     ↓
    ┌────────────────┴────────────────┐
    ↓                                  ↓
Split Revenue                    Grant Access
(70% Owner / 30% Platform)       (1 Month Duration)
    ↓                                  ↓
Update Owner Balance             Create Access Grant
    ↓                                  ↓
Record Earnings                  Buyer Can Access Data
```

## Components

### 1. Payment Service (`backend/src/services/paymentService.js`)

Core functions for data monetization:

#### `createDataAccessInvoice(buyerUserId, dataOwnerUserId, dataPackageId, amount_zec, options)`
Creates a payment invoice for data access purchase.

**Validations:**
- Buyer and owner must be different users
- Buyer must have active premium/enterprise subscription
- Data package must exist and belong to owner
- Data package must have monetizable wallets

**Returns:** Invoice details with payment address

#### `processDataAccessPayment(invoiceId, paymentDetails)`
Processes payment and grants data access.

**Actions:**
1. Validates invoice and payment
2. Calculates revenue split (70/30)
3. Updates data owner balance
4. Grants 1-month data access to buyer
5. Records earnings for data owner

**Returns:** Payment result with access details

#### `checkDataAccess(userId, dataPackageId)`
Checks if user has active access to data package.

**Returns:** Access status with expiration date

#### `getDataOwnerEarnings(userId, options)`
Gets earnings summary for data owner.

**Options:**
- `data_type`: Filter by data type
- `start_date`: Filter by start date
- `end_date`: Filter by end date

**Returns:** Earnings summary by data type

#### `getDataAccessBuyers(dataOwnerId, dataPackageId)`
Gets list of users who purchased access to data package.

**Returns:** List of buyers with payment details

#### `getMonetizableDataPackages(userId)`
Gets list of user's projects with monetizable data.

**Returns:** List of projects with earnings statistics

### 2. Payment Routes (`backend/src/routes/payment.js`)

API endpoints for data monetization:

```
POST   /api/payments/data-access                    - Create data access invoice
POST   /api/payments/process-data-access/:id        - Process data access payment
GET    /api/payments/data-access/check/:packageId   - Check if user has access
GET    /api/payments/earnings                       - Get data owner earnings
GET    /api/payments/data-access/buyers/:packageId  - Get buyers for package
GET    /api/payments/monetizable-packages           - Get user's monetizable packages
```

### 3. Database Tables

#### `data_access_grants`
Tracks purchased data access grants.

```sql
CREATE TABLE data_access_grants (
    id UUID PRIMARY KEY,
    buyer_user_id UUID NOT NULL,
    data_owner_id UUID NOT NULL,
    data_package_id TEXT NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    invoice_id INTEGER,
    amount_paid_zec DECIMAL(16,8) NOT NULL,
    granted_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    UNIQUE (buyer_user_id, data_package_id)
);
```

#### `data_owner_earnings`
Tracks earnings from data monetization.

```sql
CREATE TABLE data_owner_earnings (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    data_package_id TEXT NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    amount_zec DECIMAL(16,8) NOT NULL,      -- 70% share
    platform_fee_zec DECIMAL(16,8) NOT NULL, -- 30% fee
    buyer_user_id UUID NOT NULL,
    invoice_id INTEGER,
    earned_at TIMESTAMP NOT NULL
);
```

## Usage Examples

### 1. Create Data Access Invoice

```javascript
// Request
POST /api/payments/data-access
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "data_owner_id": "owner-uuid",
  "data_package_id": "project-uuid",
  "amount_zec": 0.005,
  "payment_method": "auto",
  "network": "testnet",
  "description": "Purchase analytics data access"
}

// Response
{
  "success": true,
  "message": "Data access invoice created successfully",
  "invoice": {
    "invoice_id": "123",
    "buyer_user_id": "buyer-uuid",
    "data_owner_id": "owner-uuid",
    "data_package_id": "project-uuid",
    "data_type": "project_analytics",
    "amount_zec": 0.005,
    "payment_address": "u1abc...",
    "payment_method": "auto",
    "address_type": "unified",
    "network": "testnet",
    "status": "pending",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

### 2. Process Data Access Payment

```javascript
// Request
POST /api/payments/process-data-access/123
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount_zec": 0.005,
  "txid": "abc123..."
}

// Response
{
  "success": true,
  "message": "Data access payment processed successfully",
  "result": {
    "success": true,
    "invoice_id": "123",
    "buyer_user_id": "buyer-uuid",
    "data_owner_id": "owner-uuid",
    "data_package_id": "project-uuid",
    "data_type": "project_analytics",
    "access_granted": true,
    "access_expires_at": "2025-02-01T00:00:00Z",
    "payment": {
      "total_amount_zec": 0.005,
      "data_owner_share_zec": 0.0035,  // 70%
      "platform_share_zec": 0.0015,    // 30%
      "txid": "abc123...",
      "paid_at": "2025-01-01T00:00:00Z"
    }
  }
}
```

### 3. Check Data Access

```javascript
// Request
GET /api/payments/data-access/check/project-uuid
Authorization: Bearer <jwt_token>

// Response (Has Access)
{
  "success": true,
  "access": {
    "has_access": true,
    "data_type": "project_analytics",
    "granted_at": "2025-01-01T00:00:00Z",
    "expires_at": "2025-02-01T00:00:00Z"
  }
}

// Response (No Access)
{
  "success": true,
  "access": {
    "has_access": false,
    "message": "No active data access found"
  }
}
```

### 4. Get Data Owner Earnings

```javascript
// Request
GET /api/payments/earnings?data_type=project_analytics
Authorization: Bearer <jwt_token>

// Response
{
  "success": true,
  "earnings": {
    "user_id": "owner-uuid",
    "total_sales": 5,
    "total_earnings_zec": 0.0175,
    "total_fees_zec": 0.0075,
    "by_data_type": {
      "project_analytics": {
        "sales": 5,
        "earnings_zec": 0.0175,
        "fees_zec": 0.0075
      }
    }
  }
}
```

### 5. Get Data Access Buyers

```javascript
// Request
GET /api/payments/data-access/buyers/project-uuid
Authorization: Bearer <jwt_token>

// Response
{
  "success": true,
  "buyers": [
    {
      "buyer_user_id": "buyer-uuid",
      "buyer_email": "buyer@example.com",
      "buyer_name": "Buyer Name",
      "data_type": "project_analytics",
      "amount_paid_zec": 0.005,
      "granted_at": "2025-01-01T00:00:00Z",
      "expires_at": "2025-02-01T00:00:00Z",
      "is_active": true
    }
  ],
  "count": 1
}
```

### 6. Get Monetizable Packages

```javascript
// Request
GET /api/payments/monetizable-packages
Authorization: Bearer <jwt_token>

// Response
{
  "success": true,
  "packages": [
    {
      "project_id": "project-uuid",
      "project_name": "My DeFi Project",
      "description": "Analytics for DeFi protocol",
      "monetizable_wallets": 5,
      "total_buyers": 3,
      "total_earnings_zec": 0.0105
    }
  ],
  "count": 1
}
```

## Revenue Split

### Calculation
- **Total Payment**: Amount paid by buyer
- **Data Owner Share**: 70% of total payment
- **Platform Fee**: 30% of total payment

### Example
```
Payment: 0.005 ZEC
├── Data Owner: 0.0035 ZEC (70%)
└── Platform: 0.0015 ZEC (30%)
```

### Balance Updates
1. Data owner's `balance_zec` is increased by their share
2. Earnings are recorded in `data_owner_earnings` table
3. Platform fee is retained (not added to any user balance)

## Access Duration

- **Default Duration**: 1 month from payment
- **Renewable**: Users can purchase again after expiration
- **Cumulative**: Multiple purchases extend access duration

## Authorization Requirements

### For Buyers
1. Must have active premium or enterprise subscription
2. Cannot purchase access to own data
3. Must have valid JWT token

### For Data Owners
1. Must have at least one wallet with `privacy_mode = 'monetizable'`
2. Project must be active
3. Must have valid JWT token

## Data Types

Currently supported data types:

- `project_analytics`: Full project analytics including all wallets
- `wallet_analytics`: Individual wallet analytics
- `comparison_data`: Competitive benchmarking data

## Error Handling

### Common Errors

**400 - Validation Error**
- Missing required fields
- Invalid amount
- Cannot purchase own data

**401 - Unauthorized**
- Missing or invalid JWT token

**403 - Forbidden**
- Subscription required
- Insufficient permissions

**404 - Not Found**
- Invoice not found
- User not found
- Project not found

**409 - Conflict**
- Invoice already paid

**500 - Internal Error**
- Database errors
- Payment processing failures

## Testing

### Test File
`backend/tests/test-data-monetization.js`

### Test Coverage
1. User registration (buyer and data owner)
2. Subscription upgrade (buyer)
3. Project and wallet creation (data owner)
4. Data access invoice creation
5. Access check before payment
6. Payment processing with revenue split
7. Access check after payment
8. Balance verification
9. Earnings summary
10. Buyers list
11. Monetizable packages list
12. Prevent self-purchase
13. Prevent purchase without subscription

### Running Tests
```bash
# Start the backend server
npm start

# Run migration
node backend/scripts/run-data-monetization-migration.js

# In another terminal, run tests
node backend/tests/test-data-monetization.js
```

## Database Migration

### Migration File
`backend/migrations/011_add_data_monetization.sql`

### Running Migration
```bash
node backend/scripts/run-data-monetization-migration.js
```

### Tables Created
- `data_access_grants`
- `data_owner_earnings`

### Indexes Created
- `idx_data_access_grants_buyer`
- `idx_data_access_grants_owner`
- `idx_data_access_grants_package`
- `idx_data_access_grants_expires`
- `idx_data_owner_earnings_user`
- `idx_data_owner_earnings_package`
- `idx_data_owner_earnings_buyer`

## Integration with Existing Systems

### 1. Unified Invoice System
- Uses `unified_invoices` table for payment tracking
- Leverages existing address generation
- Maintains compatibility with all payment methods

### 2. Subscription Service
- Verifies subscription status before allowing purchases
- Requires premium or enterprise subscription
- Integrates with subscription expiration checks

### 3. Privacy Enforcement Service
- Respects wallet privacy modes
- Only monetizable wallets can be purchased
- Enforces access grants in analytics queries

### 4. Analytics Service
- Analytics endpoints check data access grants
- Comparison data requires either:
  - User owns the data (own projects)
  - User has purchased access
  - Data is public (not monetizable)

## Security Considerations

1. **Authorization**
   - All endpoints require JWT authentication
   - Users can only access their own invoices and earnings
   - Buyers can only purchase from other users

2. **Payment Verification**
   - Verify payment amount matches invoice
   - Prevent double-processing
   - Atomic transactions for balance updates

3. **Access Control**
   - Verify subscription status before purchase
   - Check access grants before serving data
   - Expire access after duration

4. **Data Privacy**
   - Only monetizable data can be purchased
   - Private data is never accessible
   - Public data is anonymized

## Future Enhancements

1. **Dynamic Pricing**
   - Allow data owners to set custom prices
   - Tiered pricing based on data volume
   - Bulk purchase discounts

2. **Subscription-Based Access**
   - Monthly/yearly data access subscriptions
   - Auto-renewal options
   - Subscription management

3. **Data Marketplace**
   - Browse available data packages
   - Search and filter by category
   - Ratings and reviews

4. **Analytics Dashboard**
   - Earnings tracking and visualization
   - Buyer analytics
   - Revenue forecasting

5. **Automated Payments**
   - Blockchain monitoring for automatic payment detection
   - Webhook integration
   - Real-time access grants

## Related Documentation

- [Payment Processing](./PAYMENT_PROCESSING.md)
- [Subscription Management](./SUBSCRIPTION_MANAGEMENT.md)
- [Privacy Enforcement](./PRIVACY_ENFORCEMENT_SERVICE.md)
- [Unified Invoice System](./UNIFIED_INVOICE_SYSTEM.md)

