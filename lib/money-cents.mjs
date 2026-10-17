/** @param {unknown} value @param {boolean} [allowZero] */
export function moneyCents(value, allowZero = false) {
  if (typeof value !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error('Invalid amount');
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents < (allowZero ? 0 : 1)) throw new Error('Invalid amount');
  return cents;
}
