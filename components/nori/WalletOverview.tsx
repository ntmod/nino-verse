'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { walletService } from '@/lib/services/walletService';
import { useLanguage } from '@/lib/language-context';
import type { WalletSummary } from '@/lib/wallet-budget';

// Historical budgets use today's configured base; spending and transfers follow the selected dates.
export default function WalletOverview({ startDate, endDate, refresh = 0, compact = false }: { startDate: string; endDate: string; refresh?: number; compact?: boolean }) {
  const { language } = useLanguage();
  const th = language === 'th';
  const [wallets, setWallets] = useState<WalletSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    walletService.getAll(startDate, endDate).then(data => {
      if (active) { setWallets(data.wallets.filter(wallet => !wallet.archived || wallet.spentCents > 0 || wallet.allocatedCents !== wallet.budgetCents)); setError(false); }
    }).catch(() => { if (active) { setWallets(null); setError(true); } });
    return () => { active = false; };
  }, [startDate, endDate, refresh, retry]);
  if (error) return <p role="alert" className="text-xs text-destructive">{th ? 'โหลดสรุปกระเป๋าไม่ได้' : 'Could not load budget summary.'} <button type="button" className="min-h-11 px-2 underline" onClick={() => setRetry(value => value + 1)}>{th ? 'ลองอีกครั้ง' : 'Retry'}</button></p>;
  if (!wallets?.length) return null;
  const money = (cents: number) => (cents / 100).toLocaleString(th ? 'th-TH' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <section data-paper-surface="" className={compact ? 'mt-5 border-t border-dashed border-border pt-4 text-xs' : 'mb-6 border border-border bg-card p-5 text-foreground shadow-[2px_3px_0_var(--paper-edge)]'}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{th ? 'กระเป๋างบในรอบนี้' : 'Budget wallets this cycle'}</h2>{!compact && <Link href="/wallets" className="inline-flex min-h-11 items-center text-xs underline">{th ? 'จัดการกระเป๋า' : 'Manage wallets'}</Link>}</div>
    <ul className={compact ? 'mt-3 space-y-4' : 'mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'}>{wallets.map(wallet => <li key={wallet._id}>
      <p className="break-words text-sm font-bold">{wallet.name}{wallet.archived ? (th ? ' · ในคลัง' : ' · Archived') : ''}</p>
      <p className={`mt-2 font-mono ${wallet.remainingCents < 0 ? 'text-destructive' : 'text-primary'}`}>{th ? 'เหลือ' : 'Remaining'} {money(wallet.remainingCents)} ฿</p>
      <progress aria-label={`${th ? 'ใช้ไป' : 'Spent'} · ${wallet.name}`} value={Math.max(0, Math.min(wallet.spentCents, wallet.allocatedCents))} max={Math.max(1, wallet.allocatedCents)} className="mt-2 h-2 w-full accent-primary"/>
      <p className="mt-1 text-[11px] leading-6 text-muted-foreground">{th ? 'ใช้ไป' : 'Spent'} {money(wallet.spentCents)} / {money(wallet.allocatedCents)} ฿</p>
    </li>)}</ul>
    <p className="mt-4 text-[10px] leading-5 text-muted-foreground">{th ? 'งบอิงค่าตั้งต้นปัจจุบัน รวมการย้ายงบในรอบที่เลือก รายจ่ายที่ไม่เลือกกระเป๋ายังนับในยอดรวม' : 'Uses current base budgets plus transfers in this period. Unassigned expenses still count in total spending.'}</p>
  </section>;
}
