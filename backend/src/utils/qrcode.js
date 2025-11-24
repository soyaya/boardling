import QRCode from 'qrcode';

/**
 * QR Code generation utilities for Zcash payments
 */

/**
 * Generate Zcash payment URI
 * @param {string} address - Zcash address (z-address or t-address)
 * @param {number} amount - Amount in ZEC
 * @param {string} message - Optional message/memo
 * @returns {string} Zcash payment URI
 */
export function generatePaymentUri(address, amount, message = '') {
  let uri = `zcash:${address}`;
  
  const params = [];
  if (amount) {
    params.push(`amount=${amount}`);
  }
  if (message) {
    params.push(`message=${encodeURIComponent(message)}`);
  }
  
  if (params.length > 0) {
    uri += `?${params.join('&')}`;
  }
  
  return uri;
}

/**
 * Generate QR code as data URL (base64)
 * @param {string} data - Data to encode
 * @param {Object} options - QR code options
 * @returns {Promise<string>} Base64 data URL
 */
export async function generateQRDataUrl(data, options = {}) {
  const defaultOptions = {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 256
  };

  const qrOptions = { ...defaultOptions, ...options };
  
  return await QRCode.toDataURL(data, qrOptions);
}

/**
 * Generate QR code as buffer
 * @param {string} data - Data to encode
 * @param {Object} options - QR code options
 * @returns {Promise<Buffer>} PNG buffer
 */
export async function generateQRBuffer(data, options = {}) {
  const defaultOptions = {
    errorCorrectionLevel: 'M',
    type: 'png',
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 256
  };

  const qrOptions = { ...defaultOptions, ...options };
  
  return await QRCode.toBuffer(data, qrOptions);
}

/**
 * Generate QR code as SVG string
 * @param {string} data - Data to encode
 * @param {Object} options - QR code options
 * @returns {Promise<string>} SVG string
 */
export async function generateQRSvg(data, options = {}) {
  const defaultOptions = {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 256
  };

  const qrOptions = { ...defaultOptions, ...options };
  
  return await QRCode.toString(data, qrOptions);
}

/**
 * Generate payment QR code for invoice
 * @param {Object} invoice - Invoice object
 * @param {string} format - Output format ('dataurl', 'buffer', 'svg')
 * @param {Object} options - QR code options
 * @returns {Promise<string|Buffer>} QR code in requested format
 */
export async function generatePaymentQR(invoice, format = 'dataurl', options = {}) {
  const message = `Payment for ${invoice.type}${invoice.item_id ? ` - ${invoice.item_id}` : ''}`;
  const paymentUri = generatePaymentUri(invoice.z_address, invoice.amount_zec, message);
  
  switch (format.toLowerCase()) {
    case 'buffer':
      return await generateQRBuffer(paymentUri, options);
    case 'svg':
      return await generateQRSvg(paymentUri, options);
    case 'dataurl':
    default:
      return await generateQRDataUrl(paymentUri, options);
  }
}

/**
 * Validate QR code size parameter
 * @param {string|number} size - Requested size
 * @param {number} min - Minimum allowed size
 * @param {number} max - Maximum allowed size
 * @returns {number} Validated size
 */
export function validateQRSize(size, min = 128, max = 1024) {
  const numSize = parseInt(size);
  if (isNaN(numSize)) {
    return 256; // default size
  }
  return Math.min(Math.max(numSize, min), max);
}

/**
 * Get QR code options for different use cases
 */
export const QR_PRESETS = {
  // Small QR for mobile displays
  mobile: {
    width: 200,
    margin: 1,
    errorCorrectionLevel: 'M'
  },
  
  // Medium QR for web displays
  web: {
    width: 256,
    margin: 2,
    errorCorrectionLevel: 'M'
  },
  
  // Large QR for printing
  print: {
    width: 512,
    margin: 4,
    errorCorrectionLevel: 'H'
  },
  
  // High contrast for better scanning
  highContrast: {
    width: 256,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  }
};