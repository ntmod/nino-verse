import assert from 'node:assert/strict';
import { test } from 'node:test';
import { budgetProgress } from './budget-progress.mjs';

test('budgets show category names and expense-only spending for both legacy names and IDs', () => {
  const budgets = [{ _id: 'b1', category: 'food', limit: 100 }, { _id: 'b2', category: 'Travel', limit: 50 }];
  const categories = [{ _id: 'food', name: 'Food' }, { _id: 'travel', name: 'Travel' }];
  const transactions = [{ category: 'food', amount: -0.1 }, { category: 'Food', amount: -0.2 }, { category: 'food', amount: 100 }, { category: 'travel', amount: -25 }, { category: 'other', amount: -5 }];
  const progress = budgetProgress(budgets, categories, transactions);
  assert.equal(progress[0].category, 'Food');
  assert.equal(progress[0].spent, 0.3);
  assert.equal(progress[0].limit, 100);
  assert.equal(progress[1].spent, 25);
  assert.equal(budgetProgress(budgets, categories, [])[0].spent, 0);
  assert.equal(budgets[0].category, 'food', 'source data must remain unchanged');
});
