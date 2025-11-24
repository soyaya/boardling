/**
 * Unified Zcash Paywall SDK Usage Examples
 * Demonstrates the simplified, centralized approach
 */

import { createZcashPaywall, PAYMENT_METHODS, NETWORKS, INVOICE_TYPES } from '../src/UnifiedZcashPaywall.js';

// Initialize the SDK
const paywall = createZcashPaywall({
  baseURL: 'http://localhost:3001',
  network: NETWORKS.TESTNET,
  paymentMethod: PAYMENT_METHODS.AUTO, // Default to auto-selection
  timeout: 30000
});

/**
 * Example 1: Simple one-time payment (auto method selection)
 */
async function example1_SimplePayment() {
  console.log('\n=== Example 1: Simple Payment ===');
  
  try {
    // Create user
    const user = await paywall.createUser({
      email: 'user@example.com',
      name: 'John Doe'
    });
    console.log('Created user:', user.user.id);

    // Create invoice - SDK automatically selects best payment method
    const invoice = await paywall.createInvoice({
      user_id: user.user.id,
      amount_zec: 0.01,
      description: 'Test payment'
    });

    console.log('Invoice created:');
    console.log('- ID:', invoice.invoice.id);
    console.log('- Payment method:', invoice.invoice.payment_method);
    console.log('- Address:', invoice.invoice.payment_address);
    console.log('- QR code available:', !!invoice.invoice.qr_code);

    return invoice;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 2: Specific payment method selection
 */
async function example2_SpecificMethods() {
  console.log('\n=== Example 2: Specific Payment Methods ===');
  
  try {
    const user = await paywall.createUser({
      email: 'methods@example.com'
    });

    // Create different types of invoices
    const methods = [
      PAYMENT_METHODS.TRANSPARENT,
      PAYMENT_METHODS.UNIFIED,
      PAYMENT_METHODS.SHIELDED
    ];

    for (const method of methods) {
      const invoice = await paywall.createInvoice({
        user_id: user.user.id,
        amount_zec: 0.005,
        payment_method: method,
        description: `Payment via ${method}`
      });

      console.log(`${method.toUpperCase()} invoice:`, {
        id: invoice.invoice.id,
        address: invoice.invoice.payment_address,
        type: invoice.invoice.address_type
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 3: WebZjs browser-based payment
 */
async function example3_WebZjsPayment() {
  console.log('\n=== Example 3: WebZjs Payment ===');
  
  try {
    const user = await paywall.createUser({
      email: 'webzjs@example.com'
    });

    // Create WebZjs invoice
    const invoice = await paywall.createWebZjsInvoice({
      user_id: user.user.id,
      amount_zec: 0.02,
      description: 'Browser-based payment'
    });

    console.log('WebZjs invoice created:');
    console.log('- Instructions:', invoice.payment_info.instructions);
    console.log('- Address type:', invoice.invoice.address_type);
    
    // In a real browser app, you would:
    // 1. Initialize WebZjs
    // 2. Create/restore wallet
    // 3. Generate actual receiving address
    // 4. Update the invoice with real address
    
    return invoice;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 4: Payment monitoring with polling
 */
async function example4_PaymentMonitoring() {
  console.log('\n=== Example 4: Payment Monitoring ===');
  
  try {
    const user = await paywall.createUser({
      email: 'monitor@example.com'
    });

    const invoice = await paywall.createInvoice({
      user_id: user.user.id,
      amount_zec: 0.01,
      payment_method: PAYMENT_METHODS.TRANSPARENT
    });

    console.log('Monitoring payment for invoice:', invoice.invoice.id);
    console.log('Send ZEC to:', invoice.invoice.payment_address);

    // Monitor payment with progress callback
    try {
      const result = await paywall.waitForPayment(invoice.invoice.id, {
        timeout: 60000, // 1 minute for demo
        interval: 5000,  // Check every 5 seconds
        onProgress: (status) => {
          console.log('Payment status:', status.paid ? 'PAID' : 'PENDING');
          if (!status.paid && status.invoice.received_amount > 0) {
            console.log('Partial payment received:', status.invoice.received_amount, 'ZEC');
          }
        }
      });

      console.log('Payment completed!', result);
    } catch (timeoutError) {
      console.log('Payment timeout - checking manually...');
      const finalStatus = await paywall.checkPayment(invoice.invoice.id);
      console.log('Final status:', finalStatus);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 5: User balance and withdrawal
 */
async function example5_BalanceAndWithdrawal() {
  console.log('\n=== Example 5: Balance and Withdrawal ===');
  
  try {
    const user = await paywall.createUser({
      email: 'balance@example.com'
    });

    // Check initial balance
    const initialBalance = await paywall.getUserBalance(user.user.id);
    console.log('Initial balance:', initialBalance.balance.available_balance_zec, 'ZEC');

    // Simulate a paid invoice (in real scenario, this would be paid externally)
    console.log('Create invoice for balance demonstration...');
    const invoice = await paywall.createInvoice({
      user_id: user.user.id,
      amount_zec: 0.05,
      description: 'Balance demo'
    });

    console.log('Invoice created. In real scenario, user would pay to:', invoice.invoice.payment_address);

    // Get fee estimate for withdrawal
    const feeEstimate = await paywall.getFeeEstimate(0.03);
    console.log('Withdrawal fee estimate:', feeEstimate);

    // Create withdrawal request (would fail due to insufficient balance in demo)
    try {
      const withdrawal = await paywall.createWithdrawal({
        user_id: user.user.id,
        to_address: 't1YourWithdrawalAddress123456789',
        amount_zec: 0.03
      });
      console.log('Withdrawal created:', withdrawal);
    } catch (withdrawalError) {
      console.log('Expected withdrawal error (insufficient balance):', withdrawalError.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 6: Convenience methods
 */
async function example6_ConvenienceMethods() {
  console.log('\n=== Example 6: Convenience Methods ===');
  
  try {
    const user = await paywall.createUser({
      email: 'convenience@example.com'
    });

    // Use convenience methods for different payment types
    const transparentInvoice = await paywall.createTransparentInvoice({
      user_id: user.user.id,
      amount_zec: 0.01,
      description: 'Transparent payment'
    });

    const unifiedInvoice = await paywall.createUnifiedInvoice({
      user_id: user.user.id,
      amount_zec: 0.02,
      description: 'Unified address payment'
    });

    console.log('Convenience methods results:');
    console.log('- Transparent:', transparentInvoice.invoice.payment_method);
    console.log('- Unified:', unifiedInvoice.invoice.payment_method);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🚀 Unified Zcash Paywall SDK Examples');
  console.log('=====================================');

  // Check API health first
  try {
    const health = await paywall.healthCheck();
    console.log('API Health:', health.status);
  } catch (error) {
    console.error('API not available:', error.message);
    return;
  }

  // Run examples
  await example1_SimplePayment();
  await example2_SpecificMethods();
  await example3_WebZjsPayment();
  await example4_PaymentMonitoring();
  await example5_BalanceAndWithdrawal();
  await example6_ConvenienceMethods();

  console.log('\n✅ All examples completed!');
  console.log('\nKey Benefits of Unified System:');
  console.log('- Single endpoint for all payment methods');
  console.log('- Centralized balance management');
  console.log('- Automatic method selection');
  console.log('- Consistent API across all methods');
  console.log('- Easy integration with minimal code');
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}

export {
  example1_SimplePayment,
  example2_SpecificMethods,
  example3_WebZjsPayment,
  example4_PaymentMonitoring,
  example5_BalanceAndWithdrawal,
  example6_ConvenienceMethods,
  runAllExamples
};