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
  cumulativeData = [],
  prevCumulativeData = [],
  isLoading = false
}: TotalSpentCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showLastCycle, setShowLastCycle] = React.useState(false);
  const [hoveredPoint, setHoveredPoint] = React.useState<number | null>(null);

  // Calculate dynamic cycle variables
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();

  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(1, Math.min(totalDays, Math.round((now - start) / (1000 * 60 * 60 * 24))));
  const cycleProgress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

  // Chart preparation
  const currentMax = cumulativeData.length > 0 ? Math.max(...cumulativeData.map((d: any) => d.amount)) : 0;
  const prevMax = (showLastCycle && prevCumulativeData.length > 0) ? Math.max(...prevCumulativeData.map((d: any) => d.amount)) : 0;
  const maxAmount = Math.max(currentMax, prevMax, 1000);
  const yAxisMax = Math.ceil(maxAmount / 5000) * 5000 || 5000;

  const svgWidth = 700;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 25;
  const availableWidth = svgWidth - paddingX * 2;
  const availableHeight = svgHeight - paddingY * 2;

  const points = React.useMemo(() => {
    if (!cumulativeData || cumulativeData.length === 0) return [];
    const step = availableWidth / Math.max(1, totalDays - 1);
    return cumulativeData.map((d: any, i: number) => ({
      x: paddingX + (d.day - 1) * step,
      y: svgHeight - paddingY - (d.amount / yAxisMax) * availableHeight,
      ...d
    }));
  }, [cumulativeData, yAxisMax, totalDays, availableWidth, availableHeight]);

  const prevPoints = React.useMemo(() => {
    if (!showLastCycle || !prevCumulativeData || prevCumulativeData.length === 0) return [];
    const step = availableWidth / Math.max(1, totalDays - 1);
    return prevCumulativeData.map((d: any, i: number) => ({
      x: paddingX + (d.day - 1) * step,
      y: svgHeight - paddingY - (d.amount / yAxisMax) * availableHeight,
      ...d
    }));
  }, [prevCumulativeData, showLastCycle, yAxisMax, totalDays, availableWidth, availableHeight]);

  const buildPaths = (pts: any[]) => {
    if (pts.length === 0) return { linePath: "", areaPath: "" };
    let linePath = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      linePath += ` L ${pts[i].x} ${pts[i].y}`;
    }
    const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${svgHeight - paddingY} L ${pts[0].x} ${svgHeight - paddingY} Z`;
    return { linePath, areaPath };
  };

  const currentPaths = buildPaths(points);
  const prevPaths = buildPaths(prevPoints);

  const tickIndices = React.useMemo(() => {
    const targets = [1, 5, 10, 15, 20, 25, totalDays];
    return targets.filter(t => t <= totalDays);
  }, [totalDays]);

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

            {/* Dark Status Bottom Bar (Clickable) */}
            <div 
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-[#1A1A1A] text-[#ffffff] p-3 px-6 flex items-center justify-between text-[10px] font-mono select-none cursor-pointer hover:bg-[#262626] transition-colors group"
            >
              <span className="text-[#777777] font-bold flex items-center gap-2">
                <span>ELAPSED: {daysElapsed}/{totalDays} DAYS ({cycleProgress}%)</span>
                <span className="text-slate-500 group-hover:text-white transition-colors text-xs">
                  {isExpanded ? "▲" : "▼"}
                </span>
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

            {/* Expandable Chart Drawer */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden bg-[#fafafa] text-[#1A1A1A] border-t border-slate-200/80 p-4 md:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 font-mono">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FF9D00]" />
                        CUMULATIVE EXPENSE TREND
                      </h4>
                      <p className="text-[10px] text-[#777777] font-bold mt-0.5">Day-by-day accumulation over cycle</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLastCycle(!showLastCycle);
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        showLastCycle 
                          ? "bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-sm" 
                          : "bg-white border-slate-200 text-[#777777] hover:text-[#1A1A1A] hover:border-slate-300"
                      }`}
                    >
                      {showLastCycle ? "✓ Comparing Last Cycle" : "+ Compare Last Cycle"}
                    </button>
                  </div>

                  {/* SVG Chart */}
                  <div className="relative">
                    <svg
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                      className="w-full h-auto overflow-visible select-none"
                    >
                      <defs>
                        <linearGradient id="v2CumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1A1A1A" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#1A1A1A" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      {[0, 0.33, 0.66, 1].map((ratio, i) => {
                        const y = paddingY + ratio * availableHeight;
                        const val = Math.round(yAxisMax * (1 - ratio));
                        return (
                          <g key={i}>
                            <line
                              x1={paddingX}
                              y1={y}
                              x2={svgWidth - paddingX}
                              y2={y}
                              stroke="#e2e8f0"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={paddingX - 8}
                              y={y + 3}
                              textAnchor="end"
                              className="text-[8.5px] font-mono fill-[#777777] font-bold"
                            >
                              {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                            </text>
                          </g>
                        );
                      })}

                      {/* Last Cycle Area & Line */}
                      {showLastCycle && prevPaths.linePath && (
                        <path
                          d={prevPaths.linePath}
                          fill="none"
                          stroke="#94A3B8"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          opacity="0.8"
                        />
                      )}

                      {/* Current Cycle Area & Line */}
                      {currentPaths.areaPath && (
                        <path d={currentPaths.areaPath} fill="url(#v2CumulativeGrad)" />
                      )}
                      {currentPaths.linePath && (
                        <path
                          d={currentPaths.linePath}
                          fill="none"
                          stroke="#1A1A1A"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Data Points */}
                      {points.map((pt: any, i: number) => {
                        const isHovered = hoveredPoint === i;
                        return (
                          <g key={i}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered ? 5 : 2.5}
                              fill="#1A1A1A"
                              stroke={isHovered ? "#FF9D00" : "transparent"}
                              strokeWidth={isHovered ? 2.5 : 0}
                              className="transition-all duration-150"
                            />
                            <rect
                              x={pt.x - 8}
                              y={paddingY}
                              width={16}
                              height={availableHeight}
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredPoint(i)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          </g>
                        );
                      })}

                      {/* X Axis Ticks */}
                      {tickIndices.map((dayNum) => {
                        const pt = points.find((p: any) => p.day === dayNum);
                        if (!pt) return null;
                        return (
                          <text
                            key={dayNum}
                            x={pt.x}
                            y={svgHeight - 4}
                            textAnchor="middle"
                            className="text-[9px] font-mono fill-[#777777] font-bold"
                          >
                            D{dayNum}
                          </text>
                        );
                      })}
                    </svg>

                    {/* Hover Tooltip */}
                    {hoveredPoint !== null && points[hoveredPoint] && (
                      <div
                        className="absolute bg-[#1A1A1A] text-white text-[10px] font-mono p-2.5 rounded-xl border border-slate-800 shadow-xl pointer-events-none z-20"
                        style={{
                          left: `${(points[hoveredPoint].x / svgWidth) * 100}%`,
                          top: `${(points[hoveredPoint].y / svgHeight) * 100 - 25}%`,
                          transform: "translateX(-50%) translateY(-50%)"
                        }}
                      >
                        <p className="font-bold text-[#777777]">DAY {points[hoveredPoint].day} ({points[hoveredPoint].dateStr})</p>
                        <p className="text-xs font-black text-[#00FF00] mt-0.5">
                          THB {points[hoveredPoint].amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[9px] text-slate-300 mt-0.5">
                          Daily: +{points[hoveredPoint].dayAmount.toLocaleString()}
                        </p>
                        {showLastCycle && prevCumulativeData[hoveredPoint] && (
                          <p className="text-[9px] text-slate-400 mt-0.5 border-t border-slate-700 pt-0.5">
                            Last cycle: THB {prevCumulativeData[hoveredPoint].amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Legend & Summary Footer */}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/80 text-[10px] font-mono text-[#777777]">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] inline-block" />
                        <span className="font-bold">Current Cycle</span>
                      </div>
                      {showLastCycle && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-0.5 bg-slate-400 inline-block border-b border-dashed" />
                          <span className="font-bold">Last Cycle</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <span>Today Cumulative: </span>
                      <span className="font-black text-[#1A1A1A]">THB {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

