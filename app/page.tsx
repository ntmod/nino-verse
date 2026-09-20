"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Key } from "lucide-react";

function playConfirmSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(350, context.currentTime);
    oscillator.frequency.setValueAtTime(600, context.currentTime + 0.07);
    oscillator.frequency.setValueAtTime(1100, context.currentTime + 0.14);
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.28);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.28);
  } catch {
    // Audio is optional and may be blocked by the browser.
  }
}

export default function Home() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const enter = useCallback(() => {
    if (isTransitioning) return;
    playConfirmSound();
    setIsTransitioning(true);
    window.setTimeout(() => router.push("/dashboard"), 900);
  }, [isTransitioning, router]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        enter();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enter]);

  return (
    <main className="relative w-full h-screen bg-[#f5f5f7] overflow-hidden flex flex-col justify-between items-center py-12 px-6 select-none text-[#1A1A1A] font-sans">
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
            className="fixed inset-0 bg-[#1A1A1A] z-[100] flex items-center justify-center text-white"
          >
            <div className="font-mono text-center space-y-4 px-6 uppercase tracking-[4px]">
              <h2 className="text-xl font-bold border-b-2 border-slate-700 pb-2">Opening NoriNote</h2>
              <p className="text-xs text-[#cccccc] animate-pulse">Loading your expense tracker...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative z-10 w-full max-w-xl flex items-center justify-between text-[11px] font-mono border-b border-slate-200 pb-3 uppercase tracking-wider">
        <div className="flex items-center gap-1.5 text-slate-500">
          <span className="w-2.5 h-2.5 bg-[#1A1A1A] rounded-sm" />
          <span className="font-bold">System Online</span>
        </div>
        <span className="font-bold text-[#1A1A1A]">NoriNote</span>
      </header>

      <div className="relative z-10 flex-1 flex flex-col justify-center items-center gap-10 w-full max-w-xl">
        <div className="text-center space-y-1">
          <motion.h1
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="font-heading text-[60px] font-normal leading-none uppercase tracking-tighter text-[#1A1A1A]"
          >
            NoriNote
          </motion.h1>
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-400 mt-2">Personal Expense Tracker</p>
        </div>

        <div className="w-full max-w-xs flex flex-col gap-6">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 22, delay: 0.3 }}
            onClick={enter}
            disabled={isTransitioning}
            className="w-full flex items-center gap-4 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 p-6 rounded-2xl text-left active:scale-95 transition-all cursor-pointer disabled:pointer-events-none"
          >
            <span className="text-lg font-black" aria-hidden="true">▶</span>
            <span className="text-[15px] uppercase font-heading tracking-wider underline decoration-2">Enter NoriNote</span>
          </motion.button>
          <p className="h-12 text-center px-4 text-[13px] font-mono leading-relaxed text-slate-600">
            Log transactions, track cycle budgets, and understand your spending.
          </p>
        </div>
      </div>

      <footer className="relative z-10 flex flex-col items-center gap-3 mb-4 text-[11px] font-mono">
        <button onClick={enter} disabled={isTransitioning} className="flex items-center gap-2 bg-white shadow-sm border border-slate-200 px-4 py-2 rounded-xl text-slate-700 cursor-pointer disabled:pointer-events-none">
          <Key className="w-4 h-4 text-slate-400" />
          <span>PRESS <b className="font-bold text-slate-900">ENTER</b> OR <b className="font-bold text-slate-900 underline">CLICK HERE</b> TO ENTER</span>
        </button>
      </footer>
    </main>
  );
}
