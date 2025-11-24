#!/bin/bash

echo "🚀 Starting Zebra (Zcash full node)..."
echo "======================================"

ZEBRA_BIN="$HOME/.zcash/bin/zebrad"
ZEBRA_CONFIG="$HOME/.zcash/zebra.toml"

if [ ! -f "$ZEBRA_BIN" ]; then
    echo "❌ Zebra binary not found at $ZEBRA_BIN"
    exit 1
fi

if [ ! -f "$ZEBRA_CONFIG" ]; then
    echo "❌ Zebra config not found at $ZEBRA_CONFIG"
    exit 1
fi

echo "📋 Configuration: $ZEBRA_CONFIG"
echo "🔗 RPC will be available at: http://127.0.0.1:8232"
echo "📊 Monitor logs: tail -f ~/.zcash/zebra.log"
echo ""
echo "⚠️  Initial sync will take 15-16 hours and ~50GB storage"
echo "🛑 Press Ctrl+C to stop"
echo ""

# Start Zebra
exec "$ZEBRA_BIN" --config "$ZEBRA_CONFIG" start