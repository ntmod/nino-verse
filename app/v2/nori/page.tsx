'use client'

import LoadingScreen from "@/components/LoadingScreen";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import TotalSpentCard from "@/components/v2/TotalSpentCard";
import Image from "next/image";
import FixedCostCard from "@/components/v2/FixedCostCard";
import { ChevronLeft, ChevronRight, Cat } from "lucide-react";
import ExpensePieChart from "@/components/v2/ExpensePieChart";
import RecentTransactionsCard from "@/components/v2/RecentTransactionsCard";
import PaymentMethodsCard from "@/components/v2/PaymentMethodsCard";
import BudgetListCard from "@/components/v2/BudgetListCard";
import MetricsCard from "@/components/v2/MetricsCard";
import FloatingActionButton from "@/components/v2/FloatingActionButton";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { transactionService } from "@/lib/services/transactionService";
import { categoryService } from "@/lib/services/categoryService";
import { paymentService } from "@/lib/services/paymentService";
import { budgetService, fixedCostService } from "@/lib/services/dashboardService";
import { useModal } from "@/lib/modal-context";

export default function Noripage() {
  const router = useRouter();
  const { openGlobalModal } = useModal();
  const [showExitWipe, setShowExitWipe] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [fixedCosts, setFixedCosts] = useState<any[]>([]);
  const [lastResetTime, setLastResetTime] = useState<number | null>(null);
  const [cycleOffset, setCycleOffset] = useState(0);
  const [dailyAverage, setDailyAverage] = useState<number>(0);
  const [dailyAverageBreakdown, setDailyAverageBreakdown] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- Billing Cycle Calculation ---
  const billingCycle = useMemo(() => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    const baseRefMonthIndex = todayDate < 30 ? todayMonth : todayMonth + 1;
    const refMonthIndex = baseRefMonthIndex + cycleOffset;
    const refDate = new Date(todayYear, refMonthIndex, 15);
    const year = refDate.getFullYear();
    const month = refDate.getMonth();

    let startDate: Date;
    let endDate: Date;

    const getSafe30th = (y: number, m: number): Date => {
      const lastDay = new Date(y, m + 1, 0).getDate();
      const targetDay = Math.min(30, lastDay);
      return new Date(y, m, targetDay, 0, 0, 0, 0);
    };

    const getSafe29th = (y: number, m: number): Date => {
      const lastDay = new Date(y, m + 1, 0).getDate();
      const targetDay = Math.min(29, lastDay);
      return new Date(y, m, targetDay, 23, 59, 59, 999);
    };

    startDate = getSafe30th(year, month - 1);
    endDate = getSafe29th(year, month);

    return { startDate, endDate };
  }, [cycleOffset]);

  const billingCycleStr = useMemo(() => {
    const start = billingCycle.startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const end = billingCycle.endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return `${start} - ${end}`;
  }, [billingCycle]);

  useEffect(() => {
    const resetDateStr = localStorage.getItem("fixedCostsResetDate");
    if (resetDateStr) {
      setLastResetTime(new Date(resetDateStr).getTime());
    }
  }, []);

  const handleResetFixedCosts = () => {
    openGlobalModal({
      header: "Reset Fixed Costs",
      message: "Are you sure you want to reset the payment status of all fixed costs for this month?",
      type: "warning",
      mainButton: {
        label: "Confirm Reset",
        onClick: () => {
          const nowStr = new Date().toISOString();
          localStorage.setItem("fixedCostsResetDate", nowStr);
          setLastResetTime(new Date(nowStr).getTime());
          
          setTimeout(() => {
            openGlobalModal({
              header: "Reset Completed",
              message: "Payment status of all fixed costs has been successfully reset.",
              type: "success",
              mainButton: {
                label: "Close",
                onClick: () => {}
              }
            });
          }, 300);
        }
      },
      subButton: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [catData, payData, budData, fixedData] = await Promise.all([
          categoryService.getAll(),
          paymentService.getAll(),
          budgetService.getAll(),
          fixedCostService.getAll()
        ]);

        setCategories(catData);
        setPaymentMethods(payData);
        setBudgets(budData);
        setFixedCosts(fixedData);
      } catch (error) {
        console.error("Failed to fetch static dashboard data:", error);
      }
    };
    fetchStaticData();
  }, []);

  useEffect(() => {
    const fetchTransactionsAndAverage = async () => {
      try {
        setIsLoading(true);
        const cycleDuration = billingCycle.endDate.getTime() - billingCycle.startDate.getTime();
        const prevStartDate = new Date(billingCycle.startDate.getTime() - cycleDuration);
        const prevStartISO = prevStartDate.toISOString();
        const endISO = billingCycle.endDate.toISOString();
        
        const [txData, avgRes] = await Promise.all([
          transactionService.getAll(prevStartISO, endISO),
          fetch(`/api/nori/daily-average?startDate=${encodeURIComponent(billingCycle.startDate.toISOString())}&endDate=${encodeURIComponent(endISO)}`)
        ]);
        
        setTransactions(txData);
        if (avgRes.ok) {
          const avgData = await avgRes.json();
          setDailyAverage(avgData.dailyAverage || 0);
          setDailyAverageBreakdown(avgData.breakdown || []);
        }
      } catch (error) {
        console.error("Failed to fetch transactions or daily average:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactionsAndAverage();
  }, [billingCycle, refreshTrigger]);

  const currentPeriodTransactions = useMemo(() => {
    const start = billingCycle.startDate.getTime();
    const end = billingCycle.endDate.getTime();
    return transactions.filter(tx => {
      const txTime = new Date(tx.date).getTime();
      return txTime >= start && txTime <= end;
    });
  }, [transactions, billingCycle]);

  const totalSpent = useMemo(() => {
    return Math.abs(currentPeriodTransactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0));
  }, [currentPeriodTransactions]);

  const prevTotalSpent = useMemo(() => {
    const cycleDuration = billingCycle.endDate.getTime() - billingCycle.startDate.getTime();
    const start = billingCycle.startDate.getTime() - cycleDuration;
    const end = billingCycle.startDate.getTime() - 1;
    const prevTx = transactions.filter(tx => {
      const txTime = new Date(tx.date).getTime();
      return txTime >= start && txTime <= end;
    });
    return Math.abs(prevTx
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0));
  }, [transactions, billingCycle]);

  const percentageChange = useMemo(() => {
    if (prevTotalSpent === 0) return 0;
    const diff = totalSpent - prevTotalSpent;
    return parseFloat(((diff / prevTotalSpent) * 100).toFixed(1));
  }, [totalSpent, prevTotalSpent]);

  const cumulativeSpending = useMemo(() => {
    const start = new Date(billingCycle.startDate);
    const end = new Date(billingCycle.endDate);
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    const dailyAccumulation: { day: number; amount: number; dayAmount: number; dateStr: string }[] = [];
    let runningTotal = 0;
    
    for (let i = 0; i < totalDays; i++) {
      const currentDay = new Date(start);
      currentDay.setDate(start.getDate() + i);
      const currentDayStart = new Date(currentDay.setHours(0, 0, 0, 0)).getTime();
      const currentDayEnd = new Date(currentDay.setHours(23, 59, 59, 999)).getTime();
      
      const dayTxs = currentPeriodTransactions.filter(tx => {
        const txTime = new Date(tx.date).getTime();
        return txTime >= currentDayStart && txTime <= currentDayEnd && tx.amount < 0;
      });
      
      const daySum = Math.abs(dayTxs.reduce((sum, tx) => sum + tx.amount, 0));
      runningTotal += daySum;
      
      if (currentDayStart <= new Date().getTime()) {
        dailyAccumulation.push({
          day: i + 1,
          amount: runningTotal,
          dayAmount: daySum,
          dateStr: currentDay.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
        });
      }
    }
    
    return dailyAccumulation;
  }, [currentPeriodTransactions, billingCycle]);

  const prevCumulativeSpending = useMemo(() => {
    const cycleDuration = billingCycle.endDate.getTime() - billingCycle.startDate.getTime();
    const start = new Date(billingCycle.startDate.getTime() - cycleDuration);
    const end = new Date(billingCycle.startDate.getTime() - 1);
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    const dailyAccumulation: { day: number; amount: number; dayAmount: number; dateStr: string }[] = [];
    let runningTotal = 0;
    
    const prevTxList = transactions.filter(tx => {
      const txTime = new Date(tx.date).getTime();
      return txTime >= start.getTime() && txTime <= end.getTime();
    });
    
    for (let i = 0; i < totalDays; i++) {
      const currentDay = new Date(start);
      currentDay.setDate(start.getDate() + i);
      const currentDayStart = new Date(currentDay.setHours(0, 0, 0, 0)).getTime();
      const currentDayEnd = new Date(currentDay.setHours(23, 59, 59, 999)).getTime();
      
      const dayTxs = prevTxList.filter(tx => {
        const txTime = new Date(tx.date).getTime();
        return txTime >= currentDayStart && txTime <= currentDayEnd && tx.amount < 0;
      });
      
      const daySum = Math.abs(dayTxs.reduce((sum, tx) => sum + tx.amount, 0));
      runningTotal += daySum;
      
      dailyAccumulation.push({
        day: i + 1,
        amount: runningTotal,
        dayAmount: daySum,
        dateStr: currentDay.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
      });
    }
    
    return dailyAccumulation;
  }, [transactions, billingCycle]);

  const recentTransactions = useMemo(() => {
    return currentPeriodTransactions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(tx => {
        const cat = categories.find(c => c._id === tx.category || c.name === tx.category);
        const sub = cat?.subcategories?.find((s: any) => s._id === tx.subCategory);
        return {
          ...tx,
          icon: cat?.icon || "🏷️",
          category: cat ? cat.name : tx.category,
          subCategory: sub ? sub.name : tx.subCategory
        };
      });
  }, [currentPeriodTransactions, categories]);

  const categoryColorMap = useMemo(() => {
    const CHART_COLORS = [
      '#FF9D00',
      '#3B82F6',
      '#10B981',
      '#8B5CF6',
      '#EC4899',
      '#06B6D4',
      '#F43F5E',
      '#EAB308',
      '#14B8A6',
      '#6366F1',
    ];

    const map: Record<string, string> = {};
    categories.forEach((cat, index) => {
      map[cat.name] = CHART_COLORS[index % CHART_COLORS.length];
    });

    return map;
  }, [categories]);

  const categoryBreakdown = useMemo(() => {
    const groups: Record<string, number> = {};
    currentPeriodTransactions.forEach(tx => {
      if (tx.amount < 0) {
        const cat = categories.find(c => c._id === tx.category || c.name === tx.category);
        const catName = cat ? cat.name : tx.category;
        groups[catName] = (groups[catName] || 0) + Math.abs(tx.amount);
      }
    });

    return Object.entries(groups)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({
        name,
        amount,
        color: categoryColorMap[name] || '#94A3B8'
      }));
  }, [currentPeriodTransactions, categories, categoryColorMap]);

  const prevCategoryBreakdown = useMemo(() => {
    const cycleDuration = billingCycle.endDate.getTime() - billingCycle.startDate.getTime();
    const start = billingCycle.startDate.getTime() - cycleDuration;
    const end = billingCycle.startDate.getTime() - 1;
    const prevTx = transactions.filter(tx => {
      const txTime = new Date(tx.date).getTime();
      return txTime >= start && txTime <= end;
    });

    const groups: Record<string, number> = {};
    prevTx.forEach(tx => {
      if (tx.amount < 0) {
        const cat = categories.find(c => c._id === tx.category || c.name === tx.category);
        const catName = cat ? cat.name : tx.category;
        groups[catName] = (groups[catName] || 0) + Math.abs(tx.amount);
      }
    });

    return Object.entries(groups)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({
        name,
        amount,
        color: categoryColorMap[name] || '#94A3B8'
      }));
  }, [transactions, billingCycle, categories, categoryColorMap]);

  const paymentMethodBreakdown = useMemo(() => {
    return paymentMethods.map(pm => {
      const spent = currentPeriodTransactions
        .filter(tx => (tx.paymentMethod === pm._id || tx.paymentMethod === pm.name) && tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      return {
        ...pm,
        amount: spent
      };
    });
  }, [currentPeriodTransactions, paymentMethods]);

  const fixedCostsWithStatus = useMemo(() => {
    const filterSinceTime = lastResetTime ? Math.max(billingCycle.startDate.getTime(), lastResetTime) : billingCycle.startDate.getTime();
    
    return fixedCosts.map(fc => {
      const isPaid = currentPeriodTransactions.some(tx => 
        tx.name.toLowerCase() === fc.name.toLowerCase() && 
        new Date(tx.date).getTime() >= filterSinceTime
      );
      const cat = categories.find(c => c.name === fc.category);
      
      return { 
        ...fc, 
        isPaid,
        icon: cat?.icon || "🏷️"
      };
    });
  }, [fixedCosts, currentPeriodTransactions, categories, lastResetTime, billingCycle]);

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="relative min-h-screen bg-[#f5f5f7] flex flex-col pb-20 select-none">
      <LoadingScreen mode="in" />
      {showExitWipe && <LoadingScreen mode="out" />}

      <div className="max-w-7xl w-full mx-auto px-6 md:px-8 mt-8 flex flex-col gap-4 relative z-10">
        
        <div className="text-left font-mono">
          <Link href="/v2" className="text-[10px] uppercase font-bold tracking-wider hover:underline text-[#777777]">
            ← BACK TO PORTAL
          </Link>
        </div>

        {/* Nori Header Control Card */}
        <div className="flex flex-col rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/85 overflow-hidden">
          {/* Top Alert Banner */}
          <div className="bg-[#1A1A1A] text-[#ffffff] px-4 py-1.5 text-[9px] font-mono font-bold tracking-[3px] uppercase text-left flex justify-between">
            <span>ALERT // ACTIVE COMPANION DETECTED</span>
            <span className="font-bold"><span className="text-[#00FF00] animate-pulse mr-1 inline-block">●</span>ONLINE</span>
          </div>
          {/* Banner Core Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-3 text-left w-full sm:w-auto">
              <Image src="/animations/nori/cat-idle.gif" alt="Nori" width={36} height={36} className="block shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <h1 className="font-heading text-xl uppercase tracking-wide text-[#1A1A1A] leading-none">NORI'S NOTE</h1>
                </div>

                <div className="mt-2 font-mono text-[10px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF0000] font-mono inline-block">
                    NORI_MOOD: PURRING 🐱
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto gap-2 font-mono self-start sm:self-center">
              <button onClick={() => setCycleOffset(prev => prev - 1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center font-bold hover:bg-slate-50 bg-white text-[#1A1A1A] transition-colors cursor-pointer shrink-0">&lt;</button>
              <motion.span 
                key={billingCycleStr}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="text-sm font-bold text-[#1A1A1A] whitespace-nowrap text-center flex-1 inline-block"
              >
                {billingCycleStr}
              </motion.span>
              <button onClick={() => setCycleOffset(prev => prev + 1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center font-bold hover:bg-slate-50 bg-white text-[#1A1A1A] transition-colors cursor-pointer shrink-0">&gt;</button>
            </div>
          </div>
        </div>

        {/* Dashboard 2-Column Store Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <TotalSpentCard
                amount={totalSpent}
                currency="THB"
                percentageChange={percentageChange}
                dailyAverage={dailyAverage}
                startDate={billingCycle.startDate}
                endDate={billingCycle.endDate}
                cumulativeData={cumulativeSpending}
                prevCumulativeData={prevCumulativeSpending}
                isLoading={isLoading}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <MetricsCard 
                dailyAverage={dailyAverage} 
                breakdown={dailyAverageBreakdown} 
                startDate={billingCycle.startDate}
                endDate={billingCycle.endDate}
                isLoading={isLoading} 
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <BudgetListCard budgets={budgets} isLoading={isLoading} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <FixedCostCard items={fixedCostsWithStatus} isLoading={isLoading} onReset={handleResetFixedCosts} />
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ExpensePieChart data={categoryBreakdown} prevData={prevCategoryBreakdown} isLoading={isLoading} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <PaymentMethodsCard methods={paymentMethodBreakdown} isLoading={isLoading} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <RecentTransactionsCard transactions={recentTransactions} isLoading={isLoading} />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onSuccess={handleExpenseAdded} />
    </div>
  );
}