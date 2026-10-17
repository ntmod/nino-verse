'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import Image from 'next/image';
import { Dialog } from 'radix-ui';
import { ArrowRight, ChevronDown, Search, X } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { categoryService } from '@/lib/services/categoryService';
import { paymentService } from '@/lib/services/paymentService';
import { fixedCostService } from '@/lib/services/dashboardService';
import { transactionService } from '@/lib/services/transactionService';
import { localRecordDate, type QuickCategory, type QuickPayment } from '@/lib/quick-note';
import LastCycleSummary from '@/components/nori/LastCycleSummary';
import TransactionForm from '@/components/TransactionForm';
import TransactionReceipt, { type ReceiptData } from '@/components/TransactionReceipt';
import { useSpendingCycles } from '@/lib/use-spending-cycles';
import { getSpendingCycle } from '@/lib/spending-cycle.js';
import { isFixedCostPaid } from '@/lib/fixed-cost-status';
import type { Transaction } from '@/lib/types';
import styles from './home.module.css';

interface FixedCostShortcut {
  _id: string;
  name: string;
  amount: number;
  category: string;
  paymentMethod: string;
  walletId?: string;
}

const paper = 'border border-[#ddd4c4] bg-[#fffdf7] shadow-[2px_3px_0_#e9e1d2]';

export default function HomePage() {
  const { data: account } = authClient.useSession();
  const userId = account?.user.id;
  const { language } = useLanguage();
  const th = language === 'th';
  const [categories, setCategories] = useState<QuickCategory[]>([]);
  const [methods, setMethods] = useState<QuickPayment[]>([]);
  const [historyRetry, setHistoryRetry] = useState(0);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const [fixedCosts, setFixedCosts] = useState<FixedCostShortcut[]>([]);
  const [fixedLoading, setFixedLoading] = useState(true);
  const [fixedError, setFixedError] = useState(false);
  const [fixedRetry, setFixedRetry] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fixedPage, setFixedPage] = useState(0);
  const [fixedSearch, setFixedSearch] = useState('');
  const pickedFromPanel = useRef(false);
  const [prefill, setPrefill] = useState<{ version: number; transaction?: Partial<Transaction> }>({ version: 0 });
  const [formSaving, setFormSaving] = useState(false);
  const savingRef = useRef(false);
  const formRef = useRef<HTMLDivElement>(null);
  const fixedDetailsRef = useRef<HTMLDetailsElement>(null);
  const today = localRecordDate();
  const { state: cycles, error: cycleError, retry: retryCycle } = useSpendingCycles();
  const range = cycles?.cycles[cycles.currentIndex];
  const cycle = range ? { startDate: new Date(range.startDate), endDate: new Date(range.endDate) } : getSpendingCycle();
  const cycleStart = cycle.startDate.toISOString();
  const cycleEnd = cycle.endDate.toISOString();
  const [lastResetTime, setLastResetTime] = useState<number | null>(null);

  useEffect(() => {
    if (!fixedDetailsRef.current) return;
    try {
      fixedDetailsRef.current.open = Boolean(userId && localStorage.getItem(`homeFixedCostsOpen:${userId}`) === 'true');
    } catch { fixedDetailsRef.current.open = false; }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    Promise.all([categoryService.getAll(userId), paymentService.getAll(userId)]).then(([cats, payments]) => {
      if (!active) return;
      setCategories(cats); setMethods(payments);
    }).catch(() => {});
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    let active = true;
    if (!cycles) return;
    transactionService.getAll(cycleStart, cycleEnd).then(data => {
      if (!active) return;
      // Keep confirmed saves while the cycle request was in flight.
      setTransactions(previous => [...previous.filter(item => new Date(item.date).getTime() >= new Date(cycleStart).getTime() && new Date(item.date).getTime() <= new Date(cycleEnd).getTime()), ...data.filter(item => !previous.some(saved => saved._id === item._id))]);
      const resetDate = userId ? localStorage.getItem(`fixedCostsResetDate:${userId}`) : null;
      const resetTime = resetDate ? new Date(resetDate).getTime() : NaN;
      setLastResetTime(Number.isFinite(resetTime) ? resetTime : null);
      setHistoryError(false);
    }).catch(() => { if (active) setHistoryError(true); }).finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [cycles, cycleStart, cycleEnd, historyRetry, userId]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fixedCostService.getAll().then(data => {
      if (active) { setFixedCosts(data); setFixedError(false); }
    }).catch(() => { if (active) setFixedError(true); })
      .finally(() => { if (active) setFixedLoading(false); });
    return () => { active = false; };
  }, [userId, fixedRetry]);

  const fillFixedCost = (item: FixedCostShortcut) => {
    if (savingRef.current || isFixedCostPaid(item.name, transactions, cycle, lastResetTime)) return;
    // A fixed-cost ID identifies the template, never an existing transaction to update.
    pickedFromPanel.current = true;
    setPickerOpen(false);
    setFixedSearch('');
    const transaction = { name: item.name, amount: item.amount, category: item.category, paymentMethod: item.paymentMethod, walletId: item.walletId };
    setPrefill(previous => ({ version: previous.version + 1, transaction }));
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      formRef.current?.querySelector('input')?.focus({ preventScroll: true });
    });
  };

  const fixedPageCount = Math.max(1, Math.ceil(fixedCosts.length / 4));
  const currentFixedPage = Math.min(fixedPage, fixedPageCount - 1);

  const todaysRecords = transactions.filter(item => item.date.startsWith(today));
  const spent = -todaysRecords.filter(item => item.amount < 0).reduce((sum, item) => sum + Math.round(item.amount * 100), 0) / 100;
  const income = todaysRecords.filter(item => item.amount > 0).reduce((sum, item) => sum + Math.round(item.amount * 100), 0) / 100;
  const formatMoney = (value: number) => new Intl.NumberFormat(th ? 'th-TH' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  return <main className="min-h-screen bg-[#f5f1e7] px-4 pb-16 pt-4 text-[#423c30] sm:px-8 sm:pt-8">
    {receipt && <TransactionReceipt receipt={receipt} onClose={() => setReceipt(null)} />}
    <div className="mx-auto max-w-xl">
      <header className="mb-6 flex items-center justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a7d65]">A pocket for your day</p><h1 className="mt-3 text-3xl font-bold">{th ? 'วันนี้ของเรา' : 'A little note for today'}</h1><p className="mt-2 text-xs text-[#94866d]">{th ? 'จดไว้ แล้วไปใช้ชีวิตต่อ' : 'Make a note. Get on with your day.'}</p></div><Image src="/animations/nori/teftel-cat-18.webp" alt="Nori" width={64} height={64} /></header>
      {cycleError && <p role="alert" className="mb-4 text-xs text-[#b0523b]">{th ? 'โหลดรอบไม่สำเร็จ แต่ยังจดรายการได้' : 'Could not load cycle. You can still save a note.'} <button type="button" onClick={retryCycle} className="min-h-11 px-2 underline">{th ? 'ลองอีกครั้ง' : 'Retry'}</button></p>}
      <section aria-label={th ? 'ยอดวันนี้' : 'Today’s totals'} className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-[#4d654b] px-6 py-5 text-[#fffdf7]">
        <div><p className="text-[11px] text-[#d0dac4]">{th ? 'วันนี้ใช้ไป' : 'Spent today'}</p><p className="mt-2 font-mono text-3xl">{historyLoading || historyError ? '—' : formatMoney(spent)} <span className="text-lg">฿</span></p></div>
        <div className="border-l border-white/20 pl-5 text-right"><p className="text-[10px] text-[#d0dac4]">{th ? 'รายการวันนี้' : 'Today’s records'}</p><p className="mt-2 font-mono text-lg">{historyLoading || historyError ? '—' : todaysRecords.length}</p>{income > 0 && <p className="mt-1 text-[10px] text-[#d0dac4]">{th ? 'รายรับ' : 'Income'} +{formatMoney(income)} ฿</p>}</div>
      </section>
      <LastCycleSummary state={cycles} categories={categories} />
      <details ref={fixedDetailsRef} aria-labelledby="home-fixed-costs" className={`${paper} ${styles.fixedCosts} group mb-4 overflow-hidden`}
        onToggle={event => {
          if (!userId) return;
          try { localStorage.setItem(`homeFixedCostsOpen:${userId}`, String(event.currentTarget.open)); } catch {}
        }}>
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#ad823f] [&::-webkit-details-marker]:hidden">
          <h2 id="home-fixed-costs" className="text-xs font-bold">{th ? 'จดจากรายการประจำ' : 'Regular expenses'} <span className="font-normal text-[#94866d]">· {fixedLoading ? '…' : fixedError ? '—' : `${fixedCosts.length} ${th ? 'รายการ' : 'items'}`}</span></h2>
          <ChevronDown aria-hidden="true" size={16} className="shrink-0 text-[#88714a] transition-transform group-open:rotate-180 motion-reduce:transition-none"/>
        </summary>
        <Dialog.Root open={pickerOpen} onOpenChange={open => { pickedFromPanel.current = false; setPickerOpen(open); setFixedSearch(''); }}>
          <div className="flex items-center justify-between gap-3 px-4 pt-3">
            <p className="text-[11px] text-[#94866d]">{th ? 'แตะเพื่อเติมข้อมูล' : 'Tap to fill the form'}</p>
            <Dialog.Trigger asChild><button type="button" disabled={formSaving || fixedLoading || fixedError} className="flex min-h-11 items-center gap-2 text-xs text-[#88714a] disabled:opacity-50"><Search aria-hidden="true" size={14}/>{th ? 'ดูทั้งหมด' : 'View all'}</button></Dialog.Trigger>
          </div>
          {!fixedLoading && !fixedError && fixedCosts.length > 0 && <div className="grid grid-cols-2 gap-2 px-4 pb-4">{fixedCosts.slice(currentFixedPage * 4, (currentFixedPage + 1) * 4).map(item => <button key={item._id} data-fixed-shortcut={item._id} type="button" disabled={formSaving || isFixedCostPaid(item.name, transactions, cycle, lastResetTime)} onClick={() => fillFixedCost(item)} className="flex min-h-14 min-w-0 items-center justify-between gap-2 border border-[#e1d7c5] bg-[#faf7ef] px-3 py-2 text-left hover:bg-[#eee5d6] focus-visible:outline-2 focus-visible:outline-[#ad823f] disabled:opacity-50"><span className="min-w-0"><span className={`block truncate text-xs ${isFixedCostPaid(item.name, transactions, cycle, lastResetTime) ? 'line-through text-[#7f715d]' : ''}`}>{item.name}</span>{isFixedCostPaid(item.name, transactions, cycle, lastResetTime) && <span className="mt-1 block text-[10px] text-[#416b54]">{th ? 'จดแล้วในรอบนี้' : 'Recorded this cycle'}</span>}</span><span className="shrink-0 font-mono text-[10px] text-[#88714a]">{formatMoney(Math.abs(item.amount))} ฿</span></button>)}</div>}
          {!fixedLoading && !fixedError && fixedPageCount > 1 && <nav aria-label={th ? 'หน้ารายการประจำ' : 'Regular expense pages'} className="flex items-center justify-between gap-3 border-t border-dashed border-[#e7dfd0] px-4 py-1">
            <button type="button" disabled={formSaving || currentFixedPage === 0} onClick={() => setFixedPage(Math.max(0, currentFixedPage - 1))} className="min-h-11 px-2 text-xs text-[#88714a] disabled:opacity-35">{th ? '← ก่อนหน้า' : '← Previous'}</button>
            <span role="status" aria-live="polite" className="font-mono text-[11px] text-[#94866d]">{currentFixedPage + 1} / {fixedPageCount}</span>
            <button type="button" disabled={formSaving || currentFixedPage === fixedPageCount - 1} onClick={() => setFixedPage(Math.min(fixedPageCount - 1, currentFixedPage + 1))} className="min-h-11 px-2 text-xs text-[#88714a] disabled:opacity-35">{th ? 'ถัดไป →' : 'Next →'}</button>
          </nav>}
        {fixedError ? <p role="alert" className="p-5 text-xs text-[#b0523b]">{th ? 'โหลดรายการประจำไม่สำเร็จ ยังจดรายการเองได้ตามปกติ' : 'Could not load regular expenses. You can still enter a note.'} <button type="button" onClick={() => { setFixedLoading(true); setFixedRetry(value => value + 1); }} className="min-h-11 px-2 underline">{th ? 'ลองอีกครั้ง' : 'Retry'}</button></p>
          : fixedLoading ? <p role="status" className="p-5 text-xs text-[#94866d]">{th ? 'กำลังเปิดรายการประจำ…' : 'Loading regular expenses…'}</p>
          : !fixedCosts.length ? <p className="p-5 text-xs text-[#94866d]">{th ? 'เพิ่มรายการประจำในหน้าจัดการ แล้วกลับมาแตะเพื่อจดได้เลย' : 'Add regular expenses in settings to use them as shortcuts here.'}</p>
 : null}

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[21000] bg-[#292722]/35 backdrop-blur-sm" />
            <Dialog.Content onCloseAutoFocus={event => { if (pickedFromPanel.current) event.preventDefault(); }} className="fixed inset-x-3 bottom-3 z-[21001] flex max-h-[calc(100dvh-2rem)] flex-col border border-[#ddd4c4] bg-[#fffdf7] text-[#423c30] shadow-xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[75dvh] sm:w-[min(32rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2">
              <div className="shrink-0 border-b border-[#e7dfd0] p-5">
                <div className="flex items-center justify-between gap-3"><Dialog.Title className="text-lg font-bold">{th ? 'เลือกรายการประจำ' : 'Choose a regular expense'}</Dialog.Title><Dialog.Close asChild><button type="button" aria-label={th ? 'ปิด' : 'Close'} className="flex h-11 w-11 items-center justify-center border border-[#e1d7c5] hover:bg-[#f5eedf]"><X aria-hidden="true" size={16}/></button></Dialog.Close></div>
                <Dialog.Description className="mt-1 text-xs text-[#94866d]">{th ? 'เลือกเพื่อเติมข้อมูล แล้วตรวจและบันทึกที่หน้า Home' : 'Choose to fill the form, then review and save on Home.'}</Dialog.Description>
                <label className="mt-4 flex min-h-11 items-center gap-2 border border-[#ded5c5] bg-[#faf7ef] px-3 focus-within:outline-2 focus-within:outline-[#ad823f]"><Search aria-hidden="true" size={16}/><input autoFocus type="search" aria-label={th ? 'ค้นหารายการประจำ' : 'Search regular expenses'} placeholder={th ? 'ค้นหาชื่อรายการ…' : 'Search by name…'} value={fixedSearch} onChange={event => setFixedSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"/></label>
              </div>
              <div className="min-h-0 overflow-y-auto overscroll-contain">
                <ul className="divide-y divide-dashed divide-[#e7dfd0]">{fixedCosts.filter(item => item.name.toLocaleLowerCase().includes(fixedSearch.trim().toLocaleLowerCase())).map(item => <li key={item._id}>
                  <button type="button" disabled={formSaving || isFixedCostPaid(item.name, transactions, cycle, lastResetTime)} onClick={() => fillFixedCost(item)} className="flex min-h-16 w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[#f5eedf] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#ad823f] disabled:opacity-50">
                    <span className="min-w-0"><span className={`block break-words text-sm ${isFixedCostPaid(item.name, transactions, cycle, lastResetTime) ? 'line-through text-[#7f715d]' : ''}`}>{item.name}</span>{isFixedCostPaid(item.name, transactions, cycle, lastResetTime) && <span className="mt-1 block text-[10px] text-[#416b54]">{th ? 'จดแล้วในรอบนี้' : 'Recorded this cycle'}</span>}<span className="mt-1 block text-[10px] text-[#94866d]">{categories.find(cat => cat._id === item.category || cat.name === item.category)?.name ?? item.category} · {methods.find(method => method._id === item.paymentMethod || method.name === item.paymentMethod)?.name ?? item.paymentMethod}</span></span><span className="shrink-0 font-mono text-xs">{formatMoney(Math.abs(item.amount))} ฿</span>
                  </button>
                </li>)}</ul>
                {!fixedLoading && !fixedError && !fixedCosts.some(item => item.name.toLocaleLowerCase().includes(fixedSearch.trim().toLocaleLowerCase())) && <p role="status" className="p-6 text-center text-sm text-[#94866d]">{th ? 'ไม่พบรายการ' : 'No matching expenses'}</p>}
              </div>
              <Link href="/settings/fixed-cost" className="flex min-h-12 shrink-0 items-center justify-center gap-2 border-t border-[#e7dfd0] px-5 text-xs text-[#88714a]">{th ? 'จัดการรายการประจำ' : 'Manage regular expenses'}<ArrowRight aria-hidden="true" size={13}/></Link>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </details>
      <div ref={formRef} className="scroll-mt-20">
      {prefill.transaction && <p role="status" className="mb-3 text-xs text-[#64815c]">{th ? `เติม “${prefill.transaction.name}” แล้ว ตรวจข้อมูลและกดบันทึกได้เลย` : `“${prefill.transaction.name}” filled in. Review and save when ready.`}</p>}
      <TransactionForm key={prefill.version} initialTransaction={prefill.transaction}
        onSavingChange={saving => { savingRef.current = saving; setFormSaving(saving); }} onSaved={savedReceipt => {
        const { transaction } = savedReceipt;
        setReceipt(savedReceipt);
        setTransactions(previous => [transaction, ...previous.filter(item => item._id !== transaction._id)]);
        setHistoryRetry(value => value + 1);
        setPrefill(previous => ({ version: previous.version }));
      }} />
      </div>
      <section className={`${paper} mt-6 overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-[#e7dfd0] p-5"><h2 className="text-sm font-bold">{th ? 'ที่จดไว้วันนี้' : 'Today’s notes'}</h2><Link href="/note" className="flex min-h-11 items-center gap-2 text-xs text-[#88714a]">{th ? 'ดูทั้งหมด' : 'View all'}<ArrowRight aria-hidden="true" size={13} /></Link></div>
        {historyError ? <p role="alert" className="p-5 text-xs text-[#b0523b]">{th ? 'โหลดรายการวันนี้ไม่สำเร็จ แต่ยังจดรายการใหม่ได้' : 'Could not load today’s notes. You can still save a new note.'} <button type="button" onClick={() => { setHistoryLoading(true); setHistoryRetry(value => value + 1); }} className="min-h-11 px-2 underline">{th ? 'ลองอีกครั้ง' : 'Retry'}</button></p> : historyLoading ? <p role="status" className="p-5 text-xs text-[#94866d]">{th ? 'กำลังเปิดรายการวันนี้…' : 'Loading today’s notes…'}</p> : !todaysRecords.length ? <p className="p-5 text-xs text-[#94866d]">{th ? 'วันนี้ยังไม่มีรายการ เริ่มจดด้านบนได้เลย' : 'A fresh page. Add your first note above.'}</p> : null}
        <ul className="divide-y divide-dashed divide-[#e7dfd0]">{todaysRecords.slice(0, 5).map(item => <li key={item._id} className="flex items-center justify-between gap-3 px-5 py-4"><div className="min-w-0"><p className="break-words text-sm">{item.name}</p><p className="mt-1 text-[10px] text-[#a09278]">{categories.find(cat => cat._id === item.category)?.name ?? item.category} · {methods.find(method => method._id === item.paymentMethod)?.name ?? item.paymentMethod}</p></div><span className={`shrink-0 font-mono text-xs ${item.amount > 0 ? 'text-[#64815c]' : ''}`}>{item.amount > 0 ? '+' : '−'}{formatMoney(Math.abs(item.amount))} ฿</span></li>)}</ul>
      </section>
      <Link href="/wallets" className="mt-6 flex min-h-11 items-center justify-center gap-2 text-xs text-[#88714a]">{th ? 'ดูกระเป๋างบและย้ายงบ' : 'View wallets and transfer budget'}<ArrowRight aria-hidden="true" size={14}/></Link>
      <Link href="/dashboard" className="mt-6 flex min-h-11 items-center justify-center gap-2 text-xs text-[#88714a]">{th ? 'ดูภาพรวมใน Dashboard' : 'Explore your dashboard'}<ArrowRight aria-hidden="true" size={14} /></Link>
    </div>
  </main>;
}
