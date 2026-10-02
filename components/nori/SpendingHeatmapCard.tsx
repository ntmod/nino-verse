'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { getSpendingDays } from '@/lib/spending-heatmap.mjs';
import type { Transaction } from '@/lib/types';

import NoriPeek from './NoriPeek';

const COLORS = ['#eee5d6', '#f4d9a5', '#edbc71', '#d99039', '#a85b24'];

export default function SpendingHeatmapCard({ transactions, cycle, isLoading, ready, onEdit, savedTransaction }: {
  savedTransaction?: Transaction | null;
  transactions: Transaction[]; cycle: { startDate: Date; endDate: Date };
  isLoading: boolean; ready: boolean; onEdit: (transaction: Transaction) => void;
}) {
  const { language } = useLanguage();
  const reducedMotion = useReducedMotion();
  const th = language === 'th';
  const locale = th ? 'th-TH' : 'en-US';
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [previewDate, setPreviewDate] = useState<string | null>(null);
  const tooltipId = useId();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const touchStart = useRef({ x: 0, y: 0 });
  const clearHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };
  useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current); }, []);
  const days = getSpendingDays(transactions, cycle);
  const selected = days.find(day => day.date === selectedDate);
  const savedDay = savedTransaction && savedTransaction.amount < 0 ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date(savedTransaction.date)) : null;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  const offset = (new Date(`${days[0].date}T00:00:00Z`).getUTCDay() + 6) % 7;
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'THB', currencyDisplay: 'narrowSymbol' }).format(value);
  const dateLabel = (value: string) => new Date(`${value}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });

  return (
    <section className="relative border border-[#e1d7c5] bg-[#fffdf5] p-4 text-left shadow-[3px_4px_0_#e7dece,0_8px_24px_rgba(78,62,36,0.06)] sm:p-6">
      {ready && !isLoading && <NoriPeek />}
      <h2 className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider text-[#7f715d]"><CalendarDays aria-hidden="true" className="h-4 w-4" />{th ? 'ปฏิทินการใช้เงิน' : 'Spending calendar'}</h2>
      <p className="mt-2 text-xs text-[#93846b]">{th ? 'ชี้หรือแตะค้างดูสรุป · แตะวันเพื่อดูรายการ' : 'Hover or hold for a preview · Tap a day for expenses'}</p>
      {isLoading ? <div className="mt-5 h-56 animate-pulse bg-[#eee5d6]" aria-label={th ? 'กำลังโหลดปฏิทิน' : 'Loading calendar'} /> : !ready ? (
        <p className="py-8 text-xs text-[#7f715d]">{th ? 'เปิดข้อมูลไม่ได้ กรุณาโหลดหน้าอีกครั้ง' : 'Could not load expenses. Please reload.'}</p>
      ) : <>
        <div className="mt-5 grid grid-cols-7 gap-1.5">
          {(th ? ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']).map((day, index) => <span key={index} className="pb-1 text-center font-mono text-[10px] text-[#93846b]">{day}</span>)}
          {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
          {days.map((day, index) => <motion.button key={`${day.date}-${day.date === savedDay ? savedTransaction?._id : ""}`}
            initial={false}
            animate={day.date === savedDay && !reducedMotion ? { scale: [1, 1.12, 1], boxShadow: ["0 0 0 0px #e9a34200", "0 0 0 6px #e9a34266", "0 0 0 0px #e9a34200"] } : { scale: 1 }}
            transition={{ duration: 0.8 }} type="button"
            onPointerEnter={event => { if (event.pointerType === 'mouse') setPreviewDate(day.date); }}
            onPointerLeave={() => { clearHold(); setPreviewDate(null); }}
            onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setPreviewDate(day.date); }}
            onBlur={() => setPreviewDate(null)}
            onKeyDown={event => { held.current = false; if (event.key === 'Escape') setPreviewDate(null); }}
            onPointerDown={event => {
              held.current = false;
              if (event.pointerType === 'mouse') return;
              clearHold();
              touchStart.current = { x: event.clientX, y: event.clientY };
              holdTimer.current = setTimeout(() => { held.current = true; setPreviewDate(day.date); }, 450);
            }}
            onPointerMove={event => {
              if (event.pointerType !== 'mouse' && Math.hypot(event.clientX - touchStart.current.x, event.clientY - touchStart.current.y) > 8) { clearHold(); setPreviewDate(null); }
            }}
            onPointerUp={event => { clearHold(); if (event.pointerType !== 'mouse') setPreviewDate(null); }}
            onPointerCancel={() => { clearHold(); held.current = false; setPreviewDate(null); }}
            onContextMenu={event => { if (held.current) event.preventDefault(); }}
            onClick={() => {
              if (held.current) { held.current = false; return; }
              setPreviewDate(null);
              setSelectedDate(selectedDate === day.date ? null : day.date);
            }}
            aria-describedby={previewDate === day.date ? tooltipId : undefined}
            aria-pressed={selectedDate === day.date} aria-label={`${dateLabel(day.date)} · ${money(day.amount)} · ${day.records.length} ${th ? 'รายการ' : 'expenses'}`}
            style={{ backgroundColor: COLORS[day.level] }}
            className={`relative min-h-11 touch-manipulation select-none rounded-md border text-xs font-bold transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#292722] ${previewDate === day.date ? "z-20" : ""} ${selectedDate === day.date ? 'border-[#292722] ring-2 ring-[#292722]' : 'border-transparent'} ${day.level >= 4 ? 'text-white' : 'text-[#635744]'}`}>
            {Number(day.date.slice(-2))}{day.date === today && <span aria-hidden="true" className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current" />}
            {previewDate === day.date && <span id={tooltipId} role="tooltip" className={`pointer-events-none absolute bottom-full mb-2 flex w-44 max-w-[calc(100vw-3rem)] flex-col gap-1 rounded-lg border border-[#d9cebb] bg-[#fffdf5] p-3 text-left text-[#292722] shadow-lg ${(index + offset) % 7 < 2 ? 'left-0' : (index + offset) % 7 > 4 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
              <span className="font-mono text-[10px] text-[#7f715d]">{dateLabel(day.date)}</span>
              <span className="text-sm font-black">{money(day.amount)}</span>
              <span className="text-[10px] font-normal text-[#93846b]">{day.records.length} {th ? 'รายการ' : 'expenses'}</span>
              <span className="truncate border-t border-dashed border-[#e1d7c5] pt-1 text-[10px] font-normal">{day.records.length ? day.records.slice(0, 2).map((record: Transaction) => record.name).join(' · ') : day.date > today ? (th ? 'ยังไม่ถึงวันนี้' : 'This day is still ahead') : (th ? 'ไม่มีรายจ่าย' : 'No expenses')}</span>
            </span>}
          </motion.button>)}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-[9px] text-[#7f715d]">
          {['0', '<300', '300–<700', '700–<1,500', '≥1,500'].map((label, index) => <span key={label} className="flex items-center gap-1"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[index] }} />{label} ฿</span>)}
        </div>
        {selected && <div className="mt-5 border-t border-dashed border-[#d9cebb] pt-4">
          <h3 className="flex flex-wrap justify-between gap-2 text-xs font-bold text-[#292722]"><span>{dateLabel(selected.date)}</span><span>{money(selected.amount)}</span></h3>
          {selected.records.length === 0 ? <p className="mt-3 text-xs text-[#93846b]">{selected.date > today ? (th ? 'ยังไม่ถึงวันนี้' : 'This day is still ahead') : (th ? 'ไม่มีรายจ่ายที่บันทึกในวันนี้' : 'No expenses recorded for this day')}</p> : <ul className="mt-2 divide-y divide-[#e1d7c5]">
            {(selected.records as Transaction[]).map(transaction => <li key={transaction._id}><button type="button" onClick={() => onEdit(transaction)} className="flex min-h-11 w-full items-center justify-between gap-3 py-3 text-left text-xs text-[#635744] hover:text-[#b97423] focus-visible:outline-2 focus-visible:outline-[#b97423]"><span className="min-w-0 break-words">{transaction.name}</span><span className="shrink-0 font-mono font-bold">{money(Math.abs(transaction.amount))}</span></button></li>)}
          </ul>}
        </div>}
      </>}
    </section>
  );
}
