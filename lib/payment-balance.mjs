/** Undefined preserves an existing balance; null explicitly disables tracking. */
export function validInitialBalance(value) {
  return value === undefined || value === null ||
    (typeof value === 'number' && Number.isFinite(value) && Number.isSafeInteger(Math.round(value * 100)));
}

/** Aggregate totals are signed transaction amounts in cents, across all dates.
 * @param {{ _id: unknown, name: string, initialBalance?: number | null }} method
 * @param {Map<string, number>} totals */
export function paymentBalance(method, totals) {
  if (method.initialBalance == null) return null;
  const id = String(method._id);
  return (Math.round(method.initialBalance * 100) + (totals.get(id) ?? 0) +
    (method.name === id ? 0 : totals.get(method.name) ?? 0)) / 100;
}
