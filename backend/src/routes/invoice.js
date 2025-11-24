import express from "express";
import { pool } from "../config/appConfig.js";
import { 
  generateAddress, 
  getReceivedByAddress, 
  checkTransparentPayment,
  getAddressType,
  isShieldedAddress 
} from "../config/zcash.js";
import { optionalApiKey } from "../middleware/auth.js";
import {
  generatePaymentUri,
  generatePaymentQR,
  generateQRBuffer,
  generateQRSvg,
  validateQRSize,
  QR_PRESETS,
} from "../utils/qrcode.js";

const router = express.Router();

/**
 * Create new invoice
 * POST /api/invoice/create
 */
router.post("/create", optionalApiKey, async (req, res) => {
  let { user_id, type, amount_zec, item_id, email } = req.body;

  // Validation
  if ((!user_id && !email) || !type || !amount_zec) {
    return res.status(400).json({
      error: "Missing required fields: (user_id or email), type, amount_zec",
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

  try {
    let finalUserId = user_id;

    // Handle user identification and auto-registration
    if (user_id) {
      // Check if user exists by ID
      const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
        user_id,
      ]);

      if (userCheck.rows.length === 0) {
        // User ID doesn't exist, try to create if email provided
        if (!email) {
          return res.status(400).json({
            error: "User not found and no email provided for auto-registration",
          });
        }

        // Create new user with provided email
        const newUserResult = await pool.query(
          "INSERT INTO users (email) VALUES ($1) RETURNING *",
          [email]
        );
        finalUserId = newUserResult.rows[0].id;
      }
    } else if (email) {
      // Only email provided, find or create user by email
      let userByEmail = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (userByEmail.rows.length === 0) {
        // Create new user
        const newUserResult = await pool.query(
          "INSERT INTO users (email) VALUES ($1) RETURNING *",
          [email]
        );
        finalUserId = newUserResult.rows[0].id;
      } else {
        finalUserId = userByEmail.rows[0].id;
      }
    }

    // Generate new address for this invoice (transparent as fallback)
    const zAddress = await generateAddress('transparent');

    // Create invoice
    const result = await pool.query(
      `INSERT INTO invoices (user_id, type, amount_zec, z_address, item_id, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [finalUserId, type, amount_zec, zAddress, item_id || null]
    );

    const invoice = result.rows[0];

    // Generate payment URI and QR code
    const paymentUri = generatePaymentUri(
      invoice.z_address,
      parseFloat(invoice.amount_zec),
      `Payment for ${invoice.type}${
        invoice.item_id ? ` - ${invoice.item_id}` : ""
      }`
    );

    // Generate QR code as data URL using web preset
    const qrCodeDataUrl = await generatePaymentQR(
      invoice,
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
        z_address: invoice.z_address,
        item_id: invoice.item_id,
        status: invoice.status,
        created_at: invoice.created_at,
        payment_uri: paymentUri,
        qr_code: qrCodeDataUrl,
      },
    });
  } catch (error) {
    console.error("Invoice creation error:", error);
    res.status(500).json({
      error: "Failed to create invoice",
      details: error.message,
    });
  }
});

/**
 * Check invoice payment status
 * POST /api/invoice/check
 */
router.post("/check", optionalApiKey, async (req, res) => {
  const { invoice_id } = req.body;

  if (!invoice_id) {
    return res.status(400).json({ error: "Missing invoice_id" });
  }

  try {
    // Get invoice
    const invResult = await pool.query("SELECT * FROM invoices WHERE id = $1", [
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
    const addressType = getAddressType(invoice.z_address);
    let paymentReceived = false;
    let totalReceived = 0;
    let receivedTxid = null;

    if (addressType === 'transparent') {
      // Check transparent address payment
      paymentReceived = await checkTransparentPayment(
        invoice.z_address, 
        parseFloat(invoice.amount_zec), 
        0
      );
      if (paymentReceived) {
        totalReceived = parseFloat(invoice.amount_zec); // Assume exact amount for mock
        receivedTxid = 'mock_txid_' + Date.now(); // Mock transaction ID
      }
    } else {
      // Check shielded address payment (original method)
      const received = await getReceivedByAddress(invoice.z_address, 0);
      totalReceived = received.reduce((sum, tx) => sum + tx.amount, 0);
      paymentReceived = totalReceived >= parseFloat(invoice.amount_zec);
      receivedTxid = received[0]?.txid || null;
    }

    if (paymentReceived) {
      // Payment detected - update invoice
      const updateResult = await pool.query(
        `UPDATE invoices 
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
        [totalReceived, receivedTxid, invoice_id]
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
        z_address: invoice.z_address,
        received_amount: totalReceived,
      },
    });
  } catch (error) {
    console.error("Payment check error:", error);
    res.status(500).json({
      error: "Failed to check payment status",
      details: error.message,
    });
  }
});

/**
 * Get invoice details
 * GET /api/invoice/:id
 */
router.get("/:id", optionalApiKey, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT i.*, u.email, u.name 
       FROM invoices i 
       JOIN users u ON i.user_id = u.id 
       WHERE i.id = $1`,
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
        invoice.z_address,
        parseFloat(invoice.amount_zec),
        `Payment for ${invoice.type}${
          invoice.item_id ? ` - ${invoice.item_id}` : ""
        }`
      );

      qrCodeDataUrl = await generatePaymentQR(
        invoice,
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
        z_address: invoice.z_address,
        item_id: invoice.item_id,
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
      },
    });
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({
      error: "Failed to get invoice",
      details: error.message,
    });
  }
});

/**
 * List user invoices
 * GET /api/invoice/user/:user_id
 */
router.get("/user/:user_id", optionalApiKey, async (req, res) => {
  const { user_id } = req.params;
  const { status, type, limit = 50, offset = 0 } = req.query;

  try {
    let query = "SELECT * FROM invoices WHERE user_id = $1";
    const params = [user_id];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${++paramCount}`;
      params.push(status);
    }

    if (type) {
      query += ` AND type = $${++paramCount}`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      invoices: result.rows.map((invoice) => ({
        id: invoice.id,
        type: invoice.type,
        amount_zec: parseFloat(invoice.amount_zec),
        status: invoice.status,
        item_id: invoice.item_id,
        paid_amount_zec: invoice.paid_amount_zec
          ? parseFloat(invoice.paid_amount_zec)
          : null,
        paid_at: invoice.paid_at,
        expires_at: invoice.expires_at,
        created_at: invoice.created_at,
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length,
      },
    });
  } catch (error) {
    console.error("List invoices error:", error);
    res.status(500).json({
      error: "Failed to list invoices",
      details: error.message,
    });
  }
});

/**
 * Generate QR code for invoice
 * GET /api/invoice/:id/qr?format=png&size=256&preset=web
 */
router.get("/:id/qr", optionalApiKey, async (req, res) => {
  const { id } = req.params;
  const { format = "png", size, preset = "web" } = req.query;

  try {
    const result = await pool.query("SELECT * FROM invoices WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoice = result.rows[0];

    if (invoice.status !== "pending") {
      return res.status(400).json({
        error: "QR code only available for pending invoices",
        status: invoice.status,
      });
    }

    // Get QR options from preset or custom size
    let qrOptions = QR_PRESETS[preset] || QR_PRESETS.web;

    if (size) {
      qrOptions = { ...qrOptions, width: validateQRSize(size) };
    }

    if (format === "svg") {
      // Return SVG format
      const qrSvg = await generatePaymentQR(invoice, "svg", qrOptions);
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
      res.send(qrSvg);
    } else {
      // Return PNG format (default)
      const qrBuffer = await generatePaymentQR(invoice, "buffer", qrOptions);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
      res.send(qrBuffer);
    }
  } catch (error) {
    console.error("QR code generation error:", error);
    res.status(500).json({
      error: "Failed to generate QR code",
      details: error.message,
    });
  }
});

/**
 * Get payment URI for invoice
 * GET /api/invoice/:id/uri
 */
router.get("/:id/uri", optionalApiKey, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM invoices WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoice = result.rows[0];

    if (invoice.status !== "pending") {
      return res.status(400).json({
        error: "Payment URI only available for pending invoices",
        status: invoice.status,
      });
    }

    const message = `Payment for ${invoice.type}${
      invoice.item_id ? ` - ${invoice.item_id}` : ""
    }`;
    const paymentUri = generatePaymentUri(
      invoice.z_address,
      parseFloat(invoice.amount_zec),
      message
    );

    res.json({
      success: true,
      payment_uri: paymentUri,
      z_address: invoice.z_address,
      amount_zec: parseFloat(invoice.amount_zec),
      message: message,
      qr_endpoints: {
        png: `/api/invoice/${id}/qr?format=png`,
        svg: `/api/invoice/${id}/qr?format=svg`,
        mobile: `/api/invoice/${id}/qr?preset=mobile`,
        print: `/api/invoice/${id}/qr?preset=print`,
      },
    });
  } catch (error) {
    console.error("Payment URI error:", error);
    res.status(500).json({
      error: "Failed to get payment URI",
      details: error.message,
    });
  }
});

export default router;
