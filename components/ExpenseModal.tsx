'use client';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimate, useReducedMotion } from "framer-motion";
import { X, ChevronDown, Plus, LoaderCircle, Check, AlertCircle } from "lucide-react";
import { useModal } from "@/lib/modal-context";
import { useLanguage } from "@/lib/language-context";
import { getCoinFlightKeyframes } from "@/lib/coin-flight.mjs";
import { transactionService } from "@/lib/services/transactionService";
import { categoryService } from "@/lib/services/categoryService";
import { paymentService } from "@/lib/services/paymentService";
import TransactionReceipt, { type ReceiptData } from "@/components/TransactionReceipt";
import { playUISound, prepareUISound } from "@/lib/ui-sounds.mjs";

export default function ExpenseModal() {
  const { isExpenseModalOpen, closeExpenseModal, onSuccess, editingTransaction, openGlobalModal } = useModal();
  const { t, language } = useLanguage();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const amountRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const coinRef = useRef<HTMLDivElement>(null);
  const savingRef = useRef(false);
  const receiptSuccess = useRef<(() => void) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [newPayment, setNewPayment] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountError, setAmountError] = useState(false);

  useEffect(() => {
    if (!isExpenseModalOpen) return;
    setSaveStatus("idle");

    if (editingTransaction) {
      if (editingTransaction._id) {
        setNewName(editingTransaction.name || "");
        // Format amount with commas and 2 decimals if defined
        if (editingTransaction.amount !== undefined && editingTransaction.amount !== null) {
          const absAmount = Math.abs(editingTransaction.amount);
          const parts = absAmount.toString().split('.');
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          if (parts[1]) parts[1] = parts[1].substring(0, 2);
          setNewAmount(parts.join('.'));
        } else {
          setNewAmount("");
        }
        
        setNewCategory(editingTransaction.category || "");
        setNewSubCategory(editingTransaction.subCategory || "");
        setNewPayment(editingTransaction.paymentMethod || "");
        setNewDate(editingTransaction.date ? new Date(editingTransaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setAmountError(false);
      } else {
        // Prefilled initial values for a new transaction (e.g. prefilled date)
        setNewName(editingTransaction.name || "");
        setNewAmount("");
        setNewSubCategory("");
        setAmountError(false);
        setNewDate(editingTransaction.date ? new Date(editingTransaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      }
    } else {
      // Reset Form to initial state on open
      setNewName("");
      setNewAmount("");
      setNewSubCategory("");
      setAmountError(false);
      setNewDate(new Date().toISOString().split('T')[0]);
    }

    const fetchData = async () => {
      try {
        const [catData, payData] = await Promise.all([
          categoryService.getAll(),
          paymentService.getAll()
        ]);
        
        if (Array.isArray(catData) && catData.length > 0) {
          setCategories(catData);
          if (editingTransaction && editingTransaction.category) {
            const searchName = editingTransaction.category.toLowerCase();
            const foundCat = catData.find(c => {
              const nameLower = c.name.toLowerCase();
              if (c._id === editingTransaction.category) return true;
              if (nameLower === searchName) return true;
              // Fallback mappings for food
              if (searchName.includes("food") && (nameLower.includes("food") || nameLower.includes("dining"))) return true;
              return false;
            });
            if (foundCat) {
              setNewCategory(foundCat._id);
            } else {
              setNewCategory(editingTransaction.category);
            }
          } else {
            setNewCategory(prev => {
              if (prev && catData.some(c => c._id === prev)) return prev;
              return catData[0]._id;
            });
          }
        } else {
          setCategories([]);
          if (!editingTransaction) setNewCategory("");
        }
        
        if (Array.isArray(payData) && payData.length > 0) {
          setPaymentMethods(payData);
          if (editingTransaction?.paymentMethod) {
            const foundPay = payData.find(p => p._id === editingTransaction.paymentMethod || p.name === editingTransaction.paymentMethod);
            if (foundPay) {
              setNewPayment(foundPay._id);
            } else {
              setNewPayment(editingTransaction.paymentMethod);
            }
          } else {
            setNewPayment(payData[0]._id);
          }
        } else {
          setPaymentMethods([]);
          if (!editingTransaction) setNewPayment("");
        }
      } catch (error) {
        console.error("Failed to fetch modal data:", error);
      }
    };

    fetchData();
  }, [isExpenseModalOpen, editingTransaction]);

  // Automatically select the first subcategory (or empty) when category changes
  useEffect(() => {
    const selectedCat = categories.find(c => c._id === newCategory);
    if (selectedCat && selectedCat.subcategories && selectedCat.subcategories.length > 0) {
      const isSameCategory = editingTransaction && 
        (editingTransaction.category === newCategory || 
         categories.find(c => c.name === editingTransaction.category)?._id === newCategory);
      if (isSameCategory) {
        setNewSubCategory(editingTransaction.subCategory || "");
      } else {
        setNewSubCategory(selectedCat.subcategories[0]._id || "");
      }
    } else {
      setNewSubCategory("");
    }
  }, [newCategory, categories, editingTransaction]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (amountError) setAmountError(false);
    const val = e.target.value;
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

  const handleAddTransaction = async (e?: React.FormEvent, closeAfter: boolean = true) => {
    if (e) e.preventDefault();
    if (savingRef.current) return;
    
    if (!newAmount || !Number.isFinite(Number(newAmount.replace(/,/g, ''))) || Number(newAmount.replace(/,/g, '')) <= 0) {
      setAmountError(true);
      return;
    }
    
    // Strip commas for calculation
    const amountNum = parseFloat(newAmount.replace(/,/g, ''));
    
    // Find the selected category to check its type
    const selectedCat = categories.find(c => c._id === newCategory);
    const isIncome = selectedCat ? selectedCat.type === "income" : false;

    savingRef.current = true;
    setIsSaving(true);
    setSaveStatus("saving");
    prepareUISound();
    try {
      const data = {
        name: newName || selectedCat?.name || "General",
        category: newCategory,
        subCategory: newSubCategory || "",
        amount: isIncome ? Math.abs(amountNum) : -Math.abs(amountNum),
        date: newDate,
        paymentMethod: newPayment,
      };

      let savedTx;
      if (editingTransaction && editingTransaction._id) {
        savedTx = await transactionService.update(editingTransaction._id, data);
      } else {
        savedTx = await transactionService.create(data);
      }
      setSaveStatus("saved");
      playUISound("save");

      // Decorative feedback must never turn a successful save into an error.
      if (!editingTransaction?._id && !reducedMotion && scope.current && amountRef.current && categoryRef.current && coinRef.current) {
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

      if (onSuccess) {
        if (closeAfter) receiptSuccess.current = () => onSuccess(savedTx);
        else onSuccess(savedTx);
      }
      
      if (closeAfter) {
        setReceipt({
          transaction: savedTx,
          categoryName: categories.find(c => c._id === savedTx.category)?.name || savedTx.category,
          subCategoryName: selectedCat?.subcategories?.find((sub: { _id: string; name: string }) => sub._id === savedTx.subCategory)?.name,
          paymentName: paymentMethods.find(p => p._id === savedTx.paymentMethod)?.name || savedTx.paymentMethod,
          refreshOnClose: !onSuccess,
        });
        closeExpenseModal();
      }
      
      // Reset Form
      setNewName("");
      setNewAmount("");
      setNewSubCategory("");
      setAmountError(false);
    } catch (error) {
      setSaveStatus("error");
      console.error("Save transaction error:", error);
      openGlobalModal({
        header: t("ui_error"),
        message: t("ui_failed_to_save_the_transaction"),
        type: "error",
        mainButton: {
          label: t("close"),
          onClick: () => {}
        }
      });
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <>
    <AnimatePresence>
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!savingRef.current) closeExpenseModal(); }}
            className="absolute inset-0 bg-[#292722]/30 backdrop-blur-md"
          />
          <motion.div
            ref={scope}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="max-h-[calc(100dvh-2rem)] relative w-full max-w-md bg-[#fffdf5] rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[#e1d7c5] overflow-y-auto"
          >
            <div
              ref={coinRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 z-20 -ml-[18px] -mt-[18px] flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-200 bg-gradient-to-br from-amber-200 via-amber-400 to-orange-500 text-lg font-black text-amber-900 shadow-[0_4px_16px_rgba(255,157,0,0.45)]"
              style={{ opacity: 0 }}
            >
              ฿
            </div>
            <div className="p-5 sm:p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-[#292722] tracking-tight uppercase font-mono">
                  {editingTransaction && editingTransaction._id ? t("edit_expense") : t("add_expense")}
                </h2>
                <button disabled={isSaving} aria-label={language === "th" ? "ปิด" : t("close")} onClick={closeExpenseModal} className="w-11 h-11 shrink-0 rounded-full border border-[#e1d7c5] hover:border-[#d9cebb] hover:bg-[#f5eedf] flex items-center justify-center transition-colors disabled:opacity-40">
                  <X className="w-4 h-4 text-[#635744]" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} aria-busy={isSaving}>
                <fieldset disabled={isSaving} onChangeCapture={() => { if (!isSaving) setSaveStatus("idle"); }} className="space-y-5">
                {/* Amount Field - Wrapped in a clean container */}
                <div ref={amountRef} className="py-4 px-6 bg-[#f5eedf] border border-dashed border-[#d9cebb] rounded-none text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-sm font-black text-[#93846b] uppercase tracking-widest mt-1.5 font-mono">THB</span>
                    <input
                      required
                      autoFocus
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={newAmount}
                      onChange={handleAmountChange}
                      className={`p-1 bg-transparent border-none text-left text-4xl font-black placeholder:text-[#b6a68e] focus:ring-0 selection:bg-[#b97423]/30 w-[180px] transition-all font-mono ${
                        amountError ? "text-red-500" : "text-[#292722]"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <p id="expense-category-label" className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest font-mono">{t("category")}</p>
                      <div role="group" aria-labelledby="expense-category-label" className="grid max-h-60 grid-cols-3 gap-2 overflow-y-auto p-1 sm:grid-cols-4">
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
                            className={`category-sticker relative rounded-xl border-2 p-0.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#b97423] ${selected ? "border-[#b97423] shadow-[1px_2px_0_#cbbda5]" : "border-white shadow-[2px_3px_0_#e1d7c5]"}`}
                            style={{ backgroundColor: ['#f4dfb9', '#dce8d9', '#f0dcd6', '#dce6ed'][index % 4] }}
                          >
                            <span aria-hidden="true" className="sticker-corner" />
                            <label className="flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-center text-[#635744] has-disabled:cursor-wait has-disabled:opacity-60">
                              <input type="radio" name="expense-category" value={cat._id} checked={selected} aria-label={cat.name} className="sr-only"
                                onChange={() => { setNewCategory(cat._id); setNewSubCategory(""); playUISound("click"); }} />
                              <span aria-hidden="true" className="text-2xl leading-none">{cat.icon || "🏷️"}</span>
                              <span className="w-full break-words text-[10px] font-bold leading-tight">{cat.name}</span>
                              {selected && <span aria-hidden="true" className="absolute right-0.5 top-0.5 rounded-full bg-[#b97423] p-0.5 text-white"><Check className="h-2.5 w-2.5" /></span>}
                            </label>
                          </motion.div>;
                        })}
                        {categories.length === 0 && <p className="col-span-full py-2 text-xs text-[#93846b]">{language === "th" ? "ยังไม่มีหมวดหมู่ให้เลือก" : "No categories available"}</p>}
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
                        <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest font-mono">{t("subcategory")}</label>
                        <div className="relative">
                          <select
                            value={newSubCategory}
                            onChange={(e) => setNewSubCategory(e.target.value)}
                            className="min-h-11 min-w-0 w-full px-3 py-2 bg-[#f5eedf]/70 border border-[#e1d7c5] rounded-xl text-xs font-bold text-[#292722] appearance-none focus:bg-[#fffdf5] focus:border-[#d9cebb] focus:ring-4 focus:ring-[#d9cebb]/50 transition-all"
                          >
                            <option value="">{t("ui_none_general")}</option>
                            {currentSubcategories.map((sub: any) => (
                              <option key={sub._id || sub.name} value={sub._id}>🎯 {sub.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#93846b] pointer-events-none" />
                        </div>
                      </motion.div>
                    );
                  })()}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest font-mono">{t("payment_method")}</label>
                      <div className="relative">
                        <select
                          value={newPayment}
                          onChange={(e) => setNewPayment(e.target.value)}
                          className="min-h-11 min-w-0 w-full px-3 py-2 bg-[#f5eedf]/70 border border-[#e1d7c5] rounded-xl text-xs font-bold text-[#292722] appearance-none focus:bg-[#fffdf5] focus:border-[#d9cebb] focus:ring-4 focus:ring-[#d9cebb]/50 transition-all"
                        >
                          {paymentMethods.length > 0 &&
                            paymentMethods.map(pm => <option key={pm._id || pm.name} value={pm._id}>💰 {pm.name}</option>)
                          }
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#93846b] pointer-events-none" />
                      </div>
                    </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest font-mono">{t("date")}</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="min-h-11 min-w-0 w-full px-3 py-2 bg-[#f5eedf]/70 border border-[#e1d7c5] rounded-xl text-xs font-bold text-[#292722] focus:bg-[#fffdf5] focus:border-[#d9cebb] focus:ring-4 focus:ring-[#d9cebb]/50 transition-all font-mono"
                    />
                  </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#7f715d] uppercase tracking-widest font-mono">{t("expense_name")}</label>
                    <input
                      type="text"
                      placeholder={t("expense_name_placeholder")}
                      maxLength={50}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="min-h-11 min-w-0 w-full px-3 py-2 bg-[#f5eedf]/70 border border-[#e1d7c5] rounded-xl text-sm font-bold text-[#292722] placeholder:text-[#93846b] focus:bg-[#fffdf5] focus:border-[#d9cebb] focus:ring-4 focus:ring-[#d9cebb]/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="submit"
                    className={`flex flex-1 items-center justify-center gap-2 min-h-11 py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-md shadow-black/10 transition-colors cursor-pointer disabled:cursor-wait ${saveStatus === "saved" ? "bg-[#416b54] text-white" : saveStatus === "error" ? "bg-[#b0523b] text-white" : "bg-[#e9a342] text-[#372b1c]"}`}
                  >
                    {saveStatus === "saving" ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : saveStatus === "saved" ? <Check aria-hidden="true" className="h-4 w-4" /> : saveStatus === "error" ? <AlertCircle aria-hidden="true" className="h-4 w-4" /> : null}
                    <span>{saveStatus === "saving" ? (language === "th" ? "กำลังบันทึก…" : t("ui_saving")) : saveStatus === "saved" ? (language === "th" ? "บันทึกแล้ว" : "Saved") : saveStatus === "error" ? (language === "th" ? "ลองบันทึกอีกครั้ง" : "Retry save") : editingTransaction && editingTransaction._id ? t("update_expense") : t("save_expense")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTransaction(undefined, false)}
                    className="w-12 min-h-11 py-3 bg-[#eee5d6] border border-[#d9cebb]/50 text-[#292722] rounded-xl font-black text-xl hover:bg-[#e9a342] hover:text-white transition-all flex items-center justify-center group cursor-pointer"
                    title={t("ui_add_and_keep_open")}
                    aria-label={t("ui_add_and_keep_open")}
                  >
                    <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                </fieldset>
                <p role="status" aria-live="polite" className={`${saveStatus === "idle" ? "" : "mt-2"} text-center text-[10px] ${saveStatus === "error" ? "text-[#b0523b]" : "text-[#416b54]"}`}>
                  {saveStatus === "saving" ? (language === "th" ? "กำลังส่งรายการ กรุณารอสักครู่" : "Saving your transaction…") : saveStatus === "saved" ? (language === "th" ? "บันทึกเรียบร้อยแล้ว ✓" : "Transaction saved ✓") : saveStatus === "error" ? (language === "th" ? "บันทึกไม่สำเร็จ ข้อมูลที่กรอกยังอยู่ ลองอีกครั้งได้" : "Save failed. Your input is kept; please retry.") : ""}
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    {receipt && <TransactionReceipt receipt={receipt} onClose={() => {
      setReceipt(null);
      const notify = receiptSuccess.current;
      receiptSuccess.current = null;
      notify?.();
      if (receipt.refreshOnClose) window.location.reload();
    }} />}
    </>
  );
}
