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
  const { language, setLanguage, t } = useLanguage();
  const [showExitWipe, setShowExitWipe] = useState(false);

  const SETTINGS_OPTIONS = [
    { 
      name: t("settings_categories"), 
      desc: t("settings_categories_desc"), 
      path: "/settings/category", 
      icon: Tags,
      color: "#b97423"
    },
    { 
      name: t("settings_methods"), 
      desc: t("settings_methods_desc"), 
      path: "/settings/method", 
      icon: CreditCard,
      color: "#648295"
    },
    { 
      name: t("settings_budgets"), 
      desc: t("settings_budgets_desc"), 
      path: "/settings/budget", 
      icon: Target,
      color: "#508069"
    },
    { 
      name: t("settings_fixed_costs"), 
      desc: t("settings_fixed_costs_desc"), 
      path: "/settings/fixed-cost", 
      icon: CalendarClock,
      color: "#b0523b"
    },
    { 
      name: t("settings_daily_avg"), 
      desc: t("settings_daily_avg_desc"), 
      path: "/settings/daily-average", 
      icon: Calculator,
      color: "#8b7696"
    },
  ];

  useEffect(() => {
    setShowExitWipe(false);
  }, [pathname]);

  const handleNavigate = (path: string) => {
    setShowExitWipe(true);
    setTimeout(() => {
      router.push(path);
    }, 800);
  };

  return (
    <main className="relative min-h-screen bg-[#f5f0e5] flex flex-col items-center px-6 py-8 pt-24 pb-20">
      <LoadingScreen mode="in" />
      {showExitWipe && <LoadingScreen mode="out" />}

      <div className="max-w-2xl w-full space-y-8">
        <header className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-xl bg-[#fffdf5] flex items-center justify-center shadow-sm">
            <Settings className="w-6 h-6 text-[#292722]" />
          </div>
          <div className="text-left font-mono">
            <h1 className="text-3xl font-black text-[#292722] italic tracking-tighter uppercase leading-none mb-1.5">{t("settings_title")}</h1>
            <p className="text-xs font-bold text-[#7f715d] uppercase tracking-widest leading-none">{t("settings_subtitle")}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {/* Language Switch Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="w-full p-4 sm:p-6 bg-[#fffdf5] shadow-[3px_4px_0_#e7dece,0_8px_24px_rgba(78,62,36,0.06)] rounded-none flex flex-col gap-4 sm:flex-row sm:items-center items-start justify-between text-left"
          >
            <div className="flex items-center gap-3 sm:gap-6">
              <div 
                className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 rounded-none flex items-center justify-center"
                style={{ backgroundColor: "#64829515" }}
              >
                <Globe className="w-6 h-6 text-[#648295]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#292722] italic uppercase font-mono">{t("settings_language")}</h3>
                <p className="text-xs font-medium text-[#7f715d] font-mono mt-0.5">{t("settings_language_desc")}</p>
              </div>
            </div>
            <div className="flex items-center bg-[#eee5d6] p-1 rounded-xl border border-[#d9cebb]/60 font-mono text-xs font-bold">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  language === "en" ? "bg-[#fffdf5] text-[#292722] shadow-sm" : "text-[#7f715d] hover:text-[#292722]"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("th")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  language === "th" ? "bg-[#fffdf5] text-[#292722] shadow-sm" : "text-[#7f715d] hover:text-[#292722]"
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
                className="w-full p-4 sm:p-6 bg-[#fffdf5] shadow-[3px_4px_0_#e7dece,0_8px_24px_rgba(78,62,36,0.06)] rounded-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 sm:gap-6">
                  <div 
                    className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 rounded-none flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                    style={{ backgroundColor: `${option.color}10` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: option.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-[#292722] italic uppercase font-mono">{option.name}</h3>
                    <p className="text-xs font-medium text-[#7f715d] font-mono mt-0.5">{option.desc}</p>
                  </div>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl flex items-center justify-center bg-[#f5eedf]/70 group-hover:bg-[#292722] transition-all">
                  <ChevronRight className="w-5 h-5 text-[#7f715d] group-hover:text-white transition-colors" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
