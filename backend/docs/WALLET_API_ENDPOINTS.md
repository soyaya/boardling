# Wallet API Endpoints

This document describes the wallet management API endpoints for the Boardling platform.

## Overview

The Wallet API provides endpoints for managing Zcash wallet addresses within projects. All endpoints require JWT authentication.

## Authentication

All wallet endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Base URL

```
/api/wallets
```

## Endpoints

### 1. Add Wallet to Project

Create a new wallet address for tracking within a project.

**Endpoint:** `POST /api/wallets`

**Request Body:**
```json
{
  "project_id": "uuid",
  "address": "string",
  "type": "t|z|u",           // Optional - auto-detected if not provided
  "privacy_mode": "private|public|monetizable",  // Optional - defaults to "private"
  "description": "string",    // Optional
  "network": "mainnet|testnet",  // Optional - defaults to "mainnet"
  "is_active": true           // Optional - defaults to true
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "address": "string",
    "type": "t|z|u",
    "privacy_mode": "private|public|monetizable",
    "description": "string",
    "network": "mainnet|testnet",
    "is_active": true,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

**Requirements Validated:**
- 5.1: Validates address format and stores in wallets table
- 5.2: Automatically determines wallet type (transparent, shielded, unified)
- 5.3: Stores privacy_mode value

---

### 2. List Project Wallets

Retrieve all wallets for a specific project.

**Endpoint:** `GET /api/wallets?project_id=<uuid>`

**Query Parameters:**
- `project_id` (required): UUID of the project

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "address": "string",
      "type": "t|z|u",
      "privacy_mode": "private|public|monetizable",
      "description": "string",
      "network": "mainnet|testnet",
      "is_active": true,
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

---

### 3. Get Wallet Details

Retrieve details for a specific wallet.

**Endpoint:** `GET /api/wallets/:id`

**URL Parameters:**
- `id` (required): UUID of the wallet

**Query Parameters (optional):**
- `project_id`: UUID of the project (for additional verification)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "address": "string",
    "type": "t|z|u",
    "privacy_mode": "private|public|monetizable",
    "description": "string",
    "network": "mainnet|testnet",
    "is_active": true,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

**Requirements Validated:**
- 5.5: Displays wallet address, type, privacy mode, and analytics status

---

### 4. Update Wallet Privacy Mode

Update wallet settings, primarily the privacy mode.

**Endpoint:** `PUT /api/wallets/:id`

**URL Parameters:**
- `id` (required): UUID of the wallet

**Request Body:**
```json
{
  "privacy_mode": "private|public|monetizable",  // Optional
  "description": "string",    // Optional
  "is_active": true          // Optional
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "address": "string",
    "type": "t|z|u",
    "privacy_mode": "private|public|monetizable",
    "description": "string",
    "network": "mainnet|testnet",
    "is_active": true,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

**Requirements Validated:**
- 5.3: Updates and persists privacy_mode value

---

### 5. Remove Wallet

Delete a wallet from a project.

**Endpoint:** `DELETE /api/wallets/:id`

**URL Parameters:**
- `id` (required): UUID of the wallet

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Wallet deleted successfully"
}
```

---

### 6. Validate Zcash Address

Validate a Zcash address format and detect its type.

**Endpoint:** `POST /api/wallets/validate`

**Request Body:**
```json
{
  "address": "string",
  "network": "mainnet|testnet"  // Optional - defaults to "mainnet"
}
```

**Response (Valid Address):** `200 OK`
```json
{
  "success": true,
  "data": {
    "valid": true,
    "address": "string",
    "network": "mainnet|testnet",
    "type": "t|z|u",
    "typeName": "transparent|shielded|unified",
    "error": null
  }
}
```

**Response (Invalid Address):** `200 OK`
```json
{
  "success": true,
  "data": {
    "valid": false,
    "address": "string",
    "network": "mainnet|testnet",
    "error": "Invalid address format"
  }
}
```

**Requirements Validated:**
- 5.1: Validates Zcash address format
- 5.2: Detects wallet type automatically

---

## Backward Compatibility Routes

For backward compatibility, all wallet endpoints are also available under the project routes:

- `POST /api/projects/:projectId/wallets` - Create wallet
- `GET /api/projects/:projectId/wallets` - List wallets
- `GET /api/projects/:projectId/wallets/:walletId` - Get wallet
- `PUT /api/projects/:projectId/wallets/:walletId` - Update wallet
- `DELETE /api/projects/:projectId/wallets/:walletId` - Delete wallet

## Error Responses

### 400 Bad Request
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Address is required"
}
```

### 401 Unauthorized
```json
{
  "error": "AUTH_REQUIRED",
  "message": "Authentication required. Please provide a valid JWT token."
}
```

### 403 Forbidden
```json
{
  "error": "PERMISSION_DENIED",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "NOT_FOUND",
  "message": "Wallet not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "INTERNAL_ERROR",
  "message": "An internal error occurred"
}
```

## Wallet Types

- **t** (transparent): Traditional transparent addresses (e.g., `t1abc...`)
- **z** (shielded): Shielded addresses using zk-SNARKs (e.g., `zs1...`)
- **u** (unified): Unified addresses supporting multiple pools (e.g., `u1...`)

## Privacy Modes

- **private**: Wallet data excluded from all public queries and comparisons
- **public**: Anonymized wallet data included in aggregate statistics
- **monetizable**: Wallet data available for purchase by other users

## Address Validation

The validation endpoint checks:
1. Address format and length
2. Network compatibility (mainnet vs testnet)
3. Address type detection
4. Checksum validation (where applicable)

## Examples

### Create a Transparent Wallet
```bash
curl -X POST http://localhost:3000/api/wallets \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "123e4567-e89b-12d3-a456-426614174000",
    "address": "t1abc123def456ghi789jkl012mno345pqr",
    "privacy_mode": "private",
    "description": "Main project wallet"
  }'
```

### List Project Wallets
```bash
curl -X GET "http://localhost:3000/api/wallets?project_id=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <jwt_token>"
```

### Update Privacy Mode
```bash
curl -X PUT http://localhost:3000/api/wallets/456e7890-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "privacy_mode": "monetizable"
  }'
```

### Validate Address
```bash
curl -X POST http://localhost:3000/api/wallets/validate \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "t1abc123def456ghi789jkl012mno345pqr",
    "network": "mainnet"
  }'
```

## Related Documentation

- [Wallet Management Implementation](./WALLET_MANAGEMENT_IMPLEMENTATION.md)
- [Authentication Setup](./AUTHENTICATION_SETUP.md)
- [Project API Implementation](./PROJECT_API_IMPLEMENTATION.md)
- [Zcash Address Utilities](../src/utils/zcashAddress.js)

## Requirements Coverage

This API implementation satisfies the following requirements from the fullstack integration spec:

- **Requirement 5.1**: Wallet address validation and storage
- **Requirement 5.2**: Automatic wallet type detection
- **Requirement 5.3**: Privacy mode persistence
- **Requirement 5.5**: Wallet details display

## Testing

Run the wallet endpoint tests:
```bash
node backend/tests/test-wallet-endpoints.js
```

Verify API structure:
```bash
node backend/tests/verify-wallet-api-structure.js
```
