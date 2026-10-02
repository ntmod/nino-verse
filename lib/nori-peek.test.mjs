import assert from 'node:assert/strict';
import { claimNoriPeek } from './nori-peek.mjs';

assert.equal(claimNoriPeek(0, 0.3), false);
assert.equal(claimNoriPeek(0, 0.29), true);
assert.equal(claimNoriPeek(0, 0), false); // A second card cannot appear together.
assert.equal(claimNoriPeek(44_999, 0), false);
assert.equal(claimNoriPeek(45_000, 0.9), false); // A missed roll does not extend cooldown.
assert.equal(claimNoriPeek(45_000, 0), true);
console.log('Nori peek verified: 30% chance, shared cooldown, simultaneous claims and missed rolls.');
