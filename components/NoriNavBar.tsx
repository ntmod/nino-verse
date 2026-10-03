"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Globe, LayoutDashboard, LogOut, NotebookPen, Settings } from "lucide-react";
import LoadingScreen from "./LoadingScreen";
import { useLanguage } from "@/lib/language-context";

import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import SoundToggle from "./SoundToggle";

const NAV_CONFIG = [
  { key: "nav_home", path: "/dashboard", icon: LayoutDashboard },
  { key: "nav_notes", path: "/note", icon: NotebookPen },
  { key: "nav_settings", path: "/settings", icon: Settings },
];

export default function NoriNavBar() {
  useEffect(() => { document.documentElement.classList.remove("dark"); }, []);
  const { data: account } = authClient.useSession();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const profile = account?.user;
  const router = useRouter();
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useLanguage();
  const [showExitWipe, setShowExitWipe] = useState(false);
  const reducedMotion = useReducedMotion();

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
      const result = await authClient.signOut();
      if (result.error) throw new Error("Logout failed");
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
      <div className="fixed top-0 left-0 right-0 z-[10000] p-2 sm:p-4 flex justify-center pointer-events-none select-none">
        <motion.nav
          initial={reducedMotion ? false : { y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 26 }}
          className="pointer-events-auto bg-[#fffdf5] border border-[#d9cebb] px-1 sm:px-2 h-14 flex items-center gap-0 sm:gap-1"
          style={{ borderRadius: "5px 5px 12px 12px", boxShadow: "2px 4px 0 #e7dece, 0 8px 24px rgba(78,62,36,0.06)" }}
          aria-label={t("nav_home")}
        >
          {NAV_CONFIG.map((item) => {
            const active = pathname === item.path || (item.path === "/settings" && pathname.startsWith("/settings/"));
            const Icon = item.icon;

            return (
              <motion.button
                key={item.path}
                aria-label={t(item.key)}
                aria-current={active ? "page" : undefined}
                onClick={() => navigate(item.path)}
                animate={{ y: active ? 4 : 0, backgroundColor: active ? "#e9a342" : "#f5f0e5" }}
                transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 25 }}
                style={{ borderRadius: "3px 3px 9px 3px", border: "1px solid #d9cebb", background: "#f5f0e5", boxShadow: active ? "1px 3px 0 #bd8a45" : "1px 2px 0 #e7dece" }}
                className={`relative isolate min-h-11 min-w-11 px-2 py-1.5 flex items-center gap-2 group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97423] ${active ? "text-[#372b1c]" : "text-[#93846b] hover:text-[#635744]"}`}
              >
                <Icon aria-hidden="true" className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:block">{t(item.key)}</span>
              </motion.button>
            );
          })}

          <div className="w-px h-5 bg-[#e1d7c5]/60 mx-0.5 sm:mx-1" />
          <button onClick={toggleLanguage} className="relative min-h-11 px-1.5 sm:px-2 py-1 flex items-center gap-1.5 rounded-full text-[#7f715d] hover:text-[#292722] border border-[#d9cebb]/70 hover:border-[#b6a68e] bg-[#f5eedf]/70 hover:bg-[#fffdf5] transition-all duration-200 group cursor-pointer text-[10px] font-mono font-black tracking-wider" title={language === "en" ? "Switch to Thai (TH)" : "Switch to English (EN)"}>
            <Globe className="hidden sm:block w-3 h-3 text-[#93846b] group-hover:text-[#b97423] transition-colors" />
            <span className="leading-none">{language.toUpperCase()}</span>
          </button>

          <div className="w-px h-5 bg-[#e1d7c5]/60 mx-0.5 sm:mx-1" />
          <SoundToggle />
          {profile && <span title={`${profile.name} · ${profile.email}`} aria-label={`${language === 'th' ? 'บัญชีของ' : 'Account of'} ${profile.name}`} className="relative ml-1 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#fffdf5] text-xs font-bold text-[#635744]" style={{ borderRadius: "50%", border: "3px solid #fffdf5", boxShadow: "0 0 0 1px #d9cebb, 1px 2px 0 #e7dece", transform: "rotate(-6deg)" }}>
            {profile.image && failedImage !== profile.image ? <Image src={profile.image} alt={profile.name} width={28} height={28} unoptimized referrerPolicy="no-referrer" onError={() => setFailedImage(profile.image ?? null)} className="h-full w-full rounded-full object-cover" style={{ borderRadius: "50%" }} /> : <span aria-hidden="true">{Array.from(profile.name || profile.email)[0]?.toUpperCase()}</span>}
          </span>}
          <button aria-label={t("nav_logout")} onClick={logout} className="relative min-h-11 min-w-11 px-2 py-1.5 flex items-center gap-1.5 rounded-full text-red-400 hover:text-red-600 transition-all duration-300 group cursor-pointer">
            <LogOut className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:block">{t("nav_logout")}</span>
          </button>
        </motion.nav>
      </div>
    </>
  );
}
