"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { Home, ArrowRight, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useModal } from "@/lib/modal-context";

interface FixedCostItem {
  id: string;
  name: string;
  amount: number;
  category?: string;
  paymentMethod?: string;
  isPaid?: boolean;
  icon?: string;
}

interface FixedCostCardProps {
  items: FixedCostItem[];
  currency?: string;
  isLoading?: boolean;
  onReset?: () => void;
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
  onReset
}: FixedCostCardProps) {
  const { openExpenseModal } = useModal();
  const [currentPage, setCurrentPage] = useState(0);

  const total = React.useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
  const paidItems = React.useMemo(() => items.filter(item => item.isPaid).length, [items]);

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const currentItems = items.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  return (
    <div className="relative rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 min-h-[380px] flex flex-col justify-between overflow-hidden">
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
                <div className="h-3 bg-slate-200 rounded-md w-24" />
              </div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-dashed border-slate-100 last:border-none animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-slate-200 rounded-md shrink-0" />
                      <div className="space-y-2">
                        <div className="h-3.5 bg-slate-200 rounded-md w-24 md:w-32" />
                        <div className="h-2.5 bg-slate-100 rounded-md w-16" />
                      </div>
                    </div>
                    <div className="h-3.5 bg-slate-200 rounded-md w-16" />
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
                  <h3 className="text-[10px] font-black text-[#777777] uppercase tracking-[0.2em] select-none">FIXED COSTS</h3>
                </div>
                <div className="flex items-center gap-3">
                  {onReset && items.some(item => item.isPaid) && (
                    <button 
                      onClick={onReset}
                      className="flex items-center gap-1 text-[9px] font-black text-[#777777] hover:text-[#FF3B30] uppercase tracking-widest cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> RESET
                    </button>
                  )}
                  <Link href="/nori/settings/fixed-cost">
                    <button className="flex items-center gap-1 text-[9px] font-black text-[#1A1A1A] hover:text-[#777777] uppercase tracking-widest cursor-pointer transition-colors">
                      MANAGE <ArrowRight className="w-3 h-3" />
                    </button>
                  </Link>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 font-mono">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    <Home className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider">NO FIXED COSTS</p>
                    <p className="text-[10px] text-[#777777]">Regular subscriptions and bills will appear here.</p>
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
                                  openExpenseModal(() => {
                                    window.location.reload();
                                  }, {
                                    name: item.name,
                                    amount: item.amount,
                                    category: item.category,
                                    paymentMethod: item.paymentMethod,
                                  });
                                }
                              }}
                              className={`flex items-center justify-between py-2.5 border-b-2 border-dashed border-slate-100 last:border-none group ${
                                !item.isPaid ? "cursor-pointer" : "opacity-50 select-none"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Floating Emoji Symbol */}
                                <span className="text-lg select-none shrink-0">{item.icon || "🧾"}</span>
                                <div className="text-left">
                                  <span className={`text-sm font-bold tracking-tight ${item.isPaid ? "text-[#777777] line-through" : "text-[#333333]"}`}>
                                    {item.name}
                                  </span>
                                  <p className="text-[9px] font-mono font-bold mt-0.5 tracking-wider uppercase leading-none">
                                    {item.isPaid ? (
                                      <span className="text-[#008000]">PAID ✓</span>
                                    ) : (
                                      <span className="text-[#FF3B30]">PENDING ⚠️</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className={`text-xs font-black italic font-mono ${item.isPaid ? "text-[#777777]" : "text-[#1A1A1A]"}`}>
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
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed border-slate-100">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-[#1A1A1A] hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1A1A1A] transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[9px] font-mono font-black text-[#777777] uppercase tracking-widest">
                        PAGE {currentPage + 1} OF {totalPages}
                      </span>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-[#1A1A1A] hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1A1A1A] transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dark Status Bottom Bar */}
            <div className="bg-[#1A1A1A] text-[#ffffff] p-3 px-6 flex items-center justify-between text-[10px] font-mono select-none">
              <span className="text-[#777777] font-bold">
                PAID: {paidItems}/{items.length} BILLS
              </span>
              <span className="text-[#ffffff] font-bold uppercase text-[9px]">
                TOTAL: <AnimatedNumber value={total} decimals={0} /> {currency}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
