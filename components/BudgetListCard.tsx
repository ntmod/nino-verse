"use client";

import { motion } from "framer-motion";
import { LucideIcon, ClipboardList } from "lucide-react";

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
}

export default function BudgetListCard({ 
  budgets = [], 
  currency = "THB" 
}: BudgetListCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
      className="p-5 md:p-8 rounded-3xl bg-white border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
    >
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Budget Status</h3>

      {budgets.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-black/5 flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-slate-200" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900 tracking-tight">No Budgets Set</p>
            <p className="text-xs font-medium text-slate-400">Start tracking your spending by category.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 md:space-y-8">
          {budgets.map((budget, index) => {
            const remaining = Math.max(0, budget.limit - budget.spent);
            const percentage = (remaining / budget.limit) * 100;
            
            return (
              <motion.div 
                key={budget._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="space-y-3"
              >
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-black/5 text-xl" style={{ backgroundColor: `${budget.color}10` }}>
                      {budget.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 tracking-tight">{budget.category}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {remaining.toLocaleString()} {currency} Remaining
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 italic">
                      {budget.spent.toLocaleString()} / {budget.limit.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.8 + index * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: budget.color }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

