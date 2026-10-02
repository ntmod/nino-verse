import { cycleDays } from './spending-cycle.js';
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' });

/** @param {{ date: string, amount: number }[]} transactions
 * @param {{ startDate: Date, endDate: Date }} cycle */
export function getGardenDays(transactions, cycle) {
  const days = Array.from({ length: cycleDays(cycle) }, (_, index) => {
    const date = dayKey.format(new Date(cycle.startDate.getTime() + index * 86400000));
    return { date, records: [], flower: [...date].reduce((hash, char) => hash * 31 + char.charCodeAt(0) >>> 0, 0) % 4 };
  });
  const byDate = new Map(days.map(day => [day.date, day]));
  for (const transaction of transactions) {
    const timestamp = new Date(transaction.date).getTime();
    if (!Number.isFinite(timestamp) || !Number.isFinite(transaction.amount) || timestamp < cycle.startDate.getTime() || timestamp > cycle.endDate.getTime()) continue;
    byDate.get(dayKey.format(new Date(timestamp)))?.records.push(transaction);
  }
  return days;
}

/** Stable perspective scatter. Artwork may overlap; each day retains a separate 44px target.
 * @param {ReturnType<typeof getGardenDays>} days */
export function getGardenPlants(days) {
  let seed = [...(days[0]?.date ?? '')].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 1);
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const slots = [];
  for (let index = 0; index < days.length; index++) {
    let best, bestGap = -Infinity;
    // Place big foreground bushes first, then fill the space behind them.
    for (let attempt = 0; attempt < 400; attempt++) {
      const depth = index < 2 ? 1 : index < 4 ? 0.75 + random() * 0.2 : random() * 0.85;
      const width = 44 + depth ** 1.5 * 112;
      const height = Math.max(44, width * 88 / 96);
      const y = 142 + depth * 280 - height / 2;
      const x = 35 + random() * 790;
      if (Math.abs(x - (430 - depth * 20)) < 10 + depth * 125 + width / 2) continue;
      const gap = Math.min(...slots.map(slot => Math.max(Math.abs(x - slot.x) - 44, Math.abs(y - slot.y) - 44)));
      if (gap > bestGap) { bestGap = gap; best = { x, y, width, height, depth }; }
      if (gap >= 0) break;
    }
    slots.push(best);
  }
  // Assign all calendar days before filtering: new records never move existing bushes.
  for (let index = slots.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [slots[index], slots[other]] = [slots[other], slots[index]];
  }
  return days.map((day, index) => ({ ...day, ...slots[index], x: slots[index].x / 860 * 100, y: slots[index].y / 400 * 100 })).filter(day => day.records.length);
}

/** @param {{ date: string, amount: number }[]} previous
 * @param {{ date: string, amount: number }} transaction */
export function getGardenSaveFeedback(previous, transaction) {
  const timestamp = new Date(transaction.date).getTime();
  if (!Number.isFinite(timestamp) || !Number.isFinite(transaction.amount)) return null;
  const date = dayKey.format(new Date(timestamp));
  return { date, newDay: !previous.some(item => {
    const time = new Date(item.date).getTime();
    return Number.isFinite(time) && Number.isFinite(item.amount) && dayKey.format(new Date(time)) === date;
  }) };
}
