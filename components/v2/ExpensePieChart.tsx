"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { PieChart, ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryData {
  name: string;
  amount: number;
  color: string;
}

interface ExpensePieChartProps {
  data: CategoryData[];
  prevData?: CategoryData[];
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

export default function ExpensePieChart({ 
  data = [], 
  prevData = [],
  currency = "THB",
  isLoading = false
}: ExpensePieChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showCompare, setShowCompare] = useState(false);

  const total = useMemo(() => data.reduce((sum, item) => sum + item.amount, 0), [data]);

  // Calculate segment offset data for current cycle
  let currentPercentage = 0;
  const segments = data.map((item) => {
    const percentage = total > 0 ? (item.amount / total) * 100 : 0;
    const offset = currentPercentage;
    currentPercentage += percentage;

    // Find previous cycle amount for comparison
    const prevItem = prevData.find(p => p.name.toLowerCase() === item.name.toLowerCase());
    const prevAmount = prevItem ? prevItem.amount : 0;

    return { ...item, percentage, offset, prevAmount };
  });

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(segments.length / ITEMS_PER_PAGE);
  const currentSegments = segments.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const activeSegment = hoveredCategory ? segments.find(s => s.name === hoveredCategory) : null;

  return (
    <div className="relative rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 min-h-[380px] flex flex-col justify-between overflow-hidden">
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
                <div className="h-3.5 bg-slate-200 rounded-md w-40" />
              </div>
              <div className="flex flex-col items-center gap-6 animate-pulse">
                {/* Horizontal progress bar skeleton */}
                <div className="w-full h-8 bg-slate-100 border border-slate-200 rounded-md" />
                {/* Legend Skeleton */}
                <div className="w-full space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 bg-slate-200 rounded-md shrink-0" />
                        <div className="h-3.5 bg-slate-200 rounded-md w-24" />
                      </div>
                      <div className="h-3.5 bg-slate-200 rounded-md w-8" />
                    </div>
                  ))}
                </div>
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
              <div className="flex items-center justify-between mb-4 font-mono select-none">
                <h3 className="text-[10px] font-black text-[#777777] uppercase tracking-[0.2em]">
                  SPENDING DISTRIBUTION
                </h3>
                <button
                  onClick={() => setShowCompare(!showCompare)}
                  className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    showCompare 
                      ? "bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-sm" 
                      : "bg-white border-slate-200 text-[#777777] hover:text-[#1A1A1A] hover:border-slate-300"
                  }`}
                >
                  {showCompare ? "✓ Comparing Last Cycle" : "+ Compare Last Cycle"}
                </button>
              </div>

              {data.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 font-mono">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    <PieChart className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider">NO CATEGORIZED DATA</p>
                    <p className="text-[10px] text-[#777777]">Charts will appear once you log expenses.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  
                  {/* HORIZONTAL PROGRESS RIBBON */}
                  <div className="w-full flex flex-col gap-3 font-mono">
                    <div className="w-full h-8 border border-slate-200 bg-white flex overflow-hidden select-none rounded-md">
                      {segments.map((seg) => (
                        <div 
                          key={seg.name}
                          className="h-full border-r border-slate-200 last:border-r-0 transition-opacity duration-150 cursor-pointer"
                          style={{ 
                            width: `${seg.percentage}%`,
                            backgroundColor: seg.color,
                            opacity: hoveredCategory ? (hoveredCategory === seg.name ? 1 : 0.3) : 1
                          }}
                          onMouseEnter={() => setHoveredCategory(seg.name)}
                          onMouseLeave={() => setHoveredCategory(null)}
                        />
                      ))}
                    </div>
                    <div className="min-h-[18px] text-center text-[10px] font-bold">
                      {activeSegment ? (
                        <span style={{ color: activeSegment.color }}>
                          {activeSegment.name.toUpperCase()}: <AnimatedNumber value={activeSegment.percentage} decimals={0} />% (THB <AnimatedNumber value={activeSegment.amount} decimals={0} />)
                          {showCompare && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[#777777] font-bold text-[9px] inline-block">
                              LAST CYCLE: THB {activeSegment.prevAmount.toLocaleString()}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[#777777]">HOVER RIBBON SEGMENTS FOR DETAILS</span>
                      )}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="w-full">
                    <div className="min-h-[190px]">
                      <div className="flex flex-col">
                        {currentSegments.map((segment) => (
                          <div 
                            key={segment.name}
                            className={`flex items-center justify-between py-2 border-b border-dashed border-slate-100 last:border-none last:pb-0 group cursor-pointer transition-opacity duration-200 ${
                              hoveredCategory && hoveredCategory !== segment.name ? 'opacity-30' : 'opacity-100'
                            }`}
                            onMouseEnter={() => setHoveredCategory(segment.name)}
                            onMouseLeave={() => setHoveredCategory(null)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-3 shrink-0 flex items-center justify-center">
                                {hoveredCategory === segment.name ? (
                                  <motion.span 
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-[10px] text-[#1A1A1A] font-black"
                                  >
                                    ▶
                                  </motion.span>
                                ) : null}
                              </span>
                              <div className="w-3.5 h-3.5 rounded-sm border border-slate-200 shrink-0" style={{ backgroundColor: segment.color }} />
                              <span className="text-xs font-bold text-[#333333] group-hover:text-[#1A1A1A] transition-colors uppercase tracking-tight">{segment.name}</span>
                            </div>
                            <div className="text-xs font-black text-[#1A1A1A] italic font-mono flex items-center gap-2">
                              {showCompare ? (
                                <div className="flex items-center gap-2 not-italic text-[10px] font-mono">
                                  {/* Last Cycle Pill */}
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-bold">
                                    LAST: THB <AnimatedNumber value={segment.prevAmount} decimals={0} />
                                  </span>
                                  <span className="text-slate-300 font-black">→</span>
                                  {/* Current Cycle Pill */}
                                  <span className="px-1.5 py-0.5 rounded bg-[#1A1A1A] text-white font-bold">
                                    CURR: THB <AnimatedNumber value={segment.amount} decimals={0} /> ({Math.round(segment.percentage)}%)
                                  </span>
                                  {/* Diff indicator */}
                                  {segment.amount - segment.prevAmount !== 0 && (
                                    <span className={`font-black text-[9px] ${
                                      segment.amount - segment.prevAmount > 0 ? "text-rose-500" : "text-emerald-500"
                                    }`}>
                                      ({segment.amount - segment.prevAmount > 0 ? `+${(segment.amount - segment.prevAmount).toLocaleString()}` : (segment.amount - segment.prevAmount).toLocaleString()})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <span className="text-[9px] font-bold text-[#777777] not-italic mr-1">
                                    THB <AnimatedNumber value={segment.amount} decimals={0} />
                                  </span>
                                  <span>
                                    <AnimatedNumber value={segment.percentage} decimals={0} />%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Brutalist Pagination Row */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed border-slate-100">
                        <button 
                          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                          disabled={currentPage === 0}
                          className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-[#1A1A1A] hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1A1A1A] transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[9px] font-mono font-black text-[#777777] uppercase tracking-widest">
                          PAGE {currentPage + 1} OF {totalPages}
                        </span>
                        <button 
                          onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={currentPage === totalPages - 1}
                          className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-[#1A1A1A] hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1A1A1A] transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Status Bottom Bar */}
            <div className="bg-[#1A1A1A] text-[#ffffff] p-3 px-6 flex items-center justify-between text-[10px] font-mono select-none">
              <span className="text-[#777777] font-bold">
                EXPENSE DISTRIBUTION
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


