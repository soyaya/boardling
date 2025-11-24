import express from "express";
import { pool } from "../config/appConfig.js";
import { optionalApiKey } from "../middleware/auth.js";

const router = express.Router();

/**
 * WebZjs Alternative Routes
 * Browser-based Zcash client library for web wallets/apps
 * Uses gRPC-web proxy to remote lightwalletd service
 */

/**
 * Get WebZjs configuration and setup instructions
 * GET /api/webzjs/config
 */
router.get("/config", optionalApiKey, async (req, res) => {
  res.json({
    success: true,
    webzjs: {
      name: "WebZjs - Browser Zcash Client",
      description: "Browser-focused client library for building web-based Zcash wallets/apps",
      version: "latest",
      repository: "https://github.com/ChainSafe/WebZjs",
      documentation: "https://chainsafe.github.io/WebZjs/",
      
      // Network endpoints
      networks: {
        mainnet: {
          proxy_url: "https://zcash-mainnet.chainsafe.dev",
          description: "ChainSafe mainnet proxy"
        },
        testnet: {
          proxy_url: "https://zcash-testnet.chainsafe.dev", 
          description: "ChainSafe testnet proxy"
        }
      },

      // Installation instructions
      installation: {
        npm: "npm install @chainsafe/webzjs-wallet",
        yarn: "yarn add @chainsafe/webzjs-wallet",
        requirements: [
          "Node.js/Yarn for development",
          "Rust nightly (rustup install nightly-2024-08-07)",
          "wasm-pack (cargo install wasm-pack)",
          "Clang 17+ (brew install llvm on macOS)"
        ]
      },

      // Key features
      features: [
        "Browser-only wallet operations",
        "No full node required",
        "Remote lightwalletd proxy",
        "Wallet creation from mnemonic",
        "Balance synchronization",
        "Shielded address generation",
        "Transaction scanning"
      ],

      // Limitations
      limitations: [
        "Browser-only (no server-side Node.js without extra setup)",
        "Depends on external proxies",
        "Under active development - no audits yet",
        "Not for sending TXs without extensions",
        "Prototype/development use only"
      ],

      // Basic usage example
      example_code: {
        initialization: `
import { initWasm, initThreadPool, Wallet } from "@chainsafe/webzjs-wallet";

// Initialize (once per page load)
await initWasm();
await initThreadPool(navigator.hardwareConcurrency || 4);
        `,
        wallet_creation: `
// Create new wallet
const wallet = await Wallet.create();

// Or from mnemonic
const wallet = await Wallet.fromMnemonic("your seed phrase");
        `,
        synchronization: `
// Sync with mainnet
await wallet.synchronize("https://zcash-mainnet.chainsafe.dev");

// Get address and balance
console.log("Address:", wallet.getAddress());
console.log("Balance:", await wallet.getBalance());
        `
      }
    }
  });
});

/**
 * Create WebZjs wallet configuration for user
 * POST /api/webzjs/wallet/create
 */
router.post("/wallet/create", optionalApiKey, async (req, res) => {
  const { user_id, wallet_name, network = 'testnet', mnemonic } = req.body;

  if (!user_id) {
    return res.status(400).json({
      error: "Missing required field: user_id"
    });
  }

  try {
    // Check if user exists
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate network
    const validNetworks = ['mainnet', 'testnet'];
    if (!validNetworks.includes(network)) {
      return res.status(400).json({
        error: "Invalid network",
        valid_networks: validNetworks
      });
    }

    // Store WebZjs wallet configuration
    const result = await pool.query(
      `INSERT INTO webzjs_wallets (user_id, name, network, mnemonic_encrypted, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id, user_id, name, network, created_at`,
      [
        user_id, 
        wallet_name || 'WebZjs Wallet',
        network,
        mnemonic ? Buffer.from(mnemonic).toString('base64') : null // Simple encoding - use proper encryption in production
      ]
    );

    const wallet = result.rows[0];

    const proxyUrl = network === 'mainnet' 
      ? 'https://zcash-mainnet.chainsafe.dev'
      : 'https://zcash-testnet.chainsafe.dev';

    res.status(201).json({
      success: true,
      wallet: {
        id: wallet.id,
        user_id: wallet.user_id,
        name: wallet.name,
        network: wallet.network,
        proxy_url: proxyUrl,
        created_at: wallet.created_at
      },
      setup_instructions: {
        step1: "Install WebZjs: npm install @chainsafe/webzjs-wallet",
        step2: "Initialize in your app with the provided proxy_url",
        step3: mnemonic ? "Use provided mnemonic to restore wallet" : "Generate new wallet",
        step4: "Call wallet.synchronize() to sync with blockchain"
      },
      example_usage: `
// Initialize WebZjs
import { initWasm, initThreadPool, Wallet } from "@chainsafe/webzjs-wallet";

await initWasm();
await initThreadPool(4);

// ${mnemonic ? 'Restore from mnemonic' : 'Create new wallet'}
const wallet = ${mnemonic ? `await Wallet.fromMnemonic("${mnemonic}")` : 'await Wallet.create()'};

// Sync with ${network}
await wallet.synchronize("${proxyUrl}");

// Get wallet info
console.log("Address:", wallet.getAddress());
console.log("Balance:", await wallet.getBalance());
      `
    });

  } catch (error) {
    console.error("WebZjs wallet creation error:", error);
    res.status(500).json({
      error: "Failed to create WebZjs wallet configuration",
      details: error.message
    });
  }
});

/**
 * Get user's WebZjs wallets
 * GET /api/webzjs/wallet/user/:user_id
 */
router.get("/wallet/user/:user_id", optionalApiKey, async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, user_id, name, network, created_at FROM webzjs_wallets WHERE user_id = $1 ORDER BY created_at DESC",
      [user_id]
    );

    const wallets = result.rows.map(wallet => ({
      id: wallet.id,
      user_id: wallet.user_id,
      name: wallet.name,
      network: wallet.network,
      proxy_url: wallet.network === 'mainnet' 
        ? 'https://zcash-mainnet.chainsafe.dev'
        : 'https://zcash-testnet.chainsafe.dev',
      created_at: wallet.created_at
    }));

    res.json({
      success: true,
      wallets: wallets,
      total_count: wallets.length
    });

  } catch (error) {
    console.error("Get WebZjs wallets error:", error);
    res.status(500).json({
      error: "Failed to get WebZjs wallets",
      details: error.message
    });
  }
});

/**
 * Get WebZjs wallet details and setup
 * GET /api/webzjs/wallet/:wallet_id/setup
 */
router.get("/wallet/:wallet_id/setup", optionalApiKey, async (req, res) => {
  const { wallet_id } = req.params;

  try {
    const walletResult = await pool.query(
      "SELECT * FROM webzjs_wallets WHERE id = $1",
      [wallet_id]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({ error: "WebZjs wallet not found" });
    }

    const wallet = walletResult.rows[0];
    const proxyUrl = wallet.network === 'mainnet' 
      ? 'https://zcash-mainnet.chainsafe.dev'
      : 'https://zcash-testnet.chainsafe.dev';

    // Decode mnemonic if available (use proper decryption in production)
    const mnemonic = wallet.mnemonic_encrypted 
      ? Buffer.from(wallet.mnemonic_encrypted, 'base64').toString()
      : null;

    res.json({
      success: true,
      wallet: {
        id: wallet.id,
        user_id: wallet.user_id,
        name: wallet.name,
        network: wallet.network,
        proxy_url: proxyUrl,
        has_mnemonic: !!mnemonic,
        created_at: wallet.created_at
      },
      setup: {
        installation: "npm install @chainsafe/webzjs-wallet",
        initialization_code: `
import { initWasm, initThreadPool, Wallet } from "@chainsafe/webzjs-wallet";

// Initialize WebZjs (once per page load)
await initWasm();
await initThreadPool(navigator.hardwareConcurrency || 4);

// ${mnemonic ? 'Restore wallet from mnemonic' : 'Create new wallet'}
const wallet = ${mnemonic ? `await Wallet.fromMnemonic("${mnemonic}")` : 'await Wallet.create()'};

// Synchronize with ${wallet.network}
await wallet.synchronize("${proxyUrl}");

// Get wallet information
const address = wallet.getAddress();
const balance = await wallet.getBalance();

console.log("Wallet Address:", address);
console.log("Current Balance:", balance, "ZEC");
        `,
        network_info: {
          network: wallet.network,
          proxy_url: proxyUrl,
          description: wallet.network === 'mainnet' ? 'Production network' : 'Test network'
        }
      }
    });

  } catch (error) {
    console.error("Get WebZjs wallet setup error:", error);
    res.status(500).json({
      error: "Failed to get WebZjs wallet setup",
      details: error.message
    });
  }
});

/**
 * Create WebZjs invoice (browser-based payment)
 * POST /api/webzjs/invoice/create
 */
router.post("/invoice/create", optionalApiKey, async (req, res) => {
  const { user_id, wallet_id, amount_zec, item_id, description } = req.body;

  if (!user_id || !amount_zec) {
    return res.status(400).json({
      error: "Missing required fields: user_id, amount_zec"
    });
  }

  try {
    let walletInfo = null;

    if (wallet_id) {
      // Get wallet info
      const walletResult = await pool.query(
        "SELECT * FROM webzjs_wallets WHERE id = $1 AND user_id = $2",
        [wallet_id, user_id]
      );

      if (walletResult.rows.length === 0) {
        return res.status(404).json({ error: "WebZjs wallet not found" });
      }

      walletInfo = walletResult.rows[0];
    }

    // Create WebZjs invoice
    const result = await pool.query(
      `INSERT INTO webzjs_invoices (user_id, wallet_id, amount_zec, item_id, description, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [user_id, wallet_id || null, amount_zec, item_id || null, description || null]
    );

    const invoice = result.rows[0];

    const proxyUrl = walletInfo?.network === 'mainnet' 
      ? 'https://zcash-mainnet.chainsafe.dev'
      : 'https://zcash-testnet.chainsafe.dev';

    res.status(201).json({
      success: true,
      invoice: {
        id: invoice.id,
        user_id: invoice.user_id,
        wallet_id: invoice.wallet_id,
        amount_zec: parseFloat(invoice.amount_zec),
        item_id: invoice.item_id,
        description: invoice.description,
        status: invoice.status,
        created_at: invoice.created_at
      },
      payment_setup: {
        network: walletInfo?.network || 'testnet',
        proxy_url: proxyUrl,
        instructions: [
          "Initialize WebZjs in your browser application",
          "Create or restore wallet using the configured mnemonic",
          "Synchronize wallet with the proxy URL",
          "Generate receiving address from wallet",
          "Display address and amount to user for payment"
        ],
        browser_code: `
// Payment setup for invoice ${invoice.id}
const wallet = await Wallet.fromMnemonic("your-mnemonic");
await wallet.synchronize("${proxyUrl}");

const receivingAddress = wallet.getAddress();
const paymentAmount = ${amount_zec};

// Display to user:
console.log("Send", paymentAmount, "ZEC to:", receivingAddress);
        `
      }
    });

  } catch (error) {
    console.error("WebZjs invoice creation error:", error);
    res.status(500).json({
      error: "Failed to create WebZjs invoice",
      details: error.message
    });
  }
});

/**
 * Get WebZjs setup guide and troubleshooting
 * GET /api/webzjs/guide
 */
router.get("/guide", optionalApiKey, async (req, res) => {
  res.json({
    success: true,
    webzjs_setup_guide: {
      overview: "WebZjs is a browser-focused Zcash client library that avoids running full nodes by using remote lightwalletd proxies.",
      
      advantages: [
        "No full node compilation required",
        "No RocksDB or C++ header issues", 
        "Browser-based wallet operations",
        "Lightweight and fast setup",
        "No RPC authentication needed"
      ],

      setup_steps: {
        step1: {
          title: "Install Dependencies",
          commands: [
            "npm install @chainsafe/webzjs-wallet",
            "# OR",
            "yarn add @chainsafe/webzjs-wallet"
          ]
        },
        step2: {
          title: "Install Build Requirements (one-time)",
          commands: [
            "rustup install nightly-2024-08-07",
            "cargo install wasm-pack",
            "# On macOS: brew install llvm"
          ]
        },
        step3: {
          title: "Initialize in Your App",
          code: `
import { initWasm, initThreadPool, Wallet } from "@chainsafe/webzjs-wallet";

// Initialize once per page load
await initWasm();
await initThreadPool(navigator.hardwareConcurrency || 4);
          `
        },
        step4: {
          title: "Create or Restore Wallet",
          code: `
// Create new wallet
const wallet = await Wallet.create();

// OR restore from mnemonic
const wallet = await Wallet.fromMnemonic("your 12-word seed phrase");
          `
        },
        step5: {
          title: "Synchronize and Use",
          code: `
// Sync with network (mainnet or testnet)
await wallet.synchronize("https://zcash-mainnet.chainsafe.dev");

// Get wallet info
const address = wallet.getAddress();
const balance = await wallet.getBalance();

console.log("Address:", address);
console.log("Balance:", balance, "ZEC");
          `
        }
      },

      network_endpoints: {
        mainnet: "https://zcash-mainnet.chainsafe.dev",
        testnet: "https://zcash-testnet.chainsafe.dev"
      },

      troubleshooting: {
        "Build errors": "Ensure Rust nightly and wasm-pack are installed correctly",
        "Sync failures": "Check network connection and proxy endpoint availability",
        "Balance not updating": "Call wallet.synchronize() to refresh from network",
        "Browser compatibility": "WebZjs requires modern browsers with WebAssembly support"
      },

      limitations: [
        "Browser-only (no server-side Node.js without extra setup)",
        "Depends on ChainSafe proxy availability",
        "Under active development - use for prototyping only",
        "Limited transaction sending capabilities",
        "No production security audits yet"
      ],

      resources: {
        documentation: "https://chainsafe.github.io/WebZjs/",
        repository: "https://github.com/ChainSafe/WebZjs",
        examples: "https://github.com/ChainSafe/WebZjs/tree/main/examples"
      }
    }
  });
});

export default router;