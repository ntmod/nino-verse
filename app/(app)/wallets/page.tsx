'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRightLeft, Plus, Pencil, Wallet } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { walletService } from '@/lib/services/walletService';
import { moneyCents, type WalletSnapshot, type WalletSummary } from '@/lib/wallet-budget';

const paper = 'rounded-md border border-border bg-card p-5 shadow-[2px_3px_0_var(--paper-edge)]';
const input = 'mt-2 min-h-11 w-full border border-border bg-secondary px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring';
const button = 'min-h-11 border border-border px-4 py-2 text-xs hover:bg-secondary disabled:opacity-50';

export default function WalletsPage() {
  const { language } = useLanguage();
  const th = language === 'th';
  const [snapshot, setSnapshot] = useState<WalletSnapshot | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [action, setAction] = useState<'wallet' | 'transfer' | null>(null);
  const [editingId, setEditingId] = useState('');
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const transferRequest = useRef<{ fingerprint: string; id: string } | null>(null);
  const editor = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    try { setSnapshot(await walletService.getAll()); setLoadError(false); }
    catch { setLoadError(true); }
  }, []);
  useEffect(() => {
    let active = true;
    walletService.getAll().then(data => { if (active) { setSnapshot(data); setLoadError(false); } })
      .catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, []);
  const money = (cents: number) => (cents / 100).toLocaleString(th ? 'th-TH' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const allWallets = snapshot?.wallets ?? [];
  const wallets = allWallets.filter(wallet => !wallet.archived);
  const archived = allWallets.filter(wallet => wallet.archived);
  const archive = async (wallet: WalletSummary, value: boolean) => {
    if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    try { await walletService.archive(wallet._id, value); setNotice(th ? (value ? 'เก็บกระเป๋าแล้ว ประวัติยังอยู่ครบ' : 'นำกระเป๋ากลับมาแล้ว') : (value ? 'Archived. History is preserved.' : 'Wallet restored.')); await load(); }
    catch { setError(th ? 'เปลี่ยนสถานะไม่สำเร็จ ลองอีกครั้ง' : 'Could not update wallet. Please retry.'); }
    finally { lock.current = false; setSaving(false); }
  };
  const source = wallets.find(wallet => wallet._id === from);
  const openWallet = (wallet?: WalletSummary) => {
    setEditingId(wallet?._id ?? ''); setName(wallet?.name ?? ''); setBudget(wallet ? (wallet.budgetCents / 100).toFixed(2) : '');
    setAction('wallet'); setError(''); setNotice('');
    requestAnimationFrame(() => { editor.current?.scrollIntoView({ block: 'start' }); editor.current?.querySelector('input')?.focus(); });
  };
  const openTransfer = (wallet?: WalletSummary) => {
    setFrom(wallet?._id ?? wallets[0]?._id ?? '');
    setTo(wallets.find(item => item._id !== (wallet?._id ?? wallets[0]?._id))?._id ?? '');
    setAmount(''); setAction('transfer'); setError(''); setNotice(''); transferRequest.current = null;
    requestAnimationFrame(() => editor.current?.scrollIntoView({ block: 'start' }));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (lock.current) return;
    setError(''); setNotice('');
    try {
      if (action === 'wallet') { moneyCents(budget, true); if (!name.trim()) throw Error(); }
      else { const cents = moneyCents(amount); if (!source || from === to || cents > source.remainingCents) throw Error(); }
    } catch { setError(th ? 'ตรวจชื่อ จำนวนเงิน และงบคงเหลืออีกครั้ง' : 'Check the name, amount and available budget.'); return; }
    lock.current = true; setSaving(true);
    try {
      if (action === 'wallet') {
        if (editingId) await walletService.update(editingId, { name, budget });
        else await walletService.create({ name, budget });
        setNotice(th ? 'บันทึกกระเป๋าแล้ว' : 'Wallet saved.');
      } else {
        const fingerprint = JSON.stringify([from, to, amount]);
        if (transferRequest.current?.fingerprint !== fingerprint) transferRequest.current = { fingerprint, id: crypto.randomUUID() };
        await walletService.transfer({ fromWalletId: from, toWalletId: to, amount, requestId: transferRequest.current.id });
        transferRequest.current = null;
        setNotice(th ? 'ย้ายงบแล้ว ยอดใช้จ่ายรวมไม่เปลี่ยน' : 'Budget transferred. Total spending is unchanged.');
      }
      setAction(null); void load();
    } catch (failure) {
      const insufficient = failure instanceof Error && failure.message === 'Insufficient budget';
      setError(insufficient ? (th ? 'งบต้นทางไม่พอ กดโหลดข้อมูลล่าสุดแล้วลองอีกครั้ง' : 'Insufficient budget. Refresh and try again.') : (th ? 'บันทึกไม่สำเร็จ ข้อมูลยังอยู่ ลองอีกครั้งได้' : 'Could not save. Your input is kept; please retry.'));
    } finally { lock.current = false; setSaving(false); }
  };
  return <main className="notebook-page notebook-page--app min-h-screen px-4 py-6 pb-24 text-foreground sm:px-8">
    <div className="mx-auto max-w-3xl">
      <Link href="/home" className="inline-flex min-h-11 items-center gap-2 text-xs text-muted-foreground"><ArrowLeft aria-hidden="true" size={14}/>{th ? 'กลับไปจดรายการ' : 'Back to Home'}</Link>
      <header className="mb-6 mt-4"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">NoriNote / Budget envelopes</p><h1 className="notebook-title"><Wallet aria-hidden="true"/>{th ? 'กระเป๋างบของเรา' : 'Our budget wallets'}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{th ? 'แบ่งงบกินข้าว เที่ยว หรือสิ่งที่อยากเก็บไว้ใช้ แต่ละ cycle เริ่มด้วยงบที่ตั้งไว้ใหม่' : 'Set aside a budget for meals, travel, or anything else. Each cycle starts with your configured budget.'}</p></header>
      {snapshot && <p className="mb-4 text-xs text-muted-foreground">{th ? 'รอบนี้' : 'This cycle'} · {new Date(snapshot.cycleKey).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {day:'numeric',month:'short', timeZone:'Asia/Bangkok'})} – {snapshot.isOpen ? (th ? 'ปัจจุบัน' : 'Present') : new Date(snapshot.cycleEnd).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Bangkok'})}</p>}
      <div className="mb-5 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => openWallet()} className={`${button} flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover`}><Plus aria-hidden="true" size={15}/>{th ? 'เพิ่มกระเป๋า' : 'Add wallet'}</button><button type="button" disabled={saving || wallets.length < 2} onClick={() => openTransfer()} className={`${button} flex items-center gap-2`}><ArrowRightLeft aria-hidden="true" size={15}/>{th ? 'ย้ายงบ' : 'Transfer budget'}</button><button type="button" disabled={saving} onClick={() => void load()} className={button}>{th ? 'โหลดข้อมูลล่าสุด' : 'Refresh'}</button></div>
      {notice && <p role="status" className="mb-4 border border-[#c8d7bd] bg-accent p-4 text-sm text-primary">{notice}</p>}
      {loadError && <p role="alert" className="mb-4 text-sm text-destructive">{th ? 'โหลดกระเป๋าไม่สำเร็จ กดโหลดข้อมูลล่าสุดเพื่อลองอีกครั้ง' : 'Could not load wallets. Use Refresh to retry.'}</p>}
      {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
      <div ref={editor} className="scroll-mt-20">
      {action && <form onSubmit={submit} className={`${paper} mb-6`}>
        <h2 className="mb-4 font-bold">{action === 'wallet' ? (editingId ? (th ? 'แก้ไขกระเป๋า' : 'Edit wallet') : (th ? 'เพิ่มกระเป๋า' : 'Add wallet')) : (th ? 'ย้ายงบระหว่างกระเป๋า' : 'Transfer budget')}</h2>
        <fieldset disabled={saving} className="space-y-4 disabled:opacity-60">
          {action === 'wallet' ? <>
            <label className="block text-xs">{th ? 'ชื่อกระเป๋า' : 'Wallet name'}<input required maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder={th ? 'เช่น งบกินข้าว' : 'e.g. Meals'} className={input}/></label>
            <label className="block text-xs">{th ? 'งบเริ่มต้นต่อ cycle · บาท' : 'Starting budget per cycle · THB'}<input required type="number" inputMode="decimal" min="0" step="0.01" value={budget} onChange={event => setBudget(event.target.value)} className={input}/></label>
            <p className="text-xs leading-6 text-muted-foreground">{th ? 'งบที่แก้ใช้กับรอบนี้และรอบถัดไป ยอดย้ายงบในรอบนี้ยังคงอยู่ รายจ่ายเก่าไม่ถูกผูกกระเป๋าอัตโนมัติ' : 'Changes apply to this and future cycles. Current-cycle transfers stay in place. Existing expenses are not assigned automatically.'}</p>
          </> : <>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs">{th ? 'จากกระเป๋า' : 'From'}<select required value={from} onChange={event => { const next = event.target.value; setFrom(next); if (to === next) setTo(wallets.find(wallet => wallet._id !== next)?._id ?? ''); }} className={input}>{wallets.map(wallet => <option key={wallet._id} value={wallet._id}>{wallet.name}</option>)}</select></label><label className="text-xs">{th ? 'ไปกระเป๋า' : 'To'}<select required value={to} onChange={event => setTo(event.target.value)} className={input}><option value="">{th ? 'เลือกปลายทาง' : 'Choose destination'}</option>{wallets.filter(wallet => wallet._id !== from).map(wallet => <option key={wallet._id} value={wallet._id}>{wallet.name}</option>)}</select></label></div>
            <label className="block text-xs">{th ? 'จำนวนงบที่ย้าย · บาท' : 'Amount · THB'}<input required type="number" inputMode="decimal" min="0.01" step="0.01" max={Math.max(0, source?.remainingCents ?? 0) / 100} value={amount} onChange={event => setAmount(event.target.value)} className={input}/></label>
            <p className="text-xs leading-6 text-muted-foreground">{th ? 'งบต้นทางเหลือ' : 'Available at source'} {money(source?.remainingCents ?? 0)} ฿ · {th ? 'ย้ายได้เฉพาะรอบนี้ ไม่ใช่รายรับหรือรายจ่าย' : 'For this cycle only; neither income nor spending.'}</p>
          </>}
          <div className="flex gap-2"><button type="submit" className={`${button} bg-primary text-primary-foreground hover:bg-primary-hover`}>{saving ? (th ? 'กำลังบันทึก…' : 'Saving…') : (th ? 'บันทึก' : 'Save')}</button><button type="button" onClick={() => setAction(null)} className={button}>{th ? 'ยกเลิก' : 'Cancel'}</button></div>
        </fieldset>
      </form>}
      </div>
      {!snapshot && !loadError && <p role="status" className="p-6 text-sm text-muted-foreground">{th ? 'กำลังเปิดกระเป๋า…' : 'Loading wallets…'}</p>}
      {snapshot && !wallets.length && <p className={`${paper} text-sm leading-7 text-muted-foreground`}>{th ? 'เริ่มด้วยกระเป๋าแรก เช่น งบกินข้าว 5,000 บาท แล้วเลือกกระเป๋านี้ตอนจดรายจ่ายได้เลย' : 'Start with a wallet, such as Meals with 5,000 THB. Select it when recording an expense.'}</p>}
      <div className="grid gap-4 sm:grid-cols-2">{wallets.map(wallet => <section key={wallet._id} className={paper}>
        <h2 className="break-words text-lg font-bold">{wallet.name}</h2><p className="mt-4 text-xs text-muted-foreground">{th ? 'งบคงเหลือรอบนี้' : 'Available this cycle'}</p><p className={`mt-2 font-mono text-3xl ${wallet.remainingCents < 0 ? 'text-destructive' : 'text-primary'}`}>{money(wallet.remainingCents)} <span className="text-base">฿</span></p>
        <progress aria-label={th ? `ใช้ไปจากกระเป๋า ${wallet.name}` : `Budget used for ${wallet.name}`} max={Math.max(1,wallet.allocatedCents)} value={Math.min(Math.max(0,wallet.allocatedCents),wallet.spentCents)} className="mt-4 h-2 w-full accent-primary"/>
        <dl className="mt-4 space-y-2 text-xs text-muted-foreground"><div className="flex justify-between gap-3"><dt>{th ? 'งบตั้งต้น' : 'Base budget'}</dt><dd>{money(wallet.budgetCents)} ฿</dd></div><div className="flex justify-between gap-3"><dt>{th ? 'งบหลังย้าย' : 'After transfers'}</dt><dd>{money(wallet.allocatedCents)} ฿</dd></div><div className="flex justify-between gap-3"><dt>{th ? 'ใช้ไป' : 'Spent'}</dt><dd>{money(wallet.spentCents)} ฿</dd></div></dl>
        {wallet.remainingCents < 0 && <p className="mt-3 text-xs text-destructive">{th ? 'เกินงบแล้ว ยังจดรายจ่ายได้ตามปกติ' : 'Over budget. You can still record expenses.'}</p>}
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => openWallet(wallet)} className={`${button} flex items-center gap-2`}><Pencil aria-hidden="true" size={13}/>{th ? 'แก้ไข' : 'Edit'}</button><button type="button" disabled={saving || wallets.length < 2 || wallet.remainingCents <= 0} onClick={() => openTransfer(wallet)} className={button}>{th ? 'ย้ายงบ' : 'Transfer'}</button><button type="button" disabled={saving} onClick={() => void archive(wallet, true)} className={button}>{th ? 'เก็บเข้าคลัง' : 'Archive'}</button></div>
      </section>)}</div>
      {archived.length > 0 && <details className={`${paper} mt-6`}><summary className="cursor-pointer text-sm font-bold">{th ? 'กระเป๋าในคลัง' : 'Archived wallets'} · {archived.length}</summary><ul className="mt-3 space-y-3">{archived.map(wallet => <li key={wallet._id} className="flex flex-wrap items-center justify-between gap-2 text-xs"><span>{wallet.name} · {th ? 'ใช้ไปในรอบนี้' : 'Spent this cycle'} {money(wallet.spentCents)} ฿</span><button type="button" disabled={saving} onClick={() => void archive(wallet, false)} className={button}>{th ? 'นำกลับมาใช้' : 'Restore'}</button></li>)}</ul></details>}
      {snapshot && snapshot.transfers.length > 0 && <section className={`${paper} mt-6`}><h2 className="font-bold">{th ? 'ย้ายงบในรอบนี้' : 'Transfers this cycle'}</h2><ul className="mt-3 divide-y divide-dashed divide-border">{snapshot.transfers.map(transfer => <li key={transfer._id} className="flex flex-wrap justify-between gap-2 py-3 text-xs"><span>{allWallets.find(wallet => wallet._id === transfer.fromWalletId)?.name} → {allWallets.find(wallet => wallet._id === transfer.toWalletId)?.name}</span><span className="font-mono">{money(transfer.amountCents)} ฿</span></li>)}</ul></section>}
      <p className="mt-6 text-xs leading-6 text-muted-foreground">{th ? 'กระเป๋าเป็นงบ ไม่ใช่บัญชีธนาคาร รายรับไม่เติมงบ และรายจ่ายที่ไม่เลือกกระเป๋ายังนับใน total spent ตามเดิม' : 'Wallets are budgets, not bank accounts. Income does not refill them. Unassigned expenses still count towards total spending.'}</p>
    </div>
  </main>;
}
