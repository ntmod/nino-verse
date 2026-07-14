"use client";

import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import LoadingScreen from "./LoadingScreen";
import { LayoutDashboard, NotebookPen, Settings, PieChart, LogOut, Sun, Moon } from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", path: "/nori", icon: LayoutDashboard },
  { name: "Notes", path: "/nori/note", icon: NotebookPen },
  { name: "Analytics", path: "/nori/analytics", icon: PieChart },
  { name: "Settings", path: "/nori/settings", icon: Settings },
];

export default function NoriNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [showExitWipe, setShowExitWipe] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setShowExitWipe(false);
    setPendingPath(null);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("nori_theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  if (pathname === "/nori/login") {
    return null;
  }

  const handleNavigate = (path: string) => {
    if (path === pathname) return;
    setPendingPath(path);
    setShowExitWipe(true);
    setTimeout(() => {
      router.push(path);
    }, 800);
  };

  const handleLogout = async () => {
    try {
      setShowExitWipe(true);
      const res = await fetch("/api/nori/logout", { method: "POST" });
      if (res.ok) {
        setTimeout(() => {
          router.push("/nori/login");
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
      <nav className="fixed top-0 left-0 right-0 z-[10000] border-b border-black/5 bg-white/70 backdrop-blur-2xl">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-center gap-1"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`relative px-4 py-1.5 flex items-center gap-2 rounded-full transition-all duration-300 group cursor-pointer ${
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-[#FF9D00] rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={`w-4 h-4 transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                <span className="text-sm font-bold uppercase tracking-widest hidden sm:block">
                  {item.name}
                </span>
              </button>
            );
          })}

          <button
            onClick={toggleTheme}
            className="relative p-2 ml-2 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 transition-all duration-300 group cursor-pointer w-8 h-8"
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

          <button
            onClick={handleLogout}
            className="relative px-4 py-1.5 flex items-center gap-2 rounded-full text-red-400 hover:text-red-600 transition-all duration-300 group cursor-pointer"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="text-sm font-bold uppercase tracking-widest hidden sm:block">
              Logout
            </span>
          </button>
        </motion.div>
      </nav>
    </>
  );
}
