"use client";

import React from "react";
import { motion, AnimatePresence, animate, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

import NoriPeek from "./NoriPeek";

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
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration: reducedMotion ? 0 : 0.8,
      delay: reducedMotion ? 0 : delay,
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
  }, [value, decimals, delay, reducedMotion]);

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
  const { t } = useLanguage();
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
    <div className="relative">
      {!isLoading && <NoriPeek />}
    <div className="relative overflow-hidden bg-[#fffdf5] shadow-[3px_4px_0_#e7dece,0_8px_24px_rgba(78,62,36,0.06)] border border-[#e1d7c5] text-left flex flex-col justify-between min-h-[140px]">
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
              <div className="h-3 bg-[#e7dece] w-24 animate-pulse rounded-md" />
              <div className="flex gap-2 items-baseline">
                <div className="h-6 bg-[#e7dece] w-10 animate-pulse rounded-md" />
                <div className="h-10 bg-[#e7dece] w-36 animate-pulse rounded-md" />
              </div>
            </div>

            {/* Bottom Segment Loading */}
            <div className="border-t border-dashed border-[#d9cebb] bg-[#f5eedf] p-3.5 px-6 flex items-center justify-between min-h-[44px]">
              <div className="h-2.5 bg-[#d9cebb] w-28 animate-pulse rounded-md" />
              <div className="h-2.5 bg-[#d9cebb] w-20 animate-pulse rounded-md" />
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
              <p className="text-[#93846b] text-xs font-bold uppercase tracking-[0.2em] font-mono mb-2">{t("total_spent")}</p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[#b97423] text-sm font-bold font-mono">{currency}</span>
                <h2 className="text-4xl md:text-5xl font-black text-[#292722] tracking-tighter tabular-nums">
                  <AnimatedNumber value={amount} decimals={2} />
                </h2>
              </div>
            </div>

            {/* Dark Status Bottom Bar (Clickable) */}
            <button
              type="button"
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded(!isExpanded)}
              className="border-t border-dashed border-[#d9cebb] bg-[#f5eedf] text-[#292722] p-3 px-6 flex flex-wrap gap-2 items-center justify-between text-[10px] font-mono select-none cursor-pointer hover:bg-[#efe4cf] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#d58a2b] transition-colors group"
            >
              <span className="text-[#93846b] font-bold flex items-center gap-2">
                <span>{daysElapsed}/{totalDays} {t("day")} ({cycleProgress}%)</span>
                <span className="text-[#b39a73] group-hover:text-[#292722] transition-colors text-xs">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </span>
              {percentageChange < 0 ? (
                <span className="text-[#508069] font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5 rotate-180 text-[#508069]" />
                  <span>{Math.abs(percentageChange).toFixed(1)}% {t("vs_prev_period")}</span>
                </span>
              ) : percentageChange > 0 ? (
                <span className="text-[#b96145] font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#b96145]" />
                  <span>+{percentageChange.toFixed(1)}% {t("vs_prev_period")}</span>
                </span>
              ) : (
                <span className="text-[#93846b] font-bold">0.0% {t("vs_prev_period")}</span>
              )}
            </button>

            {/* Expandable Chart Drawer */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden bg-[#f8f3e9] text-[#292722] border-t border-[#e1d7c5] p-4 md:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 font-mono">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#292722] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#d58a2b]" />
                        {t("ui_cumulative_expense_trend")}
                      </h4>
                      <p className="text-[10px] text-[#93846b] font-bold mt-0.5">{t("ui_day_by_day_accumulation_over_cycle")}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLastCycle(!showLastCycle);
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        showLastCycle 
                          ? "bg-[#292722] border-[#292722] text-white shadow-sm"
                          : "bg-[#fffdf5] border-[#d9cebb] text-[#93846b] hover:text-[#292722] hover:border-[#b39a73]"
                      }`}
                    >
                      {showLastCycle ? t("ui_comparing_last_cycle") : t("ui_compare_last_cycle")}
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
                          <stop offset="0%" stopColor="#292722" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#292722" stopOpacity="0.0" />
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
                              stroke="#e1d7c5"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={paddingX - 8}
                              y={y + 3}
                              textAnchor="end"
                              className="text-[8.5px] font-mono fill-[#93846b] font-bold"
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
                          stroke="#b6a68e"
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
                          stroke="#292722"
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
                              fill="#292722"
                              stroke={isHovered ? "#d58a2b" : "transparent"}
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
                            className="text-[9px] font-mono fill-[#93846b] font-bold"
                          >
                            D{dayNum}
                          </text>
                        );
                      })}
                    </svg>

                    {/* Hover Tooltip */}
                    {hoveredPoint !== null && points[hoveredPoint] && (
                      <div
                        className="absolute bg-[#292722] text-white text-[10px] font-mono p-2.5 rounded-xl border border-slate-800 shadow-xl pointer-events-none z-20"
                        style={{
                          left: `${(points[hoveredPoint].x / svgWidth) * 100}%`,
                          top: `${(points[hoveredPoint].y / svgHeight) * 100 - 25}%`,
                          transform: "translateX(-50%) translateY(-50%)"
                        }}
                      >
                        <p className="font-bold text-[#93846b]">{t("day")} {points[hoveredPoint].day} ({points[hoveredPoint].dateStr})</p>
                        <p className="text-xs font-black text-[#edbe67] mt-0.5">
                          THB {points[hoveredPoint].amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[9px] text-slate-300 mt-0.5">
                          {t("ui_daily")}{points[hoveredPoint].dayAmount.toLocaleString()}
                        </p>
                        {showLastCycle && prevCumulativeData[hoveredPoint] && (
                          <p className="text-[9px] text-slate-400 mt-0.5 border-t border-slate-700 pt-0.5">
                            {t("ui_last_cycle_thb")} {prevCumulativeData[hoveredPoint].amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Legend & Summary Footer */}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#e1d7c5] text-[10px] font-mono text-[#93846b]">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#292722] inline-block" />
                        <span className="font-bold">{t("ui_current_cycle")}</span>
                      </div>
                      {showLastCycle && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-0.5 bg-[#b6a68e] inline-block border-b border-dashed" />
                          <span className="font-bold">{t("ui_last_cycle")}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <span>{t("ui_today_cumulative")} </span>
                      <span className="font-black text-[#292722]">THB {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

