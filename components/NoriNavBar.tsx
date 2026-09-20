"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Globe, LayoutDashboard, LogOut, NotebookPen, PieChart, Settings } from "lucide-react";
import LoadingScreen from "./LoadingScreen";
import { useLanguage } from "@/lib/language-context";

const NAV_CONFIG = [
  { key: "nav_home", path: "/dashboard", icon: LayoutDashboard },
  { key: "nav_notes", path: "/note", icon: NotebookPen },
  { key: "nav_analytics", path: "/analytics", icon: PieChart },
  { key: "nav_settings", path: "/settings", icon: Settings },
];

export default function NoriNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useLanguage();
  const [showExitWipe, setShowExitWipe] = useState(false);

  const navigate = (path: string) => {
    if (path === pathname) return;
    setShowExitWipe(true);
    window.setTimeout(() => {
      setShowExitWipe(false);
      router.push(path);
    }, 800);
  };

  const logout = async () => {
    setShowExitWipe(true);
    try {
      const response = await fetch("/api/nori/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      window.setTimeout(() => {
        setShowExitWipe(false);
        router.push("/login");
        router.refresh();
      }, 800);
    } catch {
      setShowExitWipe(false);
    }
  };

  return (
    <>
      {showExitWipe && <LoadingScreen mode="out" />}
      <div className="fixed top-0 left-0 right-0 z-[10000] p-4 flex justify-center pointer-events-none select-none">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          className="pointer-events-auto bg-white/85 backdrop-blur-md border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full px-2.5 h-12 flex items-center gap-1"
          aria-label="Primary navigation"
        >
          {NAV_CONFIG.map((item) => {
            const active = pathname === item.path || (item.path === "/settings" && pathname.startsWith("/settings/"));
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative px-3.5 py-1.5 flex items-center gap-2 rounded-full transition-all duration-300 group cursor-pointer ${active ? "text-white" : "text-slate-400 hover:text-slate-600"}`}
              >
                {active && (
                  <motion.div layoutId="activeNav" className="absolute inset-0 bg-[#FF9D00] rounded-full -z-10 shadow-sm" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />
                )}
                <Icon className={`w-3.5 h-3.5 transition-transform ${active ? "scale-105" : "group-hover:scale-105"}`} />
                <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:block">{t(item.key)}</span>
              </button>
            );
          })}

          <div className="w-px h-5 bg-slate-200/60 mx-1" />
          <button onClick={toggleLanguage} className="relative px-2.5 py-1 flex items-center gap-1.5 rounded-full text-slate-500 hover:text-[#1A1A1A] border border-slate-200/70 hover:border-slate-300 bg-slate-50/70 hover:bg-white transition-all duration-200 group cursor-pointer text-[10px] font-mono font-black tracking-wider" title={language === "en" ? "Switch to Thai (TH)" : "Switch to English (EN)"}>
            <Globe className="w-3 h-3 text-slate-400 group-hover:text-[#FF9D00] transition-colors" />
            <span className="leading-none">{language.toUpperCase()}</span>
          </button>

          <div className="w-px h-5 bg-slate-200/60 mx-1" />
          <button onClick={logout} className="relative px-3.5 py-1.5 flex items-center gap-1.5 rounded-full text-red-400 hover:text-red-600 transition-all duration-300 group cursor-pointer">
            <LogOut className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:block">{t("nav_logout")}</span>
          </button>
        </motion.nav>
      </div>
    </>
  );
}
