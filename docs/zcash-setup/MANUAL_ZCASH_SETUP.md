# Manual Zcash Setup Guide (Zebra + Zaino)

## Prerequisites

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install system dependencies (Ubuntu/Debian)
sudo apt update
sudo apt install build-essential pkg-config libssl-dev git wget curl
```

## Option 1: Try Pre-built Binaries (Fastest)

```bash
# Create installation directory
mkdir -p ~/.zcash/bin

# Try to download pre-built Zebra (check latest release)
wget -O zebra.tar.gz "https://github.com/ZcashFoundation/zebra/releases/latest/download/zebrad-*-x86_64-unknown-linux-gnu.tar.gz"
tar -xzf zebra.tar.gz -C ~/.zcash/bin --strip-components=1

# If pre-built not available, proceed to Option 2
```

## Option 2: Build from Source

### Build Zebra

```bash
# Clone and build Zebra
git clone https://github.com/ZcashFoundation/zebra.git /tmp/zebra-build
cd /tmp/zebra-build

# Set build optimizations
export RUSTFLAGS="-C target-cpu=native"
export CARGO_NET_RETRY=10

# Build (this takes 20-30 minutes)
cargo build --release --bin zebrad

# Install
mkdir -p ~/.zcash/bin
cp target/release/zebrad ~/.zcash/bin/
```

### Build Zaino

```bash
# Clone and build Zaino
git clone https://github.com/zingolabs/zaino.git /tmp/zaino-build
cd /tmp/zaino-build

# Build
cargo build --release --bin zainod

# Install
cp target/release/zainod ~/.zcash/bin/
```

## Configuration

The configuration files are already created at:
- `~/.zcash/zebra.toml` (Zebra config)
- `~/.zcash/zaino.toml` (Zaino config)

## Running the Services

### Start Zebra (Full Node)

```bash
# Start Zebra in background
nohup ~/.zcash/bin/zebrad --config ~/.zcash/zebra.toml start > ~/.zcash/zebra.log 2>&1 &

# Monitor sync progress
tail -f ~/.zcash/zebra.log
```

**Important**: Zebra needs to sync the full blockchain (~50GB, takes 15-16 hours on first run)

### Start Zaino (Indexer) - After Zebra Syncs

```bash
# Wait until Zebra is fully synced, then start Zaino
nohup ~/.zcash/bin/zainod --config ~/.zcash/zaino.toml > ~/.zcash/zaino.log 2>&1 &

# Monitor Zaino
tail -f ~/.zcash/zaino.log
```

## Testing RPC Connection

```bash
# Test the connection
cd backend
node test-rpc-connection.js
```

## RPC Endpoints

After setup, you'll have these endpoints available:

- **Zebra JSON-RPC**: `http://127.0.0.1:8232`
- **Zaino JSON-RPC**: `http://127.0.0.1:8234` (recommended)
- **Zaino gRPC**: `http://127.0.0.1:9067`

## Troubleshooting

### Build Issues

If you encounter build errors:

1. **Network issues**: Check internet connection and retry
2. **Memory issues**: Add swap space or reduce build parallelism:
   ```bash
   cargo build --release --jobs 1
   ```
3. **Dependency issues**: Install missing system packages:
   ```bash
   sudo apt install cmake clang libclang-dev
   ```

### Runtime Issues

1. **Port conflicts**: Check if ports 8232, 8234, 9067 are available
2. **Disk space**: Ensure you have at least 60GB free space
3. **Sync issues**: Check logs for network connectivity problems

### Quick Status Check

```bash
# Check if services are running
ps aux | grep -E "(zebrad|zainod)"

# Check RPC endpoints
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"getblockcount","params":[],"id":1}' \
  http://127.0.0.1:8232

curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"getblockcount","params":[],"id":1}' \
  http://127.0.0.1:8234
```

## Service Management

Create a simple management script:

```bash
cat > ~/.zcash/manage.sh << 'EOF'
#!/bin/bash
case "$1" in
  start-zebra)
    nohup ~/.zcash/bin/zebrad --config ~/.zcash/zebra.toml start > ~/.zcash/zebra.log 2>&1 &
    echo "Zebra started"
    ;;
  start-zaino)
    nohup ~/.zcash/bin/zainod --config ~/.zcash/zaino.toml > ~/.zcash/zaino.log 2>&1 &
    echo "Zaino started"
    ;;
  stop)
    pkill -f zebrad
    pkill -f zainod
    echo "Services stopped"
    ;;
  status)
    ps aux | grep -E "(zebrad|zainod)" | grep -v grep
    ;;
  *)
    echo "Usage: $0 {start-zebra|start-zaino|stop|status}"
    ;;
esac
EOF

chmod +x ~/.zcash/manage.sh
```

## Next Steps

1. Start Zebra and wait for sync
2. Start Zaino after Zebra is synced
3. Test RPC connection
4. Update your application to use the local RPC endpoints