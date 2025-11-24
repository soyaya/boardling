# Zcash RPC Setup - Complete Guide

## Current Situation

You have network connectivity issues preventing:
- Building Zebra/Zaino from source (can't reach crates.io)
- Accessing public RPC services
- Downloading pre-built binaries

## Solution Options

### Option 1: Resolve Network Issues (Recommended)

```bash
# Check if you're behind a corporate firewall/proxy
curl -I https://github.com
curl -I https://crates.io

# If behind proxy, configure:
export https_proxy=your-proxy:port
export http_proxy=your-proxy:port

# Or configure cargo proxy in ~/.cargo/config.toml
```

### Option 2: Manual Binary Installation

1. **On a machine with internet access:**
   - Download zcashd from: https://github.com/zcash/zcash/releases
   - Look for files like: `zcash-6.10.0-linux64.tar.gz`

2. **Transfer to your machine:**
   ```bash
   # Extract the binary
   tar -xzf zcash-*.tar.gz
   mkdir -p ~/.zcash/bin
   cp zcash-*/bin/* ~/.zcash/bin/
   ```

3. **Configure and start:**
   ```bash
   # Configuration is already created at ~/.zcash/zcash.conf
   # Update the RPC password:
   sed -i 's/your_secure_password_here_change_this/YOUR_ACTUAL_PASSWORD/' ~/.zcash/zcash.conf
   
   # Start zcashd
   ~/.zcash/start-zcashd.sh
   ```

### Option 3: Use Alternative Network Setup

If you're in a restricted environment, you might need to:

1. **Use a VPN** to bypass network restrictions
2. **Configure proxy settings** for cargo and curl
3. **Use mobile hotspot** temporarily for downloads

## Current Configuration Status

✅ **Files Created:**
- `~/.zcash/zcash.conf` - Zcashd configuration
- `~/.zcash/start-zcashd.sh` - Start script
- `~/.zcash/stop-zcashd.sh` - Stop script
- `backend/.env` - Updated with zcashd RPC settings

✅ **RPC Settings in backend/.env:**
```
ZCASH_RPC_URL=http://127.0.0.1:8232
ZCASH_RPC_USER=zcashrpc
ZCASH_RPC_PASS=your_secure_password_here_change_this
```

## Testing Your Setup

Once you have zcashd running:

```bash
# Test RPC connection
cd backend
node test-rpc-connection.js

# Should show blockchain info if working
```

## Security Notes

🔐 **Important**: Change the default RPC password in both:
- `~/.zcash/zcash.conf`
- `backend/.env`

Use a strong, unique password for production.

## Next Steps

1. **Resolve network connectivity** or **manually download zcashd**
2. **Update RPC password** in configuration files
3. **Start zcashd** and wait for blockchain sync
4. **Test RPC connection** with your backend
5. **Develop your application** using the local RPC endpoint

## Alternative: Testnet Setup

For development, you can use testnet which syncs faster:

```bash
# Add to ~/.zcash/zcash.conf
testnet=1

# Testnet RPC port is usually 18232
# Update backend/.env accordingly
ZCASH_RPC_URL=http://127.0.0.1:18232
```

## Support

If you continue having issues:
1. Check firewall settings
2. Verify available disk space (need 50GB+)
3. Ensure ports 8232/18232 are not in use
4. Check system logs for errors

Your setup is ready - you just need to get the zcashd binary and resolve the network connectivity!