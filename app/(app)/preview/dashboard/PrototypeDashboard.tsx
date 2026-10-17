'use client';

// Three fresh card/tile prototypes: a workspace, a day-focused view, and a category budget board.
// Fictional data only; no financial API calls or persistent edits.
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { dashboardSample, type DemoRecord } from './demo-data';
import { DayviewDashboard, BudgetboardDashboard } from './DashboardConcepts';
import { money, shortDate } from './ConceptParts';
import PrototypeSwitcher from '../PrototypeSwitcher';
import SpendingDashboard from './SpendingDashboard';

const options=[{key:'A',label:'Spending overview'},{key:'B',label:'Day view'},{key:'C',label:'Budget board'}];

export default function PrototypeDashboard({variant}:{variant:'A'|'B'|'C'}) {
  const {language}=useLanguage();
  const th=language==='th';
  const [offset,setOffset]=useState(0);
  const [selected,setSelected]=useState<DemoRecord|null>(null);
  const sample=useMemo(()=>dashboardSample(offset),[offset]);
  const changeCycle=(direction:number)=>{setOffset(value=>value+direction);setSelected(null);};
  return <main className="min-h-screen bg-[#f5f6f0] px-4 pb-40 pt-5 text-[#414a38] sm:px-8 sm:pt-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3 border-b border-[#e4e7da] pb-3 text-[10px] text-[#a2aa94]"><span className="min-w-0 flex-1 truncate">NEW DASHBOARD STUDIES / {options.find(option=>option.key===variant)?.label.toUpperCase()} / {th?'ข้อมูลสมมติ':'FICTIONAL DATA'}</span><div className="flex shrink-0 gap-3"><Link href="/preview" className="inline-flex min-h-11 items-center gap-1 hover:text-[#687e57]"><span className="sm:hidden">Home</span><span className="hidden sm:inline">Home preview</span></Link><Link href="/dashboard" className="inline-flex min-h-11 items-center gap-1 hover:text-[#687e57]">Dashboard<ArrowRight size={12}/></Link></div></div>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs text-[#a2aa94]">{variant==='A'?(th?'ยอดสะสม วันที่ใช้เงิน และงบในแต่ละหมวด':'Spending over time, across days and categories'):(th?'พื้นที่เล็ก ๆ สำหรับทำความเข้าใจเรื่องเงิน':'A little space to understand your spending')}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{variant==='A'?(th?'ภาพรวมของเรา':'Your overview'):variant==='B'?(th?'ทีละวัน ทีละเรื่อง':'One day, at a time'):(th?'วางแผนให้วันของเรา':'A plan for your days')}</h1></div><div className="flex items-center justify-between gap-1 rounded-xl border border-[#e2e6d7] bg-[#fffffb] px-1"><button type="button" aria-label={th?'รอบก่อนหน้า':'Previous cycle'} onClick={()=>changeCycle(-1)} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#a5ad98] hover:bg-[#f1f4e9]"><ChevronLeft size={16}/></button><span aria-live="polite" className="px-1 text-center text-[11px] text-[#7f8b6f]">{shortDate(sample.cycle.startDate.toISOString(),th)} — {shortDate(sample.cycle.endDate.toISOString(),th)}</span><button type="button" aria-label={th?'รอบถัดไป':'Next cycle'} onClick={()=>changeCycle(1)} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#a5ad98] hover:bg-[#f1f4e9]"><ChevronRight size={16}/></button></div></header>
      {variant==='A'?<SpendingDashboard key={`A-${offset}`} sample={sample} th={th} offset={offset}/>:variant==='B'?<DayviewDashboard key={`B-${offset}`} sample={sample} th={th} onSelect={setSelected}/>:<BudgetboardDashboard key={`C-${offset}`} sample={sample} th={th} onSelect={setSelected}/>}
      <p className="text-[10px] text-[#a6ae99]">{th?'ข้อมูลตัวอย่างทั้งหมด · บันทึกในหน่วยความจำเท่านั้น':'Entirely fictional data · interactions stay in this page'}</p>
    </div>
    {selected&&<aside role="status" aria-live="polite" className="fixed inset-x-4 bottom-[calc(11rem+env(safe-area-inset-bottom))] z-[10001] mx-auto flex max-w-lg items-center justify-between gap-4 rounded-2xl border border-[#d1ddc3] bg-[#fffffb] p-5 shadow-xl lg:bottom-24"><div><p className="text-sm font-medium">{th?selected.name:selected.en} · {money(selected.amount)} ฿</p><p className="mt-2 text-[10px] text-[#a2aa94]">{shortDate(selected.date,th)} · {th?'รายการตัวอย่าง ไม่แก้ข้อมูลจริง':'Sample record · read-only'}</p></div><button type="button" aria-label={th?'ปิดรายละเอียด':'Close details'} onClick={()=>setSelected(null)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f1f4e9] text-[#8a9c78]"><X size={16}/></button></aside>}
    {variant!=='A'&&<PrototypeSwitcher variant={variant} basePath="/preview/dashboard" options={options}/>}
  </main>;
}
