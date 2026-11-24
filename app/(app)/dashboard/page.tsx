'use client'

import { RippleButton } from "@/components/ui/ripple-button";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion, useAnimationControls } from "framer-motion";
import WalletOverview from "@/components/nori/WalletOverview";
import CycleReceipt from "@/components/nori/CycleReceipt";
import { ArrowRight, ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
import CycleEditor from "@/components/CycleEditor";
import { useSpendingCycles } from "@/lib/use-spending-cycles";
import { getSpendingCycle } from "@/lib/spending-cycle.js";

import { playUISound, prepareUISound } from "@/lib/ui-sounds.mjs";
import type { Transaction } from "@/lib/types";
import { isFixedCostPaid } from "@/lib/fixed-cost-status";
import { budgetProgress } from "@/lib/budget-progress.mjs";
import styles from "./dashboard.module.css";

const dashboardViews = [
  { id: "overview", th: "ภาพรวม", en: "Overview" },
  { id: "spending", th: "รายจ่าย", en: "Spending" },
  { id: "records", th: "บันทึก", en: "Records" },
  { id: "garden", th: "สวน Nori", en: "Nori’s garden" },
] as const;

export default function Noripage() {
  const { data: account } = authClient.useSession();
  const resetKey = account?.user.id ? `fixedCostsResetDate:${account.user.id}` : null;
  const { openGlobalModal, openExpenseModal } = useModal();
  const { language, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [budgetsLoaded, setBudgetsLoaded] = useState(false);
  const [fixedCostsLoaded, setFixedCostsLoaded] = useState(false);
  const [averageLoading, setAverageLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [loadRetry, setLoadRetry] = useState(0);
  const staticDataLoaded = categoriesLoaded && paymentsLoaded && budgetsLoaded && fixedCostsLoaded;
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const gardenRecords = useRef<Transaction[]>([]);
  useEffect(() => { gardenRecords.current = transactions; }, [transactions]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [fixedCosts, setFixedCosts] = useState<any[]>([]);
  const [lastResetTime, setLastResetTime] = useState<number | null>(null);
  const [view, setView] = useState<(typeof dashboardViews)[number]["id"]>("overview");
  const [showCycleReceipt, setShowCycleReceipt] = useState(false);
  const [cycleOffset, setCycleOffset] = useState(0);
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
  const loadedAverageCycle = useRef<string | null>(null);
  const transactionRevision = useRef(0);

  const { state: cycles, setState: setCycles, error: cyclesError, retry: retryCycles } = useSpendingCycles();
  const [cycleEditor, setCycleEditor] = useState<'start' | 'edit' | null>(null);
  const cycleIndex = cycles ? Math.min(cycles.currentIndex, Math.max(1, cycles.currentIndex + cycleOffset)) : 0;
  const manual = cycles?.config.mode === 'manual';
  const savedTimeline = Boolean(manual || cycles?.config.automaticFrom);
  const billingCycle = useMemo(() => {
    const range = savedTimeline && cycles ? cycles.cycles[cycleIndex] : null;
    return range ? { startDate: new Date(range.startDate), endDate: new Date(range.endDate) } : getSpendingCycle(cycleOffset);
  }, [cycles, savedTimeline, cycleIndex, cycleOffset]);
  const previousBillingCycle = useMemo(() => {
    const range = savedTimeline && cycles ? cycles.cycles[cycleIndex - 1] : null;
    return range ? { startDate: new Date(range.startDate), endDate: new Date(range.endDate) } : getSpendingCycle(cycleOffset - 1);
  }, [cycles, savedTimeline, cycleIndex, cycleOffset]);
  const openCycle = Boolean(manual && cycles.cycles[cycleIndex]?.isOpen);

  const billingCycleStr = useMemo(() => {
    const locale = language === "th" ? "th-TH" : "en-US";
    const start = billingCycle.startDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    const end = billingCycle.endDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    return `${start} - ${openCycle ? (language === "th" ? "ปัจจุบัน" : "Present") : end}`;
  }, [billingCycle, language, openCycle]);

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
    const userId = account?.user.id;
    if (!userId) return;
    let active = true;
    const load = async <T,>(label: string, request: Promise<T[]>, apply: (data: T[]) => void, done: (ready: boolean) => void) => {
      try {
        const data = await request;
        if (active) { apply(data); done(true); setLoadErrors(previous => previous.filter(item => item !== label)); }
      } catch {
        if (active) { done(true); setLoadErrors(previous => [...new Set([...previous, label])]); }
      }
    };
    void load("categories", categoryService.getAll(userId), setCategories, setCategoriesLoaded);
    void load("budgets", budgetService.getAll(), setBudgets, setBudgetsLoaded);
    void load("fixed costs", fixedCostService.getAll(), setFixedCosts, setFixedCostsLoaded);
    return () => { active = false; };
  }, [account?.user.id, loadRetry]);

  useEffect(() => {
    const userId = account?.user.id;
    if (!userId) return;
    let active = true;
    paymentService.getAll(userId).then(data => {
      if (active) { setPaymentMethods(data); setPaymentsLoaded(true); setLoadErrors(previous => previous.filter(item => item !== "payments")); }
    }).catch(() => {
      if (active) { setPaymentsLoaded(true); setLoadErrors(previous => [...new Set([...previous, "payments"])]); }
    });
    return () => { active = false; };
  }, [account?.user.id, loadRetry]);

  useEffect(() => {
    let active = true;
    if (!cycles) return;
    const cycleKey = `${billingCycle.startDate.toISOString()}:${billingCycle.endDate.toISOString()}`;
    if (loadedCycle.current !== cycleKey) {
      setIsLoading(true);
      setTransactionsLoaded(false);
    }
    const revision = transactionRevision.current;
    transactionService.getAll(previousBillingCycle.startDate.toISOString(), billingCycle.endDate.toISOString())
      .then(data => {
        if (!active) return;
        loadedCycle.current = cycleKey;
        if (revision === transactionRevision.current) setTransactions(data);
        setTransactionsLoaded(true);
        setLoadErrors(previous => previous.filter(item => item !== "transactions"));
      }).catch(() => {
        if (active) setLoadErrors(previous => [...new Set([...previous, "transactions"])]);
      }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [cycles, billingCycle, previousBillingCycle, refreshTrigger, loadRetry]);

  useEffect(() => {
    let active = true;
    if (!cycles) return;
    const cycleKey = `${billingCycle.startDate.toISOString()}:${billingCycle.endDate.toISOString()}`;
    if (loadedAverageCycle.current !== cycleKey) setAverageLoading(true);
    fetch(`/api/nori/daily-average?startDate=${encodeURIComponent(billingCycle.startDate.toISOString())}&endDate=${encodeURIComponent(billingCycle.endDate.toISOString())}`)
      .then(response => { if (!response.ok) throw new Error("Daily average unavailable"); return response.json(); })
      .then(data => {
        if (!active) return;
        loadedAverageCycle.current = cycleKey;
        setDailyAverage(data.dailyAverage || 0);
        setTodayUsage(data.todayUsage || 0);
        setDailyAverageBreakdown(data.breakdown || []);
        setLoadErrors(previous => previous.filter(item => item !== "daily average"));
      }).catch(() => {
        if (active) setLoadErrors(previous => [...new Set([...previous, "daily average"])]);
      }).finally(() => { if (active) setAverageLoading(false); });
    return () => { active = false; };
  }, [cycles, billingCycle, refreshTrigger, loadRetry]);

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
    return fixedCosts.map(fc => {
      const isPaid = isFixedCostPaid(fc.name, currentPeriodTransactions, billingCycle, lastResetTime);
      const cat = categories.find(c => c.name === fc.category);
      
      return { 
        ...fc, 
        isPaid,
        icon: cat?.icon || "🏷️"
      };
    });
  }, [fixedCosts, currentPeriodTransactions, categories, lastResetTime, billingCycle]);

  const handleExpenseAdded = (transaction: Transaction) => {
    transactionRevision.current += 1;
    setGardenFeedback(getGardenSaveFeedback(gardenRecords.current, transaction));
    gardenRecords.current = [...gardenRecords.current.filter(item => item._id !== transaction._id), transaction];
    setTransactions(previous => [...previous.filter(item => item._id !== transaction._id), transaction]);
    setSavedTransaction(transaction);
    setRefreshTrigger(prev => prev + 1);
  };

  const budgetsWithSpending = useMemo(() => budgetProgress(budgets, categories, currentPeriodTransactions), [budgets, categories, currentPeriodTransactions]);
  const th = language === "th";
  const expenseCount = currentPeriodTransactions.filter(transaction => transaction.amount < 0).length;

  const cards = {
    CycleGardenCard: <CycleGardenCard key={`garden-${cycleOffset}`} transactions={currentPeriodTransactions} cycle={billingCycle} feedback={gardenFeedback} isLoading={isLoading} ready={transactionsLoaded} onEdit={transaction => openExpenseModal(handleExpenseAdded, transaction)} />,
    TotalSpentCard: <TotalSpentCard openEnded={openCycle} defaultExpanded amount={totalSpent} currency="THB" percentageChange={percentageChange} dailyAverage={dailyAverage} startDate={billingCycle.startDate} endDate={billingCycle.endDate} cumulativeData={cumulativeSpending} prevCumulativeData={prevCumulativeSpending} isLoading={isLoading} />,
    SpendingHeatmapCard: <SpendingHeatmapCard key={cycleOffset} transactions={currentPeriodTransactions} cycle={billingCycle} savedTransaction={savedTransaction} isLoading={isLoading} ready={transactionsLoaded} onEdit={transaction => openExpenseModal(handleExpenseAdded, transaction)} />,
    ExpensePieChart: <ExpensePieChart data={categoryBreakdown} prevData={prevCategoryBreakdown} isLoading={isLoading || !categoriesLoaded} />,
    BudgetListCard: <BudgetListCard budgets={budgetsWithSpending} isLoading={isLoading || !categoriesLoaded || !budgetsLoaded} />,
    MetricsCard: <MetricsCard dailyAverage={dailyAverage} todayUsage={todayUsage} breakdown={dailyAverageBreakdown} startDate={billingCycle.startDate} endDate={billingCycle.endDate} isLoading={averageLoading} />,
    PaymentMethodsCard: <PaymentMethodsCard methods={paymentMethodBreakdown} isLoading={isLoading || !paymentsLoaded} />,
    RecentTransactionsCard: <RecentTransactionsCard transactions={recentTransactions} isLoading={isLoading} savedId={savedTransaction?._id} />,
    FixedCostCard: <FixedCostCard items={fixedCostsWithStatus} isLoading={isLoading || !fixedCostsLoaded} onReset={handleResetFixedCosts} onSuccess={handleExpenseAdded} />,
  };
  const cardErrors: Record<keyof typeof cards, string[]> = {
    CycleGardenCard: ["transactions"], TotalSpentCard: ["transactions"], SpendingHeatmapCard: ["transactions"],
    ExpensePieChart: ["transactions", "categories"], BudgetListCard: ["transactions", "categories", "budgets"],
    MetricsCard: ["daily average"], PaymentMethodsCard: ["transactions", "payments"],
    RecentTransactionsCard: ["transactions"], FixedCostCard: ["transactions", "fixed costs"],
  };
  const renderCard = (name: keyof typeof cards) => (
    <div data-dashboard-card={name} className={styles.card}>
      {cardErrors[name].some(error => loadErrors.includes(error)) ? <p role="status" className="border border-border bg-card p-6 text-sm">{th ? 'ส่วนนี้โหลดไม่สำเร็จ กดลองอีกครั้งด้านบนได้เลย' : 'This section could not load. Use Retry above.'}</p> : cards[name]}
    </div>
  );

  return (
    <main className={`notebook-page notebook-page--app ${styles.canvas}`}>
      <div className={styles.content}>
        {loadErrors.length > 0 && <p role="alert" className="mb-4 border border-border bg-card p-4 text-sm">{th ? 'ข้อมูลบางส่วนโหลดไม่สำเร็จ' : 'Some sections could not load'} ({loadErrors.join(', ')}) <button type="button" className="min-h-11 px-3 underline" onClick={() => setLoadRetry(value => value + 1)}>{th ? 'ลองอีกครั้ง' : 'Retry'}</button></p>}
        <header className={styles.cover}>
          <div className={styles.coverRow}>
            <h1 className="notebook-title">{th ? "สมุดรายจ่าย" : "Spending journal"}</h1>
            <div className={styles.actions}>
              <Link href="/home" className={styles.noteButton}><Plus aria-hidden="true" size={15}/>{th ? "จดรายการใหม่" : "Add expense"}</Link>
              <button type="button" disabled={isLoading || averageLoading || loadErrors.length > 0 || !staticDataLoaded || !transactionsLoaded} onClick={() => { prepareUISound(); setShowCycleReceipt(true); }} className={styles.summaryButton}>{t("cycle_receipt_open")}</button>
            </div>
          </div>
          <NoriHeader key={cycleOffset} total={totalSpent} count={expenseCount} previousTotal={prevTotalSpent}
            topCategory={categoryBreakdown[0]} bills={fixedCostsWithStatus.length}
            paidBills={fixedCostsWithStatus.filter(bill => bill.isPaid).length}
            loading={isLoading} ready={staticDataLoaded && transactionsLoaded}/>
        </header>

        {cyclesError && <p role="alert" className="mb-4 text-sm">{th ? 'โหลดรอบไม่สำเร็จ' : 'Could not load cycles.'} <button type="button" onClick={retryCycles} className="min-h-11 px-3 underline">{th ? 'ลองอีกครั้ง' : 'Retry'}</button></p>}
        <div className={styles.toolbar}>
          <div className={styles.cycleNav}>
            <button type="button" disabled={isCycleChanging || !cycles || (savedTimeline && cycleIndex <= 1)} aria-label={t("previous_cycle")} onClick={() => changeCycle(-1)} className={styles.iconButton}><ChevronLeft aria-hidden="true" size={17}/></button>
            <div className={styles.cycleLabel}><p className={styles.cycleCaption}>{th ? "รอบการใช้จ่าย" : "Spending cycle"}<span className={styles.mobileCount}> · {transactionsLoaded ? expenseCount : "—"} {th ? "รายการ" : "records"}</span></p><p aria-live="polite" className={styles.cycleDate}>{billingCycleStr}</p></div>
            <button type="button" disabled={isCycleChanging || !cycles || (savedTimeline && cycleIndex >= cycles.currentIndex)} aria-label={t("next_cycle")} onClick={() => changeCycle(1)} className={styles.iconButton}><ChevronRight aria-hidden="true" size={17}/></button>
            {cycleOffset !== 0 && <button type="button" disabled={isCycleChanging} onClick={() => { setGardenFeedback(null); setCycleOffset(0); }} className={styles.currentButton}>{th ? "รอบปัจจุบัน" : "Current cycle"}</button>}
          </div>
          {cycles && <div className="flex flex-wrap gap-2">{manual ? <>{cycleOffset === 0 && <button type="button" onClick={() => setCycleEditor('start')} className="min-h-11 border border-border bg-accent px-3 text-xs text-primary">{th ? 'เริ่มรอบใหม่' : 'Start new cycle'}</button>}<button type="button" onClick={() => setCycleEditor('edit')} className="min-h-11 px-3 text-xs text-muted-foreground underline">{th ? 'แก้ไขรอบนี้' : 'Edit cycle'}</button></> : <Link href="/settings/cycle" className="inline-flex min-h-11 items-center text-xs text-muted-foreground underline">{th ? 'ตั้งค่ารอบ' : 'Cycle settings'}</Link>}</div>}
          <Link href="/note" className={styles.recordLink}>{transactionsLoaded ? expenseCount : "—"} {th ? "รายการรายจ่ายในรอบนี้" : "expense records this cycle"}<ArrowRight aria-hidden="true" size={12}/></Link>
        </div>

        <div role="group" aria-label={th ? "มุมมองสมุดรายจ่าย" : "Journal views"} className={styles.views}>
          {dashboardViews.map(({ id, th: thai, en }) => (
            <RippleButton key={id} type="button" duration="360ms" rippleColor="rgb(255 253 245 / 24%)"
              aria-pressed={view === id} aria-controls={`journal-${id}`}
              onClick={() => setView(id)} className={styles.viewButton}>
              {th ? thai : en}
            </RippleButton>
          ))}
        </div>

        <div aria-busy={isCycleChanging} className={`relative isolate -m-2 p-2 ${isCycleChanging ? "overflow-hidden" : "overflow-visible"}`}>
          <motion.div animate={cycleAnimation}>
            <div id="journal-overview" hidden={view !== "overview"} className={styles.view}>
              <WalletOverview key={`${billingCycle.startDate.toISOString()}:${billingCycle.endDate.toISOString()}`} startDate={billingCycle.startDate.toISOString()} endDate={billingCycle.endDate.toISOString()} refresh={refreshTrigger + loadRetry} />
              <div className={styles.columns}>{renderCard("TotalSpentCard")}{renderCard("SpendingHeatmapCard")}</div>
            </div>

            <div id="journal-spending" hidden={view !== "spending"} className={styles.view}>
              <div className={styles.viewActions}>
                <Link href="/settings/budget" className={styles.sectionLink}>{th ? "จัดการงบ" : "Manage budgets"}<ArrowRight aria-hidden="true" size={14}/></Link>
              </div>
              <div className={styles.columns}>{renderCard("ExpensePieChart")}{renderCard("BudgetListCard")}</div>
              <div className={styles.columns}>{renderCard("MetricsCard")}{renderCard("PaymentMethodsCard")}</div>
            </div>

            <div id="journal-records" hidden={view !== "records"} className={styles.view}>
              <div className={styles.viewActions}>
                <Link href="/note" className={styles.sectionLink}>{th ? "ดูบันทึกทั้งหมด" : "View all notes"}<ArrowRight aria-hidden="true" size={14}/></Link>
              </div>
              <div className={styles.columns}>{renderCard("RecentTransactionsCard")}{renderCard("FixedCostCard")}</div>
            </div>

            <div id="journal-garden" hidden={view !== "garden"} className={`${styles.view} ${styles.garden}`}>
              {renderCard("CycleGardenCard")}
            </div>
          </motion.div>
        </div>
        {showCycleReceipt && <CycleReceipt cycle={billingCycle} previousTotal={prevTotalSpent} transactions={currentPeriodTransactions.map(tx => ({ ...tx, category: categories.find(category => category._id === tx.category || category.name === tx.category)?.name || tx.category }))} onClose={() => setShowCycleReceipt(false)}/>}
      </div>
      <FloatingActionButton onSuccess={handleExpenseAdded}/>
      {cycleEditor && cycles && <CycleEditor state={cycles} action={cycleEditor} boundary={billingCycle.startDate.toISOString()} onClose={() => setCycleEditor(null)} onSaved={state => {
        const selectedId = cycles.cycles[cycleIndex]?.cycleId;
        const selected = state.cycles.findIndex(cycle => cycle.cycleId === selectedId);
        setCycles(state); setCycleOffset(cycleEditor === 'start' || selected < 0 ? 0 : selected - state.currentIndex); setGardenFeedback(null);
      }}/>}
    </main>
  );
}
