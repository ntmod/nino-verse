export interface DailySpending { date: string; amountCents: number }
export interface AnnualSpending {
  year: number;
  days: DailySpending[];
}
export function annualWindow(now = new Date()) {
  const today = new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 10);
  const year = Number(today.slice(0, 4));
  const start = new Date(`${year}-01-01T00:00:00+07:00`);
  const end = new Date(Date.parse(`${today}T00:00:00+07:00`) + 86400000);
  return { year, today, start, end };
}
export function fillSpendingDays(rows: DailySpending[], now = new Date()): AnnualSpending {
  const { year, today } = annualWindow(now);
  const amounts = new Map(rows.map(row => [row.date, row.amountCents]));
  const days: DailySpending[] = [];
  for (let time = Date.UTC(year, 0, 1); ; time += 86400000) {
    const date = new Date(time).toISOString().slice(0, 10);
    if (date > today) break;
    days.push({ date, amountCents: amounts.get(date) ?? 0 });
  }
  return { year, days };
}
export function cumulativeSpending(days: DailySpending[]) {
  let total = 0;
  return days.map(day => ({ ...day, totalCents: total += day.amountCents }));
}
