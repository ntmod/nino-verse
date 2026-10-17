'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Check, ChevronRight, Leaf } from 'lucide-react';
import type { DashboardSample, DemoRecord } from './demo-data';
import styles from './concepts.module.css';

export const money = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
export const shortDate = (value: string, th: boolean) => new Date(value).toLocaleDateString(th ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' });
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`${styles.card} ${className}`}>{children}</section>;
}
export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-medium text-[#8a8d81]">{children}</p>;
}
export function Sparkline({ values, color = '#75947a' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return <svg aria-hidden="true" viewBox="0 0 200 48" className="h-12 w-full"><polyline points={values.map((value, index) => `${index / Math.max(1, values.length - 1) * 200},${44 - value / max * 38}`).join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function Trend({ sample, th }: { sample: DashboardSample; th: boolean }) {
  const [cumulative, setCumulative] = useState(false);
  const [selected, setSelected] = useState(17);
  let sum = 0;
  const values: number[] = [];
  for (const day of sample.days) { sum += day.amount; values.push(cumulative ? sum : day.amount); }
  const maximum = Math.max(...values, 1);
  const points = values.map((value, index) => `${38 + index / 17 * 540},${170 - value / maximum * 130}`).join(' ');
  return <div>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold">{th ? 'เส้นทางการใช้เงิน' : 'Your spending, over time'}</h2><p className="mt-1 text-xs text-[#989b90]">{th ? 'เลื่อนแถบด้านล่างเพื่อดูแต่ละวัน' : 'Slide below to explore each day'}</p></div><button type="button" onClick={() => setCumulative(value => !value)} aria-pressed={cumulative} className="min-h-10 rounded-[10px] border border-[#e6e7de] px-3 text-[11px] text-[#767d6a]">{cumulative ? (th ? 'ยอดสะสม' : 'Cumulative') : (th ? 'รายวัน' : 'Daily')}</button></div>
    <div className="mt-5 flex items-baseline gap-3"><span className="font-mono text-3xl font-medium tracking-tight">฿{money(values[selected])}</span><span className="text-[11px] text-[#989b90]">{shortDate(sample.days[selected].date, th)}</span></div>
    <svg role="img" aria-label={th ? 'กราฟรายจ่ายตัวอย่าง' : 'Sample spending chart'} viewBox="0 0 610 205" className="mt-5 w-full">{[0,1,2,3].map(index => <g key={index}><line x1="38" x2="578" y1={40 + index * 44} y2={40 + index * 44} stroke="#edeee7" /><text x="30" y={43 + index * 44} textAnchor="end" fontSize="8" fill="#b0b2a6">{money(maximum * (3-index) / 3)}</text></g>)}<polygon points={`38,174 ${points} 578,174`} fill="#edf2e9" /><polyline points={points} fill="none" stroke="#7d987a" strokeWidth="2.5" strokeLinejoin="round" /><line x1={38+selected/17*540} x2={38+selected/17*540} y1="24" y2="174" stroke="#c6d0bd" strokeDasharray="3 4" /><circle cx={38+selected/17*540} cy={170-values[selected]/maximum*130} r="5" fill="#fff" stroke="#6d8a65" strokeWidth="2.5" /><text x="38" y="200" fontSize="9" fill="#a3a699">{shortDate(sample.days[0].date,th)}</text><text x="578" y="200" textAnchor="end" fontSize="9" fill="#a3a699">{shortDate(sample.days[17].date,th)}</text></svg>
    <label className="mt-3 flex min-h-11 items-center gap-4 text-[11px] text-[#8a8d81]">{th ? 'วันที่' : 'Day'}<input type="range" min={0} max={17} value={selected} onChange={event=>setSelected(Number(event.target.value))} aria-valuetext={`${shortDate(sample.days[selected].date,th)} · ${money(values[selected])} THB`} className="min-w-0 flex-1 accent-[#7d987a]" /></label>
  </div>;
}
export function Records({ records, sample, th, onSelect, limit = 5 }: { records: DemoRecord[]; sample: DashboardSample; th: boolean; onSelect: (record: DemoRecord) => void; limit?: number }) {
  return <ul className="divide-y divide-[#eff0e9]">{records.slice(0, limit).map(record => {const category = sample.categories.find(item=>item.id===record.category)!;return <li key={record.id}><button type="button" onClick={()=>onSelect(record)} className="group flex min-h-[72px] w-full items-center gap-3 py-3 text-left"><span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base" style={{background:category.tint}}>{category.icon}</span><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium group-hover:text-[#6d8a65]">{th?record.name:record.en}</span><span className="mt-1 block text-[10px] text-[#a0a394]">{shortDate(record.date,th)} · {record.payment==='cash'?(th?'เงินสด':'Cash'):(th?'บัญชีธนาคาร':'Bank account')}</span></span><span className="shrink-0 font-mono text-[12px]">−{money(record.amount)}</span><ChevronRight aria-hidden="true" size={13} className="text-[#c2c5b8]" /></button></li>;})}</ul>;
}
export function Garden({ th }: { th: boolean }) {
  const [visiting, setVisiting] = useState(false);
  return <section className="relative overflow-hidden rounded-2xl border border-[#dce4d4] bg-[#eff3e9] p-6 sm:p-7"><div className="relative z-10 flex items-center justify-between gap-4"><div><p className="flex items-center gap-2 text-[11px] text-[#8c9c7b]"><Leaf size={13} />{th?'สวนข้างสมุด':'A garden beside your notes'}</p><h2 className="mt-3 text-lg font-semibold text-[#5d7350]">{th?'18 วันที่เราแวะมาจด':'18 days of showing up'}</h2><button type="button" aria-expanded={visiting} onClick={()=>setVisiting(value=>!value)} className="mt-3 flex min-h-10 items-center gap-2 text-xs text-[#7b916b]">{visiting?(th?'เก็บสวน':'Close garden'):(th?'แวะดูสวน':'Visit the garden')}<ArrowUpRight size={13}/></button></div><Image src="/animations/nori/teftel-cat-18.webp" alt="Nori" width={90} height={90} className="h-20 w-20 shrink-0"/></div>{visiting && <div className="mt-4 flex min-h-24 flex-wrap items-end justify-center gap-3 rounded-xl border-b-4 border-[#b7c7a4] bg-[#e5ecd9] px-4 py-5" aria-label={th?'สวนตัวอย่าง 18 ต้น':'Sample garden with 18 plants'}>{Array.from({length:18},(_,index)=><span key={index} aria-hidden="true" className="text-2xl" style={{transform:`translateY(${index%3*-5}px)`}}>{['🌿','🌼','🌱'][index%3]}</span>)}</div>}</section>;
}
export function Commitment({ th }: { th: boolean }) {
  const [paid,setPaid]=useState(false);
  return <Card><div className="flex items-center justify-between gap-3"><div><SectionLabel>{th?'รายการที่ต้องดูแล':'A little commitment'}</SectionLabel><h2 className="mt-2 text-base font-semibold">Internet</h2></div><span className="rounded-[10px] bg-[#f7f0de] px-2.5 py-1.5 text-[10px] text-[#b09b64]">{th?'ประจำรอบ':'Recurring'}</span></div><div className="mt-5 flex items-center justify-between"><span className="font-mono text-2xl">590 <small className="text-xs text-[#a0a394]">฿</small></span><button type="button" aria-pressed={paid} onClick={()=>setPaid(value=>!value)} className={`flex min-h-11 items-center gap-1.5 rounded-[10px] px-3 text-xs ${paid?'bg-[#e8efdf] text-[#6d8a65]':'bg-[#f4f3ed] text-[#969b88]'}`}>{paid&&<Check size={13}/ >}{paid?(th?'จ่ายแล้ว':'Paid'):(th?'ทำเครื่องหมาย':'Mark paid')}</button></div><p role="status" className="mt-3 text-[9px] text-[#a9ad9f]">{th?'สถานะทดลอง · ไม่สร้างรายการจริง':'Demo status · no transaction created'}</p></Card>;
}
