"use client";

import React from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Transaction {
  _id: string;
  name: string;
  category: string;
  subCategory?: string;
  amount: number;
  date: string;
  icon: string;
}

interface RecentTransactionsCardProps {
  transactions: Transaction[];
  currency?: string;
  isLoading?: boolean;
}

// Custom component to scramble/roll values to their destination targets
function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const prevValue = React.useRef(0);

  React.useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration: 0.8,
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
  }, [value, decimals]);

  return (
    <span ref={ref}>
      {prevValue.current.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
    </span>
  );
}

export default function RecentTransactionsCard({ 
  transactions = [], 
  currency = "THB",
  isLoading = false
}: RecentTransactionsCardProps) {
  return (
    <div className="p-4 md:p-6 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 min-h-[380px] flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col justify-between select-none"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="h-3 bg-slate-200 rounded-md w-32 animate-pulse" />
              </div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-dashed border-slate-100 last:border-none">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-slate-200 rounded-md shrink-0 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3.5 bg-slate-200 rounded-md w-24 md:w-32 animate-pulse" />
                        <div className="h-2.5 bg-slate-100 rounded-md w-36 md:w-48 animate-pulse" />
                      </div>
                    </div>
                    <div className="h-3.5 bg-slate-200 rounded-md w-12 animate-pulse" />
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
            className="flex-1"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-[#777777] uppercase tracking-[0.2em] select-none font-mono">RECENT TRANSACTIONS</h3>
              {transactions.length > 0 && (
                <Link href="/nori/note">
                  <button className="flex items-center gap-1 text-[9px] font-black text-[#1A1A1A] hover:text-[#777777] uppercase tracking-widest cursor-pointer transition-colors">
                    VIEW ALL <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              )}
            </div>

            {transactions.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 font-mono">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-slate-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider">NO TRANSACTIONS YET</p>
                  <p className="text-[10px] text-[#777777]">Your recent activity will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {transactions.map((tx, index) => {
                  const isNegative = tx.amount < 0;
                  
                  return (
                    <div 
                      key={tx._id || index}
                      className="flex items-center justify-between py-2.5 border-b-2 border-dashed border-slate-100 last:border-none last:pb-0 group"
                    >
                      <div className="flex items-center gap-3">
                        {/* Floating emoji icon sitting directly in row like MetricsCard */}
                        <span className="text-lg select-none shrink-0">{tx.icon || "🏷️"}</span>
                        <div className="text-left">
                          <p className="text-sm font-bold text-[#1A1A1A] tracking-tight leading-none mb-1">{tx.name}</p>
                          <p className="text-[9px] font-black text-[#777777] uppercase tracking-wider flex items-center gap-1.5 flex-wrap font-mono">
                            <span>{new Date(tx.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[#FF9D00]">{tx.category}</span>
                            {tx.subCategory && (
                              <>
                                <span className="text-slate-300">/</span>
                                <span className="text-[#777777] lowercase font-medium">{tx.subCategory}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      {/* Visual spent amount indicators */}
                      <div className={`text-xs font-black italic font-mono ${isNegative ? "text-[#FF3B30]" : "text-[#008000]"}`}>
                        {isNegative ? "" : "+"}
                        <AnimatedNumber value={Math.abs(tx.amount)} decimals={2} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
