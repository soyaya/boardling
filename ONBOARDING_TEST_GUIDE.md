# Onboarding Flow Test Guide

## Quick Test with Real Zcash Address

Test the complete onboarding flow with address: `t1at7nVNsv6taLRrNRvnQdtfLNRDfsGc3Ak`

### Prerequisites

1. **Backend Running**
   ```bash
   cd backend
   npm start
   ```
   Backend should be running on `http://localhost:3001`

2. **Database Ready**
   - PostgreSQL running
   - Migrations applied
   - Tables created

3. **Indexer Running (Optional)**
   - For transaction sync to work
   - If not running, sync step will show 0 transactions

---

## Automated Test

### Run the Test Script

```bash
# From project root
cd backend/tests
node test-onboarding-with-address.js
```

Or use the shell script:

```bash
chmod +x backend/tests/run-onboarding-test.sh
./backend/tests/run-onboarding-test.sh
```

### What the Test Does

1. ✅ **Register User** - Creates new test user
2. ✅ **Create Project** - Creates project with details
3. ✅ **Add Wallet** - Adds wallet with address `t1at7nVNsv6taLRrNRvnQdtfLNRDfsGc3Ak`
4. ✅ **Sync Data** - Pulls transactions from indexer
5. ✅ **Verify Storage** - Checks data is encrypted and stored
6. ✅ **Fetch Analytics** - Retrieves analytics data
7. ✅ **Complete Onboarding** - Marks onboarding as done

### Expected Output

```
🧪 TESTING COMPLETE ONBOARDING FLOW
======================================================================

📝 Step 1: Register User
==================================================
✅ User registered successfully
   User ID: uuid-123
   Email: test-1234567890@example.com
   Onboarding Completed: false

🏗️  Step 2: Create Project
==================================================
✅ Project created successfully
   Project ID: uuid-456
   Name: Test Zcash Project
   Category: defi

💼 Step 3: Add Wallet with Address
==================================================
   Address: t1at7nVNsv6taLRrNRvnQdtfLNRDfsGc3Ak
✅ Wallet added successfully
   Wallet ID: uuid-789
   Address: t1at7nVNsv6taLRrNRvnQdtfLNRDfsGc3Ak
   Type: transparent
   Privacy Mode: private

🔄 Step 4: Sync Wallet Data from Indexer
==================================================
✅ Wallet sync completed
   Wallets Synced: 1
   Transactions Found: 42

📋 TEST SUMMARY
======================================================================
✅ Passed: 7/7
❌ Failed: 0/7

🎉 ALL TESTS PASSED!
```

---

## Manual Test (Frontend)

### Step-by-Step Manual Testing

1. **Start Frontend**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173`

2. **Register**
   - Go to `/signup`
   - Fill in registration form
   - Click "Create account"
   - Should auto-login and redirect to `/onboarding`

3. **Onboarding Step 1: Welcome**
   - See welcome screen with features
   - Click "Get Started"
   - Should go to Step 2

4. **Onboarding Step 2: Project + Wallet**
   - Fill in project details:
     - Name: "My Test Project"
     - Description: "Testing onboarding"
     - Category: "DeFi"
     - Website: "https://test.com"
     - **Wallet Address: `t1at7nVNsv6taLRrNRvnQdtfLNRDfsGc3Ak`**
   - Click "Create Project"
   - Should show completion screen

5. **Completion Screen**
   - See "Pulling blockchain data..." (animated)
   - See "Encrypting your data..." (animated)
   - See "All set!" with stats
   - See 30-day trial information
   - Auto-redirect to dashboard after 2 seconds

6. **Dashboard**
   - Welcome modal should appear
   - Trial badge in header: "Free Trial • 30 days left"
   - Analytics data visible (if transactions were synced)

---

## Verify in Database

### Check User
```sql
SELECT id, name, email, onboarding_completed, subscription_status, subscription_expires_at
FROM users
WHERE email LIKE 'test-%@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

### Check Project
```sql
SELECT p.id, p.name, p.category, p.user_id, p.created_at
FROM projects p
JOIN users u ON p.user_id = u.id
WHERE u.email LIKE 'test-%@example.com'
ORDER BY p.created_at DESC
LIMIT 1;
```

### Check Wallet
```sql
SELECT w.id, w.address, w.type, w.privacy_mode, w.project_id, w.is_active
FROM wallets w
JOIN projects p ON w.project_id = p.id
JOIN users u ON p.user_id = u.id
WHERE u.email LIKE 'test-%@example.com'
ORDER BY w.created_at DESC
LIMIT 1;
```

### Check Synced Transactions
```sql
SELECT COUNT(*) as transaction_count, 
       MIN(block_timestamp) as first_tx,
       MAX(block_timestamp) as last_tx
FROM processed_transactions pt
JOIN wallets w ON pt.wallet_id = w.id
WHERE w.address = 't1at7nVNsv6taLRrNRvnQdtfLNRDfsGc3Ak';
```

---

## Troubleshooting

### Issue: "Wallet sync failed"
**Cause:** Indexer not running or address has no transactions
**Solution:** 
- Start indexer: `cd backend/indexer && node start.js`
- Or test with an address that has transactions

### Issue: "Failed to create project"
**Cause:** Database connection issue
**Solution:**
- Check PostgreSQL is running
- Verify connection in `backend/.env`
- Check migrations are applied

### Issue: "Network error"
**Cause:** Backend not running
**Solution:**
- Start backend: `cd backend && npm start`
- Verify it's on `http://localhost:3001`

### Issue: "Invalid Zcash address"
**Cause:** Address format validation failed
**Solution:**
- Use valid format: `t1...` (34+ chars), `zs1...` (78+ chars), or `u1...` (100+ chars)
- Test address: `t1at7nVNsv6taLRrNRvnQdtfLNRDfsGc3Ak`

---

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/register` | POST | Register new user |
| `/api/projects` | POST | Create project |
| `/api/wallets` | POST | Add wallet |
| `/api/onboarding/sync-wallet` | POST | Sync blockchain data |
| `/api/onboarding/status` | GET | Check onboarding status |
| `/api/analytics/:projectId` | GET | Fetch analytics |

---

## Success Criteria

✅ User registered with `onboarding_completed = false`  
✅ Project created and linked to user  
✅ Wallet created with address `t1at7nVNsv6taLRrNRvnQdtfLNRDfsGc3Ak`  
✅ Wallet type auto-detected as "transparent"  
✅ Sync endpoint called and transactions pulled  
✅ Data encrypted with FHE (if enabled)  
✅ Analytics data available in dashboard  
✅ 30-day trial activated  
✅ User can access dashboard  

---

## Next Steps

After successful test:

1. **Test with Different Addresses**
   - Shielded: `zs1...`
   - Unified: `u1...`

2. **Test Error Scenarios**
   - Invalid address format
   - Network disconnection
   - Database errors

3. **Test State Persistence**
   - Logout and login
   - Resume incomplete onboarding
   - Browser refresh

4. **Performance Testing**
   - Measure sync time
   - Check encryption overhead
   - Monitor database queries

---

**Happy Testing! 🚀**
