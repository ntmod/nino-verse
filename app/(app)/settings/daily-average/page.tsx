"use client";

import { useLanguage } from "@/lib/language-context";

import LoadingScreen from "@/components/LoadingScreen";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Target } from "lucide-react";

export default function DailyAverageSettings() {
  const { t } = useLanguage();
  const router = useRouter();
  const [showExitWipe, setShowExitWipe] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, configRes] = await Promise.all([
          fetch("/api/nori/category"),
          fetch("/api/nori/daily-average/config")
        ]);

        const catData = await catRes.json();
        const configData = await configRes.json();

        if (Array.isArray(catData)) {
          setCategories(catData);
        }

        // If selectedCategories is empty, default to selecting all category IDs
        if (configData && Array.isArray(configData.selectedCategories) && configData.selectedCategories.length > 0) {
          setSelectedIds(configData.selectedCategories);
        } else if (Array.isArray(catData)) {
          setSelectedIds(catData.map(c => c._id));
        }
      } catch (err) {
        console.error("Failed to load settings data", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleToggleCategory = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(categories.map(c => c._id));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/nori/daily-average/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedCategories: selectedIds }),
      });
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to save daily average configuration", err);
    } finally {
      setIsSaving(false);
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
              className="w-11 h-11 shrink-0 rounded-md bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="min-w-0 text-left font-mono">
              <h1 className="notebook-title">{t("ui_daily_average_config")}</h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-snug">{t("settings_daily_avg_desc")}</p>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-card border border-border rounded-md animate-pulse shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end gap-3 font-mono">
              <button
                onClick={handleSelectAll}
                className="text-[10px] font-black text-highlight-ink uppercase tracking-widest cursor-pointer hover:underline"
              >
                {t("ui_select_all")}
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                onClick={handleClearAll}
                className="text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer hover:underline"
              >
                {t("ui_clear_all")}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {categories.map((category, index) => {
                const isSelected = selectedIds.includes(category._id);
                return (
                  <motion.button
                    type="button"
                    aria-pressed={isSelected}
                    key={category._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleToggleCategory(category._id)}
                    className={`p-5 rounded-md border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-card border-border shadow-[3px_4px_0_var(--paper-edge),0_8px_24px_rgba(78,62,36,0.06)]"
                        : "bg-card/40 border-border opacity-60 hover:opacity-80 shadow-none"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 rounded-md bg-card border border-border flex items-center justify-center text-xl shrink-0">
                        {category.icon || "🏷️"}
                      </div>
                      <div className="min-w-0 text-left font-mono">
                        <h3 className="text-sm font-black text-foreground italic uppercase leading-snug mb-1.5">{category.name}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
                          {t("ui_type")} {t(category.type === "income" ? "ui_income" : "ui_expense")}
                        </p>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-highlight text-highlight-foreground scale-100"
                        : "border-2 border-border scale-95"
                    }`}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-widest rounded-md text-center font-mono"
              >
                {t("ui_configuration_saved_successfully")}
              </motion.div>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 rounded-md bg-highlight text-highlight-foreground text-xs font-black uppercase tracking-widest hover:bg-highlight disabled:bg-muted-foreground transition-all shadow-md shadow-black/10 cursor-pointer text-center font-mono"
            >
              {isSaving ? t("ui_saving") : t("ui_save_configurations")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
