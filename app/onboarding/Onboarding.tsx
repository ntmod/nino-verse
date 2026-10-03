'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, NotebookPen } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { ONBOARDING_CATEGORIES } from '@/lib/onboarding-presets.mjs';

export default function Onboarding({ name }: { name: string }) {
  const { language, setLanguage } = useLanguage();
  const th = language === 'th';
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState(['food', 'travel', 'other']);
  const [walletName, setWalletName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const defaultWallet = th ? 'เงินสด' : 'Cash';
  const finish = async (skip = false) => {
    if (saving) return;
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/nori/onboarding', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skip ? { skip: true } : { language, categories, walletName: walletName.trim() || defaultWallet, initialBalance: initialBalance.trim() === '' ? null : Number(initialBalance) }),
      });
      if (!response.ok) throw new Error('Setup failed');
      router.replace('/dashboard'); router.refresh();
    } catch {
      setError(th ? 'ยังจัดสมุดไม่สำเร็จ ลองอีกครั้งนะ ข้อมูลที่บันทึกไว้จะไม่หายค่ะ' : 'Could not finish setup. Please retry; saved details are safe.');
      setSaving(false);
    }
  };

  return <main className="flex min-h-svh items-center justify-center bg-[#f5f0e5] px-5 py-10 text-[#403b32]">
    <div className="w-full max-w-lg">
      <div className="mb-5 flex items-center justify-between gap-3 font-mono text-[10px] text-[#93846b]">
        <span className="flex items-center gap-2 tracking-widest"><NotebookPen aria-hidden="true" className="h-4 w-4" />NORINOTE</span>
        <div role="group" aria-label={th ? 'ภาษา' : 'Language'} className="flex gap-1">{(['th','en'] as const).map(value => <button key={value} type="button" disabled={saving} aria-pressed={language === value} onClick={() => setLanguage(value)} className="min-h-11 px-3 font-bold" style={{ color: language === value ? '#b97423' : undefined }}>{value.toUpperCase()}</button>)}</div>
      </div>
      <section aria-label={th ? 'เริ่มต้นสมุดของคุณ' : 'Set up your notebook'} aria-busy={saving} className="relative border border-[#d9cebb] bg-[#fffdf5] p-5 shadow-[4px_6px_0_#e7dece,0_16px_40px_#4e3e2414] sm:p-8">
        <div className="mb-7 flex items-center justify-between gap-3">
          <span className="font-mono text-[9px] tracking-widest text-[#93846b]">{th ? 'สมุดเล่มใหม่' : 'A NEW NOTEBOOK'}</span>
          <span className="font-mono text-[10px] text-[#b97423]">{step + 1} / 3</span>
        </div>
        <ol aria-label={th ? 'ความคืบหน้า' : 'Progress'} className="mb-7 flex gap-2">{[0,1,2].map(index => <li key={index} aria-current={step === index ? 'step' : undefined} className="h-1.5 flex-1 rounded-full" style={{ background: index <= step ? '#e9a342' : '#eee5d6' }}><span className="sr-only">{index + 1}</span></li>)}</ol>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }} transition={{ duration: reducedMotion ? 0 : 0.18 }}>
            {step === 0 ? <div className="text-center">
              <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full border border-[#d9cebb] bg-[#f5eedf]">
                <Image src="/animations/nori/cat-idle.webp" alt="Nori" width={100} height={100} unoptimized />
              </div>
              <h1 className="break-words text-2xl font-black">{th ? `ยินดีต้อนรับ ${name.split(' ')[0]} 👋` : `Welcome, ${name.split(' ')[0]} 👋`}</h1>
              <p className="mt-4 text-sm leading-relaxed text-[#7f715d]">{th ? 'เรา Nori นะ ขอช่วยจัดสมุดให้พร้อม ก่อนเริ่มจดเรื่องราวของคุณ' : 'I’m Nori. Let’s get your notebook ready for your everyday stories.'}</p>
              <p className="mt-4 text-xs text-[#93846b]">{th ? 'เลือกหมวด · ตั้งกระเป๋า · พร้อมจดในไม่กี่แตะ' : 'Pick categories · Add a wallet · Ready in a few taps'}</p>
            </div> : step === 1 ? <>
              <h1 className="text-2xl font-black">{th ? 'ปกติจ่ายกับอะไรบ้าง?' : 'What do you spend on?'}</h1>
              <p className="mb-5 mt-3 text-xs leading-relaxed text-[#93846b]">{th ? 'เลือกหมวดที่ใช้บ่อย อย่างน้อย 1 หมวด แก้ไขหรือเพิ่มทีหลังได้เสมอ' : 'Pick at least one category. You can change or add more later.'}</p>
              <div className="grid grid-cols-2 gap-3">{ONBOARDING_CATEGORIES.map(category => {
                const selected = categories.includes(category.key);
                return <button key={category.key} type="button" aria-pressed={selected} onClick={() => setCategories(previous => selected ? previous.filter(key => key !== category.key) : [...previous, category.key])}
                  className="relative flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-xs font-bold focus-visible:outline-2 focus-visible:outline-[#b97423]"
                  style={{ borderColor: selected ? '#c99548' : '#d9cebb', background: selected ? '#f9ebcf' : '#f5f0e5', boxShadow: selected ? '2px 3px 0 #e7dece' : undefined }}>
                  <span aria-hidden="true" className="text-2xl">{category.icon}</span>{category[language]}
                  {selected && <Check aria-hidden="true" className="absolute right-2 top-2 h-3 w-3 text-[#b97423]" />}
                </button>;
              })}</div>
              <p className="mt-4 text-[10px] text-[#93846b]">{th ? 'เพิ่มหมวดรายรับให้ด้วย เผื่อวันที่มีเงินเข้า 💰' : 'An Income category is included for money coming in 💰'}</p>
            </> : <>
              <h1 className="text-2xl font-black">{th ? 'เริ่มจากกระเป๋าใบแรก' : 'Your first wallet'}</h1>
              <p className="mt-3 text-xs leading-relaxed text-[#93846b]">{th ? 'เงินสด บัญชี หรือบัตรที่ใช้บ่อย เพิ่มกระเป๋าอื่นทีหลังได้ค่ะ' : 'Cash, an account, or your usual card. Add more wallets later.'}</p>
              <form id="onboarding-wallet" onSubmit={event => { event.preventDefault(); void finish(); }} className="mt-6 space-y-5">
                <div><label htmlFor="wallet-name" className="mb-2 block text-xs font-bold">{th ? 'ชื่อกระเป๋า' : 'Wallet name'}</label><input id="wallet-name" disabled={saving} maxLength={80} value={walletName} placeholder={defaultWallet} onChange={event => setWalletName(event.target.value)} className="w-full rounded-xl border border-[#d9cebb] bg-[#f5f0e5] px-4 py-3 text-sm focus-visible:outline-2 focus-visible:outline-[#b97423]" /></div>
                <div><label htmlFor="wallet-balance" className="mb-2 block text-xs font-bold">{th ? 'ยอดตั้งต้น (THB) · ไม่บังคับ' : 'Initial balance (THB) · Optional'}</label><input id="wallet-balance" type="number" step="0.01" disabled={saving} value={initialBalance} placeholder={th ? 'เว้นว่างได้' : 'Leave blank to skip'} onChange={event => setInitialBalance(event.target.value)} className="w-full rounded-xl border border-[#d9cebb] bg-[#f5f0e5] px-4 py-3 text-sm focus-visible:outline-2 focus-visible:outline-[#b97423]" /><p className="mt-2 text-[10px] leading-relaxed text-[#93846b]">{th ? 'ถ้าตั้งยอดไว้ รายรับและรายจ่ายจะคำนวณเงินคงเหลือให้ ถ้าเว้นว่างจะจดอย่างเดียว' : 'Set an amount to track your balance; leave blank to simply record payments.'}</p></div>
              </form>
              <p className="mt-6 rounded-xl bg-[#edf0df] px-4 py-3 text-xs text-[#416b54]">{th ? `พร้อมแปะ ${categories.length} หมวดลงสมุด แล้วเริ่มจดกัน 🌱` : `${categories.length} spending categories ready. Let’s start 🌱`}</p>
            </>}
          </motion.div>
        </AnimatePresence>
        {error && <p role="alert" className="mt-4 text-xs text-rose-600">{error}</p>}
        <div className="mt-8 flex items-center gap-3">
          {step > 0 && <button type="button" disabled={saving} aria-label={th ? 'ย้อนกลับ' : 'Back'} onClick={() => { setStep(previous => previous - 1); setError(''); }} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d9cebb]"><ArrowLeft className="h-4 w-4" /></button>}
          <button type={step === 2 ? 'submit' : 'button'} form={step === 2 ? 'onboarding-wallet' : undefined} disabled={saving || (step === 1 && !categories.length)} onClick={step === 2 ? undefined : () => setStep(previous => previous + 1)} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#c99548] bg-[#e9a342] px-4 py-3 text-sm font-bold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#b97423]">
            {saving ? (th ? 'กำลังจัดสมุด…' : 'Setting up…') : step === 2 ? (th ? 'เปิดสมุดของเรา' : 'Open my notebook') : step === 0 ? (th ? 'มาจัดสมุดกัน' : 'Let’s set up') : (th ? 'ต่อไป' : 'Next')}<ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <button type="button" disabled={saving} onClick={() => void finish(true)} className="mx-auto mt-3 block min-h-11 px-4 text-[11px] text-[#93846b] underline underline-offset-4">{th ? 'ไว้ตั้งค่าทีหลัง' : 'Set up later'}</button>
      </section>
    </div>
  </main>;
}
