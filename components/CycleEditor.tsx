'use client';
import { useRef, useState } from 'react';
import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { bangkokDay, type CycleChange, type CycleState } from '@/lib/cycle-config';
import { cycleService, type CyclePreview } from '@/lib/services/cycleService';

export default function CycleEditor({ state, action, boundary, mode, fixedDay, onClose, onSaved }: {
  state: CycleState; action: CycleChange['action']; boundary?: string; mode?: 'fixed' | 'manual'; fixedDay?: number; onClose: () => void; onSaved: (state: CycleState) => void;
}) {
  const { language } = useLanguage();
  const th = language === 'th';
  const [date, setDate] = useState(action === 'start' ? bangkokDay() : bangkokDay(new Date(boundary ?? state.cycles[state.currentIndex].startDate)));
  const [preview, setPreview] = useState<CyclePreview | null>(null);
  const lock = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const format = (value: string) => new Date(value).toLocaleDateString(th ? 'th-TH' : 'en-US', { day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Bangkok' });
  const title = action === 'configure' ? (th ? 'ตรวจการตั้งค่ารอบ' : 'Review cycle settings') : action === 'activate' ? (th ? 'ใช้รอบเริ่มเอง' : 'Enable manual cycles') : action === 'start' ? (th ? 'เงินเดือนเข้าแล้ว · เริ่มรอบใหม่' : 'Payday · Start a new cycle') : (th ? 'แก้ไขวันเริ่มรอบนี้' : 'Edit this cycle’s start');
  const submit = async () => {
    if (lock.current) return;
    lock.current = true;
    setSaving(true); setError(''); setNotice('');
    const change = { action, date, boundary, mode, fixedDay };
    try {
      if (preview) {
        const next = await cycleService.confirm(change, state.config.revision, preview.previewHash);
        onSaved(next); window.dispatchEvent(new Event('nori:cycles-changed')); onClose();
      } else { setPreview(await cycleService.preview(change, state.config.revision)); setNotice(th ? 'ตรวจผลกระทบด้านล่างก่อนยืนยัน' : 'Review the impact below before confirming.'); }
    } catch (failure) {
      setPreview(null);
      const changed = failure instanceof Error && failure.message.includes('changed');
      setError(changed ? (th ? 'ข้อมูลเปลี่ยนแล้ว ปิดหน้าต่างแล้วลองใหม่อีกครั้ง' : 'Data changed. Close and try again.') : (th ? 'บันทึกไม่ได้ ตรวจวันที่ให้อยู่ระหว่างรอบข้างเคียงและไม่เกินวันนี้ แล้วลองใหม่' : 'Check that the date is between neighboring cycles and no later than today, then retry.'));
    } finally { lock.current = false; setSaving(false); }
  };
  const changedIndex = action === 'configure' ? (preview?.state.currentIndex ?? -1) : preview?.state.cycles.findIndex(cycle => bangkokDay(new Date(cycle.startDate)) === date) ?? -1;
  const affectedRanges = preview && changedIndex >= 0 ? preview.state.cycles.slice(Math.max(0, changedIndex - 1), changedIndex + 1) : [];
  return <Dialog.Root open onOpenChange={open => { if (!open && !saving) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[22000] bg-[#292722]/35 backdrop-blur-sm"/>
    <Dialog.Content className="fixed left-1/2 top-1/2 z-[22001] flex max-h-[90dvh] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col border border-[#ddd4c4] bg-[#fffdf7] p-5 text-[#423c30] shadow-xl sm:p-7">
      <div className="flex shrink-0 items-center justify-between gap-3"><Dialog.Title className="text-lg font-bold">{title}</Dialog.Title><button type="button" disabled={saving} onClick={onClose} aria-label={th ? 'ปิด' : 'Close'} className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#ddd4c4]"><X aria-hidden="true" size={16}/></button></div>
      <Dialog.Description className="mt-2 shrink-0 text-xs leading-6 text-[#94866d]">{th ? 'รอบก่อนหน้าจะสิ้นสุดก่อนวันเริ่มนี้หนึ่งวัน รายการอยู่วันเดิม แต่ยอดและงบจะคำนวณตามขอบเขตใหม่' : 'The preceding cycle ends the day before this start. Records retain their dates; totals and budgets follow the new boundaries.'}</Dialog.Description>
      <form onSubmit={event => { event.preventDefault(); void submit(); }} className="mt-4 flex min-h-0 flex-col">
        {action === 'configure' ? <p className="text-sm leading-7">{mode === 'fixed' ? (th ? `เริ่มรอบใหม่ทุกวันที่ ${fixedDay} ของเดือน หากเดือนไหนไม่มีวันนั้น จะใช้วันสุดท้ายของเดือน` : `Start each cycle on day ${fixedDay}. Short months use their last day.`) : (th ? 'กำหนดเอง: รอบปัจจุบันจะเปิดต่อจนกว่าจะกดเริ่มรอบใหม่ที่ Dashboard' : 'Custom: the current cycle stays open until you start the next one on Dashboard.')} <span className="block text-xs text-[#94866d]">{th ? 'ใช้กับรอบถัดไป วันเริ่มของรอบนี้และรอบที่ผ่านมายังคงเดิม' : 'Applies going forward. Existing cycle start dates are preserved.'}</span></p> : <label className="shrink-0 text-xs">{th ? 'วันเริ่มรอบ' : 'Cycle start'}<input required type="date" min="1900-01-01" disabled={saving} max={bangkokDay()} value={date} onChange={event => { setDate(event.target.value); setPreview(null); setNotice(''); setError(''); }} className="mt-2 min-h-11 w-full border border-[#ded5c5] bg-[#faf7ef] px-3"/></label>}
        {error && <p role="alert" className="mt-3 text-xs text-[#b0523b]">{error}</p>}
        {notice && <p role="status" className="mt-3 text-xs text-[#416b54]">{notice}</p>}
        {preview && <div className="mt-4 min-h-0 overflow-y-auto border-y border-dashed border-[#ded5c5] py-4 text-xs leading-6">
          <ul className="mb-3 space-y-1">{affectedRanges.map(cycle => <li key={cycle.cycleId}>{format(cycle.startDate)} – {cycle.isOpen ? (th ? 'ปัจจุบัน' : 'Present') : format(cycle.endDate)}</li>)}</ul>
          <p className="font-bold">{th ? 'รายการที่จะเปลี่ยนรอบ' : 'Records changing cycle'}: {preview.impact.recordsMoved}</p>
          <p>{th ? 'การย้ายงบที่จะเปลี่ยนรอบ' : 'Budget transfers changing cycle'}: {preview.impact.transfersMoved}</p>
          {action === 'start' && preview.impact.walletChanges.length > 0 && <p className="mt-2 text-[#416b54]">{th ? 'รอบใหม่เริ่มด้วยงบตั้งต้นของแต่ละกระเป๋า งบย้ายของรอบก่อนจะไม่ยกมา' : 'The new cycle starts with each wallet’s base budget. Previous transfers do not carry over.'}</p>}
          {preview.impact.walletChanges.length > 0 && <><h3 className="mt-3 font-bold">{th ? 'งบคงเหลือที่เปลี่ยน' : 'Changes in remaining budgets'}</h3><ul className="divide-y divide-[#e7dfd0]">{preview.impact.walletChanges.map((wallet,index) => <li key={index} className="py-2"><p>{wallet.walletName} · {th ? 'รอบเริ่ม' : 'Starting'} {format(wallet.cycleKey)}</p><p className="font-mono">{wallet.beforeCents === null ? '—' : (wallet.beforeCents/100).toFixed(2)} → {wallet.afterCents === null ? '—' : (wallet.afterCents/100).toFixed(2)} ฿</p></li>)}</ul></>}
          {preview.impact.transfers.map(transfer => <p key={transfer._id} className="mt-2 text-[#94866d]">{format(transfer.createdAt)} · {(transfer.amountCents/100).toFixed(2)} ฿ · {format(transfer.beforeCycle)} → {format(transfer.afterCycle)}</p>)}
        </div>}
        <div className="mt-4 flex shrink-0 gap-2"><button type="submit" disabled={saving} className="min-h-11 bg-[#4d654b] px-4 text-sm font-bold text-white disabled:opacity-50">{saving ? (th ? 'กำลังตรวจและบันทึก…' : 'Working…') : preview ? (th ? 'ยืนยันการเปลี่ยนรอบ' : 'Confirm change') : (th ? 'ตรวจผลกระทบก่อน' : 'Preview impact')}</button><button type="button" disabled={saving} onClick={onClose} className="min-h-11 border border-[#ddd4c4] px-4 text-xs">{th ? 'ยกเลิก' : 'Cancel'}</button></div>
      </form>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
