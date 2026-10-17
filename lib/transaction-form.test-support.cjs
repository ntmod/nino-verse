const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
function compile(file, stubs) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, { exports, crypto: require('node:crypto').webcrypto, require: name => stubs[name] ?? require(name), console, Intl, Event, fetch: stubs.testFetch ?? (() => { throw Error('Unexpected fetch'); }), window: stubs.testWindow ?? {dispatchEvent() {}}, localStorage: stubs.testStorage ?? { getItem: () => null }, requestAnimationFrame: fn => fn() });
  return exports;
}
function find(node, predicate) {
  if (!node || typeof node !== 'object') return;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, predicate); if (result) return result; }
}
function harness(file, overrides = {}) {
  const states = [], refs = []; let index = 0, refIndex = 0, effects = [];
  const stubs = {
    react: { ...React,
      useState(initial) { const i = index++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
      useRef(initial) { return refs[refIndex++] ??= { current: initial }; },
      useEffect(effect) { effects.push(effect); }, useMemo: fn => fn(), useCallback: fn => fn, useId: () => 'form-1',
    },
    '@/lib/use-spending-cycles': { useSpendingCycles: () => ({state:{config:{mode:'fixed',starts:[],revision:0},cycles:[{startDate:'2026-09-29T17:00:00.000Z',endDate:'2026-10-29T16:59:59.999Z',isOpen:false}],currentIndex:0},setState(){},error:false,retry(){}}) },
    '@/components/nori/LastCycleSummary': {default:'LastCycleSummary',__esModule:true},
    './CycleReceipt': {default:'CycleReceipt',__esModule:true},
    '@/lib/money-cents.mjs': require('./money-cents.mjs'),
    '@/components/CycleEditor': {default:'CycleEditor',__esModule:true},
    './home.module.css': {default: {fixedCosts:'fixedCosts'},__esModule:true},
    'next/link': { default: 'a', __esModule: true }, 'next/image': { default: 'img', __esModule: true },
    'lucide-react': new Proxy({}, { get: (_, name) => name }),
    'framer-motion': { motion: new Proxy({}, { get: (_, name) => name }), AnimatePresence: 'presence', useAnimate: () => [{ current: null }, async () => {}], useReducedMotion: () => true },
    '@/lib/auth-client': { authClient: { useSession: () => ({ data: { user: { id: 'alice' } } }) } },
    '@/lib/language-context': { useLanguage: () => ({ language: 'en', t: key => key }) },
    '@/lib/services/categoryService': { categoryService: { getAll: async () => categories } },
    '@/lib/services/paymentService': { paymentService: { getAll: async () => methods } },
    '@/lib/services/dashboardService': { fixedCostService: { getAll: async () => [] } },
    '@/lib/services/transactionService': { transactionService: { getAll: async () => [], create: async data => ({ ...data, _id: 'new' }), update: async (id, data) => ({ ...data, _id: id }) } },
    '@/lib/ui-sounds.mjs': { playUISound() {}, prepareUISound() {} }, '@/lib/coin-flight.mjs': {},
    '@/lib/metadata-cache': { clearMetadataCache() {} },
    '@/components/TransactionForm': { default: 'TransactionForm', __esModule: true },
    './NoriPeek': {default:'NoriPeek',__esModule:true},
    './WalletPicker': {default:'WalletPicker',__esModule:true},
    './TransactionForm': { default: 'TransactionForm', __esModule: true },
    '@/components/TransactionReceipt': { default: 'receipt', __esModule: true },
    ...overrides,
  };
  stubs['@/lib/spending-cycle.js'] = { getSpendingCycle: () => ({ startDate: new Date('2026-09-29T17:00:00Z'), endDate: new Date('2026-10-29T16:59:59.999Z') }) };
  stubs['@/lib/fixed-cost-status'] = compile(`${__dirname}/fixed-cost-status.ts`, stubs);
  stubs['./spending-cycle.js'] = stubs['@/lib/spending-cycle.js'];
  stubs['@/lib/cycle-config'] = compile(`${__dirname}/cycle-config.ts`, stubs);
  stubs['@/lib/wallet-budget'] = compile(`${__dirname}/wallet-budget.ts`, stubs);
  stubs['@/lib/amount-calculation'] = compile(`${__dirname}/amount-calculation.ts`, stubs);
  stubs['@/lib/quick-note'] = { ...compile(`${__dirname}/quick-note.ts`, stubs), localRecordDate: () => '2026-10-17' };
  const Component = compile(`${__dirname}/${file}`, stubs).default;
  return { stubs, states, render(props) { index = 0; refIndex = 0; effects = []; return Component(props); }, runEffects() { return effects.map(effect => effect()); } };
}
const categories = [{ _id: 'food', name: 'Food', type: 'expense', subcategories: [{ _id: 'lunch', name: 'Lunch' }] }, { _id: 'salary', name: 'Salary', type: 'income' }];
const methods = [{ _id: 'cash', name: 'Cash' }];
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const settle = () => new Promise(resolve => setImmediate(resolve));
module.exports = { harness, find, categories, methods, deferred, settle };
