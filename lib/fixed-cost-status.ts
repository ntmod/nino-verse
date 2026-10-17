import type { Transaction } from './types';

export function isFixedCostPaid(
  name: string,
  transactions: (Pick<Transaction, 'name' | 'date'> & Partial<Pick<Transaction, 'amount'>>)[],
  cycle: { startDate: Date; endDate: Date },
  resetTime: number | null = null,
) {
  const start = Math.max(cycle.startDate.getTime(), resetTime ?? 0);
  const end = cycle.endDate.getTime();
  return transactions.some(transaction => {
    const date = new Date(transaction.date).getTime();
    return transaction.amount !== 0 && transaction.name.toLowerCase() === name.toLowerCase() && date >= start && date <= end;
  });
}
