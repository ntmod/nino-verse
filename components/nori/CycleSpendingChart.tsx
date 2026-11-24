'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import CycleSpendingDetails from './CycleSpendingDetails';
import { useLanguage } from '@/lib/language-context';
import { cycleDailyAverage, filteredCycleTotals, type CycleSpendingData } from '@/lib/cycle-spending';

export default function CycleSpendingChart() {
  const { language } = useLanguage();
  const th = language === 'th';
  const [data, setData] = useState<CycleSpendingData | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [average, setAverage] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const initialized = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    let generation = 0;
    const load = async () => {
      const request = ++generation;
      setError(false);
      try {
        const response = await fetch('/api/nori/analytics/cycles', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Could not load cycles');
        const result: CycleSpendingData = await response.json();
        if (!controller.signal.aborted && request === generation) {
          setData(result);
          if (!initialized.current) {
            setSelected(result.categories.map(category => category.id));
            initialized.current = true;
          }
        }
      } catch { if (!controller.signal.aborted && request === generation) setError(true); }
    };
    void load();
    window.addEventListener('focus', load);
    window.addEventListener('nori:cycles-changed', load);
    return () => { controller.abort(); window.removeEventListener('focus', load); window.removeEventListener('nori:cycles-changed', load); };
  }, [retry]);
  const rows = useMemo(() => data ? filteredCycleTotals(data, selected).map(row => ({ ...row, displayCents: average ? cycleDailyAverage(row.amountCents, row, data.asOf) : row.amountCents })) : [], [data, selected, average]);
  const maximum = Math.max(...rows.map(row => row.displayCents), 100);
  const money = (cents: number) => (cents / 100).toLocaleString(th ? 'th-TH' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const date = (value: string) => new Date(value).toLocaleDateString(th ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' });
  const chosen = rows.find(row => row.cycleId === active) ?? rows.at(-1);
  return <section className="rounded-md border border-border bg-card p-5 sm:p-8" aria-labelledby="cycle-spending-title">
    <h2 id="cycle-spending-title" className="text-lg font-semibold">{th ? 'รายจ่ายแต่ละ cycle' : 'Spending by cycle'}</h2>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{th ? 'เรียงจากรอบที่คร่อมต้นปีถึงรอบปัจจุบัน · รวมเต็มรอบ แม้เริ่มก่อน 1 ม.ค.' : 'From the cycle spanning January 1 to the current cycle · Includes full cycles, even when starting before January 1.'}</p>
    {error ? <div role="alert" className="mt-5"><p>{th ? 'โหลดข้อมูลไม่สำเร็จ' : 'Could not load cycles.'}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-2 min-h-11 underline">{th ? 'ลองอีกครั้ง' : 'Try again'}</button></div> : !data ? <p role="status" className="mt-5">{th ? 'กำลังรวมยอดแต่ละรอบ…' : 'Loading cycles…'}</p> : <>
      <fieldset className="mt-5"><legend className="text-xs font-semibold text-muted-foreground">{th ? 'หมวดที่รวมในกราฟแท่ง' : 'Categories included in this chart'}</legend>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setSelected(data.categories.map(category => category.id))} className="min-h-11 px-2 text-xs underline">{th ? 'เลือกทั้งหมด' : 'Select all'}</button>
          <button type="button" onClick={() => setSelected([])} className="min-h-11 px-2 text-xs underline">{th ? 'ล้างการเลือก' : 'Clear'}</button>
          {data.categories.map(category => <label key={category.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-xs"><input type="checkbox" checked={selected.includes(category.id)} onChange={event => setSelected(previous => event.target.checked ? [...previous, category.id] : previous.filter(id => id !== category.id))} className="size-4 accent-accent-foreground" />{category.name}</label>)}
        </div>
      </fieldset>
      <fieldset className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground"><legend className="mb-2 font-semibold">{th ? 'ค่าที่แสดงในกราฟ' : 'Chart measure'}</legend>
        <label className="flex min-h-11 items-center gap-2"><input type="radio" name="cycle-measure" checked={!average} onChange={() => setAverage(false)} className="accent-accent-foreground" />{th ? 'ยอดรวม' : 'Total'}</label>
        <label className="flex min-h-11 items-center gap-2"><input type="radio" name="cycle-measure" checked={average} onChange={() => setAverage(true)} className="accent-accent-foreground" />{th ? 'เฉลี่ยต่อวัน' : 'Daily average'}</label>
      </fieldset>
      {average && <p className="text-xs text-muted-foreground">{th ? 'นับทุกวันในรอบ รวมวันที่ไม่มีรายจ่าย · รอบปัจจุบันนับถึงวันนี้' : 'Includes days without spending. The current cycle uses elapsed days through today.'}</p>}
      {selected.length === 0 && <p className="mt-4 text-sm text-muted-foreground">{th ? 'เลือกอย่างน้อยหนึ่งหมวดเพื่อดูรายจ่าย' : 'Select at least one category to see spending.'}</p>}
      {chosen && <p aria-live="polite" className="mt-5 text-sm"><span className="font-mono text-2xl font-semibold">฿{money(chosen.displayCents)}{average && (th ? ' / วัน' : ' / day')}</span><span className="ml-3 text-xs text-muted-foreground">{date(chosen.startDate)} – {date(chosen.endDate)}{chosen.isCurrent && (th ? ' · ยังไม่จบรอบ' : ' · In progress')}</span></p>}
      <div className="mt-5 overflow-x-auto pb-2" tabIndex={0} role="region" aria-label={th ? 'กราฟแท่ง เลื่อนแนวนอนเพื่อดูทุกรอบ' : 'Cycle bar chart. Scroll horizontally to explore all cycles.'}>
        <div className="flex gap-3 border-b border-border" style={{ minWidth: Math.max(rows.length * 92, 280) }}>
          {rows.map(row => <button key={row.cycleId} type="button" onClick={() => setActive(row.cycleId)} aria-pressed={chosen?.cycleId === row.cycleId} aria-label={`${date(row.startDate)} – ${date(row.endDate)}: ${money(row.displayCents)} ${average ? (th ? 'บาทต่อวัน' : 'baht per day') : (th ? 'บาท' : 'baht')}${row.isCurrent ? (th ? ' ยังไม่จบรอบ' : ' In progress') : ''}`} className="group flex min-w-0 flex-1 flex-col items-center rounded-t-md px-1 pt-3 focus-visible:outline-2 focus-visible:outline-accent-foreground">
            <span className="mb-2 whitespace-nowrap text-[10px] text-muted-foreground">฿{(row.displayCents / 100).toLocaleString('en', { notation: 'compact', maximumFractionDigits: 1 })}</span>
            <span className="flex h-48 w-full items-end justify-center"><span className={`w-full max-w-12 rounded-t-md border-2 border-accent-foreground transition-[height] duration-500 motion-reduce:transition-none ${row.isCurrent ? 'border-dashed bg-[#dbe5d1]' : 'bg-[#7d987a]'} ${chosen?.cycleId === row.cycleId ? 'opacity-100' : 'opacity-65 group-hover:opacity-100'}`} style={{ height: `${Math.max(row.displayCents / maximum * 100, 1)}%` }} /></span>
            <span className="mt-3 min-h-12 text-[10px] leading-relaxed text-muted-foreground">{date(row.startDate)}<br />{row.isCurrent ? (th ? 'รอบปัจจุบัน' : 'Current') : date(row.endDate)}</span>
          </button>)}
        </div>
      </div>
      {rows.length === 0 && <p className="mt-4 text-sm text-muted-foreground">{th ? 'ยังไม่มี cycle ในปีนี้' : 'No cycles this year yet.'}</p>}
      {selected.length > 0 && rows.length > 0 && rows.every(row => row.amountCents === 0) && <p className="mt-4 text-sm text-muted-foreground">{th ? 'ไม่มีรายจ่ายในหมวดที่เลือก' : 'No spending in the selected categories.'}</p>}
      {active && chosen && <CycleSpendingDetails key={chosen.cycleId} cycleId={chosen.cycleId} data={data} selected={selected} />}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{th ? 'ยอดหลังหักเงินคืน · แต่ละ cycle อาจยาวไม่เท่ากัน · ฟิลเตอร์นี้ไม่เปลี่ยนกราฟสะสมด้านล่าง' : 'After refunds · Cycle lengths may vary · These filters do not change the cumulative chart below.'}</p>
    </>}
  </section>;
}
