import { getSpendingCycle } from './spending-cycle.js';

export interface CycleConfig { mode: 'fixed' | 'manual'; starts: string[]; ids?: string[]; fixedDay?: number; automaticFrom?: string; revision: number }
export interface CycleRange { cycleId: string; startDate: string; endDate: string; isOpen: boolean }
export interface CycleState { config: CycleConfig; cycles: CycleRange[]; currentIndex: number }
export interface CycleChange { action: 'activate' | 'start' | 'edit' | 'configure'; date: string; boundary?: string; mode?: 'fixed' | 'manual'; fixedDay?: number }
const DAY = 86400000;

export function cycleDate(value: string) {
  if (value < '1900-01-01' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) throw new Error('Invalid date');
  return new Date(`${value}T00:00:00+07:00`).toISOString();
}
export function bangkokDay(now = new Date()) {
  return new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 10);
}
function monthStart(date: Date, day: number, offset = 0) {
  const key = bangkokDay(date);
  const month = new Date(Date.UTC(Number(key.slice(0,4)), Number(key.slice(5,7)) - 1 + offset, 1));
  const year = month.getUTCFullYear(), index = month.getUTCMonth();
  const last = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
  return cycleDate(`${year}-${String(index + 1).padStart(2,'0')}-${String(Math.min(day,last)).padStart(2,'0')}`);
}
function nextAutomatic(config: CycleConfig, date: Date) {
  const limit = Math.max(date.getTime(), Date.parse(config.automaticFrom!));
  const reference = new Date(limit);
  const candidate = monthStart(reference, config.fixedDay ?? 30);
  return Date.parse(candidate) > limit ? candidate : monthStart(reference, config.fixedDay ?? 30, 1);
}
function storedRange(config: CycleConfig, index: number, end: string, isOpen: boolean): CycleRange {
  return { cycleId: config.ids?.[index] ?? config.starts[index], startDate: config.starts[index], endDate: end, isOpen };
}
export function cycleAt(config: CycleConfig, date = new Date()): CycleRange {
  if (config.mode === 'fixed' && !config.automaticFrom) {
    const cycle = getSpendingCycle(0, date);
    return { cycleId: cycle.startDate.toISOString(), startDate: cycle.startDate.toISOString(), endDate: cycle.endDate.toISOString(), isOpen: false };
  }
  const time = date.getTime();
  const index = config.starts.findLastIndex(start => Date.parse(start) <= time);
  if (index < 0) {
    const cycle = getSpendingCycle(0, date);
    return { cycleId: cycle.startDate.toISOString(), startDate: cycle.startDate.toISOString(), endDate: new Date(Math.min(cycle.endDate.getTime(), Date.parse(config.starts[0]) - 1)).toISOString(), isOpen: false };
  }
  const next = config.starts[index + 1];
  if (next) return storedRange(config, index, new Date(Date.parse(next) - 1).toISOString(), false);
  if (config.mode === 'fixed') {
    let start = monthStart(date, config.fixedDay ?? 30);
    if (Date.parse(start) > time) start = monthStart(date, config.fixedDay ?? 30, -1);
    const end = new Date(Date.parse(nextAutomatic(config, date)) - 1).toISOString();
    return start > config.automaticFrom! ? { cycleId: `fixed:${config.automaticFrom}:${start}`, startDate: start, endDate: end, isOpen: false } : storedRange(config, index, end, false);
  }
  return storedRange(config, index, new Date(Date.parse(cycleDate(bangkokDay(date))) + DAY - 1).toISOString(), true);
}
export function cycleState(config: CycleConfig, now = new Date()): CycleState {
  if (config.mode === 'fixed' && !config.automaticFrom) {
    const cycles = Array.from({length: 25}, (_, index) => {
      const cycle = getSpendingCycle(index - 24, now);
      return { cycleId: cycle.startDate.toISOString(), startDate: cycle.startDate.toISOString(), endDate: cycle.endDate.toISOString(), isOpen: false };
    });
    return { config, cycles, currentIndex: cycles.length - 1 };
  }
  const starts = [...config.starts];
  if (config.mode === 'fixed' && config.automaticFrom) {
    let next = nextAutomatic(config, new Date(config.automaticFrom));
    while (Date.parse(next) <= now.getTime()) {
      starts.push(next); next = nextAutomatic(config, new Date(next));
    }
  }
  const cycles = starts.map(start => cycleAt(config, new Date(start === starts[starts.length - 1] ? Math.max(Date.parse(start), now.getTime()) : Date.parse(start))));
  return { config, cycles, currentIndex: cycles.length - 1 };
}
export function proposeCycleChange(config: CycleConfig, change: CycleChange, earliest: Date, now = new Date()): CycleConfig {
  if (change.action === 'configure') {
    if (!['fixed','manual'].includes(change.mode ?? '') || (change.mode === 'fixed' && (!Number.isInteger(change.fixedDay) || change.fixedDay! < 1 || change.fixedDay! > 31))) throw new Error('Choose a day from 1 to 31');
    if (change.mode === config.mode && (change.mode === 'manual' || change.fixedDay === (config.fixedDay ?? 30))) return { ...config, revision: config.revision + 1 };
    const history = config.mode === 'fixed' && !config.automaticFrom
      ? cycleState(proposeCycleChange(config, {action:'activate',date:bangkokDay(new Date(cycleAt(config, now).startDate))}, earliest, now), now)
      : cycleState(config, now);
    return { mode: change.mode!, starts: history.cycles.map(cycle => cycle.startDate), ids: history.cycles.map(cycle => cycle.cycleId),
      fixedDay: change.mode === 'fixed' ? change.fixedDay : (config.fixedDay ?? 30),
      ...(change.mode === 'fixed' ? {automaticFrom: cycleDate(bangkokDay(now))} : {}), revision: config.revision + 1 };
  }
  const date = cycleDate(change.date);
  if (date > cycleDate(bangkokDay(now))) throw new Error('Start date cannot be in the future');
  let starts = [...config.starts];
  let ids = config.ids?.length === starts.length ? [...config.ids] : [...starts];
  if (change.action === 'activate') {
    if (config.mode !== 'fixed' || config.automaticFrom) throw new Error('Use cycle settings to change modes');
    const anchor = getSpendingCycle(-1, new Date(Math.min(earliest.getTime(), Date.parse(date))));
    let current = anchor;
    starts = []; ids = [];
    let previousEnd = -Infinity;
    while (current.startDate.toISOString() < date) {
      // Short February boundaries may overlap in the legacy fixed calendar.
      const start = new Date(Math.max(current.startDate.getTime(), previousEnd + 1)).toISOString();
      if (start >= date) break;
      starts.push(start); ids.push(current.startDate.toISOString());
      previousEnd = current.endDate.getTime();
      current = getSpendingCycle(1, new Date(current.startDate.getTime() + 15 * DAY));
    }
    starts.push(date); ids.push(date);
  } else {
    if (config.mode !== 'manual') throw new Error('Enable manual cycles first');
    if (change.action === 'start') {
      if (date <= starts[starts.length - 1]) throw new Error('New cycle must start after the current cycle');
      starts.push(date);
      ids.push(`manual:${config.revision + 1}:${date}`);
    } else if (change.action === 'edit') {
      const index = starts.indexOf(change.boundary ?? '');
      if (index < 1) throw new Error('This boundary cannot be edited');
      if (date <= starts[index - 1] || (starts[index + 1] && date >= starts[index + 1])) throw new Error('Cycles must not overlap or have zero days');
      starts[index] = date;
    } else throw new Error('Invalid action');
  }
  return { mode: 'manual', starts, ids, revision: config.revision + 1 };
}


export function initialCycleConfig(mode: 'fixed' | 'manual', fixedDay: number, startDate?: string, now = new Date()): CycleConfig {
  if (!['fixed','manual'].includes(mode) || (mode === 'fixed' && (!Number.isInteger(fixedDay) || fixedDay < 1 || fixedDay > 31))) throw new Error('Invalid cycle');
  let start: string, previous: string;
  if (mode === 'fixed') {
    start = monthStart(now, fixedDay);
    if (Date.parse(start) > now.getTime()) start = monthStart(now, fixedDay, -1);
    previous = monthStart(new Date(start), fixedDay, -1);
  } else {
    start = cycleDate(startDate ?? bangkokDay(now));
    if (start > cycleDate(bangkokDay(now))) throw new Error('Start date cannot be in the future');
    previous = getSpendingCycle(-1, new Date(start)).startDate.toISOString();
  }
  return { mode, starts: [previous,start], ids: [previous,start], fixedDay: mode === 'fixed' ? fixedDay : 30,
    ...(mode === 'fixed' ? { automaticFrom: start } : {}), revision: 1 };
}
