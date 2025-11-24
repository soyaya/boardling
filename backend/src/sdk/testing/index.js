/**
 * Testing utilities for Zcash Paywall SDK
 */

export function createMockDatabase() {
  return {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue()
  };
}

export function createMockZcashRPC() {
  return {
    getBlockchainInfo: jest.fn().mockResolvedValue({
      blocks: 12345,
      chain: 'test'
    }),
    generateAddress: jest.fn().mockResolvedValue('t1testtransparent1234567890abcdef'),
    getReceivedByAddress: jest.fn().mockResolvedValue(0),
    sendMany: jest.fn().mockResolvedValue('opid123'),
    validateAddress: jest.fn().mockResolvedValue({ isvalid: true })
  };
}

export class MockZcashPaywall {
  constructor(options = {}) {
    this.testing = true;
    this.users = new MockUsersAPI();
    this.invoices = new MockInvoicesAPI();
    this.withdrawals = new MockWithdrawalsAPI();
    this.admin = new MockAdminAPI();
  }

  async initialize() {
    return true;
  }

  async getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        zcash_rpc: 'connected'
      }
    };
  }
}

class MockUsersAPI {
  async create({ email, name }) {
    return {
      id: 'mock-user-id',
      email,
      name,
      created_at: new Date().toISOString()
    };
  }

  async getById(userId) {
    return {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      created_at: new Date().toISOString()
    };
  }

  async getByEmail(email) {
    return {
      id: 'mock-user-id',
      email,
      name: 'Test User',
      created_at: new Date().toISOString()
    };
  }

  async getBalance(userId) {
    return {
      total_received_zec: 1.0,
      total_withdrawn_zec: 0.5,
      available_balance_zec: 0.5
    };
  }
}

class MockInvoicesAPI {
  async create({ user_id, type, amount_zec, item_id }) {
    return {
      id: 'mock-invoice-id',
      user_id,
      type,
      amount_zec,
      item_id,
      payment_address: 'ztestsapling1234567890abcdef',
      z_address: 'ztestsapling1234567890abcdef',
      qr_code: 'data:image/png;base64,mock-qr-code',
      payment_uri: `zcash:ztestsapling1234567890abcdef?amount=${amount_zec}`,
      status: 'pending',
      created_at: new Date().toISOString()
    };
  }

  async checkPayment(invoiceId) {
    return {
      paid: false,
      invoice: {
        id: invoiceId,
        status: 'pending'
      }
    };
  }

  async getQRCode(invoiceId, options = {}) {
    if (options.format === 'buffer') {
      return Buffer.from('mock-qr-buffer');
    }
    return 'data:image/png;base64,mock-qr-code';
  }
}

class MockWithdrawalsAPI {
  async create({ user_id, to_address, amount_zec }) {
    return {
      id: 'mock-withdrawal-id',
      user_id,
      to_address,
      amount_zec,
      status: 'pending',
      requested_at: new Date().toISOString()
    };
  }

  async getFeeEstimate(amount_zec) {
    return {
      amount: amount_zec,
      fee: 0.0001,
      net: amount_zec - 0.0001,
      feeBreakdown: {
        network_fee: 0.0001,
        platform_fee: 0
      }
    };
  }
}

class MockAdminAPI {
  async getStats() {
    return {
      users: { total: 100 },
      invoices: { paid: 50, pending: 10 },
      withdrawals: { completed: 25, pending: 5 },
      revenue: { total_zec: 10.5 }
    };
  }

  async getNodeStatus() {
    return {
      blocks: 12345,
      chain: 'test',
      connections: 8
    };
  }
}