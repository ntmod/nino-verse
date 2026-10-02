const BANGKOK_OFFSET = "+07:00";
const DAY_MS = 86_400_000;

/** @param {number} year @param {number} month */
function lastDay(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** @param {number} year @param {number} month @param {number} day @param {boolean} end */
function bangkokDate(year, month, day, end = false) {
  const normalized = new Date(Date.UTC(year, month, 15));
  const y = normalized.getUTCFullYear();
  const m = normalized.getUTCMonth();
  const d = Math.min(day, lastDay(y, m));
  const date = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return new Date(`${date}T${end ? "23:59:59.999" : "00:00:00.000"}${BANGKOK_OFFSET}`);
}

/**
 * Returns the 30th–29th spending cycle containing `now`, shifted by `offset` cycles.
 * @param {number} [offset]
 * @param {Date} [now]
 */
export function getSpendingCycle(offset = 0, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const value = (type) => Number(parts.find((part) => part.type === type)?.value);
  const year = value("year");
  const month = value("month") - 1;
  const day = value("day");
  const referenceMonth = month + (day < 30 ? 0 : 1) + offset;

  return {
    startDate: bangkokDate(year, referenceMonth - 1, 30),
    endDate: bangkokDate(year, referenceMonth, 29, true),
  };
}

/** @param {{ startDate: Date, endDate: Date }} cycle */
export function cycleDays(cycle) {
  return Math.round((cycle.endDate.getTime() - cycle.startDate.getTime() + 1) / DAY_MS);
}

/** @param {{ startDate: Date, endDate: Date }} cycle @param {Date} [now] */
export function elapsedCycleDays(cycle, now = new Date()) {
  const end = Math.min(now.getTime(), cycle.endDate.getTime());
  return Math.max(1, Math.min(cycleDays(cycle), Math.floor((end - cycle.startDate.getTime()) / DAY_MS) + 1));
}
