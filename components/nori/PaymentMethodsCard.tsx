"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { CreditCard } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

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

export default function PaymentMethodsCard({ 
  methods = [], 
  currency = "THB",
  isLoading = false
}: PaymentMethodsCardProps) {
  const { t } = useLanguage();
  const total = useMemo(() => methods.reduce((sum, item) => sum + (item.amount || 0), 0), [methods]);

  return (
    <div className="relative rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 min-h-[200px] flex flex-col justify-between overflow-hidden">
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
                <div className="h-3.5 bg-slate-200 rounded-md w-36" />
              </div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-dashed border-slate-100 last:border-none animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-slate-200 rounded-md shrink-0" />
                      <div className="h-3.5 bg-slate-200 rounded-md w-20 md:w-28" />
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
            {/* Top Segment */}
            <div className="p-4 md:p-6 pb-4">
              <h3 className="text-[10px] font-black text-[#777777] uppercase tracking-[0.2em] mb-6 select-none font-mono">
                {t("payment_methods")}
              </h3>

              {methods.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 font-mono">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider">NO METHODS LINKED</p>
                    <p className="text-[10px] text-[#777777]">Add a card or wallet to see your balance.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  {methods.map((method, index) => {
                    return (
                      <div 
                        key={method._id || index}
                        className="flex items-center justify-between py-2.5 border-b-2 border-dashed border-slate-100 last:border-none last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          {/* Floating emoji icon matching lists */}
                          <span className="text-lg select-none shrink-0">{method.icon || "💳"}</span>
                          <div className="flex flex-col justify-center">
                            <p className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wide">{method.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-[#1A1A1A] italic font-mono">
                            {currency} <AnimatedNumber value={method.amount || 0} decimals={2} />
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dark Status Bottom Bar */}
            <div className="bg-[#1A1A1A] text-[#ffffff] p-3 px-6 flex items-center justify-between text-[10px] font-mono select-none">
              <span className="text-[#777777] font-bold">
                {t("total_tracked")}
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
