"use client";

import { useLanguage } from "@/lib/language-context";

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
  const { t } = useLanguage();
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
      router.push("/settings");
    }, 800);
  };

  return (
    <main className="notebook-page notebook-page--app relative min-h-screen flex flex-col items-center px-4 sm:px-6 pt-8 pb-20">
      <LoadingScreen mode="in" />
      {showExitWipe && <LoadingScreen mode="out" />}

      <div className="max-w-2xl w-full space-y-8">
        <header className="flex flex-wrap gap-4 items-center justify-between mb-12">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button aria-label={t("back")}
              onClick={handleBack}
              className="w-11 h-11 shrink-0 rounded-md bg-card flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="min-w-0 text-left font-mono">
              <h1 className="notebook-title">{t("ui_monthly_budgets")}</h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-snug">{t("ui_configure_your_spending_limits")}</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-md bg-highlight text-highlight-foreground text-xs font-black uppercase tracking-widest hover:bg-highlight transition-colors shadow-md shadow-black/10 cursor-pointer font-mono"
          >
            <Plus className="w-4 h-4" />
            {t("ui_set_budget")}
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
                className="p-4 sm:p-6 rounded-md bg-card shadow-[3px_4px_0_var(--paper-edge),0_8px_24px_rgba(78,62,36,0.06)] flex flex-wrap gap-3 items-center justify-between group"
              >
                <div className="flex min-w-0 items-center gap-3 sm:gap-6">
                  <div
                    className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: `${budget.color}10` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: budget.color }} />
                  </div>
                  <div className="min-w-0 text-left font-mono">
                    <h3 className="break-words text-base font-black text-foreground italic uppercase leading-snug mb-2">{budget.category}</h3>
                    <p className="text-sm font-black text-highlight-ink italic leading-none">{t("ui_limit")} {budget.limit.toLocaleString()} THB</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button aria-label={t("edit")} className="w-11 h-11 shrink-0 rounded-md bg-card flex items-center justify-center hover:bg-secondary transition-all cursor-pointer">
                    <Pencil className="w-4 h-4 text-muted-foreground hover:text-highlight-ink" />
                  </button>
                  <button aria-label={t("delete")} className="w-11 h-11 shrink-0 rounded-md bg-card flex items-center justify-center hover:bg-rose-50 transition-all cursor-pointer">
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-rose-500" />
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
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-foreground/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="max-h-[85dvh] relative w-full max-w-lg bg-card rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-y-auto"
            >
              <div className="p-4 sm:p-8">
                <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-foreground italic uppercase tracking-tighter font-mono">{t("ui_set_category_budget")}</h2>
                  <button aria-label={t("close")} onClick={() => setIsModalOpen(false)} className="w-11 h-11 shrink-0 rounded-md border border-border hover:border-border hover:bg-secondary flex items-center justify-center transition-colors cursor-pointer">
                    <X className="w-4 h-4 text-ink-soft" />
                  </button>
                </div>

                <div className="space-y-6 text-left">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 font-mono">{t("category")}</label>
                    <input
                      type="text"
                      placeholder={t("ui_e_g_food_dining")}
                      value={newBudget.category}
                      onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                      className="w-full px-5 py-4 bg-secondary/70 rounded-md text-sm font-bold text-foreground placeholder:text-muted-foreground focus:bg-card focus:ring-4 focus:ring-border/50 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 font-mono">{t("ui_monthly_limit_thb")}</label>
                    <input
                      type="number"
                      placeholder="5000"
                      value={newBudget.limit}
                      onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                      className="w-full px-5 py-4 bg-secondary/70 rounded-md text-sm font-bold text-foreground placeholder:text-muted-foreground focus:bg-card focus:ring-4 focus:ring-border/50 transition-all font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 font-mono">{t("ui_icon")}</label>
                      <select
                        value={newBudget.icon}
                        onChange={(e) => setNewBudget({ ...newBudget, icon: e.target.value })}
                        className="w-full px-5 py-4 bg-secondary/70 border border-border rounded-md text-sm font-bold text-foreground focus:bg-card focus:border-border focus:ring-4 focus:ring-border/50 transition-all font-mono"
                      >
                        {Object.keys(ICON_MAP).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 font-mono">{t("ui_color")}</label>
                      <input
                        type="color"
                        value={newBudget.color}
                        onChange={(e) => setNewBudget({ ...newBudget, color: e.target.value })}
                        className="w-10 h-10 px-5 py-4 bg-secondary/70 rounded-md cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="py-4 rounded-md bg-secondary/70 text-xs font-black text-muted-foreground uppercase tracking-widest hover:bg-secondary transition-all cursor-pointer font-mono"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleSaveBudget}
                    className="py-4 rounded-md bg-highlight text-highlight-foreground text-xs font-black uppercase tracking-widest hover:bg-highlight shadow-md shadow-black/10 transition-all cursor-pointer font-mono"
                  >
                    {t("ui_save_budget")}
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
