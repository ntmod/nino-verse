"use client";

import React, { useMemo } from "react";
import { Settings } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, animate } from "framer-motion";

interface CategoryAverage {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  dailyAverage: number;
  color: string;
}

interface MetricsCardProps {
  dailyAverage: number;
  breakdown?: CategoryAverage[];
  startDate?: Date;
  endDate?: Date;
  dailyLimit?: number;
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

export default function MetricsCard({ 
  dailyAverage = 0, 
  breakdown = [], 
  startDate,
  endDate,
  dailyLimit = 500,
  isLoading = false
}: MetricsCardProps) {
  // Estimate ends: daily average multiplied by total days in the cycle
  const estimatedEnd = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const totalDays = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));
    return dailyAverage * totalDays;
  }, [dailyAverage, startDate, endDate]);

  const isOverLimit = dailyAverage > dailyLimit;

  return (
    <div className="relative rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 flex flex-col w-full justify-between overflow-hidden">
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
              <div className="h-2.5 bg-slate-700 w-32 animate-pulse rounded-md" />
              <div className="h-2.5 bg-slate-700 w-16 animate-pulse rounded-md" />
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
            {/* Top Core Details */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#777777] text-[10px] font-black uppercase tracking-[0.2em] mb-1">DAILY AVERAGE</p>
                  <p className="text-2xl md:text-3xl font-black text-[#1A1A1A] italic leading-none">
                    THB <AnimatedNumber value={dailyAverage} decimals={2} />
                  </p>
                  {/* Projected cycle total based on current average */}
                  <p className="text-[10px] font-mono text-[#777777] mt-2 font-bold select-none">
                    EST. CYCLE END: <span className="text-[#1A1A1A]">THB <AnimatedNumber value={estimatedEnd} decimals={0} /></span>
                  </p>
                </div>
                <Link href="/nori/settings/daily-average">
                  <button 
                    title="Configure daily average categories"
                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-[#1A1A1A] transition-all cursor-pointer shrink-0"
                  >
                    <Settings className="w-4 h-4 transition-colors" />
                  </button>
                </Link>
              </div>

              {breakdown.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-[9px] font-black text-[#777777] uppercase tracking-[0.15em] mb-3">BY CATEGORY</p>
                  <motion.div 
                    className={`flex flex-col gap-1.5 ${
                      breakdown.length > 4 ? "max-h-[192px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent" : ""
                    }`}
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.05
                        }
                      }
                    }}
                  >
                    {breakdown.map((item) => {
                      const weight = dailyAverage > 0 ? Math.round((item.dailyAverage / dailyAverage) * 100) : 0;
                      const barColor = weight > 50 
                        ? "bg-[#FF3B30]" 
                        : weight > 20 
                        ? "bg-[#FFA500]" 
                        : "bg-[#008000]";

                      return (
                        <motion.div 
                          key={item.categoryId} 
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
                          }}
                          className="flex items-center justify-between py-2.5 border-b border-dashed border-slate-100 last:border-none last:pb-0 font-bold text-[#333333]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{item.categoryIcon}</span>
                            <div className="flex flex-col text-left">
                              <span className="text-[#777777] uppercase text-[9px] font-black tracking-wider leading-none">{item.categoryName}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[#1A1A1A] font-mono text-[11px] leading-none mb-1">
                              THB <AnimatedNumber value={item.dailyAverage} decimals={2} />
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-mono text-[#777777] font-bold select-none leading-none">
                                {weight}%
                              </span>
                              <div className="w-16 h-2 border border-slate-200 bg-white rounded-full overflow-hidden shrink-0">
                                <div className={`h-full ${barColor} rounded-full`} style={{ width: `${Math.min(100, weight)}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              )}
            </div>

            {/* Warning/Limits bottom indicator */}
            <div className={`p-3 px-6 flex items-center justify-between text-[10px] font-mono select-none font-black ${
              isOverLimit ? "bg-[#FF3B30] text-white" : "bg-[#1A1A1A] text-white"
            }`}>
              <span>LIMITS CHECK</span>
              <span>
                {isOverLimit 
                  ? `OVER LIMIT (${dailyLimit} THB/DAY) ⚠️` 
                  : `HEALTHY (< ${dailyLimit} THB/DAY) ✓`
                }
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
