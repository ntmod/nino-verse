const KEY = 'nori_sound';
let context;

export function soundEnabled() {
  try { return typeof window !== 'undefined' && window.localStorage.getItem(KEY) === 'on'; }
  catch { return false; }
}

export function subscribeSound(listener) {
  window.addEventListener('nori-sound', listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('nori-sound', listener);
    window.removeEventListener('storage', listener);
  };
}

export function setSoundEnabled(enabled) {
  try {
    window.localStorage.setItem(KEY, enabled ? 'on' : 'off');
    window.dispatchEvent(new Event('nori-sound'));
  } catch { return; }
  if (enabled) playUISound('click');
  else if (context) void context.suspend().catch(() => {});
}

// Call during a user gesture so later save/receipt sounds are unlocked.
export function prepareUISound() {
  if (!soundEnabled()) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    context ??= new Audio();
    if (context.state === 'suspended') void context.resume().catch(() => {});
  } catch { /* Sound must never block an action. */ }
}

export function playUISound(kind = 'click') {
  if (!soundEnabled()) return;
  prepareUISound();
  if (!context || context.state !== 'running') return;
  try {
    const [frequency, endFrequency, duration] = {
      click: [600, 450, 0.055], paper: [180, 90, 0.14],
      save: [500, 900, 0.16], stamp: [110, 55, 0.09],
    }[kind] || [600, 450, 0.055];
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime;
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0.035, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start();
    oscillator.stop(start + duration);
  } catch { /* Audio is optional. */ }
}
