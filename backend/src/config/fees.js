/**
 * Fee configuration for the Zcash paywall system
 */
export const FEES = {
  fixed: 0.0005,      // Fixed fee per transaction
  percent: 0.02,      // 2% percentage fee
  minimum: 0.001,     // Minimum total fee
};

/**
 * Calculate withdrawal fees
 * @param {number} amount - Withdrawal amount in ZEC
 * @returns {Object} Fee calculation result
 */
export function calculateFee(amount) {
  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }

  const percentFee = amount * FEES.percent;
  const totalFee = Math.max(FEES.fixed + percentFee, FEES.minimum);
  const net = amount - totalFee;

  if (net <= 0.00000001) {
    throw new Error('Amount too low after fees. Minimum withdrawal after fees must be greater than 0.00000001 ZEC');
  }

  return {
    amount: Number(amount.toFixed(8)),
    fee: Number(totalFee.toFixed(8)),
    net: Number(net.toFixed(8)),
    feeBreakdown: {
      fixed: FEES.fixed,
      percent: Number(percentFee.toFixed(8)),
      total: Number(totalFee.toFixed(8))
    }
  };
}

/**
 * Get fee estimate for amount
 * @param {number} amount - Amount in ZEC
 * @returns {Object} Fee estimate
 */
export function getFeeEstimate(amount) {
  try {
    return calculateFee(amount);
  } catch (error) {
    return {
      error: error.message,
      amount: 0,
      fee: 0,
      net: 0
    };
  }
}

/**
 * Validate minimum withdrawal amount
 * @param {number} amount - Amount to validate
 * @returns {boolean} Whether amount meets minimum requirements
 */
export function isValidWithdrawalAmount(amount) {
  try {
    calculateFee(amount);
    return true;
  } catch {
    return false;
  }
}