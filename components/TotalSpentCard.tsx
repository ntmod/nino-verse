"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingUp, ArrowUpRight } from "lucide-react";

interface TotalSpentCardProps {
  amount?: number;
  currency?: string;
  percentageChange?: number;
  progress?: number;
  isLoading?: boolean;
}

export default function TotalSpentCard({
  amount = 0,
  currency = "THB",
  percentageChange = 0,
  progress = 0,
  isLoading = false
}: TotalSpentCardProps) {
  if (isLoading) {
    return (
      <div className="relative overflow-hidden p-5 md:p-8 rounded-3xl bg-white border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.05)] min-h-[160px] flex flex-col justify-between animate-pulse">
        <div className="absolute top-4 right-4 md:top-6 md:right-6">
          <svg className="animate-spin h-5 w-5 text-[#FF9D00]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded-full w-24" />
            <div className="flex items-baseline gap-2 mt-2">
              <div className="h-6 bg-slate-100 rounded-full w-10" />
              <div className="h-12 bg-slate-100 rounded-full w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden group p-5 md:p-8 rounded-3xl bg-white border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
    >
      {/* No decorative blobs */}

      <div className="relative z-10">
        {/* <div className="flex items-center justify-between mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#FF9D00]/10 flex items-center justify-center border border-[#FF9D00]/10">
            <Wallet className="w-7 h-7 text-[#FF9D00]" />
          </div>
          {percentageChange !== 0 && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${percentageChange < 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
              }`}>
              {percentageChange < 0 ? <TrendingUp className="w-3 h-3 rotate-180" /> : <ArrowUpRight className="w-3 h-3" />}
              {Math.abs(percentageChange)}%
            </div>
          )}
        </div> */}

        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">Total Spent</p>
            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 text-2xl font-black italic">{currency}</span>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 italic tracking-tighter">
                {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
          </div>

        </div>

        {/* <div className="mt-8 pt-8 border-t border-black/5 flex items-center justify-between">
          <div className="text-slate-400 text-xs font-medium">
            Period: <span className="text-slate-600">April 2026</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-[#FF9D00] text-xs font-black uppercase tracking-widest hover:text-orange-600 transition-colors cursor-pointer"
          >
            View Details
          </motion.button>
        </div> */}
      </div>
    </motion.div>
  );
}
