'use client';
import { useRef, useState } from 'react';
import { transactionService } from '@/lib/services/transactionService';
import { useLanguage } from '@/lib/language-context';
import type { CycleState } from '@/lib/cycle-config';
import type { QuickCategory } from '@/lib/quick-note';
import type { Transaction } from '@/lib/types';
import CycleReceipt from './CycleReceipt';

export default function LastCycleSummary({ state, categories }: { state: CycleState | null; categories: QuickCategory[] }) {
  const { language } = useLanguage();
  const th = language === 'th';
  const [receipt, setReceipt] = useState<{ transactions: Transaction[]; previousTotal: number; cycle: { startDate: Date; endDate: Date } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const lock = useRef(false);
  const previous = state && state.cycles[state.currentIndex - 1];
  if (!previous || (state?.config.mode === 'manual' && state.currentIndex <= 1)) return null;
  const open = async () => {
    if (lock.current) return;
    lock.current = true; setLoading(true); setError(false);
    try {
      const before = state?.cycles[(state?.currentIndex ?? 0) - 2];
      const [transactions, older] = await Promise.all([
        transactionService.getAll(previous.startDate, previous.endDate),
        before ? transactionService.getAll(before.startDate, before.endDate) : Promise.resolve([]),
      ]);
      setReceipt({ cycle: { startDate: new Date(previous.startDate), endDate: new Date(previous.endDate) }, transactions, previousTotal: older.filter(tx => tx.amount < 0).reduce((sum, tx) => sum - Math.round(tx.amount * 100), 0) / 100 });
    } catch { setError(true); }
    finally { lock.current = false; setLoading(false); }
  };
  return <div className="mb-4 border border-dashed border-[#d9cebb] bg-[#fffdf7] px-4 py-2 text-xs">
    <button type="button" disabled={loading} onClick={() => void open()} className="min-h-11 text-left font-bold text-[#647958]">{loading ? (th ? 'กำลังสรุปรอบ…' : 'Preparing summary…') : (th ? 'รอบที่แล้วจบแล้ว · เปิดใบสรุปรอบ' : 'Last cycle is complete · View summary')}</button>
    {error && <p role="alert" className="pb-2 text-[#b0523b]">{th ? 'โหลดไม่ได้ กดอีกครั้งเพื่อลองใหม่' : 'Could not load. Press again to retry.'}</p>}
    {receipt && <CycleReceipt {...receipt} transactions={receipt.transactions.map(tx => ({ ...tx, category: categories.find(category => category._id === tx.category || category.name === tx.category)?.name ?? tx.category }))} onClose={() => setReceipt(null)} />}
  </div>;
}
