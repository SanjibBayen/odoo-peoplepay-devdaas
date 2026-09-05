/**
 * Currency and numerical formatting utilities for PeoplePay.
 */

/**
 * Formats a monetary amount into a currency string (defaults to Indian Rupee INR).
 *
 * @param {number|string} amount
 * @param {string} [currency='INR']
 * @param {Object} [options={}]
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'INR', options = {}) {
  const num = Number(amount);
  if (isNaN(num)) return '₹0';

  const { maximumFractionDigits = 0, minimumFractionDigits = 0 } = options;

  try {
    if (currency === 'INR') {
      return `₹${num.toLocaleString('en-IN', {
        maximumFractionDigits,
        minimumFractionDigits,
      })}`;
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits,
      minimumFractionDigits,
    }).format(num);
  } catch {
    return `₹${num.toLocaleString()}`;
  }
}

/**
 * Formats numbers into compact string representations (e.g. 1.2K, 3.4M).
 *
 * @param {number|string} num
 * @returns {string}
 */
export function formatCompactNumber(num) {
  const n = Number(num);
  if (isNaN(n)) return '0';

  if (Math.abs(n) >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (Math.abs(n) >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (Math.abs(n) >= 1_000) {
    return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return String(n);
}

export default formatCurrency;
