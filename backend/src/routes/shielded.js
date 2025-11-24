import express from "express";
import axios from 'axios';
import { pool } from "../config/appConfig.js";
import { optionalApiKey } from "../middleware/auth.js";
import { config } from "../config/appConfig.js";

const router = express.Router();

// Zaino configuration
const ZAINO_RPC_URL = 'http://127.0.0.1:8234';

/**
 * Execute Zaino RPC command for shielded operations
 * @param {string} method - RPC method name
 * @param {Array} params - RPC parameters
 * @returns {Promise<any>} RPC result
 */
async function zainoRpc(method, params = []) {
  try {
    const response = await axios.post(ZAINO_RPC_URL, {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    if (response.data.error) {
      throw new Error(`Zaino RPC Error: ${response.data.error.message}`);
    }

    return response.data.result;
  } catch (error) {
    if (error.response) {
      throw new Error(`Zaino RPC HTTP Error: ${error.response.status} - ${error.response.statusText}`);
    }
    throw new Error(`Zaino RPC Connection Error: ${error.message}`);
  }
}

/**
 * Generate new shielded address using Zaino
 * @param {string} type - Address type ('sapling', 'unified', or 'auto')
 * @returns {Promise<string>} New shielded address
 */
async function generateShieldedAddress(type = 'auto') {
  try {
    if (type === 'sapling') {
      return await zainoRpc('z_getnewaddress', ['sapling']);
    } else if (type === 'unified') {
      return await zainoRpc('z_getnewaddress', ['unified']);
    } else {
      // Auto mode: try Sapling first, then unified
      try {
        return await zainoRpc('z_getnewaddress', ['sapling']);
      } catch (error) {
        return await zainoRpc('z_getnewaddress', ['unified']);
      }
    }
  } catch (error) {
    throw new Error(`Failed to generate ${type} shielded address: ${error.message}`);
  }
}

/**
 * Check shielded balance for address
 * @param {string} address - Shielded address
 * @returns {Promise<number>} Balance in ZEC
 */
async function getShieldedBalance(address) {
  try {
    const balance = await zainoRpc('z_getbalance', [address]);
    return balance;
  } catch (error) {
    console.warn('Failed to get shielded balance:', error.message);
    return 0;
  }
}

/**
 * Get received transactions for shielded address
 * @param {string} address - Shielded address
 * @param {number} minconf - Minimum confirmations
 * @returns {Promise<Array>} Array of received transactions
 */
async function getShieldedReceived(address, minconf = 1) {
  try {
    return await zainoRpc('z_listreceivedbyaddress', [address, minconf]);
  } catch (error) {
    console.warn('Failed to get shielded received:', error.message);
    return [];
  }
}

/**
 * Generate new shielded address
 * POST /api/shielded/address/generate
 */
router.post("/address/generate", optionalApiKey, async (req, res) => {
  const { type = 'auto', save_to_wallet = false, user_id, wallet_name } = req.body;

  // Validate address type
  const validTypes = ['sapling', 'unified', 'auto'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: "Invalid address type",
      valid_types: validTypes
    });
  }

  try {
    // Generate the shielded address
    const shieldedAddress = await generateShieldedAddress(type);

    const response = {
      success: true,
      address: shieldedAddress,
      type: shieldedAddress.startsWith('zs1') ? 'sapling' : 
            shieldedAddress.startsWith('u1') ? 'unified' : 'unknown',
      generated_at: new Date().toISOString()
    };

    // Optionally save to wallet
    if (save_to_wallet && user_id) {
      try {
        // Check if user exists
        const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [user_id]);
        if (userCheck.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        // Save to shielded_wallets table
        const walletResult = await pool.query(
          `INSERT INTO shielded_wallets (user_id, address, name, created_at)
           VALUES ($1, $2, $3, NOW()) RETURNING *`,
          [user_id, shieldedAddress, wallet_name || `Generated ${response.type} wallet`]
        );

        response.wallet = {
          id: walletResult.rows[0].id,
          name: walletResult.rows[0].name,
          saved_at: walletResult.rows[0].created_at
        };
      } catch (walletError) {
        console.warn('Failed to save address to wallet:', walletError.message);
        response.wallet_save_error = walletError.message;
      }
    }

    res.status(201).json(response);

  } catch (error) {
    console.error("Shielded address generation error:", error);
    
    if (error.message.includes('Connection Error') || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: "Shielded address service unavailable",
        details: "Zaino indexer is not running. Shielded operations require Zaino to be active.",
        fallback: "Use transparent addresses via /api/invoice endpoints"
      });
    }

    res.status(500).json({
      error: "Failed to generate shielded address",
      details: error.message
    });
  }
});

/**
 * Validate shielded address
 * POST /api/shielded/address/validate
 */
router.post("/address/validate", optionalApiKey, async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({
      error: "Missing required field: address"
    });
  }

  try {
    // Basic format validation
    const isShielded = address.startsWith('zs1') || address.startsWith('zc') || address.startsWith('u1');
    
    if (!isShielded) {
      return res.json({
        valid: false,
        address: address,
        type: 'transparent',
        error: "Not a shielded address"
      });
    }

    // Try to validate with Zaino RPC
    try {
      const validation = await zainoRpc('validateaddress', [address]);
      
      res.json({
        valid: validation.isvalid || false,
        address: address,
        type: address.startsWith('zs1') ? 'sapling' : 
              address.startsWith('u1') ? 'unified' : 
              address.startsWith('zc') ? 'sprout' : 'unknown',
        details: validation
      });
    } catch (rpcError) {
      // Fallback to basic validation if RPC fails
      res.json({
        valid: isShielded,
        address: address,
        type: address.startsWith('zs1') ? 'sapling' : 
              address.startsWith('u1') ? 'unified' : 
              address.startsWith('zc') ? 'sprout' : 'unknown',
        warning: "RPC validation unavailable, using basic format validation"
      });
    }

  } catch (error) {
    console.error("Address validation error:", error);
    res.status(500).json({
      error: "Failed to validate address",
      details: error.message
    });
  }
});

/**
 * Get shielded address info (balance, transactions)
 * GET /api/shielded/address/:address/info
 */
router.get("/address/:address/info", optionalApiKey, async (req, res) => {
  const { address } = req.params;
  const { include_transactions = true, min_confirmations = 1 } = req.query;

  try {
    // Validate it's a shielded address
    const isShielded = address.startsWith('zs1') || address.startsWith('zc') || address.startsWith('u1');
    
    if (!isShielded) {
      return res.status(400).json({
        error: "Not a shielded address",
        address: address
      });
    }

    // Get balance and transactions in parallel
    const [balance, transactions] = await Promise.all([
      getShieldedBalance(address),
      include_transactions === 'true' ? getShieldedReceived(address, parseInt(min_confirmations)) : []
    ]);

    res.json({
      success: true,
      address: address,
      type: address.startsWith('zs1') ? 'sapling' : 
            address.startsWith('u1') ? 'unified' : 
            address.startsWith('zc') ? 'sprout' : 'unknown',
      balance: balance,
      transaction_count: transactions.length,
      transactions: include_transactions === 'true' ? transactions : undefined,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error("Get address info error:", error);
    
    if (error.message.includes('Connection Error') || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: "Shielded address service unavailable",
        details: "Zaino indexer is not running"
      });
    }

    res.status(500).json({
      error: "Failed to get address info",
      details: error.message
    });
  }
});

/**
 * Batch generate multiple shielded addresses
 * POST /api/shielded/address/batch-generate
 */
router.post("/address/batch-generate", optionalApiKey, async (req, res) => {
  const { count = 1, type = 'auto', user_id, save_to_wallet = false } = req.body;

  // Validate count
  if (count < 1 || count > 10) {
    return res.status(400).json({
      error: "Invalid count. Must be between 1 and 10"
    });
  }

  // Validate address type
  const validTypes = ['sapling', 'unified', 'auto'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: "Invalid address type",
      valid_types: validTypes
    });
  }

  try {
    const addresses = [];
    const errors = [];

    // Generate addresses sequentially to avoid overwhelming Zaino
    for (let i = 0; i < count; i++) {
      try {
        const address = await generateShieldedAddress(type);
        const addressInfo = {
          address: address,
          type: address.startsWith('zs1') ? 'sapling' : 
                address.startsWith('u1') ? 'unified' : 'unknown',
          generated_at: new Date().toISOString()
        };

        // Optionally save to wallet
        if (save_to_wallet && user_id) {
          try {
            const walletResult = await pool.query(
              `INSERT INTO shielded_wallets (user_id, address, name, created_at)
               VALUES ($1, $2, $3, NOW()) RETURNING id`,
              [user_id, address, `Batch generated ${addressInfo.type} wallet ${i + 1}`]
            );
            addressInfo.wallet_id = walletResult.rows[0].id;
          } catch (walletError) {
            addressInfo.wallet_save_error = walletError.message;
          }
        }

        addresses.push(addressInfo);
      } catch (error) {
        errors.push({
          index: i,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      generated_count: addresses.length,
      requested_count: count,
      addresses: addresses,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Batch address generation error:", error);
    
    if (error.message.includes('Connection Error') || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: "Shielded address service unavailable",
        details: "Zaino indexer is not running"
      });
    }

    res.status(500).json({
      error: "Failed to generate addresses",
      details: error.message
    });
  }
});

/**
 * Create shielded wallet for user
 * POST /api/shielded/wallet/create
 */
router.post("/wallet/create", optionalApiKey, async (req, res) => {
  const { user_id, wallet_name } = req.body;

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

    // Generate new shielded address
    const shieldedAddress = await generateShieldedAddress();

    // Store wallet in database
    const result = await pool.query(
      `INSERT INTO shielded_wallets (user_id, address, name, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [user_id, shieldedAddress, wallet_name || 'Default Shielded Wallet']
    );

    const wallet = result.rows[0];

    res.status(201).json({
      success: true,
      wallet: {
        id: wallet.id,
        user_id: wallet.user_id,
        address: wallet.address,
        name: wallet.name,
        balance: 0,
        created_at: wallet.created_at
      }
    });

  } catch (error) {
    console.error("Shielded wallet creation error:", error);
    
    // Check if Zaino is not available
    if (error.message.includes('Connection Error') || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: "Shielded wallet service unavailable",
        details: "Zaino indexer is not running. Shielded operations require Zaino to be active.",
        fallback: "Use transparent addresses for now"
      });
    }

    res.status(500).json({
      error: "Failed to create shielded wallet",
      details: error.message
    });
  }
});

/**
 * Get user's shielded wallets
 * GET /api/shielded/wallet/user/:user_id
 */
router.get("/wallet/user/:user_id", optionalApiKey, async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM shielded_wallets WHERE user_id = $1 ORDER BY created_at DESC",
      [user_id]
    );

    const wallets = await Promise.all(result.rows.map(async (wallet) => {
      try {
        const balance = await getShieldedBalance(wallet.address);
        return {
          id: wallet.id,
          user_id: wallet.user_id,
          address: wallet.address,
          name: wallet.name,
          balance: balance,
          created_at: wallet.created_at
        };
      } catch (error) {
        return {
          id: wallet.id,
          user_id: wallet.user_id,
          address: wallet.address,
          name: wallet.name,
          balance: 0,
          created_at: wallet.created_at,
          error: "Balance unavailable"
        };
      }
    }));

    res.json({
      success: true,
      wallets: wallets
    });

  } catch (error) {
    console.error("Get shielded wallets error:", error);
    res.status(500).json({
      error: "Failed to get shielded wallets",
      details: error.message
    });
  }
});

/**
 * Get shielded wallet balance and transactions
 * GET /api/shielded/wallet/:wallet_id/details
 */
router.get("/wallet/:wallet_id/details", optionalApiKey, async (req, res) => {
  const { wallet_id } = req.params;

  try {
    const walletResult = await pool.query(
      "SELECT * FROM shielded_wallets WHERE id = $1",
      [wallet_id]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({ error: "Shielded wallet not found" });
    }

    const wallet = walletResult.rows[0];

    // Get balance and transactions
    const [balance, transactions] = await Promise.all([
      getShieldedBalance(wallet.address),
      getShieldedReceived(wallet.address, 0)
    ]);

    res.json({
      success: true,
      wallet: {
        id: wallet.id,
        user_id: wallet.user_id,
        address: wallet.address,
        name: wallet.name,
        balance: balance,
        created_at: wallet.created_at
      },
      transactions: transactions
    });

  } catch (error) {
    console.error("Get shielded wallet details error:", error);
    
    if (error.message.includes('Connection Error') || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: "Shielded wallet service unavailable",
        details: "Zaino indexer is not running"
      });
    }

    res.status(500).json({
      error: "Failed to get shielded wallet details",
      details: error.message
    });
  }
});

/**
 * Create shielded invoice (uses shielded address)
 * POST /api/shielded/invoice/create
 */
router.post("/invoice/create", optionalApiKey, async (req, res) => {
  const { user_id, wallet_id, amount_zec, item_id, memo } = req.body;

  if (!user_id || !amount_zec) {
    return res.status(400).json({
      error: "Missing required fields: user_id, amount_zec"
    });
  }

  try {
    let shieldedAddress;

    if (wallet_id) {
      // Use existing wallet
      const walletResult = await pool.query(
        "SELECT address FROM shielded_wallets WHERE id = $1 AND user_id = $2",
        [wallet_id, user_id]
      );

      if (walletResult.rows.length === 0) {
        return res.status(404).json({ error: "Shielded wallet not found" });
      }

      shieldedAddress = walletResult.rows[0].address;
    } else {
      // Generate new shielded address
      shieldedAddress = await generateShieldedAddress();
    }

    // Create shielded invoice
    const result = await pool.query(
      `INSERT INTO shielded_invoices (user_id, wallet_id, amount_zec, z_address, item_id, memo, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
      [user_id, wallet_id || null, amount_zec, shieldedAddress, item_id || null, memo || null]
    );

    const invoice = result.rows[0];

    res.status(201).json({
      success: true,
      invoice: {
        id: invoice.id,
        user_id: invoice.user_id,
        wallet_id: invoice.wallet_id,
        amount_zec: parseFloat(invoice.amount_zec),
        z_address: invoice.z_address,
        item_id: invoice.item_id,
        memo: invoice.memo,
        status: invoice.status,
        created_at: invoice.created_at
      }
    });

  } catch (error) {
    console.error("Shielded invoice creation error:", error);
    
    if (error.message.includes('Connection Error') || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: "Shielded invoice service unavailable",
        details: "Zaino indexer is not running. Use transparent invoices instead."
      });
    }

    res.status(500).json({
      error: "Failed to create shielded invoice",
      details: error.message
    });
  }
});

/**
 * Check shielded invoice payment
 * POST /api/shielded/invoice/check
 */
router.post("/invoice/check", optionalApiKey, async (req, res) => {
  const { invoice_id } = req.body;

  if (!invoice_id) {
    return res.status(400).json({ error: "Missing invoice_id" });
  }

  try {
    // Get shielded invoice
    const invResult = await pool.query(
      "SELECT * FROM shielded_invoices WHERE id = $1",
      [invoice_id]
    );

    if (invResult.rows.length === 0) {
      return res.status(404).json({ error: "Shielded invoice not found" });
    }

    const invoice = invResult.rows[0];

    // If already paid, return status
    if (invoice.status === "paid") {
      return res.json({
        paid: true,
        invoice: {
          id: invoice.id,
          status: invoice.status,
          paid_amount_zec: parseFloat(invoice.paid_amount_zec),
          paid_txid: invoice.paid_txid,
          paid_at: invoice.paid_at
        }
      });
    }

    // Check for shielded payments
    const received = await getShieldedReceived(invoice.z_address, 0);
    const totalReceived = received.reduce((sum, tx) => sum + tx.amount, 0);

    if (totalReceived >= parseFloat(invoice.amount_zec)) {
      // Payment detected - update invoice
      const updateResult = await pool.query(
        `UPDATE shielded_invoices 
         SET status='paid', 
             paid_amount_zec=$1, 
             paid_txid=$2, 
             paid_at=NOW()
         WHERE id=$3 
         RETURNING *`,
        [totalReceived, received[0]?.txid || null, invoice_id]
      );

      const updatedInvoice = updateResult.rows[0];

      return res.json({
        paid: true,
        invoice: {
          id: updatedInvoice.id,
          status: updatedInvoice.status,
          paid_amount_zec: parseFloat(updatedInvoice.paid_amount_zec),
          paid_txid: updatedInvoice.paid_txid,
          paid_at: updatedInvoice.paid_at
        }
      });
    }

    // Payment not yet received
    res.json({
      paid: false,
      invoice: {
        id: invoice.id,
        status: invoice.status,
        amount_zec: parseFloat(invoice.amount_zec),
        z_address: invoice.z_address,
        received_amount: totalReceived
      }
    });

  } catch (error) {
    console.error("Shielded payment check error:", error);
    
    if (error.message.includes('Connection Error') || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: "Shielded payment check unavailable",
        details: "Zaino indexer is not running"
      });
    }

    res.status(500).json({
      error: "Failed to check shielded payment status",
      details: error.message
    });
  }
});

/**
 * Test Zaino connection
 * GET /api/shielded/status
 */
router.get("/status", optionalApiKey, async (req, res) => {
  try {
    // Test Zaino connection
    const info = await zainoRpc('getinfo');
    
    res.json({
      success: true,
      zaino_available: true,
      info: info,
      endpoints: {
        rpc: ZAINO_RPC_URL,
        grpc: "127.0.0.1:9067"
      }
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      zaino_available: false,
      error: error.message,
      message: "Zaino indexer is not running. Shielded operations are unavailable.",
      fallback: "Use transparent addresses via /api/invoice endpoints"
    });
  }
});

export default router;