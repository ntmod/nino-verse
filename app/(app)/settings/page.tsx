"use client";

import LoadingScreen from "@/components/LoadingScreen";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Tags, CreditCard, Target, CalendarClock, ChevronRight, Calculator, Globe } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { playUISound } from "@/lib/ui-sounds.mjs";
import styles from "./index.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [hello, setHello] = useState(false);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const th = language === "th";

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


  useEffect(() => () => {
    if (navigationTimer.current !== null) clearTimeout(navigationTimer.current);
  }, []);
  useEffect(() => {
    if (!hello) return;
    const timer = setTimeout(() => setHello(false), 3500);
    return () => clearTimeout(timer);
  }, [hello]);

  const handleNavigate = (path: string) => {
    if (navigationTimer.current !== null) return;
    setSelectedPath(path);
    playUISound("paper");
    navigationTimer.current = setTimeout(() => router.push(path), reducedMotion ? 0 : 200);
  };

  return <main className="relative min-h-screen bg-[#f5f0e5] px-5 pb-20 pt-24 sm:px-8">
    {!reducedMotion && <LoadingScreen mode="in" />}
    <div className="mx-auto w-full max-w-2xl">
      <header className={styles.header}>
        <div className="relative z-10 pr-20">
          <p className="mb-3 font-mono text-[9px] font-bold tracking-[0.2em] text-[#93846b]">NORINOTE / {th ? 'ท้ายสมุด' : 'BACK OF THE NOTEBOOK'}</p>
          <h1 className="font-mono text-3xl font-black text-[#292722]">{t("settings_title")}</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#7f715d]">{th ? 'จัดสมุดให้เข้ามือ แล้วจดต่อในแบบของเรา' : 'Make this notebook yours, then keep your story going.'}</p>
        </div>
        <motion.button type="button" aria-label={th ? 'ทักทาย Nori' : 'Say hello to Nori'} aria-pressed={hello}
          onClick={() => { setHello(previous => !previous); playUISound("click"); }}
          className={styles.nori} whileTap={reducedMotion ? undefined : { scale: 0.96 }}>
          <motion.div animate={{ y: hello ? -10 : 9, rotate: hello && !reducedMotion ? [0, -7, 7, 0] : 0 }} transition={{ duration: reducedMotion ? 0 : 0.35 }}>
            <Image src="/animations/nori/cat-idle.webp" alt="" width={80} height={80} unoptimized />
          </motion.div>
        </motion.button>
        <AnimatePresence>
          {hello && <motion.p role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.15 }} className={styles.greeting}>
            {th ? 'สมุดพร้อมแล้ว ไปจดกัน 🍙' : 'Notebook ready! Let’s jot 🍙'}
          </motion.p>}
        </AnimatePresence>
      </header>

      <section className={styles.notebook} aria-label={th ? 'สารบัญการตั้งค่า' : 'Settings contents'}>
        <div className={styles.language}>
          <div className="flex min-w-0 items-center gap-3">
            <Globe aria-hidden="true" className="h-5 w-5 shrink-0 text-[#648295]" />
            <div><h2 className="text-sm font-bold text-[#403b32]">{t("settings_language")}</h2><p className="mt-1 text-[11px] text-[#93846b]">{t("settings_language_desc")}</p></div>
          </div>
          <div className="flex shrink-0 gap-2" role="group" aria-label={t("settings_language")}>
            {(["en", "th"] as const).map(value => <motion.button key={value} type="button" aria-pressed={language === value}
              onClick={() => { setLanguage(value); if (language !== value) playUISound("click"); }}
              className={styles.sticker} data-selected={language === value}
              animate={{ rotate: language === value || reducedMotion ? 0 : value === "en" ? -5 : 5, y: language === value || reducedMotion ? 0 : -2 }}
              whileTap={reducedMotion ? undefined : { scale: 0.94 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
              {value.toUpperCase()}
            </motion.button>)}
          </div>
        </div>
        <div className="px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
          <p className="mb-3 font-mono text-[9px] font-bold tracking-widest text-[#93846b]">{th ? 'สารบัญ' : 'CONTENTS'} / 01—05</p>
          {SETTINGS_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const selected = selectedPath === option.path;
            return <motion.button type="button" key={option.path} disabled={selectedPath !== null}
              onClick={() => handleNavigate(option.path)} className={styles.entry}
              style={{ '--tab-color': option.color } as React.CSSProperties}
              animate={{ x: selected && !reducedMotion ? 8 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
              <span className={styles.tab} aria-hidden="true"><Icon className="h-5 w-5" /></span>
              <span aria-hidden="true" className="font-mono text-[10px] text-[#b6a68e]">{String(index + 1).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#403b32] sm:text-base">{option.name}</span><span className="mt-1 block text-[11px] leading-relaxed text-[#93846b]">{option.desc}</span></span>
              <motion.span aria-hidden="true" animate={{ x: selected && !reducedMotion ? 4 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}><ChevronRight className="h-4 w-4 text-[#93846b]" /></motion.span>
            </motion.button>;
          })}
        </div>
        <div className="border-t border-dashed border-[#d9cebb] px-6 py-3 text-center font-mono text-[9px] tracking-wider text-[#b6a68e]">{th ? 'สมุดเล่มนี้เป็นของเรา' : 'A NOTEBOOK OF YOUR OWN'} · NORINOTE</div>
      </section>
    </div>
  </main>;
}
