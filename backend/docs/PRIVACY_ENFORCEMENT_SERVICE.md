# Privacy Enforcement Service

## Overview

The Privacy Enforcement Service provides comprehensive privacy controls for wallet analytics data in the Boardling platform. It implements immediate privacy mode updates, data anonymization, and monetizable data access control.

## Requirements

- **Requirement 8.1**: Private mode data exclusion
- **Requirement 8.2**: Public mode anonymization  
- **Requirement 8.3**: Monetizable data access control
- **Requirement 8.4**: Immediate privacy mode updates

## Privacy Modes

### Private Mode
- **Access**: Only wallet owner can view data
- **Data Level**: Full detailed data
- **Use Case**: Users who want complete privacy
- **Enforcement**: Data excluded from all public queries and comparisons

### Public Mode
- **Access**: All users can view anonymized data
- **Data Level**: Anonymized aggregate statistics
- **Use Case**: Users who want to contribute to ecosystem insights
- **Enforcement**: Identifying information removed, only behavioral metrics shared

### Monetizable Mode
- **Access**: Available for purchase by other users
- **Data Level**: Anonymized aggregate statistics (after payment)
- **Use Case**: Users who want to earn from their analytics data
- **Enforcement**: Payment required for access, 70/30 revenue split

## Service Methods

### Privacy Mode Checking

#### `checkPrivacyMode(walletId)`
Returns the current privacy mode for a wallet.

```javascript
const mode = await privacyService.checkPrivacyMode(walletId);
// Returns: 'private' | 'public' | 'monetizable'
```

#### `filterWalletsByPrivacy(walletIds, allowedModes)`
Filters a list of wallet IDs based on privacy mode.

```javascript
const publicWallets = await privacyService.filterWalletsByPrivacy(
  allWalletIds,
  ['public', 'monetizable']
);
```

### Data Anonymization

#### `anonymizeWalletData(walletData)`
Removes identifying information from wallet data.

**Removed Fields:**
- `id`, `wallet_id`
- `address`
- `project_id`, `user_id`

**Preserved Fields:**
- `wallet_type`
- Behavioral metrics (active_days, transaction_count, etc.)

```javascript
const anonymized = privacyService.anonymizeWalletData(rawData);
// Returns anonymized data with metrics only
```

#### `anonymizeWalletDataBatch(walletDataArray)`
Anonymizes multiple wallet records at once.

```javascript
const anonymizedBatch = privacyService.anonymizeWalletDataBatch(walletArray);
```

### Monetizable Access Control

#### `checkMonetizableAccess(walletId, requesterId)`
Determines if a user can access monetizable wallet data.

**Access Rules:**
1. Owner always has full access
2. Private wallets deny all non-owner access
3. Public wallets allow anonymized access to all
4. Monetizable wallets require payment for non-owners

```javascript
const access = await privacyService.checkMonetizableAccess(walletId, userId);
// Returns: { allowed, reason, requiresPayment, dataLevel }
```

**Response Structure:**
```javascript
{
  allowed: boolean,           // Whether access is granted
  reason: string,             // Explanation for decision
  requiresPayment: boolean,   // Whether payment is needed
  dataLevel: 'full' | 'anonymized' | null
}
```

#### `checkPaidAccess(walletId, requesterId)`
Checks if a user has paid for access to monetizable data.

```javascript
const hasPaid = await privacyService.checkPaidAccess(walletId, userId);
// Returns: boolean
```

### Privacy Mode Updates

#### `updatePrivacyMode(walletId, newPrivacyMode, userId)`
Updates privacy mode with immediate enforcement.

**Features:**
- Validates user ownership
- Updates database immediately
- Creates audit log entry
- Clears cached data

```javascript
const updated = await privacyService.updatePrivacyMode(
  walletId,
  'public',
  userId
);
```

#### `batchUpdatePrivacyMode(walletIds, newPrivacyMode, userId)`
Updates privacy mode for multiple wallets at once.

```javascript
const updated = await privacyService.batchUpdatePrivacyMode(
  [wallet1Id, wallet2Id],
  'monetizable',
  userId
);
```

### Privacy Statistics

#### `getPrivacyStats(projectId)`
Returns privacy mode distribution for a project.

```javascript
const stats = await privacyService.getPrivacyStats(projectId);
// Returns: { private: 5, public: 3, monetizable: 2, total: 10 }
```

### Audit Logging

#### `getPrivacyAuditLog(walletId, limit)`
Retrieves privacy change history for a wallet.

```javascript
const history = await privacyService.getPrivacyAuditLog(walletId, 50);
// Returns array of audit log entries
```

**Audit Log Entry:**
```javascript
{
  id: 'uuid',
  wallet_id: 'uuid',
  privacy_mode: 'public',
  changed_by: 'user-uuid',
  changed_at: '2024-01-15T10:30:00Z'
}
```

### Privacy Transition Validation

#### `validatePrivacyTransition(currentMode, newMode)`
Validates if a privacy mode transition is allowed.

```javascript
const validation = privacyService.validatePrivacyTransition('private', 'monetizable');
// Returns: { valid: true, requiresSetup: true, message: '...' }
```

## Usage Examples

### Example 1: Filtering Analytics Query by Privacy

```javascript
import PrivacyEnforcementService from './services/privacyEnforcementService.js';

const privacyService = new PrivacyEnforcementService();

// Get all wallets for a project
const allWallets = await getProjectWallets(projectId);
const walletIds = allWallets.map(w => w.id);

// Filter to only public and monetizable wallets
const publicWalletIds = await privacyService.filterWalletsByPrivacy(
  walletIds,
  ['public', 'monetizable']
);

// Query analytics only for public wallets
const analytics = await getAnalytics(publicWalletIds);
```

### Example 2: Anonymizing Data for Public Display

```javascript
// Get wallet data
const walletData = await getWalletAnalytics(walletId);

// Check privacy mode
const mode = await privacyService.checkPrivacyMode(walletId);

if (mode === 'public' || mode === 'monetizable') {
  // Anonymize before displaying
  const anonymized = privacyService.anonymizeWalletData(walletData);
  return anonymized;
} else {
  // Private wallet - deny access
  throw new Error('Access denied');
}
```

### Example 3: Checking Monetizable Access

```javascript
// User wants to view another user's monetizable data
const access = await privacyService.checkMonetizableAccess(
  walletId,
  requestingUserId
);

if (!access.allowed) {
  if (access.requiresPayment) {
    // Show payment prompt
    return {
      error: 'Payment required',
      message: access.reason,
      paymentRequired: true
    };
  } else {
    // Access denied
    return {
      error: 'Access denied',
      message: access.reason
    };
  }
}

// Access granted - return data at appropriate level
if (access.dataLevel === 'full') {
  return await getFullWalletData(walletId);
} else {
  const data = await getWalletData(walletId);
  return privacyService.anonymizeWalletData(data);
}
```

### Example 4: Updating Privacy Mode

```javascript
// User wants to change wallet privacy mode
try {
  const updated = await privacyService.updatePrivacyMode(
    walletId,
    'monetizable',
    userId
  );
  
  console.log('Privacy mode updated:', updated.privacy_mode);
  
  // Get audit history
  const history = await privacyService.getPrivacyAuditLog(walletId);
  console.log('Privacy changes:', history);
  
} catch (error) {
  console.error('Failed to update privacy mode:', error.message);
}
```

### Example 5: Batch Privacy Update

```javascript
// Update all project wallets to public mode
const projectWallets = await getProjectWallets(projectId);
const walletIds = projectWallets.map(w => w.id);

const updated = await privacyService.batchUpdatePrivacyMode(
  walletIds,
  'public',
  userId
);

console.log(`Updated ${updated.length} wallets to public mode`);
```

## Integration with Analytics Endpoints

### Dashboard Analytics
```javascript
// In analytics controller
async function getDashboardAnalytics(req, res) {
  const { projectId } = req.params;
  const userId = req.user.id;
  
  // Get project wallets
  const wallets = await getProjectWallets(projectId);
  const walletIds = wallets.map(w => w.id);
  
  // Filter by privacy (exclude private wallets for non-owners)
  const privacyService = new PrivacyEnforcementService();
  const publicWalletIds = await privacyService.filterWalletsByPrivacy(
    walletIds,
    ['public', 'monetizable']
  );
  
  // Get analytics for public wallets
  const analytics = await getAnalytics(publicWalletIds);
  
  // Anonymize data
  const anonymized = privacyService.anonymizeWalletDataBatch(analytics);
  
  res.json({ data: anonymized });
}
```

### Comparison Analytics (Privacy-Gated)
```javascript
async function getComparisonAnalytics(req, res) {
  const { projectId } = req.params;
  const userId = req.user.id;
  
  // Get user's wallets
  const userWallets = await getUserWallets(userId);
  
  // Check if user has any public or monetizable wallets
  const privacyService = new PrivacyEnforcementService();
  const publicWallets = await privacyService.filterWalletsByPrivacy(
    userWallets.map(w => w.id),
    ['public', 'monetizable']
  );
  
  if (publicWallets.length === 0) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You must have at least one public or monetizable wallet to access comparison data'
    });
  }
  
  // User has public data - allow access to comparison
  const comparison = await getComparisonData(projectId);
  res.json(comparison);
}
```

## Database Schema

### Wallets Table
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('t', 'z', 'u')),
  privacy_mode TEXT NOT NULL DEFAULT 'private' 
    CHECK (privacy_mode IN ('private', 'public', 'monetizable')),
  description TEXT,
  network TEXT NOT NULL DEFAULT 'mainnet',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Privacy Audit Log Table
```sql
CREATE TABLE wallet_privacy_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  privacy_mode TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Testing

### Unit Tests
- Privacy mode checking
- Data anonymization
- Access control logic
- Privacy transition validation

### Integration Tests
- Database operations
- Immediate enforcement
- Audit logging
- Batch operations

### Property-Based Tests
See `backend/tests/property/privacy-properties.test.js` for property-based tests that verify:
- Property 31: Private mode data exclusion
- Property 32: Public mode anonymization
- Property 33: Monetizable mode availability
- Property 34: Immediate privacy enforcement

## Error Handling

### Common Errors

**Wallet Not Found**
```javascript
throw new Error('Wallet not found: {walletId}');
```

**Invalid Privacy Mode**
```javascript
throw new Error('Invalid privacy mode. Must be one of: private, public, monetizable');
```

**Access Denied**
```javascript
throw new Error('Wallet not found or access denied');
```

**Unauthorized Update**
```javascript
throw new Error('Some wallets not found or access denied');
```

## Performance Considerations

### Caching
- Privacy mode checks are cached (when cache is implemented)
- Cache is invalidated immediately on privacy mode updates
- Audit logs are written asynchronously

### Batch Operations
- Use `batchUpdatePrivacyMode` for multiple wallets
- Use `filterWalletsByPrivacy` instead of individual checks
- Use `anonymizeWalletDataBatch` for multiple records

### Query Optimization
- Privacy filters use indexed columns
- Audit logs use wallet_id index
- Batch operations use array parameters

## Security Considerations

1. **Ownership Verification**: Always verify user owns wallet before updates
2. **Immediate Enforcement**: Privacy changes take effect immediately
3. **Audit Trail**: All privacy changes are logged with user ID
4. **Data Anonymization**: Identifying information is completely removed
5. **Payment Verification**: Monetizable access requires paid invoice

## Future Enhancements

1. **Time-Limited Access**: Monetizable access expires after period
2. **Granular Permissions**: Different data levels for different payment tiers
3. **Privacy Presets**: Quick privacy mode templates
4. **Bulk Export**: Privacy-aware data export functionality
5. **Privacy Analytics**: Dashboard showing privacy mode distribution and trends
