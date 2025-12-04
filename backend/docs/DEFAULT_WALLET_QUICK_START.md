# Default Wallet Address - Quick Start

## Setup (One-time)

### 1. Run Migration

```bash
cd backend
node scripts/run-default-wallet-migration.js
```

This will:
- Add `default_wallet_address` column to projects table
- Create database trigger for automatic population
- Populate existing projects with their first wallet address

### 2. Sync Existing Projects

```bash
node scripts/sync-project-wallets.js
```

This will:
- Find all projects without a default wallet address
- Set the default address from their first wallet
- Index transactions from the Zcash blockchain

## Usage

### Backend

The default wallet address is automatically handled:

```javascript
// Get a project - default wallet is automatically set if missing
const project = await getProjectById(projectId, userId);
console.log(project.default_wallet_address); // "zs1..."

// During onboarding - default wallet is set immediately
const result = await completeOnboarding(userId, {
  project: { name: "My Project", category: "defi" },
  wallet: { address: "zs1...", privacy_mode: "private" }
});
// result.project.default_wallet_address === "zs1..."
```

### Frontend

```typescript
import { useCurrentProject } from '../store/useProjectStore';

const MyComponent = () => {
  const { currentProject } = useCurrentProject();
  
  // Access default wallet address
  const walletAddress = currentProject?.default_wallet_address;
  
  return (
    <div>
      {walletAddress ? (
        <p>Default Wallet: {walletAddress}</p>
      ) : (
        <p>No wallet configured</p>
      )}
    </div>
  );
};
```

## Verification

### Check Database

```sql
-- View projects with default wallets
SELECT id, name, default_wallet_address 
FROM projects 
WHERE default_wallet_address IS NOT NULL;

-- Count projects without default wallets
SELECT COUNT(*) 
FROM projects 
WHERE default_wallet_address IS NULL;
```

### Test API

```bash
# Get project (should include default_wallet_address)
curl -X GET http://localhost:3000/api/projects/<project_id> \
  -H "Authorization: Bearer <token>"
```

## Troubleshooting

### Project has no default wallet

**Cause**: Project has no wallets added yet

**Solution**: Add a wallet to the project:

```bash
curl -X POST http://localhost:3000/api/wallets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "<project_id>",
    "address": "zs1...",
    "privacy_mode": "private",
    "network": "mainnet"
  }'
```

### Wallet not indexed

**Cause**: Indexer is not running or wallet has no transactions

**Solution**: 

1. Check indexer status:
```bash
cd backend/indexer
node start.js
```

2. Manually sync wallet:
```bash
cd backend
node scripts/sync-wallets.js
```

### Migration failed

**Cause**: Database connection issue or column already exists

**Solution**:

1. Check database connection in `.env`
2. If column exists, skip migration
3. Run sync script directly:
```bash
node scripts/sync-project-wallets.js
```

## Common Scenarios

### New Project Creation

```javascript
// 1. Create project (no default wallet yet)
const project = await createProject({
  user_id: userId,
  name: "My Project",
  category: "defi"
});

// 2. Add first wallet (trigger sets default_wallet_address automatically)
const wallet = await createWallet({
  project_id: project.id,
  address: "zs1...",
  privacy_mode: "private"
});

// 3. Fetch project again (now has default_wallet_address)
const updatedProject = await getProjectById(project.id, userId);
console.log(updatedProject.default_wallet_address); // "zs1..."
```

### Onboarding Flow

```javascript
// Everything happens in one transaction
const result = await completeOnboarding(userId, {
  project: {
    name: "My Project",
    category: "defi"
  },
  wallet: {
    address: "zs1...",
    privacy_mode: "private",
    network: "mainnet"
  }
});

// Project already has default_wallet_address set
console.log(result.project.default_wallet_address); // "zs1..."
```

### Changing Default Wallet

```javascript
// Update project with new default wallet
const result = await updateDefaultWalletAddress(
  projectId,
  userId,
  "zs1new..."
);

// New address is set and indexed
console.log(result.data.default_wallet_address); // "zs1new..."
```

## Maintenance

### Periodic Sync

Run this weekly to catch any projects that might have been missed:

```bash
# Add to cron job
0 2 * * 0 cd /path/to/backend && node scripts/sync-project-wallets.js
```

### Monitor Indexing

```sql
-- Check indexing status
SELECT 
  p.name,
  p.default_wallet_address,
  w.id as wallet_id,
  COUNT(pt.id) as tx_count,
  MAX(pt.block_timestamp) as last_tx
FROM projects p
LEFT JOIN wallets w ON w.address = p.default_wallet_address
LEFT JOIN processed_transactions pt ON pt.wallet_id = w.id
WHERE p.default_wallet_address IS NOT NULL
GROUP BY p.id, p.name, p.default_wallet_address, w.id
ORDER BY tx_count DESC;
```

## Next Steps

- Read [DEFAULT_WALLET_ADDRESS.md](./DEFAULT_WALLET_ADDRESS.md) for detailed documentation
- Check [WALLET_MANAGEMENT_IMPLEMENTATION.md](./WALLET_MANAGEMENT_IMPLEMENTATION.md) for wallet API details
- See [INDEXER_INTEGRATION.md](./INDEXER_INTEGRATION.md) for blockchain indexing information
