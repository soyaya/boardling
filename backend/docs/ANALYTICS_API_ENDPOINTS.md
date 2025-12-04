# Analytics API Endpoints Documentation

## Overview

This document describes the analytics API endpoints implemented for the fullstack integration (Task 19). These endpoints provide comprehensive analytics data for wallet tracking, user behavior analysis, and project health monitoring.

## Authentication

All analytics endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Dashboard Analytics

**Endpoint:** `GET /api/analytics/dashboard/:projectId`

**Description:** Get comprehensive dashboard metrics with caching and privacy filtering.

**Requirements:** 7.1

**Parameters:**
- `projectId` (path, required): UUID of the project

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": "uuid",
    "project_name": "Project Name",
    "overview": {
      "total_wallets": 100,
      "active_wallets": 75,
      "total_transactions": 1500,
      "total_volume_zec": 1234.56,
      "avg_productivity_score": 78.5
    },
    "productivity": {
      "avg_total_score": 78.5,
      "avg_retention_score": 82.0,
      "avg_adoption_score": 75.0,
      "avg_activity_score": 80.0,
      "at_risk_wallets": 10,
      "churn_wallets": 5
    },
    "privacy_note": "2 private wallet(s) excluded from aggregated metrics"
  }
}
```

---

### 2. Adoption Funnel Analytics

**Endpoint:** `GET /api/analytics/adoption/:projectId`

**Description:** Get adoption funnel analytics showing wallet progression through adoption stages.

**Requirements:** 7.2

**Parameters:**
- `projectId` (path, required): UUID of the project

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": "uuid",
    "project_name": "Project Name",
    "adoption_funnel": {
      "stages": [
        {
          "stage_name": "created",
          "wallet_count": 100,
          "percentage": 100
        },
        {
          "stage_name": "first_tx",
          "wallet_count": 85,
          "percentage": 85
        },
        {
          "stage_name": "feature_usage",
          "wallet_count": 70,
          "percentage": 70
        },
        {
          "stage_name": "recurring",
          "wallet_count": 50,
          "percentage": 50
        },
        {
          "stage_name": "high_value",
          "wallet_count": 25,
          "percentage": 25
        }
      ],
      "conversion_rates": {
        "created_to_first_tx": 85.0,
        "first_tx_to_feature_usage": 82.4,
        "feature_usage_to_recurring": 71.4,
        "recurring_to_high_value": 50.0
      }
    }
  }
}
```

---

### 3. Retention Cohort Analytics

**Endpoint:** `GET /api/analytics/retention/:projectId`

**Description:** Get retention cohort analytics with heatmap and trend data.

**Requirements:** 7.4

**Parameters:**
- `projectId` (path, required): UUID of the project
- `cohortType` (query, optional): Type of cohort ('weekly' or 'monthly', default: 'weekly')
- `limit` (query, optional): Number of cohorts to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": "uuid",
    "project_name": "Project Name",
    "cohort_type": "weekly",
    "heatmap_data": [
      {
        "cohort_period": "2024-01-01",
        "new_users": 50,
        "week_1": 85.0,
        "week_2": 72.0,
        "week_3": 65.0,
        "week_4": 60.0
      }
    ],
    "trend_analysis": {
      "trends": [...],
      "analysis": {
        "recent_avg_retention": 75.5,
        "older_avg_retention": 68.2,
        "trend_direction": "improving",
        "trend_magnitude": 7.3,
        "periods_analyzed": 10
      }
    }
  }
}
```

---

### 4. Productivity Analytics

**Endpoint:** `GET /api/analytics/productivity/:projectId`

**Description:** Get productivity scores and task completion metrics.

**Requirements:** 7.5

**Parameters:**
- `projectId` (path, required): UUID of the project

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": "uuid",
    "project_name": "Project Name",
    "productivity": {
      "average_score": 78.5,
      "total_wallets": 100,
      "healthy_wallets": 70,
      "at_risk_wallets": 20,
      "churned_wallets": 10,
      "score_distribution": {
        "excellent": 25,
        "good": 45,
        "fair": 20,
        "poor": 10
      },
      "avg_retention_score": 82.0,
      "avg_adoption_score": 75.0,
      "avg_activity_score": 80.0
    }
  }
}
```

---

### 5. Shielded Pool Analytics

**Endpoint:** `GET /api/analytics/shielded/:projectId`

**Description:** Get shielded transaction analytics and privacy metrics.

**Requirements:** 7.6

**Parameters:**
- `projectId` (path, required): UUID of the project
- `days` (query, optional): Number of days to analyze (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": "uuid",
    "project_name": "Project Name",
    "time_period_days": 30,
    "shielded_metrics": [
      {
        "date": "2024-01-01",
        "active_shielded_wallets": 25,
        "avg_privacy_score": 75.5,
        "total_shielded_transactions": 150,
        "total_shielding_transactions": 50,
        "total_deshielding_transactions": 45,
        "total_internal_shielded": 55,
        "total_shielded_volume": 1234567890
      }
    ],
    "shielded_vs_transparent_comparison": {
      "analysis_period": {
        "start_date": "2023-12-01",
        "end_date": "2024-01-01",
        "days": 30
      },
      "shielded_users": {
        "count": 25,
        "metrics": {...},
        "retention": {...}
      },
      "transparent_users": {
        "count": 75,
        "metrics": {...},
        "retention": {...}
      },
      "comparison_insights": [...]
    }
  }
}
```

---

### 6. Wallet Segmentation Analytics

**Endpoint:** `GET /api/analytics/segments/:projectId`

**Description:** Get wallet segmentation data grouped by behavior patterns.

**Requirements:** 7.7

**Parameters:**
- `projectId` (path, required): UUID of the project

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": "uuid",
    "project_name": "Project Name",
    "segments": [
      {
        "status": "healthy",
        "risk_level": "low",
        "wallet_count": 70,
        "avg_score": 85.5,
        "avg_retention": 88.0,
        "avg_adoption": 82.0,
        "avg_activity": 86.5
      },
      {
        "status": "at_risk",
        "risk_level": "medium",
        "wallet_count": 20,
        "avg_score": 55.2,
        "avg_retention": 58.0,
        "avg_adoption": 52.0,
        "avg_activity": 56.0
      },
      {
        "status": "churn",
        "risk_level": "high",
        "wallet_count": 10,
        "avg_score": 25.8,
        "avg_retention": 20.0,
        "avg_adoption": 28.0,
        "avg_activity": 29.5
      }
    ]
  }
}
```

---

### 7. Project Health Analytics

**Endpoint:** `GET /api/analytics/health/:projectId`

**Description:** Get overall project health indicators and scores.

**Requirements:** 7.8

**Parameters:**
- `projectId` (path, required): UUID of the project

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": "uuid",
    "project_name": "Project Name",
    "health_score": 78,
    "health_status": "good",
    "health_indicators": {
      "total_wallets": 100,
      "active_wallets": 75,
      "active_wallet_percentage": 75.0,
      "healthy_wallets": 70,
      "at_risk_wallets": 20,
      "churned_wallets": 10,
      "churn_rate": 10.0,
      "avg_productivity_score": 78.5,
      "total_transactions": 1500,
      "total_active_days": 2500
    }
  }
}
```

**Health Status Values:**
- `excellent`: Score >= 80
- `good`: Score >= 60
- `fair`: Score >= 40
- `poor`: Score >= 20
- `critical`: Score < 20

---

### 8. Competitive Comparison Analytics (Privacy-Gated)

**Endpoint:** `GET /api/analytics/comparison/:projectId`

**Description:** Get competitive benchmarking data. Requires at least one wallet with public or monetizable privacy mode.

**Requirements:** 7.9

**Parameters:**
- `projectId` (path, required): UUID of the project
- `targetPercentile` (query, optional): Target percentile for comparison ('p25', 'p50', 'p75', 'p90', default: 'p50')

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "project_id": "uuid",
    "project_name": "Project Name",
    "comparison": {
      "category": "defi",
      "target_percentile": "p50",
      "comparisons": {
        "productivity": {
          "current_value": 78.5,
          "benchmark_target": 75.0,
          "gap": 3.5,
          "gap_percentage": 4.67,
          "status": "above_target",
          "percentile_range": "50_75"
        },
        "retention": {...},
        "adoption": {...},
        "churn": {...}
      },
      "performance_gaps": {
        "underperforming": [],
        "outperforming": ["productivity"],
        "at_target": ["retention", "adoption"]
      },
      "recommendations": [...]
    },
    "privacy_note": "Comparison available due to 25 wallet(s) with public/monetizable privacy mode"
  }
}
```

**Response (Privacy Restricted):**
```json
{
  "success": false,
  "error": "PRIVACY_RESTRICTED",
  "message": "Competitive comparison requires at least one wallet with public or monetizable privacy mode",
  "data": {
    "project_id": "uuid",
    "privacy_requirement": "public or monetizable",
    "current_public_wallets": 0
  }
}
```

---

## Error Responses

All endpoints return structured error responses:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {}
}
```

**Common Error Codes:**
- `AUTH_REQUIRED`: Authentication required
- `AUTH_INVALID`: Invalid credentials
- `AUTH_EXPIRED`: Token expired
- `NOT_FOUND`: Resource not found (project, wallet, etc.)
- `PERMISSION_DENIED`: Insufficient permissions
- `PRIVACY_RESTRICTED`: Data access restricted by privacy settings
- `VALIDATION_ERROR`: Input validation failed
- `INTERNAL_ERROR`: Internal server error

---

## Privacy Enforcement

All analytics endpoints respect wallet privacy modes:

- **Private**: Data excluded from all queries and comparisons
- **Public**: Data included in aggregate statistics with anonymization
- **Monetizable**: Data available for purchase by other users

The dashboard and other aggregated endpoints automatically filter out private wallets and include a note about excluded data.

---

## Caching

The dashboard endpoint implements caching for performance:

- Cache duration: 5 minutes
- Cache key format: `dashboard:{projectId}`
- Clear cache: `DELETE /api/analytics/dashboard/:projectId/cache`

---

## Rate Limiting

Analytics endpoints are subject to rate limiting:

- Standard tier: 100 requests per minute
- Premium tier: 500 requests per minute
- Enterprise tier: Unlimited

---

## Examples

### Example 1: Get Dashboard Metrics

```bash
curl -X GET \
  'http://localhost:3000/api/analytics/dashboard/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Authorization: Bearer your-jwt-token'
```

### Example 2: Get Retention Data

```bash
curl -X GET \
  'http://localhost:3000/api/analytics/retention/123e4567-e89b-12d3-a456-426614174000?cohortType=weekly&limit=10' \
  -H 'Authorization: Bearer your-jwt-token'
```

### Example 3: Get Competitive Comparison

```bash
curl -X GET \
  'http://localhost:3000/api/analytics/comparison/123e4567-e89b-12d3-a456-426614174000?targetPercentile=p75' \
  -H 'Authorization: Bearer your-jwt-token'
```

---

## Implementation Notes

1. All endpoints verify project ownership before returning data
2. Privacy filters are applied automatically to all aggregated metrics
3. The comparison endpoint requires explicit privacy mode opt-in
4. Shielded analytics may return empty data if no shielded transactions exist
5. Segmentation data depends on productivity scores being calculated

---

## Related Documentation

- [Dashboard Analytics Implementation](./DASHBOARD_ANALYTICS_IMPLEMENTATION.md)
- [Wallet Management](./WALLET_MANAGEMENT_IMPLEMENTATION.md)
- [Project API](./PROJECT_API_IMPLEMENTATION.md)
- [Authentication Setup](./AUTHENTICATION_SETUP.md)

---

## Task Reference

These endpoints were implemented as part of:
- **Task 19**: Create analytics API endpoints
- **Requirements**: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
- **Spec**: `.kiro/specs/fullstack-integration/`
