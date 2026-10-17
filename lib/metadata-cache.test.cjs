const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function harness() {
  const modules = {};
  const calls = [];
  let respond = async () => ({ ok: true, json: async () => [] });
  function load(file) {
    if (modules[file]) return modules[file];
    const exports = modules[file] = {};
    const source = ts.transpileModule(fs.readFileSync(`${__dirname}/${file}.ts`, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    vm.runInNewContext(source, { exports, window: {}, Map, fetch: (...args) => { calls.push(args); return respond(...args); },
      require: name => load(name.replace('@/lib/', '')) });
    return exports;
  }
  return { cache: load('metadata-cache'), category: load('services/categoryService').categoryService,
    wallet: load('services/walletService').walletService,
    payment: load('services/paymentService').paymentService, transaction: load('services/transactionService').transactionService, calls, respond: fn => { respond = fn; } };
}
test('Home, modal, and dashboard share pending and completed account metadata', async () => {
  const h = harness();
  let finish;
  h.respond(() => new Promise(resolve => { finish = resolve; }));
  const home = h.category.getAll('alice');
  const modal = h.category.getAll('alice');
  assert.equal(h.calls.length, 1);
  finish({ok:true,json:async()=>[{_id:'food'}]});
  assert.deepEqual(await home, await modal);
  await h.category.getAll('alice');
  assert.equal(h.calls.length, 1);
  h.respond(async () => ({ok:true,json:async()=>[]}));
  await h.category.getAll('bob');
  await h.payment.getAll('alice');
  assert.equal(h.calls.length, 3, 'Accounts and metadata resources must stay separate');
});
test('failed metadata can retry, and settings mutations invalidate shared reads', async () => {
  const h = harness();
  h.respond(async () => ({ok:false}));
  await assert.rejects(h.category.getAll('alice'));
  h.respond(async () => ({ok:true,json:async()=>[]}));
  await h.category.getAll('alice');
  await h.payment.getAll('alice');
  await h.category.update('food', {name:'Meals'});
  await h.category.getAll('alice');
  await h.payment.getAll('alice');
  assert.equal(h.calls.length, 6);
  await h.payment.delete('cash');
  await h.payment.getAll('alice');
  assert.equal(h.calls.length, 8);
});
test('an invalidated in-flight failure cannot evict the replacement request', async () => {
  const h = harness();
  let rejectOld;
  h.respond(() => new Promise((_,reject) => { rejectOld = reject; }));
  const old = h.category.getAll('alice');
  h.cache.clearMetadataCache();
  h.respond(async () => ({ok:true,json:async()=>[{_id:'new'}]}));
  await h.category.getAll('alice');
  rejectOld(new Error('old network failure'));
  await assert.rejects(old);
  await h.category.getAll('alice');
  assert.equal(h.calls.length, 2);
});
test('all category and method mutations invalidate cached metadata', async () => {
  for (const [resource, method, args] of [
    ['category','create',[{}]], ['category','update',['id',{}]], ['category','delete',['id']],
    ['category','updateOrder',[[]]], ['payment','create',[{}]], ['payment','update',['id',{}]], ['payment','delete',['id']],
  ]) {
    const h = harness();
    await h.category.getAll('alice');
    await h[resource][method](...args);
    await h.category.getAll('alice');
    assert.equal(h.calls.length, 3, `${resource}.${method}`);
  }
});

test('transaction writes retain cached payment labels and categories', async () => {
  for (const [method,args] of [['create',[{}]],['update',['id',{}]],['delete',['id']]]) {
    const h=harness();
    await h.category.getAll('alice'); await h.payment.getAll('alice');
    await h.transaction[method](...args);
    await h.category.getAll('alice'); await h.payment.getAll('alice');
    assert.equal(h.calls.length,3,method);
    assert.equal(h.calls.filter(([url])=>url==='/api/nori/category').length,1);
  }
});

 test('wallet choices share account-scoped cached reads and archive invalidates them without reloading after spending',async()=>{
 const h=harness();
 await Promise.all([h.wallet.getChoices('alice'),h.wallet.getChoices('alice')]);assert.equal(h.calls.length,1);
 await h.wallet.getChoices('bob');assert.equal(h.calls.length,2);
 await h.transaction.create({});await h.wallet.getChoices('alice');assert.equal(h.calls.length,3);
 await h.wallet.archive('meals',true);await h.wallet.getChoices('alice');assert.equal(h.calls.length,5);
 assert.equal(h.calls[0][0],'/api/nori/wallet?choices=1');
 });
