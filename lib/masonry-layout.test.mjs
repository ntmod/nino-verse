import assert from 'node:assert/strict';
import { layoutMasonry } from './masonry-layout.mjs';

const result = layoutMasonry([150, 400, 300, 160, 200], 2);
assert.deepEqual(result.positions, [
  { column: 0, top: 0 }, { column: 1, top: 0 },
  { column: 0, top: 174 }, { column: 1, top: 424 },
  { column: 0, top: 498 },
]);
assert.equal(result.height, 698);
assert.deepEqual(layoutMasonry([100, 200], 1), {
  positions: [{ column: 0, top: 0 }, { column: 0, top: 124 }], height: 324,
});
assert.deepEqual(layoutMasonry([], 2), { positions: [], height: 0 });
console.log('Masonry: shortest column, mobile order, and empty layout passed.');
