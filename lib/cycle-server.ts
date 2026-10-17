import 'server-only';
import type { ClientSession } from 'mongoose';
import CycleSettings from '@/models/CycleSettings';
import { cycleAt, type CycleConfig } from './cycle-config';

export async function loadCycleConfig(userId: string, session: ClientSession | null = null): Promise<CycleConfig> {
  const settings = await CycleSettings.findOne({ userId }).session(session).lean();
  return settings ? { mode: settings.mode, starts: settings.starts.map((date: Date) => date.toISOString()), ids: settings.ids, fixedDay: settings.fixedDay ?? 30, automaticFrom: settings.automaticFrom?.toISOString(), revision: settings.revision } : { mode: 'fixed', starts: [], revision: 0 };
}
export async function userCycle(userId: string, session: ClientSession | null = null) {
  const range = cycleAt(await loadCycleConfig(userId, session));
  return { startDate: new Date(range.startDate), endDate: new Date(range.endDate), isOpen: range.isOpen };
}
