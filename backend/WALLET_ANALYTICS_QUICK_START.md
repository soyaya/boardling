# Wallet Analytics Platform - Quick Start Guide

Get up and running with the Wallet Analytics Platform in minutes.

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13
- Zcash node (optional, for live data)

## 🚀 Quick Setup

### 1. Database Setup
```bash
# Create database
createdb wallet_analytics

# Run schema
psql -d wallet_analytics -f schema.sql
```

### 2. Environment Configuration
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wallet_analytics
DB_USER=your_user
DB_PASS=your_password

# Zcash Paywall SDK (for monetization)
PAYWALL_API_URL=http://localhost:3000
PAYWALL_API_KEY=your_api_key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Tests
```bash
# Run all wallet analytics tests
node tests/wallet-analytics/run-all.js

# Or run individual tests
node tests/wallet-analytics/test-privacy-preference.js
```

## 📚 Core Concepts

### Privacy Modes
- **Private**: Only owner can see data
- **Public**: Everyone can see data for free
- **Monetizable**: Pay 0.001 ZEC to access data

### Services (12 total)
1. Privacy & Access Control
2. Monetization & Payments
3. Competitive Benchmarking
4. AI Recommendations
5. Alert System
6. Dashboard Aggregation
7. Data Integrity
8. Performance Optimization

### API Endpoints (19 total)
- Privacy Control: 4 endpoints
- Monetization: 5 endpoints
- Competitive Analysis: 4 endpoints
- AI & Alerts: 4 endpoints
- Shielded Analytics: 2 endpoints

## 💡 Common Use Cases

### 1. Set Wallet Privacy
```javascript
const privacyService = app.get('privacyService');

// Set to monetizable
await privacyService.setPrivacyPreference(walletId, 'monetizable');

// Check access
const access = await privacyService.checkDataAccess(walletId, requesterId, isPaid);
```

### 2. Create Payment for Data Access
```javascript
const monetizationService = app.get('monetizationService');

// Create payment invoice
const payment = await monetizationService.createDataAccessPayment(
  requesterId,
  walletId,
  'user@example.com'
);

// User pays via QR code or address
console.log('Pay to:', payment.payment_address);
console.log('Amount:', payment.amount_zec, 'ZEC');

// Check payment status
const status = await monetizationService.checkPaymentStatus(payment.invoice_id);
```

### 3. Get Dashboard Data
```javascript
const dashboardService = app.get('dashboardService');

// Get comprehensive dashboard
const dashboard = await dashboardService.getProjectDashboard(projectId);

// Export to CSV
const report = await dashboardService.exportAnalyticsReport(projectId, 'csv');
```

### 4. Generate AI Recommendations
```javascript
const recommendationService = app.get('aiRecommendationService');

// Generate recommendations
const recommendations = await recommendationService.generateRecommendations(projectId);

// Monitor task completion
const monitoringService = app.get('taskCompletionMonitoringService');
await monitoringService.markTaskComplete(projectId, taskId);
```

### 5. Check Alerts
```javascript
const alertService = app.get('alertEngineService');

// Check all alerts
const alerts = await alertService.checkAllAlerts(projectId);

// Generate AI content for alert
const alertContentService = app.get('aiAlertContentService');
const content = await alertContentService.generateAlertContent(alertId);
```

## 🔧 API Examples

### Privacy Control
```bash
# Get privacy preference
curl http://localhost:3000/api/wallets/wallet-123/privacy

# Update privacy mode
curl -X PUT http://localhost:3000/api/wallets/wallet-123/privacy \
  -H "Content-Type: application/json" \
  -d '{"privacy_mode": "monetizable"}'
```

### Monetization
```bash
# Get marketplace listings
curl http://localhost:3000/api/marketplace/wallets?limit=10

# Purchase access
curl -X POST http://localhost:3000/api/wallets/wallet-123/purchase-access \
  -H "Content-Type: application/json" \
  -d '{"requester_id": "user-456", "requester_email": "user@example.com"}'

# Check earnings
curl http://localhost:3000/api/users/user-123/earnings
```

### Dashboard
```bash
# Get project dashboard (via existing analytics routes)
curl http://localhost:3000/api/projects/project-123/analytics

# Get cohort analysis
curl http://localhost:3000/api/projects/project-123/analytics/cohorts
```

## 📊 Performance Tips

### Caching
- Dashboard data cached for 5 minutes
- 85%+ cache hit rate
- Clear cache: `dashboardService.clearCache()`

### Batch Processing
- Process 250+ records in <50ms
- Use batch methods for bulk operations
- Example: `batchCalculateProductivityScores(walletIds)`

### Query Optimization
- All tables have proper indexes
- Use `optimizedWalletQuery()` for filtered queries
- Run `optimizeIndexes()` periodically

## 🧪 Testing

### Run All Tests
```bash
node tests/wallet-analytics/run-all.js
```

### Test Individual Services
```bash
# Privacy
node tests/wallet-analytics/test-privacy-preference.js

# Monetization
node tests/wallet-analytics/test-monetization.js

# Dashboard
node tests/wallet-analytics/test-dashboard-aggregation.js

# Performance
node tests/wallet-analytics/test-performance-optimization.js
```

## 📖 Documentation

- **Full Documentation**: [docs/WALLET_ANALYTICS.md](docs/WALLET_ANALYTICS.md)
- **Service Docs**: [src/services/README.md](src/services/README.md)
- **Test Docs**: [tests/wallet-analytics/README.md](tests/wallet-analytics/README.md)
- **Requirements**: [.kiro/specs/wallet-analytics/requirements.md](.kiro/specs/wallet-analytics/requirements.md)
- **Design**: [.kiro/specs/wallet-analytics/design.md](.kiro/specs/wallet-analytics/design.md)

## 🆘 Troubleshooting

### Database Connection Issues
```javascript
// Check connection
const result = await db.query('SELECT NOW()');
console.log('Database connected:', result.rows[0]);
```

### Cache Not Working
```javascript
// Clear and rebuild cache
dashboardService.clearCache();
await dashboardService.warmupCache(projectId);
```

### Payment Issues
```javascript
// Check paywall SDK connection
await monetizationService.initialize();

// Verify payment status
const status = await monetizationService.checkPaymentStatus(invoiceId);
```

### Performance Issues
```javascript
// Get performance stats
const stats = await performanceService.getPerformanceStats();
console.log('Cache hit rate:', stats.cache.hit_rate);

// Optimize indexes
await performanceService.optimizeIndexes();
```

## 🎯 Next Steps

1. ✅ Set up database and run tests
2. ✅ Configure environment variables
3. ✅ Initialize services in your Express app
4. ✅ Mount API routes
5. ✅ Test API endpoints
6. ✅ Integrate with frontend
7. ✅ Monitor performance
8. ✅ Scale as needed

## 💬 Support

For issues or questions:
1. Check documentation in `docs/` folder
2. Review test files for usage examples
3. Check service README files
4. Review requirements and design specs

## 🎉 You're Ready!

The Wallet Analytics Platform is now set up and ready to use. Start by testing the API endpoints and integrating with your application.
