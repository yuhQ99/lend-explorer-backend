const Decimal = require('decimal.js');

Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_UP });

const RAY = new Decimal(10).pow(27);

/**
 * Performs ray division (a * 1e27 / b)
 * @param {string|number|Decimal} a - The numerator
 * @param {string|number|Decimal} b - The denominator
 * @returns {string} - Result scaled by RAY (1e27)
 */
const rayDiv = (a, b) => {
  if (a === '0') return '0';

  const bDecimal = new Decimal(b);
  if (bDecimal.isZero()) {
    throw new Error('Division by zero');
  }

  return new Decimal(a).times(RAY).dividedBy(bDecimal).floor().toString();
};

/**
 * Performs ray multiplication (a * b / 1e27)
 * @param {string|number|Decimal} a - First number
 * @param {string|number|Decimal} b - Second number
 * @returns {string} - Result as uint128 string
 */
const rayMul = (a, b) => {
  if (a === '0' || b === '0') return '0';

  const result = new Decimal(a).times(new Decimal(b)).dividedBy(RAY).floor();

  if (result.isNegative()) {
    throw new Error('Result cannot be negative');
  }

  return result.toString();
};

module.exports = {
  rayDiv,
  rayMul,
};
