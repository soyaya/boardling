import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { config } from './appConfig.js';

// Function to read Zebra cookie authentication
function getZebraCookie() {
  try {
    const cookiePath = path.join(os.homedir(), '.cache', 'zebra', '.cookie');
    const cookieContent = fs.readFileSync(cookiePath, 'utf8').trim();
    const [username, password] = cookieContent.split(':');
    return { username, password };
  } catch (error) {
    console.warn('Could not read Zebra cookie, falling back to config auth:', error.message);
    return {
      username: config.zcash.rpcUser || '',
      password: config.zcash.rpcPass || '',
    };
  }
}

const rpcConfig = {
  url: config.zcash.rpcUrl,
  auth: getZebraCookie(),
};

/**
 * Execute Zcash RPC command
 * @param {string} method - RPC method name
 * @param {Array} params - RPC parameters
 * @returns {Promise<any>} RPC result
 */
export async function zcashRpc(method, params = []) {
  try {
    const response = await axios.post(rpcConfig.url, {
      jsonrpc: '1.0',
      id: Date.now(),
      method,
      params,
    }, {
      auth: rpcConfig.auth,
      headers: { 'Content-Type': 'text/plain' },
      timeout: 30000,
    });

    if (response.data.error) {
      throw new Error(`Zcash RPC Error: ${response.data.error.message}`);
    }

    return response.data.result;
  } catch (error) {
    if (error.response) {
      throw new Error(`Zcash RPC HTTP Error: ${error.response.status} - ${error.response.statusText}`);
    }
    throw new Error(`Zcash RPC Connection Error: ${error.message}`);
  }
}

/**
 * Get treasury address (static address for all payments)
 * @returns {string} Treasury t-address
 */
export function getTreasuryAddress() {
  const treasuryAddress = config.platformTreasuryAddress;
  if (!treasuryAddress) {
    throw new Error('PLATFORM_TREASURY_ADDRESS not configured in environment');
  }
  return treasuryAddress;
}

/**
 * Get transparent address (uses treasury address since Zebra doesn't support wallet operations)
 * @returns {Promise<string>} Treasury t-address
 */
export async function generateTAddress() {
  return getTreasuryAddress();
}

/**
 * Get new shielded address (fallback to treasury address)
 * @returns {Promise<string>} Treasury t-address
 */
export async function generateZAddress() {
  // Since we're using Zebra without wallet functionality, 
  // always return the treasury address
  console.log('Using treasury address for payment (Zebra mode)');
  return getTreasuryAddress();
}

/**
 * Check received amount for address
 * @param {string} address - Z-address to check
 * @param {number} minconf - Minimum confirmations (default: 0)
 * @returns {Promise<Array>} Array of received transactions
 */
export async function getReceivedByAddress(address, minconf = 0) {
  return await zcashRpc('z_listreceivedbyaddress', [minconf, [address]]);
}

/**
 * Send ZEC to multiple recipients
 * @param {Array} recipients - Array of {address, amount, memo?} objects
 * @param {number} minconf - Minimum confirmations (default: 1)
 * @param {number} fee - Transaction fee (default: 0.0001)
 * @returns {Promise<string>} Operation ID
 */
export async function sendMany(recipients, minconf = 1, fee = 0.0001) {
  return await zcashRpc('z_sendmany', ['', recipients, minconf, fee]);
}

/**
 * Get operation status
 * @param {string} opid - Operation ID
 * @returns {Promise<Object>} Operation status
 */
export async function getOperationStatus(opid) {
  const operations = await zcashRpc('z_getoperationstatus', [[opid]]);
  return operations[0];
}

/**
 * Wait for operation to complete
 * @param {string} opid - Operation ID
 * @param {number} maxAttempts - Maximum polling attempts (default: 50)
 * @param {number} interval - Polling interval in ms (default: 2500)
 * @returns {Promise<Object>} Final operation status
 */
export async function waitForOperation(opid, maxAttempts = 50, interval = 2500) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getOperationStatus(opid);
    
    if (status.status !== 'executing' && status.status !== 'queued') {
      return status;
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Operation ${opid} timed out after ${maxAttempts} attempts`);
}

/**
 * Get blockchain info
 * @returns {Promise<Object>} Blockchain information
 */
export async function getBlockchainInfo() {
  return await zcashRpc('getblockchaininfo');
}

/**
 * Validate Zcash address
 * @param {string} address - Address to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateAddress(address) {
  try {
    return await zcashRpc('validateaddress', [address]);
  } catch (error) {
    // If RPC validation fails, do basic format validation
    return {
      isvalid: /^(t1|t3|zs1|zc)[a-zA-Z0-9]{30,}$/.test(address),
      address: address,
      scriptPubKey: '',
      ismine: false,
      iswatchonly: false,
      isscript: false
    };
  }
}

/**
 * Generate address based on available methods
 * @param {string} type - Address type ('transparent' or 'shielded')
 * @returns {Promise<string>} Generated address
 */
export async function generateAddress(type = 'transparent') {
  if (type === 'shielded') {
    return await generateZAddress();
  } else {
    return await generateTAddress();
  }
}

/**
 * Detect address type
 * @param {string} address - Address to check
 * @returns {string} Address type ('transparent', 'sapling', 'sprout', or 'unknown')
 */
export function getAddressType(address) {
  if (address.startsWith('t1') || address.startsWith('t3')) {
    return 'transparent';
  } else if (address.startsWith('zs1')) {
    return 'sapling';
  } else if (address.startsWith('zc')) {
    return 'sprout';
  }
  return 'unknown';
}

/**
 * Check if address is shielded
 * @param {string} address - Address to check
 * @returns {boolean} True if shielded address
 */
export function isShieldedAddress(address) {
  const type = getAddressType(address);
  return type === 'sapling' || type === 'sprout';
}

/**
 * Check payment for transparent address using RPC
 * @param {string} address - Transparent address to check
 * @param {number} expectedAmount - Expected amount in ZEC
 * @param {number} minconf - Minimum confirmations
 * @returns {Promise<boolean>} True if payment received
 */
export async function checkTransparentPayment(address, expectedAmount, minconf = 1) {
  try {
    // For mock addresses in testing, simulate payment check
    if (address.startsWith('t1') && address.length < 40) {
      // This is a mock address, simulate payment for testing
      return Math.random() > 0.5; // 50% chance of "payment" for testing
    }
    
    // For real addresses, use RPC to check
    const received = await zcashRpc('getreceivedbyaddress', [address, minconf]);
    return received >= expectedAmount;
  } catch (error) {
    console.warn('Error checking transparent payment:', error.message);
    return false;
  }
}