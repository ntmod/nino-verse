'use client'

import { useLanguage } from "@/lib/language-context";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Search,
  Calendar,
  CreditCard,
  ChevronDown,
  X,
  ArrowLeft,
  Pencil,
  Trash2,
  MoreVertical,
  ReceiptText
} from "lucide-react";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import styles from "./actions.module.css";
import LoadingScreen from "@/components/LoadingScreen";
import FloatingActionButton from "@/components/nori/FloatingActionButton";
import { useModal } from "@/lib/modal-context";
import { Transaction } from "@/lib/types";
import { transactionService } from "@/lib/services/transactionService";
import { categoryService } from "@/lib/services/categoryService";
import { paymentService } from "@/lib/services/paymentService";

// --- Initial Data ---
const INITIAL_TRANSACTIONS: Transaction[] = [];

export default function NotePage() {
  const { t, language } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPayment, setSelectedPayment] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);

  const { openExpenseModal, openGlobalModal } = useModal();

  const menuActionSelected = useRef(false);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const [txData, catData, payData] = await Promise.all([
          transactionService.getAll(),
          categoryService.getAll(),
          paymentService.getAll()
        ]);
        if (!active) return;

        if (Array.isArray(txData)) {
          setTransactions(txData);
        }

        if (Array.isArray(catData)) setCategories(catData);
        if (Array.isArray(payData)) setPaymentMethods(payData);
      } catch (error) {
        console.error("Failed to fetch page data:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  const filteredTransactions = useMemo(() => {
    const selectedCatObj = categories.find(c => c._id === selectedCategory || c.name === selectedCategory);
    const selectedPayObj = paymentMethods.find(p => p._id === selectedPayment || p.name === selectedPayment);
    return transactions.filter((tx) => {
      const matchesSearch = tx.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" ||
        tx.category === selectedCategory ||
        (selectedCatObj && (tx.category === selectedCatObj._id || tx.category === selectedCatObj.name));
      const matchesPayment = selectedPayment === "All" ||
        tx.paymentMethod === selectedPayment ||
        (selectedPayObj && (tx.paymentMethod === selectedPayObj._id || tx.paymentMethod === selectedPayObj.name));

      const txDateStr = tx.date ? new Date(tx.date).toISOString().split('T')[0] : "";
      const matchesDate = !dateFilter || txDateStr === dateFilter;

      return matchesSearch && matchesCategory && matchesPayment && matchesDate;
    });
  }, [transactions, searchQuery, selectedCategory, selectedPayment, dateFilter, categories, paymentMethods]);

  const sortedTransactions = useMemo(() => [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  ), [filteredTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const labels = new Map<string, string>();
    // ponytail: render in batches; server pagination if downloading history becomes the bottleneck.
    sortedTransactions.slice(0, visibleCount).forEach(tx => {
      const dateObj = new Date(tx.date);
      const day = dateObj.toDateString();
      let groupKey = labels.get(day) || "";
      if (!groupKey) {
        if (day === today.toDateString()) {
          groupKey = t("today");
        } else if (day === yesterday.toDateString()) {
          groupKey = t("yesterday");
        } else {
          groupKey = dateObj.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: dateObj.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
          });
        }
        labels.set(day, groupKey);
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(tx);
    });

    return Object.entries(groups);
  }, [sortedTransactions, visibleCount, language, t]);

  const resetFilters = () => {
    setVisibleCount(50);
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedPayment("All");
    setDateFilter("");
  };

  const handleAddSuccess = (newTx: Transaction) => {
    setTransactions([newTx, ...transactions]);
  };

  return (
    <main className="min-h-screen bg-[#f5f0e5] flex flex-col items-center p-0 md:p-6 pt-16 md:pt-24 pb-20">
      <LoadingScreen mode="in" />

      <div className="w-full max-w-2xl px-4 md:px-0 space-y-6 md:space-y-8">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Link href="/dashboard" className="flex items-center gap-1.5 text-[#7f715d] hover:text-[#292722] transition-colors mb-2 text-[10px] font-bold uppercase tracking-widest font-mono">
              <ArrowLeft className="w-3 h-3" />
              {t("ui_back_to_dashboard")}
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-[#292722] tracking-tight uppercase font-mono">
              {t("nav_notes")}<span className="text-[#93846b]">/</span><span className="text-[#b97423]">{t("ui_expense")}</span>
            </h1>
          </motion.div>

          <div className="text-right font-mono">
            <p className="text-[10px] font-bold text-[#7f715d] uppercase tracking-widest">{filteredTransactions.length} {t("ui_items")}</p>
          </div>
        </div>

        {/* Minimal Filters Card in Floating Style */}
        <div className="bg-[#fffdf5] shadow-[3px_4px_0_#e7dece,0_8px_24px_rgba(78,62,36,0.06)] border border-[#e1d7c5]/80 rounded-none p-4 md:p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#93846b]" />
            <input
              type="text"
              placeholder={t("ui_search_transactions")}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(50); }}
              className="w-full pl-10 pr-4 py-3 bg-[#f5eedf]/70 border border-[#e1d7c5] rounded-xl text-sm font-bold text-[#292722] focus:bg-[#fffdf5] focus:border-[#d9cebb] focus:ring-4 focus:ring-[#d9cebb]/50 transition-all placeholder:text-[#93846b]"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {(() => {
                  const categoryData = categories.find(c => c._id === selectedCategory || c.name === selectedCategory);
                  const icon = categoryData?.icon || "🏷️";
                  return <span className="text-sm">{selectedCategory === "All" ? "🏷️" : icon}</span>;
                })()}
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setVisibleCount(50); }}
                className="w-full pl-9 pr-8 py-2.5 bg-[#f5eedf]/70 border border-[#e1d7c5] rounded-xl text-[11px] font-bold text-[#635744] appearance-none focus:bg-[#fffdf5] focus:border-[#d9cebb] focus:ring-4 focus:ring-[#d9cebb]/50 transition-all"
              >
                <option value="All">{t("ui_all_categories")}</option>
                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#93846b] pointer-events-none" />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <CreditCard className="w-3.5 h-3.5 text-[#93846b]" />
              </div>
              <select
                value={selectedPayment}
                onChange={(e) => { setSelectedPayment(e.target.value); setVisibleCount(50); }}
                className="w-full pl-9 pr-8 py-2.5 bg-[#f5eedf]/70 border border-[#e1d7c5] rounded-xl text-[11px] font-bold text-[#635744] appearance-none focus:bg-[#fffdf5] focus:border-[#d9cebb] focus:ring-4 focus:ring-[#d9cebb]/50 transition-all"
              >
                <option value="All">{t("ui_all_payments")}</option>
                {paymentMethods.map(pm => <option key={pm._id} value={pm._id}>{pm.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#93846b] pointer-events-none" />
            </div>

            <div className="relative col-span-2 md:col-span-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Calendar className="w-3.5 h-3.5 text-[#93846b]" />
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setVisibleCount(50); }}
                className="w-full pl-9 pr-3 py-2.5 bg-[#f5eedf]/70 border border-[#e1d7c5] rounded-xl text-[11px] font-bold text-[#635744] focus:bg-[#fffdf5] focus:border-[#d9cebb] focus:ring-4 focus:ring-[#d9cebb]/50 transition-all font-mono"
              />
            </div>
          </div>

          {(searchQuery || selectedCategory !== "All" || selectedPayment !== "All" || dateFilter) && (
            <button onClick={resetFilters} className="text-[10px] font-bold text-[#b97423] hover:text-[#9d601c] uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors font-mono">
              <X className="w-3 h-3" /> {t("ui_reset_filters")}
            </button>
          )}
        </div>

        {/* Floating Style Transaction List */}
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <p key="loading" role="status" className="py-20 text-center text-xs text-[#7f715d]">{language === 'th' ? "กำลังเปิดบันทึก…" : "Opening your notes…"}</p>
            ) :
            groupedTransactions.length > 0 ? (
              groupedTransactions.map(([dateGroup, txList]) => (
                <motion.div key={dateGroup} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.18 }} className="relative space-y-2">
                  {/* Sticky Date Header */}
                  <div className="sticky top-[56px] md:top-[72px] bg-[#f5f0e5]/95 backdrop-blur-md py-2.5 z-10 flex items-center justify-between border-b border-[#d9cebb]/60 font-mono">
                    <span className="text-[10px] font-black text-[#7f715d] uppercase tracking-[0.15em]">{dateGroup}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-[#7f715d] uppercase tracking-wider bg-[#fffdf5] border border-[#e1d7c5] rounded-md px-2 py-0.5 shadow-sm">
                        {txList.length} {t("ui_items")}
                      </span>
                      <button
                        title={`${t("add_expense")} · ${dateGroup}`}
                        onClick={() => {
                          const dateObj = txList[0]?.date ? new Date(txList[0].date) : new Date();
                          openExpenseModal(handleAddSuccess, { date: dateObj });
                        }}
                        className="w-11 h-11 shrink-0 rounded-md bg-[#fffdf5] border border-[#d9cebb] text-[#292722] hover:bg-[#292722] hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
                      >
                        <span className="text-xs font-bold leading-none">+</span>
                      </button>
                    </div>
                  </div>

                  {/* Inner list of items */}
                  <div className="relative divide-y divide-[#e1d7c5]">
                    <AnimatePresence mode="popLayout">
                    {txList.map((tx) => {
                      const categoryData = categories.find(c => c._id === tx.category || c.name === tx.category);
                      const categoryIcon = categoryData?.icon || "🏷️";
                      const subCategoryObj = categoryData?.subcategories?.find((s: any) => s._id === tx.subCategory);
                      const subCategoryName = subCategoryObj ? subCategoryObj.name : "";
                      const paymentName = paymentMethods.find(p => p._id === tx.paymentMethod || p.name === tx.paymentMethod)?.name || tx.paymentMethod;
                      const receiptOpen = expandedReceipt === tx._id;
                      const receiptId = `note-receipt-${tx._id}`;

                      return (
                        <motion.div
                          key={tx._id}
                          layout
                          initial={{ opacity: 0, x: reducedMotion ? 0 : -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: reducedMotion ? 0 : 8 }}
                          transition={{ duration: reducedMotion ? 0 : 0.18, layout: { duration: reducedMotion ? 0 : 0.25 } }}
                          className="relative"
                        >
                          <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-4 group sm:gap-3">
                          <button type="button" aria-expanded={receiptOpen} aria-controls={receiptId}
                            aria-label={`${language === 'th' ? 'ใบเสร็จ' : 'Receipt'} · ${tx.name}`}
                            onClick={() => setExpandedReceipt(receiptOpen ? null : tx._id)}
                            className="absolute inset-0 rounded-xl focus-visible:outline-2 focus-visible:outline-[#b97423]"
                            style={{ background: receiptOpen ? '#eee5d655' : undefined }} />
                          <div className="pointer-events-none relative flex min-w-0 items-center gap-2 sm:gap-3">
                            <span className="hidden w-3 shrink-0 items-center justify-center sm:flex">
                              <span className="text-[10px] text-[#292722] font-black opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                ▶
                              </span>
                            </span>
                            <div className="w-10 h-10 rounded-xl bg-[#fffdf5] flex items-center justify-center border border-[#d9cebb] shadow-sm group-hover:bg-[#f5eedf] transition-all duration-300 shrink-0">
                              <span className="text-xl group-hover:scale-110 transition-transform">{categoryIcon}</span>
                            </div>
                            <div className="min-w-0 text-left">
                              <h3 className="text-sm font-bold text-[#292722] tracking-tight truncate leading-tight mb-1.5" title={tx.name}>{tx.name}</h3>
                              <div className="flex flex-col gap-0.5">
                                <p title={`${categoryData ? categoryData.name : tx.category}${subCategoryName ? ` / ${subCategoryName}` : ""}`} className="truncate text-[10px] font-bold text-[#b97423] uppercase tracking-wider font-mono leading-tight">
                                  <span>{categoryData ? categoryData.name : tx.category}</span>
                                  {subCategoryName && (
                                    <>
                                      <span className="mx-1 text-[#b6a68e]">/</span>
                                      <span className="text-[#93846b] lowercase font-medium">{subCategoryName}</span>
                                    </>
                                  )}
                                </p>
                                <div className="flex min-w-0 items-center gap-2 text-[9px] font-bold text-[#93846b] uppercase tracking-wider font-mono">
                                  <span className="truncate">{(() => {
                                    const payData = paymentMethods.find(p => p._id === tx.paymentMethod || p.name === tx.paymentMethod);
                                    return payData ? payData.name : tx.paymentMethod;
                                  })()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="pointer-events-none relative flex shrink-0 items-center gap-1 sm:gap-3">
                            <div className="pointer-events-none shrink-0 text-right">
                              <p className={`whitespace-nowrap text-sm md:text-base font-black italic font-mono ${tx.amount < 0 ? "text-red-500" : "text-emerald-500"}`}>
                                {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-[9px] font-bold text-[#b6a68e] uppercase font-mono">THB</p>
                            </div>

                            <DropdownMenu.Root modal={false}>
                              <DropdownMenu.Trigger
                                aria-label={`${language === "th" ? "เมนูรายการ" : "Transaction actions"} · ${tx.name}`}
                                className="pointer-events-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-[#93846b] transition-colors hover:bg-[#f5eedf] focus-visible:outline-2 focus-visible:outline-[#b97423]"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </DropdownMenu.Trigger>
                              <DropdownMenu.Portal>
                              <DropdownMenu.Content side="bottom" align="end" sideOffset={7} collisionPadding={12}
                                onCloseAutoFocus={event => {
                                  if (menuActionSelected.current) event.preventDefault();
                                  menuActionSelected.current = false;
                                }}
                                className={styles.paper}>
                            <DropdownMenu.Item
                              aria-label={t("edit_expense")}
                              onSelect={() => {
                                menuActionSelected.current = true;
                                openExpenseModal(undefined, tx);
                              }}
                              className={`${styles.item} text-[#7f715d] data-highlighted:bg-[#f5eedf] data-highlighted:text-[#b97423]`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              {t("edit_expense")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item aria-label={t("delete")}
                              onSelect={() => {
                                menuActionSelected.current = true;
                                openGlobalModal({
                                  header: t("ui_delete_record"),
                                  message: `${t("delete_prompt")} “${tx.name}”`,
                                  type: "delete",
                                  mainButton: {
                                    label: t("ui_delete_now"),
                                    color: "bg-rose-500 text-white hover:bg-rose-600",
                                    onClick: async () => {
                                      try {
                                        await transactionService.delete(tx._id);
                                        setTimeout(() => {
                                          openGlobalModal({
                                            header: t("ui_delete_completed"),
                                            message: `“${tx.name}” · ${t("ui_delete_completed")}`,
                                            type: "success",
                                            mainButton: {
                                              label: t("close"),
                                              onClick: () => {
                                                window.location.reload();
                                              }
                                            }
                                          });
                                        }, 300);
                                      } catch (error) {
                                        console.error("Delete error:", error);
                                      }
                                    }
                                  },
                                  subButton: {
                                    label: t("ui_go_back"),
                                    onClick: () => {}
                                  }
                                });
                              }}
                              className={`${styles.item} text-rose-500 data-highlighted:bg-rose-50`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {t("delete")}
                            </DropdownMenu.Item>
                                <DropdownMenu.Arrow width={12} height={6} className="fill-[#fffdf5]" />
                              </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                          </div>
                          </div>
                          <AnimatePresence initial={false}>
                            {receiptOpen && <motion.div key="receipt" id={receiptId} role="region"
                              aria-label={`${language === 'th' ? 'รายละเอียดใบเสร็จ' : 'Receipt details'} · ${tx.name}`}
                              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden">
                              <motion.div initial={{ y: reducedMotion ? 0 : -30 }} animate={{ y: 0 }} exit={{ y: reducedMotion ? 0 : -30 }} transition={{ duration: reducedMotion ? 0 : 0.28 }} className={styles.receipt}>
                                <div className="mb-3 flex items-center justify-between border-b border-dashed border-[#d9cebb] pb-3">
                                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#93846b]"><ReceiptText aria-hidden="true" className="h-4 w-4" />NORINOTE</span>
                                  <span className="text-[9px] text-[#93846b]">{language === 'th' ? 'บันทึกรายการ' : 'TRANSACTION NOTE'}</span>
                                </div>
                                <h3 className="break-words text-sm font-bold text-[#403b32]">{tx.name}</h3>
                                <p className="mt-1 text-[10px] text-[#93846b]">{new Date(tx.date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <dl className="my-4 space-y-2 text-xs text-[#7f715d]">
                                  <div className="flex justify-between gap-4"><dt className="shrink-0">{language === 'th' ? 'หมวดหมู่' : 'Category'}</dt><dd className="min-w-0 break-words text-right">{categoryIcon} {categoryData?.name || tx.category}{subCategoryName ? ` / ${subCategoryName}` : ''}</dd></div>
                                  <div className="flex justify-between gap-4"><dt className="shrink-0">{language === 'th' ? 'ช่องทางจ่าย' : 'Payment'}</dt><dd className="min-w-0 break-words text-right">{paymentName}</dd></div>
                                </dl>
                                <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-[#d9cebb] pt-3">
                                  <span className="text-xs font-bold text-[#635744]">{language === 'th' ? (tx.amount < 0 ? 'รายจ่าย' : 'รายรับ') : (tx.amount < 0 ? 'Expense' : 'Income')}</span>
                                  <span className="break-all text-right text-lg font-black text-[#403b32]">{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}<span className="ml-2 text-[9px] font-normal text-[#93846b]">THB</span></span>
                                </div>
                              </motion.div>
                            </motion.div>}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.18 }} className="py-20 text-center">
                <p className="text-sm font-bold text-[#b6a68e] uppercase tracking-widest font-mono">{t("ui_empty_note")}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!loading && visibleCount < sortedTransactions.length && (
            <div className="space-y-3 text-center">
              <p className="text-[10px] text-[#7f715d]">{language === 'th' ? `แสดง ${visibleCount} จาก ${sortedTransactions.length} รายการ` : `Showing ${visibleCount} of ${sortedTransactions.length} records`}</p>
              <button type="button" onClick={() => setVisibleCount(count => count + 50)} className="min-h-11 border border-[#d9cebb] bg-[#fffdf5] px-6 py-3 text-xs font-bold text-[#635744] shadow-sm focus-visible:outline-2 focus-visible:outline-[#b97423]">
                {language === 'th' ? "ดูรายการเพิ่ม" : "Show more records"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onSuccess={handleAddSuccess} />
    </main>
  );
}
