'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';
import { getHeaderHints } from '@/lib/nori-header.mjs';

export default function NoriHeader({ total, count, previousTotal, topCategory, bills, paidBills, loading, ready }: {
  total: number; count: number; previousTotal: number;
  topCategory?: { name: string; amount: number };
  bills: number; paidBills: number; loading: boolean; ready: boolean;
}) {
  const { language } = useLanguage();
  const th = language === 'th';
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const hints = getHeaderHints({ total, count, previousTotal, topCategory, bills, paidBills }, language);
  const hint = hints[index % hints.length];
  const text = loading ? (th ? 'แป๊บนะ กำลังเปิดสมุดให้…' : 'One moment, opening your ledger…')
    : !ready ? (th ? 'ยังเปิดข้อมูลไม่ได้ ลองโหลดหน้าอีกครั้งนะ' : 'Could not open your data. Please reload the page.') : hint.text;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
      <motion.button
        type="button"
        disabled={loading || !ready}
        onClick={() => setIndex(value => value + 1)}
        aria-label={th ? 'แตะ Nori เพื่อฟังข้อความถัดไป' : 'Tap Nori for the next message'}
        whileHover={reducedMotion ? undefined : { y: -3 }}
        whileTap={reducedMotion ? undefined : { scale: 0.92, rotate: -5 }}
        className="h-20 w-20 shrink-0 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97423] disabled:cursor-default"
      >
        <Image src={`/animations/nori/${ready && !loading ? hint.asset : 'cat-idle'}.webp`} alt="" width={80} height={80} unoptimized />
      </motion.button>
      <div className="min-w-0 flex-1">
        <h1 className="font-heading text-base tracking-wide text-[#292722]">NORINOTE</h1>
        <div className="relative mt-2 rounded-xl border border-[#d9cebb] bg-[#f5eedf]/60 px-3 py-2.5">
          <span aria-hidden="true" className="absolute -left-1 top-4 h-2 w-2 rotate-45 border-b border-l border-[#d9cebb] bg-[#f5eedf]" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={text} initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: reducedMotion ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.15 }} aria-live="polite" className="break-words text-xs leading-relaxed text-[#635744]">{text}</motion.p>
          </AnimatePresence>
        </div>
        {ready && !loading && <p className="mt-2 font-mono text-[9px] text-[#93846b]">{th ? 'แตะ Nori เพื่อคุยต่อ' : 'Tap Nori for another thought'} · {index % hints.length + 1}/{hints.length}</p>}
      </div>
    </div>
  );
}
