import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { getSpendingDays } from './spending-heatmap.mjs';

// Exercise the actual component handlers with a deterministic clock and sample data.
const slots = [];
let cursor = 0;
const timers = new Map();
const cleanup = [];
let timerId = 0;
const react = {
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = value; }]; },
  useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
  useId: () => 'preview',
  useEffect: effect => cleanup.push(effect()),
};
const jsx = (type, props) => ({ type, props });
const compiled = ts.transpileModule(fs.readFileSync('components/nori/SpendingHeatmapCard.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const context = { exports: {}, Intl, Date, Math, setTimeout: fn => { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id), require: name => ({
  react,
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'framer-motion': { motion: { button: 'day' }, useReducedMotion: () => true },
  './NoriPeek': { default: () => null },
  'lucide-react': { CalendarDays: 'icon' },
  '@/lib/language-context': { useLanguage: () => ({ language: 'en' }) },
  '@/lib/spending-heatmap.mjs': { getSpendingDays },
})[name] };
vm.runInNewContext(compiled, context);
const props = { transactions: [], cycle: { startDate: new Date('2026-09-30T00:00:00+07:00'), endDate: new Date('2026-10-29T23:59:59.999+07:00') }, isLoading: false, ready: true, onEdit() {} };
function day() {
  cursor = 0;
  const nodes = [];
  function visit(node) { if (Array.isArray(node)) return node.forEach(visit); if (!node?.props) return; nodes.push(node); visit(node.props.children); }
  visit(context.exports.default(props));
  return nodes.find(node => node.type === 'day').props;
}
const pointer = { pointerType: 'touch', clientX: 20, clientY: 20 };
function hold() { day().onPointerDown(pointer); for (const fn of timers.values()) fn(); timers.clear(); }
hold();
assert.equal(day()['aria-describedby'], 'preview');
day().onPointerUp(pointer);
day().onClick();
assert.equal(day()['aria-pressed'], false); // Long press never becomes an ordinary tap.
assert.equal(day()['aria-describedby'], undefined);
day().onPointerDown(pointer);
day().onPointerUp(pointer);
day().onClick();
assert.equal(day()['aria-pressed'], true); // Short tap still opens details.
day().onPointerDown(pointer);
day().onPointerMove({ ...pointer, clientY: 40 });
assert.equal(timers.size, 0); // Scrolling cancels the pending preview.
hold();
day().onPointerCancel();
assert.equal(day()['aria-describedby'], undefined);
day().onPointerDown(pointer);
for (const stop of cleanup) stop?.();
assert.equal(timers.size, 0); // No timer survives unmount.
console.log('Heatmap interaction verified: hold, release, tap, scroll, cancellation and timer cleanup.');
