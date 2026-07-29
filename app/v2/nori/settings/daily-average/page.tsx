"use client";

import LoadingScreen from "@/components/LoadingScreen";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Target } from "lucide-react";

export default function DailyAverageSettings() {
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
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div className="text-left font-mono">
              <h1 className="text-2xl font-black text-[#1A1A1A] italic tracking-tighter uppercase leading-none mb-1.5">Daily Average Config</h1>
              <p className="text-xs font-bold text-[#777777] uppercase tracking-widest leading-none">Select categories to calculate daily average</p>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white border border-slate-100 rounded-2xl animate-pulse shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end gap-3 font-mono">
              <button 
                onClick={handleSelectAll}
                className="text-[10px] font-black text-[#FF9D00] uppercase tracking-widest cursor-pointer hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button 
                onClick={handleClearAll}
                className="text-[10px] font-black text-[#777777] uppercase tracking-widest cursor-pointer hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {categories.map((category, index) => {
                const isSelected = selectedIds.includes(category._id);
                return (
                  <motion.div
                    key={category._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleToggleCategory(category._id)}
                    className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? "bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" 
                        : "bg-white/40 border-slate-100 opacity-60 hover:opacity-80 shadow-none"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl shrink-0">
                        {category.icon || "🏷️"}
                      </div>
                      <div className="text-left font-mono">
                        <h3 className="text-sm font-black text-[#1A1A1A] italic uppercase leading-none mb-1.5">{category.name}</h3>
                        <p className="text-[10px] font-bold text-[#777777] uppercase tracking-wider leading-none">
                          Type: {category.type || "expense"}
                        </p>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isSelected 
                        ? "bg-[#1A1A1A] text-white scale-100" 
                        : "border-2 border-slate-200 scale-95"
                    }`}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {showSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-widest rounded-xl text-center font-mono"
              >
                Configuration Saved Successfully!
              </motion.div>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 rounded-xl bg-[#1A1A1A] text-white text-xs font-black uppercase tracking-widest hover:bg-[#FF9D00] disabled:bg-slate-400 transition-all shadow-md shadow-black/10 cursor-pointer text-center font-mono"
            >
              {isSaving ? "Saving..." : "Save Configurations"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
