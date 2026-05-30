"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { PieChart, ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryData {
  name: string;
  amount: number;
  color: string;
}

interface ExpensePieChartProps {
  data: CategoryData[];
  currency?: string;
  isLoading?: boolean;
}

export default function ExpensePieChart({ 
  data = [], 
  currency = "THB",
  isLoading = false
}: ExpensePieChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const total = useMemo(() => data.reduce((sum, item) => sum + item.amount, 0), [data]);

  // Calculate SVG paths for segments
  let currentPercentage = 0;
  const segments = data.map((item) => {
    const percentage = total > 0 ? (item.amount / total) * 100 : 0;
    const offset = currentPercentage;
    currentPercentage += percentage;
    return { ...item, percentage, offset };
  });

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(segments.length / ITEMS_PER_PAGE);
  const currentSegments = segments.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const activeSegment = hoveredCategory ? segments.find(s => s.name === hoveredCategory) : null;

  if (isLoading) {
    return (
      <div className="p-5 md:p-8 rounded-3xl bg-white border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.05)] min-h-[480px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="h-4 bg-slate-100 rounded-full w-40 animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-8 md:gap-16">
            {/* Donut Chart Skeleton */}
            <div className="relative w-64 h-64 flex items-center justify-center animate-pulse">
              <div className="w-48 h-48 rounded-full border-[16px] border-slate-50 flex items-center justify-center">
                <div className="w-16 h-4 bg-slate-100 rounded-full" />
              </div>
            </div>
            {/* Legend Skeleton */}
            <div className="w-full space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-slate-100 shrink-0" />
                    <div className="h-4 bg-slate-100 rounded-full w-24 md:w-32" />
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-5 md:p-8 rounded-3xl bg-white border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
    >
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Spending by Category</h3>

      {data.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-black/5 flex items-center justify-center">
            <PieChart className="w-8 h-8 text-slate-200" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900 tracking-tight">No Categorized Data</p>
            <p className="text-xs font-medium text-slate-400">Charts will appear once you log expenses.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8 md:gap-16">
        {/* Pie SVG */}
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-[0_10px_10px_rgba(0,0,0,0.1)]">
            {segments.map((segment, index) => (
              <motion.circle
                key={segment.name}
                cx="50"
                cy="50"
                r="36"
                pathLength="100"
                fill="transparent"
                stroke={segment.color}
                strokeWidth="16"
                strokeDasharray={`${Math.max(0, segment.percentage - 1.5)} 100`}
                strokeDashoffset={-segment.offset}
                initial={{ strokeDasharray: "0 100" }}
                animate={{ 
                  strokeDasharray: `${Math.max(0, segment.percentage - 1.5)} 100`,
                  opacity: hoveredCategory ? (hoveredCategory === segment.name ? 1 : 0.3) : 1
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                strokeLinecap="round"
                className="cursor-pointer transition-all hover:stroke-[20px]"
                onMouseEnter={() => setHoveredCategory(segment.name)}
                onMouseLeave={() => setHoveredCategory(null)}
                onTouchStart={() => setHoveredCategory(segment.name)}
                onTouchEnd={() => setHoveredCategory(null)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              {activeSegment ? (
                <motion.div 
                  key="active"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4 line-clamp-1">{activeSegment.name}</span>
                  <span className="text-2xl font-black italic mt-1" style={{ color: activeSegment.color }}>
                    {Math.round(activeSegment.percentage)}%
                  </span>
                  <span className="text-xs font-black text-slate-900 italic mt-0.5">
                    {currency} {activeSegment.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </motion.div>
              ) : (
                <motion.div 
                  key="total"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-sm font-black text-slate-900 italic">{currency}</span>
                  <span className="text-xl font-black text-slate-900 italic -mt-1">{total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full">
          <div className="min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentPage}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {currentSegments.map((segment, index) => (
                  <div 
                    key={segment.name}
                    className={`flex items-center justify-between group cursor-pointer transition-opacity duration-300 ${hoveredCategory && hoveredCategory !== segment.name ? 'opacity-30' : 'opacity-100'}`}
                    onMouseEnter={() => setHoveredCategory(segment.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onTouchStart={() => setHoveredCategory(segment.name)}
                    onTouchEnd={() => setHoveredCategory(null)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: segment.color }} />
                      <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{segment.name}</span>
                    </div>
                    <div className="text-sm font-black text-slate-900 italic">
                      {Math.round(segment.percentage)}%
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-black/5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-black/5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      )}
    </motion.div>
  );
}
