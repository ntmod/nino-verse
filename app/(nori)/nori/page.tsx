'use client'

import LoadingScreenIn from "@/components/LoadingScreenIn";
import LoadingScreenOut from "@/components/LoadingScreenOut";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import TotalSpentCard from "@/components/TotalSpentCard";
import Image from "next/image";
import FixedCostCard from "@/components/FixedCostCard";
import { Home, Zap, Wifi, ShieldCheck, Coffee, ShoppingBag, Utensils, Car, Smartphone, Music, CreditCard, Banknote, Wallet as WalletIcon, ChevronLeft, ChevronRight } from "lucide-react";
import ExpensePieChart from "@/components/ExpensePieChart";
import RecentTransactionsCard from "@/components/RecentTransactionsCard";
import PaymentMethodsCard from "@/components/PaymentMethodsCard";
import BudgetListCard from "@/components/BudgetListCard";
import MetricsCard from "@/components/MetricsCard";

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

  // --- Billing Cycle Calculation ---
  const billingCycle = useMemo(() => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    // Determine the base reference month index
    const baseRefMonthIndex = todayDate < 30 ? todayMonth : todayMonth + 1;
    
    // Shift reference month index by the cycleOffset
    const refMonthIndex = baseRefMonthIndex + cycleOffset;
    
    // Middle of month is safe from rollover issues when shifting months
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
          
          // Show "resetting completed" success modal
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

  // Fetch static configuration once on mount
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

  // Fetch transactions dynamically whenever billing cycle range changes
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const startISO = billingCycle.startDate.toISOString();
        const endISO = billingCycle.endDate.toISOString();
        
        const txData = await transactionService.getAll(startISO, endISO);
        setTransactions(txData);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, [billingCycle]);



  // Filter transactions for the current billing cycle
  const currentPeriodTransactions = useMemo(() => {
    const start = billingCycle.startDate.getTime();
    const end = billingCycle.endDate.getTime();
    return transactions.filter(tx => {
      const txTime = new Date(tx.date).getTime();
      return txTime >= start && txTime <= end;
    });
  }, [transactions, billingCycle]);

  // --- Derived Data ---
  const totalSpent = useMemo(() => {
    return Math.abs(currentPeriodTransactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0));
  }, [currentPeriodTransactions]);

  const recentTransactions = useMemo(() => {
    return currentPeriodTransactions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(tx => {
        const cat = categories.find(c => c.name === tx.category);
        const sub = cat?.subcategories?.find((s: any) => s._id === tx.subCategory);
        return {
          ...tx,
          icon: cat?.icon || "🏷️",
          subCategory: sub ? sub.name : tx.subCategory
        };
      });
  }, [currentPeriodTransactions, categories]);

  const categoryBreakdown = useMemo(() => {
    const groups: Record<string, number> = {};
    currentPeriodTransactions.forEach(tx => {
      if (tx.amount < 0) {
        groups[tx.category] = (groups[tx.category] || 0) + Math.abs(tx.amount);
      }
    });

    const CHART_COLORS = [
      '#FF9D00', // Brand Orange
      '#3B82F6', // Blue
      '#10B981', // Emerald
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#06B6D4', // Cyan
      '#F43F5E', // Rose
      '#EAB308', // Yellow
      '#14B8A6', // Teal
      '#6366F1', // Indigo
      '#84CC16', // Lime
      '#D946EF', // Fuchsia
      '#0EA5E9', // Light Blue
      '#F97316', // Vivid Orange
      '#A855F7', // Violet
      '#22C55E', // Green
      '#EF4444', // Red
      '#64748B', // Slate
      '#0F766E', // Deep Teal
      '#BE123C', // Deep Rose
    ];

    return Object.entries(groups)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount], index) => ({
        name,
        amount,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }));
  }, [currentPeriodTransactions]);

  const elapsedDays = useMemo(() => {
    const today = new Date();
    const endLimit = new Date(Math.min(billingCycle.endDate.getTime(), today.getTime()));
    const diffTime = Math.max(0, endLimit.getTime() - billingCycle.startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }, [billingCycle]);

  const dailyAverage = useMemo(() => {
    return totalSpent / elapsedDays;
  }, [totalSpent, elapsedDays]);

  const savingsMet = useMemo(() => {
    const totalIncome = currentPeriodTransactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    if (totalIncome === 0) return 0;
    const savings = totalIncome - totalSpent;
    return Math.max(0, Math.round((savings / totalIncome) * 100));
  }, [currentPeriodTransactions, totalSpent]);

  const paymentMethodBreakdown = useMemo(() => {
    return paymentMethods.map(pm => {
      const spent = currentPeriodTransactions
        .filter(tx => tx.paymentMethod === pm.name && tx.amount < 0)
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

  const handleGetStarted = () => {
    setShowExitWipe(true);
    // Redirect after wipe covers screen (0.8s matches LoadingScreenOut duration)
    setTimeout(() => {
      router.push("/nori/note");
    }, 800);
  };

  return (
    <main className="relative min-h-screen bg-[#F8F9FA] flex flex-col items-center p-4 md:p-8 pt-20 pb-20">
      <LoadingScreenIn />
      {showExitWipe && <LoadingScreenOut />}

      <div id="nori-page" className="max-w-7xl w-full relative z-10 grid grid-cols-1 lg:grid-cols-6 gap-4 lg:gap-8 items-start">
        <header className="lg:col-span-6 rounded-3xl bg-white border border-black/5 p-4 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image src="/animations/nori/cat-idle.gif" alt="Nori" width={56} height={56} className="relative z-10" />
              <div className="absolute inset-0 bg-slate-100 rounded-full scale-110 -z-10" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black text-slate-900 italic tracking-tighter mb-0.5 leading-none">Nori's Dashboard</h1>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCycleOffset(prev => prev - 1)}
                  className="w-5 h-5 rounded-lg border border-black/5 flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer"
                  title="Previous month cycle"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <span className="text-[10px] font-bold text-[#FF9D00] uppercase tracking-widest">{billingCycleStr}</span>
                <button 
                  onClick={() => setCycleOffset(prev => prev + 1)}
                  className="w-5 h-5 rounded-lg border border-black/5 flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer"
                  title="Next month cycle"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
              <p className="text-xs font-black text-emerald-500 uppercase italic">On Track</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>
        </header>

        {/* Column 1-3: Main Financial View */}
        <div className="lg:col-span-3 space-y-4 lg:space-y-8">
          <TotalSpentCard
            amount={totalSpent}
            currency="THB"
            isLoading={isLoading}
          />
          
          <MetricsCard dailyAverage={dailyAverage} savingsMet={savingsMet} isLoading={isLoading} />

          <RecentTransactionsCard transactions={recentTransactions} isLoading={isLoading} />
          <BudgetListCard budgets={budgets} isLoading={isLoading} />
        </div>

        <div className="lg:col-span-3 space-y-4 lg:space-y-8">
          <ExpensePieChart data={categoryBreakdown} isLoading={isLoading} />
          <PaymentMethodsCard methods={paymentMethodBreakdown} isLoading={isLoading} />
          <FixedCostCard items={fixedCostsWithStatus} isLoading={isLoading} onReset={handleResetFixedCosts} />
        </div>
      </div>
    </main>
  );
}