import { cycleAt, cycleState, type CycleConfig } from './cycle-config';
import { walletSummaries, type BudgetWallet } from './wallet-budget';

export interface CycleRecord { _id: string; date: string; name: string; amount: number; walletId?: string }
export interface CycleTransfer { _id: string; createdAt: string; fromWalletId: string; toWalletId: string; amountCents: number }
export function cycleImpact(before: CycleConfig, after: CycleConfig, records: CycleRecord[], transfers: CycleTransfer[], wallets: BudgetWallet[]) {
  const beforeKeys = new Map<string, string>(), afterKeys = new Map<string, string>();
  const key = (config: CycleConfig, date: string) => {
    const cache = config === before ? beforeKeys : afterKeys;
    if (!cache.has(date)) cache.set(date, cycleAt(config, new Date(date)).cycleId);
    return cache.get(date)!;
  };
  const moved = records.filter(record => key(before, record.date) !== key(after, record.date));
  const movedTransfers = transfers.filter(transfer => key(before, transfer.createdAt) !== key(after, transfer.createdAt));
  const affected = new Set<string>();
  for (const item of [...moved.map(record => ({ date: record.date })), ...movedTransfers.map(transfer => ({ date: transfer.createdAt }))]) {
    affected.add(key(before, item.date)); affected.add(key(after, item.date));
  }
  const walletChanges = [...affected].flatMap(cycleKey => {
    const rangeFor = (config: CycleConfig) => {
      const range = cycleState(config).cycles.find(cycle => cycle.cycleId === cycleKey);
      if (range) return range.startDate;
      for (const date of [...records.map(item => item.date), ...transfers.map(item => item.createdAt)]) {
        const cycle = cycleAt(config, new Date(date));
        if (cycle.cycleId === cycleKey) return cycle.startDate;
      }
      return null;
    };
    const oldStart = rangeFor(before), newStart = rangeFor(after);
    const summarize = (config: CycleConfig) => walletSummaries(wallets, records.filter(record => key(config, record.date) === cycleKey), transfers.filter(transfer => key(config, transfer.createdAt) === cycleKey));
    const old = summarize(before), next = summarize(after);
    return next.flatMap((wallet, index) => {
      const beforeCents = oldStart ? old[index].remainingCents : null;
      const afterCents = newStart ? wallet.remainingCents : null;
      return beforeCents === afterCents ? [] : [{ cycleKey: newStart ?? oldStart!, walletName: wallet.name, beforeCents, afterCents }];
    });
  });
  return { recordsMoved: moved.length, transfersMoved: movedTransfers.length, walletChanges,
    transfers: movedTransfers.map(transfer => ({ ...transfer, beforeCycle: cycleAt(before, new Date(transfer.createdAt)).startDate, afterCycle: cycleAt(after, new Date(transfer.createdAt)).startDate })) };
}
export type CycleImpact = ReturnType<typeof cycleImpact>;
