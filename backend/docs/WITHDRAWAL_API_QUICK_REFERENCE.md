# Withdrawal API Quick Reference

## Endpoints

### Request Withdrawal
```
POST /api/payments/withdraw
```

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "amount_zec": 0.5,
  "to_address": "t1abc123...",
  "network": "testnet"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Withdrawal request created successfully",
  "withdrawal": {
    "withdrawal_id": "uuid",
    "amount_zec": 0.5,
    "fee_zec": 0.01,
    "net_zec": 0.49,
    "status": "pending",
    "previous_balance": 2.5,
    "new_balance": 2.0
  }
}
```

---

### List Withdrawals
```
GET /api/payments/withdrawals?limit=50&offset=0&status=pending
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
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

---

## Common Errors

### Insufficient Balance (400)
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Insufficient balance. Available: 0.5 ZEC, Requested: 1.0 ZEC"
}
```

### Invalid Address (400)
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid Zcash address format. Must be a valid t-address, z-address, or unified address"
}
```

### Unauthorized (401)
```json
{
  "error": "AUTH_REQUIRED",
  "message": "Authentication required"
}
```

---

## Fee Structure

- **Platform Fee:** 2% of withdrawal amount
- **Minimum:** 0.001 ZEC
- **Maximum:** 100 ZEC per transaction

**Example:**
- Request: 1.0 ZEC
- Fee: 0.02 ZEC (2%)
- Net: 0.98 ZEC

---

## Withdrawal Status Flow

```
pending → processing → sent
                    ↘ failed
```

- **pending:** Created, balance deducted
- **processing:** Blockchain transaction initiated
- **sent:** Transaction confirmed
- **failed:** Transaction failed, balance refunded

---

## Quick Test

```bash
# Set your JWT token
TOKEN="your_jwt_token_here"

# Request withdrawal
curl -X POST http://localhost:3000/api/payments/withdraw \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount_zec": 0.1,
    "to_address": "t1abc123def456ghi789jkl012mno345pqr",
    "network": "testnet"
  }'

# List withdrawals
curl -X GET http://localhost:3000/api/payments/withdrawals \
  -H "Authorization: Bearer $TOKEN"
```

---

## Related Documentation

- [Full Withdrawal Processing Guide](./WITHDRAWAL_PROCESSING.md)
- [Payment Processing](./PAYMENT_PROCESSING.md)
- [API Documentation](./BACKEND_DOCS.md)
