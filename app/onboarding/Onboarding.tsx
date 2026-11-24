'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, NotebookPen } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { bangkokDay } from '@/lib/cycle-config';
import { clearMetadataCache } from '@/lib/metadata-cache';
import { ONBOARDING_CATEGORIES } from '@/lib/onboarding-presets.mjs';

export default function Onboarding({ name }: { name: string }) {
  const { language, setLanguage } = useLanguage();
  const th = language === 'th';
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState(['food', 'travel', 'other']);
  const [walletName, setWalletName] = useState('');
  const [cycleMode, setCycleMode] = useState<'fixed' | 'manual'>('fixed');
  const [fixedDay, setFixedDay] = useState('30');
  const [cycleStart, setCycleStart] = useState(bangkokDay());
  const [budgetWallets, setBudgetWallets] = useState([{ key: 0, name: '', budget: '' }]);
  const nextWallet = useRef(1);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const defaultWallet = th ? 'เงินสด' : 'Cash';
  const finish = async (skip = false, wallets = budgetWallets) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/nori/onboarding', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skip ? { skip: true } : { language, categories, walletName: walletName.trim() || defaultWallet, cycle: cycleMode === 'fixed' ? { mode: cycleMode, fixedDay: Number(fixedDay) } : { mode: cycleMode, startDate: cycleStart }, budgetWallets: wallets.map(({name,budget}) => ({name,budget})) }),
      });
      if (!response.ok) throw new Error('Setup failed');
      clearMetadataCache();
      router.replace('/home'); router.refresh();
    } catch {
      setError(th ? 'ยังจัดสมุดไม่สำเร็จ ลองอีกครั้งนะ ข้อมูลที่บันทึกไว้จะไม่หายค่ะ' : 'Could not finish setup. Please retry; saved details are safe.');
      savingRef.current = false; setSaving(false);
    }
  };

  return <main className="notebook-page flex min-h-svh items-center justify-center px-5 py-10 text-foreground">
    <div className="w-full max-w-lg">
      <div className="mb-5 flex items-center justify-between gap-3 font-mono text-[10px] text-muted-foreground">
        <span className="flex items-center gap-2 tracking-widest"><NotebookPen aria-hidden="true" className="h-4 w-4" />NORINOTE</span>
        <div role="group" aria-label={th ? 'ภาษา' : 'Language'} className="flex gap-1">{(['th','en'] as const).map(value => <button key={value} type="button" disabled={saving} aria-pressed={language === value} onClick={() => setLanguage(value)} className="min-h-11 px-3 font-bold" style={{ color: language === value ? '#b97423' : undefined }}>{value.toUpperCase()}</button>)}</div>
      </div>
      <section aria-label={th ? 'เริ่มต้นสมุดของคุณ' : 'Set up your notebook'} aria-busy={saving} className="notebook-leaf p-5 sm:p-8">
        <div className="mb-7 flex items-center justify-between gap-3">
          <span className="font-mono text-[9px] tracking-widest text-muted-foreground">{th ? 'สมุดเล่มใหม่' : 'A NEW NOTEBOOK'}</span>
          <span className="font-mono text-[10px] text-highlight-ink">{step + 1} / 5</span>
        </div>
        <ol aria-label={th ? 'ความคืบหน้า' : 'Progress'} className="mb-7 flex gap-2">{[0,1,2,3,4].map(index => <li key={index} aria-current={step === index ? 'step' : undefined} className="h-1.5 flex-1 rounded-full" style={{ background: index <= step ? '#e9a342' : '#eee5d6' }}><span className="sr-only">{index + 1}</span></li>)}</ol>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }} transition={{ duration: reducedMotion ? 0 : 0.18 }}>
            {step === 0 ? <div className="text-center">
              <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full border border-border bg-secondary">
                <Image src="/animations/nori/cat-idle.webp" alt="Nori" width={100} height={100} unoptimized />
              </div>
              <h1 className="break-words notebook-title">{th ? `ยินดีต้อนรับ ${name.split(' ')[0]} 👋` : `Welcome, ${name.split(' ')[0]} 👋`}</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{th ? 'เรา Nori นะ ขอช่วยจัดสมุดให้พร้อม ก่อนเริ่มจดเรื่องราวของคุณ' : 'I’m Nori. Let’s get your notebook ready for your everyday stories.'}</p>
              <p className="mt-4 text-xs text-muted-foreground">{th ? 'เลือกหมวด · วิธีชำระเงิน · รอบการใช้จ่าย · กระเป๋างบ' : 'Categories · Payment method · Cycles · Budget wallets'}</p>
            </div> : step === 1 ? <>
              <h1 className="notebook-title">{th ? 'ปกติจ่ายกับอะไรบ้าง?' : 'What do you spend on?'}</h1>
              <p className="mb-5 mt-3 text-xs leading-relaxed text-muted-foreground">{th ? 'เลือกหมวดที่ใช้บ่อย อย่างน้อย 1 หมวด แก้ไขหรือเพิ่มทีหลังได้เสมอ' : 'Pick at least one category. You can change or add more later.'}</p>
              <div className="grid grid-cols-2 gap-3">{ONBOARDING_CATEGORIES.map(category => {
                const selected = categories.includes(category.key);
                return <button key={category.key} type="button" aria-pressed={selected} onClick={() => setCategories(previous => selected ? previous.filter(key => key !== category.key) : [...previous, category.key])}
                  className="relative flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border px-2 py-3 text-xs font-bold focus-visible:outline-2 focus-visible:outline-highlight-ink"
                  style={{ borderColor: selected ? 'var(--highlight-ink)' : 'var(--border)', background: selected ? 'var(--secondary)' : 'var(--background)', boxShadow: selected ? 'var(--shadow-page)' : undefined }}>
                  <span aria-hidden="true" className="text-2xl">{category.icon}</span>{category[language]}
                  {selected && <Check aria-hidden="true" className="absolute right-2 top-2 h-3 w-3 text-highlight-ink" />}
                </button>;
              })}</div>
              <p className="mt-4 text-[10px] text-muted-foreground">{th ? 'เพิ่มหมวดรายรับให้ด้วย เผื่อวันที่มีเงินเข้า 💰' : 'An Income category is included for money coming in 💰'}</p>
            </> : step === 2 ? <>
              <h1 className="notebook-title">{th ? 'เพิ่มวิธีชำระเงินแรก' : 'Your first payment method'}</h1>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{th ? 'เงินสด บัญชี หรือบัตรที่ใช้บ่อย เพิ่มวิธีชำระเงินอื่นทีหลังได้ค่ะ' : 'Cash, an account, or your usual card. Add more payment methods later.'}</p>
              <form id="onboarding-step" onSubmit={event => { event.preventDefault(); setStep(3); }} className="mt-6 space-y-5">
                <div><label htmlFor="wallet-name" className="mb-2 block text-xs font-bold">{th ? 'ชื่อวิธีชำระเงิน' : 'Payment method name'}</label><input id="wallet-name" disabled={saving} maxLength={80} value={walletName} placeholder={defaultWallet} onChange={event => setWalletName(event.target.value)} className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm focus-visible:outline-2 focus-visible:outline-highlight-ink" /></div>

              </form>
            </> : step === 3 ? <>
              <h1 className="notebook-title">{th ? 'เริ่มรอบการใช้จ่ายแบบไหน?' : 'When does your cycle start?'}</h1>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">{th ? 'งบแต่ละกระเป๋าจะเริ่มใหม่ตามรอบนี้ เปลี่ยนการตั้งค่าทีหลังได้' : 'Your wallet budgets reset with this cycle. You can change it later.'}</p>
              <form id="onboarding-step" onSubmit={event => { event.preventDefault(); setStep(4); }} className="mt-5 space-y-4">
                <div className={`border p-4 ${cycleMode === 'fixed' ? 'border-primary bg-accent' : 'border-border'}`}>
                  <label className="flex min-h-11 items-center gap-3 text-sm font-bold"><input type="radio" name="onboarding-cycle" checked={cycleMode === 'fixed'} onChange={() => setCycleMode('fixed')} className="h-4 w-4 accent-primary"/>{th ? 'ทุกวันที่… ของเดือน' : 'Every month on day…'}</label>
                  {cycleMode === 'fixed' && <label className="mt-3 block text-xs">{th ? 'วันที่เริ่มรอบ (1–31)' : 'Start day (1–31)'}<input required type="number" min="1" max="31" step="1" inputMode="numeric" value={fixedDay} onChange={event => setFixedDay(event.target.value)} className="mt-2 min-h-11 w-full border border-border bg-card px-3"/><span className="mt-2 block text-[11px] leading-6 text-muted-foreground">{th ? 'เดือนที่ไม่มีวันนั้น จะใช้วันสุดท้ายของเดือน' : 'Shorter months use their last day.'}</span></label>}
                </div>
                <div className={`border p-4 ${cycleMode === 'manual' ? 'border-primary bg-accent' : 'border-border'}`}>
                  <label className="flex min-h-11 items-center gap-3 text-sm font-bold"><input type="radio" name="onboarding-cycle" checked={cycleMode === 'manual'} onChange={() => setCycleMode('manual')} className="h-4 w-4 accent-primary"/>{th ? 'กำหนดเอง' : 'Custom'}</label>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">{th ? 'กดเริ่มรอบใหม่ที่ Dashboard เมื่อเงินเดือนเข้า' : 'Start the next cycle from Dashboard on payday.'}</p>
                  {cycleMode === 'manual' && <label className="mt-3 block text-xs">{th ? 'วันเริ่มรอบแรก' : 'First cycle starts on'}<input required type="date" min="1900-01-01" max={bangkokDay()} value={cycleStart} onChange={event => setCycleStart(event.target.value)} className="mt-2 min-h-11 w-full border border-border bg-card px-3"/></label>}
                </div>
              </form>
            </> : <>
              <h1 className="notebook-title">{th ? 'แบ่งงบใส่กระเป๋ากัน' : 'Give your budgets a wallet'}</h1>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">{th ? 'เช่น งบกินข้าว หรืองบเที่ยว แยกจากวิธีชำระเงิน และเริ่มด้วยงบที่ตั้งไว้ทุก cycle' : 'For example, Meals or Travel. Separate from payment methods, each wallet starts with this budget every cycle.'}</p>
              <form id="onboarding-step" onSubmit={event => { event.preventDefault(); void finish(); }} className="mt-5 space-y-4">
                <fieldset disabled={saving} className="space-y-4">{budgetWallets.map((wallet,index) => <div key={wallet.key} className="border border-border bg-secondary p-4">
                  <div className="flex items-center justify-between gap-3"><h2 className="text-xs font-bold">{th ? 'กระเป๋า' : 'Wallet'} {index + 1}</h2><button type="button" onClick={() => setBudgetWallets(previous => previous.filter(item => item.key !== wallet.key))} aria-label={`${th ? 'ลบกระเป๋า' : 'Remove wallet'} ${index + 1}`} className="min-h-11 px-2 text-xs text-destructive underline">{th ? 'ลบ' : 'Remove'}</button></div>
                  <label className="block text-xs">{th ? 'ชื่อกระเป๋า' : 'Wallet name'}<input required maxLength={80} value={wallet.name} placeholder={th ? 'เช่น งบกินข้าว' : 'e.g. Meals'} onChange={event => setBudgetWallets(previous => previous.map(item => item.key === wallet.key ? {...item,name:event.target.value} : item))} className="mt-2 min-h-11 w-full border border-border bg-card px-3"/></label>
                  <label className="mt-4 block text-xs">{th ? 'งบต่อ cycle · บาท' : 'Budget per cycle · THB'}<input required type="number" min="0" step="0.01" inputMode="decimal" value={wallet.budget} onChange={event => setBudgetWallets(previous => previous.map(item => item.key === wallet.key ? {...item,budget:event.target.value} : item))} className="mt-2 min-h-11 w-full border border-border bg-card px-3"/></label>
                </div>)}
                <button type="button" disabled={budgetWallets.length >= 20} onClick={() => { const key = nextWallet.current++; setBudgetWallets(previous => [...previous,{key,name:'',budget:''}]); }} className="min-h-11 w-full border border-dashed border-border px-3 text-xs disabled:opacity-40">+ {th ? 'เพิ่มกระเป๋าอีกใบ' : 'Add another wallet'}</button>
                </fieldset>
              </form>
              <button type="button" disabled={saving} onClick={() => void finish(false,[])} className="mt-3 min-h-11 text-xs text-muted-foreground underline">{th ? 'ยังไม่ใช้กระเป๋างบ ไว้เพิ่มทีหลัง' : 'Skip budget wallets for now'}</button>
            </>}
          </motion.div>
        </AnimatePresence>
        {error && <p role="alert" className="mt-4 text-xs text-rose-600">{error}</p>}
        <div className="mt-8 flex items-center gap-3">
          {step > 0 && <button type="button" disabled={saving} aria-label={th ? 'ย้อนกลับ' : 'Back'} onClick={() => { setStep(previous => previous - 1); setError(''); }} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border"><ArrowLeft className="h-4 w-4" /></button>}
          <button type={step >= 2 ? 'submit' : 'button'} form={step >= 2 ? 'onboarding-step' : undefined} disabled={saving || (step === 1 && !categories.length)} onClick={step >= 2 ? undefined : () => setStep(step + 1)} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-[#c99548] bg-highlight px-4 py-3 text-sm font-bold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-highlight-ink">
            {saving ? (th ? 'กำลังจัดสมุด…' : 'Setting up…') : step === 4 ? (th ? 'เปิดสมุดของเรา' : 'Open my notebook') : step === 0 ? (th ? 'มาจัดสมุดกัน' : 'Let’s set up') : (th ? 'ต่อไป' : 'Next')}<ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <button type="button" disabled={saving} onClick={() => void finish(true)} className="mx-auto mt-3 block min-h-11 px-4 text-[11px] text-muted-foreground underline underline-offset-4">{th ? 'ไว้ตั้งค่าทีหลัง' : 'Set up later'}</button>
      </section>
    </div>
  </main>;
}
