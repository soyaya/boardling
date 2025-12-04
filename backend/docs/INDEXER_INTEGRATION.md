# Blockchain Indexer Integration

This document describes the integration between the Boardling backend and the Zcash blockchain indexer for wallet tracking and analytics.

## Overview

The indexer integration enables real-time tracking of Zcash wallet addresses, automatically processing transactions and updating analytics metrics. The system continuously monitors tracked wallets and aggregates transaction data for analytics dashboards.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Blockchain Indexer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Zcash RPC Client (Zebra/Zaino)               │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────┴─────────────────────────────────┐   │
│  │          Transaction Parser & Processor               │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────┴─────────────────────────────────┐   │
│  │         Indexer Database (PostgreSQL)                 │   │
│  │  - blocks, transactions, inputs, outputs              │   │
│  └────────────────────┬─────────────────────────────────┘   │
└───────────────────────┼───────────────────────────────────────┘
                        │
                        │ Query Transactions
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Wallet Tracking Service                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Get Tracked Wallets from Backend DB           │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────┴─────────────────────────────────┐   │
│  │    Query Indexer for Address Transactions             │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────┴─────────────────────────────────┐   │
│  │    Process & Classify Transactions                    │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────┴─────────────────────────────────┐   │
│  │    Update Activity Metrics & Analytics                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Wallet Tracking Service

**Location:** `backend/src/services/walletTrackingService.js`

The wallet tracking service is responsible for:
- Fetching all active tracked wallets
- Querying the indexer database for new transactions
- Classifying transaction types (transfer, shielded, reward, etc.)
- Updating wallet activity metrics
- Saving processed transactions

**Key Functions:**

- `getTrackedWallets()` - Get all active wallets that need tracking
- `getAddressTransactions(address, sinceBlockHeight)` - Query indexer for address transactions
- `processWalletTransactions(wallet)` - Process transactions for a specific wallet
- `syncAllWallets()` - Sync all tracked wallets
- `getWalletSyncStatus(walletId)` - Get sync status for a wallet
- `startWalletTracking(intervalMs)` - Start continuous tracking
- `stopWalletTracking(intervalId)` - Stop tracking

### 2. Wallet Tracking API

**Location:** `backend/src/routes/walletTracking.js`

REST API endpoints for managing wallet tracking:

```
POST   /api/wallet-tracking/sync                 - Trigger sync for all wallets (admin)
POST   /api/wallet-tracking/sync/:walletId       - Trigger sync for specific wallet
GET    /api/wallet-tracking/status/:walletId     - Get wallet sync status
GET    /api/wallet-tracking/tracked              - List all tracked wallets (admin)
GET    /api/wallet-tracking/health               - Get service health status (admin)
```

### 3. Transaction Classification

Transactions are automatically classified into types and subtypes:

**Transaction Types:**
- `transfer` - Standard transparent transfers
- `shielded` - Shielded pool transactions
- `reward` - Mining/staking rewards
- `swap` - DEX swaps (future)
- `bridge` - Cross-chain bridges (future)

**Transaction Subtypes:**
- `receive` - Incoming transfer
- `send` - Outgoing transfer
- `self` - Self-transfer
- `pool_entry` - Entering shielded pool
- `pool_exit` - Exiting shielded pool
- `internal` - Internal shielded transaction
- `mining` - Mining reward

### 4. Activity Metrics

For each wallet, the system tracks daily activity metrics:

```javascript
{
  activity_date: '2025-01-15',
  transaction_count: 5,
  total_volume_zatoshi: 100000000,  // 1 ZEC
  total_fees_paid: 10000,           // 0.0001 ZEC
  transfers_count: 3,
  swaps_count: 0,
  bridges_count: 0,
  shielded_count: 2,
  is_active: true,
  is_returning: false,
  sequence_complexity_score: 15
}
```

## Configuration

### Environment Variables

Add to `backend/.env`:

```bash
# Wallet Tracking Configuration
WALLET_SYNC_INTERVAL_MS=300000        # Sync every 5 minutes
ENABLE_INDEXER_EVENTS=false           # Enable event-based sync (requires indexer in same process)
INDEXER_DB_HOST=localhost
INDEXER_DB_PORT=5432
INDEXER_DB_NAME=broadlypaywall
INDEXER_DB_USER=postgres
INDEXER_DB_PASS=admin
```

### Event-Based Sync

The integration supports two modes of operation:

1. **Polling Mode (Default)**: Periodically syncs all wallets at configured intervals
2. **Event-Based Mode**: Listens to indexer events and syncs when new blocks are processed

Event-based mode is more efficient but requires the indexer to run in the same process or use a message queue.

### Database Setup

The indexer and backend share the same PostgreSQL database. Ensure these tables exist:

**Indexer Tables:**
- `blocks` - Blockchain blocks
- `transactions` - All transactions
- `inputs` - Transaction inputs
- `outputs` - Transaction outputs
- `addresses` - Address registry

**Backend Analytics Tables:**
- `wallets` - Tracked wallet addresses
- `processed_transactions` - Processed transaction records
- `wallet_activity_metrics` - Daily activity aggregations

## Usage

### Automatic Tracking

The wallet tracking service starts automatically when the backend server starts:

```javascript
// In app.js
startWalletTracking(syncInterval)
  .then(() => console.log('Wallet tracking service started'))
  .catch(err => console.error('Failed to start:', err.message));
```

### Event-Based Tracking (Optional)

If the indexer is running in the same process, you can enable event-based tracking:

```javascript
import { blockchainEvents } from './indexer/indexer.js';
import { startIndexerEventListener } from './src/services/indexerEventHandler.js';

// Start event listener
startIndexerEventListener(blockchainEvents, {
  enableBlockEvents: true,
  enableTransactionEvents: false,
  blockEventThrottle: 5000  // Throttle to max 1 sync per 5 seconds
});
```

This will trigger wallet syncs automatically when new blocks are processed, reducing latency and improving efficiency.

### Manual Sync

Trigger a manual sync using the script:

```bash
# Sync all wallets
node backend/scripts/sync-wallets.js

# Sync specific wallet
node backend/scripts/sync-wallets.js <wallet-id>
```

### API Usage

**Trigger Manual Sync (Admin):**
```bash
curl -X POST http://localhost:3001/api/wallet-tracking/sync \
  -H "Authorization: Bearer <admin-token>"
```

**Get Wallet Status:**
```bash
curl http://localhost:3001/api/wallet-tracking/status/<wallet-id> \
  -H "Authorization: Bearer <token>"
```

**Check Service Health (Admin):**
```bash
curl http://localhost:3001/api/wallet-tracking/health \
  -H "Authorization: Bearer <admin-token>"
```

**Check Event Listener Status (Admin):**
```bash
curl http://localhost:3001/api/wallet-tracking/events/status \
  -H "Authorization: Bearer <admin-token>"
```

## Transaction Processing Flow

1. **Fetch Tracked Wallets**
   - Query backend database for active wallets
   - Get wallet addresses and last processed block height

2. **Query Indexer**
   - For each wallet address, query indexer database
   - Fetch transactions since last processed block
   - Include both inputs and outputs

3. **Classify Transactions**
   - Determine transaction type (transfer, shielded, reward)
   - Calculate net value (received - sent)
   - Identify counterparty addresses
   - Detect shielded pool entry/exit

4. **Save Processed Transactions**
   - Store in `processed_transactions` table
   - Include classification and metadata
   - Track block height for incremental sync

5. **Update Activity Metrics**
   - Aggregate transactions by date
   - Calculate daily metrics (count, volume, fees)
   - Update `wallet_activity_metrics` table
   - Mark wallet as active

6. **Update Analytics**
   - Recalculate productivity scores
   - Update adoption stage progress
   - Refresh cohort assignments
   - Update dashboard metrics

## Error Handling

The service includes robust error handling:

- **Connection Errors:** Retry with exponential backoff
- **Transaction Errors:** Log and continue with next transaction
- **Wallet Errors:** Log and continue with next wallet
- **Database Errors:** Rollback transaction and retry

Errors are logged but don't stop the sync process for other wallets.

## Performance Considerations

### Optimization Strategies

1. **Incremental Sync**
   - Only fetch transactions since last processed block
   - Reduces database queries and processing time

2. **Batch Processing**
   - Process multiple transactions in single database transaction
   - Aggregate metrics before writing to database

3. **Connection Pooling**
   - Separate connection pools for backend and indexer databases
   - Reuse connections across sync cycles

4. **Rate Limiting**
   - Small delay between wallet processing (100ms)
   - Prevents overwhelming the database

5. **Caching**
   - Cache wallet list between sync cycles
   - Cache address type detection results

### Monitoring

Monitor these metrics:

- **Sync Duration:** Time to complete full sync
- **Transactions Processed:** Count per sync cycle
- **Error Rate:** Failed transactions/wallets
- **Database Load:** Query performance and connection usage
- **Lag:** Time between blockchain and processed data

## Testing

Run the integration tests:

```bash
node backend/tests/test-indexer-integration.js
```

Tests cover:
- Fetching tracked wallets
- Querying address transactions
- Processing wallet transactions
- Updating activity metrics
- Sync status retrieval
- Full wallet sync

## Troubleshooting

### No Transactions Found

**Problem:** Wallet sync reports 0 transactions

**Solutions:**
1. Verify indexer is running and synced
2. Check wallet address is correct
3. Confirm address has on-chain activity
4. Verify database connection to indexer

### Sync Taking Too Long

**Problem:** Wallet sync is slow

**Solutions:**
1. Increase `WALLET_SYNC_INTERVAL_MS`
2. Add database indexes on frequently queried columns
3. Reduce number of tracked wallets
4. Optimize transaction classification logic

### Missing Activity Metrics

**Problem:** Activity metrics not updating

**Solutions:**
1. Check `processed_transactions` table for data
2. Verify `createActivityMetric` function is called
3. Check for database constraint violations
4. Review error logs for failed metric updates

### Indexer Database Connection Failed

**Problem:** Cannot connect to indexer database

**Solutions:**
1. Verify `INDEXER_DB_*` environment variables
2. Check PostgreSQL is running
3. Confirm database credentials
4. Test connection with `psql` command

## Future Enhancements

1. **Real-time Updates**
   - WebSocket connection to indexer
   - Push notifications for new transactions
   - Live dashboard updates

2. **Advanced Classification**
   - Machine learning for transaction type detection
   - Smart contract interaction analysis
   - DeFi protocol identification

3. **Performance Optimization**
   - Parallel wallet processing
   - Distributed sync across multiple workers
   - Redis caching layer

4. **Enhanced Monitoring**
   - Prometheus metrics export
   - Grafana dashboards
   - Alert system for sync failures

## Related Documentation

- [Wallet Management](./WALLET_MANAGEMENT_IMPLEMENTATION.md)
- [Analytics API](./ANALYTICS_API_ENDPOINTS.md)
- [Privacy Enforcement](./PRIVACY_ENFORCEMENT_SERVICE.md)
- [Dashboard Analytics](./DASHBOARD_ANALYTICS_IMPLEMENTATION.md)
