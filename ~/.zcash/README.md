# Zcash Runtime Management

This directory contains the runtime management scripts for your Zcash infrastructure (Zebra + Zaino).

## 🚀 Quick Start

```bash
# Start the full Zcash stack
~/.zcash/manage-zcash.sh start-zebra
~/.zcash/manage-zcash.sh start-zaino

# Check status
~/.zcash/manage-zcash.sh status

# Test RPC connections
~/.zcash/manage-zcash.sh test-rpc
```

## 📁 Files in this Directory

### Management Scripts
- `manage-zcash.sh` - **Main management script** (use this for everything)
- `start-zebra.sh` - Zebra startup script (called by manage-zcash.sh)
- `start-zaino.sh` - Zaino startup script (called by manage-zcash.sh)

### Configuration Files
- `zebra.toml` - Zebra node configuration
- `zaino.toml` - Zaino indexer configuration

### Runtime Files (auto-generated)
- `zebra.pid` - Zebra process ID file
- `zaino.pid` - Zaino process ID file
- `zebra.log` - Zebra service logs
- `zaino.log` - Zaino service logs

### Binaries
- `bin/zebrad` - Zebra executable
- `bin/zainod` - Zaino executable

## 🔧 Main Management Commands

Use `~/.zcash/manage-zcash.sh` for all operations:

### Starting Services
```bash
# Start Zebra (Zcash full node)
~/.zcash/manage-zcash.sh start-zebra

# Start Zaino (indexer - requires Zebra running)
~/.zcash/manage-zcash.sh start-zaino
```

### Stopping Services
```bash
# Stop individual services
~/.zcash/manage-zcash.sh stop-zebra
~/.zcash/manage-zcash.sh stop-zaino

# Stop everything
~/.zcash/manage-zcash.sh stop-all
```

### Monitoring
```bash
# Check service status
~/.zcash/manage-zcash.sh status

# View live logs
~/.zcash/manage-zcash.sh logs-zebra
~/.zcash/manage-zcash.sh logs-zaino

# Test RPC connectivity
~/.zcash/manage-zcash.sh test-rpc
```

## 🌐 Service Endpoints

Once running, your services will be available at:

- **Zebra RPC**: `http://127.0.0.1:8232` (JSON-RPC)
- **Zaino JSON-RPC**: `http://127.0.0.1:8234` (recommended for applications)
- **Zaino gRPC**: `http://127.0.0.1:9067` (for light clients)

## 📊 Service Dependencies

```
Zebra (Full Node)
    ↓
Zaino (Indexer)
    ↓
Your Application
```

**Important**: Always start Zebra first, then Zaino. Zaino depends on Zebra being available.

## ⏱️ Startup Timeline

1. **Zebra**: Takes 15-16 hours for initial blockchain sync (~50GB)
2. **Zaino**: Can start immediately after Zebra, will sync as Zebra syncs
3. **RPC**: Available once services are running (even during sync)

## 🔍 Troubleshooting

### Service Won't Start
```bash
# Check if already running
~/.zcash/manage-zcash.sh status

# Check logs for errors
~/.zcash/manage-zcash.sh logs-zebra
~/.zcash/manage-zcash.sh logs-zaino
```

### RPC Not Responding
```bash
# Test connectivity
~/.zcash/manage-zcash.sh test-rpc

# Check if services are actually running
~/.zcash/manage-zcash.sh status

# Restart if needed
~/.zcash/manage-zcash.sh stop-all
~/.zcash/manage-zcash.sh start-zebra
# Wait a moment, then:
~/.zcash/manage-zcash.sh start-zaino
```

### Clean Restart
```bash
# Stop everything
~/.zcash/manage-zcash.sh stop-all

# Clean PID files if needed
rm -f ~/.zcash/*.pid

# Start fresh
~/.zcash/manage-zcash.sh start-zebra
~/.zcash/manage-zcash.sh start-zaino
```

## 🔧 Configuration

### Zebra Configuration (`zebra.toml`)
- Network settings (mainnet/testnet)
- RPC port (default: 8232)
- Data directory
- Sync settings

### Zaino Configuration (`zaino.toml`)
- Zebra connection settings
- RPC ports (JSON-RPC: 8234, gRPC: 9067)
- Database settings
- Indexing options

## 📝 Log Files

Monitor service health with:
```bash
# Real-time log monitoring
tail -f ~/.zcash/zebra.log
tail -f ~/.zcash/zaino.log

# Or use the management script
~/.zcash/manage-zcash.sh logs-zebra
~/.zcash/manage-zcash.sh logs-zaino
```

## 🔗 Integration with Your Application

Your backend application should connect to:
- **Zaino RPC**: `http://127.0.0.1:8234` (recommended)
- **Zebra RPC**: `http://127.0.0.1:8232` (direct node access)

Check your `backend/.env` file for the configured endpoint:
```bash
ZCASH_RPC_URL=http://127.0.0.1:8234
```

## 🆘 Getting Help

1. **Check Status**: `~/.zcash/manage-zcash.sh status`
2. **View Logs**: `~/.zcash/manage-zcash.sh logs-zebra` or `logs-zaino`
3. **Test RPC**: `~/.zcash/manage-zcash.sh test-rpc`
4. **Full Command List**: `~/.zcash/manage-zcash.sh` (no arguments)

## 🔄 Daily Operations

### Starting Your Development Environment
```bash
# 1. Start Zcash services
~/.zcash/manage-zcash.sh start-zebra
~/.zcash/manage-zcash.sh start-zaino

# 2. Verify everything is working
~/.zcash/manage-zcash.sh status
~/.zcash/manage-zcash.sh test-rpc

# 3. Start your application
cd ~/your-project/backend && npm start
```

### Shutting Down
```bash
# Stop Zcash services
~/.zcash/manage-zcash.sh stop-all

# Your application can be stopped with Ctrl+C
```

---

**💡 Pro Tip**: Add `~/.zcash` to your PATH to run commands from anywhere:
```bash
echo 'export PATH="$HOME/.zcash:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Now you can run from anywhere:
manage-zcash.sh status
```