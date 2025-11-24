# Zcash Setup Documentation

This directory contains all documentation and scripts for setting up Zcash infrastructure.

## Quick Start

For the fastest setup, use:
```bash
./quick-install-zcash.sh
```

## Setup Scripts

### Automated Setup
- `quick-install-zcash.sh` - One-click setup for Zebra + Zaino
- `setup-zebra-zaino-native.sh` - Native build setup for Zebra and Zaino
- `configure-zcash-env.sh` - Environment configuration script

### Manual Setup
- `setup-zcashd-manual.sh` - Manual zcashd setup (legacy)
- `setup-zcash-rpc.sh` - RPC configuration setup

### Docker Setup
- `docker-compose.zcash.yml` - Docker Compose configuration for Zcash services

## Documentation

### Setup Guides
- `FINAL_ZCASH_SETUP_SUMMARY.md` - Complete setup summary and status
- `README_ZCASH_SETUP.md` - Detailed setup instructions
- `ZCASH_SETUP_FINAL.md` - Final configuration guide
- `MANUAL_ZCASH_SETUP.md` - Manual setup procedures

### Success Documentation
- `ZCASH_SETUP_SUCCESS.md` - Successful setup verification
- `manage-zcash.sh` - Service management script

## Configuration Files

Configuration files are located in `../../config/zcash/`:
- `zebra.toml` - Zebra node configuration
- `zaino.toml` - Zaino indexer configuration

## Management Scripts

Runtime management scripts are in `~/.zcash/`:
- `manage-zcash.sh` - Main service management
- `start-zebra.sh` - Start Zebra node
- `start-zaino.sh` - Start Zaino indexer

## Network Testing

Network connectivity scripts:
- `check-network.sh` - Network connectivity verification

## Architecture

The modern Zcash stack uses:
- **Zebra**: Modern Zcash node implementation
- **Zaino**: Zcash indexer with unified RPC interface
- **Backend Integration**: Node.js backend with Zcash RPC connectivity

## Endpoints

- Zebra RPC: `http://127.0.0.1:8233`
- Zaino RPC: `http://127.0.0.1:8234` (recommended for applications)

## Troubleshooting

If you encounter issues:
1. Check network connectivity with `check-network.sh`
2. Verify services are running with `~/.zcash/manage-zcash.sh status`
3. Review logs in the respective service directories
4. Consult the setup documentation files above