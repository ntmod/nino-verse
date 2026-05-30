"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Wifi, ShieldCheck, Zap, LucideIcon, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
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

export default function FixedCostCard({ 
  items = [], 
  currency = "THB",
  isLoading = false,
  onReset
}: FixedCostCardProps) {
  if (isLoading) {
    return (
      <div className="p-5 md:p-8 rounded-3xl bg-white border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.05)] min-h-[380px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-4 bg-slate-100 rounded-full w-24 mb-2 animate-pulse" />
              <div className="h-3 bg-slate-100 rounded-full w-32 animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 shrink-0" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-100 rounded-full w-24 md:w-32" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-16" />
                  </div>
                </div>
                <div className="h-4 bg-slate-100 rounded-full w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { openExpenseModal } = useModal();
  const [currentPage, setCurrentPage] = useState(0);
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const currentItems = items.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      className="p-5 md:p-8 rounded-3xl bg-white border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Fixed Costs</h3>
          <p className="text-[10px] font-black text-slate-400 italic uppercase mt-1">
            Total: <span className="text-slate-900">{currency} {total.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          {onReset && items.some(item => item.isPaid) && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReset}
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-[#FF9D00] uppercase tracking-widest cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </motion.button>
          )}
          <Link href="/nori/settings/fixed-cost">
            <motion.button 
              whileHover={{ x: 3 }}
              className="flex items-center gap-1 text-[10px] font-black text-[#FF9D00] uppercase tracking-widest cursor-pointer"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </motion.button>
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-black/5 flex items-center justify-center">
            <Home className="w-8 h-8 text-slate-200" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900 tracking-tight">No Fixed Costs</p>
            <p className="text-xs font-medium text-slate-400">Regular subscriptions and bills will appear here.</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
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
                      className={`flex items-center justify-between group ${!item.isPaid ? 'cursor-pointer' : 'opacity-60'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors relative ${item.isPaid ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-black/5 group-hover:bg-[#FF9D00]/10 group-hover:border-[#FF9D00]/20'}`}>
                          <span className={`text-xl ${item.isPaid ? 'opacity-45' : ''}`}>{item.icon || '🧾'}</span>
                          {item.isPaid && (
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-emerald-100 flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-50" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className={`text-sm font-bold tracking-tight ${item.isPaid ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.name}</span>
                          {!item.isPaid && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Not Paid</p>}
                        </div>
                      </div>
                      <div className={`text-sm font-black italic ${item.isPaid ? 'text-slate-400' : 'text-slate-900'}`}>
                        {currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-black/5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-black/5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-black/5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}


    </motion.div>
  );
}
