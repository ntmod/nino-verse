import assert from 'node:assert/strict';
import { nextGardenVisit, GARDEN_SPOTS } from './nori-garden.mjs';
let visit = null;
for (let index = 0; index < 100; index++) {
  const next = nextGardenVisit(visit, () => index % 2 ? 0.999 : 0);
  assert.ok(next.loops === 2 || next.loops === 3);
  assert.ok(next.duration > 0);
  assert.ok(GARDEN_SPOTS[next.spot]);
  assert.notEqual(next.asset, visit?.asset);
  assert.notEqual(next.spot, visit?.spot);
  assert.equal(next.sequence, (visit?.sequence ?? 0) + 1);
  visit = next;
}
console.log('Nori garden verified: 2–3 loops, valid positions and no consecutive repeated asset or spot.');
