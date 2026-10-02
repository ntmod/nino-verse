import assert from 'node:assert/strict';
import { getSpendingCycle } from './spending-cycle.js';
import { getSpendingDays } from './spending-heatmap.mjs';
const cycle = getSpendingCycle(0, new Date('2026-10-02T12:00:00+07:00'));
const tx = (amount, date) => ({ amount, date });
const days = getSpendingDays([
  tx(-0.1, '2026-09-30'), tx(-0.2, '2026-09-30'), tx(500, '2026-09-30'),
  tx(-300, '2026-10-01T23:30:00+07:00'), tx(-1500, '2026-10-02T00:30:00+07:00'),
  tx(-700, '2026-10-03'), tx(-100, '2026-09-29'), tx(-100, '2026-10-30'),
  tx(NaN, '2026-10-02'), tx(-100, 'invalid'),
], cycle);
assert.equal(days.length, 30);
assert.equal(days[0].date, '2026-09-30');
assert.equal(days.at(-1).date, '2026-10-29');
assert.equal(days[0].amount, 0.3);
assert.equal(days[0].records.length, 2);
assert.deepEqual(days.slice(0, 5).map(day => day.level), [1, 2, 4, 3, 0]);
assert.equal(getSpendingDays([], cycle).every(day => day.amount === 0), true);
assert.equal(getSpendingDays([], getSpendingCycle(0, new Date('2026-02-28'))).length, 30);
console.log('Heatmap verified: cycle boundaries, Bangkok midnight, cents and fixed color thresholds.');
