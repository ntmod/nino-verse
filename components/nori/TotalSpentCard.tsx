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
  defaultExpanded?: boolean;
  openEnded?: boolean;
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
  isLoading = false,
  defaultExpanded = false,
  openEnded = false
}: TotalSpentCardProps) {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const [showLastCycle, setShowLastCycle] = React.useState(false);
  const [hoveredPoint, setHoveredPoint] = React.useState<number | null>(null);

  // Calculate dynamic cycle variables
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();

  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(1, Math.min(totalDays, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1));
  const cycleProgress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

  const chartDays = Math.max(totalDays, showLastCycle ? prevCumulativeData.length : 0);

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
    const step = availableWidth / Math.max(1, chartDays - 1);
    return cumulativeData.map((d: any, i: number) => ({
      x: paddingX + (d.day - 1) * step,
      y: svgHeight - paddingY - (d.amount / yAxisMax) * availableHeight,
      ...d
    }));
  }, [cumulativeData, yAxisMax, chartDays, availableWidth, availableHeight]);

  const prevPoints = React.useMemo(() => {
    if (!showLastCycle || !prevCumulativeData || prevCumulativeData.length === 0) return [];
    const step = availableWidth / Math.max(1, chartDays - 1);
    return prevCumulativeData.map((d: any, i: number) => ({
      x: paddingX + (d.day - 1) * step,
      y: svgHeight - paddingY - (d.amount / yAxisMax) * availableHeight,
      ...d
    }));
  }, [prevCumulativeData, showLastCycle, yAxisMax, chartDays, availableWidth, availableHeight]);

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
    const targets = [1, 5, 10, 15, 20, 25, chartDays];
    return [...new Set(targets.filter(t => t <= chartDays))];
  }, [chartDays]);

  return (
    <div className="relative">
      {!isLoading && <NoriPeek />}
    <div data-paper-surface="" className="relative overflow-hidden bg-card rounded-md shadow-[0_2px_8px_rgba(78,62,36,0.03)] border border-border text-left flex flex-col justify-between min-h-[140px]">
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
              <div className="h-3 bg-paper-edge w-24 animate-pulse rounded-md" />
              <div className="flex gap-2 items-baseline">
                <div className="h-6 bg-paper-edge w-10 animate-pulse rounded-md" />
                <div className="h-10 bg-paper-edge w-36 animate-pulse rounded-md" />
              </div>
            </div>

            {/* Bottom Segment Loading */}
            <div className="border-t border-dashed border-border bg-secondary p-3.5 px-6 flex items-center justify-between min-h-[44px]">
              <div className="h-2.5 bg-border w-28 animate-pulse rounded-md" />
              <div className="h-2.5 bg-border w-20 animate-pulse rounded-md" />
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
              <p data-paper-title="" className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em] font-mono mb-2">{t("total_spent")}</p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-highlight-ink text-sm font-bold font-mono">{currency}</span>
                <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter tabular-nums">
                  <AnimatedNumber value={amount} decimals={2} />
                </h2>
              </div>
            </div>

            {/* Dark Status Bottom Bar (Clickable) */}
            <button
              type="button"
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded(!isExpanded)}
              className="border-t border-dashed border-border bg-secondary text-foreground p-3 px-6 flex flex-wrap gap-2 items-center justify-between text-[10px] font-mono select-none cursor-pointer hover:bg-[#efe4cf] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-highlight transition-colors group"
            >
              <span className="text-muted-foreground font-bold flex items-center gap-2">
                <span>{openEnded ? `${daysElapsed} ${t("day")}` : `${daysElapsed}/${totalDays} ${t("day")} (${cycleProgress}%)`}</span>
                <span className="text-[#b39a73] group-hover:text-foreground transition-colors text-xs">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </span>
              {percentageChange < 0 ? (
                <span className="text-primary font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5 rotate-180 text-primary" />
                  <span>{Math.abs(percentageChange).toFixed(1)}% {t("vs_prev_period")}</span>
                </span>
              ) : percentageChange > 0 ? (
                <span className="text-[#b96145] font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#b96145]" />
                  <span>+{percentageChange.toFixed(1)}% {t("vs_prev_period")}</span>
                </span>
              ) : (
                <span className="text-muted-foreground font-bold">0.0% {t("vs_prev_period")}</span>
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
                  className="overflow-hidden bg-[#f8f3e9] text-foreground border-t border-border p-4 md:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 font-mono">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-highlight" />
                        {t("ui_cumulative_expense_trend")}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{t("ui_day_by_day_accumulation_over_cycle")}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLastCycle(!showLastCycle);
                      }}
                      className={`px-3 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        showLastCycle 
                          ? "bg-foreground border-foreground text-card shadow-sm"
                          : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-[#b39a73]"
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
                          <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.0" />
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
                              stroke="var(--border)"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={paddingX - 8}
                              y={y + 3}
                              textAnchor="end"
                              className="text-[8.5px] font-mono fill-muted-foreground font-bold"
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
                          stroke="var(--muted-foreground)"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          opacity="0.8"
                        />
                      )}

                      {/* Current Cycle Area & Line */}
                      {currentPaths.areaPath && (
                        <motion.path key={`area-${start}-${end}`} d={currentPaths.areaPath} fill="url(#v2CumulativeGrad)"
                          initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ duration: reducedMotion ? 0 : 0.9, delay: reducedMotion ? 0 : 0.3 }} />
                      )}
                      {currentPaths.linePath && (
                        <motion.path
                          key={`line-${start}-${end}`}
                          initial={reducedMotion ? false : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: reducedMotion ? 0 : 1.2, ease: "easeInOut" }}
                          d={currentPaths.linePath}
                          fill="none"
                          stroke="var(--foreground)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Data Points */}
                      {points.map((pt: any, i: number) => {
                        const isHovered = hoveredPoint === i;
                        return (
                          <g key={`${start}-${end}-${i}`}>
                            <motion.circle
                              initial={reducedMotion ? false : { opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: reducedMotion ? 0 : 0.15, delay: reducedMotion ? 0 : (i / Math.max(1, points.length - 1)) * 1.2 }}
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered ? 5 : 2.5}
                              fill="var(--foreground)"
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
                        const pt = points.find((p: any) => p.day === dayNum) ?? prevPoints.find((p: any) => p.day === dayNum);
                        if (!pt) return null;
                        return (
                          <text
                            key={dayNum}
                            x={pt.x}
                            y={svgHeight - 4}
                            textAnchor="middle"
                            className="text-[9px] font-mono fill-muted-foreground font-bold"
                          >
                            D{dayNum}
                          </text>
                        );
                      })}
                    </svg>

                    {/* Hover Tooltip */}
                    {hoveredPoint !== null && points[hoveredPoint] && (
                      <div
                        className="absolute bg-foreground text-card text-[10px] font-mono p-2.5 rounded-md border border-slate-800 shadow-xl pointer-events-none z-20"
                        style={{
                          left: `${(points[hoveredPoint].x / svgWidth) * 100}%`,
                          top: `${(points[hoveredPoint].y / svgHeight) * 100 - 25}%`,
                          transform: "translateX(-50%) translateY(-50%)"
                        }}
                      >
                        <p className="font-bold text-muted-foreground">{t("day")} {points[hoveredPoint].day} ({points[hoveredPoint].dateStr})</p>
                        <p className="text-xs font-black text-highlight mt-0.5">
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
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border text-[10px] font-mono text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-foreground inline-block" />
                        <span className="font-bold">{t("ui_current_cycle")}</span>
                      </div>
                      {showLastCycle && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-0.5 bg-muted-foreground inline-block border-b border-dashed" />
                          <span className="font-bold">{t("ui_last_cycle")}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <span>{t("ui_today_cumulative")} </span>
                      <span className="font-black text-foreground">THB {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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

