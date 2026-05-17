"use client";

import { motion } from "framer-motion";
import { Home, Wifi, ShieldCheck, Zap, LucideIcon, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useModal } from "@/lib/modal-context";

interface FixedCostItem {
  id: string;
  name: string;
  amount: number;
  category?: string;
  paymentMethod?: string;
  isPaid?: boolean;
}

interface FixedCostCardProps {
  items: FixedCostItem[];
  currency?: string;
}

export default function FixedCostCard({ 
  items = [], 
  currency = "THB" 
}: FixedCostCardProps) {
  const { openExpenseModal } = useModal();
  const total = items.reduce((sum, item) => sum + item.amount, 0);

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
        <Link href="/nori/settings/fixed-cost">
          <motion.button 
            whileHover={{ x: 3 }}
            className="flex items-center gap-1 text-[10px] font-black text-[#FF9D00] uppercase tracking-widest cursor-pointer"
          >
            Manage <ArrowRight className="w-3 h-3" />
          </motion.button>
        </Link>
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
        <div className="space-y-4">
          {items.map((item, index) => {
            return (
              <motion.div 
                key={item.id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
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
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors text-xl ${item.isPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-black/5 group-hover:bg-[#FF9D00]/10 group-hover:border-[#FF9D00]/20'}`}>
                    {item.isPaid ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : '🧾'}
                  </div>
                  <div>
                    <span className={`text-sm font-bold tracking-tight ${item.isPaid ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.name}</span>
                    {!item.isPaid && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Not Paid</p>}
                  </div>
                </div>
                <div className={`text-sm font-black italic ${item.isPaid ? 'text-slate-400' : 'text-slate-900'}`}>
                  {currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}


    </motion.div>
  );
}
