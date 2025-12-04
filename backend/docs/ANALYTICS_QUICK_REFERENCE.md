# Analytics API Quick Reference

## Endpoints Summary

| Endpoint | Method | Description | Requirement |
|----------|--------|-------------|-------------|
| `/api/analytics/dashboard/:projectId` | GET | Dashboard metrics with caching | 7.1 |
| `/api/analytics/adoption/:projectId` | GET | Adoption funnel analytics | 7.2 |
| `/api/analytics/retention/:projectId` | GET | Retention cohort analytics | 7.4 |
| `/api/analytics/productivity/:projectId` | GET | Productivity scores | 7.5 |
| `/api/analytics/shielded/:projectId` | GET | Shielded transaction analytics | 7.6 |
| `/api/analytics/segments/:projectId` | GET | Wallet segmentation | 7.7 |
| `/api/analytics/health/:projectId` | GET | Project health indicators | 7.8 |
| `/api/analytics/comparison/:projectId` | GET | Competitive benchmarking (privacy-gated) | 7.9 |

## Quick Examples

### Get Dashboard Metrics
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/analytics/dashboard/$PROJECT_ID
```

### Get Adoption Funnel
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/analytics/adoption/$PROJECT_ID
```

### Get Retention Data
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/analytics/retention/$PROJECT_ID?cohortType=weekly&limit=10"
```

### Get Productivity Metrics
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/analytics/productivity/$PROJECT_ID
```

### Get Shielded Analytics
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/analytics/shielded/$PROJECT_ID?days=30"
```

### Get Wallet Segments
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/analytics/segments/$PROJECT_ID
```

### Get Project Health
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/analytics/health/$PROJECT_ID
```

### Get Competitive Comparison
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/analytics/comparison/$PROJECT_ID?targetPercentile=p50"
```

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (privacy restriction or insufficient permissions) |
| 404 | Not Found (project doesn't exist or doesn't belong to user) |
| 500 | Internal Server Error |

## Privacy Modes

| Mode | Description | Comparison Access |
|------|-------------|-------------------|
| `private` | Data excluded from all queries | ❌ No |
| `public` | Data included in aggregates (anonymized) | ✅ Yes |
| `monetizable` | Data available for purchase | ✅ Yes |

## Health Score Ranges

| Score | Status | Description |
|-------|--------|-------------|
| 80-100 | Excellent | Project is thriving |
| 60-79 | Good | Project is healthy |
| 40-59 | Fair | Some concerns |
| 20-39 | Poor | Needs attention |
| 0-19 | Critical | Immediate action required |

## Common Query Parameters

| Parameter | Endpoints | Default | Description |
|-----------|-----------|---------|-------------|
| `cohortType` | retention | `weekly` | Cohort grouping (weekly/monthly) |
| `limit` | retention | `10` | Number of cohorts to return |
| `days` | shielded | `30` | Time period for analysis |
| `targetPercentile` | comparison | `p50` | Benchmark percentile (p25/p50/p75/p90) |

## Implementation Files

- **Controllers**: `backend/src/controllers/analytics.js`
- **Routes**: `backend/src/routes/analytics.js`
- **Main Router**: `backend/src/routes/index.js`
- **Tests**: `backend/tests/test-analytics-endpoints.js`
- **Docs**: `backend/docs/ANALYTICS_API_ENDPOINTS.md`

## Related Services

- `retentionService.js` - Cohort retention
- `shieldedAnalyzer.js` - Shielded transactions
- `projectComparisonService.js` - Benchmarking
- `productivityScoringService.js` - Productivity
- `adoptionStageService.js` - Adoption funnel
- `dashboardAggregationService.js` - Dashboard data

## Testing

### Verify Routes
```bash
node backend/tests/verify-analytics-routes.js
```

### Run Integration Tests
```bash
# Set environment variables first
export TEST_USER_ID="your-user-uuid"
export TEST_PROJECT_ID="your-project-uuid"
export TEST_AUTH_TOKEN="your-jwt-token"

# Run tests
node backend/tests/test-analytics-endpoints.js
```

## Notes

1. All endpoints require JWT authentication
2. Project ownership is verified for all requests
3. Private wallets are automatically filtered from aggregated metrics
4. Comparison endpoint requires public/monetizable privacy mode
5. Dashboard endpoint includes 5-minute caching
