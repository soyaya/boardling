/**
 * Standalone Zcash Paywall SDK - Main Entry Point
 * This is the main export for the NPM package
 */

export { ZcashPaywall, retryWithBackoff } from './sdk/index.js';
export * from './sdk/testing/index.js';

// Default export for CommonJS compatibility
import { ZcashPaywall } from './sdk/index.js';
export default ZcashPaywall;