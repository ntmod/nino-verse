import assert from 'node:assert/strict';
import { getGardenDays, getGardenPlants, getGardenSaveFeedback } from './cycle-garden.mjs';
import { getSpendingCycle } from './spending-cycle.js';
const cycle = getSpendingCycle(0, new Date('2024-10-02T12:00:00+07:00'));
const transactions = [
  { date: '2024-10-01T00:00:00+07:00', amount: -85 },
  { date: '2024-09-30T18:00:00Z', amount: 1000 }, // Same Bangkok day, income also counts.
  { date: '2024-10-02T00:00:00+07:00', amount: 50 },
  { date: '2024-09-29T00:00:00+07:00', amount: -10 },
  { date: 'invalid', amount: -10 },
];
const days = getGardenDays(transactions, cycle);
assert.equal(days.length, 30);
assert.equal(days.filter(day => day.records.length).length, 2);
assert.equal(days.find(day => day.date === '2024-10-01').records.length, 2);
assert.deepEqual(getGardenDays([...transactions].reverse(), cycle).map(day => day.flower), days.map(day => day.flower));
assert.equal(getGardenDays([], cycle).filter(day => day.records.length).length, 0);
const allDays = days.map(day => ({ ...day, records: [{ date: day.date, amount: -1 }] }));
const plants = getGardenPlants(allDays);
assert.equal(plants.length, allDays.length);
assert.deepEqual(getGardenPlants(allDays), plants);
for (let i = 0; i < plants.length; i++) {
  for (let j = i + 1; j < plants.length; j++) {
    const dx = Math.abs(plants[i].x - plants[j].x) / 100 * 860;
    const dy = Math.abs(plants[i].y - plants[j].y) / 100 * 400;
    assert.ok(dx >= 44 || dy >= 44, 'Bush targets must not overlap');
  }
}
const sparse = getGardenPlants(allDays.map((day, i) => ({ ...day, records: i % 2 === 0 ? day.records : [] })));
for (const plant of sparse) {
  const original = plants.find(day => day.date === plant.date);
  assert.equal(plant.x, original.x);
  assert.equal(plant.y, original.y);
}
const full31 = getGardenDays([], { startDate: new Date('2026-10-01T00:00:00+07:00'), endDate: new Date('2026-10-31T23:59:59+07:00') }).map(day => ({ ...day, records: [{ date: day.date, amount: -1 }] }));
assert.equal(getGardenPlants(full31).length, 31);
assert.ok(getGardenPlants(full31).every(plant => Number.isFinite(plant.x) && Number.isFinite(plant.y)));
assert.equal(getGardenPlants([]).length, 0);
console.log('Cycle garden verified: historical records, one bush per Bangkok day, non-overlapping targets, income, boundaries and stable flowers.');
for (let month = 0; month < 12; month++) {
  const sampleCycle = getSpendingCycle(0, new Date(2026, month, 15));
  const sample = getGardenDays([], sampleCycle).map(day => ({ ...day, records: [{ date: day.date, amount: -1 }] }));
  const scatter = getGardenPlants(sample);
  assert.equal(scatter.length, sample.length);
  assert.ok(scatter.some(plant => plant.width > 100) && scatter.some(plant => plant.width < 60), 'Near and far bushes must have visibly different sizes');
  for (let i = 0; i < scatter.length; i++) for (let j = i + 1; j < scatter.length; j++) {
    const dx = Math.abs(scatter[i].x - scatter[j].x) * 8.6;
    const dy = Math.abs(scatter[i].y - scatter[j].y) * 4;
    assert.ok(dx >= 44 || dy >= 44, 'Perspective targets must not overlap');
  }
}
console.log('Perspective layout verified across all 12 cycles');

assert.deepEqual(getGardenSaveFeedback([], transactions[0]), { date: '2024-10-01', newDay: true });
assert.equal(getGardenSaveFeedback(transactions, transactions[0]).newDay, false, 'Editing an existing day should pulse, not regrow');
assert.equal(getGardenSaveFeedback([transactions[0]], transactions[1]).newDay, false, 'Bangkok day boundaries must match for subsequent records');
assert.equal(getGardenSaveFeedback([], { date: 'invalid', amount: -1 }), null);
console.log('Save feedback verified: first-day bloom, existing-day pulse and Bangkok dates');
