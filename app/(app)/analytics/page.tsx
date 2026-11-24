'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { cumulativeSpending, type AnnualSpending } from '@/lib/annual-spending';
import styles from './analytics.module.css';
import CycleSpendingChart from '@/components/nori/CycleSpendingChart';

export default function AnalyticsPage() {
  const { language } = useLanguage();
  const th = language === 'th';
  const [data, setData] = useState<AnnualSpending | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setError(false);
      try {
        const response = await fetch('/api/nori/analytics', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load analytics');
        const result: AnnualSpending = await response.json();
        if (!controller.signal.aborted) { setData(result); setSelected(null); }
      } catch { if (!controller.signal.aborted) setError(true); }
    };
    void load();
    const refresh = () => { void load(); };
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.removeEventListener('focus', refresh); };
  }, [retry]);
  const days = useMemo(() => cumulativeSpending(data?.days ?? []), [data]);
  const money = (cents: number) => (cents / 100).toLocaleString(th ? 'th-TH' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateLabel = (date: string) => new Date(`${date}T00:00:00+07:00`).toLocaleDateString(th ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' });
  const total = days.at(-1)?.totalCents ?? 0;
  const index = Math.min(selected ?? days.length - 1, days.length - 1);
  const day = days[index];
  const maximum = Math.max(total, 100);
  const x = (i: number) => 76 + i / Math.max(days.length - 1, 1) * 784;
  const y = (value: number) => 270 - value / maximum * 230;
  const points = days.map((item, i) => `${x(i)},${y(item.totalCents)}`).join(' ');
  const card = 'notebook-leaf p-5 sm:p-8';
  return <main className="notebook-page notebook-page--app min-h-screen px-4 py-8 text-foreground sm:px-8 sm:py-12">
    <div className="mx-auto flex max-w-6xl flex-col gap-7">
      <header className="notebook-heading"><h1 className="notebook-title">{th ? 'มองย้อนการใช้เงินตลอดปี' : 'Your spending, across the year'}</h1><p className="mt-3 text-sm text-muted-foreground">{th ? 'ภาพรวมแต่ละ cycle และรายจ่ายสะสมตลอดปี · ตามเวลาไทย' : 'Cycle overview and cumulative annual spending · Bangkok time'}</p></header>
      {error ? <div className={card} role="alert"><p>{th ? 'โหลดข้อมูลไม่สำเร็จ' : 'Could not load your spending.'}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-3 min-h-11 rounded-md bg-primary px-5 text-sm text-primary-foreground">{th ? 'ลองอีกครั้ง' : 'Try again'}</button></div>
      : !data ? <p role="status" className={card}>{th ? 'กำลังรวมรายจ่ายของปีนี้…' : 'Gathering this year’s spending…'}</p>
      : <>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [th ? `รายจ่ายสะสมปี ${data.year}` : `${data.year} spending so far`, `฿${money(total)}`],
            [th ? 'เฉลี่ยต่อวันตั้งแต่ต้นปี' : 'Daily average since January 1', `฿${money(Math.round(total / Math.max(days.length, 1)))}`],
            [th ? 'วันที่มีรายจ่าย' : 'Days with spending', `${days.filter(item => item.amountCents > 0).length} / ${days.length}`],
          ].map(([label, value]) => <div key={label} className={card}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-3 break-words font-mono text-2xl font-semibold">{value}</p></div>)}
        </div>
        <CycleSpendingChart />
        <section className={card} aria-labelledby="spending-chart-title">
          <h2 id="spending-chart-title" className="text-lg font-semibold">{th ? 'รายจ่ายสะสม' : 'Cumulative spending'}</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{th ? 'เส้นยิ่งชัน คือช่วงที่ใช้เงินมากขึ้น · วันที่ไม่มีรายจ่าย เส้นจะราบ' : 'Steeper stretches mean more spending. Flat stretches mean no spending.'}</p>
          {total === 0 && <p className="mt-5 text-sm text-accent-foreground">{th ? 'ยังไม่มีรายจ่ายในปีนี้ เมื่อเริ่มบันทึก กราฟจะค่อย ๆ เติบโตที่นี่' : 'No spending recorded this year yet. Your chart will grow here as you record expenses.'}</p>}
          {day && <>
            <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2" aria-live="polite"><span className="font-mono text-2xl font-semibold">฿{money(day.totalCents)}</span><span className="text-xs text-muted-foreground">{dateLabel(day.date)} · {th ? 'รายจ่ายวันนี้' : 'Spent that day'} ฿{money(day.amountCents)}</span></div>
            <svg viewBox="0 0 900 320" role="img" aria-label={th ? `กราฟรายจ่ายสะสมปี ${data.year} รวม ${money(total)} บาท` : `${data.year} cumulative spending, total ${money(total)} baht`} className="mt-4 w-full cursor-crosshair"
              onClick={event => {
                const matrix = event.currentTarget.getScreenCTM();
                if (!matrix) return;
                const position = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
                const nearest = Math.round((position.x - x(0)) / 784 * (days.length - 1));
                setSelected(Math.max(0, Math.min(days.length - 1, nearest)));
              }}>
              {[0, 1, 2, 3, 4].map(tick => { const value = maximum * tick / 4; return <g key={tick}><line x1="76" x2="860" y1={y(value)} y2={y(value)} stroke="#e9e5da" /><text x="66" y={y(value) + 4} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">{(value / 100).toLocaleString('en', { notation: 'compact', maximumFractionDigits: 1 })}</text></g>; })}
              <polygon className={styles.area} points={`76,270 ${points} ${x(days.length - 1)},270`} fill="var(--accent)" />
              <polyline className={styles.line} pathLength={1} points={points} fill="none" stroke="var(--accent-foreground)" strokeWidth="3" strokeLinejoin="round" />
              {days.filter(item => item.date.endsWith('-01')).map(item => { const i = days.indexOf(item); return <text key={item.date} x={x(i)} y="300" textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">{new Date(`${item.date}T12:00:00+07:00`).toLocaleDateString(th ? 'th-TH' : 'en', { month: 'short', timeZone: 'Asia/Bangkok' })}</text>; })}
              <g className={styles.marker}><line x1={x(index)} x2={x(index)} y1="30" y2="270" stroke="#9bac8c" strokeDasharray="4 5" />
              <circle cx={x(index)} cy={y(day.totalCents)} r="5" fill="var(--card)" stroke="var(--accent-foreground)" strokeWidth="3" /></g>
            </svg>
            <label className="flex min-h-11 flex-wrap items-center gap-3 text-xs text-muted-foreground">{th ? 'แตะกราฟหรือเลื่อนเพื่อเลือกวัน' : 'Tap the chart or slide to pick a day'}<input type="range" min="0" max={days.length - 1} value={index} onChange={event => setSelected(Number(event.target.value))} aria-valuetext={`${dateLabel(day.date)}: ${money(day.totalCents)} ${th ? 'บาทสะสม' : 'baht cumulative'}`} className="min-h-11 min-w-32 flex-1 accent-accent-foreground" /></label>
          </>}
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{th ? 'รวมเฉพาะรายจ่ายหลังหักเงินคืน ไม่รวมรายรับและการโอนระหว่างกระเป๋า · เงินคืนจะปรับยอดในวันที่ของรายการเดิม' : 'Expenses after refunds, excluding income and wallet transfers. Refunds adjust the original transaction date.'}</p>
        </section>
      </>}
    </div>
  </main>;
}
