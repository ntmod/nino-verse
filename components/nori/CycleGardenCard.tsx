'use client';

import { stagger, useAnimate, useReducedMotion } from 'framer-motion';
import styles from './CycleGardenCard.module.css';
import NoriGardenActor from './NoriGardenActor';
import { useEffect, useId, useMemo, useState } from 'react';
import { Sprout, X } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { getGardenDays, getGardenPlants } from '@/lib/cycle-garden.mjs';
import { getGardenAtmosphere } from '@/lib/garden-atmosphere.mjs';
import { playUISound } from '@/lib/ui-sounds.mjs';
import type { Transaction } from '@/lib/types';

const PALETTES = {
  day: { sky: '#ecf0e5', sun: '#f2dca4', clouds: '#fffdf5', far: '#dce5d2', middle: '#cbd9b2', near: '#b7cb9b', path: '#e9ddc1', foliage: '#789762', leaves: '#a4b983' },
  evening: { sky: '#f4d4bc', sun: '#ecaa77', clouds: '#fcebd9', far: '#d5d5b5', middle: '#bbc899', near: '#a0b583', path: '#e2cba8', foliage: '#73865a', leaves: '#99a97a' },
  night: { sky: '#293c50', sun: '#f6ebcc', clouds: '#42546a', far: '#455e62', middle: '#4f6c61', near: '#56785c', path: '#9c9e84', foliage: '#365d4c', leaves: '#64836b' },
};
const PETALS = ['#e7a298', '#e5bd66', '#b7aed4', '#df95b0'];
function FlowerBush({ variant, selected, depth, x, feedback }: { variant: number; selected: boolean; depth: number; x: number; feedback?: { date: string; newDay: boolean } | null }) {
  const [scope, animate] = useAnimate<SVGSVGElement>();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!feedback || reducedMotion) return;
    const animations = feedback.newDay ? [
      animate('.garden-leaves', { scaleY: [0, 1] }, { duration: 0.55, ease: 'easeOut' }),
      animate('.garden-bloom', { scale: [0, 1.12, 1] }, { duration: 0.65, delay: stagger(0.12, { startDelay: 0.3 }), ease: 'easeOut' }),
    ] : [animate('.garden-plant', { scale: [1, 1.08, 1] }, { duration: 0.5, ease: 'easeOut' })];
    return () => animations.forEach(animation => animation.complete());
  }, [feedback, reducedMotion, animate]);
  const outlineId = useId();
  return <svg ref={scope} aria-hidden="true" viewBox="0 0 96 88" className={`h-full w-full overflow-visible ${styles.bush}`} style={{ pointerEvents: 'visiblePainted' }}>
    <defs>
      <filter id={outlineId} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="outline" />
        <feFlood floodColor="#fff4ce" />
        <feComposite in2="outline" operator="in" />
        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <ellipse cx="48" cy="81" rx="39" ry="5" fill="#64794b" opacity="0.15" />
    <g className="garden-wind" style={{ '--garden-sway': `${1 + depth * 2.5}deg`, animationDelay: `${-9 + x / 100 * 2}s` } as React.CSSProperties}>
    <g className="garden-plant" filter={selected ? `url(#${outlineId})` : undefined}>
    <path className="garden-leaves" d="M9 79 Q7 60 23 64 Q26 50 41 61 Q50 47 63 62 Q82 53 87 79Z" fill="#93ad74" />
    {(variant % 3 === 0 ? [[20, 27], [48, 14], [76, 29]] : variant % 3 === 1 ? [[17, 30], [38, 14], [60, 19], [80, 31]] : [[14, 32], [31, 18], [48, 11], [65, 20], [82, 33]]).map(([x, y], index) => <g key={index} transform={`translate(${x - 16.8} ${y}) scale(0.7)`}>
    <g className="garden-leaves"><path d="M24 65 Q20 46 24 27" fill="none" stroke="#6c8c59" strokeWidth="3" strokeLinecap="round" />
    <path d="M23 53 Q5 52 10 41 Q22 41 23 53 M23 45 Q40 44 38 34 Q27 34 23 45" fill="#93ad74" stroke="#6c8c59" strokeWidth="1" />
    </g>
    <g className="garden-bloom">
    {variant === 3 ? <path d="M11 15 L18 20 L24 12 L30 20 L37 15 Q38 36 24 36 Q10 36 11 15" fill={PETALS[variant]} stroke="#bf788f" strokeWidth="1.5" /> : <>
      {[0, 60, 120, 180, 240, 300].map(angle => <ellipse key={angle} cx="24" cy="15" rx="6.5" ry="10" transform={`rotate(${angle} 24 25)`} fill={PETALS[variant]} stroke="#fffdf5" strokeWidth="1.5" />)}
      <circle cx="24" cy="25" r="6" fill="#f4d887" stroke="#b89a54" strokeWidth="1" />
    </>}
    </g>
    </g>)}
    <path className="garden-leaves" d="M14 80 Q9 64 4 68 M25 82 Q19 60 23 56 M36 82 Q30 64 33 59 M49 82 Q43 64 47 57 M60 82 Q65 61 70 62 M76 80 Q81 63 91 66" fill="none" stroke="#6c8c59" strokeWidth="2.5" strokeLinecap="round" />
    </g>
    </g>
  </svg>;
}

export default function CycleGardenCard({ transactions, cycle, isLoading, ready, onEdit, feedback }: {
  feedback?: { date: string; newDay: boolean } | null; transactions: Transaction[]; cycle: { startDate: Date; endDate: Date }; isLoading: boolean; ready: boolean; onEdit: (transaction: Transaction) => void;
}) {
  const { language } = useLanguage();
  const th = language === 'th';
  const [atmosphere, setAtmosphere] = useState<keyof typeof PALETTES>('day');
  useEffect(() => {
    const update = () => setAtmosphere(getGardenAtmosphere(new Date().getHours()));
    const initial = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 60_000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  const colors = PALETTES[atmosphere];
  const night = atmosphere === 'night';
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const days = useMemo(() => getGardenDays(transactions, cycle), [transactions, cycle]);
  const planted = days.filter(day => day.records.length > 0).length;
  const plants = useMemo(() => getGardenPlants(days), [days]);
  const selected = days.find(day => day.date === selectedDate);
  const dateLabel = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString(th ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });

  return <section className="min-w-0 border border-[#e1d7c5] bg-[#fffdf5] p-4 text-[#635744] shadow-[3px_4px_0_#e7dece,0_8px_24px_rgba(78,62,36,0.06)] sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider text-[#7f715d]"><Sprout aria-hidden="true" className="h-4 w-4" />{th ? 'สวนของรอบนี้' : 'Your cycle garden'}</h2>
      <span className="text-[10px] text-[#93846b]">{atmosphere === 'day' ? (th ? 'แสงกลางวัน ☀️' : 'Daylight ☀️') : atmosphere === 'evening' ? (th ? 'ยามเย็น 🌅' : 'Evening 🌅') : (th ? 'ราตรีในสวน 🌙' : 'Garden at night 🌙')}</span>

    </div>
    <p className="mt-2 text-xs text-[#93846b]">{th ? 'สวนเล็ก ๆ ข้างสมุด · แตะดอกไม้ดูวันที่เราเคยจด' : 'A little garden beside your ledger · Tap a flower to revisit your days'}</p>
    {isLoading ? <div className="mt-4 h-72 animate-pulse rounded-2xl bg-[#edf0df]" /> : !ready ? <p className="py-8 text-xs">{th ? 'ยังเปิดสวนไม่ได้ ลองโหลดหน้าอีกครั้งนะ' : 'Could not open your garden. Please reload.'}</p> : <>
      <div tabIndex={0} role="region" aria-label={th ? 'สวนแนวนอน ปัดหรือเลื่อนเพื่อชมสวน' : 'Wide garden. Scroll to explore'} className="mt-4 overflow-x-auto rounded-2xl border border-[#dce3cd] focus-visible:outline-2 focus-visible:outline-[#b97423]">
      <div data-atmosphere={atmosphere} className="relative h-[400px] min-w-[860px] overflow-clip bg-[#edf1df]">
        <svg aria-hidden="true" viewBox="0 0 1000 400" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <rect width="1000" height="400" fill={colors.sky} />
          <circle cx="845" cy="46" r="25" fill={colors.sun} />
          {night && <>
            <circle cx="855" cy="38" r="22" fill={colors.sky} />
            {[90, 235, 370, 630, 740, 920].map((x, index) => <circle key={x} cx={x} cy={20 + index % 3 * 23} r={index % 2 ? 1.5 : 2} fill="#f6ebcc" opacity="0.7" />)}
          </>}
          <path d="M110 51 Q119 29 139 39 Q158 20 172 42 Q196 34 204 51Z M492 39 Q504 18 520 30 Q537 14 551 31 Q573 23 583 39Z" fill={colors.clouds} />
          <path d="M0 132 Q145 98 308 124 T632 118 T1000 122 V400 H0Z" fill={colors.far} />
          <path d="M0 184 Q210 135 380 158 T760 151 T1000 177 V400 H0Z" fill={colors.middle} />
          <path d="M0 286 Q236 211 488 245 T1000 250 V400 H0Z" fill={colors.near} />
          <path d="M498 132 C485 185 582 202 563 248 C542 294 376 327 320 400 H680 C638 322 675 305 650 261 C620 209 527 180 522 132Z" fill={colors.path} />
          <path d="M498 132 C485 185 582 202 563 248 C542 294 376 327 320 400 M522 132 C527 180 620 209 650 261 C675 305 638 322 680 400" fill="none" stroke="#ded1b1" strokeWidth="1.5" opacity="0.6" />
          {[60, 300, 475, 700, 880, 955].map((x, index) => <g key={x} transform={`translate(${x} ${188 + index % 3 * 31})`} stroke="#8ea970" fill="none" strokeWidth="2" strokeLinecap="round"><path d="M0 15 Q-9 -5 -16 0 M0 15 Q4 -13 9 -7 M0 15 Q12 0 18 3 M0 15 L-2 -2" /></g>)}
          <g fill="#acb398"><ellipse cx="460" cy="299" rx="11" ry="4" /><ellipse cx="772" cy="209" rx="8" ry="3" /><ellipse cx="337" cy="237" rx="6" ry="3" /></g>
        </svg>
        {plants.map(day => <button key={day.date} type="button" aria-pressed={selectedDate === day.date}
          aria-label={`${dateLabel(day.date)} · ${day.records.length} ${th ? 'รายการ' : 'transactions'}`}
          onClick={() => { setSelectedDate(selectedDate === day.date ? null : day.date); playUISound('click'); }}
          style={{ left: `${day.x}%`, top: `${day.y}%` }}
          className="absolute -ml-[22px] -mt-[22px] h-11 w-11 rounded-full group focus-visible:outline-2 focus-visible:outline-[#7f715d]">
          <span aria-hidden="true" className="absolute inset-0 z-[200] rounded-full" />
          <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 transition-transform group-hover:-translate-y-[calc(50%+4px)] motion-reduce:transition-none" style={{ width: day.width, height: day.height, opacity: 0.78 + day.depth * 0.22, zIndex: 20 + Math.round(day.depth * 100) }}><FlowerBush variant={day.flower} selected={selectedDate === day.date} depth={day.depth} x={day.x} feedback={feedback?.date === day.date ? feedback : null} /></span>
        </button>)}
        <NoriGardenActor night={night} />
        {night && <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[140]">
          {[12, 27, 43, 61, 78, 91].map((x, index) => <span key={x} className="garden-firefly absolute h-1.5 w-1.5 rounded-full bg-[#f4e5a5] shadow-[0_0_8px_3px_#f4e5a544]" style={{ left: `${x}%`, top: `${45 + index % 3 * 14}%`, animationDelay: `${index * -0.7}s` }} />)}
        </div>}
        <svg aria-hidden="true" viewBox="0 0 1000 400" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-[130] h-full w-full">
          <path d="M0 400 V335 Q24 292 51 340 Q87 296 113 351 Q153 322 183 400Z M780 400 Q809 341 847 366 Q872 318 913 340 Q957 292 1000 350 V400Z" fill={colors.foliage} />
          <g fill={colors.leaves}><ellipse cx="42" cy="370" rx="13" ry="33" transform="rotate(-25 42 370)" /><ellipse cx="113" cy="383" rx="14" ry="28" transform="rotate(28 113 383)" /><ellipse cx="885" cy="377" rx="15" ry="34" transform="rotate(-30 885 377)" /><ellipse cx="957" cy="361" rx="13" ry="37" transform="rotate(30 957 361)" /></g>
          <g fill="#e6b49c"><circle cx="63" cy="370" r="7" /><circle cx="934" cy="370" r="9" /></g>
        </svg>
        <span className="absolute bottom-3 left-1/2 z-[150] -translate-x-1/2 rounded-full bg-[#fffdf5]/80 px-3 py-1 font-mono text-[9px] text-[#6f8057]">{dateLabel(days[0].date)} — {dateLabel(days[days.length - 1].date)}</span>
      </div>
      </div>
      <p className="mt-3 text-[10px] text-[#93846b]">{planted === 0 ? (th ? 'สวนยังเงียบอยู่ จดวันไหนก็ปลูกต้นแรกได้เลย 🌱' : 'A quiet garden. Your first recorded day will plant a seed 🌱') : (th ? 'สวนโตจากวันที่บันทึก ไม่ได้โตตามยอดเงิน' : 'Grown from recorded days, never from how much you spend')}</p>
      {selected && <div className="mt-4 border-t border-dashed border-[#d9cebb] pt-3">
        <div className="flex items-center justify-between"><h3 className="text-xs font-bold">{dateLabel(selected.date)} · {selected.records.length} {th ? 'รายการ' : 'transactions'}</h3><button type="button" aria-label={th ? 'ปิดรายละเอียดวัน' : 'Close day details'} onClick={() => setSelectedDate(null)} className="flex h-11 w-11 items-center justify-center"><X className="h-3.5 w-3.5" /></button></div>
        <ul className="divide-y divide-[#e1d7c5]">{(selected.records as Transaction[]).map(transaction => <li key={transaction._id}><button type="button" onClick={() => onEdit(transaction)} className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left text-xs hover:text-[#b97423]"><span className="min-w-0 break-words">{transaction.name}</span><span className="shrink-0 font-mono">{new Intl.NumberFormat(th ? 'th-TH' : 'en-US', { style: 'currency', currency: 'THB', currencyDisplay: 'narrowSymbol' }).format(transaction.amount)}</span></button></li>)}</ul>
      </div>}
    </>}
  </section>;
}
