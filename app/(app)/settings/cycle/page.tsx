'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { useSpendingCycles } from '@/lib/use-spending-cycles';
import CycleEditor from '@/components/CycleEditor';

export default function CycleSettingsPage() {
  const { language } = useLanguage();
  const th = language === 'th';
  const { state, setState, error, retry } = useSpendingCycles();
  const [editing, setEditing] = useState(false);
  const [draftMode, setDraftMode] = useState<'fixed' | 'manual' | null>(null);
  const [draftDay, setDraftDay] = useState<string | null>(null);
  const mode = draftMode ?? state?.config.mode ?? 'fixed';
  const day = draftDay ?? String(state?.config.fixedDay ?? 30);
  const validDay = Number.isInteger(Number(day)) && Number(day) >= 1 && Number(day) <= 31;
  const changed = state && (mode !== state.config.mode || (mode === 'fixed' && Number(day) !== (state.config.fixedDay ?? 30)));
  return <main className="notebook-page notebook-page--app min-h-screen px-4 py-8 text-foreground"><div className="mx-auto max-w-xl">
    <Link href="/settings" className="inline-flex min-h-11 items-center text-xs text-muted-foreground">← {th ? 'กลับการตั้งค่า' : 'Settings'}</Link>
    <h1 className="notebook-title">{th ? 'รอบการใช้จ่าย' : 'Spending cycles'}</h1>
    <p className="mt-3 text-sm leading-7 text-muted-foreground">{th ? 'เลือกวันที่เริ่มรอบประจำ หรือกำหนดเองตามวันที่ได้รับเงิน' : 'Choose a recurring start day or start cycles yourself on payday.'}</p>
    {error && <p role="alert" className="mt-4 text-sm">{th ? 'โหลดรอบไม่สำเร็จ' : 'Could not load cycles.'} <button type="button" onClick={retry} className="min-h-11 px-3 underline">{th ? 'ลองอีกครั้ง' : 'Retry'}</button></p>}
    {!state && !error && <p role="status" className="mt-6 text-xs">{th ? 'กำลังโหลด…' : 'Loading…'}</p>}
    {state && <form onSubmit={event => { event.preventDefault(); setEditing(true); }} className="mt-6 border border-border bg-card p-6 shadow-[2px_3px_0_var(--paper-edge)]">
      <fieldset className="space-y-4"><legend className="mb-4 text-sm font-bold">{th ? 'เริ่มรอบการใช้จ่ายแบบไหน' : 'When should a cycle start?'}</legend>
        <div className={`border p-4 ${mode === 'fixed' ? 'border-primary bg-accent' : 'border-border'}`}>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold"><input type="radio" name="cycle-mode" value="fixed" checked={mode === 'fixed'} onChange={() => setDraftMode('fixed')} className="h-4 w-4 accent-primary"/>{th ? 'ทุกวันที่… ของเดือน' : 'Every month on day…'}</label>
          {mode === 'fixed' && <><label className="mt-2 block text-xs">{th ? 'วันที่เริ่มรอบ (1–31)' : 'Start day (1–31)'}<input required type="number" min="1" max="31" step="1" inputMode="numeric" value={day} onChange={event => setDraftDay(event.target.value)} className="mt-2 min-h-11 w-full border border-border bg-card px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"/></label><p className="mt-2 text-xs leading-6 text-muted-foreground">{th ? 'ถ้าเดือนไหนไม่มีวันที่เลือก จะเริ่มในวันสุดท้ายของเดือน' : 'Months without that day use the last day of the month.'}</p></>}
        </div>
        <div className={`border p-4 ${mode === 'manual' ? 'border-primary bg-accent' : 'border-border'}`}>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold"><input type="radio" name="cycle-mode" value="manual" checked={mode === 'manual'} onChange={() => setDraftMode('manual')} className="h-4 w-4 accent-primary"/>{th ? 'กำหนดเอง' : 'Custom'}</label>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">{th ? 'กดเริ่มรอบใหม่ที่ Dashboard เมื่อเงินเดือนเข้า รอบจะเปิดต่อจนกว่าจะเริ่มรอบถัดไป' : 'Start a new cycle from Dashboard on payday. It stays open until you start the next one.'}</p>
        </div>
      </fieldset>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">{th ? 'เปลี่ยนการตั้งค่าได้ทั้งสองแบบ โดยเก็บวันเริ่มรอบนี้และรอบที่ผ่านมาไว้' : 'Switch either way while preserving existing cycle start dates.'}</p>
      <button type="submit" disabled={!changed || (mode === 'fixed' && !validDay)} className="mt-4 min-h-11 bg-primary px-4 text-sm text-primary-foreground disabled:opacity-40">{th ? 'บันทึกการตั้งค่า' : 'Save settings'}</button>
      <Link href="/dashboard" className="mt-3 flex min-h-11 items-center text-xs text-muted-foreground underline">{th ? 'กลับ Dashboard' : 'Back to Dashboard'}</Link>
    </form>}
    {editing && state && <CycleEditor state={state} action="configure" mode={mode} fixedDay={Number(day)} onClose={() => setEditing(false)} onSaved={next => { setState(next); setDraftMode(null); setDraftDay(null); }}/>}
  </div></main>;
}
