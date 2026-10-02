import { cycleDays } from './spending-cycle.js';

const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' });

/** @param {{ amount: number, date: string }[]} transactions
 * @param {{ startDate: Date, endDate: Date }} cycle */
export function getSpendingDays(transactions, cycle) {
  const days = Array.from({ length: cycleDays(cycle) }, (_, index) => ({
    date: dayKey.format(new Date(cycle.startDate.getTime() + index * 86400000)),
    amount: 0, records: [], level: 0,
  }));
  const byDate = new Map(days.map(day => [day.date, day]));
  for (const transaction of transactions) {
    const timestamp = new Date(transaction.date).getTime();
    if (!Number.isFinite(transaction.amount) || transaction.amount >= 0 ||
      timestamp < cycle.startDate.getTime() || timestamp > cycle.endDate.getTime() || !Number.isFinite(timestamp)) continue;
    const day = byDate.get(dayKey.format(new Date(timestamp)));
    if (day) {
      day.amount += Math.round(Math.abs(transaction.amount) * 100);
      day.records.push(transaction);
    }
  }
  for (const day of days) {
    day.amount /= 100;
    day.level = day.amount === 0 ? 0 : day.amount < 300 ? 1 : day.amount < 700 ? 2 : day.amount < 1500 ? 3 : 4;
  }
  return days;
}
