"use client";

import LoadingScreenIn from "@/components/LoadingScreenIn";
import LoadingScreenOut from "@/components/LoadingScreenOut";
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
      router.push("/nori/settings");
    }, 800);
  };

  return (
    <main className="relative min-h-screen bg-[#F8F9FA] flex flex-col items-center p-8 pt-24 pb-20">
      <LoadingScreenIn />
      {showExitWipe && <LoadingScreenOut />}

      <div className="max-w-2xl w-full space-y-8">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Monthly Budgets</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configure your spending limits</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10 cursor-pointer"
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
                transition={{ delay: 0.1 + index * 0.1 }}
                className="p-6 rounded-3xl bg-white border border-black/5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-6">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center border border-black/5"
                    style={{ backgroundColor: `${budget.color}10` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: budget.color }} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 italic uppercase">{budget.category}</h3>
                    <p className="text-sm font-black text-[#FF9D00] italic">LIMIT: {budget.limit.toLocaleString()} THB</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center hover:bg-white hover:shadow-md transition-all group/btn">
                    <Pencil className="w-4 h-4 text-slate-400 group-hover/btn:text-[#FF9D00]" />
                  </button>
                  <button className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center hover:bg-rose-50 hover:border-rose-100 transition-all group/btn">
                    <Trash2 className="w-4 h-4 text-slate-400 group-hover/btn:text-rose-500" />
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
              className="absolute inset-0 bg-black/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">Set Category Budget</h2>
                  <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Food & Dining"
                      value={newBudget.category}
                      onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#FF9D00]/20 focus:bg-white transition-all text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Limit (THB)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={newBudget.limit}
                      onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#FF9D00]/20 focus:bg-white transition-all text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Icon</label>
                      <select
                        value={newBudget.icon}
                        onChange={(e) => setNewBudget({ ...newBudget, icon: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#FF9D00]/20 focus:bg-white transition-all text-sm font-bold text-slate-900"
                      >
                        {Object.keys(ICON_MAP).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Color</label>
                      <input
                        type="color"
                        value={newBudget.color}
                        onChange={(e) => setNewBudget({ ...newBudget, color: e.target.value })}
                        className="w-full h-[54px] p-2 rounded-2xl bg-slate-50 border border-black/5 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="py-4 rounded-2xl border border-black/5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBudget}
                    className="py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10 cursor-pointer"
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
