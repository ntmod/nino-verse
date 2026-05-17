'use client'

import LoadingScreenIn from "@/components/LoadingScreenIn";
import LoadingScreenOut from "@/components/LoadingScreenOut";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import TotalSpentCard from "@/components/TotalSpentCard";
import Image from "next/image";
import FixedCostCard from "@/components/FixedCostCard";
import { Home, Zap, Wifi, ShieldCheck, Coffee, ShoppingBag, Utensils, Car, Smartphone, Music, CreditCard, Banknote, Wallet as WalletIcon } from "lucide-react";
import ExpensePieChart from "@/components/ExpensePieChart";
import RecentTransactionsCard from "@/components/RecentTransactionsCard";
import PaymentMethodsCard from "@/components/PaymentMethodsCard";
import BudgetListCard from "@/components/BudgetListCard";
import MetricsCard from "@/components/MetricsCard";

import { transactionService } from "@/lib/services/transactionService";
import { categoryService } from "@/lib/services/categoryService";
import { paymentService } from "@/lib/services/paymentService";
import { budgetService, fixedCostService } from "@/lib/services/dashboardService";

export default function Noripage() {
  const router = useRouter();
  const [showExitWipe, setShowExitWipe] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [fixedCosts, setFixedCosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [txData, catData, payData, budData, fixedData] = await Promise.all([
          transactionService.getAll(),
          categoryService.getAll(),
          paymentService.getAll(),
          budgetService.getAll(),
          fixedCostService.getAll()
        ]);

        setTransactions(txData);
        setCategories(catData);
        setPaymentMethods(payData);
        setBudgets(budData);
        setFixedCosts(fixedData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };
    fetchDashboardData();
  }, []);

  // --- Derived Data ---
  const totalSpent = useMemo(() => {
    return Math.abs(transactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0));
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return transactions
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
  }, [transactions, categories]);

  const categoryBreakdown = useMemo(() => {
    const groups: Record<string, number> = {};
    transactions.forEach(tx => {
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
  }, [transactions]);

  const dailyAverage = useMemo(() => {
    if (transactions.length === 0) return 0;
    
    const dates = transactions.map(tx => new Date(tx.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    
    const diffTime = Math.abs(maxDate - minDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    return totalSpent / diffDays;
  }, [totalSpent, transactions]);

  const savingsMet = useMemo(() => {
    const totalIncome = transactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    if (totalIncome === 0) return 0;
    const savings = totalIncome - totalSpent;
    return Math.max(0, Math.round((savings / totalIncome) * 100));
  }, [transactions, totalSpent]);

  const paymentMethodBreakdown = useMemo(() => {
    return paymentMethods.map(pm => {
      const spent = transactions
        .filter(tx => tx.paymentMethod === pm.name && tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      return {
        ...pm,
        amount: spent
      };
    });
  }, [transactions, paymentMethods]);

  const fixedCostsWithStatus = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    return fixedCosts.map(fc => {
      const isPaid = transactions.some(tx => 
        tx.name.toLowerCase() === fc.name.toLowerCase() && 
        new Date(tx.date).getTime() >= startOfMonth
      );
      
      return { ...fc, isPaid };
    });
  }, [fixedCosts, transactions]);

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
            <div>
              <h1 className="text-lg font-black text-slate-900 italic tracking-tighter">Nori's Dashboard</h1>
              {/* <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">April 2026 Overview</p> */}
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
          />
          
          <MetricsCard dailyAverage={dailyAverage} savingsMet={savingsMet} />

          <RecentTransactionsCard transactions={recentTransactions} />
          <BudgetListCard budgets={budgets} />
        </div>

        <div className="lg:col-span-3 space-y-4 lg:space-y-8">
          <ExpensePieChart data={categoryBreakdown} />
          <PaymentMethodsCard methods={paymentMethodBreakdown} />
          <FixedCostCard items={fixedCostsWithStatus} />
        </div>
      </div>
    </main>
  );
}