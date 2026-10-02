/* eslint-disable @typescript-eslint/no-require-imports -- Run directly with Node's test runner. */
const assert = require('node:assert/strict');
const test = require('node:test');
const { createSession, validSession, createWatchToken, validWatchToken, isWatchRoute } = require('./auth');

test('signed web session rejects forged and expired cookies', () => {
  const secret = 'a-long-random-session-secret';
  const session = createSession(secret, 1_700_000_000_000);
  assert.equal(validSession(session, secret, 1_700_000_000_001), true);
  assert.equal(validSession('true', secret), false);
  assert.equal(validSession(`${session.slice(0, -1)}${session.endsWith('0') ? '1' : '0'}`, secret, 1_700_000_000_001), false);
  assert.equal(validSession(session, 'different-secret', 1_700_000_000_001), false);
  assert.equal(validSession(session, secret, 1_700_604_800_000), false);
});

test('watch token is limited to Quick Expense routes', () => {
  const { token, hash } = createWatchToken();
  assert.equal(validWatchToken(`Bearer ${token}`, hash), true);
  assert.equal(validWatchToken(`Bearer ${token}`, '0'.repeat(64)), false);
  assert.equal(validWatchToken('Bearer invalid', hash), false);
  assert.equal(isWatchRoute('GET', '/api/nori/category'), true);
  assert.equal(isWatchRoute('GET', '/api/nori/method'), true);
  assert.equal(isWatchRoute('GET', '/api/nori/daily-average'), true);
  assert.equal(isWatchRoute('POST', '/api/nori/transaction'), true);
  assert.equal(isWatchRoute('GET', '/api/nori/transaction'), false);
  assert.equal(isWatchRoute('PATCH', '/api/nori/category'), false);
});
