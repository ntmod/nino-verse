const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, Date, Map, Response, require: name => dependencies[name] });
  return exports;
}
const annual = load('lib/annual-spending.ts');
test('Bangkok new year, leap days, zero days and integer cumulative totals', () => {
  const window = annual.annualWindow(new Date('2025-12-31T17:00:00Z'));
  assert.equal(window.year, 2026);
  assert.equal(window.start.toISOString(), '2025-12-31T17:00:00.000Z');
  assert.equal(window.end.toISOString(), '2026-01-01T17:00:00.000Z');
  const leap = annual.fillSpendingDays([{ date: '2024-02-29', amountCents: 1234 }], new Date('2024-12-31T12:00:00Z'));
  assert.equal(leap.days.length, 366);
  assert.equal(leap.days[0].amountCents, 0);
  assert.equal(annual.cumulativeSpending(leap.days).at(-1).totalCents, 1234);
  const partial = annual.fillSpendingDays([{ date: '2026-01-01', amountCents: 10 }, { date: '2026-01-03', amountCents: 20 }], new Date('2026-01-03T12:00:00Z'));
  assert.equal(partial.days.length, 3);
  assert.equal(JSON.stringify(annual.cumulativeSpending(partial.days).map(day => day.totalCents)), '[10,10,30]');
});
test('API rejects unauthenticated requests and scopes daily expense aggregation', async () => {
  let owner = new Response(null, { status: 401 });
  let pipeline;
  const route = load('app/api/nori/analytics/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
    '@/lib/current-user': { requireUser: async () => owner },
    '@/lib/db': { default: async () => {} },
    '@/models/Transaction': { default: { aggregate: async value => { pipeline = value; return []; } } },
    '@/lib/annual-spending': annual,
  });
  assert.equal((await route.GET()).status, 401);
  assert.equal(pipeline, undefined);
  owner = { scope: { userId: 'alice' } };
  const response = await route.GET();
  assert.equal(response.status, 200);
  assert.equal(pipeline[0].$match.userId, 'alice');
  assert.equal(pipeline[0].$match.amount.$lt, 0);
  assert.ok(pipeline[0].$match.date.$lt > pipeline[0].$match.date.$gte);
  assert.equal(pipeline[1].$group._id.$dateToString.timezone, 'Asia/Bangkok');
  assert.equal(JSON.stringify(pipeline[1].$group.amountCents), '{"$sum":{"$round":[{"$multiply":["$amount",-100]},0]}}');
  assert.ok((await response.json()).days.length <= 366);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});
