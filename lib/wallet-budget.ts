export interface BudgetWallet {
  _id: string;
  name: string;
  archived?: boolean;
  budgetCents: number;
}
export interface BudgetTransfer {
  _id?: string;
  fromWalletId: string;
  toWalletId: string;
  amountCents: number;
  createdAt?: string;
}
export interface WalletSummary extends BudgetWallet {
  allocatedCents: number;
  spentCents: number;
  remainingCents: number;
}
export interface WalletSnapshot {
  cycleKey: string;
  cycleEnd: string;
  isOpen?: boolean;
  wallets: WalletSummary[];
  transfers: BudgetTransfer[];
}

export { moneyCents } from './money-cents.mjs';

export function walletSummaries(wallets: BudgetWallet[], records: { walletId?: string; amount: number }[], transfers: BudgetTransfer[]): WalletSummary[] {
  return wallets.map(wallet => {
    const allocatedCents = transfers.reduce((sum, transfer) => sum + (transfer.toWalletId === wallet._id ? transfer.amountCents : 0) - (transfer.fromWalletId === wallet._id ? transfer.amountCents : 0), wallet.budgetCents);
    const spentCents = records.reduce((sum, record) => sum + (record.walletId === wallet._id && record.amount < 0 ? Math.round(-record.amount * 100) : 0), 0);
    if (![allocatedCents, spentCents, allocatedCents - spentCents].every(Number.isSafeInteger)) throw new Error('Amount exceeds supported range');
    return { ...wallet, allocatedCents, spentCents, remainingCents: allocatedCents - spentCents };
  });
}
