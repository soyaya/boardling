/**
 * TypeScript definitions for Zcash Paywall SDK
 */

export interface ZcashPaywallOptions {
  baseURL?: string;
  apiKey?: string;
  timeout?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface UserBalance {
  total_received_zec: number;
  total_withdrawn_zec: number;
  available_balance_zec: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  type: 'subscription' | 'one_time';
  amount_zec: number;
  item_id?: string;
  z_address: string;
  qr_code: string;
  payment_uri: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  paid_txid?: string;
  paid_amount_zec?: number;
  created_at: string;
  expires_at?: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  to_address: string;
  amount_zec: number;
  fee_zec: number;
  net_amount_zec: number;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  txid?: string;
  requested_at: string;
  processed_at?: string;
}

export interface PaymentStatus {
  paid: boolean;
  invoice: Invoice;
}

export interface QRCodeOptions {
  format?: 'buffer' | 'svg' | 'dataurl';
  size?: number;
  preset?: 'web' | 'mobile' | 'print';
}

export interface ListOptions {
  limit?: number;
  offset?: number;
}

export interface InvoiceListOptions extends ListOptions {
  status?: 'pending' | 'paid' | 'expired' | 'cancelled';
  type?: 'subscription' | 'one_time';
}

export interface WithdrawalListOptions extends ListOptions {
  status?: 'pending' | 'processing' | 'sent' | 'failed';
}

export interface FeeEstimate {
  amount: number;
  fee: number;
  net: number;
  feeBreakdown: {
    network_fee: number;
    platform_fee: number;
  };
}

export interface HealthStatus {
  status: 'OK' | 'ERROR';
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
    zcash_rpc: 'connected' | 'disconnected';
  };
}

export declare class UsersAPI {
  create(data: { email: string; name?: string }): Promise<User>;
  getById(userId: string): Promise<User>;
  getByEmail(email: string): Promise<User>;
  update(userId: string, data: { email?: string; name?: string }): Promise<User>;
  getBalance(userId: string, options?: { cache?: boolean; cacheTTL?: number }): Promise<UserBalance>;
  list(options?: ListOptions & { search?: string }): Promise<{ users: User[]; total: number }>;
}

export declare class InvoicesAPI {
  create(data: {
    user_id?: string;
    email?: string;
    type: 'subscription' | 'one_time';
    amount_zec: number;
    item_id?: string;
  }): Promise<Invoice>;
  checkPayment(invoiceId: string, options?: { verbose?: boolean }): Promise<PaymentStatus>;
  getById(invoiceId: string): Promise<Invoice>;
  getQRCode(invoiceId: string, options?: QRCodeOptions): Promise<string | Buffer>;
  getPaymentURI(invoiceId: string): Promise<string>;
  listByUser(userId: string, options?: InvoiceListOptions): Promise<{ invoices: Invoice[]; total: number }>;
}

export declare class WithdrawalsAPI {
  create(data: {
    user_id: string;
    to_address: string;
    amount_zec: number;
  }): Promise<Withdrawal>;
  process(withdrawalId: string): Promise<{ success: boolean; txid: string; user_received: number; platform_fee: number }>;
  processBatch(withdrawalIds: string[]): Promise<Array<{ id: string; success: boolean; txid?: string; error?: string }>>;
  getFeeEstimate(amount_zec: number): Promise<FeeEstimate>;
  getById(withdrawalId: string): Promise<Withdrawal>;
  listByUser(userId: string, options?: WithdrawalListOptions): Promise<{ withdrawals: Withdrawal[]; total: number }>;
}

export declare class AdminAPI {
  getStats(): Promise<any>;
  getPendingWithdrawals(): Promise<Withdrawal[]>;
  getUserBalances(options?: ListOptions & { min_balance?: number }): Promise<{ balances: UserBalance[]; total: number }>;
  getRevenue(): Promise<any>;
  getActiveSubscriptions(): Promise<any>;
  getNodeStatus(): Promise<any>;
}

export declare class ZcashPaywall {
  users: UsersAPI;
  invoices: InvoicesAPI;
  withdrawals: WithdrawalsAPI;
  admin: AdminAPI;

  constructor(options?: ZcashPaywallOptions);
  initialize(): Promise<boolean>;
  getHealth(): Promise<HealthStatus>;
  
  static withPreset(environment: 'development' | 'production' | 'testing', overrides?: ZcashPaywallOptions): ZcashPaywall;
  static withServerDefaults(overrides?: ZcashPaywallOptions): Promise<ZcashPaywall>;
  static fromServer(baseURL: string, overrides?: ZcashPaywallOptions): Promise<ZcashPaywall>;
}

export declare function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries?: number,
  baseDelay?: number
): Promise<T>;

export default ZcashPaywall;