'use client'

import { authClient } from "@/lib/auth-client";
import LoadingScreen from "@/components/LoadingScreen";
import styles from "./layout.module.css";
import MasonryLayout from "./MasonryLayout";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion, useAnimationControls } from "framer-motion";
import CycleReceipt from "@/components/nori/CycleReceipt";
import { ReceiptText } from "lucide-react";
import TotalSpentCard from "@/components/nori/TotalSpentCard";
import { getGardenSaveFeedback } from "@/lib/cycle-garden.mjs";
import CycleGardenCard from "@/components/nori/CycleGardenCard";
import SpendingHeatmapCard from "@/components/nori/SpendingHeatmapCard";
import NoriHeader from "@/components/nori/NoriHeader";
import FixedCostCard from "@/components/nori/FixedCostCard";
import ExpensePieChart from "@/components/nori/ExpensePieChart";
import RecentTransactionsCard from "@/components/nori/RecentTransactionsCard";
import PaymentMethodsCard from "@/components/nori/PaymentMethodsCard";
import BudgetListCard from "@/components/nori/BudgetListCard";
import MetricsCard from "@/components/nori/MetricsCard";
import FloatingActionButton from "@/components/nori/FloatingActionButton";


import { transactionService } from "@/lib/services/transactionService";
import { categoryService } from "@/lib/services/categoryService";
import { paymentService } from "@/lib/services/paymentService";
import { budgetService, fixedCostService } from "@/lib/services/dashboardService";
import { useModal } from "@/lib/modal-context";
import { useLanguage } from "@/lib/language-context";
import { getSpendingCycle } from "@/lib/spending-cycle.js";

import { playUISound, prepareUISound } from "@/lib/ui-sounds.mjs";
import type { Transaction } from "@/lib/types";

export default function Noripage() {
  const { data: account } = authClient.useSession();
  const resetKey = account?.user.id ? `fixedCostsResetDate:${account.user.id}` : null;
  const { openGlobalModal, openExpenseModal } = useModal();
  const { language, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [staticDataLoaded, setStaticDataLoaded] = useState(false);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const gardenRecords = useRef<Transaction[]>([]);
  useEffect(() => { gardenRecords.current = transactions; }, [transactions]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [fixedCosts, setFixedCosts] = useState<any[]>([]);
  const [lastResetTime, setLastResetTime] = useState<number | null>(null);
  const [showCycleReceipt, setShowCycleReceipt] = useState(false);
  const [cycleOffset, setCycleOffset] = useState(0);
  const [view, setView] = useState<"bento" | "masonry">("bento");
  const [isCycleChanging, setIsCycleChanging] = useState(false);
  const cycleChanging = useRef(false);
  const reducedMotion = useReducedMotion();
  const cycleAnimation = useAnimationControls();
  const changeCycle = async (direction: number) => {
    if (cycleChanging.current) return;
    cycleChanging.current = true;
    setIsCycleChanging(true);
    playUISound("paper");
    try {
      if (!reducedMotion) {
        await cycleAnimation.start({ x: `${-direction * 100}%`, transition: { duration: 0.22, ease: "easeIn" } });
      }
      setGardenFeedback(null);
      setCycleOffset(previous => previous + direction);
      if (!reducedMotion) {
        cycleAnimation.set({ x: `${direction * 100}%` });
        await cycleAnimation.start({ x: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } });
      }
    } finally {
      cycleChanging.current = false;
      setIsCycleChanging(false);
    }
  };
  const [dailyAverage, setDailyAverage] = useState<number>(0);
  const [todayUsage, setTodayUsage] = useState<number>(0);
  const [dailyAverageBreakdown, setDailyAverageBreakdown] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [savedTransaction, setSavedTransaction] = useState<Transaction | null>(null);
  const [gardenFeedback, setGardenFeedback] = useState<ReturnType<typeof getGardenSaveFeedback>>(null);
  const loadedCycle = useRef<string | null>(null);

  const billingCycle = useMemo(() => getSpendingCycle(cycleOffset), [cycleOffset]);
  const previousBillingCycle = useMemo(() => getSpendingCycle(cycleOffset - 1), [cycleOffset]);

  const billingCycleStr = useMemo(() => {
    const locale = language === "th" ? "th-TH" : "en-US";
    const start = billingCycle.startDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    const end = billingCycle.endDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    return `${start} - ${end}`;
  }, [billingCycle, language]);

  useEffect(() => {
    const resetDateStr = resetKey ? localStorage.getItem(resetKey) : null;
    if (resetDateStr) {
      setLastResetTime(new Date(resetDateStr).getTime());
    }
    else setLastResetTime(null);
  }, [resetKey]);

  const handleResetFixedCosts = () => {
    if (!resetKey) return;
    openGlobalModal({
      header: t("reset_fixed_costs_header"),
      message: t("reset_fixed_costs_msg"),
      type: "warning",
      mainButton: {
        label: t("confirm_reset"),
        onClick: () => {
          const nowStr = new Date().toISOString();
          localStorage.setItem(resetKey, nowStr);
          setLastResetTime(new Date(nowStr).getTime());
          
          setTimeout(() => {
            openGlobalModal({
              header: t("reset_completed_header"),
              message: t("reset_completed_msg"),
              type: "success",
              mainButton: {
                label: t("close"),
                onClick: () => {}
              }
            });
          }, 300);
        }
      },
      subButton: {
        label: t("cancel"),
        onClick: () => {}
      }
    });
  };

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [catData, budData, fixedData] = await Promise.all([
          categoryService.getAll(),
          budgetService.getAll(),
          fixedCostService.getAll()
        ]);

        setCategories(catData);
        setBudgets(budData);
        setFixedCosts(fixedData);
        setStaticDataLoaded(true);
      } catch (error) {
        console.error("Failed to fetch static dashboard data:", error);
      }
    };
    fetchStaticData();
  }, []);

  useEffect(() => {
    let active = true;
    const cycleKey = billingCycle.startDate.toISOString();
    const fetchTransactionsAndAverage = async () => {
      try {
        if (loadedCycle.current !== cycleKey) {
          setIsLoading(true);
          setTransactionsLoaded(false);
        }
        const prevStartISO = previousBillingCycle.startDate.toISOString();
        const endISO = billingCycle.endDate.toISOString();
        
        const [txData, avgRes, payData] = await Promise.all([
          transactionService.getAll(prevStartISO, endISO),
          fetch(`/api/nori/daily-average?startDate=${encodeURIComponent(billingCycle.startDate.toISOString())}&endDate=${encodeURIComponent(endISO)}`),
          paymentService.getAll()
        ]);
        
        if (!active) return;
        loadedCycle.current = cycleKey;
        setTransactions(txData);
        setPaymentMethods(payData);
        setTransactionsLoaded(true);
        if (avgRes.ok) {
          const avgData = await avgRes.json();
          if (!active) return;
          setDailyAverage(avgData.dailyAverage || 0);
          setTodayUsage(avgData.todayUsage || 0);
          setDailyAverageBreakdown(avgData.breakdown || []);
        }
      } catch (error) {
        console.error("Failed to fetch transactions or daily average:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchTransactionsAndAverage();
    return () => { active = false; };
  }, [billingCycle, previousBillingCycle, refreshTrigger]);

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
    const start = previousBillingCycle.startDate.getTime();
    const end = previousBillingCycle.endDate.getTime();
    const prevTx = transactions.filter(tx => {
      const txTime = new Date(tx.date).getTime();
      return txTime >= start && txTime <= end;
    });
    return Math.abs(prevTx
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0));
  }, [transactions, previousBillingCycle, language]);

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
          dateStr: currentDay.toLocaleDateString(language === "th" ? "th-TH" : "en-US", { day: 'numeric', month: 'short' })
        });
      }
    }
    
    return dailyAccumulation;
  }, [currentPeriodTransactions, billingCycle, language]);

  const prevCumulativeSpending = useMemo(() => {
    const start = new Date(previousBillingCycle.startDate);
    const end = new Date(previousBillingCycle.endDate);
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
        dateStr: currentDay.toLocaleDateString(language === "th" ? "th-TH" : "en-US", { day: 'numeric', month: 'short' })
      });
    }
    
    return dailyAccumulation;
  }, [transactions, previousBillingCycle, language]);

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
      '#b97423',
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
    const start = previousBillingCycle.startDate.getTime();
    const end = previousBillingCycle.endDate.getTime();
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
  }, [transactions, previousBillingCycle, categories, categoryColorMap]);

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

  const handleExpenseAdded = (transaction: Transaction) => {
    setGardenFeedback(getGardenSaveFeedback(gardenRecords.current, transaction));
    gardenRecords.current = [...gardenRecords.current.filter(item => item._id !== transaction._id), transaction];
    setTransactions(previous => [...previous.filter(item => item._id !== transaction._id), transaction]);
    setSavedTransaction(transaction);
    setRefreshTrigger(prev => prev + 1);
  };

  const cards = {
    TotalSpentCard: <TotalSpentCard amount={totalSpent} currency="THB" percentageChange={percentageChange} dailyAverage={dailyAverage} startDate={billingCycle.startDate} endDate={billingCycle.endDate} cumulativeData={cumulativeSpending} prevCumulativeData={prevCumulativeSpending} isLoading={isLoading} />,
    SpendingHeatmapCard: <SpendingHeatmapCard key={cycleOffset} transactions={currentPeriodTransactions} cycle={billingCycle} savedTransaction={savedTransaction} isLoading={isLoading} ready={transactionsLoaded} onEdit={transaction => openExpenseModal(handleExpenseAdded, transaction)} />,
    ExpensePieChart: <ExpensePieChart data={categoryBreakdown} prevData={prevCategoryBreakdown} isLoading={isLoading} />,
    BudgetListCard: <BudgetListCard budgets={budgets} isLoading={isLoading} />,
    MetricsCard: <MetricsCard dailyAverage={dailyAverage} todayUsage={todayUsage} breakdown={dailyAverageBreakdown} startDate={billingCycle.startDate} endDate={billingCycle.endDate} isLoading={isLoading} />,
    PaymentMethodsCard: <PaymentMethodsCard methods={paymentMethodBreakdown} isLoading={isLoading} />,
    RecentTransactionsCard: <RecentTransactionsCard transactions={recentTransactions} isLoading={isLoading} savedId={savedTransaction?._id} />,
    FixedCostCard: <FixedCostCard items={fixedCostsWithStatus} isLoading={isLoading} onReset={handleResetFixedCosts} />,
  };
  const renderCard = (name: keyof typeof cards) => (
    <motion.div key={name} data-home-card={name} className={view === "masonry" ? styles.item : undefined}
      initial={reducedMotion ? false : { opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.3, ease: "easeOut" }}>
      {cards[name]}
    </motion.div>
  );

  return (
    <div className="relative min-h-screen bg-[#f5f0e5] flex flex-col pb-20 select-none">
      <LoadingScreen mode="in" />

      <div className="max-w-7xl w-full mx-auto px-6 md:px-8 mt-8 flex flex-col gap-4 relative z-10">
        
        <div className="text-left font-mono">
          <Link href="/" className="text-[10px] uppercase font-bold tracking-wider hover:underline text-[#7f715d]">
            ← BACK TO TITLE SCREEN
          </Link>
        </div>

        {/* Nori Header Control Card */}
        <div className="flex flex-col bg-[#fffdf5] shadow-[3px_4px_0_#e7dece,0_8px_24px_rgba(78,62,36,0.06)] border border-[#e1d7c5]/85 overflow-hidden">
          {/* Top Alert Banner */}
          <div className="border-b border-dashed border-[#d9cebb] bg-[#f5eedf] text-[#7f715d] px-4 py-1.5 text-[9px] font-mono font-bold tracking-wider sm:tracking-[3px] uppercase text-left flex flex-wrap gap-2 justify-between">
            <span>{t("ui_norinote_personal_ledger")}</span>
            <span className="font-bold"><span className="text-[#416b54] animate-pulse mr-1 inline-block">●</span>{t("ui_online")}</span>
          </div>
          {/* Banner Core Row */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-5 p-4 sm:p-5">
            <NoriHeader
              key={cycleOffset}
              total={totalSpent}
              count={currentPeriodTransactions.filter(tx => tx.amount < 0).length}
              previousTotal={prevTotalSpent}
              topCategory={categoryBreakdown[0]}
              bills={fixedCostsWithStatus.length}
              paidBills={fixedCostsWithStatus.filter(bill => bill.isPaid).length}
              loading={isLoading}
              ready={staticDataLoaded && transactionsLoaded}
            />
            <div className="flex items-center justify-between w-full xl:w-auto gap-2 font-mono self-start xl:self-center">
              <button disabled={isCycleChanging} aria-label={t("previous_cycle")} onClick={() => changeCycle(-1)} className="w-11 h-11 shrink-0 rounded-lg border border-[#d9cebb] flex items-center justify-center font-bold hover:bg-[#f5eedf] bg-[#fffdf5] text-[#292722] transition-colors cursor-pointer shrink-0">&lt;</button>
              <motion.span 
                key={billingCycleStr}
                initial={reducedMotion ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="text-xs sm:text-sm font-bold text-[#292722] text-center flex-1 inline-block"
              >
                {billingCycleStr}
              </motion.span>
              <button disabled={isCycleChanging} aria-label={t("next_cycle")} onClick={() => changeCycle(1)} className="w-11 h-11 shrink-0 rounded-lg border border-[#d9cebb] flex items-center justify-center font-bold hover:bg-[#f5eedf] bg-[#fffdf5] text-[#292722] transition-colors cursor-pointer shrink-0">&gt;</button>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading || !staticDataLoaded || !transactionsLoaded}
          onClick={() => { prepareUISound(); setShowCycleReceipt(true); }}
          className="flex min-h-11 items-center justify-center gap-2 self-end border border-[#d9cebb] bg-[#fffdf5] px-4 py-3 font-mono text-xs font-bold text-[#7f715d] shadow-[2px_3px_0_#e7dece] transition-colors hover:bg-[#f5eedf] hover:text-[#b97423] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b97423]"
        >
          <ReceiptText aria-hidden="true" className="h-4 w-4" />{t("cycle_receipt_open")}
        </button>
        {showCycleReceipt && <CycleReceipt
          cycle={billingCycle}
          previousTotal={prevTotalSpent}
          transactions={currentPeriodTransactions.map(tx => ({
            ...tx,
            category: categories.find(category => category._id === tx.category || category.name === tx.category)?.name || tx.category,
          }))}
          onClose={() => setShowCycleReceipt(false)}
        />}

        <div role="group" aria-label={language === "th" ? "รูปแบบการวางการ์ด" : "Card layout"} className="flex self-end border border-[#d9cebb] bg-[#fffdf5] p-1 font-mono">
          {(["bento", "masonry"] as const).map(option => (
            <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)}
              className="min-h-11 px-4 text-xs font-bold focus-visible:outline-2 focus-visible:outline-[#b97423]"
              style={{ background: view === option ? "#e9a342" : "transparent", color: "#635744" }}>
              {option === "bento" ? "Bento" : "Masonry"}
            </button>
          ))}
        </div>

        <div aria-busy={isCycleChanging} className={`relative isolate -m-2 p-2 ${isCycleChanging ? "overflow-hidden" : "overflow-visible"}`}>
          <motion.div animate={cycleAnimation} className="space-y-6">
            <CycleGardenCard key={`garden-${cycleOffset}`} transactions={currentPeriodTransactions} cycle={billingCycle} feedback={gardenFeedback} isLoading={isLoading} ready={transactionsLoaded} onEdit={transaction => openExpenseModal(handleExpenseAdded, transaction)} />
            {view === "masonry" ? (
              <MasonryLayout>
                {(["TotalSpentCard", "SpendingHeatmapCard", "ExpensePieChart", "BudgetListCard", "MetricsCard", "PaymentMethodsCard", "RecentTransactionsCard", "FixedCostCard"] as const).map(renderCard)}
              </MasonryLayout>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
                <div className="space-y-6">
                  {(["TotalSpentCard", "MetricsCard", "BudgetListCard", "FixedCostCard"] as const).map(renderCard)}
                </div>
                <div className="space-y-6">
                  {(["SpendingHeatmapCard", "ExpensePieChart", "PaymentMethodsCard", "RecentTransactionsCard"] as const).map(renderCard)}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onSuccess={handleExpenseAdded} />
    </div>
  );
}
