# Complete User Flow - Wallet Analytics Platform

End-to-end guide showing how a user registers, creates a project, adds wallets, and accesses all analytics.

## 🎯 User Journey Overview

```
User Registration
    ↓
Create Project
    ↓
Add Wallet(s) to Project
    ↓
Set Privacy Preferences
    ↓
View Analytics Dashboard
    ↓
Get AI Recommendations
    ↓
Monitor Alerts
    ↓
Compare with Competitors
    ↓
Monetize Data (Optional)
```

## 📋 Complete Flow with API Calls

### Step 1: User Registration

**Endpoint:** `POST /api/auth/register`

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token-here"
}
```

**Database:**
```sql
-- User created in users table
INSERT INTO users (id, name, email, password_hash)
VALUES ('user-123', 'John Doe', 'john@example.com', 'hashed_password');
```

---

### Step 2: User Login

**Endpoint:** `POST /api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### Step 3: Create Project

**Endpoint:** `POST /api/projects`

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer jwt-token-here" \
  -d '{
    "name": "My DeFi Project",
    "description": "A decentralized finance application",
    "category": "defi",
    "website_url": "https://mydefi.com",
    "github_url": "https://github.com/mydefi/app"
  }'
```

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "project-456",
    "user_id": "user-123",
    "name": "My DeFi Project",
    "description": "A decentralized finance application",
    "category": "defi",
    "status": "active",
    "website_url": "https://mydefi.com",
    "github_url": "https://github.com/mydefi/app",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Database:**
```sql
-- Project created
INSERT INTO projects (id, user_id, name, description, category, status)
VALUES ('project-456', 'user-123', 'My DeFi Project', 'A decentralized finance application', 'defi', 'active');
```

---

### Step 4: Add Wallet to Project

**Endpoint:** `POST /api/projects/:projectId/wallets`

```bash
curl -X POST http://localhost:3000/api/projects/project-456/wallets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer jwt-token-here" \
  -d '{
    "address": "t1Xh8ZGQPqvK3j9mN2pL4rS5tU6vW7xY8zA",
    "type": "t",
    "network": "mainnet",
    "description": "Main treasury wallet",
    "privacy_mode": "private"
  }'
```

**Response:**
```json
{
  "success": true,
  "wallet": {
    "id": "wallet-789",
    "project_id": "project-456",
    "address": "t1Xh8ZGQPqvK3j9mN2pL4rS5tU6vW7xY8zA",
    "type": "t",
    "network": "mainnet",
    "privacy_mode": "private",
    "description": "Main treasury wallet",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Database:**
```sql
-- Wallet created and linked to project
INSERT INTO wallets (id, project_id, address, type, network, privacy_mode, description)
VALUES ('wallet-789', 'project-456', 't1Xh8ZGQPqvK3j9mN2pL4rS5tU6vW7xY8zA', 't', 'mainnet', 'private', 'Main treasury wallet');
```

**What Happens Next:**
- System starts tracking all transactions for this wallet
- Activity metrics begin accumulating
- Cohort assignment happens automatically
- Adoption stage tracking begins

---

### Step 5: View Wallet Privacy Settings

**Endpoint:** `GET /api/wallets/:walletId/privacy`

```bash
curl http://localhost:3000/api/wallets/wallet-789/privacy \
  -H "Authorization: Bearer jwt-token-here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "wallet-789",
    "address": "t1Xh8ZGQPqvK3j9mN2pL4rS5tU6vW7xY8zA",
    "type": "t",
    "privacy_mode": "private",
    "project_id": "project-456",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### Step 6: Update Privacy Settings (Optional)

**Endpoint:** `PUT /api/wallets/:walletId/privacy`

```bash
curl -X PUT http://localhost:3000/api/wallets/wallet-789/privacy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer jwt-token-here" \
  -d '{
    "privacy_mode": "public"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "wallet-789",
    "privacy_mode": "public",
    "updated_at": "2024-01-01T01:00:00Z"
  },
  "message": "Privacy mode updated to public"
}
```

**Privacy Modes:**
- **private**: Only you can see analytics (default)
- **public**: Anyone can see analytics for free
- **monetizable**: Others pay 0.001 ZEC to access analytics

---

### Step 7: Get Project Analytics Dashboard

**Endpoint:** `GET /api/projects/:projectId/analytics`

```bash
curl http://localhost:3000/api/projects/project-456/analytics \
  -H "Authorization: Bearer jwt-token-here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_wallets": 1,
      "active_wallets": 1,
      "total_transactions": 150,
      "total_volume_zec": 10.5,
      "avg_productivity_score": 82.5
    },
    "productivity": {
      "avg_total_score": 82.5,
      "avg_retention_score": 85.0,
      "avg_adoption_score": 80.0,
      "avg_activity_score": 83.0,
      "at_risk_wallets": 0,
      "churn_wallets": 0
    },
    "cohorts": [
      {
        "cohort_type": "weekly",
        "cohort_count": 1,
        "avg_retention_week_1": 100.0,
        "avg_retention_week_2": 90.0,
        "avg_retention_week_4": 85.0
      }
    ],
    "adoption": [
      {
        "stage": "created",
        "wallet_count": 1,
        "avg_time_hours": 0
      },
      {
        "stage": "first_tx",
        "wallet_count": 1,
        "avg_time_hours": 2.5
      },
      {
        "stage": "feature_usage",
        "wallet_count": 1,
        "avg_time_hours": 24
      }
    ],
    "alerts": [],
    "recommendations": [],
    "generated_at": "2024-01-01T02:00:00Z"
  }
}
```

---

### Step 8: Get Wallet-Specific Analytics

**Endpoint:** `GET /api/projects/:projectId/wallets/:walletId/analytics/activity`

```bash
curl http://localhost:3000/api/projects/project-456/wallets/wallet-789/analytics/activity \
  -H "Authorization: Bearer jwt-token-here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "wallet_id": "wallet-789",
    "address": "t1Xh8ZGQPqvK3j9mN2pL4rS5tU6vW7xY8zA",
    "metrics": {
      "total_transactions": 150,
      "active_days": 25,
      "total_volume_zec": 10.5,
      "total_fees_paid_zec": 0.015,
      "transaction_breakdown": {
        "transfers": 100,
        "swaps": 30,
        "bridges": 15,
        "shielded": 5
      }
    },
    "recent_activity": [
      {
        "date": "2024-01-01",
        "transaction_count": 8,
        "volume_zec": 0.5,
        "is_active": true
      }
    ]
  }
}
```

---

### Step 9: Get Productivity Score

**Endpoint:** `GET /api/projects/:projectId/wallets/:walletId/analytics/productivity`

```bash
curl http://localhost:3000/api/projects/project-456/wallets/wallet-789/analytics/productivity \
  -H "Authorization: Bearer jwt-token-here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "wallet_id": "wallet-789",
    "total_score": 82,
    "components": {
      "retention_score": 85,
      "adoption_score": 80,
      "activity_score": 83,
      "diversity_score": 81
    },
    "status": "healthy",
    "risk_level": "low",
    "pending_tasks": [],
    "completed_tasks": [],
    "calculated_at": "2024-01-01T02:00:00Z"
  }
}
```

---

### Step 10: Get Cohort Analysis

**Endpoint:** `GET /api/projects/:projectId/analytics/cohorts`

```bash
curl http://localhost:3000/api/projects/project-456/analytics/cohorts \
  -H "Authorization: Bearer jwt-token-here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cohorts": [
      {
        "cohort_type": "weekly",
        "cohort_period": "2024-01-01",
        "wallet_count": 1,
        "retention_week_1": 100.0,
        "retention_week_2": 90.0,
        "retention_week_3": 85.0,
        "retention_week_4": 80.0
      }
    ],
    "heatmap_data": [
      {
        "cohort": "2024-W01",
        "week_0": 100,
        "week_1": 100,
        "week_2": 90,
        "week_3": 85,
        "week_4": 80
      }
    ]
  }
}
```

---

### Step 11: Get Adoption Funnel

**Endpoint:** `GET /api/projects/:projectId/analytics/adoption-funnel`

```bash
curl http://localhost:3000/api/projects/project-456/analytics/adoption-funnel \
  -H "Authorization: Bearer jwt-token-here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "funnel": [
      {
        "stage": "created",
        "wallet_count": 1,
        "percentage": 100,
        "avg_time_to_next_stage_hours": 2.5
      },
      {
        "stage": "first_tx",
        "wallet_count": 1,
        "percentage": 100,
        "conversion_from_previous": 100,
        "avg_time_to_next_stage_hours": 21.5
      },
      {
        "stage": "feature_usage",
        "wallet_count": 1,
        "percentage": 100,
        "conversion_from_previous": 100,
        "avg_time_to_next_stage_hours": 144
      },
      {
        "stage": "recurring",
        "wallet_count": 0,
        "percentage": 0,
        "conversion_from_previous": 0,
        "drop_off": 100
      }
    ],
    "overall_conversion": 100,
    "biggest_drop_off": {
      "stage": "feature_usage_to_recurring",
      "drop_off_percentage": 100
    }
  }
}
```

---

### Step 12: Get AI Recommendations

**Endpoint:** `GET /api/projects/:projectId/recommendations`

```bash
curl http://localhost:3000/api/projects/project-456/recommendations \
  -H "Authorization: Bearer jwt-token-here"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rec-1",
      "type": "onboarding",
      "title": "Improve user onboarding flow",
      "description": "Your adoption funnel shows a 100% drop-off from feature_usage to recurring. Consider improving the onboarding experience.",
      "priority": 9,
      "action_items": [
        "Add interactive tutorial for key features",
        "Implement progress tracking",
        "Send reminder notifications"
      ],
      "expected_impact": "high",
      "status": "pending"
    },
    {
      "id": "rec-2",
      "type": "marketing",
      "title": "Increase user acquisition",
      "description": "Your wallet count is low. Consider marketing campaigns to attract more users.",
      "priority": 7,
      "action_items": [
        "Launch social media campaign",
        "Partner with influencers",
        "Offer referral bonuses"
      ],
      "expected_impact": "medium",
      "status": "pending"
    }
  ]
}
```

---

### Step 13: Get Alerts

**Endpoint:** `GET /api/projects/:projectId/alerts`

```bash
curl http://localhost:3000/api/projects/project-456/alerts \
  -H "Authorization: Bearer jwt-token-here"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "alert-1",
      "type": "funnel_drop_off",
      "severity": "high",
      "title": "High drop-off in adoption funnel",
      "message": "100% of users are dropping off between feature_usage and recurring stages",
      "detected_at": "2024-01-01T02:00:00Z",
      "threshold": 50,
      "actual_value": 100,
      "suggestions": [
        "Review user feedback for friction points",
        "Simplify recurring transaction flow",
        "Add incentives for recurring usage"
      ]
    }
  ]
}
```

---

### Step 14: Compare with Competitors

**Endpoint:** `GET /api/projects/:projectId/compare?category=defi`

```bash
curl "http://localhost:3000/api/projects/project-456/compare?category=defi" \
  -H "Authorization: Bearer jwt-token-here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project_metrics": {
      "productivity_score": 82.5,
      "retention_rate": 85.0,
      "adoption_rate": 80.0
    },
    "market_benchmarks": {
      "productivity_score": {
        "percentile_25": 70,
        "percentile_50": 75,
        "percentile_75": 85,
        "percentile_90": 92
      },
      "retention_rate": {
        "percentile_25": 65,
        "percentile_50": 75,
        "percentile_75": 85,
        "percentile_90": 90
      }
    },
    "your_percentile": 65,
    "gap_analysis": {
      "strengths": ["retention_rate"],
      "weaknesses": ["adoption_rate"],
      "opportunities": ["Improve onboarding to reach 75th percentile"]
    }
  }
}
```

---

### Step 15: Get Competitive Insights

**Endpoint:** `GET /api/projects/:projectId/competitive-insights`

```bash
curl http://localhost:3000/api/projects/project-456/competitive-insights \
  -H "Authorization: Bearer jwt-token-here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "opportunity",
        "title": "Improve adoption funnel",
        "description": "Top-performing DeFi projects have 80%+ conversion from feature_usage to recurring. You're at 0%.",
        "recommendation": "Implement automated recurring transaction features",
        "potential_impact": "Could improve productivity score by 15 points"
      },
      {
        "type": "strength",
        "title": "Strong retention",
        "description": "Your retention rate (85%) is above the 75th percentile for DeFi projects",
        "recommendation": "Leverage this strength in marketing materials"
      }
    ],
    "market_position": "Above average",
    "trend": "stable"
  }
}
```

---

### Step 16: Export Analytics Report

**Endpoint:** `GET /api/projects/:projectId/analytics/export?format=csv`

```bash
curl "http://localhost:3000/api/projects/project-456/analytics/export?format=csv" \
  -H "Authorization: Bearer jwt-token-here" \
  -o analytics-report.csv
```

**Response:** CSV file downloaded

---

### Step 17: Monetize Data (Optional)

If you set privacy to "monetizable", others can purchase access:

**Endpoint:** `POST /api/wallets/:walletId/purchase-access`

```bash
# Another user purchasing access to your wallet data
curl -X POST http://localhost:3000/api/wallets/wallet-789/purchase-access \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer other-user-token" \
  -d '{
    "requester_id": "user-999",
    "requester_email": "buyer@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoice_id": "inv-123",
    "payment_address": "z1PaymentAddress...",
    "amount_zec": 0.001,
    "qr_code": "data:image/png;base64,...",
    "payment_uri": "zcash:z1PaymentAddress...?amount=0.001"
  }
}
```

**Check Your Earnings:**

```bash
curl http://localhost:3000/api/users/user-123/earnings \
  -H "Authorization: Bearer jwt-token-here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_sales": 5,
    "total_earnings_zec": 0.0035,
    "total_fees_zec": 0.0015,
    "pending_earnings_zec": 0.0035,
    "paid_earnings_zec": 0,
    "available_for_withdrawal_zec": 0.0035
  }
}
```

---

## 🔄 Continuous Monitoring

Once your wallet is added, the system automatically:

1. **Tracks Transactions** - Every transaction is captured and analyzed
2. **Updates Metrics** - Daily activity metrics are calculated
3. **Calculates Scores** - Productivity scores updated regularly
4. **Monitors Cohorts** - Retention tracked over time
5. **Detects Alerts** - Threshold-based alerts generated
6. **Generates Recommendations** - AI suggests improvements
7. **Compares Performance** - Benchmarked against competitors

## 📊 Data Flow

```
Zcash Blockchain
    ↓
Transaction Detection
    ↓
Activity Metrics Calculation
    ↓
Productivity Score Update
    ↓
Cohort Assignment & Retention Tracking
    ↓
Adoption Stage Progression
    ↓
Alert Detection
    ↓
AI Recommendation Generation
    ↓
Dashboard Aggregation
    ↓
User Views Analytics
```

## 🎯 Summary

**What You Get:**

1. **Real-time Analytics** - Live tracking of all wallet activities
2. **Productivity Scores** - 0-100 scores with component breakdowns
3. **Cohort Analysis** - Retention heatmaps and trends
4. **Adoption Funnels** - Conversion tracking through stages
5. **AI Recommendations** - Actionable suggestions for improvement
6. **Alerts** - Proactive notifications of issues
7. **Competitive Insights** - Compare against market benchmarks
8. **Monetization** - Earn from your analytics data (optional)
9. **Export** - Download reports in JSON/CSV
10. **Privacy Control** - Full control over data sharing

**All from:**
- Registering an account
- Creating a project
- Adding a wallet address

The system handles everything else automatically!

---

**Next Steps:**
- See [WALLET_ANALYTICS_QUICK_START.md](WALLET_ANALYTICS_QUICK_START.md) for setup
- See [WALLET_ANALYTICS_INDEX.md](WALLET_ANALYTICS_INDEX.md) for full documentation
