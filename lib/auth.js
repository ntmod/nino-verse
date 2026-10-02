/* eslint-disable @typescript-eslint/no-require-imports -- Node also runs this CommonJS module for token setup and checks. */
const { createHash, createHmac, randomBytes, timingSafeEqual } = require('node:crypto');

const SESSION_AGE = 60 * 60 * 24 * 7;

function sessionSignature(expires, secret) {
  return createHmac('sha256', secret).update(`nori_session:${expires}`).digest('hex');
}

function createSession(secret, now = Date.now()) {
  if (!secret) throw new Error('SESSION_SECRET is required');
  const expires = now + SESSION_AGE * 1000;
  return `${expires}.${sessionSignature(expires, secret)}`;
}

function validSession(value, secret, now = Date.now()) {
  if (typeof value !== 'string' || !secret) return false;
  const match = /^(\d{13})\.([0-9a-f]{64})$/.exec(value);
  if (!match || Number(match[1]) <= now) return false;
  return timingSafeEqual(
    Buffer.from(match[2], 'hex'),
    Buffer.from(sessionSignature(match[1], secret), 'hex')
  );
}

function createWatchToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: createHash('sha256').update(token).digest('hex') };
}

function validWatchToken(header, hash) {
  if (typeof header !== 'string' || typeof hash !== 'string' || !/^[0-9a-f]{64}$/i.test(hash)) return false;
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(header);
  if (!match) return false;
  return timingSafeEqual(
    createHash('sha256').update(match[1]).digest(),
    Buffer.from(hash, 'hex')
  );
}

function isWatchRoute(method, pathname) {
  return (method === 'GET' && (
    pathname === '/api/nori/category'
    || pathname === '/api/nori/method'
    || pathname === '/api/nori/daily-average'
  ))
    || (method === 'POST' && pathname === '/api/nori/transaction');
}

module.exports = { SESSION_AGE, createSession, validSession, createWatchToken, validWatchToken, isWatchRoute };
