/**
 * Basic SDK tests
 */

import { ZcashPaywall } from '../index.js';
import { MockZcashPaywall } from '../testing/index.js';

describe('ZcashPaywall SDK', () => {
  test('should create SDK instance', () => {
    const paywall = new ZcashPaywall({
      baseURL: 'http://localhost:3000'
    });
    
    expect(paywall).toBeDefined();
    expect(paywall.users).toBeDefined();
    expect(paywall.invoices).toBeDefined();
    expect(paywall.withdrawals).toBeDefined();
    expect(paywall.admin).toBeDefined();
  });

  test('should create mock SDK for testing', async () => {
    const paywall = new MockZcashPaywall();
    
    const user = await paywall.users.create({
      email: 'test@example.com',
      name: 'Test User'
    });
    
    expect(user.email).toBe('test@example.com');
    expect(user.id).toBeDefined();
  });

  test('should handle error mapping', () => {
    const paywall = new ZcashPaywall();
    
    expect(paywall.mapErrorCode(404, { error: 'User not found' })).toBe('NOT_FOUND');
    expect(paywall.mapErrorCode(400, { error: 'Invalid Zcash address' })).toBe('INVALID_ADDRESS');
    expect(paywall.mapErrorCode(500, {})).toBe('INTERNAL_ERROR');
  });

  test('should handle API key management', () => {
    const paywall = new ZcashPaywall();
    
    // Initially no API key
    expect(paywall.hasApiKey()).toBe(false);
    
    // Set API key
    const testApiKey = 'zp_test_key_12345';
    paywall.setApiKey(testApiKey);
    expect(paywall.hasApiKey()).toBe(true);
    expect(paywall.apiKey).toBe(testApiKey);
    
    // Remove API key
    paywall.removeApiKey();
    expect(paywall.hasApiKey()).toBe(false);
    expect(paywall.apiKey).toBe(null);
  });

  test('should include API key in requests', () => {
    const paywall = new ZcashPaywall({
      apiKey: 'zp_test_key_12345'
    });
    
    expect(paywall.client.defaults.headers.Authorization).toBe('Bearer zp_test_key_12345');
  });

  test('should have API keys module', () => {
    const paywall = new ZcashPaywall();
    
    expect(paywall.apiKeys).toBeDefined();
    expect(typeof paywall.apiKeys.create).toBe('function');
    expect(typeof paywall.apiKeys.listByUser).toBe('function');
    expect(typeof paywall.apiKeys.regenerate).toBe('function');
  });
});