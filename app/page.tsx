"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Coffee, Flower2, PawPrint, Sparkles, Heart, BookOpen, Star, Moon, Ticket } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

import SoundToggle from "@/components/SoundToggle";
import { playUISound } from "@/lib/ui-sounds.mjs";

export default function Home() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [coverOpened, setCoverOpened] = useState(false);
  const reducedMotion = useReducedMotion();
  const { language } = useLanguage();
  const th = language === "th";
  const enteringRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);

  const enter = useCallback(() => {
    if (enteringRef.current) return;
    enteringRef.current = true;
    playUISound("save");
    setIsTransitioning(true);
    timerRef.current = window.setTimeout(() => router.push("/dashboard"), reducedMotion ? 0 : 700);
  }, [reducedMotion, router]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.repeat && !event.isComposing) {
        event.preventDefault();
        enter();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enter]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return (
    <main className="relative flex min-h-svh w-full flex-col items-center justify-between overflow-hidden bg-[#f5f0e5] px-6 py-8 font-mono text-[#292722] sm:px-10 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(#b7a78a 0.6px, transparent 0.6px)", backgroundSize: "6px 6px" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-20 w-3 border-r border-[#b9a98b]/50 sm:w-5" style={{ background: "linear-gradient(90deg, #c5b596, #eee4d1 45%, #d3c4a9 70%, transparent)" }} />
      {!reducedMotion && !coverOpened && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30" style={{ perspective: 1600 }}>
          <motion.div className="absolute inset-0 bg-[#292722]"
            initial={{ opacity: 0.2 }} animate={{ opacity: 0 }}
            transition={{ delay: 0.2, duration: 0.75 }} />
          <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-8 border-y-4 border-r-4 border-[#d2bc91] bg-[#e9dcc0] px-8 text-[#665035] shadow-[12px_0_40px_rgba(41,39,34,0.25)]"
            style={{ transformOrigin: "0% 50%", backfaceVisibility: "hidden", backgroundImage: "radial-gradient(#c5b08a 0.7px, transparent 0.7px)", backgroundSize: "5px 5px" }}
            initial={{ rotateY: 0 }} animate={{ rotateY: -155 }}
            transition={{ delay: 0.18, duration: 0.85, ease: [0.65, 0, 0.25, 1] }}
            onAnimationComplete={() => setCoverOpened(true)}
          >
            <div className="absolute inset-5 rounded-r-xl border border-[#b59d73]/70 sm:inset-8" />
            <p className="text-[10px] uppercase tracking-[0.3em]">{th ? "สมุดของโนริ" : "Nori’s little ledger"}</p>
            <p className="font-sans text-[clamp(3rem,10vw,6.5rem)] font-black italic tracking-tighter">NoriNote.</p>
            <div style={{ borderRadius: "50%" }} className="flex h-36 w-36 -rotate-12 items-center justify-center rounded-full border-[6px] border-[#416b54]/60 text-[#416b54]/70 sm:h-48 sm:w-48">
              <PawPrint className="h-20 w-20 sm:h-28 sm:w-28" strokeWidth={1.5} />
            </div>
            <p className="text-xs">{th ? "เก็บเรื่องราวของทุกบาท" : "Every little expense, remembered."}</p>
          </motion.div>
        </div>
      )}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-3 h-[calc(100%-24px)] w-[calc(100%-24px)] text-[#d9cebb] sm:inset-5 sm:h-[calc(100%-40px)] sm:w-[calc(100%-40px)]" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
        <motion.path d="M0.2 0.2H99.8V99.8H0.2Z" stroke="currentColor" strokeWidth="0.12"
          initial={reducedMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.7, ease: "easeInOut" }} />
      </svg>

      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={reducedMotion ? false : { y: "100%", rotate: -3 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#fffdf5] text-[#292722] shadow-[0_-20px_80px_rgba(41,39,34,0.15)]"
          >
            <div role="status" className="space-y-4 px-6 text-center">
              <Sparkles aria-hidden="true" className="mx-auto h-6 w-6 text-[#dc8b28]" />
              <h2 className="text-xl font-bold">{th ? "เปิดสมุดของคุณ…" : "Opening your ledger…"}</h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#93846b]">{th ? "เรื่องราวเล็ก ๆ ในทุกวัน" : "A little story, every day."}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative z-10 flex w-full max-w-5xl items-center justify-between border-b border-dashed border-[#cbbda5] pb-4 text-[9px] uppercase tracking-[0.15em] sm:text-[10px]">
        <span className="flex items-center gap-2"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-[50%] bg-[#c98330]" />{th ? "สมุดรายรับรายจ่าย" : "Personal ledger"}</span>
        <div className="flex items-center gap-2"><span className="text-[#93846b]">{th ? "จดได้ทุกวัน" : "Est. everyday"}</span><SoundToggle /></div>
      </header>

      <section className="relative flex w-full max-w-5xl flex-1 flex-col items-center justify-center py-20 sm:py-28">
        {[
          { Icon: Coffee, color: "#f2d4bd", ink: "#986449", rotate: 9, radius: "14px", size: "h-14 w-14 sm:h-24 sm:w-24", position: "right-1 top-10 sm:right-20 sm:top-16" },
          { Icon: Flower2, color: "#dce6cf", ink: "#66825b", rotate: -10, radius: "50%", size: "h-16 w-16 sm:h-28 sm:w-28", position: "bottom-16 left-1 sm:bottom-16 sm:left-20" },
          { Icon: Heart, color: "#f2d7db", ink: "#b57583", rotate: 7, radius: "12px", size: "h-11 w-11 sm:h-16 sm:w-16", position: "bottom-3 right-3 sm:bottom-8 sm:right-1/3" },
          { Icon: BookOpen, color: "#e1dcef", ink: "#827299", rotate: -8, radius: "8px", size: "h-10 w-12 sm:h-16 sm:w-20", position: "left-1/3 top-6 sm:left-48 sm:top-8" },
          { Icon: Star, color: "#f5e3ab", ink: "#b18a39", rotate: 16, radius: "50%", size: "h-7 w-7 sm:h-10 sm:w-10", position: "left-20 top-32 sm:left-16 sm:top-1/2" },
          { Icon: Moon, color: "#d5e5eb", ink: "#698c99", rotate: -14, radius: "50%", size: "h-8 w-8 sm:h-12 sm:w-12", position: "bottom-28 right-2 sm:bottom-56 sm:right-8" },
          { Icon: Ticket, color: "#efe0be", ink: "#9c8154", rotate: -6, radius: "4px", size: "h-8 w-20 sm:h-12 sm:w-28", position: "bottom-3 left-6 sm:bottom-4 sm:left-1/3" },
          { Icon: PawPrint, color: "#e1e5ce", ink: "#708259", rotate: 20, radius: "10px", size: "h-7 w-7 sm:h-10 sm:w-10", position: "right-24 top-28 sm:right-64 sm:top-8" },
        ].map(({ Icon, color, ink, rotate, radius, size, position }, index) => (
          <motion.div key={index} aria-hidden="true"
            initial={reducedMotion ? false : { opacity: 0, y: -65, scale: 1.3, rotate: rotate * 2 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate }}
            transition={{ delay: reducedMotion ? 0 : 0.78 + index * 0.055, duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={`pointer-events-none absolute flex items-center justify-center border-[3px] border-[#fffdf5] ${size} ${position}`}
            style={{ background: color, color: ink, borderRadius: radius, boxShadow: "2px 4px 0 #d9cebb, 0 5px 12px rgba(78,62,36,0.08)" }}
          >
            <Icon style={{ width: "52%", height: "52%" }} strokeWidth={1.7} />
          </motion.div>
        ))}
        <motion.div aria-hidden="true" initial={reducedMotion ? false : { opacity: 0, scale: 1.4, rotate: -25, y: -80 }} animate={{ opacity: 1, scale: 1, rotate: -12, y: 0 }} transition={{ delay: reducedMotion ? 0 : 0.72, duration: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }} className="pointer-events-none absolute left-0 top-10 sm:left-8 sm:top-24">
          <div className="flex h-12 w-12 items-center justify-center rounded-[50%] border-2 border-[#d8983c] bg-[#edbe67] text-xl font-bold text-[#855b25] shadow-[3px_4px_0_#d8a348] sm:h-16 sm:w-16 sm:text-2xl">฿</div>
        </motion.div>
        <motion.div aria-hidden="true" initial={reducedMotion ? false : { opacity: 0, scale: 1.2, rotate: 24, y: -90 }} animate={{ opacity: 1, scale: 1, rotate: 12, y: 0 }} transition={{ delay: reducedMotion ? 0 : 0.85, duration: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }} className="pointer-events-none absolute bottom-14 right-2 hidden w-36 bg-[#fffdf5] p-4 text-[8px] text-[#93846b] shadow-[3px_7px_20px_rgba(78,62,36,0.1)] sm:block sm:right-8">
          <p className="border-b border-dashed border-[#d9cebb] pb-2 text-center font-bold text-[#292722]">{th ? "ความสุขเล็ก ๆ" : "LITTLE JOYS"}</p>
          <div className="mt-3 flex justify-between"><span>{th ? "กาแฟ" : "Coffee"}</span><span>85.00</span></div>
          <div className="mt-2 flex justify-between"><span>{th ? "หนังสือดี ๆ" : "A good book"}</span><span>240.00</span></div>
          <p className="mt-3 border-t border-dashed border-[#d9cebb] pt-2 text-center">{th ? "ตัวอย่าง · ไม่ใช่ข้อมูลจริง" : "SAMPLE · NOT REAL DATA"}</p>
        </motion.div>

        <motion.div initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.35 }} className="relative z-10 text-center">
          <p className="mb-5 text-[9px] uppercase tracking-[0.3em] text-[#93846b]">{th ? "เรื่องราวการใช้เงินในแต่ละวัน" : "Your everyday money stories"}</p>
          <h1 className="font-sans text-[clamp(3rem,10vw,6.5rem)] font-black italic leading-none tracking-tighter">NoriNote<span className="text-[#d58a2b]">.</span></h1>
          <svg aria-hidden="true" viewBox="0 0 300 14" className="mx-auto mt-2 h-3 w-3/4 max-w-[300px] overflow-visible" fill="none">
            <motion.path d="M4 9Q130 0 296 6" stroke="#e9a342" strokeWidth="4" strokeLinecap="round"
              initial={reducedMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.25, duration: reducedMotion ? 0 : 0.4, ease: "easeOut" }} />
          </svg>
          <p className="mt-6 text-sm text-[#7f715d] sm:text-base">{th ? "เก็บเรื่องราวของทุกบาท" : "A little note for every little expense."}</p>
        </motion.div>

        <motion.div initial={false} animate={{ y: reducedMotion ? 0 : [0, -3, 0] }} transition={{ duration: reducedMotion ? 0 : 0.25, delay: reducedMotion ? 0 : 1.1 }} className="relative z-10 mt-10 w-full max-w-[260px] text-center sm:mt-12">
          <motion.div aria-hidden="true" initial={reducedMotion ? false : { opacity: 0, y: 12, rotate: 8 }} animate={{ opacity: 1, y: 0, rotate: -5 }} transition={{ delay: reducedMotion ? 0 : 1, duration: reducedMotion ? 0 : 0.3, ease: "easeOut" }} className="pointer-events-none absolute -top-16 right-0 h-16 w-16">
            <Image src="/animations/nori/cat-idle.webp" alt="" width={64} height={64} unoptimized />
          </motion.div>
          <motion.button
            onClick={enter}
            disabled={isTransitioning}
            whileHover={reducedMotion ? undefined : { y: -3 }}
            whileTap={reducedMotion ? undefined : { y: 3 }}
            className="flex w-full items-center justify-center gap-3 whitespace-nowrap border border-[#b97423] bg-[#e9a342] px-6 py-4 text-sm font-bold text-[#372b1c] shadow-[0_5px_0_#ba7b2c] transition-colors hover:bg-[#f0b35a] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#b97423] disabled:pointer-events-none"
          >
            <span aria-hidden="true" className="text-xs">▶</span>
            {th ? "เริ่มจด" : "Start your ledger"}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </motion.button>
          <motion.p animate={reducedMotion ? { opacity: 0.65 } : { opacity: [0.45, 0.9, 0.45] }} transition={{ duration: 2.8, repeat: reducedMotion ? 0 : Infinity }} className="mt-7 text-[10px] uppercase tracking-[0.25em] text-[#7f715d]">{th ? "กด Enter เพื่อเริ่ม" : "Press Enter to start"}</motion.p>
        </motion.div>
      </section>

      <footer className="relative z-10 flex w-full max-w-5xl items-center justify-between border-t border-dashed border-[#cbbda5] pt-4 text-[8px] uppercase tracking-[0.15em] text-[#93846b] sm:text-[9px]">
        <span>{th ? "จดนิดหน่อย ใช้ชีวิตชัดขึ้น" : "Small notes. Clearer days."}</span>
        <span aria-hidden="true" className="hidden sm:inline">{th ? "เพื่อทุกวันของคุณ" : "Made for your everyday"}</span>
      </footer>
    </main>
  );
}
