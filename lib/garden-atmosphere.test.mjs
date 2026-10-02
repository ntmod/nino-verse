import assert from 'node:assert/strict';
import { getGardenAtmosphere } from './garden-atmosphere.mjs';
for (const [hour, expected] of [[0, 'night'], [5, 'night'], [6, 'day'], [16, 'day'], [17, 'evening'], [18, 'evening'], [19, 'night'], [23, 'night']]) {
  assert.equal(getGardenAtmosphere(hour), expected);
}
console.log('Garden atmosphere boundaries passed');
