"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { Home, ArrowRight, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useModal } from "@/lib/modal-context";
import { useLanguage } from "@/lib/language-context";

import type { Transaction } from "@/lib/types";

interface FixedCostItem {
  id: string;
  name: string;
  amount: number;
  category?: string;
  paymentMethod?: string;
  walletId?: string;
  isPaid?: boolean;
  icon?: string;
}

interface FixedCostCardProps {
  items: FixedCostItem[];
  currency?: string;
  isLoading?: boolean;
  onReset?: () => void;
  onSuccess: (transaction: Transaction) => void;
}

// Custom component to scramble/roll values to their destination targets
function AnimatedNumber({ value, decimals = 2, delay = 0 }: { value: number; decimals?: number; delay?: number }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const prevValue = React.useRef(0);

  React.useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration: 0.8,
      delay: delay,
      ease: "easeOut",
      onUpdate(latest) {
        if (ref.current) {
          ref.current.textContent = latest.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          });
        }
      }
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value, decimals, delay]);

  return (
    <span ref={ref}>
      {prevValue.current.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
    </span>
  );
}

export default function FixedCostCard({ 
  items = [], 
  currency = "THB",
  isLoading = false,
  onReset,
  onSuccess
}: FixedCostCardProps) {
  const { openExpenseModal } = useModal();
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(0);

  const total = React.useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
  const paidItems = React.useMemo(() => items.filter(item => item.isPaid).length, [items]);

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const currentItems = items.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  return (
    <div data-paper-surface="" className="relative bg-card rounded-md shadow-[0_2px_8px_rgba(78,62,36,0.03)] border border-border/80 min-h-[380px] flex flex-col justify-between overflow-hidden">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-6 pb-4 flex-1 flex flex-col justify-between select-none"
          >
            <div>
              <div className="flex items-center justify-between mb-6 animate-pulse">
                <div className="h-3 bg-border rounded-md w-24" />
              </div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-dashed border-border last:border-none animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-border rounded-md shrink-0" />
                      <div className="space-y-2">
                        <div className="h-3.5 bg-border rounded-md w-24 md:w-32" />
                        <div className="h-2.5 bg-muted rounded-md w-16" />
                      </div>
                    </div>
                    <div className="h-3.5 bg-border rounded-md w-16" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 flex flex-col justify-between"
          >
            {/* Top Core Segment */}
            <div className="p-4 md:p-6 pb-4">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] select-none">{t("fixed_costs")}</h3>
                </div>
                <div className="flex items-center gap-3">
                  {onReset && items.some(item => item.isPaid) && (
                    <button 
                      onClick={onReset}
                      className="flex items-center gap-1 text-[9px] font-black text-muted-foreground hover:text-destructive uppercase tracking-widest cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> {t("reset")}
                    </button>
                  )}
                  <Link href="/settings/fixed-cost">
                    <button className="flex items-center gap-1 text-[9px] font-black text-foreground hover:text-muted-foreground uppercase tracking-widest cursor-pointer transition-colors">
                      {t("view_all")} <ArrowRight className="w-3 h-3" />
                    </button>
                  </Link>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 font-mono">
                  <div className="w-16 h-16 rounded-md bg-card border border-border flex items-center justify-center">
                    <Home className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">{t("ui_no_fixed_costs")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("ui_regular_subscriptions_and_bills_will_appear_here")}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="min-h-[220px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentPage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col"
                      >
                        {currentItems.map((item, index) => {
                          return (
                            <div 
                              key={item.id || index}
                              onClick={() => {
                                if (!item.isPaid) {
                                  openExpenseModal(onSuccess, {
                                    name: item.name,
                                    amount: item.amount,
                                    category: item.category,
                                    paymentMethod: item.paymentMethod,
                                    walletId: item.walletId,
                                  });
                                }
                              }}
                              className={`flex items-center justify-between py-2.5 border-b-2 border-dashed border-border last:border-none group ${
                                !item.isPaid ? "cursor-pointer" : "opacity-50 select-none"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Floating Emoji Symbol */}
                                <span className="text-lg select-none shrink-0">{item.icon || "🧾"}</span>
                                <div className="text-left">
                                  <span className={`text-sm font-bold tracking-tight ${item.isPaid ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                    {item.name}
                                  </span>
                                  <p className="text-[9px] font-mono font-bold mt-0.5 tracking-wider uppercase leading-none">
                                    {item.isPaid ? (
                                      <span className="text-primary">{t("ui_paid")}</span>
                                    ) : (
                                      <span className="text-destructive">{t("ui_pending")}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className={`text-xs font-black italic font-mono ${item.isPaid ? "text-muted-foreground" : "text-foreground"}`}>
                                {currency} <AnimatedNumber value={item.amount} decimals={2} />
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Brutalist Pagination Row */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed border-border">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-card disabled:hover:text-foreground transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
                        {t("ui_page")} {currentPage + 1} {t("ui_of")} {totalPages}
                      </span>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-card disabled:hover:text-foreground transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dark Status Bottom Bar */}
            <div className="border-t border-dashed border-border bg-secondary text-foreground p-3 px-6 flex flex-wrap gap-2 items-center justify-between text-[10px] font-mono select-none">
              <span className="text-muted-foreground font-bold">
                {t("paid").toUpperCase()}: {paidItems}/{items.length}
              </span>
              <span className="text-foreground font-bold uppercase text-[9px]">
                {t("total_fixed").toUpperCase()}: <AnimatedNumber value={total} decimals={0} /> {currency}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
