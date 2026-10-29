const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, Date, Map, Set, Response, require: name => dependencies[name] });
  return exports;
}
const { filteredCycleTotals, filteredCycleRecords } = load('lib/cycle-spending.ts');
test('category filters sum integer cents, preserve zero cycles and support clearing', () => {
  const data = { cycles: [{ cycleId: 'a' }, { cycleId: 'b' }, { cycleId: 'empty' }], totals: [
    { cycleId: 'a', category: 'food', amountCents: 101 },
    { cycleId: 'a', category: 'travel', amountCents: 299 },
    { cycleId: 'b', category: 'food', amountCents: 123 },
  ] };
  const values = selected => JSON.stringify(filteredCycleTotals(data, selected).map(row => row.amountCents));
  assert.equal(values(['food', 'travel']), '[400,123,0]');
  assert.equal(values(['food']), '[101,123,0]');
  assert.equal(values([]), '[0,0,0]');
  assert.equal(values(['missing']), '[0,0,0]');
  const records = [{ _id: 'lunch', category: 'food', amountCents: 101 }, { _id: 'train', category: 'travel', amountCents: 299 }];
  assert.equal(filteredCycleRecords(records, ['food']).length, 1);
  assert.equal(filteredCycleRecords(records, ['food'])[0]._id, 'lunch');
  assert.equal(filteredCycleRecords(records, []).length, 0);
  assert.equal(filteredCycleRecords(records, ['food', 'travel']).reduce((sum, row) => sum + row.amountCents, 0), filteredCycleTotals(data, ['food', 'travel'])[0].amountCents);
});
test('cycle API enforces auth, uses user scope and actual cycle boundaries, normalizes legacy categories', async () => {
  let owner = new Response(null, { status: 401 });
  let pipeline;
  let categoryScope;
  const cycles = [
    { cycleId: 'old', startDate: '2024-11-30T00:00:00+07:00', endDate: '2024-12-29T23:59:59.999+07:00' },
    { cycleId: 'first', startDate: '2024-12-30T00:00:00+07:00', endDate: '2025-01-29T23:59:59.999+07:00' },
    { cycleId: 'current', startDate: '2025-01-30T00:00:00+07:00', endDate: '2025-02-28T23:59:59.999+07:00' },
  ];
  class ClockDate extends Date { constructor(...args) { super(...(args.length ? args : ['2025-02-10T12:00:00Z'])); } }
  const source = fs.readFileSync('app/api/nori/analytics/cycles/route.ts', 'utf8');
  const exports = {};
  const dependencies = {
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
    '@/lib/current-user': { requireUser: async () => owner },
    '@/lib/db': { default: async () => {} },
    '@/models/Transaction': { default: { aggregate: async value => { pipeline = value; return [
      { cycleId: 'first', category: 'Food', amountCents: 101 },
      { cycleId: 'current', category: 'deleted-category', amountCents: 99 },
    ]; } } },
    '@/models/Category': { default: { find: scope => { categoryScope = scope; return { sort: () => ({ lean: async () => [{ _id: 'food-id', name: 'Food', type: 'expense' }] }) }; } } },
    '@/lib/annual-spending': load('lib/annual-spending.ts'),
    '@/lib/cycle-server': { loadCycleConfig: async id => { assert.equal(id, 'alice'); return {}; } },
    '@/lib/cycle-config': { cycleState: () => ({ cycles, currentIndex: 2 }) },
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, Date: ClockDate, Map, Response, URL, require: name => dependencies[name] });
  assert.equal((await exports.GET()).status, 401);
  assert.equal(pipeline, undefined);
  owner = { id: 'alice', scope: { userId: 'alice' } };
  const response = await exports.GET();
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(pipeline[0].$match.userId, 'alice');
  assert.equal(categoryScope.userId, 'alice');
  assert.equal(pipeline[0].$match.amount.$lt, 0);
  assert.equal(pipeline[0].$match.date.$gte.toISOString(), new Date(cycles[1].startDate).toISOString());
  assert.equal(pipeline[1].$group._id.cycleId.$switch.branches.length, 2);
  assert.equal(result.cycles.length, 2);
  assert.equal(result.cycles[1].isCurrent, true);
  assert.equal(result.totals[0].category, 'food-id');
  assert.ok(result.categories.some(category => category.id === 'deleted-category'));
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const missing = await exports.GET(new Request('https://nori.test/api/nori/analytics/cycles?cycleId=foreign'));
  assert.equal(missing.status, 404);
  const detail = await exports.GET(new Request('https://nori.test/api/nori/analytics/cycles?cycleId=first'));
  assert.equal(detail.status, 200);
  assert.equal(pipeline[0].$match.userId, 'alice');
  assert.equal(pipeline[0].$match.amount.$lt, 0);
  assert.equal(pipeline[1].$set.cycleId.$switch.branches.length, 2);
  assert.equal(pipeline[2].$match.cycleId, 'first');
  assert.equal(pipeline[3].$sort.date, -1);
  assert.equal(pipeline[4].$project.name, 1);
  assert.equal(JSON.stringify(pipeline[4].$project.amountCents), '{"$round":[{"$multiply":["$amount",-100]},0]}');
  assert.equal((await detail.json()).records[0].category, 'food-id');
  assert.equal(detail.headers.get('cache-control'), 'private, no-store');
});

test('daily averages include zero-spend days, leap day and only elapsed days for current cycles', () => {
  const { cycleDailyAverage } = load('lib/cycle-spending.ts');
  const cycle = { startDate: '2024-02-01T00:00:00+07:00', endDate: '2024-02-29T23:59:59.999+07:00' };
  assert.equal(cycleDailyAverage(29000, cycle, '2024-03-15T00:00:00+07:00'), 1000);
  assert.equal(cycleDailyAverage(10000, cycle, '2024-02-10T12:00:00+07:00'), 1000);
  assert.equal(cycleDailyAverage(99, cycle, '2024-02-01T00:01:00+07:00'), 99);
  assert.equal(cycleDailyAverage(0, cycle, '2024-02-10T00:00:00+07:00'), 0);
  // Bangkok midnight starts the second day even though it is still February 1 in UTC.
  assert.equal(cycleDailyAverage(100, cycle, '2024-02-01T17:00:00Z'), 50);
});
