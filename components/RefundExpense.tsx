'use client';
import { useRef, useState } from 'react';
import { Dialog } from 'radix-ui';
import { useLanguage } from '@/lib/language-context';
import { moneyCents } from '@/lib/money-cents.mjs';
import type { Transaction } from '@/lib/types';

export default function RefundExpense({ transaction, onSaved, onClose }: { transaction: Transaction; onSaved: (transaction: Transaction) => void; onClose: () => void }) {
  const { language } = useLanguage();
  const th = language === 'th';
  const [kind, setKind] = useState<'refund' | 'cancel'>('refund');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const request = useRef<{ fingerprint: string; id: string } | null>(null);
  const submit = async () => {
    if (lock.current) return;
    try { if (kind === 'refund' && moneyCents(amount) > Math.round(-transaction.amount * 100)) throw Error(); }
    catch { setError(th ? 'ตรวจยอดคืนเงิน ต้องไม่เกินยอดสุทธิที่เหลือ' : 'Refund must not exceed the remaining expense.'); return; }
    lock.current = true; setSaving(true); setError('');
    try {
      const fingerprint = JSON.stringify([kind, amount]);
      if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, id: crypto.randomUUID() };
      const response = await fetch(`/api/nori/transaction/${transaction._id}/refund`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, amount, requestId: request.current.id }) });
      if (!response.ok) throw Error(String(response.status));
      onSaved(await response.json()); onClose();
    } catch (failure) { setError(failure instanceof Error && failure.message === '409' ? (th ? 'รายการเปลี่ยนแล้ว ปิดแล้วโหลดรายการล่าสุดก่อนลองใหม่' : 'Expense changed. Close and refresh before retrying.') : (th ? 'คืนเงินไม่สำเร็จ ลองอีกครั้งได้' : 'Could not refund. Please retry.')); }
    finally { lock.current = false; setSaving(false); }
  };
  return <Dialog.Root open onOpenChange={open => { if (!open && !saving) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[22000] bg-[#292722]/35 backdrop-blur-sm"/>
    <Dialog.Content className="fixed left-1/2 top-1/2 z-[22001] max-h-[90dvh] w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-[#ddd4c4] bg-[#fffdf7] p-6 text-[#423c30] shadow-xl">
      <Dialog.Title className="text-lg font-bold">{th ? 'คืนเงิน / ยกเลิกรายจ่าย' : 'Refund / Cancel expense'}</Dialog.Title>
      <Dialog.Description className="mt-3 text-xs leading-6 text-[#887b65]">{transaction.name} · {th ? 'ยอดสุทธิคงเหลือ' : 'Remaining expense'} {(-transaction.amount).toFixed(2)} ฿<br/>{th ? 'ปรับยอดในรอบเดิมและคืนงบให้กระเป๋าเดิม (ถ้ามี) ไม่นับเป็นรายรับ ประวัติยังอยู่ครบ หลังคืนเงินจะไม่สามารถแก้ไขรายการนี้ได้' : 'Adjusts the original cycle and wallet, if any. This is not income. History is preserved. Refunded records cannot be edited.'}</Dialog.Description>
      <form onSubmit={event => { event.preventDefault(); void submit(); }} className="mt-4">
        <fieldset disabled={saving} className="space-y-3">
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="refund-kind" checked={kind === 'refund'} onChange={() => setKind('refund')}/>{th ? 'คืนเงินบางส่วนหรือเต็มจำนวน' : 'Partial or full refund'}</label>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="refund-kind" checked={kind === 'cancel'} onChange={() => setKind('cancel')}/>{th ? 'ยกเลิกรายจ่าย · คืนยอดที่เหลือทั้งหมด' : 'Cancel expense · Return the entire remainder'}</label>
          {kind === 'refund' && <label className="block text-xs">{th ? 'จำนวนเงินที่คืน · บาท' : 'Refund amount · THB'}<input required type="number" inputMode="decimal" min="0.01" step="0.01" max={-transaction.amount} value={amount} onChange={event => setAmount(event.target.value)} className="mt-2 min-h-11 w-full border border-[#ded5c5] bg-[#faf7ef] px-3"/></label>}
          {error && <p role="alert" className="text-xs text-[#b0523b]">{error}</p>}
          <div className="flex gap-2 pt-3"><button type="submit" className="min-h-11 bg-[#4d654b] px-4 text-sm text-white">{saving ? (th ? 'กำลังบันทึก…' : 'Saving…') : (th ? 'ยืนยัน' : 'Confirm')}</button><button type="button" onClick={onClose} className="min-h-11 border border-[#ddd4c4] px-4 text-sm">{th ? 'ปิด' : 'Close'}</button></div>
        </fieldset>
      </form>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
