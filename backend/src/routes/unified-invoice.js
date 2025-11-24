import express from "express";
import { pool } from "../config/appConfig.js";
import { optionalApiKey } from "../middleware/auth.js";
import { 
  generateAddress, 
  getReceivedByAddress, 
  checkTransparentPayment,
  getAddressType,
  isShieldedAddress 
} from "../config/zcash.js";
import {
  generatePaymentUri,
  generatePaymentQR,
  QR_PRESETS,
} from "../utils/qrcode.js";
import { createUnifiedAddress, generateMockReceivers, create2025StandardUA } from "../utils/zip316.js";

const router = express.Router();

/**
 * UNIFIED INVOICE SYSTEM
 * Single endpoint for all payment methods with centralized balance management
 */

/**
 * Create unified invoice - supports all payment methods
 * POST /api/invoice/unified/create
 */
router.post("/create", optionalApiKey, async (req, res) => {
  let { 
    user_id, 
    email,
    type = "one_time", 
    amount_zec, 
    item_id,
    payment_method = "auto", // auto, transparent, shielded, unified, webzjs, devtool
    network = "testnet",
    description,
    // Optional wallet linking
    webzjs_wallet_id,
    devtool_wallet_id,
    shielded_wallet_id
  } = req.body;

  // Validation
  if ((!user_id && !email) || !amount_zec) {
    return res.status(400).json({
      error: "Missing required fields: (user_id or email), amount_zec",
    });
  }

  if (!["subscription", "one_time"].includes(type)) {
    return res.status(400).json({
      error: 'Invalid type. Must be "subscription" or "one_time"',
    });
  }

  if (typeof amount_zec !== "number" || amount_zec <= 0) {
    return res.status(400).json({
      error: "amount_zec must be a positive number",
    });
  }

  const validPaymentMethods = ["auto", "transparent", "shielded", "unified", "webzjs", "devtool"];
  if (!validPaymentMethods.includes(payment_method)) {
    return res.status(400).json({
      error: "Invalid payment_method",
      valid_methods: validPaymentMethods
    });
  }

  try {
    // Handle user identification and auto-registration
    let finalUserId = await resolveUserId(user_id, email);

    // Generate payment address based on method
    const addressInfo = await generatePaymentAddress(payment_method, network, {
      webzjs_wallet_id,
      devtool_wallet_id, 
      shielded_wallet_id,
      user_id: finalUserId
    });

    // Create unified invoice record
    const result = await pool.query(
      `INSERT INTO unified_invoices (
        user_id, type, amount_zec, payment_method, network,
        payment_address, address_type, item_id, description, status,
        webzjs_wallet_id, devtool_wallet_id, shielded_wallet_id,
        address_metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11, $12, $13, NOW()) 
      RETURNING *`,
      [
        finalUserId, type, amount_zec, payment_method, network,
        addressInfo.address, addressInfo.type, item_id || null, description || null,
        webzjs_wallet_id || null, devtool_wallet_id || null, shielded_wallet_id || null,
        JSON.stringify(addressInfo.metadata || {})
      ]
    );

    const invoice = result.rows[0];

    // Generate payment URI and QR code
    const paymentUri = generatePaymentUri(
      invoice.payment_address,
      parseFloat(invoice.amount_zec),
      description || `Payment for ${invoice.type}${invoice.item_id ? ` - ${invoice.item_id}` : ""}`
    );

    const qrCodeDataUrl = await generatePaymentQR(
      { 
        z_address: invoice.payment_address, 
        amount_zec: invoice.amount_zec,
        type: invoice.type,
        item_id: invoice.item_id
      },
      "dataurl",
      QR_PRESETS.web
    );

    res.status(201).json({
      success: true,
      invoice: {
        id: invoice.id,
        user_id: invoice.user_id,
        type: invoice.type,
        amount_zec: parseFloat(invoice.amount_zec),
        payment_method: invoice.payment_method,
        payment_address: invoice.payment_address,
        address_type: invoice.address_type,
        network: invoice.network,
        item_id: invoice.item_id,
        description: invoice.description,
        status: invoice.status,
        created_at: invoice.created_at,
        payment_uri: paymentUri,
        qr_code: qrCodeDataUrl,
      },
      payment_info: {
        method: payment_method,
        address_type: addressInfo.type,
        network: network,
        instructions: getPaymentInstructions(payment_method, addressInfo),
        linked_wallets: {
          webzjs: webzjs_wallet_id,
          devtool: devtool_wallet_id,
          shielded: shielded_wallet_id
        }
      }
    });

  } catch (error) {
    console.error("Unified invoice creation error:", error);
    res.status(500).json({
      error: "Failed to create invoice",
      details: error.message,
    });
  }
});

/**
 * Check unified invoice payment status
 * POST /api/invoice/unified/check
 */
router.post("/check", optionalApiKey, async (req, res) => {
  const { invoice_id } = req.body;

  if (!invoice_id) {
    return res.status(400).json({ error: "Missing invoice_id" });
  }

  try {
    // Get unified invoice
    const invResult = await pool.query("SELECT * FROM unified_invoices WHERE id = $1", [
      invoice_id,
    ]);
    const invoice = invResult.rows[0];

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // If already paid, return status
    if (invoice.status === "paid") {
      return res.json({
        paid: true,
        invoice: {
          id: invoice.id,
          status: invoice.status,
          paid_amount_zec: parseFloat(invoice.paid_amount_zec),
          paid_txid: invoice.paid_txid,
          paid_at: invoice.paid_at,
          expires_at: invoice.expires_at,
        },
      });
    }

    // Check for payments based on address type
    const paymentResult = await checkPaymentByAddressType(
      invoice.payment_address, 
      invoice.address_type,
      parseFloat(invoice.amount_zec)
    );

    if (paymentResult.paid) {
      // Payment detected - update unified invoice and create legacy invoice for balance tracking
      const updateResult = await pool.query(
        `UPDATE unified_invoices 
         SET status='paid', 
             paid_amount_zec=$1, 
             paid_txid=$2, 
             paid_at=NOW(),
             expires_at = CASE 
               WHEN type='subscription' THEN NOW() + INTERVAL '30 days' 
               ELSE NULL 
             END
         WHERE id=$3 
         RETURNING *`,
        [paymentResult.amount, paymentResult.txid, invoice_id]
      );

      // Create legacy invoice record for balance tracking
      await pool.query(
        `INSERT INTO invoices (
          user_id, type, amount_zec, z_address, item_id, status,
          paid_amount_zec, paid_txid, paid_at, expires_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'paid', $6, $7, NOW(), $8, $9)`,
        [
          invoice.user_id, invoice.type, invoice.amount_zec, invoice.payment_address,
          invoice.item_id, paymentResult.amount, paymentResult.txid,
          updateResult.rows[0].expires_at, invoice.created_at
        ]
      );

      const updatedInvoice = updateResult.rows[0];

      return res.json({
        paid: true,
        invoice: {
          id: updatedInvoice.id,
          status: updatedInvoice.status,
          paid_amount_zec: parseFloat(updatedInvoice.paid_amount_zec),
          paid_txid: updatedInvoice.paid_txid,
          paid_at: updatedInvoice.paid_at,
          expires_at: updatedInvoice.expires_at,
        },
      });
    }

    // Payment not yet received
    res.json({
      paid: false,
      invoice: {
        id: invoice.id,
        status: invoice.status,
        amount_zec: parseFloat(invoice.amount_zec),
        payment_address: invoice.payment_address,
        payment_method: invoice.payment_method,
        received_amount: paymentResult.received || 0,
      },
    });

  } catch (error) {
    console.error("Unified payment check error:", error);
    res.status(500).json({
      error: "Failed to check payment status",
      details: error.message,
    });
  }
});

/**
 * Get unified invoice details
 * GET /api/invoice/unified/:id
 */
router.get("/:id", optionalApiKey, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT ui.*, u.email, u.name,
              ww.name as webzjs_wallet_name,
              dw.name as devtool_wallet_name,
              sw.name as shielded_wallet_name
       FROM unified_invoices ui 
       JOIN users u ON ui.user_id = u.id 
       LEFT JOIN webzjs_wallets ww ON ui.webzjs_wallet_id = ww.id
       LEFT JOIN devtool_wallets dw ON ui.devtool_wallet_id = dw.id
       LEFT JOIN shielded_wallets sw ON ui.shielded_wallet_id = sw.id
       WHERE ui.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoice = result.rows[0];

    // Generate QR code for unpaid invoices
    let qrCodeDataUrl = null;
    let paymentUri = null;

    if (invoice.status === "pending") {
      paymentUri = generatePaymentUri(
        invoice.payment_address,
        parseFloat(invoice.amount_zec),
        invoice.description || `Payment for ${invoice.type}${
          invoice.item_id ? ` - ${invoice.item_id}` : ""
        }`
      );

      qrCodeDataUrl = await generatePaymentQR(
        {
          z_address: invoice.payment_address,
          amount_zec: invoice.amount_zec,
          type: invoice.type,
          item_id: invoice.item_id
        },
        "dataurl",
        QR_PRESETS.web
      );
    }

    res.json({
      success: true,
      invoice: {
        id: invoice.id,
        user_id: invoice.user_id,
        user_email: invoice.email,
        user_name: invoice.name,
        type: invoice.type,
        amount_zec: parseFloat(invoice.amount_zec),
        payment_method: invoice.payment_method,
        payment_address: invoice.payment_address,
        address_type: invoice.address_type,
        network: invoice.network,
        item_id: invoice.item_id,
        description: invoice.description,
        status: invoice.status,
        paid_amount_zec: invoice.paid_amount_zec
          ? parseFloat(invoice.paid_amount_zec)
          : null,
        paid_txid: invoice.paid_txid,
        paid_at: invoice.paid_at,
        expires_at: invoice.expires_at,
        created_at: invoice.created_at,
        payment_uri: paymentUri,
        qr_code: qrCodeDataUrl,
        linked_wallets: {
          webzjs: invoice.webzjs_wallet_id ? {
            id: invoice.webzjs_wallet_id,
            name: invoice.webzjs_wallet_name
          } : null,
          devtool: invoice.devtool_wallet_id ? {
            id: invoice.devtool_wallet_id,
            name: invoice.devtool_wallet_name
          } : null,
          shielded: invoice.shielded_wallet_id ? {
            id: invoice.shielded_wallet_id,
            name: invoice.shielded_wallet_name
          } : null
        }
      },
    });
  } catch (error) {
    console.error("Get unified invoice error:", error);
    res.status(500).json({
      error: "Failed to get invoice",
      details: error.message,
    });
  }
});

// Helper Functions

async function resolveUserId(user_id, email) {
  if (user_id) {
    // Check if user exists by ID
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [user_id]);
    
    if (userCheck.rows.length === 0) {
      if (!email) {
        throw new Error("User not found and no email provided for auto-registration");
      }
      // Create new user with provided email
      const newUserResult = await pool.query(
        "INSERT INTO users (email) VALUES ($1) RETURNING *",
        [email]
      );
      return newUserResult.rows[0].id;
    }
    return user_id;
  } else if (email) {
    // Find or create user by email
    let userByEmail = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    
    if (userByEmail.rows.length === 0) {
      const newUserResult = await pool.query(
        "INSERT INTO users (email) VALUES ($1) RETURNING *",
        [email]
      );
      return newUserResult.rows[0].id;
    } else {
      return userByEmail.rows[0].id;
    }
  }
  
  throw new Error("Must provide either user_id or email");
}

async function generatePaymentAddress(method, network, options = {}) {
  switch (method) {
    case "transparent":
      return {
        address: await generateAddress('transparent'),
        type: 'transparent',
        metadata: { method: 'rpc_generated' }
      };
      
    case "shielded":
      if (options.shielded_wallet_id) {
        const walletResult = await pool.query(
          "SELECT address FROM shielded_wallets WHERE id = $1 AND user_id = $2",
          [options.shielded_wallet_id, options.user_id]
        );
        if (walletResult.rows.length > 0) {
          return {
            address: walletResult.rows[0].address,
            type: 'shielded',
            metadata: { wallet_id: options.shielded_wallet_id }
          };
        }
      }
      // Fallback to generating new shielded address
      return {
        address: await generateAddress('sapling'),
        type: 'shielded',
        metadata: { method: 'rpc_generated' }
      };
      
    case "unified":
      const receivers = generateMockReceivers(false, true, true); // Orchard + Sapling
      const unifiedData = createUnifiedAddress(receivers, network);
      return {
        address: unifiedData.address,
        type: 'unified',
        metadata: { 
          diversifier: unifiedData.diversifier,
          pools: ['orchard', 'sapling']
        }
      };
      
    case "webzjs":
      // For WebZjs, we create a placeholder that will be replaced by browser-generated address
      return {
        address: "webzjs_placeholder_" + Date.now(),
        type: 'webzjs_placeholder',
        metadata: { 
          wallet_id: options.webzjs_wallet_id,
          network: network,
          note: "Address will be generated by WebZjs in browser"
        }
      };
      
    case "devtool":
      // For devtool, we create a placeholder for CLI-generated address
      return {
        address: "devtool_placeholder_" + Date.now(),
        type: 'devtool_placeholder',
        metadata: { 
          wallet_id: options.devtool_wallet_id,
          network: network,
          note: "Address will be generated by zcash-devtool CLI"
        }
      };
      
    case "auto":
    default:
      // Auto mode: prefer unified, fallback to transparent
      try {
        const receivers = generateMockReceivers(false, true, true);
        const unifiedData = createUnifiedAddress(receivers, network);
        return {
          address: unifiedData.address,
          type: 'unified',
          metadata: { 
            method: 'auto_unified',
            diversifier: unifiedData.diversifier,
            pools: ['orchard', 'sapling']
          }
        };
      } catch (error) {
        return {
          address: await generateAddress('transparent'),
          type: 'transparent',
          metadata: { method: 'auto_fallback' }
        };
      }
  }
}

async function checkPaymentByAddressType(address, addressType, expectedAmount) {
  try {
    switch (addressType) {
      case 'transparent':
        const transparentPaid = await checkTransparentPayment(address, expectedAmount, 0);
        return {
          paid: transparentPaid,
          amount: transparentPaid ? expectedAmount : 0,
          txid: transparentPaid ? 'mock_txid_' + Date.now() : null,
          received: transparentPaid ? expectedAmount : 0
        };
        
      case 'shielded':
      case 'unified':
        const received = await getReceivedByAddress(address, 0);
        const totalReceived = received.reduce((sum, tx) => sum + tx.amount, 0);
        const paid = totalReceived >= expectedAmount;
        return {
          paid: paid,
          amount: totalReceived,
          txid: received[0]?.txid || null,
          received: totalReceived
        };
        
      case 'webzjs_placeholder':
      case 'devtool_placeholder':
        // These require manual confirmation or external checking
        return {
          paid: false,
          amount: 0,
          txid: null,
          received: 0,
          note: "Manual verification required for placeholder addresses"
        };
        
      default:
        return {
          paid: false,
          amount: 0,
          txid: null,
          received: 0
        };
    }
  } catch (error) {
    console.warn('Payment check error:', error.message);
    return {
      paid: false,
      amount: 0,
      txid: null,
      received: 0,
      error: error.message
    };
  }
}

function getPaymentInstructions(method, addressInfo) {
  switch (method) {
    case "transparent":
      return [
        "Send ZEC to the transparent address above",
        "Payment will be detected automatically",
        "Confirmations required: 1"
      ];
      
    case "shielded":
      return [
        "Send ZEC to the shielded address above",
        "Payment will be detected automatically", 
        "Supports memo field for additional information"
      ];
      
    case "unified":
      return [
        "Send ZEC to the unified address above",
        "Your wallet will automatically choose the best pool",
        "Supports both Orchard and Sapling pools"
      ];
      
    case "webzjs":
      return [
        "Use WebZjs in your browser to generate receiving address",
        "Initialize WebZjs wallet and sync with network",
        "Generate address using wallet.getAddress()",
        "Update invoice with actual address before payment"
      ];
      
    case "devtool":
      return [
        "Use zcash-devtool CLI to generate receiving address",
        "Run: cargo run --release -- wallet -w <path> new-address",
        "Update invoice with generated address",
        "Sync wallet periodically to detect payment"
      ];
      
    case "auto":
    default:
      return [
        "Send ZEC to the address above",
        "Payment method was automatically selected",
        "Payment will be detected automatically"
      ];
  }
}

export default router;