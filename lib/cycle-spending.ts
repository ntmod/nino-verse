import type { CycleRange } from './cycle-config';
export interface CycleCategoryTotal { cycleId: string; category: string; amountCents: number }
export interface CycleSpendingData {
  asOf: string;
  cycles: (CycleRange & { isCurrent: boolean })[];
  categories: { id: string; name: string }[];
  totals: CycleCategoryTotal[];
}
export function filteredCycleTotals(data: CycleSpendingData, selected: string[]) {
  const included = new Set(selected);
  const sums = new Map<string, number>();
  for (const row of data.totals) {
    if (included.has(row.category)) sums.set(row.cycleId, (sums.get(row.cycleId) ?? 0) + row.amountCents);
  }
  return data.cycles.map(cycle => ({ ...cycle, amountCents: sums.get(cycle.cycleId) ?? 0 }));
}

export interface CycleSpendingRecord { _id: string; name: string; category: string; date: string; amountCents: number }
export function filteredCycleRecords(records: CycleSpendingRecord[], selected: string[]) {
  const included = new Set(selected);
  return records.filter(record => included.has(record.category));
}

export function cycleDailyAverage(amountCents: number, cycle: { startDate: string; endDate: string }, asOf: string) {
  const bangkokDay = (time: number) => Math.floor((time + 7 * 3600000) / 86400000);
  const elapsedEnd = Math.min(Date.parse(cycle.endDate), Date.parse(asOf));
  const days = Math.max(1, bangkokDay(elapsedEnd) - bangkokDay(Date.parse(cycle.startDate)) + 1);
  return Math.round(amountCents / days);
}
