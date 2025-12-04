# Analytics Quick Start Guide

## Problem

Analytics dashboards showing "No project selected" and no data.

## Solution (3 Steps)

### Step 1: Generate Sample Data

```bash
cd backend
node scripts/generate-sample-analytics.js
```

This creates:
- Sample project (or uses existing)
- Sample wallet
- 50 transactions
- 30 days of metrics
- Cohort data
- Funnel data

### Step 2: Sync Default Wallets

```bash
node scripts/sync-project-wallets.js
```

This ensures all projects have their default wallet address set.

### Step 3: Restart Frontend

```bash
# In the root directory
npm run dev
```

Then:
1. Open http://localhost:5173
2. Sign in
3. Check sidebar - you should see your project name
4. Navigate to Dashboard - should show metrics

## Verification

Run the test script:

```bash
cd backend
node tests/test-analytics-data-flow.js
```

Should show:
- ✓ Projects exist
- ✓ Wallets exist
- ✓ Transactions exist
- ✓ Metrics exist
- ✓ All tests passed

## What Was Fixed

### 1. Projects Now Auto-Load

The `MainLayout` component now automatically:
- Fetches all projects when app loads
- Selects the first project by default
- Provides project context to all pages

### 2. Project Selector Added

The sidebar now has a project selector:
- Click to see all projects
- Switch between projects
- Shows current project name

### 3. Data Flow Established

```
User logs in
  ↓
Projects fetched
  ↓
First project selected
  ↓
Analytics pages get projectId
  ↓
API queries database
  ↓
Data displayed
```

## Troubleshooting

### Still seeing "No project selected"?

**Check 1**: Do you have projects?
```bash
psql -d broadlypaywall -c "SELECT id, name FROM projects;"
```

If empty, complete onboarding or run sample data generator.

**Check 2**: Is the API running?
```bash
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Check 3**: Check browser console
- Open DevTools (F12)
- Look for errors in Console tab
- Check Network tab for failed requests

### No data in analytics?

**Run sample data generator**:
```bash
node backend/scripts/generate-sample-analytics.js
```

**Or wait for real data**:
- Add a real Zcash wallet address
- Wait for indexer to sync transactions
- Check: `SELECT COUNT(*) FROM processed_transactions;`

### Project selector not showing?

**Check if projects loaded**:
- Open browser console
- Look for "Auto-selected first project: ..." message
- If not there, check API connection

## Expected Behavior

### On First Load
1. App fetches projects
2. First project auto-selected
3. Sidebar shows project name
4. Dashboard shows metrics

### When Switching Projects
1. Click project selector in sidebar
2. Choose different project
3. All analytics update automatically

### When No Data
1. Dashboards show empty states
2. Helpful messages guide you
3. No errors or crashes

## Quick Commands

```bash
# Generate sample data
node backend/scripts/generate-sample-analytics.js

# Sync default wallets
node backend/scripts/sync-project-wallets.js

# Test data flow
node backend/tests/test-analytics-data-flow.js

# Check database
psql -d broadlypaywall -c "
  SELECT 
    p.name,
    COUNT(w.id) as wallets,
    COUNT(pt.id) as transactions
  FROM projects p
  LEFT JOIN wallets w ON w.project_id = p.id
  LEFT JOIN processed_transactions pt ON pt.wallet_id = w.id
  GROUP BY p.id, p.name;
"
```

## Next Steps

1. ✅ Run sample data generator
2. ✅ Verify in UI
3. ✅ Test project switching
4. ✅ Add real wallet addresses
5. ✅ Monitor indexer for real data

---

**Need Help?**

Check the detailed guide: `ANALYTICS_DATA_FLOW_FIX.md`
