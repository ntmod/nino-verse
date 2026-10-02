import assert from "node:assert/strict";
import test from "node:test";
import { cycleDays, elapsedCycleDays, getSpendingCycle } from "./spending-cycle.js";

test("uses Bangkok 30th–29th boundaries", () => {
  const cycle = getSpendingCycle(0, new Date("2026-09-21T12:00:00Z"));
  assert.equal(cycle.startDate.toISOString(), "2026-08-29T17:00:00.000Z");
  assert.equal(cycle.endDate.toISOString(), "2026-09-29T16:59:59.999Z");
  assert.equal(cycleDays(cycle), 31);
  assert.equal(elapsedCycleDays(cycle, new Date("2026-09-21T12:00:00Z")), 23);
});

test("shortens February boundaries safely", () => {
  const cycle = getSpendingCycle(0, new Date("2026-02-28T12:00:00Z"));
  assert.equal(cycle.startDate.toISOString(), "2026-01-29T17:00:00.000Z");
  assert.equal(cycle.endDate.toISOString(), "2026-02-28T16:59:59.999Z");
});
