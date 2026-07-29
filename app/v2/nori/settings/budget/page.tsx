"use client";

import LoadingScreen from "@/components/LoadingScreen";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Target, Plus, Pencil, Trash2, ArrowLeft, Utensils, ShoppingBag, Car, Music, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";

const ICON_MAP: Record<string, any> = {
  Utensils,
  ShoppingBag,
  Car,
  Music
};

export default function BudgetSettings() {
  const router = useRouter();
  const [showExitWipe, setShowExitWipe] = useState(false);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: "", limit: "", icon: "Utensils", color: "#FF9D00" });

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const res = await fetch("/api/nori/budget");
      const data = await res.json();
      if (Array.isArray(data)) {
        setBudgets(data);
      }
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
    }
  };

  const handleSaveBudget = async () => {
    if (!newBudget.category || !newBudget.limit) return;
    try {
      const res = await fetch("/api/nori/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBudget),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewBudget({ category: "", limit: "", icon: "Utensils", color: "#FF9D00" });
        fetchBudgets();
      }
    } catch (err) {
      console.error("Failed to save budget:", err);
    }
  };

  const handleBack = () => {
    setShowExitWipe(true);
    setTimeout(() => {
      router.push("/v2/nori/settings");
    }, 800);
  };

  return (
    <main className="relative min-h-screen bg-[#f5f5f7] flex flex-col items-center p-8 pt-24 pb-20">
      <LoadingScreen mode="in" />
      {showExitWipe && <LoadingScreen mode="out" />}

      <div className="max-w-2xl w-full space-y-8">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div className="text-left font-mono">
              <h1 className="text-2xl font-black text-[#1A1A1A] italic tracking-tighter uppercase leading-none mb-1.5">Monthly Budgets</h1>
              <p className="text-xs font-bold text-[#777777] uppercase tracking-widest leading-none">Configure your spending limits</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1A1A1A] text-white text-xs font-black uppercase tracking-widest hover:bg-[#FF9D00] transition-colors shadow-md shadow-black/10 cursor-pointer font-mono"
          >
            <Plus className="w-4 h-4" />
            Set Budget
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {budgets.map((budget, index) => {
            const Icon = ICON_MAP[budget.icon] || Target;
            return (
              <motion.div
                key={budget._id || budget.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + index * 0.05 }}
                className="p-6 rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex items-center justify-between group"
              >
                <div className="flex items-center gap-6">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${budget.color}10` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: budget.color }} />
                  </div>
                  <div className="text-left font-mono">
                    <h3 className="text-base font-black text-[#1A1A1A] italic uppercase leading-none mb-2">{budget.category}</h3>
                    <p className="text-sm font-black text-[#FF9D00] italic leading-none">LIMIT: {budget.limit.toLocaleString()} THB</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="w-10 h-10 rounded-xl bg-white flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer">
                    <Pencil className="w-4 h-4 text-slate-400 hover:text-[#FF9D00]" />
                  </button>
                  <button className="w-10 h-10 rounded-xl bg-white flex items-center justify-center hover:bg-rose-50 transition-all cursor-pointer">
                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* NEW BUDGET MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-[#1A1A1A] italic uppercase tracking-tighter font-mono">Set Category Budget</h2>
                  <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full border border-slate-100 hover:border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer">
                    <X className="w-4 h-4 text-slate-600" />
                  </button>
                </div>

                <div className="space-y-6 text-left">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-mono">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Food & Dining"
                      value={newBudget.category}
                      onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50/70 rounded-xl text-sm font-bold text-[#1A1A1A] placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100/50 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-mono">Monthly Limit (THB)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={newBudget.limit}
                      onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50/70 rounded-xl text-sm font-bold text-[#1A1A1A] placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100/50 transition-all font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-mono">Icon</label>
                      <select
                        value={newBudget.icon}
                        onChange={(e) => setNewBudget({ ...newBudget, icon: e.target.value })}
                        className="w-full px-5 py-4 bg-slate-50/70 border border-slate-100 rounded-xl text-sm font-bold text-[#1A1A1A] focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100/50 transition-all font-mono"
                      >
                        {Object.keys(ICON_MAP).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-mono">Color</label>
                      <input
                        type="color"
                        value={newBudget.color}
                        onChange={(e) => setNewBudget({ ...newBudget, color: e.target.value })}
                        className="w-10 h-10 px-5 py-4 bg-slate-50/70 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="py-4 rounded-xl bg-slate-50/70 text-xs font-black text-[#777777] uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBudget}
                    className="py-4 rounded-xl bg-[#1A1A1A] text-white text-xs font-black uppercase tracking-widest hover:bg-[#FF9D00] shadow-md shadow-black/10 transition-all cursor-pointer font-mono"
                  >
                    Save Budget
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
