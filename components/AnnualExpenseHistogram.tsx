'use client'

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { transactionService } from "@/lib/services/transactionService";
import { Transaction } from "@/lib/types";

export default function AnnualExpenseHistogram() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnualData = async () => {
      try {
        setIsLoading(true);
        const startDate = new Date(selectedYear, 0, 1).toISOString();
        const endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999).toISOString();
        const data = await transactionService.getAll(startDate, endDate);
        setTransactions(data);
      } catch (error) {
        console.error("Failed to fetch annual transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnnualData();
  }, [selectedYear]);

  const monthlyTotals = useMemo(() => {
    const totals = Array(12).fill(0);
    transactions.forEach(tx => {
      if (tx.amount < 0) {
        const date = new Date(tx.date);
        const month = date.getMonth();
        totals[month] += Math.abs(tx.amount);
      }
    });
    return totals;
  }, [transactions]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const { totalAnnualExpense, averageMonthlyExpense, peakMonthName, peakMonthValue } = useMemo(() => {
    const total = monthlyTotals.reduce((sum, val) => sum + val, 0);
    const activeMonthsCount = monthlyTotals.filter(val => val > 0).length || 1;
    const avg = total / activeMonthsCount;
    let maxVal = 0;
    let maxIdx = 0;
    monthlyTotals.forEach((val, idx) => {
      if (val > maxVal) {
        maxVal = val;
        maxIdx = idx;
      }
    });
    return {
      totalAnnualExpense: total,
      averageMonthlyExpense: avg,
      peakMonthName: maxVal > 0 ? months[maxIdx] : "N/A",
      peakMonthValue: maxVal
    };
  }, [monthlyTotals]);

  const maxExpense = Math.max(...monthlyTotals, 1000);
  const yAxisMax = Math.ceil(maxExpense / 10000) * 10000;

  const yAxisTicks = useMemo(() => {
    const ticks = [];
    for (let val = yAxisMax; val >= 0; val -= 10000) {
      ticks.push(val);
    }
    return ticks;
  }, [yAxisMax]);

  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <div className="w-full bg-white rounded-3xl border border-black/5 shadow-[0_10px_40px_rgba(0,0,0,0.03)] p-6 md:p-8 space-y-6">
      {/* Header with year selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-black text-slate-900 italic tracking-tighter">Annual Spending</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total spending breakdown by month</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto">
          <button 
            onClick={() => setSelectedYear(prev => prev - 1)}
            className="w-8 h-8 rounded-xl border border-black/5 flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-sm font-black text-slate-900 w-16 text-center">{selectedYear}</span>
          <button 
            onClick={() => setSelectedYear(prev => prev + 1)}
            className="w-8 h-8 rounded-xl border border-black/5 flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-30"
            disabled={selectedYear >= new Date().getFullYear()}
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-black/5 rounded-2xl p-4 flex items-center gap-4 text-left">
          <div className="w-10 h-10 bg-[#FF9D00]/10 rounded-xl flex items-center justify-center text-[#FF9D00] shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Annual Total</p>
            <p className="text-base font-black text-slate-900 leading-tight mt-0.5">{totalAnnualExpense.toLocaleString('en-US')} <span className="text-[10px] font-bold text-slate-400">THB</span></p>
          </div>
        </div>

        <div className="bg-slate-50 border border-black/5 rounded-2xl p-4 flex items-center gap-4 text-left">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Avg</p>
            <p className="text-base font-black text-slate-900 leading-tight mt-0.5">{Math.round(averageMonthlyExpense).toLocaleString('en-US')} <span className="text-[10px] font-bold text-slate-400">THB</span></p>
          </div>
        </div>

        <div className="bg-slate-50 border border-black/5 rounded-2xl p-4 flex items-center gap-4 text-left">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Month</p>
            <p className="text-base font-black text-slate-900 leading-tight mt-0.5">
              {peakMonthName} 
              {peakMonthValue > 0 && (
                <span className="text-[10px] font-bold text-slate-400 ml-1">({Math.round(peakMonthValue).toLocaleString('en-US')})</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Histogram Chart */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#FF9D00] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Analytics...</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Styled SVG Chart */}
          <div className="w-full overflow-x-auto select-none pt-8">
            <div className="min-w-[500px] h-64 flex items-end justify-between px-2 relative">
              {/* Y-Axis Grid Lines */}
              <div className="absolute inset-0 pointer-events-none pb-8 text-[9px] font-bold text-slate-300">
                {yAxisTicks.map((tick) => {
                  const bottomPercent = (tick / yAxisMax) * 100;
                  return (
                    <div 
                      key={tick} 
                      className={`absolute left-0 right-0 border-b flex justify-between pb-0.5 ${
                        tick === 0 ? "border-slate-200 font-black text-slate-400" : "border-dashed border-slate-100"
                      }`}
                      style={{ bottom: `${bottomPercent}%` }}
                    >
                      <span>{tick.toLocaleString('en-US')} THB</span>
                    </div>
                  );
                })}
              </div>

              {/* Bars container */}
              <div className="w-full h-full flex items-end justify-between z-10 pb-8 pt-4">
                {monthlyTotals.map((val, idx) => {
                  const percent = val / yAxisMax;
                  const heightPercent = `${percent * 100}%`;
                  const isHovered = hoveredBar === idx;

                  return (
                    <div 
                      key={idx}
                      className="flex-1 flex flex-col items-center group cursor-pointer h-full justify-end px-1 relative"
                      onMouseEnter={() => setHoveredBar(idx)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Interactive Tooltip positioned relative to individual bar */}
                      {isHovered && val > 0 && (
                        <div className="absolute z-30 pointer-events-none pb-2 flex flex-col items-center" style={{ bottom: heightPercent }}>
                          <motion.div 
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="bg-slate-950 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex flex-col items-center shadow-lg border border-white/10 whitespace-nowrap"
                          >
                            <span className="text-[8px] text-slate-400 uppercase font-black">{months[idx]} {selectedYear}</span>
                            <span>{val.toLocaleString('en-US')} THB</span>
                            {/* Arrow */}
                            <div className="w-1.5 h-1.5 bg-slate-950 rotate-45 mt-1 -mb-2 border-r border-b border-white/10" />
                          </motion.div>
                        </div>
                      )}

                      {/* Bar Graphic */}
                      <div className="w-full relative h-full flex items-end justify-center">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: heightPercent }}
                          transition={{ type: "spring", stiffness: 100, damping: 15 }}
                          className="w-full max-w-[28px] rounded-t-lg relative overflow-hidden"
                          style={{
                            background: isHovered 
                              ? "linear-gradient(180deg, #FFB338 0%, #FF9D00 100%)" 
                              : "linear-gradient(180deg, #FFC568 0%, #FFAF2A 100%)",
                            boxShadow: isHovered ? "0 4px 20px rgba(255, 157, 0, 0.4)" : "none"
                          }}
                        >
                          <div className="absolute top-0 left-0 right-0 h-1 bg-white/40" />
                        </motion.div>
                      </div>

                      {/* Month Label */}
                      <span className={`text-[10px] font-black uppercase mt-3 transition-colors duration-200 ${
                        isHovered ? "text-[#FF9D00]" : "text-slate-400"
                      }`}>
                        {months[idx]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
