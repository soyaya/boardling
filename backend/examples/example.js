/**
 * Example usage of the Zcash Paywall SDK with different initialization methods
 */

import { ZcashPaywall } from "./src/ZcashPaywall.js";

async function examples() {
  console.log("🚀 Zcash Paywall SDK Examples\n");

  // Method 1: Basic initialization (uses smart defaults)
  console.log("1. Basic initialization:");
  const paywall1 = new ZcashPaywall();
  console.log("   Base URL:", paywall1.baseURL);
  console.log("   Timeout:", paywall1.timeout);

  // Method 2: With custom options
  console.log("\n2. With custom options:");
  const paywall2 = new ZcashPaywall({
    baseURL: "https://api.example.com",
    timeout: 15000,
    apiKey: "your-api-key",
  });
  console.log("   Base URL:", paywall2.baseURL);
  console.log("   Timeout:", paywall2.timeout);

  // Method 3: Using environment presets
  console.log("\n3. Using environment presets:");
  const paywall3 = ZcashPaywall.withPreset("development");
  console.log("   Base URL:", paywall3.baseURL);
  console.log("   Timeout:", paywall3.timeout);

  // Method 4: With server defaults (server-side only)
  console.log("\n4. With server defaults:");
  try {
    const paywall4 = await ZcashPaywall.withServerDefaults();
    console.log("   Base URL:", paywall4.baseURL);
    console.log("   Timeout:", paywall4.timeout);
  } catch (error) {
    console.log("   Server config not available (expected in standalone mode)");
  }

  // Method 5: Fetch config from server
  console.log("\n5. Fetch config from server:");
  try {
    const paywall5 = await ZcashPaywall.fromServer("http://localhost:3000");
    console.log("   Base URL:", paywall5.baseURL);
    console.log("   Timeout:", paywall5.timeout);
  } catch (error) {
    console.log("   Server not running or config endpoint unavailable");
  }

  // Show available APIs
  console.log("\n📋 Available APIs:");
  console.log("- Users API:", typeof paywall1.users);
  console.log("- Invoices API:", typeof paywall1.invoices);
  console.log("- Withdrawals API:", typeof paywall1.withdrawals);
  console.log("- Admin API:", typeof paywall1.admin);

  console.log("\n✅ SDK examples completed!");
  console.log("\nTo use with a running server:");
  console.log("1. Start your server: npm start");
  console.log("2. Initialize SDK: await paywall.initialize()");
  console.log("3. Use APIs: await paywall.users.create({...})");
}

examples().catch(console.error);
