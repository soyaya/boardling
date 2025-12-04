# Database Backup System

Complete backup and restore system for the Boardling platform database.

## Quick Start

### Create a Backup
```bash
# Full backup with data
bash backend/scripts/backup-database.sh

# Schema only (updates schema.sql)
bash backend/scripts/generate-schema.sh
```

### Restore from Backup
```bash
bash backend/scripts/restore-database.sh backend/backups/backup-2025-12-04_12-13-05.sql
```

## What Was Done

### 1. Backup Scripts Created

#### `backend/scripts/backup-database.sh`
- Creates full database backup with all data
- Includes tables, views, functions, triggers
- Automatically timestamped filenames
- Saves to `backend/backups/` directory

#### `backend/scripts/generate-schema.sh`
- Generates schema-only SQL (no data)
- Updates `backend/schema.sql`
- Backs up old schema to `schema.sql.backup`
- Perfect for version control

#### `backend/scripts/restore-database.sh`
- Restores database from backup file
- Includes safety confirmation prompt
- Provides clear error messages

### 2. Backup Directory Structure

```
backend/
├── backups/
│   ├── README.md                    # Backup documentation
│   ├── backup-2025-12-04_12-13-05.sql  # Full backup (74MB)
│   └── ...                          # Additional backups
├── schema.sql                       # Current schema (76KB)
├── schema.sql.backup                # Previous schema backup
└── scripts/
    ├── backup-database.sh           # Full backup script
    ├── generate-schema.sh           # Schema-only script
    └── restore-database.sh          # Restore script
```

### 3. Updated Files

- **`.gitignore`**: Added backup exclusions
  - `backend/backups/*.sql`
  - `backend/schema.sql.backup`

- **`backend/schema.sql`**: Updated to current database structure
  - All 24 tables
  - All views (weekly_cohort_retention, wallet_health_dashboard)
  - All functions
  - All triggers

### 4. Current Backup

Created initial backup:
- **File**: `backend/backups/backup-2025-12-04_12-13-05.sql`
- **Size**: 74MB
- **Contains**: Complete database with all data
- **Tables**: 24 tables including:
  - users, projects, wallets
  - invoices, withdrawals, api_keys
  - shielded_wallets, shielded_invoices
  - webzjs_wallets, devtool_wallets
  - unified_addresses, unified_invoices
  - wallet_activity_metrics, wallet_cohorts
  - wallet_productivity_scores
  - processed_transactions
  - And more...

## Database Schema Overview

### Core Tables (11)
1. `users` - User accounts
2. `projects` - User projects
3. `wallets` - Zcash wallet addresses
4. `invoices` - Payment invoices
5. `withdrawals` - User withdrawals
6. `api_keys` - API authentication
7. `shielded_wallets` - Shielded addresses
8. `shielded_invoices` - Shielded payments
9. `unified_addresses` - ZIP-316 addresses
10. `unified_invoices` - Unified payment system
11. `user_payment_preferences` - Payment settings

### Alternative Wallet Systems (4)
12. `webzjs_wallets` - Browser-based wallets
13. `webzjs_invoices` - WebZjs payments
14. `devtool_wallets` - CLI wallets
15. `devtool_invoices` - Devtool payments

### Analytics Tables (9)
16. `wallet_activity_metrics` - Daily activity
17. `wallet_cohorts` - Retention cohorts
18. `wallet_cohort_assignments` - Cohort membership
19. `wallet_adoption_stages` - Funnel tracking
20. `wallet_productivity_scores` - Health scores
21. `wallet_behavior_flows` - User journeys
22. `shielded_pool_metrics` - Privacy analytics
23. `competitive_benchmarks` - Market data
24. `ai_recommendations` - AI tasks
25. `wallet_privacy_settings` - Privacy controls
26. `processed_transactions` - Enhanced tx data

### Indexer Tables
- `address_activity` - Blockchain activity
- `blocks` - Block data
- `transactions` - Transaction data

## Usage Examples

### Before Migration
```bash
# Always backup before running migrations
bash backend/scripts/backup-database.sh
node backend/scripts/run-migration.js
```

### Before Deployment
```bash
# Backup production data
bash backend/scripts/backup-database.sh

# Update schema for version control
bash backend/scripts/generate-schema.sh
git add backend/schema.sql
git commit -m "Update database schema"
```

### After Major Changes
```bash
# If something goes wrong, restore from backup
bash backend/scripts/restore-database.sh backend/backups/backup-2025-12-04_12-13-05.sql
```

### Development Reset
```bash
# Reset to clean schema
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -f backend/schema.sql
```

## Best Practices

1. **Backup Before Changes**
   - Always backup before migrations
   - Always backup before major deployments
   - Always backup before schema changes

2. **Regular Backups**
   - Daily automated backups recommended
   - Keep backups for at least 7 days
   - Store critical backups off-site

3. **Test Restores**
   - Regularly test restore procedures
   - Verify data integrity after restore
   - Practice in non-production first

4. **Version Control**
   - Keep `schema.sql` in git
   - Never commit backup files with data
   - Document schema changes in migrations

5. **Security**
   - Backup files contain sensitive data
   - Store securely with encryption
   - Limit access to backup files
   - Never share backups publicly

## Automated Backups

### Setup Cron Job
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/boardling && bash backend/scripts/backup-database.sh >> /var/log/boardling-backup.log 2>&1
```

### Backup Rotation Script
```bash
# Keep only last 7 days of backups
find backend/backups -name "backup-*.sql" -mtime +7 -delete
```

## Troubleshooting

### "Permission denied" error
```bash
chmod +x backend/scripts/*.sh
```

### "Database does not exist" error
```bash
createdb -U $DB_USER $DB_NAME
```

### Large backup files
```bash
# Compress backups
gzip backend/backups/backup-*.sql

# Restore compressed backup
gunzip -c backup.sql.gz | psql -U $DB_USER -d $DB_NAME
```

## Files Created

1. `backend/scripts/backup-database.sh` - Full backup script
2. `backend/scripts/generate-schema.sh` - Schema generation script
3. `backend/scripts/restore-database.sh` - Restore script
4. `backend/backups/README.md` - Backup documentation
5. `backend/backups/backup-2025-12-04_12-13-05.sql` - Initial backup
6. `DATABASE_BACKUP_SYSTEM.md` - This file

## Status

✅ **COMPLETE** - Database backup system fully implemented and tested
✅ **BACKUP CREATED** - Initial 74MB backup with all data
✅ **SCHEMA UPDATED** - Current schema.sql reflects database structure
✅ **SCRIPTS TESTED** - All backup/restore scripts working
✅ **DOCUMENTATION** - Complete usage guide and best practices
