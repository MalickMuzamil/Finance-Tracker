/**
 * Formats a numeric value into Pakistani Rupee (PKR) representation.
 * @param {number|string} amount
 * @param {object} options
 * @returns {string} e.g. "PKR 10,000"
 */
export function formatPKR(amount, options = {}) {
  const {
    includePrefix = true,
    showSign = false,
    decimals = 0,
  } = options;

  const num = Number(amount);
  if (isNaN(num)) {
    return includePrefix ? 'PKR 0' : '0';
  }

  const isNegative = num < 0;
  const absVal = Math.abs(num);

  const formattedNumber = absVal.toLocaleString('en-PK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const prefix = includePrefix ? 'PKR ' : '';

  if (isNegative) {
    return `-${prefix}${formattedNumber}`;
  }

  if (showSign && num > 0) {
    return `+${prefix}${formattedNumber}`;
  }

  return `${prefix}${formattedNumber}`;
}
