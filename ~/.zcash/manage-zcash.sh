#!/bin/bash

ZEBRA_PID_FILE="$HOME/.zcash/zebra.pid"
ZAINO_PID_FILE="$HOME/.zcash/zaino.pid"

case "$1" in
    start-zebra)
        echo "🚀 Starting Zebra..."
        if [ -f "$ZEBRA_PID_FILE" ] && kill -0 "$(cat $ZEBRA_PID_FILE)" 2>/dev/null; then
            echo "⚠️  Zebra is already running (PID: $(cat $ZEBRA_PID_FILE))"
            exit 1
        fi
        nohup $HOME/.zcash/start-zebra.sh > $HOME/.zcash/zebra.log 2>&1 &
        echo $! > "$ZEBRA_PID_FILE"
        echo "✅ Zebra started (PID: $(cat $ZEBRA_PID_FILE))"
        echo "📊 Monitor with: tail -f $HOME/.zcash/zebra.log"
        echo "⏳ Initial sync will take 15-16 hours"
        ;;
    start-zaino)
        echo "🚀 Starting Zaino..."
        if [ -f "$ZAINO_PID_FILE" ] && kill -0 "$(cat $ZAINO_PID_FILE)" 2>/dev/null; then
            echo "⚠️  Zaino is already running (PID: $(cat $ZAINO_PID_FILE))"
            exit 1
        fi
        
        # Check if Zebra is running
        if [ ! -f "$ZEBRA_PID_FILE" ] || ! kill -0 "$(cat $ZEBRA_PID_FILE)" 2>/dev/null; then
            echo "⚠️  Warning: Zebra doesn't appear to be running"
            echo "   Start Zebra first with: $0 start-zebra"
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
        
        nohup $HOME/.zcash/start-zaino.sh > $HOME/.zcash/zaino.log 2>&1 &
        echo $! > "$ZAINO_PID_FILE"
        echo "✅ Zaino started (PID: $(cat $ZAINO_PID_FILE))"
        echo "📊 Monitor with: tail -f $HOME/.zcash/zaino.log"
        ;;
    stop-zebra)
        if [ -f "$ZEBRA_PID_FILE" ]; then
            PID=$(cat "$ZEBRA_PID_FILE")
            if kill "$PID" 2>/dev/null; then
                echo "🛑 Zebra stopped (PID: $PID)"
                rm -f "$ZEBRA_PID_FILE"
            else
                echo "❌ Failed to stop Zebra (PID: $PID)"
                rm -f "$ZEBRA_PID_FILE"
            fi
        else
            echo "❌ Zebra PID file not found"
        fi
        ;;
    stop-zaino)
        if [ -f "$ZAINO_PID_FILE" ]; then
            PID=$(cat "$ZAINO_PID_FILE")
            if kill "$PID" 2>/dev/null; then
                echo "🛑 Zaino stopped (PID: $PID)"
                rm -f "$ZAINO_PID_FILE"
            else
                echo "❌ Failed to stop Zaino (PID: $PID)"
                rm -f "$ZAINO_PID_FILE"
            fi
        else
            echo "❌ Zaino PID file not found"
        fi
        ;;
    stop-all)
        $0 stop-zaino
        $0 stop-zebra
        ;;
    status)
        echo "📊 Zcash Services Status:"
        echo "========================="
        
        if [ -f "$ZEBRA_PID_FILE" ] && kill -0 "$(cat $ZEBRA_PID_FILE)" 2>/dev/null; then
            echo "  🟢 Zebra: Running (PID: $(cat $ZEBRA_PID_FILE))"
            
            # Check RPC connectivity
            if curl -s -X POST -H "Content-Type: application/json" \
                --data '{"jsonrpc":"2.0","method":"getblockcount","params":[],"id":1}' \
                http://127.0.0.1:8232 > /dev/null 2>&1; then
                echo "     🔗 RPC: Responding at http://127.0.0.1:8232"
            else
                echo "     ⚠️  RPC: Not responding yet (still starting up?)"
            fi
        else
            echo "  🔴 Zebra: Stopped"
        fi
        
        if [ -f "$ZAINO_PID_FILE" ] && kill -0 "$(cat $ZAINO_PID_FILE)" 2>/dev/null; then
            echo "  🟢 Zaino: Running (PID: $(cat $ZAINO_PID_FILE))"
            
            # Check RPC connectivity
            if curl -s -X POST -H "Content-Type: application/json" \
                --data '{"jsonrpc":"2.0","method":"getblockcount","params":[],"id":1}' \
                http://127.0.0.1:8234 > /dev/null 2>&1; then
                echo "     🔗 JSON-RPC: Responding at http://127.0.0.1:8234"
            else
                echo "     ⚠️  JSON-RPC: Not responding yet (still starting up?)"
            fi
        else
            echo "  🔴 Zaino: Stopped"
        fi
        
        echo ""
        echo "📋 Configuration:"
        echo "  Zebra config: ~/.zcash/zebra.toml"
        echo "  Zaino config: ~/.zcash/zaino.toml"
        echo "  Backend .env: backend/.env"
        ;;
    logs-zebra)
        if [ -f "$HOME/.zcash/zebra.log" ]; then
            tail -f "$HOME/.zcash/zebra.log"
        else
            echo "❌ Zebra log file not found"
        fi
        ;;
    logs-zaino)
        if [ -f "$HOME/.zcash/zaino.log" ]; then
            tail -f "$HOME/.zcash/zaino.log"
        else
            echo "❌ Zaino log file not found"
        fi
        ;;
    test-rpc)
        echo "🧪 Testing RPC Connections:"
        echo "============================"
        
        echo "Testing Zebra (http://127.0.0.1:8232)..."
        if curl -s -X POST -H "Content-Type: application/json" \
            --data '{"jsonrpc":"2.0","method":"getblockcount","params":[],"id":1}' \
            http://127.0.0.1:8232; then
            echo "✅ Zebra RPC is working"
        else
            echo "❌ Zebra RPC is not responding"
        fi
        
        echo ""
        echo "Testing Zaino (http://127.0.0.1:8234)..."
        if curl -s -X POST -H "Content-Type: application/json" \
            --data '{"jsonrpc":"2.0","method":"getblockcount","params":[],"id":1}' \
            http://127.0.0.1:8234; then
            echo "✅ Zaino RPC is working"
        else
            echo "❌ Zaino RPC is not responding"
        fi
        
        echo ""
        echo "Testing with backend test script..."
        cd backend && node test-rpc-connection.js
        ;;
    *)
        echo "🔧 Zcash Management Script"
        echo "=========================="
        echo ""
        echo "Usage: $0 {start-zebra|start-zaino|stop-zebra|stop-zaino|stop-all|status|logs-zebra|logs-zaino|test-rpc}"
        echo ""
        echo "Commands:"
        echo "  start-zebra   Start Zebra full node"
        echo "  start-zaino   Start Zaino indexer (requires Zebra)"
        echo "  stop-zebra    Stop Zebra"
        echo "  stop-zaino    Stop Zaino"
        echo "  stop-all      Stop both services"
        echo "  status        Show service status"
        echo "  logs-zebra    View Zebra logs"
        echo "  logs-zaino    View Zaino logs"
        echo "  test-rpc      Test RPC connections"
        echo ""
        echo "🚀 Quick Start:"
        echo "1. $0 start-zebra    # Start Zebra (wait for sync)"
        echo "2. $0 start-zaino    # Start Zaino (after Zebra syncs)"
        echo "3. $0 test-rpc       # Test RPC connections"
        echo ""
        echo "📊 RPC Endpoints:"
        echo "  Zebra:  http://127.0.0.1:8232 (JSON-RPC)"
        echo "  Zaino:  http://127.0.0.1:8234 (JSON-RPC, recommended)"
        echo "  Zaino:  http://127.0.0.1:9067 (gRPC for light clients)"
        exit 1
        ;;
esac