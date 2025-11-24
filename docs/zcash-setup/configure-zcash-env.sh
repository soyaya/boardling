#!/bin/bash

echo "🔧 Configuring Zcash RPC Environment"
echo "===================================="

# Create .zcash directory structure
mkdir -p "$HOME/.zcash"

# Create optimized Zebra config
cat > "$HOME/.zcash/zebra.toml" << 'EOF'
# Zebra Configuration - Optimized for RPC access
[consensus]
checkpoint_sync = true

[network]
network = "Mainnet"
listen_addr = "127.0.0.1:8233"
# Reduce peer connections for faster sync
peerset_initial_target_size = 25

[rpc]
listen_addr = "127.0.0.1:8232"
# Enable CORS for web applications
cors_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

[state]
cache_dir = "~/.zcash/zebra/state"
# Optimize cache settings
ephemeral = false

[tracing]
filter = "info,zebra_network=warn,zebra_consensus=warn"

[sync]
# Faster sync settings
lookahead_limit = 2000
download_concurrency_limit = 50
EOF

# Create Zaino config
cat > "$HOME/.zcash/zaino.toml" << 'EOF'
# Zaino Configuration - Unified RPC server
[rpc]
listen_addr = "127.0.0.1:8234"

[grpc]
listen_addr = "127.0.0.1:9067"

[zebra]
rpc_endpoint = "http://127.0.0.1:8232"

[indexer]
db_path = "~/.zcash/zaino/db"

[network]
network = "mainnet"

[tracing]
filter = "info"
EOF

# Update backend .env file
echo "📝 Updating backend/.env configuration..."

# Backup original .env
cp backend/.env backend/.env.backup

# Update .env with local RPC configuration
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

# Zcash RPC Configuration
# Local Zaino (recommended - unified JSON-RPC + gRPC)
ZCASH_RPC_URL=http://127.0.0.1:8234
ZCASH_RPC_USER=
ZCASH_RPC_PASS=

# Alternative: Local Zebra (JSON-RPC only)
# ZCASH_RPC_URL=http://127.0.0.1:8232
# ZCASH_RPC_USER=
# ZCASH_RPC_PASS=

# Platform Treasury Address (for fee collection)
PLATFORM_TREASURY_ADDRESS=t1UnEx5GLUk7Dn1kVCzE5ZCPEYMCCAtqPEN

# Security
API_RATE_LIMIT=100
CORS_ORIGIN=http://localhost:3000

# Monitoring
LOG_LEVEL=info
EOF

echo "✅ Configuration files created:"
echo "   - Zebra config: $HOME/.zcash/zebra.toml"
echo "   - Zaino config: $HOME/.zcash/zaino.toml"
echo "   - Backend .env updated (backup saved as .env.backup)"
echo ""
echo "🚀 Next steps:"
echo "1. Run: ./setup-zebra-zaino-native.sh (to build and install)"
echo "2. Or manually install Zebra and Zaino using the configs above"
echo ""
echo "📊 RPC Endpoints after setup:"
echo "   - Zebra: http://127.0.0.1:8232"
echo "   - Zaino: http://127.0.0.1:8234 (recommended)"
echo "   - Zaino gRPC: http://127.0.0.1:9067"