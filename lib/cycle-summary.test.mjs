import assert from 'node:assert/strict';
import { summarizeCycle } from './cycle-summary.mjs';
import { getSpendingCycle } from './spending-cycle.js';

const now = new Date('2026-10-02T12:00:00+07:00');
const cycle = getSpendingCycle(0, now);
const tx = (amount, date, name = 'Lunch') => ({ amount, date, name });
const summary = summarizeCycle([
  tx(-0.1, '2026-09-30'), tx(-0.2, '2026-09-30'),
  tx(-90, '2026-10-01T23:30:00+07:00', 'Dinner'),
  tx(-30, '2026-10-02T00:30:00+07:00'),
  tx(1000, '2026-10-01'), tx(-100, '2026-09-29'),
  tx(-100, '2026-10-30'), tx(-500, '2026-10-03'), tx(NaN, '2026-10-01'),
], cycle, 150, now);
assert.equal(summary.total, 120.3);
assert.equal(summary.count, 4);
assert.equal(summary.average, 40.1);
assert.deepEqual(summary.largest, { name: 'Dinner', amount: 90 });
assert.deepEqual(summary.topDay, { date: '2026-10-01', amount: 90 });
assert.ok(Math.abs(summary.change + 19.8) < 0.00001);
assert.equal(summary.status, 'ongoing');
const empty = summarizeCycle([], cycle, 0, now);
assert.equal(empty.change, null);
assert.equal(empty.largest, null);
assert.equal(empty.topDay, null);
assert.equal(empty.average, 0);
assert.equal(summarizeCycle([], cycle, 0, new Date('2026-11-01')).status, 'complete');
assert.equal(summarizeCycle([], cycle, 0, new Date('2026-09-01')).status, 'upcoming');
console.log('Cycle receipt: cents, expense filtering, Bangkok dates and empty periods verified.');
