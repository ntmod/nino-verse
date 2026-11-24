"use client";

import React from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

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
  const { t } = useLanguage();
  return (
    <div data-paper-surface="" className="p-4 bg-card rounded-md shadow-[0_2px_8px_rgba(78,62,36,0.03)] border border-border/80 text-left min-h-[100px] flex flex-col justify-center">
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
            <div className="h-3 bg-border rounded-md w-24 mb-4 animate-pulse" />
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-muted rounded-md w-full" />
              <div className="h-4 bg-muted rounded-md w-2/3" />
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
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 select-none">{t("category_budgets")}</h3>

            {budgets.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-2 font-mono">
                <ClipboardList className="w-6 h-6 text-muted-foreground" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("ui_no_active_budgets")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-xs text-foreground">
                {budgets.map((budget) => {
                  const isOver = budget.spent > budget.limit;
                  
                  return (
                    <div 
                      key={budget._id}
                      className="space-y-2.5 border-b border-dashed border-border pb-4 last:border-none last:pb-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="text-sm shrink-0">{budget.icon}</span>
                          <span className="break-words font-medium text-ink-soft">{budget.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={isOver ? "text-destructive" : "text-muted-foreground"}>
                            <AnimatedNumber value={budget.spent} decimals={2} />
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-foreground">
                            <AnimatedNumber value={budget.limit} decimals={2} /> {currency}
                          </span>
                        </div>
                      </div>
                      {budget.limit > 0 && <div role="progressbar" aria-label={budget.category} aria-valuemin={0} aria-valuemax={budget.limit} aria-valuenow={Math.min(budget.spent, budget.limit)} aria-valuetext={`${budget.spent} / ${budget.limit} ${currency}`} className="h-1.5 overflow-hidden rounded-full bg-[#ebe5d7]"><div className={`h-full rounded-full ${isOver ? "bg-[#b87965]" : "bg-[#9aaa7b]"}`} style={{ width: `${Math.min(100, budget.spent / budget.limit * 100)}%` }} /></div>}
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
