#!/bin/bash

set -e

echo "🚀 Setting up Zebra and Zaino (Native Installation)"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="$HOME/.zcash"
ZEBRA_DIR="$INSTALL_DIR/zebra"
ZAINO_DIR="$INSTALL_DIR/zaino"
ZEBRA_CONFIG="$INSTALL_DIR/zebra.toml"
ZAINO_CONFIG="$INSTALL_DIR/zaino.toml"

echo -e "${BLUE}📁 Creating installation directories...${NC}"
mkdir -p "$INSTALL_DIR"
mkdir -p "$ZEBRA_DIR"
mkdir -p "$ZAINO_DIR"

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command -v cargo &> /dev/null; then
    echo -e "${RED}❌ Rust/Cargo not found. Installing...${NC}"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found. Please install git first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check complete${NC}"

# Clone repositories if not already present
if [ ! -d "/tmp/zebra-build" ]; then
    echo -e "${BLUE}📥 Cloning Zebra repository...${NC}"
    git clone https://github.com/ZcashFoundation/zebra.git /tmp/zebra-build
fi

if [ ! -d "/tmp/zaino-build" ]; then
    echo -e "${BLUE}📥 Cloning Zaino repository...${NC}"
    git clone https://github.com/zingolabs/zaino.git /tmp/zaino-build
fi

# Build Zebra
echo -e "${BLUE}🔨 Building Zebra (this may take 20-30 minutes)...${NC}"
cd /tmp/zebra-build

# Use specific optimizations to avoid compilation issues
export RUSTFLAGS="-C target-cpu=native"
export CARGO_NET_RETRY=10

# Build with minimal features first
if ! cargo build --release --bin zebrad --no-default-features --features="default-release-binaries"; then
    echo -e "${YELLOW}⚠️  Trying with default features...${NC}"
    cargo build --release --bin zebrad
fi

# Install Zebra binary
cp target/release/zebrad "$ZEBRA_DIR/"
echo -e "${GREEN}✅ Zebra built and installed to $ZEBRA_DIR${NC}"

# Build Zaino
echo -e "${BLUE}🔨 Building Zaino...${NC}"
cd /tmp/zaino-build

# Build Zaino
cargo build --release --bin zainod

# Install Zaino binary
cp target/release/zainod "$ZAINO_DIR/"
echo -e "${GREEN}✅ Zaino built and installed to $ZAINO_DIR${NC}"

# Create Zebra configuration
echo -e "${BLUE}⚙️  Creating Zebra configuration...${NC}"
cat > "$ZEBRA_CONFIG" << 'EOF'
# Zebra Configuration for RPC Access
[consensus]
checkpoint_sync = true

[network]
network = "Mainnet"
listen_addr = "127.0.0.1:8233"

[rpc]
# Enable RPC server
listen_addr = "127.0.0.1:8232"

[state]
cache_dir = "~/.zcash/zebra/state"

[tracing]
filter = "info"

[sync]
lookahead_limit = 2000
EOF

# Create Zaino configuration
echo -e "${BLUE}⚙️  Creating Zaino configuration...${NC}"
cat > "$ZAINO_CONFIG" << 'EOF'
# Zaino Configuration
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

# Create systemd service files (optional)
echo -e "${BLUE}📋 Creating service scripts...${NC}"

# Zebra service script
cat > "$INSTALL_DIR/start-zebra.sh" << EOF
#!/bin/bash
cd "$ZEBRA_DIR"
exec ./zebrad --config "$ZEBRA_CONFIG" start
EOF

# Zaino service script
cat > "$INSTALL_DIR/start-zaino.sh" << EOF
#!/bin/bash
cd "$ZAINO_DIR"
exec ./zainod --config "$ZAINO_CONFIG"
EOF

chmod +x "$INSTALL_DIR/start-zebra.sh"
chmod +x "$INSTALL_DIR/start-zaino.sh"

# Create management script
cat > "$INSTALL_DIR/manage-zcash.sh" << 'EOF'
#!/bin/bash

ZEBRA_PID_FILE="$HOME/.zcash/zebra.pid"
ZAINO_PID_FILE="$HOME/.zcash/zaino.pid"

case "$1" in
    start-zebra)
        echo "🚀 Starting Zebra..."
        nohup $HOME/.zcash/start-zebra.sh > $HOME/.zcash/zebra.log 2>&1 &
        echo $! > "$ZEBRA_PID_FILE"
        echo "✅ Zebra started (PID: $(cat $ZEBRA_PID_FILE))"
        echo "📊 Monitor with: tail -f $HOME/.zcash/zebra.log"
        ;;
    start-zaino)
        echo "🚀 Starting Zaino..."
        nohup $HOME/.zcash/start-zaino.sh > $HOME/.zcash/zaino.log 2>&1 &
        echo $! > "$ZAINO_PID_FILE"
        echo "✅ Zaino started (PID: $(cat $ZAINO_PID_FILE))"
        echo "📊 Monitor with: tail -f $HOME/.zcash/zaino.log"
        ;;
    stop-zebra)
        if [ -f "$ZEBRA_PID_FILE" ]; then
            PID=$(cat "$ZEBRA_PID_FILE")
            kill "$PID" 2>/dev/null && echo "🛑 Zebra stopped" || echo "❌ Zebra not running"
            rm -f "$ZEBRA_PID_FILE"
        else
            echo "❌ Zebra PID file not found"
        fi
        ;;
    stop-zaino)
        if [ -f "$ZAINO_PID_FILE" ]; then
            PID=$(cat "$ZAINO_PID_FILE")
            kill "$PID" 2>/dev/null && echo "🛑 Zaino stopped" || echo "❌ Zaino not running"
            rm -f "$ZAINO_PID_FILE"
        else
            echo "❌ Zaino PID file not found"
        fi
        ;;
    status)
        echo "📊 Zcash Services Status:"
        if [ -f "$ZEBRA_PID_FILE" ] && kill -0 "$(cat $ZEBRA_PID_FILE)" 2>/dev/null; then
            echo "  🟢 Zebra: Running (PID: $(cat $ZEBRA_PID_FILE))"
        else
            echo "  🔴 Zebra: Stopped"
        fi
        
        if [ -f "$ZAINO_PID_FILE" ] && kill -0 "$(cat $ZAINO_PID_FILE)" 2>/dev/null; then
            echo "  🟢 Zaino: Running (PID: $(cat $ZAINO_PID_FILE))"
        else
            echo "  🔴 Zaino: Stopped"
        fi
        ;;
    logs-zebra)
        tail -f "$HOME/.zcash/zebra.log"
        ;;
    logs-zaino)
        tail -f "$HOME/.zcash/zaino.log"
        ;;
    *)
        echo "Usage: $0 {start-zebra|start-zaino|stop-zebra|stop-zaino|status|logs-zebra|logs-zaino}"
        echo ""
        echo "Examples:"
        echo "  $0 start-zebra    # Start Zebra node"
        echo "  $0 start-zaino    # Start Zaino indexer (after Zebra is synced)"
        echo "  $0 status         # Check service status"
        echo "  $0 logs-zebra     # View Zebra logs"
        exit 1
        ;;
esac
EOF

chmod +x "$INSTALL_DIR/manage-zcash.sh"

# Add to PATH
echo -e "${BLUE}🔧 Setting up PATH...${NC}"
if ! grep -q "$INSTALL_DIR" "$HOME/.bashrc"; then
    echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$HOME/.bashrc"
fi

# Create symlinks for easy access
sudo ln -sf "$INSTALL_DIR/manage-zcash.sh" /usr/local/bin/zcash-manage 2>/dev/null || ln -sf "$INSTALL_DIR/manage-zcash.sh" "$HOME/.local/bin/zcash-manage" 2>/dev/null || true

echo -e "${GREEN}🎉 Installation Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Start Zebra: $INSTALL_DIR/manage-zcash.sh start-zebra"
echo "2. Wait for sync (15-16 hours): $INSTALL_DIR/manage-zcash.sh logs-zebra"
echo "3. Start Zaino: $INSTALL_DIR/manage-zcash.sh start-zaino"
echo "4. Check status: $INSTALL_DIR/manage-zcash.sh status"
echo ""
echo -e "${BLUE}🔧 Configuration Files:${NC}"
echo "  Zebra: $ZEBRA_CONFIG"
echo "  Zaino: $ZAINO_CONFIG"
echo ""
echo -e "${BLUE}📊 RPC Endpoints:${NC}"
echo "  Zebra JSON-RPC: http://127.0.0.1:8232"
echo "  Zaino JSON-RPC: http://127.0.0.1:8234"
echo "  Zaino gRPC: http://127.0.0.1:9067"
echo ""
echo -e "${YELLOW}⚠️  Important: Zebra needs to sync the full blockchain (~50GB) before Zaino can start${NC}"

# Clean up build directories
echo -e "${BLUE}🧹 Cleaning up build directories...${NC}"
rm -rf /tmp/zebra-build /tmp/zaino-build

echo -e "${GREEN}✅ Setup complete! Run the commands above to start your Zcash infrastructure.${NC}"
EOF