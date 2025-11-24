import express from "express";
import { pool } from "../config/appConfig.js";
import { optionalApiKey } from "../middleware/auth.js";

const router = express.Router();

/**
 * Zcash-devtool Alternative Routes
 * CLI prototyping tool for local testing of wallets and transactions
 * Uses lightweight Rust crates without a full node
 */

/**
 * Get zcash-devtool configuration and setup instructions
 * GET /api/zcash-devtool/config
 */
router.get("/config", optionalApiKey, async (req, res) => {
  res.json({
    success: true,
    zcash_devtool: {
      name: "zcash-devtool - CLI Prototyping Tool",
      description: "Official Zcash Foundation tool for quick CLI-based testing of wallets and transactions",
      version: "latest",
      repository: "https://github.com/zcash/zcash-devtool",
      documentation: "https://github.com/zcash/zcash-devtool/blob/main/doc/walkthrough.md",
      video_guide: "https://www.youtube.com/watch?v=5gvQF5oFT8E",
      
      // Network servers
      networks: {
        mainnet: {
          server: "zec.rocks",
          description: "Mainnet light server"
        },
        testnet: {
          server: "zec-testnet.rocks", 
          description: "Testnet light server"
        }
      },

      // Installation requirements
      requirements: [
        "Rust toolchain (curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh)",
        "Age encryption tool (for wallet security)",
        "Git (for cloning repository)"
      ],

      // Key features
      features: [
        "CLI-based wallet operations",
        "No full node required",
        "Remote light server sync",
        "Wallet creation and management",
        "Transaction scanning",
        "SQLite storage (no RocksDB)",
        "Pure Rust implementation"
      ],

      // Limitations
      limitations: [
        "CLI-only interface",
        "Experimental - no security guarantees",
        "Basic prototyping only",
        "No advanced transaction building",
        "Sync can be slow for large histories"
      ],

      // Installation steps
      installation: {
        step1: "git clone https://github.com/zcash/zcash-devtool.git",
        step2: "cd zcash-devtool",
        step3: "cargo run --release -- --help"
      },

      // Age setup for encryption
      age_setup: {
        install: "# Install age: brew install age (macOS) or apt install age (Ubuntu)",
        generate_key: "age-keygen -o identity.age",
        environment: "export AGE_FILE_SSH_KEY=1"
      }
    }
  });
});

/**
 * Create zcash-devtool wallet configuration for user
 * POST /api/zcash-devtool/wallet/create
 */
router.post("/wallet/create", optionalApiKey, async (req, res) => {
  const { user_id, wallet_name, network = 'testnet', wallet_path } = req.body;

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

    // Store zcash-devtool wallet configuration
    const result = await pool.query(
      `INSERT INTO devtool_wallets (user_id, name, network, wallet_path, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [
        user_id, 
        wallet_name || 'Devtool Wallet',
        network,
        wallet_path || `./wallet_${user_id}_${Date.now()}`
      ]
    );

    const wallet = result.rows[0];

    const serverUrl = network === 'mainnet' ? 'zec.rocks' : 'zec-testnet.rocks';

    res.status(201).json({
      success: true,
      wallet: {
        id: wallet.id,
        user_id: wallet.user_id,
        name: wallet.name,
        network: wallet.network,
        wallet_path: wallet.wallet_path,
        server_url: serverUrl,
        created_at: wallet.created_at
      },
      setup_commands: {
        prerequisites: [
          "# Install Rust if not already installed",
          "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
          "",
          "# Install Age encryption tool",
          "# macOS: brew install age",
          "# Ubuntu: apt install age",
          "",
          "# Generate Age key for wallet encryption",
          "age-keygen -o identity.age",
          "export AGE_FILE_SSH_KEY=1"
        ],
        installation: [
          "git clone https://github.com/zcash/zcash-devtool.git",
          "cd zcash-devtool"
        ],
        wallet_creation: [
          `cargo run --release -- wallet -w ${wallet.wallet_path} init --name "${wallet.name}" -i ./identity.age -n ${network}`,
          "",
          "# This will generate a mnemonic and create the wallet"
        ],
        synchronization: [
          `cargo run --release -- wallet -w ${wallet.wallet_path} sync --server ${serverUrl}`,
          "",
          "# Sync wallet with ${network} network"
        ],
        balance_check: [
          `cargo run --release -- wallet -w ${wallet.wallet_path} balance`,
          "",
          "# Check wallet balance and UTXOs"
        ]
      }
    });

  } catch (error) {
    console.error("zcash-devtool wallet creation error:", error);
    res.status(500).json({
      error: "Failed to create zcash-devtool wallet configuration",
      details: error.message
    });
  }
});

/**
 * Get user's zcash-devtool wallets
 * GET /api/zcash-devtool/wallet/user/:user_id
 */
router.get("/wallet/user/:user_id", optionalApiKey, async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM devtool_wallets WHERE user_id = $1 ORDER BY created_at DESC",
      [user_id]
    );

    const wallets = result.rows.map(wallet => ({
      id: wallet.id,
      user_id: wallet.user_id,
      name: wallet.name,
      network: wallet.network,
      wallet_path: wallet.wallet_path,
      server_url: wallet.network === 'mainnet' ? 'zec.rocks' : 'zec-testnet.rocks',
      created_at: wallet.created_at
    }));

    res.json({
      success: true,
      wallets: wallets,
      total_count: wallets.length
    });

  } catch (error) {
    console.error("Get zcash-devtool wallets error:", error);
    res.status(500).json({
      error: "Failed to get zcash-devtool wallets",
      details: error.message
    });
  }
});

/**
 * Get zcash-devtool wallet commands and usage
 * GET /api/zcash-devtool/wallet/:wallet_id/commands
 */
router.get("/wallet/:wallet_id/commands", optionalApiKey, async (req, res) => {
  const { wallet_id } = req.params;

  try {
    const walletResult = await pool.query(
      "SELECT * FROM devtool_wallets WHERE id = $1",
      [wallet_id]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({ error: "zcash-devtool wallet not found" });
    }

    const wallet = walletResult.rows[0];
    const serverUrl = wallet.network === 'mainnet' ? 'zec.rocks' : 'zec-testnet.rocks';

    res.json({
      success: true,
      wallet: {
        id: wallet.id,
        name: wallet.name,
        network: wallet.network,
        wallet_path: wallet.wallet_path,
        server_url: serverUrl
      },
      commands: {
        basic_operations: {
          "Initialize wallet": `cargo run --release -- wallet -w ${wallet.wallet_path} init --name "${wallet.name}" -i ./identity.age -n ${wallet.network}`,
          "Sync with network": `cargo run --release -- wallet -w ${wallet.wallet_path} sync --server ${serverUrl}`,
          "Check balance": `cargo run --release -- wallet -w ${wallet.wallet_path} balance`,
          "List addresses": `cargo run --release -- wallet -w ${wallet.wallet_path} addresses`,
          "Get new address": `cargo run --release -- wallet -w ${wallet.wallet_path} new-address`
        },
        
        advanced_operations: {
          "List transactions": `cargo run --release -- wallet -w ${wallet.wallet_path} list-txs`,
          "Show wallet info": `cargo run --release -- wallet -w ${wallet.wallet_path} info`,
          "Export seed": `cargo run --release -- wallet -w ${wallet.wallet_path} export-seed`,
          "Reset wallet": `cargo run --release -- wallet -w ${wallet.wallet_path} reset`
        },

        network_specific: {
          network: wallet.network,
          server: serverUrl,
          switch_network: wallet.network === 'testnet' 
            ? "Use -n mainnet and --server zec.rocks for mainnet"
            : "Use -n testnet and --server zec-testnet.rocks for testnet"
        },

        troubleshooting: {
          "Sync issues": "Ensure network connection and try different light server",
          "Age key errors": "Make sure identity.age exists and AGE_FILE_SSH_KEY=1 is set",
          "Build errors": "Run 'cargo clean' and try building again",
          "Wallet corruption": "Use the reset command to reinitialize wallet"
        }
      },

      usage_examples: {
        complete_workflow: [
          "# 1. Generate Age encryption key",
          "age-keygen -o identity.age",
          "export AGE_FILE_SSH_KEY=1",
          "",
          "# 2. Initialize wallet",
          `cargo run --release -- wallet -w ${wallet.wallet_path} init --name "${wallet.name}" -i ./identity.age -n ${wallet.network}`,
          "",
          "# 3. Sync with network", 
          `cargo run --release -- wallet -w ${wallet.wallet_path} sync --server ${serverUrl}`,
          "",
          "# 4. Check balance and addresses",
          `cargo run --release -- wallet -w ${wallet.wallet_path} balance`,
          `cargo run --release -- wallet -w ${wallet.wallet_path} addresses`,
          "",
          "# 5. Generate new receiving address",
          `cargo run --release -- wallet -w ${wallet.wallet_path} new-address`
        ]
      }
    });

  } catch (error) {
    console.error("Get zcash-devtool commands error:", error);
    res.status(500).json({
      error: "Failed to get zcash-devtool commands",
      details: error.message
    });
  }
});

/**
 * Create zcash-devtool invoice (CLI-based payment tracking)
 * POST /api/zcash-devtool/invoice/create
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
        "SELECT * FROM devtool_wallets WHERE id = $1 AND user_id = $2",
        [wallet_id, user_id]
      );

      if (walletResult.rows.length === 0) {
        return res.status(404).json({ error: "zcash-devtool wallet not found" });
      }

      walletInfo = walletResult.rows[0];
    }

    // Create devtool invoice
    const result = await pool.query(
      `INSERT INTO devtool_invoices (user_id, wallet_id, amount_zec, item_id, description, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [user_id, wallet_id || null, amount_zec, item_id || null, description || null]
    );

    const invoice = result.rows[0];

    const serverUrl = walletInfo?.network === 'mainnet' ? 'zec.rocks' : 'zec-testnet.rocks';

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
        server_url: serverUrl,
        wallet_path: walletInfo?.wallet_path,
        instructions: [
          "Use zcash-devtool CLI to generate receiving address",
          "Provide address to payer for payment",
          "Sync wallet periodically to check for payments",
          "Verify payment amount matches invoice"
        ],
        cli_commands: walletInfo ? {
          "Generate address": `cargo run --release -- wallet -w ${walletInfo.wallet_path} new-address`,
          "Sync wallet": `cargo run --release -- wallet -w ${walletInfo.wallet_path} sync --server ${serverUrl}`,
          "Check balance": `cargo run --release -- wallet -w ${walletInfo.wallet_path} balance`,
          "List transactions": `cargo run --release -- wallet -w ${walletInfo.wallet_path} list-txs`
        } : {
          note: "Create a wallet first to get specific CLI commands"
        }
      }
    });

  } catch (error) {
    console.error("zcash-devtool invoice creation error:", error);
    res.status(500).json({
      error: "Failed to create zcash-devtool invoice",
      details: error.message
    });
  }
});

/**
 * Get zcash-devtool setup guide and troubleshooting
 * GET /api/zcash-devtool/guide
 */
router.get("/guide", optionalApiKey, async (req, res) => {
  res.json({
    success: true,
    zcash_devtool_guide: {
      overview: "zcash-devtool is an official Zcash Foundation CLI tool for prototyping wallet functionality without running a full node.",
      
      advantages: [
        "No full node compilation required",
        "No RocksDB or C++ dependencies",
        "Pure Rust implementation",
        "SQLite storage",
        "Remote light server sync",
        "Official Zcash Foundation tool"
      ],

      setup_steps: {
        step1: {
          title: "Install Rust Toolchain",
          commands: [
            "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
            "source ~/.cargo/env"
          ]
        },
        step2: {
          title: "Install Age Encryption Tool",
          commands: [
            "# macOS:",
            "brew install age",
            "",
            "# Ubuntu/Debian:",
            "apt install age",
            "",
            "# Or download from: https://github.com/FiloSottile/age/releases"
          ]
        },
        step3: {
          title: "Clone and Build zcash-devtool",
          commands: [
            "git clone https://github.com/zcash/zcash-devtool.git",
            "cd zcash-devtool",
            "cargo run --release -- --help"
          ]
        },
        step4: {
          title: "Setup Age Encryption",
          commands: [
            "age-keygen -o identity.age",
            "export AGE_FILE_SSH_KEY=1",
            "# Add to ~/.bashrc or ~/.zshrc for persistence"
          ]
        },
        step5: {
          title: "Create and Initialize Wallet",
          commands: [
            "cargo run --release -- wallet -w ./mywallet init --name \"MyWallet\" -i ./identity.age -n testnet",
            "# This generates a mnemonic and creates the wallet"
          ]
        },
        step6: {
          title: "Sync and Use Wallet",
          commands: [
            "cargo run --release -- wallet -w ./mywallet sync --server zec-testnet.rocks",
            "cargo run --release -- wallet -w ./mywallet balance",
            "cargo run --release -- wallet -w ./mywallet new-address"
          ]
        }
      },

      network_servers: {
        mainnet: "zec.rocks",
        testnet: "zec-testnet.rocks"
      },

      common_commands: {
        wallet_management: {
          "Initialize wallet": "cargo run --release -- wallet -w <path> init --name <name> -i ./identity.age -n <network>",
          "Sync wallet": "cargo run --release -- wallet -w <path> sync --server <server>",
          "Check balance": "cargo run --release -- wallet -w <path> balance",
          "List addresses": "cargo run --release -- wallet -w <path> addresses",
          "Generate address": "cargo run --release -- wallet -w <path> new-address",
          "List transactions": "cargo run --release -- wallet -w <path> list-txs",
          "Export seed": "cargo run --release -- wallet -w <path> export-seed",
          "Reset wallet": "cargo run --release -- wallet -w <path> reset"
        }
      },

      troubleshooting: {
        "Build fails": [
          "Ensure Rust is properly installed: rustc --version",
          "Update Rust: rustup update",
          "Clean build: cargo clean && cargo build --release"
        ],
        "Age key errors": [
          "Generate key: age-keygen -o identity.age",
          "Set environment: export AGE_FILE_SSH_KEY=1",
          "Check key exists: ls -la identity.age"
        ],
        "Sync failures": [
          "Check network connection",
          "Try different light server",
          "Verify network parameter (mainnet/testnet)"
        ],
        "Wallet corruption": [
          "Reset wallet: cargo run --release -- wallet -w <path> reset",
          "Restore from seed if available",
          "Create new wallet if needed"
        ]
      },

      limitations: [
        "CLI-only interface (no GUI)",
        "Experimental tool - not for production",
        "Basic functionality only",
        "No advanced transaction features",
        "Requires manual command execution"
      ],

      integration_tips: [
        "Export addresses/seeds to integrate with other tools",
        "Use for prototyping before full implementation",
        "Good for testing wallet logic",
        "Can validate Zcash concepts quickly"
      ],

      resources: {
        repository: "https://github.com/zcash/zcash-devtool",
        walkthrough: "https://github.com/zcash/zcash-devtool/blob/main/doc/walkthrough.md",
        video_guide: "https://www.youtube.com/watch?v=5gvQF5oFT8E",
        age_tool: "https://github.com/FiloSottile/age"
      }
    }
  });
});

export default router;