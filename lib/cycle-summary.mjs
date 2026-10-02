import { elapsedCycleDays } from './spending-cycle.js';

/**
 * Expense-only statistics; money is summed in cents, dates use Bangkok days.
 * @param {{ amount: number, date: string, name: string, category?: string }[]} transactions
 * @param {{ startDate: Date, endDate: Date }} cycle
 * @param {number} previousTotal
 * @param {Date} [now]
 */
export function summarizeCycle(transactions, cycle, previousTotal, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);
  const cutoff = Math.min(cycle.endDate.getTime(), new Date(`${today}T23:59:59.999+07:00`).getTime());
  const expenses = transactions.filter(tx => Number.isFinite(tx.amount) && tx.amount < 0 &&
    new Date(tx.date) >= cycle.startDate && new Date(tx.date).getTime() <= cutoff);
  const days = new Map();
  const categories = new Map();
  let totalCents = 0;
  let largest = null;
  for (const tx of expenses) {
    const cents = Math.round(Math.abs(tx.amount) * 100);
    totalCents += cents;
    categories.set(tx.category || "", (categories.get(tx.category || "") || 0) + cents);
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date(tx.date));
    days.set(date, (days.get(date) || 0) + cents);
    if (!largest || cents > largest.cents) largest = { name: tx.name, cents };
  }
  const topDay = [...days].sort((a, b) => b[1] - a[1])[0];
  const total = totalCents / 100;
  return {
    total,
    categories: [...categories].sort((a, b) => b[1] - a[1]).map(([name, cents]) => ({ name, amount: cents / 100 })),
    count: expenses.length,
    average: total / elapsedCycleDays(cycle, now),
    change: previousTotal > 0 ? (total - previousTotal) / previousTotal * 100 : null,
    largest: largest ? { name: largest.name, amount: largest.cents / 100 } : null,
    topDay: topDay ? { date: topDay[0], amount: topDay[1] / 100 } : null,
    status: now < cycle.startDate ? 'upcoming' : now > cycle.endDate ? 'complete' : 'ongoing',
  };
}
