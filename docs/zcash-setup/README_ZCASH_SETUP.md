# Zcash RPC Setup Guide

## Current Status

Your environment is now configured with:

✅ **Configuration files created:**
- `~/.zcash/zebra.toml` - Zebra node configuration
- `~/.zcash/zaino.toml` - Zaino indexer configuration  
- `backend/.env` - Updated with local RPC endpoints

✅ **RPC Test script:** `backend/test-rpc-connection.js`

✅ **Setup scripts ready:**
- `./setup-zebra-zaino-native.sh` - Full automated setup
- `./quick-install-zcash.sh` - Quick installation
- `./configure-zcash-env.sh` - Environment configuration (already run)

## Network Issue Resolution

The build is failing due to network connectivity to crates.io. Here are your options:

### Option 1: Fix Network and Retry (Recommended)

```bash
# Check if you're behind a proxy or firewall
curl -I https://crates.io

# If behind corporate firewall, configure cargo:
mkdir -p ~/.cargo
cat > ~/.cargo/config.toml << 'EOF'
[http]
proxy = "your-proxy-url:port"  # If needed

[net]
retry = 10
git-fetch-with-cli = true
EOF

# Then retry the installation
./quick-install-zcash.sh
```

### Option 2: Use Pre-built Binaries (When Available)

```bash
# Check for pre-built releases
curl -s https://api.github.com/repos/ZcashFoundation/zebra/releases/latest

# Manual download and setup (update URL as needed)
mkdir -p ~/.zcash/bin
# Download from GitHub releases page manually
# Extract to ~/.zcash/bin/
```

### Option 3: Alternative RPC Services (Immediate Solution)

For immediate development, you can use these RPC endpoints:

```bash
# Update backend/.env with a working public service
cat > backend/.env << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=admin
DB_NAME=broadlypaywall

# Zcash RPC Configuration - Public Service
ZCASH_RPC_URL=https://api.zcashblockexplorer.com
ZCASH_RPC_USER=
ZCASH_RPC_PASS=

# Platform Treasury Address
PLATFORM_TREASURY_ADDRESS=t1UnEx5GLUk7Dn1kVCzE5ZCPEYMCCAtqPEN

# Security
API_RATE_LIMIT=100
CORS_ORIGIN=http://localhost:3000

# Monitoring
LOG_LEVEL=info
EOF
```

## Testing Your Setup

```bash
# Test RPC connection
cd backend
node test-rpc-connection.js

# If successful, you'll see blockchain info
# If failed, try different RPC endpoints
```

## Manual Installation Steps

If automated scripts don't work, follow these manual steps:

### 1. Install System Dependencies

```bash
sudo apt update
sudo apt install build-essential pkg-config libssl-dev git curl
```

### 2. Install Rust (if not already done)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 3. Build Zebra

```bash
git clone https://github.com/ZcashFoundation/zebra.git /tmp/zebra
cd /tmp/zebra
cargo build --release --bin zebrad
mkdir -p ~/.zcash/bin
cp target/release/zebrad ~/.zcash/bin/
```

### 4. Build Zaino

```bash
git clone https://github.com/zingolabs/zaino.git /tmp/zaino
cd /tmp/zaino
cargo build --release --bin zainod
cp target/release/zainod ~/.zcash/bin/
```

### 5. Start Services

```bash
# Start Zebra (will sync blockchain - takes 15-16 hours)
nohup ~/.zcash/bin/zebrad --config ~/.zcash/zebra.toml start > ~/.zcash/zebra.log 2>&1 &

# Monitor sync
tail -f ~/.zcash/zebra.log

# After Zebra syncs, start Zaino
nohup ~/.zcash/bin/zainod --config ~/.zcash/zaino.toml > ~/.zcash/zaino.log 2>&1 &
```

## RPC Endpoints After Setup

- **Zebra JSON-RPC**: `http://127.0.0.1:8232`
- **Zaino JSON-RPC**: `http://127.0.0.1:8234` (recommended)
- **Zaino gRPC**: `http://127.0.0.1:9067`

## Troubleshooting

### Network Issues
- Check firewall settings
- Verify internet connectivity
- Try using a VPN if behind corporate firewall

### Build Issues
- Ensure you have enough RAM (8GB+ recommended)
- Add swap space if needed
- Use `cargo build --jobs 1` to reduce memory usage

### Runtime Issues
- Check available disk space (need 60GB+)
- Verify ports 8232, 8234, 9067 are not in use
- Check logs for specific error messages

## Next Steps

1. **Immediate**: Use public RPC service for development
2. **Short-term**: Resolve network issues and build locally
3. **Long-term**: Run full Zebra + Zaino stack for production

Your backend is already configured to use the local endpoints once they're available!