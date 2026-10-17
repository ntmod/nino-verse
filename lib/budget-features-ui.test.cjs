const { test } = require('node:test');
const assert = require('node:assert/strict');
const { harness, find, settle, deferred, categories } = require('./transaction-form.test-support.cjs');
const button = (tree, text) => find(tree, node => node.type === 'button' && node.props.children === text);
test('Dashboard wallet overview stays absent without wallets and does not block normal reporting', async () => {
  const h = harness('../components/nori/WalletOverview.tsx', { '@/lib/services/walletService': { walletService: { getAll: async () => ({ wallets: [] }) } } });
  const props = { startDate: '2026-09-30', endDate: '2026-10-29' };
  assert.equal(h.render(props), null); h.runEffects(); await settle(); assert.equal(h.render(props), null);
});
test('cycle close summary loads only on demand and remains available without budget wallets', async () => {
  let calls = 0;
  const h = harness('../components/nori/LastCycleSummary.tsx', { '@/lib/services/transactionService': { transactionService: { getAll: async (start) => { calls++; return [{ _id: 'expense', amount: start === '2026-09-01' ? -40 : -50, name: 'Lunch', category: 'food', date: start }]; } } } });
  const props = { state: { config: { mode: 'fixed' }, currentIndex: 2, cycles: [
    { startDate: '2026-08-01', endDate: '2026-08-31' }, { startDate: '2026-09-01', endDate: '2026-09-30' }, { startDate: '2026-10-01', endDate: '2026-10-31' },
  ] }, categories };
  const tree = h.render(props); assert.equal(calls, 0);
  await button(tree, 'Last cycle is complete · View summary').props.onClick(); await settle();
  const receipt = find(h.render(props), node => node.type === 'CycleReceipt');
  assert.equal(receipt.props.transactions[0].amount, -40); assert.equal(receipt.props.transactions[0].category, 'Food'); assert.equal(receipt.props.previousTotal, 50);
});
test('refund form retains input after a failed request, retries with the same key and suppresses double submission', async () => {
  const pending = deferred(); let fail = true, calls = [], saved;
  const h = harness('../components/RefundExpense.tsx', { testFetch: async (url, options) => {
    calls.push(JSON.parse(options.body)); if (fail) throw Error('offline'); return pending.promise;
  } });
  const props = { transaction: { _id: 'expense', name: 'Lunch', amount: -100 }, onSaved: value => { saved = value; }, onClose() {} };
  find(h.render(props), node => node.type === 'input' && node.props.type === 'number').props.onChange({ target: { value: '30' } });
  await find(h.render(props), node => node.type === 'form').props.onSubmit({ preventDefault() {} }); await settle();
  assert.equal(find(h.render(props), node => node.type === 'input' && node.props.type === 'number').props.value, '30');
  assert.ok(find(h.render(props), node => node.props?.role === 'alert'));
  fail = false;
  const form = find(h.render(props), node => node.type === 'form');
  form.props.onSubmit({ preventDefault() {} }); form.props.onSubmit({ preventDefault() {} }); await settle();
  assert.equal(calls.length, 2); assert.equal(calls[0].requestId, calls[1].requestId);
  pending.resolve({ ok: true, json: async () => ({ _id: 'expense', amount: -70 }) }); await settle(); assert.equal(saved.amount, -70);
});
