"use client";

import React from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { ClipboardList } from "lucide-react";

interface Budget {
  _id: string;
  category: string;
  limit: number;
  spent: number;
  color: string;
  icon: string;
}

interface BudgetListCardProps {
  budgets: Budget[];
  currency?: string;
  isLoading?: boolean;
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

export default function BudgetListCard({ 
  budgets = [], 
  currency = "THB",
  isLoading = false
}: BudgetListCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 text-left min-h-[100px] flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="h-3 bg-slate-200 rounded-md w-24 mb-4 animate-pulse" />
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-slate-100 rounded-md w-full" />
              <div className="h-4 bg-slate-100 rounded-md w-2/3" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h3 className="text-[10px] font-black text-[#777777] uppercase tracking-[0.2em] mb-4 select-none">BUDGET LIMITS</h3>

            {budgets.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-2 font-mono">
                <ClipboardList className="w-6 h-6 text-slate-300" />
                <p className="text-[10px] font-bold text-[#777777] uppercase tracking-wider">NO ACTIVE BUDGETS</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 font-mono text-[10px] text-[#333333]">
                {budgets.map((budget) => {
                  const isOver = budget.spent > budget.limit;
                  
                  return (
                    <div 
                      key={budget._id}
                      className="flex items-center justify-between py-1.5 border-b border-dashed border-slate-100 last:border-none last:pb-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm shrink-0">{budget.icon}</span>
                        <span className="font-bold uppercase tracking-wider text-[#1A1A1A]">{budget.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={isOver ? "text-[#FF3B30]" : "text-[#777777]"}>
                          <AnimatedNumber value={budget.spent} decimals={0} />
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[#1A1A1A]">
                          <AnimatedNumber value={budget.limit} decimals={0} /> {currency}
                        </span>
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
