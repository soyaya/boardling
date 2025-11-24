# Shielded Address Generation API

This document describes the shielded address generation routes that work with Zaino indexer for advanced Zcash privacy features.

## Overview

The shielded address API provides endpoints for:
- Generating new shielded addresses (Sapling and Unified)
- Validating shielded address formats
- Retrieving address information (balance, transactions)
- Batch address generation
- Wallet management for shielded addresses

## Prerequisites

- **Zaino Indexer**: Must be running on `http://127.0.0.1:8234`
- **Zebra Node**: Must be synced and accessible to Zaino
- **Database**: Shielded wallet tables must be migrated

## API Endpoints

### 1. Check Zaino Service Status

**GET** `/api/shielded/status`

Check if Zaino indexer is running and available.

**Response:**
```json
{
  "success": true,
  "zaino_available": true,
  "info": {
    "version": "0.1.0",
    "network": "main"
  },
  "endpoints": {
    "rpc": "http://127.0.0.1:8234",
    "grpc": "127.0.0.1:9067"
  }
}
```

### 2. Generate Shielded Address

**POST** `/api/shielded/address/generate`

Generate a new shielded address using Zaino.

**Request Body:**
```json
{
  "type": "auto",              // "sapling", "unified", or "auto"
  "save_to_wallet": false,     // Optional: save to user wallet
  "user_id": "uuid",           // Required if save_to_wallet=true
  "wallet_name": "My Wallet"   // Optional wallet name
}
```

**Response:**
```json
{
  "success": true,
  "address": "zs1z7rejlpsa98s2rrrfkwmaxu8rgs7ddhqkumla0x5vlmqz0d4jjgvm5d2yk74ugn3c4ksqhvqzqe",
  "type": "sapling",
  "generated_at": "2025-11-21T00:30:00.000Z",
  "wallet": {                  // Only if save_to_wallet=true
    "id": "wallet-uuid",
    "name": "My Wallet",
    "saved_at": "2025-11-21T00:30:00.000Z"
  }
}
```

### 3. Validate Shielded Address

**POST** `/api/shielded/address/validate`

Validate a shielded address format and check with RPC if available.

**Request Body:**
```json
{
  "address": "zs1z7rejlpsa98s2rrrfkwmaxu8rgs7ddhqkumla0x5vlmqz0d4jjgvm5d2yk74ugn3c4ksqhvqzqe"
}
```

**Response:**
```json
{
  "valid": true,
  "address": "zs1z7rejlpsa98s2rrrfkwmaxu8rgs7ddhqkumla0x5vlmqz0d4jjgvm5d2yk74ugn3c4ksqhvqzqe",
  "type": "sapling",
  "details": {
    "isvalid": true,
    "address": "zs1...",
    "type": "sapling"
  }
}
```

### 4. Get Address Information

**GET** `/api/shielded/address/:address/info?include_transactions=true&min_confirmations=1`

Get balance and transaction information for a shielded address.

**Response:**
```json
{
  "success": true,
  "address": "zs1z7rejlpsa98s2rrrfkwmaxu8rgs7ddhqkumla0x5vlmqz0d4jjgvm5d2yk74ugn3c4ksqhvqzqe",
  "type": "sapling",
  "balance": 0.05,
  "transaction_count": 3,
  "transactions": [
    {
      "txid": "abc123...",
      "amount": 0.02,
      "confirmations": 5,
      "memo": "Payment received"
    }
  ],
  "last_updated": "2025-11-21T00:30:00.000Z"
}
```

### 5. Batch Generate Addresses

**POST** `/api/shielded/address/batch-generate`

Generate multiple shielded addresses in one request.

**Request Body:**
```json
{
  "count": 5,                  // 1-10 addresses
  "type": "auto",              // "sapling", "unified", or "auto"
  "user_id": "uuid",           // Optional: for wallet saving
  "save_to_wallet": false      // Optional: save all to wallet
}
```

**Response:**
```json
{
  "success": true,
  "generated_count": 5,
  "requested_count": 5,
  "addresses": [
    {
      "address": "zs1...",
      "type": "sapling",
      "generated_at": "2025-11-21T00:30:00.000Z",
      "wallet_id": "uuid"      // Only if saved to wallet
    }
  ],
  "errors": []                 // Any generation errors
}
```

## Wallet Management

### Create Shielded Wallet

**POST** `/api/shielded/wallet/create`

Create a new shielded wallet for a user.

**Request Body:**
```json
{
  "user_id": "uuid",
  "wallet_name": "My Shielded Wallet"
}
```

### Get User Wallets

**GET** `/api/shielded/wallet/user/:user_id`

Get all shielded wallets for a user with current balances.

### Get Wallet Details

**GET** `/api/shielded/wallet/:wallet_id/details`

Get detailed information about a specific wallet including transactions.

## Invoice Management

### Create Shielded Invoice

**POST** `/api/shielded/invoice/create`

Create an invoice using a shielded address.

**Request Body:**
```json
{
  "user_id": "uuid",
  "wallet_id": "uuid",         // Optional: use existing wallet
  "amount_zec": 0.01,
  "item_id": "product_123",
  "memo": "Payment for service"
}
```

### Check Shielded Invoice Payment

**POST** `/api/shielded/invoice/check`

Check if a shielded invoice has been paid.

**Request Body:**
```json
{
  "invoice_id": "uuid"
}
```

## Error Handling

### Service Unavailable (503)
When Zaino indexer is not running:
```json
{
  "error": "Shielded address service unavailable",
  "details": "Zaino indexer is not running. Shielded operations require Zaino to be active.",
  "fallback": "Use transparent addresses via /api/invoice endpoints"
}
```

### Address Generation Failed (500)
```json
{
  "error": "Failed to generate shielded address",
  "details": "Zaino RPC Error: Method not found"
}
```

### Invalid Address Type (400)
```json
{
  "error": "Invalid address type",
  "valid_types": ["sapling", "unified", "auto"]
}
```

## Address Types

### Sapling Addresses
- Format: `zs1...` (78 characters)
- Privacy: Full transaction privacy
- Compatibility: Supported since Sapling activation

### Unified Addresses  
- Format: `u1...` (variable length)
- Privacy: Multi-pool support
- Compatibility: Supported since NU5 activation

### Auto Mode
- Tries Sapling first, falls back to Unified
- Recommended for maximum compatibility

## Integration Examples

### JavaScript/Node.js
```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

// Generate a shielded address
async function generateShieldedAddress() {
  try {
    const response = await axios.post(`${API_BASE}/api/shielded/address/generate`, {
      type: 'auto'
    });
    
    console.log('Generated address:', response.data.address);
    return response.data.address;
  } catch (error) {
    if (error.response?.status === 503) {
      console.log('Zaino not available, using transparent addresses');
      // Fallback to transparent address generation
    }
    throw error;
  }
}

// Validate an address
async function validateAddress(address) {
  const response = await axios.post(`${API_BASE}/api/shielded/address/validate`, {
    address: address
  });
  
  return response.data.valid;
}
```

### cURL Examples
```bash
# Check Zaino status
curl -X GET http://localhost:3000/api/shielded/status

# Generate Sapling address
curl -X POST http://localhost:3000/api/shielded/address/generate \
  -H "Content-Type: application/json" \
  -d '{"type": "sapling"}'

# Validate address
curl -X POST http://localhost:3000/api/shielded/address/validate \
  -H "Content-Type: application/json" \
  -d '{"address": "zs1z7rejlpsa98s2rrrfkwmaxu8rgs7ddhqkumla0x5vlmqz0d4jjgvm5d2yk74ugn3c4ksqhvqzqe"}'

# Get address info
curl -X GET "http://localhost:3000/api/shielded/address/zs1z7rejlpsa98s2rrrfkwmaxu8rgs7ddhqkumla0x5vlmqz0d4jjgvm5d2yk74ugn3c4ksqhvqzqe/info?include_transactions=true"
```

## Production Considerations

1. **Zaino Dependency**: Ensure Zaino indexer is running and monitored
2. **Error Handling**: Always handle 503 errors and provide transparent fallbacks
3. **Rate Limiting**: Batch operations are limited to 10 addresses per request
4. **Database**: Shielded wallets require additional database tables
5. **Privacy**: Shielded addresses provide enhanced privacy but require more resources

## Troubleshooting

### Zaino Connection Issues
- Check if Zaino is running: `curl http://127.0.0.1:8234`
- Verify Zebra node is synced and accessible to Zaino
- Check Zaino logs for RPC errors

### Address Generation Failures
- Ensure Zaino has wallet functionality enabled
- Check if the requested address type is supported
- Verify network compatibility (mainnet vs testnet)

### Database Errors
- Run shielded table migrations: `003_shielded_tables.sql`
- Check database permissions for new tables
- Verify foreign key constraints are satisfied