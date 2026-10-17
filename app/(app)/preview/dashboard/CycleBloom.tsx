'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sprout } from 'lucide-react';
import type { DashboardSample } from './demo-data';
import { money, shortDate } from './ConceptParts';

function Flower({ index }: { index: number }) {
  const color = ['#e6b48c', '#d8c779', '#b7bfdb', '#d9a9b5'][index % 4];
  return <svg aria-hidden="true" viewBox="0 0 48 54" className="h-12 w-11 overflow-visible"><ellipse cx="24" cy="49" rx="12" ry="3" fill="#728c53" opacity="0.12" /><path d="M24 48 Q20 34 24 22" stroke="#91a76e" strokeWidth="2" fill="none" /><path d="M23 41 Q9 40 12 31 Q23 31 23 41 M23 36 Q36 34 35 28 Q24 29 23 36" fill="#a5b982" />{[0,60,120,180,240,300].map(angle=><ellipse key={angle} cx="24" cy="13" rx="5" ry="8" fill={color} transform={`rotate(${angle} 24 21)`} />)}<circle cx="24" cy="21" r="5" fill="#f8efd1" /><circle cx="24" cy="21" r="2" fill="#cbb67a" /></svg>;
}

export default function CycleBloom({ sample, th }: { sample: DashboardSample; th: boolean }) {
  const [through,setThrough] = useState(sample.days.length);
  const [selected,setSelected] = useState<number|null>(null);
  const flowers = sample.days.filter(day=>day.day<through&&day.amount>0);
  const selection = sample.days.find(day=>day.day===selected&&day.day<through);
  return <section className="h-full min-w-0 overflow-hidden rounded-2xl border border-[#dce5d1] bg-[#f0f4e9] p-5 sm:p-6">
    <div className="flex items-center justify-between gap-3"><div><p className="flex items-center gap-2 text-[11px] text-[#91a17e]"><Sprout size={14}/>{th?'สวนของรอบนี้':'Your cycle garden'}</p><h2 className="mt-2 text-lg font-semibold text-[#5e754f]">{flowers.length} {th?'วันที่เราแวะมาจด':'days of little notes'}</h2></div><Image src="/animations/nori/teftel-cat-18.webp" alt="Nori" width={56} height={56} className="h-14 w-14 shrink-0"/></div>
    <div className="relative mt-4 h-52 overflow-hidden rounded-xl border border-[#dce6ce] bg-[#eaf0dd]">
      <svg aria-hidden="true" viewBox="0 0 600 220" preserveAspectRatio="none" className="absolute inset-0 h-full w-full"><rect width="600" height="220" fill="#edf2e4"/><circle cx="525" cy="28" r="15" fill="#e5dca4"/><path d="M0 84 Q120 40 260 87 T600 70 V220 H0Z" fill="#dfe9d1"/><path d="M0 137 Q120 90 310 124 T600 120 V220 H0Z" fill="#d3e0bd"/><path d="M600 220 H0 V190 Q180 152 330 183 T600 164Z" fill="#c2d4a7"/><path d="M315 75 C280 120 380 148 294 220 H350 C412 152 310 117 336 75Z" fill="#e4dcc2" opacity="0.8"/></svg>
      {flowers.map(day=><button key={day.day} type="button" aria-label={`${shortDate(day.date,th)} · ${money(day.amount)} ฿`} aria-pressed={selected===day.day} onClick={()=>setSelected(value=>value===day.day?null:day.day)} className={`absolute flex h-12 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[999px] transition-transform hover:-translate-y-[60%] focus-visible:outline-2 focus-visible:outline-[#97ab79] ${selected===day.day?'bg-[#fffff9]/60':''}`} style={{left:`${9+day.day%6*16}%`,top:`${32+Math.floor(day.day/6)*23}%`}}><Flower index={day.day}/></button>)}
    </div>
    <label className="mt-3 flex min-h-11 items-center gap-3 text-[10px] text-[#8f9f7e]">{th?'ย้อนดูสวน':'Revisit the garden'}<input type="range" min={1} max={sample.days.length} value={through} onChange={event=>{setThrough(Number(event.target.value));setSelected(null);}} aria-valuetext={`${shortDate(sample.days[through-1].date,th)} · ${flowers.length} ${th?'ดอก':'flowers'}`} className="min-w-0 flex-1 accent-[#91a374]"/></label>
    <p aria-live="polite" className="min-h-8 text-[10px] leading-6 text-[#8f9f7e]">{selection?`${shortDate(selection.date,th)} · ${th?'ใช้ไป':'Spent'} ${money(selection.amount)} ฿`:(th?'หนึ่งดอกต่อวันที่จดรายจ่าย · แตะดอกไม้เพื่อดูวันนั้น':'A flower for each recorded spending day · tap one to revisit it')}</p>
  </section>;
}
