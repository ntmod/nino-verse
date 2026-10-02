let lastPeek = -Infinity;

// Shared by every hiding spot: at most one visit in each 45-second window.
export function claimNoriPeek(now = Date.now(), roll = Math.random()) {
  if (now - lastPeek < 45_000 || roll >= 0.3) return false;
  lastPeek = now;
  return true;
}
