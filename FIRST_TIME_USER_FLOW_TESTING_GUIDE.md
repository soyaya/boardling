# First-Time User Flow - Testing Guide

## Quick Start Testing

### Prerequisites
1. Backend server running on `http://localhost:3001`
2. Frontend dev server running on `http://localhost:5173`
3. Database with migrations applied
4. Indexer running (optional, but recommended for full experience)

### Test Scenario 1: Complete New User Flow

**Step 1: Registration**
```
1. Navigate to http://localhost:5173/signup
2. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Company: Test Company (optional)
   - Password: password123
   - Confirm Password: password123
3. Click "Create account"
```

**Expected Result:**
- ✅ User is automatically logged in (no redirect to sign-in)
- ✅ Redirected to `/onboarding` page
- ✅ JWT token stored in localStorage
- ✅ 30-day trial initialized in database

**Step 2: Onboarding - Welcome**
```
1. You should see the Welcome step
2. Click "Get Started"
```

**Expected Result:**
- ✅ Progress to step 2
- ✅ Progress bar shows 2/3

**Step 3: Onboarding - Project Setup**
```
1. Fill in project details:
   - Project Name: My DeFi App
   - Description: A test project
   - Category: DeFi
   - Website: https://example.com (optional)
2. Click "Continue"
```

**Expected Result:**
- ✅ Project created in database
- ✅ Progress to step 3
- ✅ Progress bar shows 3/3

**Step 4: Onboarding - Wallet Addition**
```
1. Enter wallet details:
   - Address: t1abc123... (use a valid testnet address)
   - Label: Main Wallet
   - Privacy Mode: Private (default)
2. Click "Add Wallet & Complete Setup"
```

**Expected Result:**
- ✅ Wallet created in database
- ✅ Completion screen appears

**Step 5: Completion Screen**
```
Watch the automatic progression:
1. "Pulling blockchain data..." (1.5s)
2. "Encrypting your data..." (1.5s)
3. "All set!" (2s)
```

**Expected Result:**
- ✅ Each step animates smoothly
- ✅ Sync statistics displayed (wallets: 1, transactions: X)
- ✅ 30-day trial card shown
- ✅ Auto-redirect to dashboard after 2 seconds

**Step 6: First Dashboard Visit**
```
1. Welcome modal should appear automatically
2. Review the content:
   - Trial status (30 days remaining)
   - Expiration date
   - Feature list
3. Click "Explore Dashboard"
```

**Expected Result:**
- ✅ Welcome modal displays correctly
- ✅ Trial information accurate
- ✅ Modal closes on button click
- ✅ Dashboard content visible

**Step 7: Verify Trial Badge**
```
1. Look at the top-right header
2. You should see trial status badge
```

**Expected Result:**
- ✅ Badge shows "Free Trial • 30 days left"
- ✅ Clickable to navigate to settings

---

### Test Scenario 2: Logout and Re-login

**Step 1: Logout**
```
1. Click profile menu in top-right
2. Click "Logout"
```

**Expected Result:**
- ✅ Redirected to landing page
- ✅ Token cleared from localStorage

**Step 2: Login**
```
1. Navigate to /signin
2. Login with same credentials:
   - Email: test@example.com
   - Password: password123
3. Click "Sign in"
```

**Expected Result:**
- ✅ Successfully logged in
- ✅ Redirected to `/dashboard` (NOT onboarding)
- ✅ Welcome modal does NOT appear (already seen)
- ✅ Trial badge still visible

---

### Test Scenario 3: Incomplete Onboarding

**Step 1: Create User Without Completing Onboarding**
```
1. Register a new user
2. Complete step 1 (Welcome)
3. Complete step 2 (Project)
4. On step 3, close the browser tab
```

**Step 2: Login Again**
```
1. Navigate to /signin
2. Login with the credentials
```

**Expected Result:**
- ✅ Redirected to `/onboarding` (not dashboard)
- ✅ Onboarding resumes from where left off
- ✅ Project data preserved in store

---

### Test Scenario 4: Welcome Modal Persistence

**Step 1: Complete Onboarding**
```
1. Complete full onboarding flow
2. See welcome modal on dashboard
3. Close modal
```

**Step 2: Refresh Page**
```
1. Refresh the dashboard page
```

**Expected Result:**
- ✅ Welcome modal does NOT appear again
- ✅ localStorage flag set: `boardling_welcome_shown = 'true'`

**Step 3: Clear Flag and Refresh**
```
1. Open browser console
2. Run: localStorage.removeItem('boardling_welcome_shown')
3. Refresh page
```

**Expected Result:**
- ✅ Welcome modal appears again

---

### Test Scenario 5: Error Handling

**Test 5a: Registration with Existing Email**
```
1. Try to register with an email that already exists
```

**Expected Result:**
- ✅ Error message: "User with this email already exists"
- ✅ Helpful actions: "Sign in instead" button
- ✅ No redirect, stays on registration page

**Test 5b: Invalid Wallet Address**
```
1. During onboarding, enter invalid wallet address
2. Try to submit
```

**Expected Result:**
- ✅ Validation error: "Invalid Zcash address format"
- ✅ Cannot proceed until valid address entered

**Test 5c: Network Error During Sync**
```
1. Stop backend server
2. Complete onboarding
3. Observe completion screen
```

**Expected Result:**
- ✅ Error handled gracefully
- ✅ Still redirects to dashboard
- ✅ User can retry sync later

---

## API Endpoint Testing

### Test Registration Endpoint
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Test User",
    "email": "test@example.com",
    "created_at": "2025-12-04T..."
  }
}
```

### Test Wallet Sync Endpoint
```bash
# First, get token from registration or login
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3001/api/onboarding/sync-wallet \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Wallet sync completed",
  "wallets_synced": 1,
  "total_transactions": 42,
  "results": [
    {
      "wallet_id": "uuid",
      "address": "t1abc...",
      "processed": 42,
      "days_updated": 5,
      "message": "Successfully processed transactions"
    }
  ]
}
```

---

## Database Verification

### Check User Trial Status
```sql
SELECT 
  id, 
  name, 
  email, 
  subscription_status, 
  subscription_expires_at,
  onboarding_completed,
  created_at
FROM users
WHERE email = 'test@example.com';
```

**Expected Result:**
- `subscription_status` = 'free'
- `subscription_expires_at` = 30 days from now
- `onboarding_completed` = true (after completion)

### Check Project and Wallet
```sql
SELECT 
  p.id as project_id,
  p.name as project_name,
  w.id as wallet_id,
  w.address,
  w.privacy_mode
FROM projects p
LEFT JOIN wallets w ON p.id = w.project_id
WHERE p.user_id = (SELECT id FROM users WHERE email = 'test@example.com');
```

**Expected Result:**
- Project exists with correct name
- Wallet exists with correct address
- Linked correctly via project_id

---

## Browser Console Checks

### Check LocalStorage
```javascript
// Open browser console (F12)

// Check auth token
localStorage.getItem('boardling_auth_token')
// Should return JWT token

// Check user data
localStorage.getItem('boardling_user')
// Should return user JSON

// Check welcome flag
localStorage.getItem('boardling_welcome_shown')
// Should return 'true' after seeing modal

// Check onboarding state
localStorage.getItem('onboarding-storage')
// Should return onboarding state JSON
```

### Check Auth State
```javascript
// In browser console
window.localStorage
// Inspect all stored data
```

---

## Performance Testing

### Measure Onboarding Time
```
1. Start timer when clicking "Create account"
2. Stop timer when dashboard loads
```

**Target:** < 10 seconds for complete flow
**Breakdown:**
- Registration: < 1s
- Onboarding steps: ~5s (user input)
- Completion screen: ~5s (animations + sync)
- Dashboard load: < 1s

---

## Troubleshooting

### Issue: Auto-login not working
**Check:**
- Backend returns token in registration response
- Token is stored in localStorage
- Auth store updates isAuthenticated to true

### Issue: Completion screen stuck
**Check:**
- Sync endpoint is accessible
- Backend can connect to indexer database
- Network tab shows successful API call

### Issue: Welcome modal not appearing
**Check:**
- Location state includes `firstVisit: true`
- localStorage flag not already set
- Modal component imported correctly

### Issue: Redirect to onboarding not working
**Check:**
- User's `onboarding_completed` is false
- ProtectedRoute component checking the flag
- Not already on `/onboarding` path

---

## Success Criteria

✅ **Registration Flow**
- User can register without errors
- Auto-login works
- Redirects to onboarding

✅ **Onboarding Flow**
- All 3 steps complete successfully
- Data saved to database
- Completion screen shows

✅ **Completion Flow**
- Animations play smoothly
- Sync endpoint called
- Statistics displayed
- Auto-redirect works

✅ **Dashboard Flow**
- Welcome modal appears once
- Trial badge visible
- Data loads correctly

✅ **Edge Cases**
- Logout/login works
- Incomplete onboarding handled
- Errors handled gracefully

---

## Next Steps After Testing

1. **Monitor Analytics**
   - Track onboarding completion rate
   - Measure time to complete
   - Identify drop-off points

2. **Gather Feedback**
   - User surveys
   - Session recordings
   - Support tickets

3. **Iterate**
   - Optimize slow steps
   - Improve error messages
   - Add more guidance

4. **Scale**
   - Load testing
   - Performance optimization
   - Caching strategies

---

**Happy Testing! 🚀**
