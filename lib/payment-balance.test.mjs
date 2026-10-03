import assert from 'node:assert/strict';
import { paymentBalance, validInitialBalance } from './payment-balance.mjs';
const method = { _id: 'cash-id', name: 'Cash', initialBalance: 10000 };
assert.equal(paymentBalance(method, new Map([['cash-id', -200000], ['Cash', 50000]])), 8500);
assert.equal(paymentBalance({ ...method, initialBalance: null }, new Map()), null);
assert.equal(paymentBalance({ ...method, initialBalance: undefined }, new Map()), null);
assert.equal(paymentBalance({ ...method, initialBalance: 0 }, new Map([['cash-id', -1]])), -0.01);
assert.equal(paymentBalance({ ...method, initialBalance: 0.1 }, new Map([['cash-id', 20]])), 0.3);
assert.equal(paymentBalance(method, new Map()), 10000); // Deleted/moved transactions stop contributing.
for (const invalid of ['100', NaN, Infinity, {}, 1e20]) assert.equal(validInitialBalance(invalid), false);
for (const valid of [undefined, null, 0, -100, 100.25]) assert.equal(validInitialBalance(valid), true);
console.log('Payment balance checks passed');
