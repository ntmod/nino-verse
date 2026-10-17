import 'server-only';
import type { ClientSession } from 'mongoose';
import Wallet from '@/models/Wallet';
import WalletTransfer from '@/models/WalletTransfer';
import Transaction from '@/models/Transaction';
import { userCycle } from './cycle-server';
import { walletSummaries, type BudgetWallet, type BudgetTransfer, type WalletSnapshot } from './wallet-budget';

export async function walletSnapshot(owner: { id: string; scope: object }, session: ClientSession | null = null, range?: { startDate: Date; endDate: Date }): Promise<WalletSnapshot> {
  const cycle = range ?? await userCycle(owner.id, session);
  const cycleKey = cycle.startDate.toISOString();
  // Session operations run sequentially: MongoDB transactions do not support parallel reads.
  const data = await Wallet.find({ userId: owner.id }).sort({ createdAt: 1 }).session(session).lean();
  const wallets: BudgetWallet[] = data.map(wallet => ({ _id: String(wallet._id), name: wallet.name, budgetCents: wallet.budgetCents, archived: wallet.archived ?? false }));
  if (!wallets.length) return { isOpen: 'isOpen' in cycle ? cycle.isOpen as boolean : false, cycleKey, cycleEnd: cycle.endDate.toISOString(), wallets: [], transfers: [] };
  const movements = await WalletTransfer.find({ userId: owner.id, createdAt: { $gte: cycle.startDate, $lte: cycle.endDate } }).sort({ createdAt: -1 }).session(session).lean();
  const transfers: BudgetTransfer[] = movements.map(item => ({ _id: String(item._id), fromWalletId: item.fromWalletId, toWalletId: item.toWalletId, amountCents: item.amountCents, createdAt: item.createdAt.toISOString() }));
  const records = await Transaction.find({ ...owner.scope, walletId: { $in: wallets.map(wallet => wallet._id) }, date: { $gte: cycle.startDate, $lte: cycle.endDate }, amount: { $lt: 0 } }).session(session).lean();
  return { isOpen: "isOpen" in cycle ? cycle.isOpen as boolean : false, cycleKey, cycleEnd: cycle.endDate.toISOString(), wallets: walletSummaries(wallets, records, transfers), transfers };
}
