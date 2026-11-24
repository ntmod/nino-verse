'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { motion, useAnimate, useReducedMotion } from 'framer-motion';
import { Check, Plus, LoaderCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useLanguage } from '@/lib/language-context';
import { categoryService } from '@/lib/services/categoryService';
import { paymentService } from '@/lib/services/paymentService';
import { transactionService } from '@/lib/services/transactionService';
import { calculateAmount } from '@/lib/amount-calculation';
import { quickNoteData, localRecordDate, type QuickCategory, type QuickPayment } from '@/lib/quick-note';
import { getCoinFlightKeyframes } from '@/lib/coin-flight.mjs';
import { playUISound, prepareUISound } from '@/lib/ui-sounds.mjs';
import type { Transaction } from '@/lib/types';
import WalletPicker from './WalletPicker';
import type { ReceiptData } from './TransactionReceipt';

const field = 'mt-2 min-h-11 w-full min-w-0 border border-border bg-secondary px-3 text-sm outline-offset-2 focus:outline-ring';
interface Props {
  variant?: 'home' | 'modal';
  initialTransaction?: Partial<Transaction>;
  onSaved: (receipt: ReceiptData, closeAfter: boolean) => void;
  onSavingChange?: (saving: boolean) => void;
}

export default function TransactionForm({ variant = 'home', initialTransaction, onSaved, onSavingChange }: Props) {
  const { t, language } = useLanguage();
  const th = language === 'th';
  const { data: account } = authClient.useSession();
  const userId = account?.user.id;
  const id = useId();
  const editingTransaction = initialTransaction;
  const [scope, animate] = useAnimate<HTMLFormElement>();
  const reducedMotion = useReducedMotion();
  const amountRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const coinRef = useRef<HTMLDivElement>(null);
  const savingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [categories, setCategories] = useState<QuickCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<QuickPayment[]>([]);
  const [ready, setReady] = useState(false);
  const [metadataError, setMetadataError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [newName, setNewName] = useState(initialTransaction?.name ?? '');
  const [newAmount, setNewAmount] = useState(initialTransaction?.amount == null ? '' : String(Math.abs(initialTransaction.amount)));
  const [newCategory, setNewCategory] = useState(initialTransaction?.category ?? '');
  const [newSubCategory, setNewSubCategory] = useState(initialTransaction?.subCategory ?? '');
  const [newPayment, setNewPayment] = useState(initialTransaction?.paymentMethod ?? '');
  const [newDate, setNewDate] = useState(initialTransaction?.date ? new Date(initialTransaction.date).toISOString().slice(0, 10) : localRecordDate());
  const [newWallet, setNewWallet] = useState(initialTransaction?.walletId ?? '');
  const [walletName, setWalletName] = useState<string | undefined>();
  const [amountError, setAmountError] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    Promise.all([categoryService.getAll(userId), paymentService.getAll(userId)]).then(([cats, methods]) => {
      if (!active) return;
      setCategories(cats); setPaymentMethods(methods);
      setNewCategory(previous => {
        const match = cats.find(item => item._id === previous || item.name.toLowerCase() === previous.toLowerCase());
        if (match) return match._id;
        // Preserve the existing Food shortcut for legacy category names.
        if (previous.toLowerCase().includes('food')) {
          const food = cats.find(item => /food|dining/i.test(item.name));
          if (food) return food._id;
        }
        return previous || cats.find(item => item.type === 'expense')?._id || cats[0]?._id || '';
      });
      setNewPayment(previous => methods.find(item => item._id === previous || item.name === previous)?._id || previous || methods[0]?._id || '');
      setReady(true); setMetadataError(false);
    }).catch(() => { if (active) setMetadataError(true); });
    return () => { active = false; };
  }, [userId, retry]);

  const selectedCat = categories.find(item => item._id === newCategory);
  const refunded = Boolean(initialTransaction?._id && initialTransaction.refunds?.length);
  const canSave = !refunded && ready && !metadataError && categories.length > 0 && paymentMethods.length > 0 && !isSaving;
  const hasCalculation = /[+*/×÷()−-]/.test(newAmount);
  let calculatedAmount: string | null = null;
  if (hasCalculation) {
    try { calculatedAmount = calculateAmount(newAmount); } catch {}
  }
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaveStatus("idle");
    if (amountError) setAmountError(false);
    const val = e.target.value;
    if (/[+*/×÷()−-]/.test(val)) {
      if (val.length <= 200 && /^[\d\s.,+*/×÷()−-]*$/.test(val)) setNewAmount(val);
      return;
    }
    // Remove commas to get raw numeric value
    const rawValue = val.replace(/,/g, '');
    
    // Only allow up to 7 digits in integer part and a single decimal point with max 2 digits after it
    if (rawValue !== '' && !/^\d{0,7}\.?\d{0,2}$/.test(rawValue)) return;
    
    // Format for display
    if (rawValue === '') {
      setNewAmount('');
    } else {
      const parts = rawValue.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setNewAmount(parts.join('.'));
    }
  };

  const handleAddTransaction = async (event?: FormEvent, closeAfter = variant === 'modal') => {
    event?.preventDefault();
    if (savingRef.current || !canSave) return;
    let data;
    try {
      data = quickNoteData({ name: newName, amount: calculateAmount(newAmount), category: newCategory,
        subCategory: newSubCategory, paymentMethod: newPayment, walletId: selectedCat?.type === 'income' ? '' : newWallet, date: variant === 'home' ? localRecordDate() : newDate }, categories, paymentMethods);
    } catch {
      setAmountError(!newAmount || !Number.isFinite(Number(newAmount.replace(/,/g, ''))) || Number(newAmount.replace(/,/g, '')) <= 0);
      setSaveStatus('error'); return;
    }
    savingRef.current = true; setIsSaving(true); setSaveStatus('saving'); onSavingChange?.(true);
    prepareUISound();
    let savedTx: Transaction;
    try {
      savedTx = editingTransaction?._id
        ? await transactionService.update(editingTransaction._id, data)
        : await transactionService.create(data);
    } catch {
      setSaveStatus('error');
      savingRef.current = false; setIsSaving(false); onSavingChange?.(false);
      return;
    }
    try {
      setSaveStatus('saved');
      setNewName(''); setNewAmount(''); setAmountError(false);
      onSaved({ transaction: savedTx, walletName: savedTx.walletId ? walletName : undefined, categoryName: selectedCat?.name ?? savedTx.category,
        subCategoryName: selectedCat?.subcategories?.find(item => item._id === savedTx.subCategory)?.name,
        paymentName: paymentMethods.find(item => item._id === savedTx.paymentMethod)?.name ?? savedTx.paymentMethod }, closeAfter);
      playUISound('save');
      // Decorative feedback must never turn a successful save into an error.
      if (variant === "modal" && !closeAfter && !editingTransaction?._id && !reducedMotion && scope.current && amountRef.current && categoryRef.current && coinRef.current) {
        const coin = coinRef.current;
        const category = categoryRef.current;
        try {
          const { x, y, times } = getCoinFlightKeyframes(
            amountRef.current.getBoundingClientRect(),
            category.getBoundingClientRect(),
            scope.current.getBoundingClientRect(),
          );
          await Promise.all([
            animate(coin, { x, y }, { duration: 0.65, ease: "linear", times }),
            animate(coin, { opacity: [0, 1, 1, 0], scale: [0.5, 1.1, 1, 0.4], rotate: [0, 25, -15, 0] }, { duration: 0.65, times: [0, 0.15, 0.8, 1] }),
            animate(category, { boxShadow: ["0 0 0 0px rgba(255,157,0,0)", "0 0 0 5px rgba(255,157,0,0.3)", "0 0 0 9px rgba(255,157,0,0)"] }, { delay: 0.45, duration: 0.3 }),
          ]);
        } catch (error) {
          console.warn("Coin animation skipped:", error);
        } finally {
          coin.style.opacity = "0";
          category.style.boxShadow = "";
        }
      }

    } finally {
      savingRef.current = false; setIsSaving(false); onSavingChange?.(false);
      if (!closeAfter) requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const calculationControls = (
<div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p id={`${id}-calculation`} role="status" aria-live="polite" className="text-xs text-muted-foreground">{hasCalculation ? (calculatedAmount ? `= ${Number(calculatedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿` : (th ? 'กรอกสูตรให้ครบ และผลลัพธ์ต้องมากกว่า 0' : 'Complete the expression; the result must be positive.')) : (th ? 'คำนวณได้ เช่น 50+25 หรือ 120÷2' : 'Try 50+25 or 120÷2')}</p>
            <div role="group" aria-label={th ? 'เครื่องหมายคำนวณ' : 'Arithmetic operators'} className="flex gap-1">{['+', '−', '×', '÷'].map(operator => <button key={operator} type="button" onClick={() => { setNewAmount(previous => previous + operator); setSaveStatus('idle'); inputRef.current?.focus(); }} className="flex h-11 w-11 items-center justify-center border border-border bg-secondary font-mono text-lg hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">{operator}</button>)}<button type="button" aria-label={th ? 'คำนวณผลลัพธ์' : 'Calculate result'} onClick={() => {
              try {
                setNewAmount(Number(calculateAmount(newAmount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                setAmountError(false); setSaveStatus('idle');
              } catch { setAmountError(true); setSaveStatus('error'); }
              inputRef.current?.focus();
            }} className="flex h-11 w-11 items-center justify-center border border-primary bg-primary font-mono text-lg text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">=</button></div>
          </div>
  );

  return <form ref={scope} onSubmit={handleAddTransaction} aria-busy={isSaving}
    onChangeCapture={() => { if (!isSaving) setSaveStatus('idle'); }}
    className={variant === 'home' ? 'relative border border-border bg-card p-5 text-foreground shadow-[2px_3px_0_var(--paper-edge)] sm:p-7' : 'relative'}>
    {variant === "home" && <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{th ? 'วันนี้จ่ายอะไรไปบ้าง?' : 'What would you like to note?'}</h2><Plus aria-hidden="true" size={17} className="text-[#a27c40]" /></div>}
        {refunded && <p role="alert" className="mt-4 text-xs leading-6 text-destructive">{th ? 'รายการนี้มีประวัติคืนเงินแล้ว จึงแก้ไขไม่ได้ ดูประวัติหรือคืนยอดที่เหลือต่อได้ในหน้า Note' : 'This expense has refunds and cannot be edited. View its history or refund the remainder on Note.'}</p>}
        {metadataError ? <p role="alert" className="mt-4 text-xs text-destructive">{th ? 'โหลดหมวดหมู่และวิธีจ่ายไม่สำเร็จ' : 'Could not load categories and payment methods.'} <button type="button" onClick={() => setRetry(value => value + 1)} className="min-h-11 px-2 underline">{th ? 'ลองอีกครั้ง' : 'Retry'}</button></p> : !ready ? <p role="status" className="mt-4 text-xs text-muted-foreground">{th ? 'กำลังเตรียมสมุด…' : 'Opening your notebook…'}</p> : null}
        {ready && (!categories.length || !paymentMethods.length) && <p className="mt-4 text-xs leading-6 text-muted-foreground">{th ? 'เพิ่มหมวดหมู่และวิธีจ่ายก่อนเริ่มจดได้เลย' : 'Add a category and a payment method to start.'} <Link href="/settings/category" className="underline">{th ? 'หมวดหมู่' : 'Categories'}</Link> · <Link href="/settings/method" className="underline">{th ? 'วิธีจ่าย' : 'Payment methods'}</Link></p>}

{variant === "modal" && <>
            <div
              ref={coinRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 z-20 -ml-[18px] -mt-[18px] flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-200 bg-gradient-to-br from-amber-200 via-amber-400 to-orange-500 text-lg font-black text-amber-900 shadow-[0_4px_16px_rgba(255,157,0,0.45)]"
              style={{ opacity: 0 }}
            >
              ฿
            </div>

</>}
{variant === "home" ? <>
        <fieldset disabled={isSaving} className="min-w-0 disabled:opacity-60">
          <label className="mt-6 block text-xs text-muted-foreground" htmlFor={`${id}-amount`}>{th ? 'จำนวนเงิน · บาท' : 'Amount · THB'}</label>
          <div className="mt-1 flex items-center gap-3 border-b-2 border-border focus-within:border-ring"><span aria-hidden="true" className="text-2xl text-[#b9aa8d]">฿</span><input ref={inputRef} id={`${id}-amount`} aria-describedby={`${id}-calculation`} maxLength={200} required type="text" inputMode="decimal" value={newAmount} onChange={handleAmountChange} placeholder="0" className="min-w-0 w-full bg-transparent py-3 font-mono text-4xl outline-none placeholder:text-[#d2c8b6]" /></div>
          {calculationControls}
          {selectedCat?.type !== 'income' && <WalletPicker allowArchived={Boolean(initialTransaction?._id)} category={selectedCat} autoSelect={!initialTransaction?._id && !initialTransaction?.walletId} value={newWallet} onChange={(id, name) => { setNewWallet(id); setWalletName(name); }} />}
          <label htmlFor={`${id}-name`} className="mt-5 block text-xs">{th ? 'รายการ' : 'Description'}</label><input id={`${id}-name`} maxLength={200} value={newName} onChange={event => setNewName(event.target.value)} placeholder={th ? 'เช่น ข้าวกลางวัน' : 'e.g. Lunch'} className={field} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="min-w-0 text-xs">{th ? 'หมวดหมู่' : 'Category'}<select disabled={!ready} required value={newCategory} onChange={event => { setNewCategory(event.target.value); setNewSubCategory(''); }} className={field}>{categories.map(item => <option key={item._id} value={item._id}>{item.name}{item.type === 'income' ? (th ? ' · รายรับ' : ' · income') : ''}</option>)}</select></label>
            <label className="min-w-0 text-xs">{th ? 'จ่ายจาก / รับเข้า' : 'Payment method'}<select disabled={!ready} required value={newPayment} onChange={event => setNewPayment(event.target.value)} className={field}>{paymentMethods.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
          </div>
          {!!selectedCat?.subcategories?.length && <label className="mt-4 block text-xs">{th ? 'หมวดหมู่ย่อย' : 'Subcategory'}<select value={newSubCategory} onChange={event => setNewSubCategory(event.target.value)} className={field}><option value="">{th ? 'ไม่ระบุ' : 'None'}</option>{selectedCat.subcategories.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>}
          <button type="submit" disabled={!canSave} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-hover disabled:cursor-wait">{isSaving ? <LoaderCircle aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <Plus aria-hidden="true" size={16} />}{isSaving ? (th ? 'กำลังบันทึก…' : 'Saving…') : (th ? 'จดรายการนี้' : 'Save this note')}</button>
        </fieldset>
        <p role="status" aria-live="polite" className={`mt-3 flex min-h-5 items-center justify-center gap-1 text-center text-[11px] ${saveStatus === 'error' ? 'text-destructive' : 'text-accent-foreground'}`}>{saveStatus === 'saved' ? <><Check aria-hidden="true" size={13} />{th ? 'บันทึกแล้ว จดต่อหรือกลับไปใช้ชีวิตได้เลย' : 'Saved. Add another, or get on with your day.'}</> : saveStatus === 'error' ? (th ? 'บันทึกไม่สำเร็จ ตรวจข้อมูลแล้วลองอีกครั้ง ข้อมูลที่กรอกยังอยู่' : 'Could not save. Check your input and try again; your draft is kept.') : (th ? 'รายการของวันนี้ · ไม่ต้องเปิดหน้าต่างเพิ่ม' : 'For today. No extra windows.')}</p>
</> : <>
              <div>
                <fieldset disabled={isSaving} onChangeCapture={() => { if (!isSaving) setSaveStatus("idle"); }} className="space-y-5">
                {/* Amount Field - Wrapped in a clean container */}
                <div ref={amountRef} className="py-4 px-6 bg-secondary border border-dashed border-border rounded-md text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-sm font-black text-muted-foreground uppercase tracking-widest mt-1.5 font-mono">THB</span>
                    <input
                      required
                      autoFocus={variant === "modal"}
                      type="text"
                      maxLength={200} aria-describedby={`${id}-calculation`} inputMode="decimal" aria-label={th ? "จำนวนเงิน" : "Amount"} ref={inputRef}
                      placeholder="0.00"
                      value={newAmount}
                      onChange={handleAmountChange}
                      className={`p-1 bg-transparent border-none text-left text-4xl font-black placeholder:text-muted-foreground focus:ring-0 selection:bg-highlight-ink/30 w-[180px] transition-all font-mono ${
                        amountError ? "text-red-500" : "text-foreground"
                      }`}
                    />
                  </div>
                </div>
                {calculationControls}
                {selectedCat?.type !== 'income' && <WalletPicker allowArchived={Boolean(initialTransaction?._id)} category={selectedCat} autoSelect={!initialTransaction?._id && !initialTransaction?.walletId} value={newWallet} onChange={(id, name) => { setNewWallet(id); setWalletName(name); }} />}

                <div className="space-y-5">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <p id={`${id}-category-label`} className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-mono">{t("category")}</p>
                      <div role="group" aria-labelledby={`${id}-category-label`} className="grid max-h-60 grid-cols-3 gap-2 overflow-y-auto p-1 sm:grid-cols-4">
                        {categories.map((cat, index) => {
                          const selected = newCategory === cat._id;
                          const tilt = index % 2 === 0 ? -2 : 2;
                          return <motion.div
                            key={cat._id || cat.name}
                            ref={selected ? categoryRef : undefined}
                            initial={false}
                            animate={reducedMotion ? { scale: 1, rotate: 0 } : { scale: selected ? [0.94, 1.05, 1] : 1, rotate: selected ? 0 : tilt }}
                            whileTap={reducedMotion ? undefined : { scale: 0.92, rotate: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className={`category-sticker relative rounded-md border-2 p-0.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-highlight-ink ${selected ? "border-highlight-ink shadow-[1px_2px_0_var(--border-strong)]" : "border-white shadow-[2px_3px_0_var(--border)]"}`}
                            style={{ backgroundColor: ['#f4dfb9', '#dce8d9', '#f0dcd6', '#dce6ed'][index % 4] }}
                          >
                            <span aria-hidden="true" className="sticker-corner" />
                            <label className="flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-center text-ink-soft has-disabled:cursor-wait has-disabled:opacity-60">
                              <input type="radio" name={`${id}-category`} value={cat._id} checked={selected} aria-label={cat.name} className="sr-only"
                                onChange={() => { setNewCategory(cat._id); setNewSubCategory(""); playUISound("click"); }} />
                              <span aria-hidden="true" className="text-2xl leading-none">{cat.icon || "🏷️"}</span>
                              <span className="w-full break-words text-[10px] font-bold leading-tight">{cat.name}</span>
                              {selected && <span aria-hidden="true" className="absolute right-0.5 top-0.5 rounded-full bg-highlight-ink p-0.5 text-white"><Check className="h-2.5 w-2.5" /></span>}
                            </label>
                          </motion.div>;
                        })}
                        {categories.length === 0 && <p className="col-span-full py-2 text-xs text-muted-foreground">{language === "th" ? "ยังไม่มีหมวดหมู่ให้เลือก" : "No categories available"}</p>}
                      </div>
                    </div>


                  </div>

                  {/* Subcategory selection if the selected category has any */}
                  {(() => {
                    const selectedCat = categories.find(c => c._id === newCategory);
                    const currentSubcategories = selectedCat?.subcategories || [];
                    const selectedCatHasSubcategories = currentSubcategories.length > 0;
                    
                    return selectedCatHasSubcategories && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1 overflow-hidden"
                      >
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-mono">{t("subcategory")}</label>
                        <div className="relative">
                          <select disabled={!ready}
                            aria-label={t("subcategory")} value={newSubCategory}
                            onChange={(e) => setNewSubCategory(e.target.value)}
                            className="min-h-11 min-w-0 w-full px-3 py-2 bg-secondary/70 border border-border rounded-md text-xs font-bold text-foreground appearance-none focus:bg-card focus:border-border focus:ring-4 focus:ring-border/50 transition-all"
                          >
                            <option value="">{t("ui_none_general")}</option>
                            {currentSubcategories.map((sub) => (
                              <option key={sub._id || sub.name} value={sub._id}>🎯 {sub.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </motion.div>
                    );
                  })()}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-mono">{t("payment_method")}</label>
                      <div className="relative">
                        <select disabled={!ready}
                          aria-label={t("payment_method")} value={newPayment}
                          onChange={(e) => setNewPayment(e.target.value)}
                          className="min-h-11 min-w-0 w-full px-3 py-2 bg-secondary/70 border border-border rounded-md text-xs font-bold text-foreground appearance-none focus:bg-card focus:border-border focus:ring-4 focus:ring-border/50 transition-all"
                        >
                          {paymentMethods.length > 0 &&
                            paymentMethods.map(pm => <option key={pm._id || pm.name} value={pm._id}>💰 {pm.name}</option>)
                          }
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-mono">{t("date")}</label>
                    <input
                      type="date" required aria-label={t("date")}
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="min-h-11 min-w-0 w-full px-3 py-2 bg-secondary/70 border border-border rounded-md text-xs font-bold text-foreground focus:bg-card focus:border-border focus:ring-4 focus:ring-border/50 transition-all font-mono"
                    />
                  </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-mono">{t("expense_name")}</label>
                    <input
                      type="text" aria-label={t("expense_name")}
                      placeholder={t("expense_name_placeholder")}
                      maxLength={200}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="min-h-11 min-w-0 w-full px-3 py-2 bg-secondary/70 border border-border rounded-md text-sm font-bold text-foreground placeholder:text-muted-foreground focus:bg-card focus:border-border focus:ring-4 focus:ring-border/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="submit" disabled={!canSave}
                    className={`flex flex-1 items-center justify-center gap-2 min-h-11 py-3 rounded-md font-black text-sm uppercase tracking-widest shadow-md shadow-black/10 transition-colors cursor-pointer disabled:cursor-wait ${saveStatus === "saved" ? "bg-primary text-primary-foreground" : saveStatus === "error" ? "bg-destructive text-white" : "bg-highlight text-highlight-foreground"}`}
                  >
                    {saveStatus === "saving" ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : saveStatus === "saved" ? <Check aria-hidden="true" className="h-4 w-4" /> : saveStatus === "error" ? <AlertCircle aria-hidden="true" className="h-4 w-4" /> : null}
                    <span>{saveStatus === "saving" ? (language === "th" ? "กำลังบันทึก…" : t("ui_saving")) : saveStatus === "saved" ? (language === "th" ? "บันทึกแล้ว" : "Saved") : saveStatus === "error" ? (language === "th" ? "ลองบันทึกอีกครั้ง" : "Retry save") : editingTransaction && editingTransaction._id ? t("update_expense") : t("save_expense")}</span>
                  </button>
                  <button
                    type="button"
                    disabled={!canSave} onClick={() => handleAddTransaction(undefined, false)}
                    className="w-12 min-h-11 py-3 bg-muted border border-border/50 text-foreground rounded-md font-black text-xl hover:bg-highlight hover:text-white transition-all flex items-center justify-center group cursor-pointer"
                    title={t("ui_add_and_keep_open")}
                    aria-label={t("ui_add_and_keep_open")}
                  >
                    <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                </fieldset>
                <p role="status" aria-live="polite" className={`${saveStatus === "idle" ? "" : "mt-2"} text-center text-[10px] ${saveStatus === "error" ? "text-destructive" : "text-primary"}`}>
                  {saveStatus === "saving" ? (language === "th" ? "กำลังส่งรายการ กรุณารอสักครู่" : "Saving your transaction…") : saveStatus === "saved" ? (language === "th" ? "บันทึกเรียบร้อยแล้ว ✓" : "Transaction saved ✓") : saveStatus === "error" ? (language === "th" ? "บันทึกไม่สำเร็จ ข้อมูลที่กรอกยังอยู่ ลองอีกครั้งได้" : "Save failed. Your input is kept; please retry.") : ""}
                </p>
              </div>
</>}
</form>;
}
