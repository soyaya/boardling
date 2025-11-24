#!/bin/bash

echo "⚡ Quick Zcash Setup (Zebra + Zaino)"
echo "===================================="

# Check if we have network connectivity
if ! ping -c 1 github.com &> /dev/null; then
    echo "❌ No internet connection. Please check your network and try again."
    exit 1
fi

# Install Rust if not present
if ! command -v cargo &> /dev/null; then
    echo "📦 Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# Set up build environment
export RUSTFLAGS="-C target-cpu=native"
export CARGO_NET_RETRY=10
export CARGO_NET_TIMEOUT=300

# Create installation directory
mkdir -p "$HOME/.zcash/bin"

echo "🔨 Building Zebra (this will take some time)..."

# Try to build Zebra with retry logic
cd /home/limitlxx/zcash-setup/zebra

# Clean previous build attempts
cargo clean

# Build with minimal features to reduce compilation complexity
if cargo build --release --bin zebrad --features="default-release-binaries" --jobs 2; then
    echo "✅ Zebra built successfully"
    cp target/release/zebrad "$HOME/.zcash/bin/"
else
    echo "❌ Zebra build failed. Trying alternative approach..."
    
    # Try with even fewer features
    if cargo build --release --bin zebrad --no-default-features --features="progress-bar getblocktemplate-rpcs"; then
        echo "✅ Zebra built with minimal features"
        cp target/release/zebrad "$HOME/.zcash/bin/"
    else
        echo "❌ Zebra build failed completely. Please check the logs above."
        echo "💡 You may need to install additional system dependencies:"
        echo "   sudo apt update && sudo apt install build-essential pkg-config libssl-dev"
        exit 1
    fi
fi

echo "🔨 Building Zaino..."
cd /home/limitlxx/zcash-setup/zaino

if cargo build --release --bin zainod --jobs 2; then
    echo "✅ Zaino built successfully"
    cp target/release/zainod "$HOME/.zcash/bin/"
else
    echo "❌ Zaino build failed"
    exit 1
fi

# Create start scripts
cat > "$HOME/.zcash/start-zebra.sh" << 'EOF'
#!/bin/bash
cd "$HOME/.zcash"
exec "$HOME/.zcash/bin/zebrad" --config "$HOME/.zcash/zebra.toml" start
EOF

cat > "$HOME/.zcash/start-zaino.sh" << 'EOF'
#!/bin/bash
cd "$HOME/.zcash"
exec "$HOME/.zcash/bin/zainod" --config "$HOME/.zcash/zaino.toml"
EOF

chmod +x "$HOME/.zcash/start-zebra.sh"
chmod +x "$HOME/.zcash/start-zaino.sh"

# Add to PATH
if ! grep -q "$HOME/.zcash/bin" "$HOME/.bashrc"; then
    echo 'export PATH="$HOME/.zcash/bin:$PATH"' >> "$HOME/.bashrc"
fi

echo "🎉 Installation complete!"
echo ""
echo "🚀 To start Zebra:"
echo "   $HOME/.zcash/start-zebra.sh"
echo ""
echo "🚀 To start Zaino (after Zebra syncs):"
echo "   $HOME/.zcash/start-zaino.sh"
echo ""
echo "📊 Monitor sync progress:"
echo "   tail -f ~/.zcash/zebra.log"
echo ""
echo "🔧 Test RPC connection:"
echo "   cd backend && node test-rpc-connection.js"