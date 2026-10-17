'use client';

// Design study for the agreed scope: spending, cumulative trend, heatmap,
// categories + budgets, daily averages, payment usage, and a small interactive garden.
import { useState } from 'react';
import { CreditCard, Wallet, X } from 'lucide-react';
import { cycleDays } from '@/lib/spending-cycle.js';
import SpendingHeatmapCard from '@/components/nori/SpendingHeatmapCard';
import type { Transaction } from '@/lib/types';
import { Card, money, shortDate } from './ConceptParts';
import { dashboardSample, type DashboardSample } from './demo-data';
import CycleBloom from './CycleBloom';
import styles from './concepts.module.css';

export default function SpendingDashboard({ sample, th, offset }: { sample: DashboardSample; th: boolean; offset: number }) {
  const [day,setDay] = useState(sample.days.length-1);
  const [compare,setCompare] = useState(false);
  const [selected,setSelected] = useState<Transaction|null>(null);
  const previous = dashboardSample(offset-1,true);
  const elapsed = sample.days.length;
  const duration = cycleDays(sample.cycle);
  const axisDays = Math.max(duration,previous.days.length);
  let running = 0;
  const current: number[] = [];
  for(const item of sample.days) { running+=item.amount; current.push(running); }
  let priorTotal = 0;
  const prior: number[] = [];
  for(const item of previous.days) { priorTotal+=item.amount; prior.push(priorTotal); }
  const maximum = Math.ceil(Math.max(...current,...(compare?prior:[]),1)/1500)*1500;
  const point = (index:number,value:number) => `${38+index/(axisDays-1)*540},${184-value/maximum*146}`;
  const line = (values:number[]) => values.map((value,index)=>point(index,value)).join(' ');
  const dayX = 38+day/(axisDays-1)*540;
  const transactions: Transaction[] = sample.records.map(record=>({ _id:record.id,name:th?record.name:record.en,category:record.category,subCategory:record.subCategory,amount:-record.amount,date:record.date,displayDate:shortDate(record.date,th),paymentMethod:record.payment }));
  const methods = [{id:'cash',name:th?'เงินสด':'Cash',icon:Wallet,color:'#99ad86',tint:'#edf2e6'},{id:'bank',name:th?'บัญชีธนาคาร':'Bank account',icon:CreditCard,color:'#9cabb6',tint:'#edf0f3'}];

  return <div className="space-y-7">
    <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <Card className="flex h-full flex-col">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xs font-medium text-[#929d87]">{th?'ใช้ไปในรอบนี้':'Spent this cycle'}</h2><p className="mt-3 font-mono text-4xl font-medium tracking-tight text-[#4e6344] sm:text-5xl">{money(sample.total)}<span className="ml-2 text-lg text-[#a1ad95]">฿</span></p></div><div className="text-right"><p className="text-[10px] text-[#a1ad95]">{th?'รอบนี้ผ่านไป':'Cycle progress'}</p><p className="mt-2 font-mono text-sm text-[#8e9e7e]">{elapsed}<span className="text-[#c0c8b7]"> / {duration}</span> {th?'วัน':'days'}</p></div></div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0e7] pt-4"><h3 className="text-xs font-medium text-[#819174]">{th?'ยอดสะสมรายวัน':'Cumulative daily spending'}</h3><button type="button" aria-pressed={compare} onClick={()=>setCompare(value=>!value)} className={`min-h-10 rounded-[10px] px-3 text-[10px] ${compare?'bg-[#e8f0df] text-[#7d956a]':'bg-[#f5f6f0] text-[#a0aa94]'}`}>{th?'เทียบรอบก่อน':'Compare previous'}</button></div>
        <svg role="img" aria-label={th?'กราฟ total spent สะสมในรอบการใช้จ่าย':'Cumulative total spent across the spending cycle'} viewBox="0 0 610 218" className="mt-4 w-full">{[0,1,2,3].map(index=><g key={index}><line x1="38" x2="578" y1={38+index*49} y2={38+index*49} stroke="#eef0e7"/><text x="30" y={41+index*49} textAnchor="end" fontSize="8" fill="#b1baa4">{money(maximum*(3-index)/3)}</text></g>)}{compare&&<polyline points={line(prior)} fill="none" stroke="#c6c8bc" strokeWidth="2" strokeDasharray="4 5"/>}<polygon points={`38,184 ${line(current)} ${38+(current.length-1)/(axisDays-1)*540},184`} fill="#edf3e6"/><polyline points={line(current)} fill="none" stroke="#8ba27a" strokeWidth="2.5" strokeLinejoin="round"/><line x1={dayX} x2={dayX} y1="26" y2="185" stroke="#c5d2b7" strokeDasharray="3 4"/><circle cx={dayX} cy={184-current[day]/maximum*146} r="4.5" fill="#fffffb" stroke="#8ba27a" strokeWidth="2.5"/><text x="38" y="212" fontSize="9" fill="#abb69b">{shortDate(sample.cycle.startDate.toISOString(),th)}</text><text x="578" y="212" textAnchor="end" fontSize="9" fill="#abb69b">{shortDate(sample.cycle.endDate.toISOString(),th)}</text></svg>
        <label className="mt-auto flex min-h-11 items-center gap-3 text-[10px] text-[#9aa68e]">{th?'เลือกวัน':'Choose a day'}<input type="range" min={0} max={elapsed-1} value={day} onChange={event=>setDay(Number(event.target.value))} aria-valuetext={`${shortDate(sample.days[day].date,th)} · ${money(current[day])} THB`} className="min-w-0 flex-1 accent-[#93a97f]"/></label>
        <div aria-live="polite" className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl bg-[#f5f7f0] px-3 py-2.5 text-[10px] text-[#9aa68e]"><span>{shortDate(sample.days[day].date,th)} · {th?'ใช้ไป':'Spent'} <b className="font-mono font-normal text-[#7c906c]">{money(sample.days[day].amount)} ฿</b></span><span>{th?'สะสม':'Cumulative'} <b className="font-mono font-normal text-[#7c906c]">{money(current[day])} ฿</b></span>{compare&&<span className="w-full border-t border-[#e6ecdc] pt-1.5 text-[#a8af9e]">{th?'รอบก่อน ณวันลำดับเดียวกัน':'Previous cycle at the same day'} · {money(prior[day])} ฿</span>}</div>
      </Card>
      <div className={`${styles.legacyCard} ${styles.calendarCard}`}><SpendingHeatmapCard transactions={transactions} cycle={sample.cycle} isLoading={false} ready onEdit={setSelected}/></div>
    </div>

    <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <Card><header><h2 className="text-base font-semibold">{th?'เงินไปกับอะไรบ้าง':'Where your money goes'}</h2><p className="mt-1.5 text-xs leading-6 text-[#a1ad95]">{th?'ยอดใช้และงบในแต่ละหมวด อ่านไปด้วยกัน':'Your spending and category budgets, together'}</p></header>
        <div aria-hidden="true" className="mt-5 flex h-2 overflow-hidden rounded-[999px]">{sample.categories.map(category=><span key={category.id} style={{width:`${category.spent/sample.total*100}%`,background:category.color}}/>)}</div>
        <div className="mt-3 divide-y divide-[#eef0e7]">{sample.categories.map(category=><div key={category.id} className="py-4"><div className="flex items-center gap-3"><span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base" style={{background:category.tint}}>{category.icon}</span><div className="min-w-0 flex-1"><h3 className="text-xs font-medium">{th?category.name:category.en}</h3><p className="mt-1 text-[9px] text-[#a9b39f]">{Math.round(category.spent/sample.total*100)}% {th?'ของรายจ่ายทั้งหมด':'of all spending'}</p></div><span className="shrink-0 font-mono text-sm">{money(category.spent)}<small className="ml-1 text-[9px] text-[#a9b39f]">฿</small></span></div><div className="mt-3 sm:ml-12"><div className="h-1.5 overflow-hidden rounded-[999px] bg-[#eff2e9]"><div className="h-full rounded-[999px]" style={{width:`${Math.min(100,category.spent/category.limit*100)}%`,background:category.spent>category.limit?'#bf927d':category.color}}/></div><div className="mt-2 flex flex-wrap justify-between gap-2 text-[9px] text-[#a9b39f]"><span>{th?'งบ':'Budget'} {money(category.limit)} ฿</span><span className={category.spent>category.limit?'text-[#bf927d]':''}>{category.spent>category.limit?(th?'เกินงบ ':'Over by '):(th?'ยังเหลือ ':'Remaining ')}{money(Math.abs(category.limit-category.spent))} ฿</span></div></div></div>)}</div>
      </Card>
      <Card className="flex h-full flex-col"><h2 className="text-base font-semibold">{th?'เฉลี่ยแล้ว วันละเท่าไหร่':'What does a day look like?'}</h2><div className="mt-5"><p className="font-mono text-4xl font-medium text-[#6c805b]">{money(sample.total/elapsed)}<span className="ml-2 text-xs text-[#a1ad95]">฿ / {th?'วัน':'day'}</span></p><p className="mt-2 text-[10px] text-[#a9b39f]">{th?'รวมทุกหมวด ·':'All categories ·'} {elapsed} {th?'วันที่ผ่านไปในรอบ':'elapsed cycle days'}</p></div><h3 className="mt-6 border-t border-[#eef0e7] pt-5 text-[11px] text-[#9aa68e]">{th?'แบ่งเป็นแต่ละหมวด':'Daily average by category'}</h3><div className="mt-2 space-y-1">{sample.categories.map(category=><div key={category.id} className="flex min-h-11 items-center justify-between gap-3 text-[11px]"><span className="flex min-w-0 items-center gap-2 text-[#8f9e81]"><span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-[999px]" style={{background:category.color}}/>{th?category.name:category.en}</span><span className="shrink-0 font-mono">{money(category.spent/elapsed)} <small className="text-[9px] text-[#a9b39f]">฿</small></span></div>)}</div><details className="mt-auto border-t border-[#eef0e7] pt-2"><summary className="min-h-11 cursor-pointer pt-3 text-[10px] text-[#a9b39f]">{th?'ค่าเฉลี่ยนี้คิดจากอะไร':'How this average is calculated'}</summary><p className="pb-2 text-[10px] leading-6 text-[#a9b39f]">{th?'รายจ่ายในรอบ ÷ จำนวนวันที่ผ่านไป รวมวันที่ไม่ได้ใช้เงินด้วย ส่วนแต่ละหมวดใช้จำนวนวันเดียวกัน':'Cycle spending divided by elapsed days, including days with no spending. Each category uses the same number of days.'}</p></details></Card>
    </div>

    <div className="grid items-stretch gap-5 lg:grid-cols-2">
      <Card className="flex h-full flex-col"><h2 className="text-base font-semibold">{th?'ใช้จ่ายผ่านช่องทางไหน':'How you paid'}</h2><p className="mt-1.5 text-xs leading-6 text-[#a1ad95]">{th?'ยอดใช้ของแต่ละ payment method ในรอบนี้':'Spending by payment method in this cycle'}</p><div className="mt-5 divide-y divide-[#eef0e7]">{methods.map(method=>{const Icon=method.icon;const used=sample.records.filter(record=>record.payment===method.id);const spent=used.reduce((sum,record)=>sum+record.amount,0);return <div key={method.id} className="py-5"><div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{background:method.tint,color:method.color}}><Icon size={18}/></span><span className="min-w-0 flex-1"><h3 className="text-xs font-medium">{method.name}</h3><p className="mt-1.5 text-[9px] text-[#a9b39f]">{used.length} {th?'รายการ':'records'} · {Math.round(spent/sample.total*100)}%</p></span><span className="shrink-0 font-mono text-xl">{money(spent)} <small className="text-[10px] text-[#a9b39f]">฿</small></span></div><div className="mt-4 h-1.5 overflow-hidden rounded-[999px] bg-[#eff2e9]"><div className="h-full rounded-[999px]" style={{width:`${spent/sample.total*100}%`,background:method.color}}/></div></div>;})}</div><div className="mt-auto flex items-center justify-between gap-3 border-t border-[#eef0e7] pt-4 text-[11px] text-[#a1ad95]"><span>{th?'ยอดใช้รวมทุกวิธีจ่าย':'Total across payment methods'}</span><span className="font-mono text-[#829572]">{money(sample.total)} ฿</span></div></Card>
      <CycleBloom sample={sample} th={th}/>
    </div>

    {selected&&<aside role="status" aria-live="polite" className="fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[10001] mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-[#d6e1cb] bg-[#fffffb] p-5 shadow-xl lg:bottom-6"><div className="min-w-0"><p className="truncate text-sm font-medium">{selected.name} · {money(Math.abs(selected.amount))} ฿</p><p className="mt-1.5 text-[10px] text-[#a9b39f]">{shortDate(selected.date,th)} · {th?'รายการตัวอย่าง':'Sample record'}</p></div><button type="button" aria-label={th?'ปิดรายละเอียด':'Close details'} onClick={()=>setSelected(null)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f2f5eb] text-[#9bad8b]"><X size={16}/></button></aside>}
  </div>;
}
