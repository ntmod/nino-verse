/* eslint-disable @typescript-eslint/no-require-imports -- Runs real TypeScript route handlers with an isolated in-memory store. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextResponse } = require('next/server');

(async () => {
  const scopeModule = await import('./user-scope.mjs');
  const { dataScope } = scopeModule;
  let user = { id: 'user-a', email: 'a@example.com', emailVerified: true };
  const a = 'aaaaaaaaaaaaaaaaaaaaaaaa', b = 'bbbbbbbbbbbbbbbbbbbbbbbb';
  const records = {
    Category: [{ _id: a, userId: 'user-a', name: 'Food', icon: '🍙', subcategories: [] }, { _id: b, userId: 'user-b', name: 'Private', subcategories: [] }],
    PaymentMethod: [{ _id: a, userId: 'user-a', name: 'Cash', initialBalance: 100 }, { _id: b, userId: 'user-b', name: 'Private cash', initialBalance: 9999 }],
    Transaction: [{ _id: a, userId: 'user-a', paymentMethod: a, category: a, amount: -10, date: new Date() }, { _id: b, userId: 'user-b', paymentMethod: a, category: b, amount: -900, date: new Date() }],
    Budget: [{ _id: a, userId: 'user-a' }, { _id: b, userId: 'user-b' }],
    FixedCost: [{ _id: a, userId: 'user-a' }, { _id: b, userId: 'user-b' }],
    DailyAverageConfig: [{ _id: a, userId: 'user-a', selectedCategories: [] }, { _id: b, userId: 'user-b', selectedCategories: [b] }],
  };
  function matches(row, query) {
    return Object.entries(query).every(([key, value]) => {
      if (key === '$and') return value.every(part => matches(row, part));
      if (key === '$or') return value.some(part => matches(row, part));
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        if ('$exists' in value) return (row[key] !== undefined) === value.$exists;
        if ('$gte' in value || '$lte' in value) return (!value.$gte || row[key] >= value.$gte) && (!value.$lte || row[key] <= value.$lte);
      }
      return value == null ? row[key] == null : String(row[key]) === String(value);
    });
  }
  const chain = value => ({ sort() { return this; }, select() { return this; }, lean() { return this; }, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } });
  const models = Object.fromEntries(Object.entries(records).map(([name, rows]) => {
    class Model { constructor(body) { Object.assign(this, body); } async save() { return this; } }
    Model.find = query => chain(rows.filter(row => matches(row, query)));
    Model.findOne = async query => rows.find(row => matches(row, query)) ?? null;
    Model.exists = Model.findOne;
    Model.findOneAndUpdate = async (query, body) => {
      const row = rows.find(row => matches(row, query));
      if (row) Object.assign(row, body);
      return row ?? null;
    };
    Model.findOneAndDelete = async query => rows.find(row => matches(row, query)) ?? null;
    Model.aggregate = async pipeline => {
      assert.ok(pipeline[0].$match, 'Balance aggregation must be scoped before summing');
      const totals = new Map();
      for (const row of rows.filter(row => matches(row, pipeline[0].$match))) totals.set(row.paymentMethod, (totals.get(row.paymentMethod) ?? 0) + Math.round(row.amount * 100));
      return [...totals].map(([_id, cents]) => ({ _id, cents }));
    };
    return [name, Model];
  }));
  const balance = await import('./payment-balance.mjs');
  const onboardingPresets = await import('./onboarding-presets.mjs');
  const legacyRows = new Map(['transactions','categories','paymentmethods','budgets','fixedcosts','dailyaverageconfigs'].map(name => [name, [{ _id: 'legacy' }, { _id: 'foreign', userId: 'user-b' }]]));
  let migrationMarker = null, migrationWrites = 0;
  const legacyDb = { collection(name) {
    if (name === 'nori_migrations') return { findOne: async () => migrationMarker, updateOne: async (query, body) => { migrationMarker = body.$set; } };
    return { updateMany: async (query, body) => {
      migrationWrites++;
      for (const row of legacyRows.get(name)) if (matches(row, query)) Object.assign(row, body.$set);
    } };
  } };
  let activeDb = legacyDb;
  class ObjectId { constructor(value) { this.value = value; } toString() { return this.value; } }
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    vm.runInNewContext(code, { exports, require(name) {
      if (name === 'server-only') return {};
      if (name === 'next/server') return { NextResponse };
      if (name === 'node:crypto') return require('node:crypto');
      if (name === '@/lib/onboarding-presets.mjs') return onboardingPresets;
      if (name === 'next/headers') return { headers: async () => new Headers() };
      if (name === './account-auth') return { getAuth: async () => ({ api: { getSession: async () => user ? { user } : null } }) };
      if (name === './auth') return require('./auth');
      if (name === './db') return { __esModule: true, default: async () => {} };
      if (name === './user-scope.mjs') return scopeModule;
      if (name === '@/lib/db') return { default: async () => {} , __esModule: true };
      if (name === '@/lib/current-user') return { requireUser: async () => user ? { ...user, scope: dataScope(user) } : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
      if (name === '@/lib/payment-balance.mjs') return balance;
      if (name === '@/lib/owned-references') return load('lib/owned-references.ts');
      if (name === '@/lib/spending-cycle.js') return { getSpendingCycle: () => ({ startDate: new Date('2020-01-01'), endDate: new Date('2030-01-01') }) };
      if (name === 'mongoose') return { __esModule: true, default: { connection: { get db() { return activeDb; } }, Types: { ObjectId }, isValidObjectId: value => /^[a-f0-9]{24}$/.test(value) } };
      if (name.startsWith('@/models/')) return { __esModule: true, default: models[name.split('/').pop()] };
      throw new Error(`Unexpected dependency: ${name}`);
    }, Response, Request, URL, Headers, Date, Set, Map, console, process: { env: {} } }, { filename: file });
    cache.set(file, exports);
    return exports;
  }
  const request = (path, method = 'GET', body) => new Request(`http://localhost:3000/api/nori/${path}`, { method, ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}) });
  for (const path of ['category', 'method', 'budget', 'fixed-cost', 'transaction', 'daily-average/config']) {
    const route = load(`app/api/nori/${path}/route.ts`);
    const response = await route.GET(request(path));
    assert.equal(response.status, 200, path);
    const result = await response.json();
    for (const row of Array.isArray(result) ? result : [result]) assert.equal(row.userId, 'user-a', path);
    if (path === 'method') assert.equal(result[0].balance, 90, 'Foreign expense must not affect balance');
    user = null;
    assert.equal((await route.GET(request(path))).status, 401, path);
    user = { id: 'user-a', email: 'a@example.com', emailVerified: true };
  }
  for (const path of ['category', 'method', 'fixed-cost', 'transaction']) {
    const route = load(`app/api/nori/${path}/[id]/route.ts`);
    assert.equal((await route.PATCH(request(`${path}/${b}`, 'PATCH', { name: 'Hacked', userId: 'user-a' }), { params: Promise.resolve({ id: b }) })).status, 404, path);
    assert.equal((await route.DELETE(request(`${path}/${b}`, 'DELETE'), { params: Promise.resolve({ id: b }) })).status, 404, path);
  }
  const average = await load('app/api/nori/daily-average/route.ts').GET(request('daily-average'));
  assert.equal(average.status, 200);
  assert.equal((await average.json()).totalSpent, 10);
  const subcategories = load('app/api/nori/category/[id]/subcategory/route.ts');
  assert.equal((await subcategories.POST(request(`category/${b}/subcategory`, 'POST', { name: 'Injected' }), { params: Promise.resolve({ id: b }) })).status, 404);
  const configRoute = load('app/api/nori/daily-average/config/route.ts');
  assert.equal((await configRoute.POST(request('daily-average/config', 'POST', { selectedCategories: [b] }))).status, 400);
  const ownEdit = await load('app/api/nori/transaction/[id]/route.ts').PATCH(request(`transaction/${a}`, 'PATCH', { name: 'Updated', userId: 'user-b', category: a, paymentMethod: a, amount: -10 }), { params: Promise.resolve({ id: a }) });
  assert.equal(ownEdit.status, 200);
  assert.equal((await ownEdit.json()).userId, 'user-a');
  const create = load('app/api/nori/transaction/route.ts');
  const payload = { name: 'Test', category: a, paymentMethod: a, amount: -5, date: new Date().toISOString(), userId: 'user-b' };
  assert.equal((await create.POST(request('transaction', 'POST', { ...payload, paymentMethod: b }))).status, 400);
  const saved = await create.POST(request('transaction', 'POST', payload));
  assert.equal(saved.status, 201);
  assert.equal((await saved.json()).userId, 'user-a', 'Owner must come from the session, not the payload');
  assert.equal(records.Transaction[1].amount, -900);
  const current = load('lib/current-user.ts');
  user = { id: 'imposter', email: 'ntmod001@gmail.com', emailVerified: false };
  assert.equal((await current.requireUser()).status, 401);
  assert.equal(migrationWrites, 0);
  user = { id: 'user-a', email: 'a@example.com', emailVerified: true };
  await current.requireUser();
  assert.equal(migrationWrites, 0);
  user = { id: 'owner', email: 'ntmod001@gmail.com', emailVerified: true };
  await current.requireUser();
  assert.equal(migrationWrites, 6);
  for (const rows of legacyRows.values()) {
    assert.equal(rows[0].userId, 'owner');
    assert.equal(rows[1].userId, 'user-b');
  }
  assert.equal(migrationMarker.userId, 'owner');
  await current.requireUser();
  assert.equal(migrationWrites, 6, 'Legacy claim must be idempotent');
  const setupRecords = { user: [{ _id: 'new-user' }, { _id: 'skip-user' }, { _id: 'user-a' }], categories: [], paymentmethods: [] };
  let setupWrites = 0;
  activeDb = { collection(name) { return {
    findOne: async query => setupRecords[name].find(row => matches(row, query)) ?? null,
    updateOne: async (query, body) => {
      setupWrites++;
      let row = setupRecords[name].find(item => matches(item, query));
      if (!row && body.$setOnInsert) { row = { ...query, ...body.$setOnInsert }; setupRecords[name].push(row); }
      if (row && body.$set) Object.assign(row, body.$set);
    },
  }; } };
  const onboardingState = load('lib/onboarding.ts');
  assert.equal(await onboardingState.needsOnboarding({ id: 'user-a', email: 'a@example.com', emailVerified: true }), false);
  user = { id: 'new-user', email: 'new@example.com', emailVerified: true };
  assert.equal(await onboardingState.needsOnboarding(user), true);
  setupRecords.user[0].onboardingStartedAt = new Date();
  assert.equal(await onboardingState.needsOnboarding(user), true);
  const setupRoute = load('app/api/nori/onboarding/route.ts');
  const setupBody = { language: 'th', categories: ['food'], walletName: 'Cash', initialBalance: 0, userId: 'user-b' };
  assert.equal((await setupRoute.POST(request('onboarding', 'POST', { ...setupBody, categories: [] }))).status, 400);
  assert.equal((await setupRoute.POST(request('onboarding', 'POST', setupBody))).status, 200);
  assert.equal(setupRecords.paymentmethods.length, 1);
  assert.equal(setupRecords.paymentmethods[0].userId, 'new-user');
  assert.equal(setupRecords.paymentmethods[0].initialBalance, 0);
  assert.equal(setupRecords.categories.length, 2);
  assert.equal(await onboardingState.needsOnboarding(user), false);
  const writeCount = setupWrites;
  assert.equal((await setupRoute.POST(request('onboarding', 'POST', setupBody))).status, 200);
  assert.equal(setupWrites, writeCount);
  user = { id: 'skip-user', email: 'skip@example.com', emailVerified: true };
  assert.equal((await setupRoute.POST(request('onboarding', 'POST', { skip: true }))).status, 200);
  assert.equal(await onboardingState.needsOnboarding(user), false);
  assert.equal(setupRecords.paymentmethods.length, 1);
  console.log('Actual API handlers: isolation, foreign edits/deletes, balance, references, and owner injection checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
