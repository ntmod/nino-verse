"use client";

import LoadingScreen from "@/components/LoadingScreen";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Settings, 
  Tags, 
  CreditCard, 
  Target, 
  CalendarClock, 
  ChevronRight,
  Calculator,
  Globe
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, toggleLanguage, setLanguage, t } = useLanguage();
  const [showExitWipe, setShowExitWipe] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const SETTINGS_OPTIONS = [
    { 
      name: t("settings_categories"), 
      desc: t("settings_categories_desc"), 
      path: "/nori/settings/category", 
      icon: Tags,
      color: "#FF9D00"
    },
    { 
      name: t("settings_methods"), 
      desc: t("settings_methods_desc"), 
      path: "/nori/settings/method", 
      icon: CreditCard,
      color: "#6366f1"
    },
    { 
      name: t("settings_budgets"), 
      desc: t("settings_budgets_desc"), 
      path: "/nori/settings/budget", 
      icon: Target,
      color: "#10b981"
    },
    { 
      name: t("settings_fixed_costs"), 
      desc: t("settings_fixed_costs_desc"), 
      path: "/nori/settings/fixed-cost", 
      icon: CalendarClock,
      color: "#f43f5e"
    },
    { 
      name: t("settings_daily_avg"), 
      desc: t("settings_daily_avg_desc"), 
      path: "/v2/nori/settings/daily-average", 
      icon: Calculator,
      color: "#a855f7"
    },
  ];

  useEffect(() => {
    setShowExitWipe(false);
    setPendingPath(null);
  }, [pathname]);

  const isV2 = pathname.startsWith("/v2");

  const handleNavigate = (path: string) => {
    const targetPath = isV2 ? `/v2${path}` : path;
    setPendingPath(targetPath);
    setShowExitWipe(true);
    setTimeout(() => {
      router.push(targetPath);
    }, 800);
  };

  return (
    <main className="relative min-h-screen bg-[#f5f5f7] flex flex-col items-center p-8 pt-24 pb-20">
      <LoadingScreen mode="in" />
      {showExitWipe && <LoadingScreen mode="out" />}

      <div className="max-w-2xl w-full space-y-8">
        <header className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <Settings className="w-6 h-6 text-[#1A1A1A]" />
          </div>
          <div className="text-left font-mono">
            <h1 className="text-3xl font-black text-[#1A1A1A] italic tracking-tighter uppercase leading-none mb-1.5">{t("settings_title")}</h1>
            <p className="text-xs font-bold text-[#777777] uppercase tracking-widest leading-none">{t("settings_subtitle")}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {/* Language Switch Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="w-full p-6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-2xl flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-6">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "#3b82f615" }}
              >
                <Globe className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1A1A1A] italic uppercase font-mono">{t("settings_language")}</h3>
                <p className="text-xs font-medium text-[#777777] font-mono mt-0.5">{t("settings_language_desc")}</p>
              </div>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 font-mono text-xs font-bold">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  language === "en" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("th")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  language === "th" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                TH
              </button>
            </div>
          </motion.div>

          {SETTINGS_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            return (
              <motion.button
                key={option.path}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={() => handleNavigate(option.path)}
                className="w-full p-6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-2xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-6">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                    style={{ backgroundColor: `${option.color}10` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: option.color }} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1A1A1A] italic uppercase font-mono">{option.name}</h3>
                    <p className="text-xs font-medium text-[#777777] font-mono mt-0.5">{option.desc}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50/70 group-hover:bg-[#1A1A1A] transition-all">
                  <ChevronRight className="w-5 h-5 text-[#777777] group-hover:text-white transition-colors" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
