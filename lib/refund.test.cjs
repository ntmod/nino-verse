const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextResponse } = require('next/server');
const id = 'aaaaaaaaaaaaaaaaaaaaaaaa';
function fixture(walletId = '') {
  let owner = { id: 'alice', scope: { userId: 'alice' } };
  const row = { _id: id, userId: 'alice', name: 'Meal', amount: -100, walletId, category: 'food', paymentMethod: 'cash', date: '2026-10-01', refunds: [] };
  const clone = value => value ? JSON.parse(JSON.stringify(value)) : null;
  const matches = query => query.$and.every(part => Object.entries(part).every(([key, value]) => {
    if (key === 'refunds.requestId') return !row.refunds.some(item => item.requestId === value.$ne);
    return row[key] === value;
  }));
  const model = {
    async findOne(query) { return matches(query) ? clone(row) : null; },
    async findOneAndUpdate(query, update) {
      if (!matches(query)) return null;
      Object.assign(row, update.$set);
      row.refunds.push(update.$push.refunds);
      return clone(row);
    },
  };
  const cache = {};
  function load(file) {
    if (cache[file]) return cache[file];
    const exports = cache[file] = {};
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(`${__dirname}/../${file}`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, { exports, Date, Response, require(name) {
      if (name === '@/lib/refund') return load('lib/refund.ts');
      if (name === './money-cents.mjs') return require('./money-cents.mjs');
      if (name === 'mongoose') return { __esModule: true, default: { isValidObjectId: value => /^[a-f\d]{24}$/.test(value) } };
      if (name === 'next/server') return { NextResponse };
      if (name === '@/lib/current-user') return { requireUser: async () => owner ?? new Response('', { status: 401 }) };
      if (name === '@/lib/db') return { __esModule: true, default: async () => {} };
      if (name === '@/models/Transaction') return { __esModule: true, default: model };
      throw Error(name);
    } });
    return exports;
  }
  return { row, load, user(value) { owner = value; }, async refund(body) {
    return load('app/api/nori/transaction/[id]/refund/route.ts').POST(new Request('http://localhost/refund', { method: 'POST', body: JSON.stringify(body) }), { params: Promise.resolve({ id }) });
  } };
}
test('partial refunds and cancellation adjust the original cycle with or without a wallet; retries are idempotent', async () => {
  for (const walletId of ['', 'meals']) {
    const f = fixture(walletId);
    const body = { kind: 'refund', amount: '30.15', requestId: 'refund-request-1', userId: 'bob', walletId: 'hacked' };
    const first = await f.refund(body);
    assert.equal(first.status, 200);
    assert.equal((await first.json()).amount, -69.85);
    if (walletId) {
      const wallet = f.load('lib/wallet-budget.ts').walletSummaries([{_id: walletId, name: 'Meals', budgetCents: 10000}], [f.row], [])[0];
      assert.equal(wallet.spentCents, 6985); assert.equal(wallet.remainingCents, 3015);
    }
    const { summarizeCycle } = await import('./cycle-summary.mjs');
    const report = summarizeCycle([f.row, { amount: 1000, date: '2026-10-01', name: 'Salary' }], { startDate: new Date('2026-10-01'), endDate: new Date('2026-10-29') }, 0, new Date('2026-10-18'));
    assert.equal(report.total, 69.85, 'Refund reduces expense reports and does not add income');
    assert.equal((await f.refund(body)).status, 200);
    assert.equal(f.row.refunds.length, 1);
    assert.equal((await f.refund({ ...body, amount: '40' })).status, 400);
    assert.equal((await f.refund({ ...body, requestId: 'refund-request-2', amount: '70' })).status, 400);
    assert.equal((await f.refund({ kind: 'cancel', requestId: 'cancel-request-1' })).status, 200);
    assert.equal((await f.refund({ kind: 'cancel', requestId: 'cancel-request-1' })).status, 200);
    assert.equal(f.row.amount, 0);
    assert.equal(f.row.refunds.reduce((sum, item) => sum + item.amountCents, 0), 10000);
    assert.equal(f.row.walletId, walletId);
    assert.equal(f.row.date, '2026-10-01');
    assert.equal(f.row.userId, 'alice');
    assert.equal((await f.refund({ kind: 'refund', amount: '1', requestId: 'refund-after-zero' })).status, 400);
  }
});
test('competing refunds cannot over-return; foreign users and signed-out callers cannot mutate records', async () => {
  const f = fixture();
  const results = await Promise.all(['concurrent-1', 'concurrent-2'].map(requestId => f.refund({ kind: 'refund', amount: '60', requestId })));
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
  assert.equal(f.row.amount, -40); assert.equal(f.row.refunds.length, 1);
  f.user({ id: 'bob', scope: { userId: 'bob' } });
  assert.equal((await f.refund({ kind: 'cancel', requestId: 'foreign-refund' })).status, 404);
  f.user(null); assert.equal((await f.refund({ kind: 'cancel', requestId: 'logged-out-refund' })).status, 401);
});
test('invalid, fractional-cent and income refunds are rejected without changing money', async () => {
  const f = fixture();
  for (const amount of ['-1', '0', '0.001', 'NaN', '1e2', '90071992547409.92']) assert.equal((await f.refund({ kind: 'refund', amount, requestId: 'invalid-refund' })).status, 400);
  assert.equal(f.row.amount, -100);
  f.row.amount = 100;
  assert.equal((await f.refund({ kind: 'cancel', requestId: 'income-refund' })).status, 400);
});
