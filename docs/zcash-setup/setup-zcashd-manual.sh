#!/bin/bash

echo "🔧 Manual Zcashd Setup (Alternative to Zebra)"
echo "============================================="

# Create zcash directory
mkdir -p ~/.zcash

# Create zcash.conf configuration
cat > ~/.zcash/zcash.conf << 'EOF'
# Zcash Configuration
rpcuser=zcashrpc
rpcpassword=your_secure_password_here_change_this
rpcbind=127.0.0.1
rpcport=8232
rpcallowip=127.0.0.1

# Network settings
server=1
daemon=1
txindex=1

# Reduce memory usage
dbcache=512
maxmempool=300

# Logging
debug=0
printtoconsole=0

# Network (mainnet)
testnet=0
regtest=0
EOF

echo "✅ Created zcash.conf at ~/.zcash/zcash.conf"

# Create start script
cat > ~/.zcash/start-zcashd.sh << 'EOF'
#!/bin/bash

ZCASH_DIR="$HOME/.zcash"
ZCASHD_BIN="$HOME/.zcash/bin/zcashd"

if [ ! -f "$ZCASHD_BIN" ]; then
    echo "❌ zcashd binary not found at $ZCASHD_BIN"
    echo "Please download and extract zcashd binary to ~/.zcash/bin/"
    exit 1
fi

echo "🚀 Starting zcashd..."
"$ZCASHD_BIN" -conf="$ZCASH_DIR/zcash.conf" -datadir="$ZCASH_DIR"
EOF

chmod +x ~/.zcash/start-zcashd.sh

# Create stop script
cat > ~/.zcash/stop-zcashd.sh << 'EOF'
#!/bin/bash

ZCASH_CLI="$HOME/.zcash/bin/zcash-cli"

if [ -f "$ZCASH_CLI" ]; then
    echo "🛑 Stopping zcashd..."
    "$ZCASH_CLI" stop
else
    echo "🛑 Stopping zcashd (using pkill)..."
    pkill -f zcashd
fi
EOF

chmod +x ~/.zcash/stop-zcashd.sh

echo ""
echo "📋 Manual Setup Instructions:"
echo "=============================="
echo ""
echo "1. Download zcashd binary:"
echo "   - Visit: https://github.com/zcash/zcash/releases"
echo "   - Download the latest Linux release"
echo "   - Extract to ~/.zcash/bin/"
echo ""
echo "2. Update the RPC password in ~/.zcash/zcash.conf"
echo ""
echo "3. Start zcashd:"
echo "   ~/.zcash/start-zcashd.sh"
echo ""
echo "4. Update backend/.env:"
echo "   ZCASH_RPC_URL=http://127.0.0.1:8232"
echo "   ZCASH_RPC_USER=zcashrpc"
echo "   ZCASH_RPC_PASS=your_secure_password_here_change_this"
echo ""
echo "5. Test connection:"
echo "   cd backend && node test-rpc-connection.js"
echo ""
echo "⚠️  Note: Initial sync will take 24+ hours and require ~50GB storage"

# Update backend .env for zcashd
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

# Zcash RPC Configuration - Local zcashd
ZCASH_RPC_URL=http://127.0.0.1:8232
ZCASH_RPC_USER=zcashrpc
ZCASH_RPC_PASS=your_secure_password_here_change_this

# Platform Treasury Address (for fee collection)
PLATFORM_TREASURY_ADDRESS=t1UnEx5GLUk7Dn1kVCzE5ZCPEYMCCAtqPEN

# Security
API_RATE_LIMIT=100
CORS_ORIGIN=http://localhost:3000

# Monitoring
LOG_LEVEL=info
EOF

echo ""
echo "✅ Backend .env updated for zcashd configuration"
echo "🔐 Remember to change the RPC password in both files!"