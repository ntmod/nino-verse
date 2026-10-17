const { test } = require('node:test');
const assert = require('node:assert/strict');
const { harness, find } = require('./transaction-form.test-support.cjs');
test('Modal delegates to the shared form, guards closing during save and immediately notifies before receipt dismissal', () => {
  let notified = false, closed = 0;
  const h = harness('../components/ExpenseModal.tsx', { '@/lib/modal-context': { useModal: () => ({ isExpenseModalOpen: true, closeExpenseModal() { closed++; }, onSuccess() { notified = true; } }) } });
  const tree = h.render();
  const form = find(tree, n => n.type === 'TransactionForm'); assert.equal(form.props.variant, 'modal');
  const backdrop = find(tree, n => n.props?.className?.includes('backdrop-blur-md'));
  form.props.onSavingChange(true); backdrop.props.onClick(); assert.equal(closed, 0);
  form.props.onSaved({ transaction: { _id: 'new' }, categoryName: 'Food', paymentName: 'Cash' }, true);
  assert.equal(notified, true); assert.equal(closed, 1);
  assert.ok(find(h.render(), n => n.type === 'receipt'));
});
test('Keep-open save notifies the page without closing or showing a receipt', () => {
  let notified = 0, closed = 0;
  const h = harness('../components/ExpenseModal.tsx', { '@/lib/modal-context': { useModal: () => ({ isExpenseModalOpen: true, closeExpenseModal() { closed++; }, onSuccess() { notified++; } }) } });
  find(h.render(), n => n.type === 'TransactionForm').props.onSaved({ transaction: { _id: 'new' } }, false);
  assert.equal(notified, 1); assert.equal(closed, 0);
  assert.equal(find(h.render(), n => n.type === 'receipt'), undefined);
});
