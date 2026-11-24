'use client';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { filteredCycleRecords, type CycleSpendingData, type CycleSpendingRecord } from '@/lib/cycle-spending';

export default function CycleSpendingDetails({ cycleId, data, selected }: { cycleId: string; data: CycleSpendingData; selected: string[] }) {
  const { language } = useLanguage();
  const th = language === 'th';
  const [result, setResult] = useState<{ data: CycleSpendingData; records: CycleSpendingRecord[] } | null>(null);
  const [failed, setFailed] = useState<CycleSpendingData | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`/api/nori/analytics/cycles?cycleId=${encodeURIComponent(cycleId)}`, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Could not load records');
        const body: { records: CycleSpendingRecord[] } = await response.json();
        if (!controller.signal.aborted) { setResult({ data, records: body.records }); setFailed(null); }
      } catch { if (!controller.signal.aborted) setFailed(data); }
    };
    void load();
    return () => controller.abort();
  }, [cycleId, data, retry]);
  const records = useMemo(() => filteredCycleRecords(result?.data === data ? result.records : [], selected), [result, data, selected]);
  const categoryNames = new Map(data.categories.map(category => [category.id, category.name]));
  const money = (cents: number) => (cents / 100).toLocaleString(th ? 'th-TH' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const cycle = data.cycles.find(item => item.cycleId === cycleId);
  const date = (value: string) => new Date(value).toLocaleDateString(th ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' });
  return <section className="mt-6 border-t border-border pt-5" aria-label={th ? 'รายการรายจ่ายของ cycle ที่เลือก' : 'Selected cycle expenses'}>
    <h3 className="text-sm font-semibold">{th ? 'รายการที่รวมเป็นยอดนี้' : 'Expenses behind this total'}</h3>
    {cycle && <p className="mt-2 text-xs text-muted-foreground">{date(cycle.startDate)} – {date(cycle.endDate)} · {th ? 'ตามหมวดที่เลือก · ยอดหลังหักเงินคืน' : 'Selected categories · After refunds'}</p>}
    {failed === data ? <div role="alert" className="mt-4 text-sm"><p>{th ? 'โหลดรายการไม่สำเร็จ' : 'Could not load expenses.'}</p><button type="button" className="min-h-11 underline" onClick={() => { setFailed(null); setRetry(value => value + 1); }}>{th ? 'ลองอีกครั้ง' : 'Try again'}</button></div>
      : result?.data !== data ? <p role="status" className="mt-4 text-sm text-muted-foreground">{th ? 'กำลังโหลดรายการ…' : 'Loading expenses…'}</p>
      : <>
        <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">{records.length} {th ? 'รายการ' : 'expenses'} · {th ? 'รวม' : 'Total'} <strong className="font-mono text-foreground">฿{money(records.reduce((sum, record) => sum + record.amountCents, 0))}</strong></p>
        {records.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{selected.length === 0 ? (th ? 'เลือกหมวดเพื่อดูรายการ' : 'Select categories to see expenses.') : (th ? 'ไม่มีรายจ่ายในหมวดที่เลือกสำหรับรอบนี้' : 'No expenses in the selected categories for this cycle.')}</p>
          : <ul className="mt-3 max-h-[28rem] divide-y divide-[#e9e5da] overflow-y-auto">
            {records.map(record => <li key={record._id} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0"><p className="break-words text-sm">{record.name}</p><p className="mt-1 text-xs text-muted-foreground">{date(record.date)} · {categoryNames.get(record.category) ?? record.category}</p></div>
              <span className="shrink-0 font-mono text-sm">฿{money(record.amountCents)}</span>
            </li>)}
          </ul>}
      </>}
  </section>;
}
