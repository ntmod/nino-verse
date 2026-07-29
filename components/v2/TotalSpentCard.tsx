"use client";

import React from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface TotalSpentCardProps {
  amount: number;
  currency?: string;
  percentageChange: number;
  dailyAverage: number;
  startDate: Date;
  endDate: Date;
  cumulativeData?: any;
  prevCumulativeData?: any;
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

export default function TotalSpentCard({
  amount = 0,
  currency = "THB",
  percentageChange = 0,
  startDate,
  endDate,
  isLoading = false
}: TotalSpentCardProps) {
  // Calculate dynamic cycle variables
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();

  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(1, Math.min(totalDays, Math.round((now - start) / (1000 * 60 * 60 * 24))));
  const cycleProgress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 text-left flex flex-col justify-between min-h-[140px]">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col justify-between"
          >
            {/* Top Segment Loading */}
            <div className="p-6 pb-4 space-y-4">
              <div className="h-3 bg-slate-200 w-24 animate-pulse rounded-md" />
              <div className="flex gap-2 items-baseline">
                <div className="h-6 bg-slate-200 w-10 animate-pulse rounded-md" />
                <div className="h-10 bg-slate-200 w-36 animate-pulse rounded-md" />
              </div>
            </div>

            {/* Bottom Segment Loading */}
            <div className="bg-[#1A1A1A] p-3.5 px-6 flex items-center justify-between min-h-[44px]">
              <div className="h-2.5 bg-slate-700 w-28 animate-pulse rounded-md" />
              <div className="h-2.5 bg-slate-700 w-20 animate-pulse rounded-md" />
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
            {/* Top Section */}
            <div className="p-6 pb-4">
              <p className="text-[#777777] text-xs font-bold uppercase tracking-[0.2em] font-mono mb-2">TOTAL SPENT</p>
              <div className="flex items-baseline gap-2">
                <span className="text-[#777777] text-2xl font-black italic">{currency}</span>
                <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] italic tracking-tighter">
                  <AnimatedNumber value={amount} decimals={2} />
                </h2>
              </div>
            </div>

            {/* Dark Status Bottom Bar */}
            <div className="bg-[#1A1A1A] text-[#ffffff] p-3 px-6 flex items-center justify-between text-[10px] font-mono select-none">
              <span className="text-[#777777] font-bold">
                ELAPSED: {daysElapsed}/{totalDays} DAYS ({cycleProgress}%)
              </span>
              {percentageChange < 0 ? (
                <span className="text-[#00FF00] font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5 rotate-180 text-current" />
                  <AnimatedNumber value={Math.abs(percentageChange)} decimals={1} />% VS LAST CYCLE
                </span>
              ) : percentageChange > 0 ? (
                <span className="text-[#FF3B30] font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-current" />
                  +<AnimatedNumber value={percentageChange} decimals={1} />% VS LAST CYCLE
                </span>
              ) : (
                <span className="text-[#ffffff] font-bold">
                  0% VS LAST CYCLE
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
