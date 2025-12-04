# Default Wallet Address Feature

## Overview

The default wallet address feature ensures that every project has a primary Zcash address that is automatically indexed from the blockchain. This address is used for receiving payments, tracking transactions, and analytics.

## Database Schema

### Projects Table

```sql
ALTER TABLE projects 
ADD COLUMN default_wallet_address VARCHAR(255);

CREATE INDEX idx_projects_default_wallet 
ON projects(default_wallet_address) 
WHERE default_wallet_address IS NOT NULL;
```

### Automatic Population

A database trigger automatically sets the `default_wallet_address` when the first wallet is added to a project:

```sql
CREATE TRIGGER trigger_set_default_wallet_address
AFTER INSERT ON wallets
FOR EACH ROW
EXECUTE FUNCTION set_default_wallet_address();
```

## API Endpoints

### Get Project (with default wallet)

```http
GET /api/projects/:id
Authorization: Bearer <token>
```

**Response:**
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

The endpoint automatically:
1. Checks if `default_wallet_address` is set
2. If not, fetches the first wallet from the database
3. Updates the project with the wallet address
4. Indexes the wallet from the Zcash blockchain

### Get All Projects

```http
GET /api/projects
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Project 1",
      "default_wallet_address": "zs1...",
      ...
    }
  ]
}
```

Projects without a default wallet address are automatically processed in the background.

## Services

### projectWalletService.js

#### ensureDefaultWalletAddress(projectId)

Ensures a project has a default wallet address set and indexed.

```javascript
import { ensureDefaultWalletAddress } from '../services/projectWalletService.js';

const result = await ensureDefaultWalletAddress(projectId);
// {
//   success: true,
//   project: { ... },
//   wallet: { ... },
//   message: 'Default wallet address set and indexed'
// }
```

#### getProjectWithDefaultWallet(projectId, userId)

Gets a project and ensures its default wallet is set.

```javascript
import { getProjectWithDefaultWallet } from '../services/projectWalletService.js';

const result = await getProjectWithDefaultWallet(projectId, userId);
// {
//   success: true,
//   data: { ... }
// }
```

#### updateDefaultWalletAddress(projectId, userId, walletAddress)

Updates the default wallet address for a project.

```javascript
import { updateDefaultWalletAddress } from '../services/projectWalletService.js';

const result = await updateDefaultWalletAddress(projectId, userId, 'zs1...');
// {
//   success: true,
//   data: { ... }
// }
```

#### syncAllProjectDefaultWallets()

Syncs all projects that don't have a default wallet address.

```javascript
import { syncAllProjectDefaultWallets } from '../services/projectWalletService.js';

const result = await syncAllProjectDefaultWallets();
// {
//   success: true,
//   total: 10,
//   synced: 8,
//   results: [...]
// }
```

## Blockchain Indexing

When a default wallet address is set, the system automatically:

1. **Fetches transactions** from the Zcash blockchain indexer
2. **Processes transactions** and stores them in the database
3. **Updates analytics** including:
   - Transaction count
   - Total volume
   - Fee metrics
   - Shielded transaction statistics
   - Daily activity metrics

This is handled by the `walletTrackingService.processWalletTransactions()` function.

## Migration

### Run Migration

```bash
# Run the migration to add the column
node backend/scripts/run-default-wallet-migration.js

# Sync existing projects
node backend/scripts/sync-project-wallets.js
```

### Migration Steps

1. Adds `default_wallet_address` column to projects table
2. Creates index for faster lookups
3. Populates existing projects with their first wallet address
4. Creates trigger for automatic population on new wallets

## Onboarding Flow

During onboarding, the default wallet address is set immediately when creating a project:

```javascript
// In onboardingService.js
const projectResult = await client.query(
  `INSERT INTO projects (..., default_wallet_address)
   VALUES (..., $7)
   RETURNING *`,
  [..., walletData.address.trim()]
);
```

## Frontend Integration

### TypeScript Interface

```typescript
export interface Project {
  id: string;
  name: string;
  default_wallet_address: string | null;
  // ... other fields
}
```

### Usage in Components

```typescript
import { useCurrentProject } from '../store/useProjectStore';

const Dashboard = () => {
  const { currentProject } = useCurrentProject();
  
  if (currentProject?.default_wallet_address) {
    // Use the default wallet address
    console.log('Default wallet:', currentProject.default_wallet_address);
  }
};
```

## Error Handling

The system gracefully handles cases where:

- **No wallets exist**: Returns success but doesn't set address
- **Indexing fails**: Logs warning but doesn't fail the operation
- **Invalid address**: Validation occurs before setting

## Performance Considerations

1. **Lazy Loading**: Wallet indexing happens asynchronously
2. **Caching**: Projects are cached in the frontend store
3. **Background Processing**: Bulk syncs run in background
4. **Indexed Queries**: Database index on `default_wallet_address`

## Testing

### Test Default Wallet Assignment

```bash
# Create a project and wallet
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project", "category": "defi"}'

# Add a wallet
curl -X POST http://localhost:3000/api/wallets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "<project_id>", "address": "zs1..."}'

# Verify default wallet is set
curl -X GET http://localhost:3000/api/projects/<project_id> \
  -H "Authorization: Bearer <token>"
```

### Test Indexing

```bash
# Check wallet transactions
curl -X GET http://localhost:3000/api/analytics/dashboard/<project_id> \
  -H "Authorization: Bearer <token>"
```

## Monitoring

### Check Sync Status

```sql
-- Projects without default wallet
SELECT COUNT(*) 
FROM projects 
WHERE default_wallet_address IS NULL
AND EXISTS (SELECT 1 FROM wallets WHERE project_id = projects.id);

-- Projects with default wallet
SELECT COUNT(*) 
FROM projects 
WHERE default_wallet_address IS NOT NULL;
```

### Verify Indexing

```sql
-- Check indexed transactions
SELECT 
  p.name,
  p.default_wallet_address,
  COUNT(pt.id) as transaction_count
FROM projects p
LEFT JOIN wallets w ON w.address = p.default_wallet_address
LEFT JOIN processed_transactions pt ON pt.wallet_id = w.id
GROUP BY p.id, p.name, p.default_wallet_address;
```

## Troubleshooting

### Project has no default wallet

```bash
# Manually sync a specific project
node -e "
import { ensureDefaultWalletAddress } from './backend/src/services/projectWalletService.js';
await ensureDefaultWalletAddress('<project_id>');
"
```

### Wallet not indexed

```bash
# Manually index a wallet
node backend/scripts/sync-wallets.js
```

### Trigger not working

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_set_default_wallet_address';

-- Recreate trigger if needed
DROP TRIGGER IF EXISTS trigger_set_default_wallet_address ON wallets;
-- Then run migration again
```

## Best Practices

1. **Always check** if `default_wallet_address` exists before using it
2. **Handle null values** gracefully in the UI
3. **Don't block** user operations on indexing failures
4. **Log warnings** for debugging but don't fail requests
5. **Run sync scripts** periodically to catch any missed projects

## Future Enhancements

- [ ] Allow users to manually select default wallet
- [ ] Support multiple default wallets per network
- [ ] Real-time indexing via WebSocket
- [ ] Wallet health monitoring
- [ ] Automatic wallet rotation for load balancing
