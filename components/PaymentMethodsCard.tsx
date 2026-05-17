"use client";

import { motion } from "framer-motion";
import { CreditCard, Banknote, Smartphone, Wallet, LucideIcon } from "lucide-react";

interface PaymentMethod {
  _id: string;
  name: string;
  amount: number;
  icon: string;
  color: string;
}

interface PaymentMethodsCardProps {
  methods: PaymentMethod[];
  currency?: string;
}

export default function PaymentMethodsCard({ 
  methods = [], 
  currency = "THB" 
}: PaymentMethodsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
      className="p-5 md:p-8 rounded-3xl bg-white border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
    >
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Payment Methods</h3>

      {methods.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-black/5 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-slate-200" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900 tracking-tight">No Methods Linked</p>
            <p className="text-xs font-medium text-slate-400">Add a card or wallet to see your balance.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:gap-4">
          {methods.map((method, index) => {
            return (
              <motion.div 
                key={method._id}
                whileHover={{ x: 5 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-3 md:p-4 rounded-2xl bg-slate-50 border border-black/5 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border border-black/5 group-hover:border-transparent transition-colors text-xl md:text-2xl shrink-0" style={{ backgroundColor: `${method.color}10` }}>
                    {method.icon || "💳"}
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{method.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 italic">{currency} {(method.amount || 0).toLocaleString()}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
