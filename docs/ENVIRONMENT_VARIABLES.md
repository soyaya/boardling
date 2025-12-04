# Environment Variables Documentation

## Overview

This document describes all environment variables used in the Boardling platform. Environment variables are used to configure the application for different environments (development, staging, production).

## Table of Contents

1. [Backend API Variables](#backend-api-variables)
2. [Blockchain Indexer Variables](#blockchain-indexer-variables)
3. [Frontend Variables](#frontend-variables)
4. [Security Best Practices](#security-best-practices)

---

## Backend API Variables

### Server Configuration

#### `NODE_ENV`
- **Description**: Application environment
- **Type**: String
- **Values**: `development`, `staging`, `production`
- **Default**: `development`
- **Required**: Yes
- **Example**: `NODE_ENV=production`

#### `PORT`
- **Description**: Port number for the API server
- **Type**: Number
- **Default**: `3000`
- **Required**: No
- **Example**: `PORT=3000`

#### `HOST`
- **Description**: Host address to bind the server
- **Type**: String
- **Default**: `localhost`
- **Required**: No
- **Example**: `HOST=0.0.0.0`

---

### Database Configuration

#### `DB_HOST`
- **Description**: PostgreSQL database host
- **Type**: String
- **Default**: `localhost`
- **Required**: Yes
- **Example**: `DB_HOST=localhost`

#### `DB_PORT`
- **Description**: PostgreSQL database port
- **Type**: Number
- **Default**: `5432`
- **Required**: No
- **Example**: `DB_PORT=5432`

#### `DB_USER`
- **Description**: PostgreSQL database username
- **Type**: String
- **Required**: Yes
- **Example**: `DB_USER=boardling_user`

#### `DB_PASS`
- **Description**: PostgreSQL database password
- **Type**: String
- **Required**: Yes
- **Security**: Store securely, never commit to version control
- **Example**: `DB_PASS=your_secure_password_here`

#### `DB_NAME`
- **Description**: PostgreSQL database name
- **Type**: String
- **Default**: `boardling`
- **Required**: Yes
- **Example**: `DB_NAME=boardling`

#### `DB_SSL`
- **Description**: Enable SSL for database connections
- **Type**: Boolean
- **Default**: `false`
- **Required**: No
- **Example**: `DB_SSL=true`
- **Note**: Set to `true` in production

#### `DB_MAX_CONNECTIONS`
- **Description**: Maximum number of database connections in pool
- **Type**: Number
- **Default**: `20`
- **Required**: No
- **Example**: `DB_MAX_CONNECTIONS=50`

---

### JWT Configuration

#### `JWT_SECRET`
- **Description**: Secret key for signing JWT tokens
- **Type**: String
- **Required**: Yes
- **Security**: Must be a long, random string. Never commit to version control
- **Example**: `JWT_SECRET=your_very_long_random_secret_key_at_least_32_characters`
- **Generation**: `openssl rand -base64 32`

#### `JWT_EXPIRES_IN`
- **Description**: JWT token expiration time
- **Type**: String (time format)
- **Default**: `1h`
- **Required**: No
- **Example**: `JWT_EXPIRES_IN=1h`
- **Valid formats**: `60s`, `5m`, `1h`, `7d`

#### `JWT_REFRESH_EXPIRES_IN`
- **Description**: Refresh token expiration time
- **Type**: String (time format)
- **Default**: `7d`
- **Required**: No
- **Example**: `JWT_REFRESH_EXPIRES_IN=30d`

---

### Zcash RPC Configuration

#### `ZCASH_RPC_URL`
- **Description**: Zcash RPC endpoint URL
- **Type**: String (URL)
- **Required**: Yes
- **Examples**:
  - Local Zebra: `http://localhost:8232`
  - Local Zaino: `http://localhost:8233`
  - Public RPC: `https://zcash-mainnet.chainstacklabs.com`
- **Example**: `ZCASH_RPC_URL=http://localhost:8233`

#### `ZCASH_RPC_USER`
- **Description**: Zcash RPC username
- **Type**: String
- **Required**: Depends on RPC configuration
- **Example**: `ZCASH_RPC_USER=your_rpc_username`
- **Note**: Not required for Zaino or public RPCs

#### `ZCASH_RPC_PASS`
- **Description**: Zcash RPC password
- **Type**: String
- **Required**: Depends on RPC configuration
- **Security**: Store securely
- **Example**: `ZCASH_RPC_PASS=your_rpc_password`
- **Note**: Not required for Zaino or public RPCs

#### `ZCASH_NETWORK`
- **Description**: Zcash network to use
- **Type**: String
- **Values**: `mainnet`, `testnet`
- **Default**: `mainnet`
- **Required**: No
- **Example**: `ZCASH_NETWORK=mainnet`

---

### Platform Configuration

#### `PLATFORM_TREASURY_ADDRESS`
- **Description**: Zcash address for platform fee collection
- **Type**: String (Zcash address)
- **Required**: Yes
- **Example**: `PLATFORM_TREASURY_ADDRESS=t1YourTreasuryAddressHere`
- **Note**: Must be a valid Zcash address (t, z, or u)

#### `PLATFORM_FEE_PERCENTAGE`
- **Description**: Platform fee percentage for data monetization
- **Type**: Number (0-100)
- **Default**: `30`
- **Required**: No
- **Example**: `PLATFORM_FEE_PERCENTAGE=30`
- **Note**: 30 means platform takes 30%, data owner gets 70%

#### `WITHDRAWAL_FEE_ZEC`
- **Description**: Fixed fee for withdrawal processing
- **Type**: Number (ZEC)
- **Default**: `0.0005`
- **Required**: No
- **Example**: `WITHDRAWAL_FEE_ZEC=0.0005`

#### `MINIMUM_WITHDRAWAL_ZEC`
- **Description**: Minimum withdrawal amount
- **Type**: Number (ZEC)
- **Default**: `0.01`
- **Required**: No
- **Example**: `MINIMUM_WITHDRAWAL_ZEC=0.01`

---

### Email Configuration (SMTP)

#### `SMTP_HOST`
- **Description**: SMTP server hostname
- **Type**: String
- **Required**: Yes (if email enabled)
- **Example**: `SMTP_HOST=smtp.gmail.com`

#### `SMTP_PORT`
- **Description**: SMTP server port
- **Type**: Number
- **Default**: `587`
- **Required**: No
- **Example**: `SMTP_PORT=587`
- **Common ports**: 25 (unencrypted), 587 (TLS), 465 (SSL)

#### `SMTP_SECURE`
- **Description**: Use SSL/TLS for SMTP
- **Type**: Boolean
- **Default**: `false`
- **Required**: No
- **Example**: `SMTP_SECURE=false`
- **Note**: Use `false` for port 587 (STARTTLS), `true` for port 465 (SSL)

#### `SMTP_USER`
- **Description**: SMTP authentication username
- **Type**: String
- **Required**: Yes (if email enabled)
- **Example**: `SMTP_USER=your-email@gmail.com`

#### `SMTP_PASS`
- **Description**: SMTP authentication password
- **Type**: String
- **Required**: Yes (if email enabled)
- **Security**: Store securely, use app-specific passwords
- **Example**: `SMTP_PASS=your_app_specific_password`

#### `EMAIL_FROM`
- **Description**: Default "from" email address
- **Type**: String (email)
- **Required**: Yes (if email enabled)
- **Example**: `EMAIL_FROM=noreply@boardling.com`

#### `EMAIL_FROM_NAME`
- **Description**: Default "from" name
- **Type**: String
- **Default**: `Boardling`
- **Required**: No
- **Example**: `EMAIL_FROM_NAME=Boardling Platform`

---

### CORS Configuration

#### `CORS_ORIGIN`
- **Description**: Allowed CORS origins
- **Type**: String (comma-separated URLs)
- **Required**: Yes
- **Example**: `CORS_ORIGIN=https://boardling.com,https://www.boardling.com`
- **Development**: `CORS_ORIGIN=http://localhost:5173`

#### `CORS_CREDENTIALS`
- **Description**: Allow credentials in CORS requests
- **Type**: Boolean
- **Default**: `true`
- **Required**: No
- **Example**: `CORS_CREDENTIALS=true`

---

### Rate Limiting

#### `RATE_LIMIT_WINDOW_MS`
- **Description**: Rate limit time window in milliseconds
- **Type**: Number
- **Default**: `60000` (1 minute)
- **Required**: No
- **Example**: `RATE_LIMIT_WINDOW_MS=60000`

#### `RATE_LIMIT_MAX_REQUESTS`
- **Description**: Maximum requests per window
- **Type**: Number
- **Default**: `100`
- **Required**: No
- **Example**: `RATE_LIMIT_MAX_REQUESTS=100`

#### `RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS`
- **Description**: Only count failed requests
- **Type**: Boolean
- **Default**: `false`
- **Required**: No
- **Example**: `RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false`

---

### Logging Configuration

#### `LOG_LEVEL`
- **Description**: Logging level
- **Type**: String
- **Values**: `error`, `warn`, `info`, `debug`, `trace`
- **Default**: `info`
- **Required**: No
- **Example**: `LOG_LEVEL=info`

#### `LOG_FILE`
- **Description**: Path to log file
- **Type**: String (file path)
- **Required**: No
- **Example**: `LOG_FILE=/var/log/boardling/app.log`
- **Note**: If not set, logs only to console

#### `LOG_FORMAT`
- **Description**: Log output format
- **Type**: String
- **Values**: `json`, `text`
- **Default**: `json`
- **Required**: No
- **Example**: `LOG_FORMAT=json`

---

### Cache Configuration

#### `CACHE_TTL_SECONDS`
- **Description**: Default cache time-to-live in seconds
- **Type**: Number
- **Default**: `300` (5 minutes)
- **Required**: No
- **Example**: `CACHE_TTL_SECONDS=300`

#### `CACHE_ENABLED`
- **Description**: Enable caching
- **Type**: Boolean
- **Default**: `true`
- **Required**: No
- **Example**: `CACHE_ENABLED=true`

#### `REDIS_URL`
- **Description**: Redis connection URL (if using Redis for caching)
- **Type**: String (URL)
- **Required**: No (uses in-memory cache if not set)
- **Example**: `REDIS_URL=redis://localhost:6379`

---

### Feature Flags

#### `ENABLE_EMAIL_VERIFICATION`
- **Description**: Require email verification on registration
- **Type**: Boolean
- **Default**: `false`
- **Required**: No
- **Example**: `ENABLE_EMAIL_VERIFICATION=true`

#### `ENABLE_TWO_FACTOR`
- **Description**: Enable two-factor authentication
- **Type**: Boolean
- **Default**: `false`
- **Required**: No
- **Example**: `ENABLE_TWO_FACTOR=false`

#### `ENABLE_WEBHOOKS`
- **Description**: Enable webhook functionality
- **Type**: Boolean
- **Default**: `false`
- **Required**: No
- **Example**: `ENABLE_WEBHOOKS=false`

#### `ENABLE_API_KEYS`
- **Description**: Enable API key authentication
- **Type**: Boolean
- **Default**: `true`
- **Required**: No
- **Example**: `ENABLE_API_KEYS=true`

---

## Blockchain Indexer Variables

### Database Configuration

Same as Backend API database variables:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`

### Zcash RPC Configuration

Same as Backend API Zcash variables:
- `ZCASH_RPC_URL`
- `ZCASH_RPC_USER`
- `ZCASH_RPC_PASS`
- `ZCASH_NETWORK`

### Indexer-Specific Configuration

#### `START_BLOCK`
- **Description**: Block height to start indexing from
- **Type**: Number
- **Default**: `0`
- **Required**: No
- **Example**: `START_BLOCK=2000000`
- **Note**: Set to current block height for faster initial sync

#### `BATCH_SIZE`
- **Description**: Number of blocks to process in each batch
- **Type**: Number
- **Default**: `100`
- **Required**: No
- **Example**: `BATCH_SIZE=100`

#### `SYNC_INTERVAL_MS`
- **Description**: Interval between sync checks in milliseconds
- **Type**: Number
- **Default**: `10000` (10 seconds)
- **Required**: No
- **Example**: `SYNC_INTERVAL_MS=10000`

#### `MAX_RETRIES`
- **Description**: Maximum retries for failed RPC calls
- **Type**: Number
- **Default**: `3`
- **Required**: No
- **Example**: `MAX_RETRIES=3`

#### `RETRY_DELAY_MS`
- **Description**: Delay between retries in milliseconds
- **Type**: Number
- **Default**: `5000`
- **Required**: No
- **Example**: `RETRY_DELAY_MS=5000`

---

## Frontend Variables

Frontend environment variables are prefixed with `VITE_` for Vite build tool.

### API Configuration

#### `VITE_API_URL`
- **Description**: Backend API base URL
- **Type**: String (URL)
- **Required**: Yes
- **Example**: `VITE_API_URL=https://api.boardling.com`
- **Development**: `VITE_API_URL=http://localhost:3000`

#### `VITE_API_TIMEOUT`
- **Description**: API request timeout in milliseconds
- **Type**: Number
- **Default**: `30000`
- **Required**: No
- **Example**: `VITE_API_TIMEOUT=30000`

### Application Configuration

#### `VITE_APP_NAME`
- **Description**: Application name
- **Type**: String
- **Default**: `Boardling`
- **Required**: No
- **Example**: `VITE_APP_NAME=Boardling`

#### `VITE_APP_VERSION`
- **Description**: Application version
- **Type**: String
- **Required**: No
- **Example**: `VITE_APP_VERSION=1.0.0`

### Feature Flags

#### `VITE_ENABLE_ANALYTICS`
- **Description**: Enable analytics tracking
- **Type**: Boolean
- **Default**: `false`
- **Required**: No
- **Example**: `VITE_ENABLE_ANALYTICS=true`

#### `VITE_ENABLE_DEBUG`
- **Description**: Enable debug mode
- **Type**: Boolean
- **Default**: `false`
- **Required**: No
- **Example**: `VITE_ENABLE_DEBUG=true`

---

## Security Best Practices

### 1. Never Commit Secrets

```bash
# Add to .gitignore
.env
.env.local
.env.production
.env.*.local
```

### 2. Use Strong Secrets

```bash
# Generate strong JWT secret
openssl rand -base64 32

# Generate strong password
openssl rand -base64 24
```

### 3. Environment-Specific Files

```
.env.development      # Development settings
.env.staging          # Staging settings
.env.production       # Production settings (never commit!)
.env.example          # Template (safe to commit)
```

### 4. Restrict File Permissions

```bash
# Restrict access to .env files
chmod 600 .env
chown www-data:www-data .env
```

### 5. Use Secret Management

For production, consider using:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Secret Manager

### 6. Rotate Secrets Regularly

- JWT secrets: Every 90 days
- Database passwords: Every 90 days
- API keys: Every 180 days

### 7. Validate Environment Variables

```javascript
// Example validation
const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASS',
  'JWT_SECRET',
  'ZCASH_RPC_URL'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

---

## Example Configuration Files

### Development (.env.development)

```env
NODE_ENV=development
PORT=3000
HOST=localhost

DB_HOST=localhost
DB_PORT=5432
DB_USER=boardling_dev
DB_PASS=dev_password
DB_NAME=boardling_dev
DB_SSL=false

JWT_SECRET=dev_secret_key_not_for_production
JWT_EXPIRES_IN=24h

ZCASH_RPC_URL=https://zcash-mainnet.chainstacklabs.com
ZCASH_RPC_USER=
ZCASH_RPC_PASS=

PLATFORM_TREASURY_ADDRESS=t1TestAddressNotForProduction
PLATFORM_FEE_PERCENTAGE=30

CORS_ORIGIN=http://localhost:5173

LOG_LEVEL=debug
CACHE_ENABLED=false

ENABLE_EMAIL_VERIFICATION=false
```

### Production (.env.production)

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=5432
DB_USER=boardling_user
DB_PASS=<SECURE_PASSWORD>
DB_NAME=boardling
DB_SSL=true
DB_MAX_CONNECTIONS=50

JWT_SECRET=<LONG_RANDOM_SECRET>
JWT_EXPIRES_IN=1h

ZCASH_RPC_URL=http://localhost:8233
ZCASH_RPC_USER=<RPC_USER>
ZCASH_RPC_PASS=<RPC_PASS>

PLATFORM_TREASURY_ADDRESS=<PRODUCTION_ADDRESS>
PLATFORM_FEE_PERCENTAGE=30
WITHDRAWAL_FEE_ZEC=0.0005

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<EMAIL>
SMTP_PASS=<APP_PASSWORD>
EMAIL_FROM=noreply@boardling.com

CORS_ORIGIN=https://boardling.com,https://www.boardling.com

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

LOG_LEVEL=info
LOG_FILE=/var/log/boardling/app.log
LOG_FORMAT=json

CACHE_TTL_SECONDS=300
CACHE_ENABLED=true

ENABLE_EMAIL_VERIFICATION=true
ENABLE_TWO_FACTOR=false
```

---

## Troubleshooting

### Variable Not Loading

1. Check file name (`.env` not `env.txt`)
2. Verify file location (root of project)
3. Restart application after changes
4. Check for syntax errors (no spaces around `=`)

### Invalid Values

```bash
# Check current values (be careful with secrets!)
node -e "console.log(process.env.PORT)"

# Validate all required variables
npm run validate-env
```

### Permission Issues

```bash
# Check file permissions
ls -la .env

# Fix permissions
chmod 600 .env
```

---

## Additional Resources

- [dotenv documentation](https://github.com/motdotla/dotenv)
- [12-Factor App Config](https://12factor.net/config)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
