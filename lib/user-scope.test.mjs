import assert from 'node:assert/strict';
import { dataScope, normalizeEmail } from './user-scope.mjs';
assert.equal(normalizeEmail(' NTMod001@Gmail.com '), 'ntmod001@gmail.com');
assert.deepEqual(dataScope({ id: 'partner', email: 'partner@example.com', emailVerified: true }), { userId: 'partner' });
assert.deepEqual(dataScope({ id: 'owner', email: 'NTMOD001@gmail.com', emailVerified: true }), { $or: [{ userId: 'owner' }, { userId: { $exists: false } }, { userId: null }] });
assert.throws(() => dataScope({ id: 'attacker', email: 'ntmod001@gmail.com', emailVerified: false }));
assert.throws(() => dataScope(null));
console.log('User isolation checks passed');
