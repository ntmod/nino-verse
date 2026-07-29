"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Key } from "lucide-react";

interface MenuItem {
  id: string;
  title: string;
  path: string;
  description: string;
  disabled?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "nori",
    title: "Nori's Note",
    path: "/v2/nori",
    description: "Log transactions and track monthly budgets in a clean interface."
  },
  {
    id: "ninjin",
    title: "Ninjin's Quest",
    path: "/v2/ninjin",
    description: "Turn your routines and habits into an RPG patrol adventure.",
    disabled: true
  },
  {
    id: "rinji",
    title: "Rinji's Brain",
    path: "/v2/rinji",
    description: "Dump ideas, outline notes, and map concepts visually.",
    disabled: true
  }
];

// Motion Stagger Variants
const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 250, 
      damping: 22 
    } 
  }
};

// Web Audio API Synthesized Sound Effects
function playSelectSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.06);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {
    console.error("Audio error", e);
  }
}

function playConfirmSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.setValueAtTime(600, ctx.currentTime + 0.07);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.14);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch (e) {
    console.error("Audio error", e);
  }
}

export default function Home() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0); // Default to Nori's Note
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Force light mode on landing page by removing "dark" class from document element
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains("dark");
    html.classList.remove("dark");

    return () => {
      if (hadDark) {
        html.classList.add("dark");
      }
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isTransitioning) return; // Block input during transition

    if (e.key === "ArrowDown" || e.key === "s") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % MENU_ITEMS.length);
      playSelectSound();
    } else if (e.key === "ArrowUp" || e.key === "w") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
      playSelectSound();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect(MENU_ITEMS[selectedIndex]);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, isTransitioning]);

  const handleSelect = (item: MenuItem) => {
    if (item.disabled) {
      return;
    }
    
    // Play confirms
    playConfirmSound();
    
    // Trigger transition wipe
    setIsTransitioning(true);

    setTimeout(() => {
      router.push(item.path);
    }, 900);
  };

  const activeItem = MENU_ITEMS[selectedIndex];

  return (
    <main className="relative w-full h-screen bg-[#f5f5f7] overflow-hidden flex flex-col justify-between items-center py-12 px-6 select-none text-[#1A1A1A] font-sans">
      
      {/* Soft Shutter Transition Wipe */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            initial={{ y: "-100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
            className="fixed inset-0 bg-[#1A1A1A] z-[100] flex flex-col items-center justify-center text-[#ffffff]"
          >
            <div className="font-mono text-center space-y-4 px-6 uppercase tracking-[4px]">
              <h2 className="text-xl font-bold border-b-2 border-slate-700 pb-2">
                INITIALIZING SYSTEM
              </h2>
              <p className="text-xs text-[#cccccc] animate-pulse">
                STAGE 01: NORI'S NOTE...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info - Soft divider border */}
      <header className="relative z-10 w-full max-w-xl flex items-center justify-between text-[11px] font-mono border-b border-slate-200 pb-3 uppercase tracking-wider">
        <div className="flex items-center gap-1.5 text-slate-500">
          <span className="w-2.5 h-2.5 bg-[#1A1A1A] rounded-sm" />
          <span className="font-bold">SYSTEM ONLINE</span>
        </div>
        <span className="font-bold text-[#1A1A1A]">NINO SYSTEM V2.0</span>
      </header>

      {/* Title & Game Screen Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center gap-10 w-full max-w-xl">
        
        {/* Softened title */}
        <div className="text-center space-y-1">
          <motion.h1 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="font-heading text-[60px] font-normal leading-none uppercase tracking-tighter text-[#1A1A1A]"
          >
            NINOVERSE
          </motion.h1>
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-400 pl-0.5 mt-2">
            STAGE SELECT
          </p>
        </div>

        {/* Stage select wrapper: white rounded shadow card */}
        <div className="w-full max-w-xs flex flex-col gap-6">
          <motion.div 
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 p-6 rounded-2xl text-left"
          >
            {MENU_ITEMS.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <motion.button
                  key={item.id}
                  variants={listItemVariants}
                  onClick={() => {
                    if (!isTransitioning) {
                      setSelectedIndex(idx);
                      handleSelect(item);
                    }
                  }}
                  onMouseEnter={() => {
                    if (!isTransitioning && selectedIndex !== idx) {
                      setSelectedIndex(idx);
                      playSelectSound();
                    }
                  }}
                  className="w-full flex items-center py-1.5 cursor-pointer outline-none relative active:scale-95 transition-all group"
                >
                  {/* Selected Indicator Cursor */}
                  <span className="w-6 shrink-0 flex items-center justify-start">
                    {isSelected && (
                      <motion.span 
                        layoutId="selector-cursor"
                        className="text-lg text-[#1A1A1A] font-black"
                        transition={{ type: "spring", stiffness: 450, damping: 28 }}
                      >
                        ▶
                      </motion.span>
                    )}
                  </span>
                  
                  {/* Menu Option Title */}
                  <span className={`text-[15px] uppercase font-heading tracking-wider transition-colors duration-250 ${
                    item.disabled
                      ? isSelected 
                        ? "text-slate-400 underline"
                        : "text-slate-200"
                      : isSelected 
                        ? "text-[#1A1A1A] underline decoration-2" 
                        : "text-[#777777] group-hover:text-[#1A1A1A]"
                  }`}>
                    {item.title}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Active Description Box */}
          <div className="h-12 text-center px-4 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p 
                key={activeItem.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className={`text-[13px] font-mono leading-relaxed ${activeItem.disabled ? "text-[#FF3B30]" : "text-slate-600"}`}
              >
                {activeItem.disabled ? "ERROR: STAGE CURRENTLY UNAVAILABLE." : activeItem.description}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Footer Instructions - rounded-xl shadow-sm style */}
      <footer className="relative z-10 flex flex-col items-center gap-3 mb-4 text-[11px] font-mono">
        <div className="flex items-center gap-2 bg-white shadow-sm border border-slate-200 px-4 py-2 rounded-xl text-slate-700">
          <Key className="w-4 h-4 text-slate-400" />
          <span>USE <b className="font-bold text-slate-900">W/S</b> OR <b className="font-bold text-slate-900">↑/↓</b> TO NAVIGATE</span>
        </div>
        <p className="tracking-widest uppercase text-[10px] font-bold mt-1 text-slate-400">
          PRESS <span className="text-[#1A1A1A] font-black underline animate-pulse">ENTER</span> TO LOAD STAGE
        </p>
      </footer>
    </main>
  );
}
