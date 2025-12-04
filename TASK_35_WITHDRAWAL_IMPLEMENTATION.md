# Task 35: Withdrawal Processing Backend Implementation

## Overview

Implemented complete withdrawal processing backend for user earnings from data monetization. The implementation includes withdrawal request validation, address validation, fee calculation, processing logic, and balance updates.

## Requirements Satisfied

### Requirement 12.1: Balance Validation
✓ Validates user has sufficient balance before creating withdrawal
- Checks current balance against requested amount
- Prevents withdrawal if insufficient funds
- Provides clear error messages with available balance

### Requirement 12.2: Address Validation
✓ Validates Zcash address format
- Supports transparent (t-addr), shielded (z-addr), and unified addresses
- Uses existing `validateZcashAddress` utility
- Validates address format based on network (mainnet/testnet)
- Provides specific error messages for invalid formats

### Requirement 12.3: Fee Calculation
✓ Calculates platform fees and net withdrawal amount
- Platform fee: 2% of withdrawal amount (configurable)
- Calculates net amount sent to user (amount - fee)
- Enforces minimum withdrawal: 0.001 ZEC
- Enforces maximum withdrawal: 100 ZEC per transaction

### Requirement 12.4: Withdrawal Processing
✓ Processes withdrawal and records transaction
- Creates withdrawal record in database
- Tracks status: pending → processing → sent/failed
- Records blockchain transaction ID (txid) on completion
- Maintains withdrawal history for users

### Requirement 12.5: Balance Updates
✓ Updates user balance and withdrawal status
- Deducts balance immediately on withdrawal creation
- Updates status to 'sent' on successful completion
- Refunds balance if withdrawal fails
- Maintains transaction integrity with database locks

## Implementation Details

### 1. Withdrawal Service (`backend/src/services/withdrawalService.js`)

Created comprehensive withdrawal service with the following functions:

#### Core Functions

**`calculateWithdrawalFee(amount_zec)`**
- Calculates 2% platform fee
- Returns fee and net amount
- Ensures proper decimal precision (8 places)

**`validateWithdrawalRequest(userId, amount_zec, to_address, network)`**
- Validates amount (positive, within min/max limits)
- Validates Zcash address format
- Checks user balance
- Returns validation result with errors array

**`createWithdrawal(userId, amount_zec, to_address, network)`**
- Validates withdrawal request
- Calculates fees
- Creates withdrawal record
- Deducts amount from user balance immediately
- Uses database transaction for atomicity

**`processWithdrawal(withdrawalId)`**
- Updates status to 'processing'
- Initiates blockchain transaction (placeholder for RPC integration)
- Returns updated withdrawal details

**`completeWithdrawal(withdrawalId, txid)`**
- Updates status to 'sent'
- Records blockchain transaction ID
- Sets processed_at timestamp
- Finalizes withdrawal

**`failWithdrawal(withdrawalId, reason)`**
- Updates status to 'failed'
- Refunds amount to user balance
- Records failure reason
- Maintains transaction integrity

#### Query Functions

**`getWithdrawal(withdrawalId)`**
- Retrieves withdrawal details by ID
- Returns formatted withdrawal object

**`getUserWithdrawals(userId, options)`**
- Lists user's withdrawal history
- Supports pagination (limit, offset)
- Supports filtering by status
- Orders by requested_at DESC

**`getWithdrawalStats(userId)`**
- Aggregates withdrawal statistics
- Counts by status (pending, processing, sent, failed)
- Sums total withdrawn, fees, and net amounts
- Provides comprehensive overview

### 2. API Endpoints (`backend/src/routes/payment.js`)

Added withdrawal endpoints to payment routes:

#### POST /api/payments/withdraw
- Creates new withdrawal request
- Requires authentication (JWT)
- Validates amount and address
- Returns withdrawal details with ID

**Request Body:**
```json
{
  "amount_zec": 0.5,
  "to_address": "t1abc123...",
  "network": "testnet"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Withdrawal request created successfully",
  "withdrawal": {
    "withdrawal_id": "uuid",
    "user_id": "uuid",
    "amount_zec": 0.5,
    "fee_zec": 0.01,
    "net_zec": 0.49,
    "to_address": "t1abc123...",
    "status": "pending",
    "requested_at": "2024-01-01T00:00:00Z",
    "previous_balance": 2.5,
    "new_balance": 2.0
  }
}
```

#### GET /api/payments/withdrawals
- Lists user's withdrawal history
- Supports pagination and filtering
- Requires authentication

**Query Parameters:**
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)
- `status`: Filter by status (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "withdrawals": [...],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 10
  }
}
```

#### GET /api/payments/withdrawals/:id
- Gets specific withdrawal details
- Verifies user owns the withdrawal
- Returns 403 if accessing another user's withdrawal

**Response (200 OK):**
```json
{
  "success": true,
  "withdrawal": {
    "withdrawal_id": "uuid",
    "user_id": "uuid",
    "amount_zec": 0.5,
    "fee_zec": 0.01,
    "net_zec": 0.49,
    "to_address": "t1abc123...",
    "status": "sent",
    "txid": "abc123...",
    "requested_at": "2024-01-01T00:00:00Z",
    "processed_at": "2024-01-01T00:05:00Z"
  }
}
```

#### GET /api/payments/withdrawals-stats
- Gets withdrawal statistics for user
- Aggregates counts and amounts by status

**Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "user_id": "uuid",
    "total_withdrawals": 5,
    "pending_count": 1,
    "processing_count": 0,
    "completed_count": 3,
    "failed_count": 1,
    "total_withdrawn_zec": 2.5,
    "total_fees_zec": 0.05,
    "total_net_zec": 2.45
  }
}
```

### 3. Database Schema

Uses existing `withdrawals` table from `backend/schema.sql`:

```sql
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_zec DECIMAL(16,8) NOT NULL CHECK (amount_zec > 0),
    fee_zec DECIMAL(16,8) NOT NULL CHECK (fee_zec >= 0),
    net_zec DECIMAL(16,8) NOT NULL CHECK (net_zec > 0),
    to_address VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    txid VARCHAR(64),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);
```

**Indexes:**
- `idx_withdrawals_user_id` - Fast user lookup
- `idx_withdrawals_status` - Status filtering
- `idx_withdrawals_to_address` - Address lookup
- `idx_withdrawals_processed_at` - Time-based queries

## Features

### Validation
- ✓ Balance validation with clear error messages
- ✓ Address format validation for all Zcash address types
- ✓ Amount validation (min/max limits)
- ✓ User authorization checks

### Fee Calculation
- ✓ Configurable platform fee (2%)
- ✓ Precise decimal calculations (8 decimal places)
- ✓ Clear breakdown of amount, fee, and net

### Processing
- ✓ Status tracking (pending → processing → sent/failed)
- ✓ Transaction ID recording
- ✓ Timestamp tracking (requested_at, processed_at)
- ✓ Failure handling with balance refund

### Balance Management
- ✓ Immediate balance deduction on creation
- ✓ Balance refund on failure
- ✓ Database transaction safety
- ✓ Row-level locking for race condition prevention

### Query & Reporting
- ✓ Withdrawal history with pagination
- ✓ Status filtering
- ✓ Statistics aggregation
- ✓ Individual withdrawal lookup

## Error Handling

### Validation Errors (400)
- Missing required fields
- Invalid amount (negative, zero, below min, above max)
- Invalid address format
- Insufficient balance

### Authorization Errors (403)
- Accessing another user's withdrawal

### Not Found Errors (404)
- User not found
- Withdrawal not found

### Conflict Errors (409)
- Withdrawal already processed
- Invalid status transition

### Internal Errors (500)
- Database errors
- Transaction failures

## Security Features

1. **Authentication Required**: All endpoints require JWT authentication
2. **User Authorization**: Users can only access their own withdrawals
3. **Balance Locking**: Database row locks prevent race conditions
4. **Transaction Safety**: All operations use BEGIN/COMMIT/ROLLBACK
5. **Input Validation**: Comprehensive validation before processing
6. **Address Validation**: Prevents sending to invalid addresses

## Testing

Created comprehensive test files:

### `backend/tests/test-withdrawal-processing.js`
- Unit tests for all service functions
- Balance validation tests
- Address validation tests
- Fee calculation tests
- Status flow tests
- Balance update verification

### `backend/tests/verify-withdrawal-implementation.js`
- Verifies all components are implemented
- Checks requirements coverage
- Validates database schema
- Confirms feature completeness

**Verification Result:** ✓ All verifications passed

## Integration Points

### Existing Systems
- **Payment Service**: Withdrawal endpoints added to payment routes
- **User Balance**: Integrates with `users.balance_zec` field
- **Address Validation**: Uses `validateZcashAddress` utility
- **Authentication**: Uses `authenticateJWT` middleware

### Future Integration
- **Blockchain RPC**: `processWithdrawal` ready for Zcash RPC integration
- **Webhook Notifications**: Can trigger notifications on status changes
- **Admin Dashboard**: Statistics available for admin monitoring

## Usage Example

### Create Withdrawal
```javascript
// User requests withdrawal
POST /api/payments/withdraw
Authorization: Bearer <jwt_token>
{
  "amount_zec": 1.5,
  "to_address": "t1abc123def456ghi789jkl012mno345pqr",
  "network": "testnet"
}

// Response
{
  "success": true,
  "withdrawal": {
    "withdrawal_id": "550e8400-e29b-41d4-a716-446655440000",
    "amount_zec": 1.5,
    "fee_zec": 0.03,
    "net_zec": 1.47,
    "status": "pending",
    "previous_balance": 2.5,
    "new_balance": 1.0
  }
}
```

### Check Status
```javascript
GET /api/payments/withdrawals/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>

// Response
{
  "success": true,
  "withdrawal": {
    "withdrawal_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "sent",
    "txid": "abc123def456...",
    "processed_at": "2024-01-01T00:05:00Z"
  }
}
```

## Configuration

### Withdrawal Limits
```javascript
const MIN_WITHDRAWAL_AMOUNT = 0.001; // 0.001 ZEC
const MAX_WITHDRAWAL_AMOUNT = 100;   // 100 ZEC
```

### Platform Fee
```javascript
const WITHDRAWAL_FEE_PERCENTAGE = 0.02; // 2%
```

These can be adjusted in `backend/src/services/withdrawalService.js`.

## Next Steps

1. **Blockchain Integration**: Integrate with Zcash RPC for actual transaction sending
2. **Admin Processing**: Create admin endpoints for processing pending withdrawals
3. **Notifications**: Add email/webhook notifications for status changes
4. **Frontend Integration**: Create withdrawal UI components (Task 36)
5. **Monitoring**: Add logging and monitoring for withdrawal processing

## Files Created/Modified

### Created
- `backend/src/services/withdrawalService.js` - Withdrawal service implementation
- `backend/tests/test-withdrawal-processing.js` - Comprehensive unit tests
- `backend/tests/test-withdrawal-api.js` - API integration tests
- `backend/tests/verify-withdrawal-implementation.js` - Implementation verification
- `TASK_35_WITHDRAWAL_IMPLEMENTATION.md` - This documentation

### Modified
- `backend/src/routes/payment.js` - Added withdrawal endpoints

## Conclusion

Task 35 is complete! All withdrawal processing backend functionality has been implemented according to requirements 12.1-12.5. The implementation includes:

- ✓ Withdrawal request validation
- ✓ Address validation
- ✓ Fee calculation
- ✓ Withdrawal processing
- ✓ Balance updates
- ✓ Status tracking
- ✓ History and statistics
- ✓ Error handling
- ✓ Security features

The system is ready for frontend integration and blockchain RPC integration.
