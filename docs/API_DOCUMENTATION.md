# Boardling API Documentation

## Overview

The Boardling API is a RESTful API that provides comprehensive wallet analytics for Zcash-based Web3 projects. All endpoints require JWT authentication unless otherwise specified.

**Base URL**: `http://localhost:3000` (development) or your production domain

**Authentication**: Bearer token in Authorization header
```
Authorization: Bearer <your-jwt-token>
```

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Project Management](#project-management)
3. [Wallet Management](#wallet-management)
4. [Analytics Endpoints](#analytics-endpoints)
5. [Subscription Management](#subscription-management)
6. [Payment Processing](#payment-processing)
7. [User Management](#user-management)
8. [Error Responses](#error-responses)

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint**: `POST /auth/register`

**Authentication**: None required

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "company": "Acme Corp" // optional
}
```

**Response** (201 Created):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Validation Rules**:
- Email must be valid format
- Password minimum 8 characters
- Name is required

**Error Responses**:
- `400`: Validation error
- `409`: Email already exists

---

### Login

Authenticate and receive JWT token.

**Endpoint**: `POST /auth/login`

**Authentication**: None required

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "subscription_status": "free",
    "onboarding_completed": false
  }
}
```

**Error Responses**:
- `401`: Invalid credentials
- `400`: Missing email or password

---

### Logout

Invalidate current session (client-side token removal).

**Endpoint**: `POST /auth/logout`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

### Change Password

Update user password.

**Endpoint**: `POST /auth/change-password`

**Authentication**: Required

**Request Body**:
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Response** (200 OK):
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses**:
- `401`: Current password incorrect
- `400`: New password validation failed

---

## Project Management

### Create Project

Create a new analytics project.

**Endpoint**: `POST /api/projects`

**Authentication**: Required

**Request Body**:
```json
{
  "name": "My DeFi Project",
  "description": "A decentralized finance application",
  "category": "defi",
  "website_url": "https://myproject.com",
  "github_url": "https://github.com/myorg/myproject"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "My DeFi Project",
  "description": "A decentralized finance application",
  "category": "defi",
  "status": "active",
  "website_url": "https://myproject.com",
  "github_url": "https://github.com/myorg/myproject",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Categories**: `defi`, `social_fi`, `gamefi`, `nft`, `infrastructure`, `governance`, `cefi`, `metaverse`, `dao`, `identity`, `storage`, `ai_ml`, `other`

---

### List Projects

Get all projects for authenticated user.

**Endpoint**: `GET /api/projects`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "My DeFi Project",
      "category": "defi",
      "status": "active",
      "wallet_count": 5,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Get Project Details

Get detailed information about a specific project.

**Endpoint**: `GET /api/projects/:id`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "My DeFi Project",
  "description": "A decentralized finance application",
  "category": "defi",
  "status": "active",
  "website_url": "https://myproject.com",
  "wallet_count": 5,
  "total_volume": "1234.56",
  "active_wallets": 3,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### Update Project

Update project information.

**Endpoint**: `PUT /api/projects/:id`

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "active"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "active",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

---

### Delete Project

Delete a project and all associated data.

**Endpoint**: `DELETE /api/projects/:id`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Project deleted successfully"
}
```

---

## Wallet Management

### Add Wallet

Add a Zcash wallet address to a project.

**Endpoint**: `POST /api/wallets`

**Authentication**: Required

**Request Body**:
```json
{
  "project_id": "uuid",
  "address": "t1abc123...",
  "privacy_mode": "private",
  "description": "Main treasury wallet"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "address": "t1abc123...",
  "type": "t",
  "privacy_mode": "private",
  "description": "Main treasury wallet",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Privacy Modes**: `private`, `public`, `monetizable`

**Wallet Types**: `t` (transparent), `z` (shielded), `u` (unified)

---

### Validate Address

Validate a Zcash address format.

**Endpoint**: `POST /api/wallets/validate`

**Authentication**: Required

**Request Body**:
```json
{
  "address": "t1abc123..."
}
```

**Response** (200 OK):
```json
{
  "valid": true,
  "type": "t",
  "network": "mainnet"
}
```

---

### List Wallets

Get all wallets for a project.

**Endpoint**: `GET /api/wallets?project_id=uuid`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "wallets": [
    {
      "id": "uuid",
      "address": "t1abc123...",
      "type": "t",
      "privacy_mode": "private",
      "transaction_count": 150,
      "total_volume": "1234.56",
      "last_activity": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Update Wallet

Update wallet settings (primarily privacy mode).

**Endpoint**: `PUT /api/wallets/:id`

**Authentication**: Required

**Request Body**:
```json
{
  "privacy_mode": "monetizable",
  "description": "Updated description"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "privacy_mode": "monetizable",
  "description": "Updated description",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

---

### Delete Wallet

Remove a wallet from tracking.

**Endpoint**: `DELETE /api/wallets/:id`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Wallet removed successfully"
}
```

---

## Analytics Endpoints

### Dashboard Metrics

Get aggregated metrics for dashboard overview.

**Endpoint**: `GET /api/analytics/dashboard/:projectId`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "total_wallets": 10,
  "active_wallets": 7,
  "total_transactions": 1500,
  "total_volume_zec": "12345.67",
  "avg_transaction_value": "8.23",
  "growth_rate": 15.5,
  "period": "30d"
}
```

---

### Adoption Funnel

Get adoption stage progression data.

**Endpoint**: `GET /api/analytics/adoption/:projectId`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "funnel": [
    {
      "stage": "created",
      "count": 100,
      "percentage": 100
    },
    {
      "stage": "first_tx",
      "count": 85,
      "percentage": 85,
      "conversion_rate": 85
    },
    {
      "stage": "feature_usage",
      "count": 60,
      "percentage": 60,
      "conversion_rate": 70.6
    }
  ],
  "avg_time_to_convert": {
    "first_tx": 2.5,
    "feature_usage": 5.2,
    "recurring": 12.8
  }
}
```

---

### Transaction Analytics

Get detailed transaction data and patterns.

**Endpoint**: `GET /api/analytics/transactions/:projectId`

**Authentication**: Required

**Query Parameters**:
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset
- `start_date`: Filter by start date
- `end_date`: Filter by end date

**Response** (200 OK):
```json
{
  "transactions": [
    {
      "wallet_id": "uuid",
      "date": "2024-01-01",
      "transaction_count": 15,
      "volume_zec": "123.45",
      "transfers": 10,
      "swaps": 3,
      "bridges": 2
    }
  ],
  "total": 1500,
  "page": 1
}
```

---

### Retention Cohorts

Get cohort analysis and retention rates.

**Endpoint**: `GET /api/analytics/retention/:projectId`

**Authentication**: Required

**Query Parameters**:
- `cohort_type`: `weekly` or `monthly`

**Response** (200 OK):
```json
{
  "cohorts": [
    {
      "cohort_period": "2024-01",
      "wallet_count": 50,
      "retention_week_1": 85.0,
      "retention_week_2": 72.0,
      "retention_week_3": 65.0,
      "retention_week_4": 58.0
    }
  ]
}
```

---

### Productivity Scores

Get wallet productivity scores and health indicators.

**Endpoint**: `GET /api/analytics/productivity/:projectId`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "scores": [
    {
      "wallet_id": "uuid",
      "total_score": 85,
      "retention_score": 90,
      "adoption_score": 80,
      "activity_score": 85,
      "diversity_score": 85,
      "status": "healthy",
      "risk_level": "low"
    }
  ],
  "avg_score": 78.5
}
```

---

### Shielded Analytics

Get shielded transaction analytics.

**Endpoint**: `GET /api/analytics/shielded/:projectId`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "total_shielded": 450,
  "shielded_volume": "5678.90",
  "privacy_usage_rate": 30.0,
  "shielded_vs_transparent": {
    "shielded": 450,
    "transparent": 1050
  }
}
```

---

### Wallet Segments

Get wallet segmentation data.

**Endpoint**: `GET /api/analytics/segments/:projectId`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "segments": [
    {
      "name": "Power Users",
      "count": 15,
      "avg_transactions": 150,
      "avg_volume": "1234.56"
    },
    {
      "name": "Casual Users",
      "count": 45,
      "avg_transactions": 25,
      "avg_volume": "123.45"
    }
  ]
}
```

---

### Project Health

Get overall project health indicators.

**Endpoint**: `GET /api/analytics/health/:projectId`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "health_score": 85,
  "indicators": {
    "user_growth": "positive",
    "retention_rate": 72.5,
    "transaction_volume_trend": "increasing",
    "active_user_percentage": 70.0
  },
  "alerts": [],
  "recommendations": [
    "Consider engagement campaign for dormant users"
  ]
}
```

---

### Competitive Comparison

Get competitive benchmarking data (privacy-gated).

**Endpoint**: `GET /api/analytics/comparison/:projectId`

**Authentication**: Required

**Access**: Requires public or monetizable privacy mode

**Response** (200 OK):
```json
{
  "your_metrics": {
    "retention_rate": 72.5,
    "avg_transaction_value": "8.23"
  },
  "industry_benchmarks": {
    "retention_rate": 65.0,
    "avg_transaction_value": "10.50"
  },
  "percentile_rank": 75
}
```

---

## Subscription Management

### Get Subscription Status

Get current subscription information.

**Endpoint**: `GET /api/subscriptions/status`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "status": "free",
  "expires_at": "2024-02-01T00:00:00Z",
  "days_remaining": 15,
  "features": {
    "max_wallets": 5,
    "analytics_access": true,
    "api_access": false
  }
}
```

---

### Upgrade Subscription

Initiate subscription upgrade.

**Endpoint**: `POST /api/subscriptions/upgrade`

**Authentication**: Required

**Request Body**:
```json
{
  "plan": "premium"
}
```

**Response** (200 OK):
```json
{
  "invoice_id": "uuid",
  "amount_zec": 0.1,
  "payment_address": "t1xyz...",
  "qr_code": "data:image/png;base64,..."
}
```

---

## Payment Processing

### Create Invoice

Create a payment invoice.

**Endpoint**: `POST /api/payments/invoice`

**Authentication**: Required

**Request Body**:
```json
{
  "type": "subscription",
  "amount_zec": 0.1,
  "item_id": "premium-plan"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "type": "subscription",
  "amount_zec": 0.1,
  "payment_address": "t1xyz...",
  "address_type": "transparent",
  "status": "pending",
  "qr_code": "data:image/png;base64,...",
  "expires_at": "2024-01-02T00:00:00Z"
}
```

---

### Check Payment Status

Check if an invoice has been paid.

**Endpoint**: `POST /api/payments/check/:id`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "status": "paid",
  "paid_amount_zec": 0.1,
  "paid_txid": "abc123...",
  "paid_at": "2024-01-01T12:00:00Z"
}
```

---

### Get Balance

Get user's current ZEC balance from data monetization.

**Endpoint**: `GET /api/payments/balance`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "balance_zec": 1.5,
  "pending_zec": 0.2,
  "total_earned": 2.0
}
```

---

### Request Withdrawal

Request withdrawal of earnings.

**Endpoint**: `POST /api/payments/withdraw`

**Authentication**: Required

**Request Body**:
```json
{
  "amount_zec": 1.0,
  "to_address": "t1abc..."
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "amount_zec": 1.0,
  "fee_zec": 0.02,
  "net_zec": 0.98,
  "to_address": "t1abc...",
  "status": "pending",
  "requested_at": "2024-01-01T00:00:00Z"
}
```

---

### List Withdrawals

Get withdrawal history.

**Endpoint**: `GET /api/payments/withdrawals`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "withdrawals": [
    {
      "id": "uuid",
      "amount_zec": 1.0,
      "net_zec": 0.98,
      "status": "sent",
      "txid": "xyz789...",
      "requested_at": "2024-01-01T00:00:00Z",
      "processed_at": "2024-01-01T01:00:00Z"
    }
  ]
}
```

---

## User Management

### Get User Profile

Get current user information.

**Endpoint**: `GET /api/users/profile`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Corp",
  "subscription_status": "premium",
  "balance_zec": 1.5,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### Update Profile

Update user profile information.

**Endpoint**: `PUT /api/users/profile`

**Authentication**: Required

**Request Body**:
```json
{
  "name": "John Smith",
  "company": "New Corp"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "John Smith",
  "company": "New Corp",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `AUTH_INVALID` | 401 | Invalid credentials |
| `AUTH_EXPIRED` | 401 | Token expired |
| `PERMISSION_DENIED` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Resource already exists |
| `INSUFFICIENT_BALANCE` | 400 | Not enough funds |
| `PAYMENT_REQUIRED` | 402 | Payment required |
| `SUBSCRIPTION_EXPIRED` | 403 | Subscription expired |
| `PRIVACY_RESTRICTED` | 403 | Privacy settings restrict access |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated requests**: 100 requests per minute
- **Unauthenticated requests**: 20 requests per minute

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Pagination

List endpoints support pagination with these query parameters:

- `limit`: Number of results per page (default: 50, max: 100)
- `offset`: Number of results to skip

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "total": 500,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

## Webhooks (Future)

Webhook support is planned for real-time notifications:

- Payment received
- Subscription expired
- Wallet activity detected
- Analytics threshold reached

---

## Support

For API support and questions:
- Email: support@boardling.com
- Documentation: https://docs.boardling.com
- Status Page: https://status.boardling.com
