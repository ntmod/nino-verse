'use client'

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { transactionService } from "@/lib/services/transactionService";
import { Transaction } from "@/lib/types";

export default function AnnualCumulativeChart() {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-indexed (Jan = 0)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setIsLoading(true);
        // Start and End of the selected month
        const startDate = new Date(selectedYear, selectedMonth, 1).toISOString();
        const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999).toISOString();
        const data = await transactionService.getAll(startDate, endDate);
        setTransactions(data);
      } catch (error) {
        console.error("Failed to fetch monthly transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMonthlyData();
  }, [selectedYear, selectedMonth]);

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // Number of days in selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Calculate daily totals and cumulative sums
  const cumulativeData = useMemo(() => {
    const dailyTotals = Array(daysInMonth).fill(0);
    
    transactions.forEach(tx => {
      if (tx.amount < 0) {
        const txDate = new Date(tx.date);
        const day = txDate.getDate(); // 1-indexed
        if (day >= 1 && day <= daysInMonth) {
          dailyTotals[day - 1] += Math.abs(tx.amount);
        }
      }
    });

    const cumulative = [];
    let runningTotal = 0;
    for (let i = 0; i < daysInMonth; i++) {
      runningTotal += dailyTotals[i];
      cumulative.push({
        day: i + 1,
        amount: runningTotal,
        dailySpent: dailyTotals[i]
      });
    }
    return cumulative;
  }, [transactions, daysInMonth]);

  const totalSpent = cumulativeData[daysInMonth - 1]?.amount || 0;
  const maxY = Math.max(...cumulativeData.map(d => d.amount), 1000);
  const yAxisMax = Math.ceil(maxY / 5000) * 5000;

  // Generate SVG path coordinates
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 25;

  const points = useMemo(() => {
    const availableWidth = svgWidth - paddingX * 2;
    const availableHeight = svgHeight - paddingY * 2;

    return cumulativeData.map((d, i) => {
      const x = paddingX + (i / (daysInMonth - 1)) * availableWidth;
      const y = svgHeight - paddingY - (d.amount / yAxisMax) * availableHeight;
      return { x, y, ...d };
    });
  }, [cumulativeData, yAxisMax, daysInMonth]);

  // Generate SVG path string for line and area
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: "", areaPath: "" };
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    const area = `${path} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;
    return { linePath: path, areaPath: area };
  }, [points]);

  // Filter X Axis ticks to keep labels clean
  const tickIndices = useMemo(() => {
    const indices: number[] = [];
    // Always show 1st, 5th, 10th, 15th, 20th, 25th and the last day
    const targets = [1, 5, 10, 15, 20, 25, daysInMonth];
    targets.forEach(t => {
      indices.push(t - 1);
    });
    return indices;
  }, [daysInMonth]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const isNextDisabled = selectedYear >= today.getFullYear() && selectedMonth >= today.getMonth();

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-black text-slate-900 italic tracking-tighter flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#FF9D00]" /> Monthly Cumulative Trend
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Day-by-day spending accumulation</p>
        </div>
        
        {/* Month/Year selector controls */}
        <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto">
          <button 
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-sm font-black text-slate-900 w-36 text-center select-none font-mono">
            {months[selectedMonth]} {selectedYear}
          </span>
          <button 
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-30"
            disabled={isNextDisabled}
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#FF9D00] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Cumulative Data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chart Wrapper */}
          <div className="relative pt-4">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF9D00" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#FF9D00" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Y-Axis Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingY + ratio * (svgHeight - paddingY * 2);
                const value = Math.round(yAxisMax * (1 - ratio));
                return (
                  <g key={i} className="opacity-40">
                    <line 
                      x1={paddingX} 
                      y1={y} 
                      x2={svgWidth - paddingX} 
                      y2={y} 
                      stroke="#E2E8F0" 
                      strokeWidth="1" 
                      strokeDasharray="4 4" 
                    />
                    <text 
                      x={paddingX - 8} 
                      y={y + 3} 
                      textAnchor="end" 
                      className="text-[9px] font-mono font-bold fill-slate-400"
                    >
                      {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                    </text>
                  </g>
                );
              })}

              {/* Area Under Line */}
              {areaPath && (
                <path d={areaPath} fill="url(#cumulativeGrad)" />
              )}

              {/* Main Line */}
              {linePath && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="#FF9D00" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* Interactive Circles / Hover Zones */}
              {points.map((pt, i) => {
                const isHovered = hoveredPoint === i;
                return (
                  <g key={i}>
                    {/* Circle Anchor */}
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r={isHovered ? 6 : 2.5} 
                      fill={isHovered ? "#FF9D00" : "#FF9D00"} 
                      stroke={isHovered ? "#ffffff" : "transparent"}
                      strokeWidth={isHovered ? 2.5 : 0} 
                      className="transition-all duration-150"
                    />
                    
                    {/* Hidden Hover Target Zone */}
                    <rect 
                      x={pt.x - 8} 
                      y={paddingY} 
                      width={16} 
                      height={svgHeight - paddingY * 2} 
                      fill="transparent" 
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              })}

              {/* X Axis Labels (Filtered to not clutter) */}
              {points.map((pt, i) => {
                const isTick = tickIndices.includes(i);
                if (!isTick) return null;
                return (
                  <text 
                    key={i} 
                    x={pt.x} 
                    y={svgHeight - 2} 
                    textAnchor="middle" 
                    className={`text-[9.5px] font-mono uppercase tracking-wider font-bold transition-colors ${
                      hoveredPoint === i ? "fill-[#FF9D00]" : "fill-slate-400"
                    }`}
                  >
                    Day {pt.day}
                  </text>
                );
              })}
            </svg>

            {/* Dynamic Tooltip Overlay */}
            {hoveredPoint !== null && points[hoveredPoint] && (
              <div 
                className="absolute bg-slate-900 text-white text-[10px] font-mono p-2.5 rounded-xl shadow-lg border border-slate-800 z-20 pointer-events-none"
                style={{
                  left: `${(points[hoveredPoint].x / svgWidth) * 100}%`,
                  top: `${(points[hoveredPoint].y / svgHeight) * 100 - 30}%`,
                  transform: "translateX(-50%) translateY(-50%)"
                }}
              >
                <p className="font-bold text-slate-400">DAY {points[hoveredPoint].day} CUMULATIVE</p>
                <p className="text-xs font-black text-[#FF9D00] mt-0.5">
                  THB {points[hoveredPoint].amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  Spent today: +{points[hoveredPoint].dailySpent.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Metric Footer */}
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-left font-mono">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Monthly Final Sum</span>
              <p className="text-lg font-black text-slate-900 leading-tight">THB {totalSpent.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
              <p className="text-xs font-bold text-emerald-500">Gradual Accumulation ✓</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
