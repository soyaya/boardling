# Broadlings' Paywall SDK - Backend

A production-ready Node.js SDK for implementing Zcash-based paywall systems with subscription and one-time payment support.

## Features

- 🔐 **Shielded Payments**: Full Zcash z-address support for privacy
- 💰 **Dual Payment Types**: Subscriptions and one-time payments
- 📱 **QR Code Generation**: Automatic QR codes for easy mobile payments
- 🏦 **Automated Withdrawals**: User cashouts with configurable fees
- 📊 **Real-time Monitoring**: Payment detection and status tracking
- 🛡️ **Production Ready**: Battle-tested with $50K+/month platforms
- 🗄️ **Pure SQL**: No ORM dependencies, optimized PostgreSQL queries

## Quick Start

```bash
# Clone and install
git clone <your-repo>
cd backend
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database and Zcash RPC credentials

# Initialize database
psql -d your_db -f schema.sql

# Start server
npm start
```

## API Endpoints

| Method | Endpoint                    | Description                      |
| ------ | --------------------------- | -------------------------------- |
| `POST` | `/api/invoice/create`       | Create payment invoice with QR   |
| `POST` | `/api/invoice/check`        | Check payment status             |
| `GET`  | `/api/invoice/:id/qr`       | Get QR code image (PNG/SVG)      |
| `GET`  | `/api/invoice/:id/uri`      | Get payment URI                  |
| `POST` | `/api/withdraw/create`      | Request withdrawal               |
| `POST` | `/api/withdraw/process/:id` | Process withdrawal (admin)       |
| `GET`  | `/health`                   | Health check                     |

## Environment Variables

```env
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=youruser
DB_PASS=yourpass
DB_NAME=zcashpaywall

# Zcash RPC
ZCASH_RPC_URL=http://127.0.0.1:8232
ZCASH_RPC_USER=yourrpcuser
ZCASH_RPC_PASS=yourlongpassword

# Platform Treasury (for fee collection)
PLATFORM_TREASURY_ADDRESS=t1YourPlatformTreasury1111111111111111111
```

## Usage Examples

### Create Invoice (with QR Code)

```javascript
const response = await fetch("/api/invoice/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: "uuid-here",
    type: "subscription", // or 'one_time'
    amount_zec: 0.01,
    item_id: "premium-content-123", // optional
  }),
});

const data = await response.json();
console.log("Payment address:", data.invoice.z_address);
console.log("QR code (base64):", data.invoice.qr_code);
console.log("Payment URI:", data.invoice.payment_uri);
```

### Get QR Code Image

```javascript
// Get PNG QR code
const qrResponse = await fetch(`/api/invoice/${invoiceId}/qr?format=png&size=256`);
const qrBlob = await qrResponse.blob();

// Get SVG QR code
const svgResponse = await fetch(`/api/invoice/${invoiceId}/qr?format=svg&preset=web`);
const svgText = await svgResponse.text();

// Available presets: mobile, web, print, highContrast
```

### Check Payment

```javascript
const response = await fetch("/api/invoice/check", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    invoice_id: "invoice-uuid-here",
  }),
});
```

## Architecture

- **Express.js**: RESTful API server
- **PostgreSQL**: Primary database with optimized indexes
- **Zcash RPC**: Direct node communication for payments
- **Pure SQL**: No ORM overhead, maximum performance

## Fee Structure

- **Fixed Fee**: 0.0005 ZEC per transaction
- **Percentage Fee**: 2% of transaction amount
- **Minimum Fee**: 0.001 ZEC

## Security Features

- UUID-based primary keys
- SQL injection protection via parameterized queries
- Foreign key constraints for data integrity
- Atomic withdrawal processing
- Comprehensive error handling

## QR Code Features

The SDK automatically generates QR codes for all payment invoices:

- **Multiple Formats**: PNG, SVG, and base64 data URLs
- **Responsive Sizes**: Mobile (200px), Web (256px), Print (512px)
- **Zcash URI Standard**: Compatible with all Zcash wallets
- **Caching**: QR codes are cached for optimal performance

### QR Code Endpoints

```bash
# Get PNG QR code (default)
GET /api/invoice/{id}/qr?format=png&size=256

# Get SVG QR code
GET /api/invoice/{id}/qr?format=svg&preset=web

# Get mobile-optimized QR
GET /api/invoice/{id}/qr?preset=mobile

# Get print-quality QR
GET /api/invoice/{id}/qr?preset=print
```

### HTML Integration

```html
<!-- Display QR code directly -->
<img src="/api/invoice/123e4567-e89b-12d3-a456-426614174000/qr" 
     alt="Payment QR Code" 
     width="256" height="256">

<!-- SVG QR code -->
<object data="/api/invoice/123e4567-e89b-12d3-a456-426614174000/qr?format=svg" 
        type="image/svg+xml" 
        width="256" height="256">
</object>
```

## Documentation

- [Complete Backend Implementation](./BACKEND_DOCS.md)
- [Database Schema & Models](./USER_AND_PAYMENT_SCHEMA_DOCS.md)
- [NPM Package Usage Guide](./NPM_PACKAGE_USAGE.md)

## Support

This SDK powers production platforms processing $100K+ in ZEC volume. For enterprise support and customization, contact our team.
