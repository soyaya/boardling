# Wallet Address Sync - Complete Implementation

## Overview

Implemented comprehensive wallet address handling throughout the system:
1. Added wallet address field to Create Project form
2. Backend validates and creates wallet automatically
3. Onboarding syncs default addresses before dashboard
4. Complete system sync script for existing projects

## Changes Made

### 1. Create Project Form - Added Wallet Address Field

**File**: `src/pages/Projects.tsx`

Added wallet address input to the project creation/edit form:

```typescript
<div>
  <label>Default Wallet Address</label>
  <input
    type="text"
    value={formData.default_wallet_address}
    onChange={(e) => setFormData({ ...formData, default_wallet_address: e.target.value })}
    placeholder="zs1... or t1... (Zcash address)"
    className="font-mono text-sm"
  />
  <p className="text-xs text-gray-500">
    Optional: Specify a Zcash address to track. Can be added later.
  </p>
</div>
```

**Features**:
- Optional field (can be added later)
- Monospace font for better readability
- Placeholder shows expected format
- Helper text explains purpose

### 2. Backend - Auto-Create Wallet

**File**: `backend/src/controllers/project.js`

When creating a project with a wallet address:

```javascript
// Validate wallet address
if (default_wallet_address) {
  const validation = validateZcashAddress(default_wallet_address, 'mainnet');
  if (!validation.valid) {
    throw new BadRequestError(`Invalid Zcash address: ${validation.error}`);
  }
}

// Create project with default_wallet_address
const project = await createProject({
  ...data,
  default_wallet_address
});

// Auto-create wallet entry
if (default_wallet_address) {
  const wallet = await createWallet({
    project_id: project.id,
    address: default_wallet_address,
    type: detectAddressType(default_wallet_address, 'mainnet'),
    privacy_mode: 'private',
    network: 'mainnet',
    is_active: true
  });
  
  // Index wallet in background
  processWalletTransactions(wallet).catch(err => {
    console.warn('Failed to index wallet:', err.message);
  });
}
```

**What This Does**:
1. Validates the Zcash address format
2. Creates the project with default_wallet_address set
3. Automatically creates a wallet entry in the wallets table
4. Starts indexing transactions from the blockchain (async)
5. Doesn't fail project creation if indexing fails

### 3. Onboarding - Sync Before Dashboard

**File**: `src/components/onboarding/CompletionStep.tsx`

Added sync call during onboarding completion:

```typescript
// Sync default wallet addresses for all projects
try {
  const syncResponse = await fetch('/api/projects/sync-default-wallets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (syncResponse.ok) {
    const syncData = await syncResponse.json();
    console.log('Default wallets synced:', syncData);
  }
} catch (syncError) {
  console.warn('Default wallet sync failed:', syncError);
  // Continue anyway - not critical
}
```

**What This Does**:
1. Calls sync endpoint after onboarding completes
2. Ensures all projects have default wallet addresses
3. Indexes wallets from blockchain
4. Doesn't block navigation if sync fails
5. Shows progress in completion screen

### 4. Backend Sync Endpoint

**File**: `backend/src/routes/project.js`

Added new endpoint:

```javascript
POST /api/projects/sync-default-wallets
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Synced 2/2 projects",
  "synced": 2,
  "total": 2
}
```

**What It Does**:
1. Gets all user's projects
2. For each project without default_wallet_address:
   - Finds first wallet
   - Sets as default
   - Indexes from blockchain
3. Returns sync statistics

### 5. Complete System Sync Script

**File**: `backend/scripts/sync-system-complete.js`

Comprehensive sync script that:
1. Runs database migration (if needed)
2. Syncs all project default wallets
3. Indexes wallets from Zcash blockchain
4. Verifies data integrity
5. Shows detailed statistics

## User Flows

### Flow 1: Create Project with Wallet

```
User clicks "New Project"
  ↓
Fills form including wallet address
  ↓
Clicks "Create Project"
  ↓
Backend validates address
  ↓
Creates project with default_wallet_address
  ↓
Auto-creates wallet entry
  ↓
Starts indexing transactions (async)
  ↓
Returns project to frontend
  ↓
Project appears in list with wallet
```

### Flow 2: Create Project without Wallet

```
User clicks "New Project"
  ↓
Fills form, leaves wallet address empty
  ↓
Clicks "Create Project"
  ↓
Creates project without default_wallet_address
  ↓
Returns project to frontend
  ↓
User can add wallet later via:
  - Edit project
  - Add wallet separately
  - Onboarding flow
```

### Flow 3: Onboarding with Wallet

```
User completes onboarding
  ↓
Project + Wallet created
  ↓
Completion screen shows
  ↓
"Syncing" step runs
  ↓
Calls /api/projects/sync-default-wallets
  ↓
Backend sets default_wallet_address
  ↓
Indexes wallet from blockchain
  ↓
"Encrypting" step shows
  ↓
"Complete" step shows with stats
  ↓
Auto-navigates to dashboard
  ↓
Dashboard has data ready
```

## API Changes

### POST /api/projects

**Before**:
```json
{
  "name": "My Project",
  "category": "defi"
}
```

**After** (with wallet):
```json
{
  "name": "My Project",
  "category": "defi",
  "default_wallet_address": "zs1..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Project",
    "category": "defi",
    "default_wallet_address": "zs1...",
    ...
  }
}
```

### POST /api/projects/sync-default-wallets (NEW)

**Request**:
```http
POST /api/projects/sync-default-wallets
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Synced 2/2 projects",
  "synced": 2,
  "total": 2
}
```

## Testing

### Test 1: Create Project with Wallet

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "category": "defi",
    "default_wallet_address": "zs1..."
  }'
```

Expected:
- Project created
- Wallet created automatically
- default_wallet_address set
- Indexing started

### Test 2: Create Project without Wallet

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "category": "defi"
  }'
```

Expected:
- Project created
- default_wallet_address is NULL
- Can add wallet later

### Test 3: Sync Default Wallets

```bash
curl -X POST http://localhost:3000/api/projects/sync-default-wallets \
  -H "Authorization: Bearer <token>"
```

Expected:
- All projects synced
- Default addresses set
- Wallets indexed

### Test 4: Complete Onboarding

1. Sign up
2. Complete onboarding with wallet address
3. Watch completion screen
4. Verify "Syncing" step runs
5. Navigate to dashboard
6. Check project has default_wallet_address

### Test 5: Edit Project to Add Wallet

1. Go to Projects page
2. Click Edit on project without wallet
3. Add wallet address
4. Save
5. Verify wallet is created and indexed

## Verification

### Check Project Has Wallet

```sql
SELECT 
  p.id,
  p.name,
  p.default_wallet_address,
  w.id as wallet_id,
  w.address as wallet_address
FROM projects p
LEFT JOIN wallets w ON w.address = p.default_wallet_address
WHERE p.id = '<project_id>';
```

### Check Wallet Is Indexed

```sql
SELECT 
  w.address,
  COUNT(pt.id) as tx_count,
  MAX(pt.block_timestamp) as last_tx
FROM wallets w
LEFT JOIN processed_transactions pt ON pt.wallet_id = w.id
WHERE w.address = '<wallet_address>'
GROUP BY w.id, w.address;
```

### Check All Projects

```sql
SELECT 
  p.name,
  p.default_wallet_address,
  COUNT(w.id) as wallet_count,
  COUNT(pt.id) as tx_count
FROM projects p
LEFT JOIN wallets w ON w.project_id = p.id
LEFT JOIN processed_transactions pt ON pt.wallet_id = w.id
GROUP BY p.id, p.name, p.default_wallet_address;
```

## Complete System Sync

Run this to sync everything:

```bash
node backend/scripts/sync-system-complete.js
```

This will:
1. ✅ Run migration (if needed)
2. ✅ Sync all project default wallets
3. ✅ Index wallets from blockchain
4. ✅ Verify data integrity
5. ✅ Show detailed statistics

## Troubleshooting

### Issue: "Invalid Zcash address"

**Cause**: Address format is wrong

**Fix**: 
- Use valid Zcash address (starts with zs1, t1, etc.)
- Check address on block explorer
- Verify network (mainnet vs testnet)

### Issue: Wallet not indexed

**Cause**: Indexer not running or no transactions

**Fix**:
```bash
# Start indexer
cd backend/indexer
node start.js

# Manually sync
cd backend
node scripts/sync-wallets.js
```

### Issue: Onboarding sync fails

**Cause**: Backend not running or network error

**Fix**:
- Check backend is running
- Check browser console for errors
- Onboarding will continue anyway (non-blocking)

### Issue: Project created but no wallet

**Cause**: Wallet creation failed after project creation

**Fix**:
- Edit project and add wallet address
- Or add wallet via wallet management
- Or run sync script

## Best Practices

1. **Always provide wallet address** when creating projects
2. **Use valid Zcash addresses** - verify on block explorer first
3. **Run sync script** after bulk operations
4. **Monitor indexing** - check processed_transactions table
5. **Test with testnet** addresses first

## Files Modified

### Frontend
- `src/pages/Projects.tsx` - Added wallet address field to form
- `src/components/onboarding/CompletionStep.tsx` - Added sync call

### Backend
- `backend/src/controllers/project.js` - Auto-create wallet when address provided
- `backend/src/routes/project.js` - Added sync endpoint

### Scripts
- `backend/scripts/sync-system-complete.js` - Complete system sync

## Summary

✅ **Create Project Form**: Now includes wallet address field
✅ **Auto-Create Wallet**: Backend creates wallet entry automatically
✅ **Auto-Index**: Starts blockchain indexing immediately
✅ **Onboarding Sync**: Syncs before navigating to dashboard
✅ **Sync Endpoint**: API endpoint for manual sync
✅ **System Sync Script**: Complete sync for all projects
✅ **Validation**: Validates Zcash address format
✅ **Error Handling**: Graceful fallbacks for failures

---

**Status**: ✅ Complete

Users can now specify wallet addresses when creating projects, and the system automatically creates wallet entries and indexes them from the Zcash blockchain. Onboarding also syncs default addresses before navigating to the dashboard.
