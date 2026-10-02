"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

import SoundToggle from "@/components/SoundToggle";
import { playUISound } from "@/lib/ui-sounds.mjs";

export default function Home() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
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
      <div aria-hidden="true" className="pointer-events-none absolute inset-3 border border-[#d9cebb] sm:inset-5" />

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
        <div aria-hidden="true" className="pointer-events-none absolute left-0 top-10 -rotate-12 sm:left-8 sm:top-24">
          <div className="flex h-12 w-12 items-center justify-center rounded-[50%] border-2 border-[#d8983c] bg-[#edbe67] text-xl font-bold text-[#855b25] shadow-[3px_4px_0_#d8a348] sm:h-16 sm:w-16 sm:text-2xl">฿</div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute bottom-14 right-2 hidden w-36 rotate-12 bg-[#fffdf5] p-4 text-[8px] text-[#93846b] shadow-[3px_7px_20px_rgba(78,62,36,0.1)] sm:block sm:right-8">
          <p className="border-b border-dashed border-[#d9cebb] pb-2 text-center font-bold text-[#292722]">{th ? "ความสุขเล็ก ๆ" : "LITTLE JOYS"}</p>
          <div className="mt-3 flex justify-between"><span>{th ? "กาแฟ" : "Coffee"}</span><span>85.00</span></div>
          <div className="mt-2 flex justify-between"><span>{th ? "หนังสือดี ๆ" : "A good book"}</span><span>240.00</span></div>
          <p className="mt-3 border-t border-dashed border-[#d9cebb] pt-2 text-center">{th ? "ตัวอย่าง · ไม่ใช่ข้อมูลจริง" : "SAMPLE · NOT REAL DATA"}</p>
        </div>

        <motion.div initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 text-center">
          <p className="mb-5 text-[9px] uppercase tracking-[0.3em] text-[#93846b]">{th ? "เรื่องราวการใช้เงินในแต่ละวัน" : "Your everyday money stories"}</p>
          <h1 className="font-sans text-[clamp(3rem,10vw,6.5rem)] font-black italic leading-none tracking-tighter">NoriNote<span className="text-[#d58a2b]">.</span></h1>
          <p className="mt-6 text-sm text-[#7f715d] sm:text-base">{th ? "เก็บเรื่องราวของทุกบาท" : "A little note for every little expense."}</p>
        </motion.div>

        <motion.div initial={reducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: reducedMotion ? 0 : 0.2 }} className="relative z-10 mt-10 w-full max-w-[260px] text-center sm:mt-12">
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
