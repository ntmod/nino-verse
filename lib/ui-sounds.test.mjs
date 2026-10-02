import assert from 'node:assert/strict';
import { soundEnabled, setSoundEnabled, playUISound } from './ui-sounds.mjs';

assert.equal(soundEnabled(), false); // SSR is silent.
playUISound();
let starts = 0;
let contexts = 0;
let disconnected = 0;
const values = new Map();
const parameter = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
class Audio {
  state = 'running'; currentTime = 0; destination = {};
  constructor() { contexts++; }
  createOscillator() { return { frequency: parameter, connect() {}, disconnect() { disconnected++; }, start() { starts++; }, stop() { this.onended(); } }; }
  createGain() { return { gain: parameter, connect() {}, disconnect() { disconnected++; } }; }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  resume() { this.state = 'running'; return Promise.resolve(); }
}
globalThis.window = { localStorage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) }, dispatchEvent() {}, AudioContext: Audio };
playUISound('save');
assert.equal(starts, 0); // Default muted.
setSoundEnabled(true);
assert.equal(soundEnabled(), true);
for (const kind of ['click', 'paper', 'save', 'stamp']) playUISound(kind);
assert.equal(starts, 5);
assert.equal(contexts, 1); // Reuse one context; disconnect finished nodes.
assert.equal(disconnected, 10);
setSoundEnabled(false);
playUISound('stamp');
assert.equal(starts, 5); // Pending receipt effects also respect mute.
setSoundEnabled(true);
assert.equal(starts, 6);
window.localStorage.getItem = () => { throw new Error('Storage blocked'); };
assert.equal(soundEnabled(), false);
playUISound();
console.log('UI sound verified: SSR, default mute, persisted switch, context reuse, cleanup and blocked storage.');
