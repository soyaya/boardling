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
    test-rpc)
        echo "🧪 Testing RPC with backend script..."
        cd backend && node test-rpc-connection.js
        ;;
    *)
        echo "Usage: $0 {start-zebra|start-zaino|status|test-rpc}"
        echo ""
        echo "🚀 Quick Start:"
        echo "1. $0 start-zebra    # Start Zebra (wait for sync)"
        echo "2. $0 start-zaino    # Start Zaino (after Zebra syncs)"
        echo "3. $0 test-rpc       # Test RPC connections"
        ;;
esac