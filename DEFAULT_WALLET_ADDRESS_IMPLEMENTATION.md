# Default Wallet Address Implementation - Complete

## Summary

I've implemented a comprehensive system to ensure that every project has a default Zcash wallet address that is automatically indexed from the blockchain. This addresses your requirement: "make sure the project default wallet address is indexed from database if it's empty index zcash".

## What Was Implemented

### 1. Database Schema Changes

**File**: `backend/migrations/014_add_default_wallet_address.sql`

- Added `default_wallet_address` column to projects table
- Created index for performance
- Populated existing projects with their first wallet address
- Created automatic trigger to set default wallet when first wallet is added

### 2. Backend Services

**File**: `backend/src/services/projectWalletService.js`

New service with functions:
- `ensureDefaultWalletAddress(projectId)` - Sets and indexes default wallet
- `getProjectWithDefaultWallet(projectId, userId)` - Gets project with wallet ensured
- `updateDefaultWalletAddress(projectId, userId, walletAddress)` - Updates default wallet
- `syncAllProjectDefaultWallets()` - Batch sync for all projects

### 3. Controller Updates

**File**: `backend/src/controllers/project.js`

- `getProjectController` - Automatically ensures default wallet is set when fetching a project
- `getProjectsController` - Processes projects in background to set default wallets

### 4. Model Updates

**File**: `backend/src/models/project.js`

- Added `default_wallet_address` parameter to `createProject` function

**File**: `backend/src/services/onboardingService.js`

- Sets `default_wallet_address` immediately during onboarding

### 5. Frontend Type Updates

**File**: `src/services/projectService.ts`

- Added `default_wallet_address: string | null` to Project interface

### 6. Migration Scripts

**File**: `backend/scripts/run-default-wallet-migration.js`
- Runs the database migration
- Shows statistics after completion

**File**: `backend/scripts/sync-project-wallets.js`
- Syncs all projects without default wallet addresses
- Indexes wallets from Zcash blockchain
- Provides detailed progress report

### 7. Documentation

**File**: `backend/docs/DEFAULT_WALLET_ADDRESS.md`
- Comprehensive documentation
- API endpoints
- Service functions
- Testing guide
- Troubleshooting

**File**: `backend/docs/DEFAULT_WALLET_QUICK_START.md`
- Quick setup guide
- Common scenarios
- Verification steps
- Maintenance tips

## How It Works

### Automatic Flow

1. **Project Creation**: When a project is created, `default_wallet_address` is initially NULL
2. **First Wallet Added**: Database trigger automatically sets `default_wallet_address`
3. **Project Fetch**: When fetching a project, if `default_wallet_address` is NULL:
   - System fetches first wallet from database
   - Updates project with wallet address
   - Indexes wallet transactions from Zcash blockchain
4. **Onboarding**: During onboarding, default wallet is set immediately in the same transaction

### Blockchain Indexing

When a default wallet address is set, the system:
1. Connects to the Zcash indexer database
2. Fetches all transactions for the address
3. Processes and stores transactions
4. Updates analytics metrics (volume, fees, shielded stats, etc.)

## Setup Instructions

### 1. Run Migration

```bash
cd backend
node scripts/run-default-wallet-migration.js
```

### 2. Sync Existing Projects

```bash
node scripts/sync-project-wallets.js
```

### 3. Verify

```bash
# Check database
psql -d broadlypaywall -c "SELECT COUNT(*) FROM projects WHERE default_wallet_address IS NOT NULL;"

# Test API
curl -X GET http://localhost:3000/api/projects/<project_id> \
  -H "Authorization: Bearer <token>"
```

## Key Features

✅ **Automatic Population**: Database trigger sets default wallet when first wallet is added
✅ **Lazy Loading**: Wallet indexing happens asynchronously, doesn't block requests
✅ **Blockchain Integration**: Automatically indexes transactions from Zcash
✅ **Error Handling**: Gracefully handles missing wallets and indexing failures
✅ **Performance**: Indexed queries and background processing
✅ **Type Safety**: Full TypeScript support on frontend
✅ **Backward Compatible**: Works with existing projects and wallets

## API Changes

### GET /api/projects/:id

**Before:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Project",
    ...
  }
}
```

**After:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Project",
    "default_wallet_address": "zs1...",
    ...
  }
}
```

## Frontend Usage

```typescript
import { useCurrentProject } from '../store/useProjectStore';

const Dashboard = () => {
  const { currentProject } = useCurrentProject();
  
  // Access default wallet address
  const walletAddress = currentProject?.default_wallet_address;
  
  if (walletAddress) {
    // Use the wallet address for analytics, payments, etc.
    console.log('Default wallet:', walletAddress);
  }
};
```

## Testing

### Test Scenarios

1. **New Project with Wallet**
   - Create project
   - Add wallet
   - Verify default_wallet_address is set

2. **Existing Project**
   - Fetch project
   - Verify default_wallet_address is populated from first wallet

3. **Onboarding Flow**
   - Complete onboarding
   - Verify project has default_wallet_address immediately

4. **Blockchain Indexing**
   - Check processed_transactions table
   - Verify transactions are indexed

### Test Commands

```bash
# Test migration
node backend/scripts/run-default-wallet-migration.js

# Test sync
node backend/scripts/sync-project-wallets.js

# Test API
curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: Bearer <token>"
```

## Database Schema

```sql
-- Projects table now includes
ALTER TABLE projects 
ADD COLUMN default_wallet_address VARCHAR(255);

-- Index for performance
CREATE INDEX idx_projects_default_wallet 
ON projects(default_wallet_address) 
WHERE default_wallet_address IS NOT NULL;

-- Automatic trigger
CREATE TRIGGER trigger_set_default_wallet_address
AFTER INSERT ON wallets
FOR EACH ROW
EXECUTE FUNCTION set_default_wallet_address();
```

## Performance Considerations

- **Indexed Queries**: Fast lookups via database index
- **Async Processing**: Wallet indexing doesn't block API responses
- **Batch Operations**: Sync script processes multiple projects efficiently
- **Caching**: Frontend stores projects in Zustand store

## Error Handling

The system gracefully handles:
- Projects with no wallets (returns NULL)
- Indexing failures (logs warning, doesn't fail request)
- Invalid addresses (validation before setting)
- Database connection issues (proper error messages)

## Monitoring

```sql
-- Check sync status
SELECT 
  COUNT(*) FILTER (WHERE default_wallet_address IS NOT NULL) as with_wallet,
  COUNT(*) FILTER (WHERE default_wallet_address IS NULL) as without_wallet
FROM projects;

-- Check indexing status
SELECT 
  p.name,
  p.default_wallet_address,
  COUNT(pt.id) as tx_count
FROM projects p
LEFT JOIN wallets w ON w.address = p.default_wallet_address
LEFT JOIN processed_transactions pt ON pt.wallet_id = w.id
WHERE p.default_wallet_address IS NOT NULL
GROUP BY p.id, p.name, p.default_wallet_address;
```

## Next Steps

1. **Run Migration**: Execute the migration script
2. **Sync Projects**: Run the sync script for existing projects
3. **Test**: Verify the feature works with your projects
4. **Monitor**: Check database for proper population
5. **Deploy**: Deploy to production with confidence

## Files Created/Modified

### Created
- `backend/migrations/014_add_default_wallet_address.sql`
- `backend/scripts/run-default-wallet-migration.js`
- `backend/scripts/sync-project-wallets.js`
- `backend/src/services/projectWalletService.js`
- `backend/docs/DEFAULT_WALLET_ADDRESS.md`
- `backend/docs/DEFAULT_WALLET_QUICK_START.md`
- `DEFAULT_WALLET_ADDRESS_IMPLEMENTATION.md` (this file)

### Modified
- `backend/src/models/project.js` - Added default_wallet_address parameter
- `backend/src/services/onboardingService.js` - Sets default wallet during onboarding
- `backend/src/controllers/project.js` - Ensures default wallet on fetch
- `src/services/projectService.ts` - Added TypeScript type

## Support

For issues or questions:
1. Check `backend/docs/DEFAULT_WALLET_QUICK_START.md` for common scenarios
2. Review `backend/docs/DEFAULT_WALLET_ADDRESS.md` for detailed documentation
3. Check database with SQL queries in monitoring section
4. Run sync script to fix missing default wallets

---

**Status**: ✅ Complete and Ready for Testing

The implementation ensures that every project has a default Zcash wallet address that is automatically indexed from the blockchain, exactly as requested.
