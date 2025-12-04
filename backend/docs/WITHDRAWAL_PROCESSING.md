# Withdrawal Processing

## Overview

The withdrawal processing system allows users to withdraw their earnings from data monetization to their personal Zcash wallets. The system handles validation, fee calculation, processing, and balance updates.

## Quick Start

### Create a Withdrawal

```bash
curl -X POST http://localhost:3000/api/payments/withdraw \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount_zec": 0.5,
    "to_address": "t1abc123def456ghi789jkl012mno345pqr",
    "network": "testnet"
  }'
```

### Get Withdrawal History

```bash
curl -X GET http://localhost:3000/api/payments/withdrawals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Check Withdrawal Status

```bash
curl -X GET http://localhost:3000/api/payments/withdrawals/WITHDRAWAL_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API Endpoints

### POST /api/payments/withdraw
Create a new withdrawal request.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "amount_zec": 0.5,
  "to_address": "t1abc123def456ghi789jkl012mno345pqr",
  "network": "testnet"
}
```

**Response (201):**
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

**Errors:**
- `400 VALIDATION_ERROR` - Invalid amount or address
- `400 INSUFFICIENT_BALANCE` - Not enough balance
- `401 AUTH_REQUIRED` - Missing or invalid token
- `500 INTERNAL_ERROR` - Server error

### GET /api/payments/withdrawals
Get user's withdrawal history.

**Authentication:** Required (JWT)

**Query Parameters:**
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status (pending, processing, sent, failed)

**Response (200):**
```json
{
  "success": true,
  "withdrawals": [
    {
      "withdrawal_id": "uuid",
      "amount_zec": 0.5,
      "fee_zec": 0.01,
      "net_zec": 0.49,
      "to_address": "t1abc123...",
      "status": "sent",
      "txid": "abc123...",
      "requested_at": "2024-01-01T00:00:00Z",
      "processed_at": "2024-01-01T00:05:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 1
  }
}
```

### GET /api/payments/withdrawals/:id
Get specific withdrawal details.

**Authentication:** Required (JWT)

**Response (200):**
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

**Errors:**
- `403 PERMISSION_DENIED` - Accessing another user's withdrawal
- `404 NOT_FOUND` - Withdrawal not found

### GET /api/payments/withdrawals-stats
Get withdrawal statistics for current user.

**Authentication:** Required (JWT)

**Response (200):**
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

## Withdrawal Process

### Status Flow

```
pending → processing → sent
                    ↘ failed
```

1. **pending**: Withdrawal created, balance deducted
2. **processing**: Blockchain transaction initiated
3. **sent**: Transaction confirmed, txid recorded
4. **failed**: Transaction failed, balance refunded

### Fee Structure

- **Platform Fee**: 2% of withdrawal amount
- **Minimum Withdrawal**: 0.001 ZEC
- **Maximum Withdrawal**: 100 ZEC per transaction

**Example:**
- Withdrawal Amount: 1.0 ZEC
- Platform Fee: 0.02 ZEC (2%)
- Net Amount Sent: 0.98 ZEC

## Validation Rules

### Amount Validation
- Must be a positive number
- Must be at least 0.001 ZEC
- Must not exceed 100 ZEC
- User must have sufficient balance

### Address Validation
- Must be a valid Zcash address
- Supports transparent (t-addr), shielded (z-addr), and unified addresses
- Format validated based on network (mainnet/testnet)

**Valid Address Formats:**
- **Testnet Transparent**: `t1...` or `tm...` (35 chars)
- **Testnet Shielded**: `ztestsapling...` (90+ chars)
- **Testnet Unified**: `utest1...` (105+ chars)
- **Mainnet Transparent**: `t1...` or `t3...` (35 chars)
- **Mainnet Shielded**: `zs...` (78 chars)
- **Mainnet Unified**: `u1...` (100+ chars)

## Balance Management

### On Withdrawal Creation
- Balance is immediately deducted from user account
- Prevents double-spending
- Uses database row locks for safety

### On Withdrawal Completion
- No additional balance changes
- Status updated to 'sent'
- Transaction ID recorded

### On Withdrawal Failure
- Balance is refunded to user account
- Status updated to 'failed'
- Failure reason recorded

## Security

### Authentication
- All endpoints require valid JWT token
- Token must not be expired

### Authorization
- Users can only access their own withdrawals
- Attempting to access another user's withdrawal returns 403

### Transaction Safety
- All database operations use transactions
- Row-level locking prevents race conditions
- Automatic rollback on errors

### Input Validation
- Comprehensive validation before processing
- Address format verification
- Amount range checks
- Balance verification

## Error Handling

### Common Errors

**Insufficient Balance**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Insufficient balance. Available: 0.5 ZEC, Requested: 1.0 ZEC"
}
```

**Invalid Address**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid Zcash address format. Must be a valid t-address, z-address, or unified address"
}
```

**Amount Too Small**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Withdrawal amount must be at least 0.001 ZEC"
}
```

**Amount Too Large**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Withdrawal amount cannot exceed 100 ZEC"
}
```

## Service Functions

The withdrawal service (`backend/src/services/withdrawalService.js`) provides:

### Core Functions
- `calculateWithdrawalFee(amount_zec)` - Calculate fee and net amount
- `validateWithdrawalRequest(userId, amount_zec, to_address, network)` - Validate request
- `createWithdrawal(userId, amount_zec, to_address, network)` - Create withdrawal
- `processWithdrawal(withdrawalId)` - Start processing
- `completeWithdrawal(withdrawalId, txid)` - Mark as sent
- `failWithdrawal(withdrawalId, reason)` - Mark as failed and refund

### Query Functions
- `getWithdrawal(withdrawalId)` - Get withdrawal details
- `getUserWithdrawals(userId, options)` - Get user's withdrawal history
- `getWithdrawalStats(userId)` - Get withdrawal statistics

## Database Schema

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

## Configuration

Edit `backend/src/services/withdrawalService.js` to adjust:

```javascript
// Platform fee (2%)
const WITHDRAWAL_FEE_PERCENTAGE = 0.02;

// Minimum withdrawal (0.001 ZEC)
const MIN_WITHDRAWAL_AMOUNT = 0.001;

// Maximum withdrawal (100 ZEC)
const MAX_WITHDRAWAL_AMOUNT = 100;
```

## Testing

Run withdrawal tests:

```bash
# Verify implementation
node backend/tests/verify-withdrawal-implementation.js

# Run unit tests (requires database)
node backend/tests/test-withdrawal-processing.js
```

## Integration

### With Payment Service
Withdrawal endpoints are part of the payment routes (`/api/payments/*`).

### With User Balance
Integrates with `users.balance_zec` field for balance management.

### With Blockchain (Future)
The `processWithdrawal` function is ready for Zcash RPC integration to send actual transactions.

## Monitoring

### Key Metrics to Monitor
- Total withdrawals by status
- Average processing time
- Failed withdrawal rate
- Total fees collected
- Pending withdrawal queue size

### Logs to Watch
- Withdrawal creation
- Status transitions
- Balance updates
- Validation failures
- Processing errors

## Troubleshooting

### Withdrawal Stuck in Pending
- Check if blockchain RPC is connected
- Verify processing service is running
- Check for database locks

### Balance Not Refunded on Failure
- Check database transaction logs
- Verify `failWithdrawal` was called
- Check for rollback errors

### Address Validation Failing
- Verify network parameter matches address format
- Check address length and prefix
- Ensure no extra whitespace

## Related Documentation

- [Payment Processing](./PAYMENT_PROCESSING.md)
- [Data Monetization](./DATA_MONETIZATION.md)
- [Subscription Management](./SUBSCRIPTION_MANAGEMENT.md)
- [API Documentation](./BACKEND_DOCS.md)

## Support

For issues or questions:
1. Check error messages for specific validation failures
2. Review withdrawal status and history
3. Verify user balance is sufficient
4. Check address format matches network
5. Review server logs for detailed errors
