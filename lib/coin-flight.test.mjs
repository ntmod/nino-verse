import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCoinFlightKeyframes } from './coin-flight.mjs';

test('coin starts at the amount and lands at the category on mobile and desktop', () => {
  for (const width of [288, 448]) {
    const container = { left: 40, top: 80, width };
    const origin = { left: 80, top: 160, width: width - 80, height: 60 };
    const destination = { left: 64, top: 260, width: (width - 64) / 2, height: 44 };
    const flight = getCoinFlightKeyframes(origin, destination, container);
    assert.equal(flight.x[0], origin.left + origin.width / 2 - container.left);
    assert.equal(flight.y[0], origin.top + origin.height / 2 - container.top);
    assert.equal(flight.x.at(-1), destination.left + destination.width / 2 - container.left);
    assert.equal(flight.y.at(-1), destination.top + destination.height / 2 - container.top);
    assert(flight.x.every(x => x >= 18 && x <= width - 18));
    assert.equal(flight.x.length, flight.times.length);
    assert.equal(flight.y.length, flight.times.length);
    assert(flight.y[1] < flight.y[0], 'coin arcs upward before landing');
  }
});
