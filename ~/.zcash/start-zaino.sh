#!/bin/bash

echo "🚀 Starting Zaino (Zcash indexer)..."
echo "===================================="

ZAINO_BIN="$HOME/.zcash/bin/zainod"
ZAINO_CONFIG="$HOME/.zcash/zaino.toml"

if [ ! -f "$ZAINO_BIN" ]; then
    echo "❌ Zaino binary not found at $ZAINO_BIN"
    exit 1
fi

if [ ! -f "$ZAINO_CONFIG" ]; then
    echo "❌ Zaino config not found at $ZAINO_CONFIG"
    exit 1
fi

# Check if Zebra is running
if ! curl -s http://127.0.0.1:8232 > /dev/null 2>&1; then
    echo "⚠️  Warning: Zebra doesn't seem to be running at http://127.0.0.1:8232"
    echo "   Start Zebra first with: ~/.zcash/start-zebra.sh"
    echo "   Continuing anyway..."
fi

echo "📋 Configuration: $ZAINO_CONFIG"
echo "🔗 JSON-RPC will be available at: http://127.0.0.1:8234"
echo "🔗 gRPC will be available at: http://127.0.0.1:9067"
echo "📊 Monitor logs: tail -f ~/.zcash/zaino.log"
echo ""
echo "🛑 Press Ctrl+C to stop"
echo ""

# Start Zaino
exec "$ZAINO_BIN" --config "$ZAINO_CONFIG"