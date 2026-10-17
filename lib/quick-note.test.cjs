/* eslint-disable @typescript-eslint/no-require-imports -- Run directly with Node's test runner. */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, 'quick-note.ts'), 'utf8');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { quickNoteData, localRecordDate } = context.exports;
const categories = [
  { _id: 'food', name: 'Food', type: 'expense', subcategories: [{ _id: 'lunch', name: 'Lunch' }] },
  { _id: 'salary', name: 'Salary', type: 'income' },
];
const methods = [{ _id: 'cash', name: 'Cash' }];
const input = { name: '  Lunch  ', amount: '85.25', category: 'food', paymentMethod: 'cash', subCategory: 'lunch' };

test('quick note uses signed money, valid IDs, and a local date for the real transaction API', () => {
  const expense = quickNoteData(input, categories, methods);
  assert.equal(expense.name, 'Lunch');
  assert.equal(expense.amount, -85.25);
  assert.equal(expense.subCategory, 'lunch');
  assert.equal(expense.date, localRecordDate());
  assert.equal(quickNoteData({ ...input, amount: '0.29' }, categories, methods).amount, -0.29);
  const income = quickNoteData({ ...input, name: ' ', category: 'salary', subCategory: '' }, categories, methods);
  assert.equal(income.amount, 85.25);
  assert.equal(income.name, 'Salary');
});

test('invalid money and stale metadata cannot be submitted', () => {
  for (const amount of ['', '0', '-1', 'NaN', 'Infinity', '1.001', '1e3', '9007199254740992']) {
    assert.throws(() => quickNoteData({ ...input, amount }, categories, methods));
  }
  assert.throws(() => quickNoteData({ ...input, category: 'missing' }, categories, methods));
  assert.throws(() => quickNoteData({ ...input, paymentMethod: 'missing' }, categories, methods));
  assert.throws(() => quickNoteData({ ...input, subCategory: 'missing' }, categories, methods));
  assert.throws(() => quickNoteData({ ...input, category: 'salary' }, categories, methods));
});

test('record date uses local calendar fields, including near UTC midnight', () => {
  const local = { getFullYear: () => 2026, getMonth: () => 9, getDate: () => 18 };
  assert.equal(localRecordDate(local), '2026-10-18');
});


test('shared form validates explicit dates and description length for edits and templates', () => {
  assert.equal(quickNoteData({ ...input, date: '2026-10-12' }, categories, methods).date, '2026-10-12');
  for (const date of ['', 'invalid', '2026-02-30', '2026-13-01', '2026-10-12T12:00:00Z']) {
    assert.throws(() => quickNoteData({ ...input, date }, categories, methods));
  }
  assert.throws(() => quickNoteData({ ...input, name: 'x'.repeat(201) }, categories, methods));
});
