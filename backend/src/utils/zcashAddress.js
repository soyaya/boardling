/**
 * Zcash Address Validation and Type Detection Utilities
 * Supports transparent (t-addr), shielded (z-addr), and unified addresses (u-addr)
 */

/**
 * Validate and detect Zcash address type
 * @param {string} address - The Zcash address to validate
 * @param {string} network - The network (mainnet or testnet)
 * @returns {Object} - { valid: boolean, type: string|null, error: string|null }
 */
export function validateZcashAddress(address, network = 'mainnet') {
  if (!address || typeof address !== 'string') {
    return { valid: false, type: null, error: 'Address is required and must be a string' };
  }

  const trimmedAddress = address.trim();

  if (trimmedAddress.length === 0) {
    return { valid: false, type: null, error: 'Address cannot be empty' };
  }

  // Detect address type based on prefix
  const type = detectAddressType(trimmedAddress, network);
  
  if (!type) {
    return { 
      valid: false, 
      type: null, 
      error: 'Invalid Zcash address format. Must be a valid t-address, z-address, or unified address' 
    };
  }

  // Validate address format based on type
  const validation = validateAddressFormat(trimmedAddress, type, network);
  
  return validation;
}

/**
 * Detect Zcash address type from prefix
 * @param {string} address - The Zcash address
 * @param {string} network - The network (mainnet or testnet)
 * @returns {string|null} - 't', 'z', 'u', or null if invalid
 */
export function detectAddressType(address, network = 'mainnet') {
  if (!address || typeof address !== 'string') {
    return null;
  }

  const trimmedAddress = address.trim();

  // Unified addresses (ZIP-316)
  // Mainnet: starts with 'u1'
  // Testnet: starts with 'utest1'
  if (network === 'mainnet' && trimmedAddress.startsWith('u1')) {
    return 'u';
  }
  if (network === 'testnet' && trimmedAddress.startsWith('utest1')) {
    return 'u';
  }

  // Transparent addresses (P2PKH and P2SH)
  // Mainnet: starts with 't1' (P2PKH) or 't3' (P2SH)
  // Testnet: starts with 'tm' (P2PKH) or 't2' (P2SH)
  if (network === 'mainnet' && (trimmedAddress.startsWith('t1') || trimmedAddress.startsWith('t3'))) {
    return 't';
  }
  if (network === 'testnet' && (trimmedAddress.startsWith('tm') || trimmedAddress.startsWith('t2'))) {
    return 't';
  }

  // Shielded addresses (Sapling)
  // Mainnet: starts with 'zs'
  // Testnet: starts with 'ztestsapling'
  if (network === 'mainnet' && trimmedAddress.startsWith('zs')) {
    return 'z';
  }
  if (network === 'testnet' && trimmedAddress.startsWith('ztestsapling')) {
    return 'z';
  }

  return null;
}

/**
 * Validate address format based on type
 * @param {string} address - The Zcash address
 * @param {string} type - The address type ('t', 'z', or 'u')
 * @param {string} network - The network (mainnet or testnet)
 * @returns {Object} - { valid: boolean, type: string, error: string|null }
 */
function validateAddressFormat(address, type, network) {
  // Basic length and character validation
  const validChars = /^[a-zA-Z0-9]+$/;
  
  if (!validChars.test(address)) {
    return { 
      valid: false, 
      type, 
      error: 'Address contains invalid characters. Only alphanumeric characters are allowed' 
    };
  }

  // Type-specific validation
  switch (type) {
    case 't':
      return validateTransparentAddress(address, network);
    case 'z':
      return validateShieldedAddress(address, network);
    case 'u':
      return validateUnifiedAddress(address, network);
    default:
      return { valid: false, type: null, error: 'Unknown address type' };
  }
}

/**
 * Validate transparent address format
 */
function validateTransparentAddress(address, network) {
  // Transparent addresses are typically 35 characters
  // Mainnet: t1 (P2PKH) or t3 (P2SH) + 33 chars
  // Testnet: tm (P2PKH) or t2 (P2SH) + 33 chars
  
  const minLength = 34;
  const maxLength = 36;

  if (address.length < minLength || address.length > maxLength) {
    return { 
      valid: false, 
      type: 't', 
      error: `Transparent address length must be between ${minLength} and ${maxLength} characters` 
    };
  }

  // Verify prefix
  if (network === 'mainnet') {
    if (!address.startsWith('t1') && !address.startsWith('t3')) {
      return { 
        valid: false, 
        type: 't', 
        error: 'Mainnet transparent address must start with t1 or t3' 
      };
    }
  } else {
    if (!address.startsWith('tm') && !address.startsWith('t2')) {
      return { 
        valid: false, 
        type: 't', 
        error: 'Testnet transparent address must start with tm or t2' 
      };
    }
  }

  return { valid: true, type: 't', error: null };
}

/**
 * Validate shielded (Sapling) address format
 */
function validateShieldedAddress(address, network) {
  // Sapling addresses are 78 characters
  // Mainnet: zs + 76 chars
  // Testnet: ztestsapling + variable length
  
  if (network === 'mainnet') {
    const expectedLength = 78;
    if (address.length !== expectedLength) {
      return { 
        valid: false, 
        type: 'z', 
        error: `Mainnet shielded address must be exactly ${expectedLength} characters` 
      };
    }
    if (!address.startsWith('zs')) {
      return { 
        valid: false, 
        type: 'z', 
        error: 'Mainnet shielded address must start with zs' 
      };
    }
  } else {
    // Testnet shielded addresses start with 'ztestsapling'
    if (!address.startsWith('ztestsapling')) {
      return { 
        valid: false, 
        type: 'z', 
        error: 'Testnet shielded address must start with ztestsapling' 
      };
    }
    // Testnet addresses are longer due to the prefix
    const minLength = 90;
    if (address.length < minLength) {
      return { 
        valid: false, 
        type: 'z', 
        error: `Testnet shielded address must be at least ${minLength} characters` 
      };
    }
  }

  return { valid: true, type: 'z', error: null };
}

/**
 * Validate unified address format (ZIP-316)
 */
function validateUnifiedAddress(address, network) {
  // Unified addresses are variable length but typically 100+ characters
  // Mainnet: u1 + variable
  // Testnet: utest1 + variable
  
  const minLength = network === 'mainnet' ? 100 : 105;

  if (address.length < minLength) {
    return { 
      valid: false, 
      type: 'u', 
      error: `Unified address must be at least ${minLength} characters` 
    };
  }

  // Verify prefix
  if (network === 'mainnet') {
    if (!address.startsWith('u1')) {
      return { 
        valid: false, 
        type: 'u', 
        error: 'Mainnet unified address must start with u1' 
      };
    }
  } else {
    if (!address.startsWith('utest1')) {
      return { 
        valid: false, 
        type: 'u', 
        error: 'Testnet unified address must start with utest1' 
      };
    }
  }

  return { valid: true, type: 'u', error: null };
}

/**
 * Get address type display name
 */
export function getAddressTypeName(type) {
  const typeNames = {
    't': 'Transparent',
    'z': 'Shielded (Sapling)',
    'u': 'Unified'
  };
  return typeNames[type] || 'Unknown';
}
