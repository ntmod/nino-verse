"use client";

import { motion } from "framer-motion";
import { Coffee, ShoppingBag, Utensils, Car, Smartphone, LucideIcon, ArrowRight } from "lucide-react";
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
}

export default function RecentTransactionsCard({ 
  transactions = [], 
  currency = "THB" 
}: RecentTransactionsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
      className="p-5 md:p-8 rounded-3xl bg-white border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Recent Transactions</h3>
        {transactions.length > 0 && (
          <Link href="/nori/note">
            <motion.button 
              whileHover={{ x: 3 }}
              className="flex items-center gap-1 text-[10px] font-black text-[#FF9D00] uppercase tracking-widest cursor-pointer"
            >
              View All <ArrowRight className="w-3 h-3" />
            </motion.button>
          </Link>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-black/5 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-slate-200" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900 tracking-tight">No Transactions Yet</p>
            <p className="text-xs font-medium text-slate-400">Your recent activity will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {transactions.map((tx, index) => {
            return (
              <motion.div 
                key={tx._id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-black/5 flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all duration-300 text-xl">
                    {tx.icon || "🏷️"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 tracking-tight">{tx.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 flex-wrap">
                      <span>{new Date(tx.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[#FF9D00]">{tx.category}</span>
                      {tx.subCategory && (
                        <>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-400 lowercase font-medium">{tx.subCategory}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className={`text-sm font-black italic ${tx.amount < 0 ? "text-red-500" : "text-emerald-500"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
