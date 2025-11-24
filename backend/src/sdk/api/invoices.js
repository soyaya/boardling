/**
 * Invoices API Module
 */

export class InvoicesAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Create a new invoice
   */
  async create({ user_id, type, amount_zec, item_id, email }) {
    const response = await this.client.post('/api/invoice/create', {
      user_id,
      type,
      amount_zec,
      item_id,
      email
    });
    return response.data.invoice;
  }

  /**
   * Check payment status
   */
  async checkPayment(invoiceId, options = {}) {
    const response = await this.client.post('/api/invoice/check', {
      invoice_id: invoiceId,
      verbose: options.verbose
    });
    return response.data;
  }

  /**
   * Get invoice by ID
   */
  async getById(invoiceId) {
    const response = await this.client.get(`/api/invoice/${invoiceId}`);
    return response.data.invoice;
  }

  /**
   * Get QR code for invoice
   */
  async getQRCode(invoiceId, options = {}) {
    const {
      format = 'dataurl',
      size = 256,
      preset = 'web'
    } = options;

    const params = new URLSearchParams();
    if (format) params.append('format', format);
    if (size) params.append('size', size.toString());
    if (preset) params.append('preset', preset);

    const response = await this.client.get(`/api/invoice/${invoiceId}/qr?${params.toString()}`, {
      responseType: format === 'buffer' ? 'arraybuffer' : 'text'
    });

    if (format === 'buffer') {
      return Buffer.from(response.data);
    }
    
    return response.data;
  }

  /**
   * Get payment URI
   */
  async getPaymentURI(invoiceId) {
    const response = await this.client.get(`/api/invoice/${invoiceId}/uri`);
    return response.data.payment_uri;
  }

  /**
   * List invoices for a user
   */
  async listByUser(userId, options = {}) {
    const response = await this.client.get(`/api/invoice/user/${userId}`, {
      params: {
        status: options.status,
        type: options.type,
        limit: options.limit || 50,
        offset: options.offset || 0
      }
    });
    return response.data;
  }
}