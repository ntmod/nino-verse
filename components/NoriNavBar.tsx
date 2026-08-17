"use client";

import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import LoadingScreen from "./LoadingScreen";
import { LayoutDashboard, NotebookPen, Settings, PieChart, LogOut, Sun, Moon, Globe } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const NAV_CONFIG = [
  { key: "nav_home", path: "/nori", icon: LayoutDashboard },
  { key: "nav_notes", path: "/nori/note", icon: NotebookPen },
  { key: "nav_analytics", path: "/nori/analytics", icon: PieChart },
  { key: "nav_settings", path: "/nori/settings", icon: Settings },
];

export default function NoriNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useLanguage();
  const [showExitWipe, setShowExitWipe] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  const isV2 = pathname.startsWith("/v2");

  useEffect(() => {
    setShowExitWipe(false);
    setPendingPath(null);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    if (isV2) {
      setTheme("light");
      document.documentElement.classList.remove("dark");
      return;
    }
    const savedTheme = localStorage.getItem("nori_theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isV2]);

  if (pathname === "/nori/login" || pathname === "/v2/nori/login") {
    return null;
  }

  const handleNavigate = (path: string) => {
    const targetPath = isV2 ? `/v2${path}` : path;
    if (targetPath === pathname) return;
    setPendingPath(targetPath);
    setShowExitWipe(true);
    setTimeout(() => {
      router.push(targetPath);
    }, 800);
  };

  const handleLogout = async () => {
    try {
      setShowExitWipe(true);
      const res = await fetch("/api/nori/logout", { method: "POST" });
      if (res.ok) {
        setTimeout(() => {
          const loginPath = isV2 ? "/v2/nori/login" : "/nori/login";
          router.push(loginPath);
          router.refresh();
        }, 800);
      } else {
        setShowExitWipe(false);
      }
    } catch (err) {
      console.error("Logout failed:", err);
      setShowExitWipe(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("nori_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
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
        >
          {NAV_CONFIG.map((item) => {
            const targetPath = isV2 ? `/v2${item.path}` : item.path;
            const isActive = pathname === targetPath;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`relative px-3.5 py-1.5 flex items-center gap-2 rounded-full transition-all duration-300 group cursor-pointer ${
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-[#FF9D00] rounded-full -z-10 shadow-sm"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 transition-transform ${isActive ? "scale-105" : "group-hover:scale-105"}`} />
                <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:block">
                  {t(item.key)}
                </span>
              </button>
            );
          })}

          <div className="w-px h-5 bg-slate-200/60 mx-1" />

          {/* Language Swapper */}
          <button
            onClick={toggleLanguage}
            className="relative px-2.5 py-1 flex items-center gap-1.5 rounded-full text-slate-500 hover:text-[#1A1A1A] border border-slate-200/70 hover:border-slate-300 bg-slate-50/70 hover:bg-white transition-all duration-200 group cursor-pointer text-[10px] font-mono font-black tracking-wider"
            title={language === "en" ? "Switch to Thai (TH)" : "Switch to English (EN)"}
          >
            <Globe className="w-3 h-3 text-slate-400 group-hover:text-[#FF9D00] transition-colors" />
            <span className="leading-none">{language.toUpperCase()}</span>
          </button>

          {!isV2 && (
            <button
              onClick={toggleTheme}
              className="relative p-2 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 transition-all duration-300 group cursor-pointer w-8 h-8"
              title="Toggle theme"
            >
              {!mounted ? (
                <span className="w-4 h-4 block" />
              ) : theme === "light" ? (
                <Moon className="w-4 h-4 transition-transform group-hover:rotate-12" />
              ) : (
                <Sun className="w-4 h-4 transition-transform group-hover:rotate-45" />
              )}
            </button>
          )}

          <div className="w-px h-5 bg-slate-200/60 mx-1" />

          <button
            onClick={handleLogout}
            className="relative px-3.5 py-1.5 flex items-center gap-1.5 rounded-full text-red-400 hover:text-red-600 transition-all duration-300 group cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:block">
              {t("nav_logout")}
            </span>
          </button>
        </motion.nav>
      </div>
    </>
  );
}
