# Wallet Analytics Platform - Services

Comprehensive service layer for the Wallet Analytics Platform.

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Routes)                        │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Privacy    │  │ Monetization │  │  Dashboard   │     │
│  │   Services   │  │   Services   │  │   Services   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Competitive  │  │      AI      │  │     Data     │     │
│  │   Analysis   │  │ Recommenda-  │  │  Integrity   │     │
│  │   Services   │  │    tions     │  │   Services   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer (PostgreSQL)                   │
└─────────────────────────────────────────────────────────────┘
```

## Core Services

### Privacy & Access Control

#### `privacyPreferenceService.js`
Manages wallet privacy settings and data access control.

**Features:**
- Three privacy modes: private, public, monetizable
- Immediate enforcement of privacy changes
- Data anonymization for non-owners
- Project-level privacy statistics
- Access control validation

**Key Methods:**
- `setPrivacyPreference(walletId, privacyMode)` - Update privacy mode
- `getPrivacyPreference(walletId)` - Get current privacy settings
- `checkDataAccess(walletId, requesterId, isPaid)` - Validate access
- `getWalletData(walletId, dataLevel)` - Get data based on access level

**Requirements:** 8.1, 8.5

---

### Monetization & Payments

#### `monetizationService.js`
Handles payment processing and earnings distribution via Zcash.

**Features:**
- Zcash-paywall-SDK integration
- Pay-per-analytics access (0.001 ZEC per wallet)
- Automatic earnings distribution (70% owner, 30% platform)
- Withdrawal processing
- Marketplace listing

**Key Methods:**
- `createDataAccessPayment(requesterId, walletId, email)` - Create payment invoice
- `checkPaymentStatus(invoiceId)` - Verify payment completion
- `getOwnerEarnings(userId)` - Get earnings summary
- `requestWithdrawal(userId, toAddress, amountZec)` - Process withdrawal
- `getMarketplaceListing(filters)` - Get monetizable wallets

**Requirements:** 8.2, 8.3, 8.4

---

### Competitive Analysis

#### `benchmarkService.js`
Manages competitive benchmark data and percentile calculations.

**Features:**
- Store benchmark data by category
- Calculate percentile distributions (25th, 50th, 75th, 90th)
- Track sample sizes
- Historical benchmark tracking

**Key Methods:**
- `storeBenchmark(category, metricType, values)` - Store benchmark data
- `getBenchmarks(category)` - Retrieve benchmarks
- `calculatePercentiles(values)` - Calculate percentile distribution

**Requirements:** 6.1

#### `projectComparisonService.js`
Enables side-by-side project comparisons against market benchmarks.

**Features:**
- Compare project metrics to market averages
- Identify performance gaps
- Track competitive position over time
- Generate comparison reports

**Key Methods:**
- `compareToMarket(projectId, category)` - Compare to benchmarks
- `identifyGaps(projectMetrics, benchmarks)` - Find performance gaps
- `trackPosition(projectId)` - Monitor market position

**Requirements:** 6.2, 6.3, 6.4

#### `competitiveInsightsService.js`
Generates strategic insights based on competitive analysis.

**Features:**
- Pattern recognition in high-performing projects
- Actionable recommendations
- Trend analysis
- Strategic positioning advice

**Key Methods:**
- `generateInsights(projectId)` - Create competitive insights
- `analyzePatterns(comparisons)` - Identify success patterns
- `generateRecommendations(gaps)` - Create action items

**Requirements:** 6.5

---

### AI & Recommendations

#### `aiRecommendationService.js`
Generates AI-driven task recommendations based on declining metrics.

**Features:**
- Automatic recommendation generation
- Priority scoring (1-10 scale)
- Recommendation types: marketing, onboarding, feature enhancement
- Action item generation

**Key Methods:**
- `generateRecommendations(projectId)` - Create recommendations
- `prioritizeRecommendations(recommendations)` - Score by priority
- `generateActionItems(recommendation)` - Create specific tasks

**Requirements:** 4.2

#### `taskCompletionMonitoringService.js`
Monitors on-chain activity to detect task completion.

**Features:**
- Track activity changes
- Detect task effectiveness
- Update productivity scores
- Measure recommendation impact

**Key Methods:**
- `monitorTaskCompletion(projectId, taskId)` - Check completion
- `detectEffectiveness(beforeMetrics, afterMetrics)` - Measure impact
- `markTaskComplete(taskId)` - Update task status

**Requirements:** 4.3, 4.4

---

### Alerts & Notifications

#### `alertEngineService.js`
Threshold-based alert detection system.

**Features:**
- Retention drop detection
- Churn risk identification
- Funnel performance monitoring
- Shielded activity spike detection
- Configurable thresholds

**Key Methods:**
- `checkAllAlerts(projectId)` - Run all alert checks
- `checkRetentionDrop(projectId)` - Detect retention issues
- `checkChurnRisk(projectId)` - Identify at-risk wallets
- `checkFunnelPerformance(projectId)` - Monitor conversion rates

**Requirements:** 7.1, 7.2, 7.3, 7.4

#### `aiAlertContentService.js`
Generates AI-powered alert content with actionable suggestions.

**Features:**
- Context-aware suggestions
- Specific action items
- Priority indicators
- Clear next steps

**Key Methods:**
- `generateAlertContent(alertId)` - Create alert content
- `generateSuggestions(alertType, context)` - Create suggestions
- `generateActionItems(alert)` - Create action list

**Requirements:** 7.5

---

### Dashboard & Aggregation

#### `dashboardAggregationService.js`
Aggregates data from multiple services for dashboard display.

**Features:**
- Comprehensive dashboard data
- Intelligent caching (5-min TTL)
- Export functionality (JSON/CSV)
- Time-series data for charts
- Cross-project health monitoring

**Key Methods:**
- `getProjectDashboard(projectId)` - Get full dashboard
- `getWalletHealthDashboard(filters)` - Cross-project health
- `exportAnalyticsReport(projectId, format)` - Export data
- `getTimeSeriesData(projectId, metric, days)` - Chart data

**Requirements:** All visualization requirements

---

### Data Management

#### `dataIntegrityService.js`
Enforces data validation and referential integrity.

**Features:**
- Comprehensive validation rules
- Duplicate detection
- Referential integrity checks
- Orphaned record cleanup
- Data consistency verification

**Key Methods:**
- `validateWallet(walletData)` - Validate wallet data
- `validateActivityMetrics(metricsData)` - Validate metrics
- `validateProductivityScore(scoreData)` - Validate scores
- `verifyWalletIntegrity(walletId)` - Check integrity
- `cleanupOrphanedRecords(projectId)` - Remove orphans

**Requirements:** 9.3

#### `performanceOptimizationService.js`
Implements caching, batch processing, and query optimization.

**Features:**
- Intelligent query caching
- Batch processing (100+ records)
- Index optimization
- Performance monitoring
- Cache warmup

**Key Methods:**
- `cachedQuery(cacheKey, queryFn, ttl)` - Execute with cache
- `batchCalculateProductivityScores(walletIds)` - Batch process
- `optimizedWalletQuery(projectId, filters)` - Optimized queries
- `optimizeIndexes()` - Database optimization
- `getPerformanceStats()` - Performance metrics

**Requirements:** Performance-related aspects

---

## Service Integration

### Initialization Example

```javascript
import PrivacyPreferenceService from './services/privacyPreferenceService.js';
import MonetizationService from './services/monetizationService.js';
import DashboardAggregationService from './services/dashboardAggregationService.js';

// Initialize services
const privacyService = new PrivacyPreferenceService(db);
const monetizationService = new MonetizationService(db, paywallConfig);
const dashboardService = new DashboardAggregationService(db, {
  alertEngine: alertService,
  aiRecommendation: recommendationService
});

// Register with Express app
app.set('privacyService', privacyService);
app.set('monetizationService', monetizationService);
app.set('dashboardService', dashboardService);
```

### Service Dependencies

```
dashboardAggregationService
  ├── alertEngineService
  ├── aiRecommendationService
  └── database

monetizationService
  ├── zcash-paywall-sdk
  └── database

All other services
  └── database
```

## Error Handling

All services follow consistent error handling patterns:

```javascript
try {
  const result = await service.method(params);
  return { success: true, data: result };
} catch (error) {
  return { success: false, error: error.message };
}
```

## Performance Characteristics

- **Cache Hit Rate**: 85%+
- **Batch Processing**: 250+ records in <50ms
- **Query Response**: <100ms for cached queries
- **API Response**: <200ms average

## Testing

Each service has comprehensive test coverage in `tests/wallet-analytics/`.

Run all tests:
```bash
node tests/wallet-analytics/run-all.js
```

## Contributing

When adding new services:
1. Follow existing service patterns
2. Include comprehensive JSDoc comments
3. Implement error handling
4. Create corresponding tests
5. Update this documentation
