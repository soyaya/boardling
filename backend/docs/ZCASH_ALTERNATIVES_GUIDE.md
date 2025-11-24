# Zcash Development Alternatives Guide

This guide covers WebZjs and zcash-devtool as alternatives to running full Zcash nodes like Zebra or Zaino. These alternatives help you avoid RocksDB compilation issues and provide lighter-weight development options.

## Overview

### The Problem
Running full Zcash nodes (Zebra/Zaino) can be challenging due to:
- RocksDB and C++ header compilation issues
- Large storage requirements (>100GB)
- Complex build dependencies
- Long synchronization times
- RPC authentication complexity

### The Solution
**WebZjs** and **zcash-devtool** provide alternatives that:
- Avoid RocksDB and C++ compilation entirely
- Use remote services instead of local nodes
- Offer faster setup and development cycles
- Require minimal infrastructure

## Alternative Options

### 1. WebZjs - Browser Zcash Client

**Best for:** Web wallets, browser extensions, frontend applications

#### Key Features
- Browser-only wallet operations
- gRPC-web proxy to remote lightwalletd
- No full node required
- JavaScript/TypeScript integration
- ChainSafe hosted proxies

#### Quick Start
```bash
# Install WebZjs
npm install @chainsafe/webzjs-wallet

# Get configuration via API
curl http://localhost:3000/api/webzjs/config

# Create wallet configuration
curl -X POST http://localhost:3000/api/webzjs/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "wallet_name": "My WebZjs Wallet", "network": "testnet"}'
```

#### Basic Usage Example
```javascript
import { initWasm, initThreadPool, Wallet } from "@chainsafe/webzjs-wallet";

// Initialize (once per page load)
await initWasm();
await initThreadPool(navigator.hardwareConcurrency || 4);

// Create or restore wallet
const wallet = await Wallet.create();
// OR: const wallet = await Wallet.fromMnemonic("your seed phrase");

// Sync with testnet
await wallet.synchronize("https://zcash-testnet.chainsafe.dev");

// Get wallet info
console.log("Address:", wallet.getAddress());
console.log("Balance:", await wallet.getBalance());
```

#### API Endpoints
- `GET /api/webzjs/config` - Configuration and setup instructions
- `POST /api/webzjs/wallet/create` - Create wallet configuration
- `GET /api/webzjs/wallet/user/:user_id` - List user wallets
- `GET /api/webzjs/wallet/:wallet_id/setup` - Get setup instructions
- `POST /api/webzjs/invoice/create` - Create browser-based invoice
- `GET /api/webzjs/guide` - Complete setup guide

### 2. zcash-devtool - CLI Prototyping Tool

**Best for:** Local testing, prototyping, CLI-based development

#### Key Features
- CLI-based wallet operations
- Remote light server synchronization
- Pure Rust implementation (no C++ dependencies)
- SQLite storage (no RocksDB)
- Official Zcash Foundation tool

#### Quick Start
```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Age encryption tool
# macOS: brew install age
# Ubuntu: apt install age

# Clone and build zcash-devtool
git clone https://github.com/zcash/zcash-devtool.git
cd zcash-devtool

# Generate encryption key
age-keygen -o identity.age
export AGE_FILE_SSH_KEY=1

# Get configuration via API
curl http://localhost:3000/api/zcash-devtool/config

# Create wallet configuration
curl -X POST http://localhost:3000/api/zcash-devtool/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "wallet_name": "My CLI Wallet", "network": "testnet"}'
```

#### Basic CLI Usage
```bash
# Initialize wallet
cargo run --release -- wallet -w ./mywallet init --name "MyWallet" -i ./identity.age -n testnet

# Sync with testnet
cargo run --release -- wallet -w ./mywallet sync --server zec-testnet.rocks

# Check balance
cargo run --release -- wallet -w ./mywallet balance

# Generate new address
cargo run --release -- wallet -w ./mywallet new-address

# List transactions
cargo run --release -- wallet -w ./mywallet list-txs
```

#### API Endpoints
- `GET /api/zcash-devtool/config` - Configuration and setup instructions
- `POST /api/zcash-devtool/wallet/create` - Create wallet configuration
- `GET /api/zcash-devtool/wallet/user/:user_id` - List user wallets
- `GET /api/zcash-devtool/wallet/:wallet_id/commands` - Get CLI commands
- `POST /api/zcash-devtool/invoice/create` - Create CLI-based invoice
- `GET /api/zcash-devtool/guide` - Complete setup guide

## Comparison Matrix

| Feature | WebZjs | zcash-devtool | Full RPC (Zebra/Zaino) |
|---------|--------|---------------|-------------------------|
| **Setup Time** | 5-15 minutes | 15-30 minutes | 1-4 hours |
| **Node Required** | No | No | Yes |
| **Build Issues** | None | Minimal | High (RocksDB/C++) |
| **Platform** | Browser | CLI | Server |
| **Storage** | None | Minimal | >100GB |
| **Network** | Proxy | Light server | Full sync |
| **Production Ready** | No | No | Yes |

## Decision Guide

### Choose WebZjs if you need:
- Browser-based wallet applications
- Frontend-only Zcash integration
- Quick web app prototyping
- No server infrastructure
- JavaScript/TypeScript development

### Choose zcash-devtool if you need:
- CLI-based wallet testing
- Local development and prototyping
- Learning Zcash concepts
- Official Zcash Foundation tools
- Rust-based development

### Choose Full RPC if you need:
- Production server applications
- Complete RPC functionality
- Advanced transaction features
- Enterprise-grade solutions
- Full blockchain access

## Getting Started

### 1. Get Overview and Recommendations
```bash
# Get comprehensive overview
curl http://localhost:3000/api/alternatives/overview

# Get personalized recommendation
curl -X POST http://localhost:3000/api/alternatives/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "use_case": "web_wallet",
    "platform": "browser", 
    "experience_level": "beginner",
    "production_ready": false,
    "infrastructure_preference": "minimal"
  }'

# Compare setup complexity
curl http://localhost:3000/api/alternatives/setup-comparison
```

### 2. Choose Your Path

#### For WebZjs (Browser Development):
1. `GET /api/webzjs/config` - Review configuration
2. Install: `npm install @chainsafe/webzjs-wallet`
3. `POST /api/webzjs/wallet/create` - Create wallet config
4. `GET /api/webzjs/guide` - Follow complete guide
5. Implement browser-based wallet

#### For zcash-devtool (CLI Development):
1. `GET /api/zcash-devtool/config` - Review configuration
2. Install Rust toolchain and Age encryption
3. Clone and build zcash-devtool
4. `POST /api/zcash-devtool/wallet/create` - Create wallet config
5. `GET /api/zcash-devtool/guide` - Follow complete guide
6. Use CLI commands for wallet operations

## Integration Examples

### WebZjs Integration
```javascript
// In your web application
import { initWasm, initThreadPool, Wallet } from "@chainsafe/webzjs-wallet";

class ZcashWallet {
  constructor() {
    this.wallet = null;
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await initWasm();
      await initThreadPool(4);
      this.initialized = true;
    }
  }

  async createWallet(mnemonic = null) {
    await this.initialize();
    this.wallet = mnemonic 
      ? await Wallet.fromMnemonic(mnemonic)
      : await Wallet.create();
    return this.wallet;
  }

  async syncWallet(network = 'testnet') {
    const proxyUrl = network === 'mainnet' 
      ? 'https://zcash-mainnet.chainsafe.dev'
      : 'https://zcash-testnet.chainsafe.dev';
    
    await this.wallet.synchronize(proxyUrl);
  }

  async getWalletInfo() {
    return {
      address: this.wallet.getAddress(),
      balance: await this.wallet.getBalance()
    };
  }
}
```

### zcash-devtool Integration
```bash
#!/bin/bash
# Wallet management script

WALLET_PATH="./mywallet"
NETWORK="testnet"
SERVER="zec-testnet.rocks"

# Function to create wallet
create_wallet() {
    cargo run --release -- wallet -w $WALLET_PATH init \
        --name "MyWallet" -i ./identity.age -n $NETWORK
}

# Function to sync wallet
sync_wallet() {
    cargo run --release -- wallet -w $WALLET_PATH sync --server $SERVER
}

# Function to get balance
get_balance() {
    cargo run --release -- wallet -w $WALLET_PATH balance
}

# Function to generate address
new_address() {
    cargo run --release -- wallet -w $WALLET_PATH new-address
}

# Main script logic
case "$1" in
    create) create_wallet ;;
    sync) sync_wallet ;;
    balance) get_balance ;;
    address) new_address ;;
    *) echo "Usage: $0 {create|sync|balance|address}" ;;
esac
```

## Troubleshooting

### WebZjs Issues
- **Build errors**: Ensure Rust nightly and wasm-pack are installed
- **Sync failures**: Check network connection and proxy availability
- **Balance not updating**: Call `wallet.synchronize()` to refresh
- **Browser compatibility**: Requires modern browsers with WebAssembly

### zcash-devtool Issues
- **Build fails**: Update Rust with `rustup update`
- **Age key errors**: Generate key with `age-keygen -o identity.age`
- **Sync failures**: Try different light server or check network
- **Wallet corruption**: Use reset command to reinitialize

## Migration Paths

### From Full RPC to Alternatives

#### To WebZjs:
1. Replace RPC calls with WebZjs wallet methods
2. Move from server-side to browser-side operations
3. Use proxy URLs instead of local RPC endpoints
4. Adapt authentication to browser-based flows

#### To zcash-devtool:
1. Convert RPC calls to CLI commands
2. Use file-based wallet storage
3. Implement CLI command execution in your application
4. Adapt to stateless operation model

### Prototyping Workflow:
1. **Start** with zcash-devtool for concept validation
2. **Move** to WebZjs for browser implementation
3. **Scale** to full RPC for production deployment

## Resources

### WebZjs
- Repository: https://github.com/ChainSafe/WebZjs
- Documentation: https://chainsafe.github.io/WebZjs/
- Examples: https://github.com/ChainSafe/WebZjs/tree/main/examples

### zcash-devtool
- Repository: https://github.com/zcash/zcash-devtool
- Walkthrough: https://github.com/zcash/zcash-devtool/blob/main/doc/walkthrough.md
- Video Guide: https://www.youtube.com/watch?v=5gvQF5oFT8E

### General Zcash Development
- Zcash Documentation: https://zcash.readthedocs.io/
- Community Forum: https://forum.zcashcommunity.com/
- Developer Discord: https://discord.gg/zcash

## API Reference

All alternative routes are available under:
- `/api/alternatives/*` - Overview and recommendations
- `/api/webzjs/*` - WebZjs browser client
- `/api/zcash-devtool/*` - CLI prototyping tool

Use `GET /api` to see the complete API documentation with all available endpoints.