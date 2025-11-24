### Zebra and Zaino: Modern Alternatives for Zcash RPC Access

Zcash RPC (JSON-RPC for blockchain queries and transactions), **Zebra** and **Zaino** are key components of the ongoing "Z3" initiative (formerly the Zcashd Deprecation Project). This project aims to replace the legacy `zcashd` node with a more secure, efficient Rust-based stack. Zebra serves as the full validator node (like `zcashd`), while Zaino acts as a lightweight indexer and RPC server (replacing `lightwalletd`). Both support RPC access and are designed to work together for better privacy, performance, and interoperability.

As of November 2025, Zebra's latest release (v3.0.0) and Zaino's pre-release (v0.1.1) make them production-ready for many use cases, with ongoing enhancements for full Z3 compatibility. Below, I'll explain how to get RPC access for each.

#### Zebra: Full Node with JSON-RPC
Zebra is a Rust-based Zcash full node that validates the blockchain and exposes a JSON-RPC interface compatible with `zcashd`. It's faster to sync (15-16 hours initial sync), more secure (memory-safe), and includes new RPC methods for network info, mempool stats, and sidechain queries. It supports NU6.1 (latest upgrade) and can interoperate with `zcashd` nodes.

1. **Install Zebra**:
   - Download the latest release from the official GitHub (zcash/zebra) for your platform (Linux, macOS, Windows; native ARM64 for Apple Silicon).
   - Follow the docs: `cargo install zebrad` (requires Rust toolchain) or use pre-built binaries.

2. **Configure zebra.toml for RPC**:
   - Create/edit `zebra.toml` in your config directory (e.g., `~/.zebra/zebra.toml` on Linux/macOS).
   - Enable RPC with these settings (TOML format):
     ```
     [rpc]
     address = "0.0.0.0:8232"  # Binds to all interfaces on default port; use "127.0.0.1:8232" for local-only
     cors = []                # Optional: Add CORS headers for web apps, e.g., ["*"]
     network = "mainnet"      # Or "testnet" for development
     ```
     - **Security note**: Restrict access with firewall rules or a VPN. RPC uses HTTP Basic Auth—add `rpcuser` and `rpcpassword` if needed via environment vars (e.g., `ZEBRA_RPC__RPCUSER=youruser`).

3. **Start Zebra**:
   - Run `zebrad --config ~/.zebra/zebra.toml`. It will sync the blockchain (~50-100 GB).
   - Check status: `zebrad getblockchaininfo`.

4. **Access the RPC**:
   - Use `zebrad` CLI for commands, e.g., `zebrad getinfo`.
   - Programmatic access (e.g., Python with `requests`):
     ```python
     import requests
     import json

     url = "http://localhost:8232"
     headers = {"content-type": "application/json"}
     payload = json.dumps({"jsonrpc": "2.0", "method": "getblockcount", "params": [], "id": 1})
     response = requests.post(url, data=payload, headers=headers)
     print(response.json())
     ```
   - New methods in v3.0.0: `getnetworkinfo`, `getmempoolinfo`, `getsidechaininfo`. Full list: Zebra RPC docs.
   - For lightwalletd support: Configure Zebra to proxy RPC for compact block streaming.

#### Zaino: Indexer and Unified RPC Server
Zaino is a Rust-based indexer that provides a single RPC API combining `lightwalletd` (gRPC for light clients) and `zcashd`-style JSON-RPC (for wallets/block explorers). It accesses finalized blockchain data via Zebra's ReadStateService and mempool via JSON-RPC. It's ideal for light clients (e.g., mobile wallets) and supports anonymous transport (Nym/Tor) for privacy. As of v0.1.1, it fully implements Lightwallet RPCs and is integrating with block explorers.

1. **Install Zaino**:
   - Clone from GitHub: `git clone https://github.com/zingolabs/zaino && cd zaino`.
   - Build: `cargo build --release` (requires Rust).
   - For testing: Use `zcash-zocal-net` tools for mainnet/testnet setup.

2. **Configure Zaino**:
   - Edit `zaino.toml` or use env vars. Key settings:
     ```
     [rpc]
     bind = "127.0.0.1:8233"  # JSON-RPC port (different from Zebra to avoid conflicts)
     [state]
     zebra_endpoint = "http://localhost:8232"  # Points to your Zebra node for data
     network = "mainnet"
     ```
     - For gRPC (Lightwallet): Enable in config and use port 9067.
     - **Security**: Use TLS for production; supports Nym for obfuscated connections.

3. **Start Zaino**:
   - Run `./target/release/zainod --config zaino.toml`. It indexes from Zebra (no full sync needed).
   - Verify: Query `getblockcount` via RPC.

4. **Access the RPC**:
   - JSON-RPC endpoint: `http://localhost:8233` (compatible with `zcashd` subset, e.g., `getbalance`, `getrawtransaction`).
   - gRPC for light clients: Use tools like `grpcurl` or libraries (e.g., for CompactTxStreamer).
   - Example Python for JSON-RPC (similar to Zebra):
     ```python
     # Same as Zebra example, but url = "http://localhost:8233"
     ```
   - Full spec: Zaino RPC API docs. It unifies services for easier adoption.

#### Comparison: Zebra vs. Zaino vs. zcashd

| Feature/Tool | Zebra | Zaino | zcashd (Legacy) |
|--------------|--------|--------|-----------------|
| **Type** | Full validator node | Indexer/RPC proxy | Full node |
| **RPC Type** | JSON-RPC (full + new methods) | JSON-RPC + gRPC (unified) | JSON-RPC only |
| **Sync Time** | 15-16 hours | None (uses Zebra) | 24+ hours |
| **Use Case** | Validation, mining proxy | Light wallets, explorers | General (being deprecated) |
| **Privacy** | Standard | Enhanced (Nym/Tor support) | Basic |
| **Status (Nov 2025)** | v3.0.0 (NU6.1) | v0.1.1 (pre-release) | Still supported, but migrate to Z3 |

#### Tips and Migration
- **Run Together**: Start Zebra first, then Zaino—it pulls data directly.
- **Deprecation Path**: Z3 aims to fully replace `zcashd` by 2026; test on testnet.
- **Troubleshooting**: Check logs for sync issues; use `zaino-testutils` for RPC validation.
- **Resources**: Zebra Book (zebra.zfnd.org), Zaino GitHub (zingolabs/zaino), Zcash Forum for community support.
 